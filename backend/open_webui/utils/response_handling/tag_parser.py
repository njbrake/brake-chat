"""Streaming tag parser with buffering for fragmented chunks.

Handles the case where tags arrive split across SSE chunks:
- Chunk 1: "Hello <th"
- Chunk 2: "ink>reasoning</think>world"

The parser buffers potential partial tags at chunk boundaries and
retries matching when more data arrives.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class TagDefinition:
    """Definition of a tag pair (start and end tag)."""

    start_tag: str
    end_tag: str
    content_type: str = "reasoning"


@dataclass
class ParseResult:
    """Result from parsing a chunk of content."""

    emit_text: str = ""
    tag_started: TagDefinition | None = None
    tag_ended: bool = False
    tag_content: str = ""
    attributes: dict[str, str] = field(default_factory=dict)


class StreamingTagParser:
    """Handles tag detection across streaming chunks.

    The key insight is that we need to buffer potential partial tags
    at chunk boundaries. When we see content that could be the start
    of a tag (like "<" or "<th"), we hold it in a buffer until we
    can determine if it's actually a tag or just content.

    Example flow:
        Chunk 1: "Hello <th"     -> Emit "Hello ", buffer "<th"
        Chunk 2: "ink>reasoning" -> Match "<think>", start reasoning
        Chunk 3: " content</think>world" -> Match "</think>", emit "world"
    """

    def __init__(self, tag_definitions: list[TagDefinition]) -> None:
        self.tags = tag_definitions
        self._buffer = ""
        self._in_tag: TagDefinition | None = None
        self._tag_content = ""

        self._start_patterns: list[tuple[re.Pattern[str], TagDefinition]] = []
        for tag in self.tags:
            if tag.start_tag.startswith("<") and tag.start_tag.endswith(">"):
                base = tag.start_tag[1:-1]
                pattern = rf"<{re.escape(base)}(\s[^>]*)?>?"
            else:
                pattern = re.escape(tag.start_tag)
            self._start_patterns.append((re.compile(pattern), tag))

        self._max_prefix_len = max(len(t.start_tag) for t in self.tags) + 20

    def _could_be_partial_tag(self, text: str) -> bool:
        """Check if text ends with something that could be a partial tag."""
        if not text:
            return False

        for tag in self.tags:
            start = tag.start_tag
            for i in range(1, len(start)):
                if text.endswith(start[:i]):
                    return True

        last_lt = text.rfind("<")
        if last_lt != -1:
            after_lt = text[last_lt:]
            if ">" not in after_lt:
                return True

        return False

    def _find_buffer_split_point(self, text: str) -> int:
        """Find where to split text for buffering potential partial tags."""
        for i in range(min(self._max_prefix_len, len(text)), 0, -1):
            suffix = text[-i:]
            if self._could_be_partial_tag(suffix):
                return len(text) - i
        return len(text)

    def parse_chunk(self, chunk: str) -> ParseResult:
        """Parse a streaming chunk, handling potential tag boundaries.

        Returns:
            ParseResult with:
            - emit_text: text safe to emit now
            - tag_started: if a new tag was detected
            - tag_ended: if current tag ended
            - tag_content: content from inside tag
            - attributes: attributes extracted from tag

        """
        content = self._buffer + chunk
        self._buffer = ""

        if self._in_tag:
            return self._parse_inside_tag(content)
        return self._parse_outside_tag(content)

    def _parse_outside_tag(self, content: str) -> ParseResult:
        """Parse content when not inside a tag."""
        result = ParseResult()

        earliest_match = None
        earliest_pos = len(content)
        matched_tag = None

        for pattern, tag in self._start_patterns:
            match = pattern.search(content)
            if match and match.start() < earliest_pos:
                earliest_match = match
                earliest_pos = match.start()
                matched_tag = tag

        if earliest_match and matched_tag:
            result.emit_text = content[:earliest_pos]

            try:
                attr_str = earliest_match.group(1)
                if attr_str:
                    result.attributes = self._extract_attributes(attr_str)
            except IndexError:
                pass

            result.tag_started = matched_tag
            self._in_tag = matched_tag

            after_tag = content[earliest_match.end() :]

            end_result = self._parse_inside_tag(after_tag)
            if end_result.tag_ended:
                result.tag_ended = True
                result.tag_content = end_result.tag_content
                if end_result.emit_text:
                    result.emit_text = result.emit_text or ""
                self._in_tag = None
            else:
                self._tag_content = after_tag
                split = self._find_end_tag_split(after_tag)
                result.tag_content = after_tag[:split]
                self._buffer = after_tag[split:]
        else:
            split = self._find_buffer_split_point(content)
            result.emit_text = content[:split]
            self._buffer = content[split:]

        return result

    def _parse_inside_tag(self, content: str) -> ParseResult:
        """Parse content when inside a tag."""
        result = ParseResult()

        if not self._in_tag:
            result.emit_text = content
            return result

        end_tag = self._in_tag.end_tag
        end_pos = content.find(end_tag)

        if end_pos != -1:
            result.tag_content = self._tag_content + content[:end_pos]
            result.tag_ended = True
            self._in_tag = None
            self._tag_content = ""

            after_end = content[end_pos + len(end_tag) :]
            if after_end:
                sub_result = self._parse_outside_tag(after_end)
                result.emit_text = sub_result.emit_text
                if sub_result.tag_started:
                    pass
        else:
            split = self._find_end_tag_split(content)
            result.tag_content = content[:split]
            self._tag_content += content[:split]
            self._buffer = content[split:]

        return result

    def _find_end_tag_split(self, text: str) -> int:
        """Find split point when looking for end tag."""
        if not self._in_tag:
            return len(text)

        end_tag = self._in_tag.end_tag
        for i in range(1, len(end_tag)):
            if text.endswith(end_tag[:i]):
                return len(text) - i
        return len(text)

    def _extract_attributes(self, attr_string: str) -> dict[str, str]:
        """Extract key="value" attributes from tag."""
        attrs = {}
        if attr_string:
            matches = re.findall(r'(\w+)\s*=\s*"([^"]*)"', attr_string)
            for key, value in matches:
                attrs[key] = value
        return attrs

    def flush(self) -> str:
        """Flush any remaining buffered content."""
        content = self._buffer
        self._buffer = ""
        return content

    def reset(self) -> None:
        """Reset parser state."""
        self._buffer = ""
        self._in_tag = None
        self._tag_content = ""

    def is_in_tag(self) -> bool:
        """Check if currently inside a tag."""
        return self._in_tag is not None
