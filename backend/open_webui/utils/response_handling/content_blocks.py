"""Content block types and management for LLM responses.

Content blocks represent structured parts of an LLM response:
- Text blocks for regular content
- Reasoning blocks for thinking/reasoning content
- Tool call blocks for function calls and results
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any


class BlockType(Enum):
    TEXT = auto()
    REASONING = auto()
    TOOL_CALLS = auto()
    SOLUTION = auto()


@dataclass
class ContentBlock:
    type: BlockType
    content: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {"type": self.type.name.lower(), "content": self.content}


@dataclass
class ReasoningBlock:
    start_tag: str = ""
    end_tag: str = ""
    attributes: dict[str, Any] = field(default_factory=dict)
    content: str = ""
    started_at: float = field(default_factory=time.time)
    ended_at: float | None = None
    duration: int | None = None
    source: str = "tag"

    @property
    def type(self) -> BlockType:
        return BlockType.REASONING

    def finalize(self) -> None:
        self.ended_at = time.time()
        self.duration = int(self.ended_at - self.started_at)

    def to_dict(self) -> dict[str, Any]:
        return {
            "type": "reasoning",
            "start_tag": self.start_tag,
            "end_tag": self.end_tag,
            "attributes": self.attributes,
            "content": self.content,
            "started_at": self.started_at,
            "ended_at": self.ended_at,
            "duration": self.duration,
            "source": self.source,
        }


@dataclass
class ToolCallsBlock:
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    results: list[dict[str, Any]] = field(default_factory=list)

    @property
    def type(self) -> BlockType:
        return BlockType.TOOL_CALLS

    @property
    def content(self) -> list[dict[str, Any]]:
        return self.tool_calls

    def to_dict(self) -> dict[str, Any]:
        return {
            "type": "tool_calls",
            "content": self.tool_calls,
            "results": self.results,
        }


AnyBlock = ContentBlock | ReasoningBlock | ToolCallsBlock


class ContentBlockManager:
    """Manages the list of content blocks with proper state transitions.

    Provides controlled access to content blocks, ensuring valid state
    transitions (e.g., can't start reasoning while already in reasoning).
    """

    def __init__(self, initial_content: str = "") -> None:
        self._blocks: list[AnyBlock] = []
        if initial_content:
            self._blocks.append(ContentBlock(BlockType.TEXT, initial_content))

    @property
    def current_block(self) -> AnyBlock | None:
        return self._blocks[-1] if self._blocks else None

    @property
    def blocks(self) -> list[AnyBlock]:
        return self._blocks

    def ensure_text_block(self) -> ContentBlock:
        """Ensure the current block is a text block, creating one if needed."""
        if not self._blocks or self.current_block.type != BlockType.TEXT:
            block = ContentBlock(BlockType.TEXT, "")
            self._blocks.append(block)
            return block
        return self.current_block  # type: ignore

    def append_text(self, text: str) -> None:
        """Append text to the current text block, or create a new one."""
        if not self._blocks or self.current_block.type != BlockType.TEXT:
            self._blocks.append(ContentBlock(BlockType.TEXT, text))
        else:
            self.current_block.content += text  # type: ignore

    def start_reasoning(
        self,
        start_tag: str,
        end_tag: str,
        attributes: dict[str, Any] | None = None,
        source: str = "tag",
    ) -> ReasoningBlock:
        """Start a new reasoning block."""
        block = ReasoningBlock(
            start_tag=start_tag,
            end_tag=end_tag,
            attributes=attributes or {},
            source=source,
        )
        self._blocks.append(block)
        return block

    def end_reasoning(self) -> None:
        """End the current reasoning block if one is active."""
        if self.current_block and self.current_block.type == BlockType.REASONING:
            block = self.current_block
            if isinstance(block, ReasoningBlock):
                block.finalize()

    def start_tool_calls(self, tool_calls: list[dict[str, Any]] | None = None) -> ToolCallsBlock:
        """Start a new tool calls block."""
        block = ToolCallsBlock(tool_calls=tool_calls or [])
        self._blocks.append(block)
        return block

    def is_in_reasoning(self) -> bool:
        """Check if currently inside an open reasoning block."""
        if not self.current_block:
            return False
        if self.current_block.type != BlockType.REASONING:
            return False
        if isinstance(self.current_block, ReasoningBlock):
            return self.current_block.ended_at is None
        return False

    def is_api_reasoning_active(self) -> bool:
        """Check if currently inside an API-sourced reasoning block."""
        if not self.is_in_reasoning():
            return False
        if isinstance(self.current_block, ReasoningBlock):
            return self.current_block.source == "api"
        return False

    def cleanup(self) -> None:
        """Clean up empty trailing text blocks and finalize unclosed reasoning."""
        if self._blocks and self.current_block.type == BlockType.TEXT:
            if isinstance(self.current_block, ContentBlock):
                if not self.current_block.content.strip():
                    self._blocks.pop()

        if self._blocks and self.current_block.type == BlockType.REASONING:
            if isinstance(self.current_block, ReasoningBlock):
                if self.current_block.ended_at is None:
                    self.current_block.finalize()

    def to_list(self) -> list[dict[str, Any]]:
        """Convert all blocks to a list of dictionaries."""
        return [block.to_dict() for block in self._blocks]
