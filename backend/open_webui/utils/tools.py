import inspect
import json
import logging
import re
from collections.abc import Awaitable, Callable
from functools import partial, update_wrapper
from typing import (
    Any,
    get_type_hints,
)

from fastapi import Request
from langchain_core.utils.function_calling import (
    convert_to_openai_function as convert_pydantic_model_to_openai_function_spec,
)
from open_webui.env import (
    SRC_LOG_LEVELS,
)
from open_webui.models.users import UserModel
from pydantic import BaseModel, Field, create_model

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MODELS"])


def get_async_tool_function_and_apply_extra_params(function: Callable, extra_params: dict) -> Callable[..., Awaitable]:
    sig = inspect.signature(function)
    extra_params = {k: v for k, v in extra_params.items() if k in sig.parameters}
    partial_func = partial(function, **extra_params)

    parameters = []
    for name, parameter in sig.parameters.items():
        if name in extra_params:
            continue
        parameters.append(parameter)

    new_sig = inspect.Signature(parameters=parameters, return_annotation=sig.return_annotation)

    if inspect.iscoroutinefunction(function):

        async def new_function(*args, **kwargs):
            return await partial_func(*args, **kwargs)

    else:

        async def new_function(*args, **kwargs):
            return partial_func(*args, **kwargs)

    update_wrapper(new_function, function)
    new_function.__signature__ = new_sig  # type: ignore[attr-defined]

    new_function.__function__ = function  # type: ignore[attr-defined]
    new_function.__extra_params__ = extra_params  # type: ignore[attr-defined]

    return new_function


def get_updated_tool_function(function: Callable, extra_params: dict):
    __function__ = getattr(function, "__function__", None)
    __extra_params__ = getattr(function, "__extra_params__", None)

    if __function__ is not None and __extra_params__ is not None:
        return get_async_tool_function_and_apply_extra_params(
            __function__,
            {**__extra_params__, **extra_params},
        )

    return function


async def get_tools(request: Request, tool_ids: list[str], user: UserModel, extra_params: dict) -> dict[str, dict]:
    return {}


def parse_description(docstring: str | None) -> str:
    if not docstring:
        return ""

    lines = [line.strip() for line in docstring.strip().split("\n")]
    description_lines: list[str] = []

    for line in lines:
        if re.match(r":param", line) or re.match(r":return", line):
            break

        description_lines.append(line)

    return "\n".join(description_lines)


def parse_docstring(docstring):
    if not docstring:
        return {}

    param_pattern = re.compile(r":param (\w+):\s*(.+)")
    param_descriptions = {}

    for line in docstring.splitlines():
        match = param_pattern.match(line.strip())
        if not match:
            continue
        param_name, param_description = match.groups()
        if param_name.startswith("__"):
            continue
        param_descriptions[param_name] = param_description

    return param_descriptions


def convert_function_to_pydantic_model(func: Callable) -> type[BaseModel]:
    type_hints = get_type_hints(func)
    signature = inspect.signature(func)
    parameters = signature.parameters

    docstring = func.__doc__

    function_description = parse_description(docstring)
    function_param_descriptions = parse_docstring(docstring)

    field_defs = {}
    for name, param in parameters.items():
        type_hint = type_hints.get(name, Any)
        default_value = param.default if param.default is not param.empty else ...

        param_description = function_param_descriptions.get(name, None)

        if param_description:
            field_defs[name] = (
                type_hint,
                Field(default_value, description=param_description),
            )
        else:
            field_defs[name] = type_hint, default_value

    model = create_model(func.__name__, **field_defs)  # type: ignore[call-overload]
    model.__doc__ = function_description

    return model


def get_functions_from_tool(tool: object) -> list[Callable]:
    return [
        getattr(tool, func)
        for func in dir(tool)
        if callable(getattr(tool, func)) and not func.startswith("__") and not inspect.isclass(getattr(tool, func))
    ]


def get_tool_specs(tool_module: object) -> list[dict]:
    function_models = map(convert_function_to_pydantic_model, get_functions_from_tool(tool_module))

    specs = [convert_pydantic_model_to_openai_function_spec(function_model) for function_model in function_models]

    return specs


async def set_tool_servers(request: Request):
    request.app.state.TOOL_SERVERS = []

    if request.app.state.redis is not None:
        await request.app.state.redis.set("tool_servers", json.dumps(request.app.state.TOOL_SERVERS))

    return request.app.state.TOOL_SERVERS


async def get_tool_servers(request: Request):
    return []
