import collections.abc
import hashlib
import json
import logging
import re
import threading
import time
import uuid
from datetime import timedelta
from pathlib import Path

from open_webui.env import SRC_LOG_LEVELS

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MAIN"])


def deep_update(d, u):
    for k, v in u.items():
        if isinstance(v, collections.abc.Mapping):
            d[k] = deep_update(d.get(k, {}), v)
        else:
            d[k] = v
    return d


def get_allow_block_lists(filter_list):
    allow_list = []
    block_list = []

    if filter_list:
        for d in filter_list:
            if d.startswith("!"):
                # Domains starting with "!" → blocked
                block_list.append(d[1:].strip())
            else:
                # Domains starting without "!" → allowed
                allow_list.append(d.strip())

    return allow_list, block_list


def is_string_allowed(string: str, filter_list: list[str] | None = None) -> bool:
    """Checks if a string is allowed based on the provided filter list.
    :param string: The string to check (e.g., domain or hostname).
    :param filter_list: List of allowed/blocked strings. Strings starting with "!" are blocked.
    :return: True if the string is allowed, False otherwise.
    """
    if not filter_list:
        return True

    allow_list, block_list = get_allow_block_lists(filter_list)
    print(string, allow_list, block_list)

    # If allow list is non-empty, require domain to match one of them
    if allow_list:
        if not any(string.endswith(allowed) for allowed in allow_list):
            return False

    # Block list always removes matches
    if any(string.endswith(blocked) for blocked in block_list):
        return False

    return True


def get_message_list(messages_map, message_id):
    """Reconstructs a list of messages in order up to the specified message_id.

    :param message_id: ID of the message to reconstruct the chain
    :param messages: Message history dict containing all messages
    :return: List of ordered messages starting from the root to the given message
    """
    # Handle case where messages is None
    if not messages_map:
        return []  # Return empty list instead of None to prevent iteration errors

    # Find the message by its id
    current_message = messages_map.get(message_id)

    if not current_message:
        return []  # Return empty list instead of None to prevent iteration errors

    # Reconstruct the chain by following the parentId links
    message_list = []

    while current_message:
        message_list.insert(0, current_message)  # Insert the message at the beginning of the list
        parent_id = current_message.get("parentId")  # Use .get() for safety
        current_message = messages_map.get(parent_id) if parent_id else None

    return message_list


def serialize_content_blocks_for_reconstruction(blocks, raw=False):
    if not blocks:
        return ""

    content = ""
    for block in blocks:
        if isinstance(block, dict):
            block_type = block.get("type", "text")
            block_content = str(block.get("content", "")).strip()

            if block_type == "text":
                content = f"{content}{block_content}\n"
            elif not raw:
                content = f"{content}{block_type}: {block_content}\n"

    return content.strip()


def reconstruct_messages_with_tool_calls(messages: list[dict]) -> list[dict]:
    reconstructed = []

    for message in messages:
        if message.get("role") != "assistant" or "content_blocks" not in message:
            reconstructed.append(message)
            continue

        content_blocks = message.get("content_blocks", [])

        if not isinstance(content_blocks, list) or len(content_blocks) == 0:
            reconstructed.append(message)
            continue

        has_tool_calls = False
        temp_blocks = []

        for block in content_blocks:
            if not isinstance(block, dict):
                continue

            block_type = block.get("type")

            if block_type == "tool_calls":
                tool_calls = block.get("content", [])
                results = block.get("results", [])

                assistant_msg = {
                    "role": "assistant",
                    "content": (serialize_content_blocks_for_reconstruction(temp_blocks) if temp_blocks else ""),
                    "tool_calls": tool_calls,
                }
                reconstructed.append(assistant_msg)
                has_tool_calls = True

                for result in results:
                    if isinstance(result, dict) and "tool_call_id" in result:
                        tool_msg = {
                            "role": "tool",
                            "tool_call_id": result["tool_call_id"],
                            "content": result.get("content", "") or "",
                        }
                        reconstructed.append(tool_msg)

                temp_blocks = []
            else:
                temp_blocks.append(block)

        if not has_tool_calls:
            reconstructed.append(message)
        elif temp_blocks:
            content = serialize_content_blocks_for_reconstruction(temp_blocks)
            if content:
                reconstructed.append(
                    {
                        "role": "assistant",
                        "content": content,
                    }
                )

    return reconstructed


def get_messages_content(messages: list[dict]) -> str:
    return "\n".join([f"{message['role'].upper()}: {get_content_from_message(message)}" for message in messages])


def get_last_user_message_item(messages: list[dict]) -> dict | None:
    for message in reversed(messages):
        if message["role"] == "user":
            return message
    return None


def get_content_from_message(message: dict) -> str | None:
    if isinstance(message.get("content"), list):
        for item in message["content"]:
            if item["type"] == "text":
                return item["text"]
    else:
        return message.get("content")
    return None


