"""
Title: Chat Compactor
Author: Open WebUI
Version: 1.0.1
Type: action
Description: Compacts all chat messages into a concise summary to reduce token usage
"""

from pydantic import BaseModel, Field
from typing import Optional, Callable, Awaitable, Any
import json
import time
import uuid
import logging
from open_webui.routers.openai import generate_chat_completion

log = logging.getLogger(__name__)

class Valves(BaseModel):
    """Global configuration for the Chat Compactor action"""

    system_prompt: str = Field(
        default="You are a conversation summarizer. Your task is to create a concise but comprehensive summary of the following conversation that preserves all important context, key points, and relevant details. The summary will replace the original messages in the chat history, so ensure it captures everything important.",
        description="System prompt used for generating the summary"
    )

    default_model: str = Field(
        default="",
        description="Default model for compaction (empty = use current chat model)"
    )

    priority: int = Field(
        default=0,
        description="Priority level for the action"
    )


class Action:
    def __init__(self):
        self.valves = Valves()

    async def action(
        self,
        body: dict,
        __user__: Optional[dict] = None,
        __event_emitter__: Optional[Callable[[dict], Awaitable[None]]] = None,
        __event_call__: Optional[Callable[[dict], Awaitable[dict]]] = None,
        __model__: Optional[dict] = None,
        __request__: Optional[Any] = None,
    ) -> dict:
        """
        Compact all chat messages into a summary.

        Args:
            body: Request data containing:
                - model: str - Model ID
                - messages: list - All chat messages up to this point
                - chat_id: str - Chat ID
                - id: str - Current message ID
                - session_id: str - Session ID
            __user__: User information
            __event_emitter__: Function to emit UI events/status updates
            __event_call__: Function to call backend events (for LLM completion)
            __model__: Model information

        Returns:
            dict: Contains updated messages array with compacted summary
        """

        log.info(f"Chat Compactor action called for chat_id: {body.get('chat_id')}")

        if not __request__:
            log.error("Request object not available")
            if __event_emitter__:
                await __event_emitter__({
                    "type": "notification",
                    "data": {
                        "type": "error",
                        "content": "Internal error: Request context not available"
                    }
                })
            return {"error": "Request object not available"}

        messages = body.get("messages", [])
        model_id = self.valves.default_model or body.get("model")
        chat_id = body.get("chat_id")

        log.info(f"Processing {len(messages)} messages with model: {model_id}")

        if not messages:
            log.error("No messages to compact")
            if __event_emitter__:
                await __event_emitter__({
                    "type": "notification",
                    "data": {
                        "type": "error",
                        "content": "No messages to compact"
                    }
                })
            return {"error": "No messages to compact"}

        messages_for_summary = [
            {"role": msg.get("role"), "content": msg.get("content")}
            for msg in messages
            if msg.get("role") and msg.get("content")
        ]

        compact_messages = [
            {"role": "system", "content": self.valves.system_prompt},
            {
                "role": "user",
                "content": f"Please summarize the following conversation:\n\n{json.dumps(messages_for_summary, indent=2)}"
            }
        ]

        from open_webui.models.users import UserModel

        user_obj = UserModel(**__user__) if __user__ else None
        if not user_obj:
            log.error("User object not available")
            if __event_emitter__:
                await __event_emitter__({
                    "type": "notification",
                    "data": {
                        "type": "error",
                        "content": "Internal error: User context not available"
                    }
                })
            return {"error": "User object not available"}

        log.info(f"Calling generate_chat_completion with model: {model_id}")

        try:
            form_data = {
                "model": model_id,
                "messages": compact_messages,
                "stream": False
            }

            result = await generate_chat_completion(
                request=__request__,
                form_data=form_data,
                user=user_obj,
                bypass_filter=True
            )

            log.info(f"Chat completion result type: {type(result)}")

            if not isinstance(result, dict):
                error_msg = f"Unexpected response type: {type(result)}"
                log.error(error_msg)
                if __event_emitter__:
                    await __event_emitter__({
                        "type": "notification",
                        "data": {
                            "type": "error",
                            "content": error_msg
                        }
                    })
                return {"error": error_msg}

            choices = result.get("choices", [])
            if not choices:
                log.error(f"No choices in response: {result}")
                if __event_emitter__:
                    await __event_emitter__({
                        "type": "notification",
                        "data": {
                            "type": "error",
                            "content": "LLM returned no response"
                        }
                    })
                return {"error": "LLM returned no response"}

            message = choices[0].get("message", {})
            summary = message.get("content", "")

            if not summary:
                log.error(f"Empty summary: {result}")
                if __event_emitter__:
                    await __event_emitter__({
                        "type": "notification",
                        "data": {
                            "type": "error",
                            "content": "LLM returned empty summary"
                        }
                    })
                return {"error": "LLM returned empty summary"}

            log.info(f"Successfully generated summary ({len(summary)} characters)")

        except Exception as e:
            log.exception(f"Error generating summary: {e}")
            if __event_emitter__:
                await __event_emitter__({
                    "type": "notification",
                    "data": {
                        "type": "error",
                        "content": f"Failed to generate summary: {str(e)}"
                    }
                })
            return {"error": f"Failed to generate summary: {str(e)}"}

        compacted_message_id = f"compacted-{int(time.time() * 1000)}"
        original_message_ids = [msg.get("id") for msg in messages if msg.get("id")]

        compacted_message = {
            "id": compacted_message_id,
            "role": "system",
            "content": f"**[Compacted Summary]**\n\n{summary}",
            "timestamp": int(time.time()),
            "done": True,
            "compacted": True,
            "originalMessageIds": original_message_ids
        }

        log.info(f"Created compacted message (id={compacted_message_id}, replaced {len(original_message_ids)} messages)")

        if __event_emitter__:
            await __event_emitter__({
                "type": "status",
                "data": {
                    "description": "Messages compacted successfully",
                    "done": True,
                    "action": "compact"
                }
            })
            await __event_emitter__({
                "type": "notification",
                "data": {
                    "type": "success",
                    "content": f"Compacted {len(original_message_ids)} messages successfully"
                }
            })

        result = {
            "messages": [compacted_message],
            "summary": summary,
            "compacted_message_ids": original_message_ids
        }

        log.info("Chat compaction completed successfully")
        return result
