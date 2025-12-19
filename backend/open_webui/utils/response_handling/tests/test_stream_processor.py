"""Tests for StreamProcessor behavior."""

from __future__ import annotations

import json

import pytest

from open_webui.utils.response_handling.stream_processor import (
    StreamConfig,
    StreamContext,
    StreamProcessor,
)


@pytest.mark.asyncio
async def test_stream_processor_handles_api_reasoning_then_text():
    """Ensure API reasoning is captured and finalized before text output."""
    events: list[dict[str, object]] = []

    async def emit(event: dict[str, object]) -> None:
        events.append(event)

    context = StreamContext(
        chat_id="local:test",
        message_id="msg-1",
        model_id="model-1",
        metadata={},
        user=None,
        request=None,
    )
    processor = StreamProcessor(StreamConfig(), context, emit, None)

    async def response_iterator():
        deltas = [
            {"reasoning_content": "Reasoning step."},
            {"content": "Final answer."},
        ]
        for delta in deltas:
            payload = {"choices": [{"delta": delta}]}
            yield f"data: {json.dumps(payload)}\n\n"

    await processor.process_stream(response_iterator())

    blocks = processor.get_content_blocks()
    reasoning_block = next(block for block in blocks if block["type"] == "reasoning")
    text_block = next(block for block in blocks if block["type"] == "text")

    assert reasoning_block["source"] == "api"
    assert reasoning_block["content"] == "Reasoning step."
    assert reasoning_block["ended_at"] is not None
    assert text_block["content"] == "Final answer."
