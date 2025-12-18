"""Response handling module for processing LLM streaming responses.

This module provides components for:
- Content block management (text, reasoning, tool calls)
- Streaming tag parsing with buffering for fragmented chunks
- Unified reasoning handling (API + tag-based)
- Content serialization for display
"""

from .content_blocks import (
    BlockType,
    ContentBlock,
    ContentBlockManager,
    ReasoningBlock,
    ToolCallsBlock,
)
from .reasoning_handler import (
    DEFAULT_REASONING_TAGS,
    ReasoningConfig,
    ReasoningHandler,
)
from .serialization import (
    serialize_content_blocks,
)
from .stream_processor import (
    StreamConfig,
    StreamContext,
    StreamProcessor,
)
from .tag_parser import (
    ParseResult,
    StreamingTagParser,
    TagDefinition,
)

__all__ = [
    "DEFAULT_REASONING_TAGS",
    "BlockType",
    "ContentBlock",
    "ContentBlockManager",
    "ParseResult",
    "ReasoningBlock",
    "ReasoningConfig",
    "ReasoningHandler",
    "StreamConfig",
    "StreamContext",
    "StreamProcessor",
    "StreamingTagParser",
    "TagDefinition",
    "ToolCallsBlock",
    "serialize_content_blocks",
]