def get_last_user_message(messages: list[dict]) -> str | None:
    message = get_last_user_message_item(messages)
    if message is None:
        return None
    return get_content_from_message(message)


def get_last_assistant_message_item(messages: list[dict]) -> dict | None:
    for message in reversed(messages):
        if message["role"] == "assistant":
            return message
    return None


def get_last_assistant_message(messages: list[dict]) -> str | None:
    for message in reversed(messages):
        if message["role"] == "assistant":
            return get_content_from_message(message)
    return None


def get_system_message(messages: list[dict]) -> dict | None:
    for message in messages:
        if message["role"] == "system":
            return message
    return None


def remove_system_message(messages: list[dict]) -> list[dict]:
    return [message for message in messages if message["role"] != "system"]


def pop_system_message(messages: list[dict]) -> tuple[dict | None, list[dict]]:
    return get_system_message(messages), remove_system_message(messages)


def update_message_content(message: dict, content: str, append: bool = True) -> dict:
    if isinstance(message["content"], list):
        for item in message["content"]:
            if item["type"] == "text":
                if append:
                    item["text"] = f"{item['text']}\n{content}"
                else:
                    item["text"] = f"{content}\n{item['text']}"
    else:
        if append:
            message["content"] = f"{message['content']}\n{content}"
        else:
            message["content"] = f"{content}\n{message['content']}"
    return message


def replace_system_message_content(content: str, messages: list[dict]) -> dict:
    for message in messages:
        if message["role"] == "system":
            message["content"] = content
            break
    return messages


def add_or_update_system_message(content: str, messages: list[dict], append: bool = False):
    """Adds a new system message at the beginning of the messages list
    or updates the existing system message at the beginning.

    :param msg: The message to be added or appended.
    :param messages: The list of message dictionaries.
    :return: The updated list of message dictionaries.
    """
    if messages and messages[0].get("role") == "system":
        messages[0] = update_message_content(messages[0], content, append)
    else:
        # Insert at the beginning
        messages.insert(0, {"role": "system", "content": content})

    return messages


def add_or_update_user_message(content: str, messages: list[dict], append: bool = True):
    """Adds a new user message at the end of the messages list
    or updates the existing user message at the end.

    :param msg: The message to be added or appended.
    :param messages: The list of message dictionaries.
    :return: The updated list of message dictionaries.
    """
    if messages and messages[-1].get("role") == "user":
        messages[-1] = update_message_content(messages[-1], content, append)
    else:
        # Insert at the end
        messages.append({"role": "user", "content": content})

    return messages


def prepend_to_first_user_message_content(content: str, messages: list[dict]) -> list[dict]:
    for message in messages:
        if message["role"] == "user":
            message = update_message_content(message, content, append=False)
            break
    return messages


def append_or_update_assistant_message(content: str, messages: list[dict]):
    """Adds a new assistant message at the end of the messages list
    or updates the existing assistant message at the end.

    :param msg: The message to be added or appended.
    :param messages: The list of message dictionaries.
    :return: The updated list of message dictionaries.
    """
    if messages and messages[-1].get("role") == "assistant":
        messages[-1]["content"] = f"{messages[-1]['content']}\n{content}"
    else:
        # Insert at the end
        messages.append({"role": "assistant", "content": content})

    return messages


def openai_chat_message_template(model: str):
    return {
        "id": f"{model}-{uuid.uuid4()!s}",
        "created": int(time.time()),
        "model": model,
        "choices": [{"index": 0, "logprobs": None, "finish_reason": None}],
    }


def openai_chat_chunk_message_template(
    model: str,
    content: str | None = None,
    reasoning_content: str | None = None,
    tool_calls: list[dict] | None = None,
    usage: dict | None = None,
) -> dict:
    template = openai_chat_message_template(model)
    template["object"] = "chat.completion.chunk"

    template["choices"][0]["index"] = 0
    template["choices"][0]["delta"] = {}

    if content:
        template["choices"][0]["delta"]["content"] = content

    if reasoning_content:
        template["choices"][0]["delta"]["reasoning_content"] = reasoning_content

    if tool_calls:
        template["choices"][0]["delta"]["tool_calls"] = tool_calls

    if not content and not reasoning_content and not tool_calls:
        template["choices"][0]["finish_reason"] = "stop"

    if usage:
        template["usage"] = usage
    return template


def openai_chat_completion_message_template(
    model: str,
    message: str | None = None,
    reasoning_content: str | None = None,
    tool_calls: list[dict] | None = None,
    usage: dict | None = None,
) -> dict:
    template = openai_chat_message_template(model)
    template["object"] = "chat.completion"
    if message is not None:
        template["choices"][0]["message"] = {
            "role": "assistant",
            "content": message,
            **({"reasoning_content": reasoning_content} if reasoning_content else {}),
            **({"tool_calls": tool_calls} if tool_calls else {}),
        }

    template["choices"][0]["finish_reason"] = "stop"

    if usage:
        template["usage"] = usage
    return template


