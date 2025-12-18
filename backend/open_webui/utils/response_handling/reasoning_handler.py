"""Unified reasoning handler for API and tag-based reasoning content.

Priority rules:
1. If API provides reasoning_content/reasoning/thinking, use it
2. Only parse tags from text content when not receiving API reasoning
3. Once API reasoning starts, ignore tag-based reasoning until API reasoning ends
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from .tag_parser import StreamingTagParser, TagDefinition

if TYPE_CHECKING:
    from .content_blocks import ContentBlockManager

DEFAULT_REASONING_TAGS = [
    TagDefinition("<think>", "</think>"),
    TagDefinition("<thinking>", "</thinking>"),
    TagDefinition("<reason>", "</reason>"),
    TagDefinition("<reasoning>", "</reasoning>"),
    TagDefinition("<thought>", "</thought>"),
    TagDefinition("<Thought>", "</Thought>"),
    TagDefinition("<|begin_of_thought|>", "<|end_of_thought|>"),
    TagDefinition("◁think▷", "◁/think▷"),
]

DEFAULT_SOLUTION_TAGS = [
    TagDefinition("<|begin_of_solution|>", "<|end_of_solution|>", "solution"),
]


@dataclass
class ReasoningConfig:
    """Configuration for reasoning handling."""

    enabled: bool = True
    tags: list[TagDefinition] | None = None
    solution_tags: list[TagDefinition] | None = None
    api_takes_precedence: bool = True

    def __post_init__(self) -> None:
        if self.tags is None:
            self.tags = list(DEFAULT_REASONING_TAGS)
        if self.solution_tags is None:
            self.solution_tags = list(DEFAULT_SOLUTION_TAGS)


class ReasoningHandler:
    """Unified handler for reasoning content from both API and tag sources.

    Priority rules:
    1. If API provides reasoning_content/reasoning/thinking, use it
    2. Only parse tags from text content when not receiving API reasoning
    3. Once API reasoning starts, ignore tag-based reasoning until API reasoning ends
    """

    def __init__(self, config: ReasoningConfig, block_manager: ContentBlockManager) -> None:
        self.config = config
        self.blocks = block_manager
        self._api_reasoning_active = False

        if config.enabled and config.tags:
            all_tags = list(config.tags)
            if config.solution_tags:
                all_tags.extend(config.solution_tags)
            self._tag_parser = StreamingTagParser(all_tags)
        else:
            self._tag_parser = None

    def handle_api_reasoning(self, reasoning_content: str) -> bool:
        """Handle reasoning content from API delta fields.

        Returns True if reasoning was processed.
        """
        if not reasoning_content:
            return False

        if not self._api_reasoning_active:
            self._api_reasoning_active = True
            self.blocks.start_reasoning(
                start_tag="<think>",
                end_tag="</think>",
                attributes={"type": "reasoning_content"},
                source="api",
            )

        current = self.blocks.current_block
        if current and hasattr(current, "content"):
            current.content += reasoning_content

        return True

    def handle_text_content(self, text: str) -> str:
        """Handle text content that might contain reasoning tags.

        Returns the text that should be displayed (may be empty if buffered).
        """
        if self._api_reasoning_active:
            self._api_reasoning_active = False
            self.blocks.end_reasoning()

        if not self.config.enabled or not self._tag_parser:
            self.blocks.append_text(text)
            return text

        result = self._tag_parser.parse_chunk(text)

        if result.emit_text:
            self.blocks.append_text(result.emit_text)

        if result.tag_started:
            tag_type = result.tag_started.content_type
            if tag_type == "solution":
                self.blocks.ensure_text_block()
            else:
                self.blocks.start_reasoning(
                    start_tag=result.tag_started.start_tag,
                    end_tag=result.tag_started.end_tag,
                    attributes=result.attributes,
                    source="tag",
                )

        if result.tag_content:
            current = self.blocks.current_block
            if current and hasattr(current, "content"):
                current.content += result.tag_content

        if result.tag_ended:
            if self.blocks.is_in_reasoning():
                self.blocks.end_reasoning()

        return result.emit_text

    def finalize(self) -> None:
        """Finalize any pending reasoning blocks."""
        if self._tag_parser:
            remaining = self._tag_parser.flush()
            if remaining:
                current = self.blocks.current_block
                if self.blocks.is_in_reasoning() and current:
                    current.content += remaining
                else:
                    self.blocks.append_text(remaining)

        if self._api_reasoning_active:
            self._api_reasoning_active = False
            self.blocks.end_reasoning()

        self.blocks.cleanup()
