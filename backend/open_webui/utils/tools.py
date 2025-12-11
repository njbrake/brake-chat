import json
import logging

from fastapi import Request
from open_webui.env import SRC_LOG_LEVELS
from open_webui.models.users import UserModel

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MODELS"])


async def get_tools(request: Request, tool_ids: list[str], user: UserModel, extra_params: dict) -> dict[str, dict]:
    """Get tools for the given tool IDs.
    Python-based tools have been removed - this now returns an empty dict.
    MCP tools are handled separately in middleware.
    """
    return {}


async def set_tool_servers(request: Request):
    request.app.state.TOOL_SERVERS = []

    if request.app.state.redis is not None:
        await request.app.state.redis.set("tool_servers", json.dumps(request.app.state.TOOL_SERVERS))

    return request.app.state.TOOL_SERVERS


async def get_tool_servers(request: Request):
    return []
