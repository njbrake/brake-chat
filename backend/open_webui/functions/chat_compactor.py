"""
Title: Chat Compactor
Author: Open WebUI
Version: 1.0.0
Type: action
Description: Compacts all chat messages into a concise summary to reduce token usage
"""

from pydantic import BaseModel, Field
from typing import Optional, Callable, Awaitable, Any
import json
import time


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

        # Extract data from request
        messages = body.get("messages", [])
        model_id = self.valves.default_model or body.get("model")
        chat_id = body.get("chat_id")

        if not messages:
            return {"error": "No messages to compact"}

        # Show toast notification at bottom of screen
        if __event_emitter__:
            await __event_emitter__({
                "type": "notification",
                "data": {
                    "type": "info",
                    "content": f"Compacting {len(messages)} messages..."
                }
            })

        # Emit status update to message (top of message content)
        if __event_emitter__:
            await __event_emitter__({
                "type": "status",
                "data": {
                    "description": f"Compacting {len(messages)} messages...",
                    "done": False,
                    "action": "compact"
                }
            })

        # Prepare messages for summarization
        messages_for_summary = [
            {"role": msg.get("role"), "content": msg.get("content")}
            for msg in messages
            if msg.get("role") and msg.get("content")
        ]

        # Build the prompt for summarization
        compact_messages = [
            {"role": "system", "content": self.valves.system_prompt},
            {
                "role": "user",
                "content": f"Please summarize the following conversation:\n\n{json.dumps(messages_for_summary, indent=2)}"
            }
        ]

        # Call LLM to generate summary
        summary = ""
        if __event_call__:
            try:
                result = await __event_call__({
                    "type": "request:chat:completion",
                    "data": {
                        "form_data": {
                            "model": model_id,
                            "messages": compact_messages,
                            "stream": False
                        },
                        "model": __model__,
                        "session_id": body.get("session_id"),
                        "channel": None
                    }
                })

                # Extract summary from response
                if isinstance(result, dict):
                    choices = result.get("choices", [])
                    if choices:
                        message = choices[0].get("message", {})
                        summary = message.get("content", "")

                if not summary:
                    if __event_emitter__:
                        await __event_emitter__({
                            "type": "notification",
                            "data": {
                                "type": "error",
                                "content": "Failed to generate summary"
                            }
                        })
                    return {"error": "Failed to generate summary"}

            except Exception as e:
                if __event_emitter__:
                    await __event_emitter__({
                        "type": "status",
                        "data": {
                            "description": f"Error: {str(e)}",
                            "done": True
                        }
                    })
                    await __event_emitter__({
                        "type": "notification",
                        "data": {
                            "type": "error",
                            "content": f"Failed to generate summary: {str(e)}"
                        }
                    })
                return {"error": f"Failed to generate summary: {str(e)}"}
        else:
            return {"error": "Event call not available"}

        # Create the compacted message
        compacted_message_id = f"compacted-{int(time.time() * 1000)}"
        compacted_message = {
            "id": compacted_message_id,
            "role": "system",
            "content": f"**[Compacted Summary]**\n\n{summary}",
            "timestamp": int(time.time()),
            "done": True,
            "compacted": True,
            "originalMessageIds": [msg.get("id") for msg in messages if msg.get("id")]
        }

        # Emit completion status
        if __event_emitter__:
            await __event_emitter__({
                "type": "status",
                "data": {
                    "description": "Messages compacted successfully",
                    "done": True,
                    "action": "compact"
                }
            })
            # Show success toast at bottom of screen
            await __event_emitter__({
                "type": "notification",
                "data": {
                    "type": "success",
                    "content": "Messages compacted successfully"
                }
            })

        # Return the compacted message to replace all previous messages
        return {
            "messages": [compacted_message],
            "summary": summary,
            "compacted_message_ids": [msg.get("id") for msg in messages if msg.get("id")]
        }
