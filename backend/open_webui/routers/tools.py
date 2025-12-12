import logging
import time

from fastapi import APIRouter, Depends, Request
from open_webui.env import SRC_LOG_LEVELS
from open_webui.models.groups import Groups
from open_webui.models.users import UserResponse
from open_webui.utils.access_control import has_access
from open_webui.utils.auth import get_verified_user
from pydantic import BaseModel, ConfigDict

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MAIN"])


router = APIRouter()


class ToolUserResponse(BaseModel):
    id: str
    user_id: str
    name: str
    meta: dict
    access_control: dict | None = None
    updated_at: int
    created_at: int
    user: UserResponse | None = None

    model_config = ConfigDict(extra="allow")


############################
# GetTools
############################


@router.get("/", response_model=list[ToolUserResponse])
async def get_tools(request: Request, user=Depends(get_verified_user)):
    tools = []

    # MCP Tool Servers
    for server in request.app.state.config.TOOL_SERVER_CONNECTIONS:
        server_id = server.get("info", {}).get("id")
        auth_type = server.get("auth_type", "none")

        session_token = None
        if auth_type == "oauth_2.1":
            splits = server_id.split(":")
            server_id = splits[-1] if len(splits) > 1 else server_id

            session_token = await request.app.state.oauth_client_manager.get_oauth_token(user.id, f"mcp:{server_id}")

        tools.append(
            ToolUserResponse(
                **{
                    "id": f"server:mcp:{server.get('info', {}).get('id')}",
                    "user_id": f"server:mcp:{server.get('info', {}).get('id')}",
                    "name": server.get("info", {}).get("name", "MCP Tool Server"),
                    "meta": {
                        "description": server.get("info", {}).get("description", ""),
                    },
                    "access_control": server.get("config", {}).get("access_control", None),
                    "updated_at": int(time.time()),
                    "created_at": int(time.time()),
                    **(
                        {
                            "authenticated": session_token is not None,
                        }
                        if auth_type == "oauth_2.1"
                        else {}
                    ),
                }
            )
        )

    if user.role == "admin":
        return tools

    user_group_ids = {group.id for group in Groups.get_groups_by_member_id(user.id)}
    tools = [tool for tool in tools if has_access(user.id, "read", tool.access_control, user_group_ids)]
    return tools
