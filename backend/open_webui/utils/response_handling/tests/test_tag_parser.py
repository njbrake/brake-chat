"""Tests for the StreamingTagParser."""

from open_webui.utils.response_handling.tag_parser import (
    StreamingTagParser,
    TagDefinition,
)


class TestStreamingTagParser:
    """Test suite for StreamingTagParser."""

    def test_simple_complete_tag(self):
        """Test parsing a complete tag in a single chunk."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        result = parser.parse_chunk("Hello <think>reasoning</think> world")

        assert result.emit_text == "Hello "
        assert result.tag_started is not None
        assert result.tag_started.start_tag == "<think>"
        assert result.tag_content == "reasoning"
        assert result.tag_ended is True

    def test_fragmented_start_tag(self):
        """Test parsing a tag that's split across chunks at the start tag."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        result1 = parser.parse_chunk("Hello <th")
        assert result1.emit_text == "Hello "
        assert result1.tag_started is None

        result2 = parser.parse_chunk("ink>reasoning</think>world")
        assert result2.tag_started is not None
        assert result2.tag_started.start_tag == "<think>"
        assert result2.tag_content == "reasoning"
        assert result2.tag_ended is True

    def test_fragmented_end_tag(self):
        """Test parsing a tag that's split across chunks at the end tag."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        result1 = parser.parse_chunk("<think>reason")
        assert result1.tag_started is not None
        assert result1.tag_ended is False

        result2 = parser.parse_chunk("ing</th")
        assert result2.tag_ended is False

        result3 = parser.parse_chunk("ink>done")
        assert result3.tag_ended is True
        assert "reasoning" in result3.tag_content

    def test_no_tag_content(self):
        """Test parsing content without any tags."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        result = parser.parse_chunk("Just regular text without tags")

        assert result.emit_text == "Just regular text without tags"
        assert result.tag_started is None
        assert result.tag_ended is False

    def test_multiple_tags_in_sequence(self):
        """Test parsing multiple complete tags in sequence."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        result1 = parser.parse_chunk("<think>first</think>between<think>second</think>end")

        assert result1.tag_started is not None
        assert "first" in result1.tag_content
        assert result1.tag_ended is True

    def test_buffer_preserved_across_chunks(self):
        """Test that buffered content is preserved correctly."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        parser.parse_chunk("text <")
        assert parser._buffer == "<"

        result = parser.parse_chunk("think>content</think>")
        assert result.tag_started is not None
        assert result.tag_content == "content"

    def test_tag_with_attributes(self):
        """Test parsing tags with attributes."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        result = parser.parse_chunk('<think type="deep">reasoning</think>')

        assert result.tag_started is not None
        assert result.attributes.get("type") == "deep"
        assert result.tag_content == "reasoning"

    def test_unicode_tags(self):
        """Test parsing unicode-based tags."""
        parser = StreamingTagParser([TagDefinition("◁think▷", "◁/think▷")])

        result = parser.parse_chunk("Hello ◁think▷reasoning◁/think▷ world")

        assert result.tag_started is not None
        assert result.tag_content == "reasoning"
        assert result.tag_ended is True

    def test_thinking_tag_variant(self):
        """Test parsing <thinking> tag variant."""
        parser = StreamingTagParser([TagDefinition("<thinking>", "</thinking>")])

        result = parser.parse_chunk("<thinking>deep thought</thinking>")

        assert result.tag_started is not None
        assert result.tag_content == "deep thought"
        assert result.tag_ended is True

    def test_flush_remaining_buffer(self):
        """Test flushing remaining buffered content."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        parser.parse_chunk("text with partial <")
        remaining = parser.flush()

        assert remaining == "<"

    def test_reset_clears_state(self):
        """Test that reset clears all parser state."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        parser.parse_chunk("<think>partial")
        assert parser.is_in_tag()

        parser.reset()

        assert not parser.is_in_tag()
        assert parser._buffer == ""

    def test_is_in_tag_state(self):
        """Test is_in_tag state tracking."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        assert not parser.is_in_tag()

        parser.parse_chunk("<think>content")
        assert parser.is_in_tag()

        parser.parse_chunk("</think>")
        assert not parser.is_in_tag()

    def test_empty_tag_content(self):
        """Test parsing tags with no content."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        result = parser.parse_chunk("<think></think>more text")

        assert result.tag_started is not None
        assert result.tag_content == ""
        assert result.tag_ended is True

    def test_multiline_tag_content(self):
        """Test parsing tags with multiline content."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        content = "<think>line1\nline2\nline3</think>"
        result = parser.parse_chunk(content)

        assert result.tag_content == "line1\nline2\nline3"
        assert result.tag_ended is True

    def test_special_characters_in_content(self):
        """Test parsing tags with special characters in content."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        result = parser.parse_chunk('<think>{ "key": "value" }</think>')

        assert result.tag_content == '{ "key": "value" }'
        assert result.tag_ended is True

    def test_solution_tag(self):
        """Test parsing solution tags."""
        parser = StreamingTagParser([TagDefinition("<|begin_of_solution|>", "<|end_of_solution|>", "solution")])

        result = parser.parse_chunk("<|begin_of_solution|>answer<|end_of_solution|>")

        assert result.tag_started is not None
        assert result.tag_started.content_type == "solution"
        assert result.tag_content == "answer"

    def test_multiple_tag_definitions(self):
        """Test parser with multiple tag definitions."""
        parser = StreamingTagParser(
            [
                TagDefinition("<think>", "</think>"),
                TagDefinition("<thinking>", "</thinking>"),
                TagDefinition("<reason>", "</reason>"),
            ]
        )

        result1 = parser.parse_chunk("<think>thought1</think>")
        assert result1.tag_started.start_tag == "<think>"

        result2 = parser.parse_chunk("<thinking>thought2</thinking>")
        assert result2.tag_started.start_tag == "<thinking>"

        result3 = parser.parse_chunk("<reason>thought3</reason>")
        assert result3.tag_started.start_tag == "<reason>"

    def test_highly_fragmented_tag(self):
        """Test parsing with extreme fragmentation (single char chunks)."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        tag_str = "<think>hi</think>"
        results = []
        for char in tag_str:
            result = parser.parse_chunk(char)
            results.append(result)

        found_tag_end = any(r.tag_ended for r in results)
        assert found_tag_end

    def test_angle_bracket_false_positive(self):
        """Test that < not followed by tag doesn't cause issues."""
        parser = StreamingTagParser([TagDefinition("<think>", "</think>")])

        result = parser.parse_chunk("5 < 10 and 10 > 5")

        assert "<" not in parser._buffer or parser._buffer == ""
        assert result.tag_started is None
