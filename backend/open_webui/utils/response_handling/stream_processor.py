"""Main streaming response processor.

Replaces the nested response_handler/stream_body_handler structure
with a flat, testable class that coordinates all components.
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator, Callable
from dataclasses import dataclass, field
from typing import Any

from .content_blocks import ContentBlockManager, ToolCallsBlock
from .reasoning_handler import ReasoningConfig, ReasoningHandler
from .serialization import serialize_content_blocks

log = logging.getLogger(__name__)


@dataclass
class StreamConfig:
    """Configuration for stream processing."""

    delta_chunk_size: int = 1
    enable_realtime_save: bool = False
    reasoning_config: ReasoningConfig = field(default_factory=ReasoningConfig)


@dataclass
class StreamContext:
    """Context passed through streaming operations."""

    chat_id: str
    message_id: str
    model_id: str
    metadata: dict[str, Any]
    user: Any
    request: Any
    tools: dict[str, Any] = field(default_factory=dict)


class StreamProcessor:
    """Main orchestrator for processing streaming LLM responses.

    Replaces the deeply nested response_handler/stream_body_handler
    structure with a cleaner, more testable design.
    """

    def __init__(
        self,
        config: StreamConfig,
        context: StreamContext,
        event_emitter: Callable[..., Any],
        chat_storage: Any,
    ) -> None:
        self.config = config
        self.context = context
        self.emit = event_emitter
        self.storage = chat_storage

        self.blocks = ContentBlockManager()
        self.reasoning = ReasoningHandler(config.reasoning_config, self.blocks)

        self._delta_count = 0
        self._last_delta_data: dict[str, Any] | None = None
        self._current_tool_calls: list[dict[str, Any]] = []
        self._accumulated_tool_calls: list[list[dict[str, Any]]] = []

    async def process_stream(self, response_iterator: AsyncIterator[bytes | str]) -> None:
        """Process the streaming response."""
        async for line in response_iterator:
            await self._process_line(line)

        await self._flush_deltas()

        self.reasoning.finalize()

        if self._current_tool_calls:
            self._accumulated_tool_calls.append(self._current_tool_calls)
            self._current_tool_calls = []

    async def _process_line(self, line: bytes | str) -> None:
        """Process a single SSE line."""
        text = line.decode("utf-8", "replace") if isinstance(line, bytes) else line

        if not text.strip():
            return

        if not text.startswith("data:"):
            return

        data_str = text[len("data:") :].strip()

        if data_str == "[DONE]":
            return

        try:
            data = json.loads(data_str)
        except json.JSONDecodeError:
            return

        await self._process_chunk(data)

    async def _process_chunk(self, data: dict[str, Any]) -> None:
        """Process a parsed SSE chunk."""
        if not data:
            return

        if "event" in data:
            await self.emit(data.get("event", {}))

        if "selected_model_id" in data:
            await self._handle_model_selection(data)
            return

        usage = data.get("usage", {}) or {}
        usage.update(data.get("timings", {}))
        if usage:
            await self.emit({"type": "chat:completion", "data": {"usage": usage}})

        choices = data.get("choices", [])
        if not choices:
            if "error" in data:
                await self.emit({"type": "chat:completion", "data": {"error": data["error"]}})
            return

        delta = choices[0].get("delta", {})
        await self._process_delta(delta)

    async def _process_delta(self, delta: dict[str, Any]) -> None:
        """Process a delta from the response."""
        if delta_tool_calls := delta.get("tool_calls"):
            self._accumulate_tool_calls(delta_tool_calls)

        reasoning_content = delta.get("reasoning_content") or delta.get("reasoning") or delta.get("thinking")
        if reasoning_content:
            self.reasoning.handle_api_reasoning(reasoning_content)

        if text_content := delta.get("content"):
            self.reasoning.handle_text_content(text_content)

        if delta:
            await self._queue_delta_emit()

    def _accumulate_tool_calls(self, delta_tool_calls: list[dict[str, Any]]) -> None:
        """Accumulate streaming tool call deltas."""
        for delta_tc in delta_tool_calls:
            index = delta_tc.get("index")
            if index is None:
                continue

            existing = next(
                (tc for tc in self._current_tool_calls if tc.get("index") == index),
                None,
            )

            if existing is None:
                delta_tc.setdefault("function", {})
                delta_tc["function"].setdefault("name", "")
                delta_tc["function"].setdefault("arguments", "")
                self._current_tool_calls.append(delta_tc)
            else:
                if name := delta_tc.get("function", {}).get("name"):
                    existing["function"]["name"] += name
                if args := delta_tc.get("function", {}).get("arguments"):
                    existing["function"]["arguments"] += args

    async def _queue_delta_emit(self) -> None:
        """Queue a delta for emission with chunking."""
        self._delta_count += 1
        self._last_delta_data = {
            "content": serialize_content_blocks(self.blocks.to_list()),
            "content_blocks": self.blocks.to_list(),
        }

        if self._delta_count >= self.config.delta_chunk_size:
            await self._flush_deltas()

    async def _flush_deltas(self) -> None:
        """Flush pending delta emissions."""
        if self._last_delta_data:
            await self.emit({"type": "chat:completion", "data": self._last_delta_data})
            self._delta_count = 0
            self._last_delta_data = None

    async def _handle_model_selection(self, data: dict[str, Any]) -> None:
        """Handle model selection in response."""
        model_id = data["selected_model_id"]
        self.context.model_id = model_id

        if self.storage and not self.context.chat_id.startswith("local:"):
            self.storage.upsert_message_to_chat_by_id_and_message_id(
                self.context.chat_id,
                self.context.message_id,
                {"selectedModelId": model_id},
            )

        await self.emit({"type": "chat:completion", "data": data})

    def get_pending_tool_calls(self) -> list[list[dict[str, Any]]]:
        """Get accumulated tool calls for processing."""
        if self._current_tool_calls:
            self._accumulated_tool_calls.append(self._current_tool_calls)
            self._current_tool_calls = []
        return self._accumulated_tool_calls

    def add_tool_calls_block(self, tool_calls: list[dict[str, Any]]) -> ToolCallsBlock:
        """Add a tool calls block to content blocks."""
        return self.blocks.start_tool_calls(tool_calls)

    def set_tool_results(self, results: list[dict[str, Any]]) -> None:
        """Set results on the current tool calls block."""
        current = self.blocks.current_block
        if isinstance(current, ToolCallsBlock):
            current.results = results
        self.blocks.ensure_text_block()

    def get_content(self) -> str:
        """Get serialized content."""
        return serialize_content_blocks(self.blocks.to_list())

    def get_content_blocks(self) -> list[dict[str, Any]]:
        """Get content blocks as dicts."""
        return self.blocks.to_list()

    async def emit_current_state(self) -> None:
        """Emit the current content state to the client."""
        await self.emit(
            {
                "type": "chat:completion",
                "data": {
                    "content": self.get_content(),
                    "content_blocks": self.get_content_blocks(),
                },
            }
        )

    async def save_message(self) -> None:
        """Save the current message state to the database."""
        if self.storage and not self.context.chat_id.startswith("local:"):
            self.storage.upsert_message_to_chat_by_id_and_message_id(
                self.context.chat_id,
                self.context.message_id,
                {
                    "content": self.get_content(),
                    "content_blocks": self.get_content_blocks(),
                },
            )
