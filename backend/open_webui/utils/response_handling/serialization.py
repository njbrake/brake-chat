"""Content block serialization for display.

Converts content blocks to display strings, including HTML <details>
elements for reasoning and tool calls.
"""

from __future__ import annotations

import html
import json
from typing import Any


def serialize_content_blocks(content_blocks: list[dict[str, Any]], raw: bool = False) -> str:
    """Serialize content blocks to display string.

    Args:
        content_blocks: List of content block dictionaries
        raw: If True, output raw tags instead of HTML details

    Returns:
        Formatted string for display

    """
    content = ""

    for block in content_blocks:
        block_type = block.get("type", "text")

        if block_type == "text":
            block_content = block.get("content", "").strip()
            if block_content:
                content = f"{content}{block_content}\n"

        elif block_type == "tool_calls":
            tool_calls = block.get("content", [])
            results = block.get("results", [])

            if content and not content.endswith("\n"):
                content += "\n"

            if not raw:
                content += _serialize_tool_calls(tool_calls, results)

        elif block_type == "reasoning":
            reasoning_content = html.escape(
                "\n".join(
                    (f"> {line}" if not line.startswith(">") else line)
                    for line in block.get("content", "").splitlines()
                )
            )

            duration = block.get("duration")
            start_tag = block.get("start_tag", "")
            end_tag = block.get("end_tag", "")

            if content and not content.endswith("\n"):
                content += "\n"

            if duration is not None:
                if raw:
                    content = f"{content}{start_tag}{block['content']}{end_tag}\n"
                else:
                    content = (
                        f'{content}<details type="reasoning" done="true" '
                        f'duration="{duration}">\n'
                        f"<summary>Thought for {duration} seconds</summary>\n"
                        f"{reasoning_content}\n</details>\n"
                    )
            else:
                if raw:
                    content = f"{content}{start_tag}{block['content']}{end_tag}\n"
                else:
                    content = (
                        f'{content}<details type="reasoning" done="false">\n'
                        f"<summary>Thinking\u2026</summary>\n"
                        f"{reasoning_content}\n</details>\n"
                    )

        elif block_type == "solution":
            block_content = block.get("content", "").strip()
            if block_content:
                content = f"{content}{block_content}\n"

        else:
            block_content = str(block.get("content", "")).strip()
            if block_content:
                content = f"{content}{block_type}: {block_content}\n"

    return content.strip()


def _serialize_tool_calls(tool_calls: list[dict[str, Any]], results: list[dict[str, Any]]) -> str:
    """Serialize tool calls to HTML details elements."""
    output = ""

    for tool_call in tool_calls:
        tool_call_id = tool_call.get("id", "")
        tool_name = tool_call.get("function", {}).get("name", "")
        tool_arguments = tool_call.get("function", {}).get("arguments", "")

        tool_result = None
        tool_result_files = None
        tool_result_embeds = ""

        for result in results:
            if tool_call_id == result.get("tool_call_id", ""):
                tool_result = result.get("content")
                tool_result_files = result.get("files")
                tool_result_embeds = result.get("embeds", "")
                break

        if tool_result is not None:
            output += (
                f'<details type="tool_calls" done="true" '
                f'id="{tool_call_id}" name="{tool_name}" '
                f'arguments="{html.escape(json.dumps(tool_arguments))}" '
                f'result="{html.escape(json.dumps(tool_result, ensure_ascii=False))}" '
                f'files="{html.escape(json.dumps(tool_result_files)) if tool_result_files else ""}" '
                f'embeds="{html.escape(json.dumps(tool_result_embeds))}">\n'
                f"<summary>Tool Executed</summary>\n</details>\n"
            )
        else:
            output += (
                f'<details type="tool_calls" done="false" '
                f'id="{tool_call_id}" name="{tool_name}" '
                f'arguments="{html.escape(json.dumps(tool_arguments))}">\n'
                f"<summary>Executing...</summary>\n</details>\n"
            )

    return output


def convert_content_blocks_to_messages(content_blocks: list[dict[str, Any]], raw: bool = False) -> list[dict[str, Any]]:
    """Convert content blocks to OpenAI message format.

    This is used when making follow-up API calls after tool execution.

    Args:
        content_blocks: List of content block dictionaries
        raw: If True, include raw tags in text content

    Returns:
        List of messages in OpenAI format

    """
    messages: list[dict[str, Any]] = []
    temp_blocks: list[dict[str, Any]] = []

    for block in content_blocks:
        if block.get("type") == "tool_calls":
            if temp_blocks:
                content = serialize_content_blocks(temp_blocks, raw)
                if content:
                    messages.append(
                        {
                            "role": "assistant",
                            "content": content,
                            "tool_calls": block.get("content"),
                        }
                    )
                temp_blocks = []
            else:
                messages.append(
                    {
                        "role": "assistant",
                        "content": "",
                        "tool_calls": block.get("content"),
                    }
                )

            for result in block.get("results", []):
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": result["tool_call_id"],
                        "content": result.get("content", "") or "",
                    }
                )
        else:
            temp_blocks.append(block)

    if temp_blocks:
        content = serialize_content_blocks(temp_blocks, raw)
        if content:
            messages.append(
                {
                    "role": "assistant",
                    "content": content,
                }
            )

    return messages
