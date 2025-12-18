import logging
import sys
import time

from fastapi import Request
from open_webui.config import (
    BYPASS_ADMIN_ACCESS_CONTROL,
    DEFAULT_ARENA_MODEL,
)
from open_webui.env import BYPASS_MODEL_ACCESS_CONTROL, GLOBAL_LOG_LEVEL, SRC_LOG_LEVELS
from open_webui.models.groups import Groups
from open_webui.models.models import Models
from open_webui.models.users import UserModel
from open_webui.routers import openai
from open_webui.utils.access_control import has_access

logging.basicConfig(stream=sys.stdout, level=GLOBAL_LOG_LEVEL)
log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MAIN"])


async def fetch_openai_models(request: Request, user: UserModel = None):
    openai_response = await openai.get_all_models(request, user=user)
    return openai_response["data"]


async def get_all_base_models(request: Request, user: UserModel = None):
    if request.app.state.config.ENABLE_OPENAI_API:
        openai_models = await fetch_openai_models(request, user)
    else:
        openai_models = []

    return openai_models


async def get_all_models(request, refresh: bool = False, user: UserModel = None):
    if (
        request.app.state.MODELS
        and request.app.state.BASE_MODELS
        and (request.app.state.config.ENABLE_BASE_MODELS_CACHE and not refresh)
    ):
        base_models = request.app.state.BASE_MODELS
    else:
        base_models = await get_all_base_models(request, user=user)
        request.app.state.BASE_MODELS = base_models

    # deep copy the base models to avoid modifying the original list
    models = [model.copy() for model in base_models]

    # If there are no models, return an empty list
    if len(models) == 0:
        return []

    # Add arena models
    if request.app.state.config.ENABLE_EVALUATION_ARENA_MODELS:
        arena_models = []
        if len(request.app.state.config.EVALUATION_ARENA_MODELS) > 0:
            arena_models = [
                {
                    "id": model["id"],
                    "name": model["name"],
                    "info": {
                        "meta": model["meta"],
                    },
                    "object": "model",
                    "created": int(time.time()),
                    "owned_by": "arena",
                    "arena": True,
                }
                for model in request.app.state.config.EVALUATION_ARENA_MODELS
            ]
        else:
            # Add default arena model
            arena_models = [
                {
                    "id": DEFAULT_ARENA_MODEL["id"],
                    "name": DEFAULT_ARENA_MODEL["name"],
                    "info": {
                        "meta": DEFAULT_ARENA_MODEL["meta"],
                    },
                    "object": "model",
                    "created": int(time.time()),
                    "owned_by": "arena",
                    "arena": True,
                }
            ]
        models = models + arena_models

    custom_models = Models.get_all_models()
    for custom_model in custom_models:
        if custom_model.base_model_id is None:
            # Applied directly to a base model
            for model in models:
                if custom_model.id == model["id"]:
                    if custom_model.is_active:
                        model["name"] = custom_model.name
                        model["info"] = custom_model.model_dump()

                        if "info" in model:
                            if "params" in model["info"]:
                                # Remove params to avoid exposing sensitive info
                                del model["info"]["params"]
                    else:
                        models.remove(model)

        elif custom_model.is_active and (custom_model.id not in [model["id"] for model in models]):
            # Custom model based on a base model
            owned_by = "openai"
            pipe = None

            for m in models:
                if custom_model.base_model_id == m["id"] or custom_model.base_model_id == m["id"].split(":")[0]:
                    owned_by = m.get("owned_by", "unknown")
                    if "pipe" in m:
                        pipe = m["pipe"]
                    break

            model = {
                "id": f"{custom_model.id}",
                "name": custom_model.name,
                "object": "model",
                "created": custom_model.created_at,
                "owned_by": owned_by,
                "preset": True,
                **({"pipe": pipe} if pipe is not None else {}),
            }

            info = custom_model.model_dump()
            if "params" in info:
                # Remove params to avoid exposing sensitive info
                del info["params"]

            model["info"] = info

            models.append(model)

    log.debug(f"get_all_models() returned {len(models)} models")

    request.app.state.MODELS = {model["id"]: model for model in models}
    return models


def check_model_access(user, model):
    if model.get("arena"):
        if not has_access(
            user.id,
            type="read",
            access_control=model.get("info", {}).get("meta", {}).get("access_control", {}),
        ):
            raise Exception("Model not found")
    else:
        model_info = Models.get_model_by_id(model.get("id"))
        if not model_info:
            raise Exception("Model not found")
        if not (
            user.id == model_info.user_id or has_access(user.id, type="read", access_control=model_info.access_control)
        ):
            raise Exception("Model not found")


def get_filtered_models(models, user):
    # Filter out models that the user does not have access to
    if (
        user.role == "user" or (user.role == "admin" and not BYPASS_ADMIN_ACCESS_CONTROL)
    ) and not BYPASS_MODEL_ACCESS_CONTROL:
        filtered_models = []
        user_group_ids = {group.id for group in Groups.get_groups_by_member_id(user.id)}
        for model in models:
            if model.get("arena"):
                if has_access(
                    user.id,
                    type="read",
                    access_control=model.get("info", {}).get("meta", {}).get("access_control", {}),
                    user_group_ids=user_group_ids,
                ):
                    filtered_models.append(model)
                continue

            model_info = Models.get_model_by_id(model["id"])
            if model_info:
                if (
                    (user.role == "admin" and BYPASS_ADMIN_ACCESS_CONTROL)
                    or user.id == model_info.user_id
                    or has_access(
                        user.id,
                        type="read",
                        access_control=model_info.access_control,
                        user_group_ids=user_group_ids,
                    )
                ):
                    filtered_models.append(model)

        return filtered_models
    return models