def get_gravatar_url(email):
    # Trim leading and trailing whitespace from
    # an email address and force all characters
    # to lower case
    address = str(email).strip().lower()

    # Create a SHA256 hash of the final string
    hash_object = hashlib.sha256(address.encode())
    hash_hex = hash_object.hexdigest()

    # Grab the actual image URL
    return f"https://www.gravatar.com/avatar/{hash_hex}?d=mp"


def calculate_sha256(file_path, chunk_size):
    # Compute SHA-256 hash of a file efficiently in chunks
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(chunk_size):
            sha256.update(chunk)
    return sha256.hexdigest()


def calculate_sha256_string(string):
    # Create a new SHA-256 hash object
    sha256_hash = hashlib.sha256()
    # Update the hash object with the bytes of the input string
    sha256_hash.update(string.encode("utf-8"))
    # Get the hexadecimal representation of the hash
    hashed_string = sha256_hash.hexdigest()
    return hashed_string


def validate_email_format(email: str) -> bool:
    if email.endswith("@localhost"):
        return True

    return bool(re.match(r"[^@]+@[^@]+\.[^@]+", email))


def sanitize_filename(file_name):
    # Convert to lowercase
    lower_case_file_name = file_name.lower()

    # Remove special characters using regular expression
    sanitized_file_name = re.sub(r"[^\w\s]", "", lower_case_file_name)

    # Replace spaces with dashes
    final_file_name = re.sub(r"\s+", "-", sanitized_file_name)

    return final_file_name


def extract_folders_after_data_docs(path):
    # Convert the path to a Path object if it's not already
    path = Path(path)

    # Extract parts of the path
    parts = path.parts

    # Find the index of '/data/docs' in the path
    try:
        index_data_docs = parts.index("data") + 1
        index_docs = parts.index("docs", index_data_docs) + 1
    except ValueError:
        return []

    # Exclude the filename and accumulate folder names
    tags = []

    folders = parts[index_docs:-1]
    for idx, _ in enumerate(folders):
        tags.append("/".join(folders[: idx + 1]))

    return tags


def parse_duration(duration: str) -> timedelta | None:
    if duration == "-1" or duration == "0":
        return None

    # Regular expression to find number and unit pairs
    pattern = r"(-?\d+(\.\d+)?)(ms|s|m|h|d|w)"
    matches = re.findall(pattern, duration)

    if not matches:
        raise ValueError("Invalid duration string")

    total_duration = timedelta()

    for number, _, unit in matches:
        number = float(number)
        if unit == "ms":
            total_duration += timedelta(milliseconds=number)
        elif unit == "s":
            total_duration += timedelta(seconds=number)
        elif unit == "m":
            total_duration += timedelta(minutes=number)
        elif unit == "h":
            total_duration += timedelta(hours=number)
        elif unit == "d":
            total_duration += timedelta(days=number)
        elif unit == "w":
            total_duration += timedelta(weeks=number)

    return total_duration


def convert_logit_bias_input_to_json(user_input):
    logit_bias_pairs = user_input.split(",")
    logit_bias_json = {}
    for pair in logit_bias_pairs:
        token, bias = pair.split(":")
        token = str(token.strip())
        bias = int(bias.strip())
        bias = 100 if bias > 100 else max(bias, -100)
        logit_bias_json[token] = bias
    return json.dumps(logit_bias_json)


def freeze(value):
    """Freeze a value to make it hashable."""
    if isinstance(value, dict):
        return frozenset((k, freeze(v)) for k, v in value.items())
    if isinstance(value, list):
        return tuple(freeze(v) for v in value)
    return value


def throttle(interval: float = 10.0):
    """Decorator to prevent a function from being called more than once within a specified duration.
    If the function is called again within the duration, it returns None. To avoid returning
    different types, the return type of the function should be Optional[T].

    :param interval: Duration in seconds to wait before allowing the function to be called again.
    """

    def decorator(func):
        last_calls = {}
        lock = threading.Lock()

        def wrapper(*args, **kwargs):
            if interval is None:
                return func(*args, **kwargs)

            key = (args, freeze(kwargs))
            now = time.time()
            if now - last_calls.get(key, 0) < interval:
                return None
            with lock:
                if now - last_calls.get(key, 0) < interval:
                    return None
                last_calls[key] = now
            return func(*args, **kwargs)

        return wrapper

    return decorator


def extract_urls(text: str) -> list[str]:
    # Regex pattern to match URLs
    url_pattern = re.compile(r"(https?://[^\s]+)", re.IGNORECASE)  # Matches http and https URLs
    return url_pattern.findall(text)
