import logging
import os
import re
import subprocess
import sys
import tempfile
import types

from open_webui.env import PIP_OPTIONS, PIP_PACKAGE_INDEX_OPTIONS, SRC_LOG_LEVELS
from open_webui.models.functions import Functions

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MAIN"])


def extract_frontmatter(content):
    frontmatter = {}
    frontmatter_started = False
    frontmatter_ended = False
    frontmatter_pattern = re.compile(r"^\s*([a-z_]+):\s*(.*)\s*$", re.IGNORECASE)

    try:
        lines = content.splitlines()
        if len(lines) < 1 or lines[0].strip() != '"""':
            return {}

        frontmatter_started = True

        for line in lines[1:]:
            if '"""' in line:
                if frontmatter_started:
                    frontmatter_ended = True
                    break

            if frontmatter_started and not frontmatter_ended:
                match = frontmatter_pattern.match(line)
                if match:
                    key, value = match.groups()
                    frontmatter[key.strip()] = value.strip()

    except Exception as e:
        log.exception(f"Failed to extract frontmatter: {e}")
        return {}

    return frontmatter


def replace_imports(content):
    replacements = {
        "from utils": "from open_webui.utils",
        "from apps": "from open_webui.apps",
        "from main": "from open_webui.main",
        "from config": "from open_webui.config",
    }

    for old, new in replacements.items():
        content = content.replace(old, new)

    return content


def load_function_module_by_id(function_id: str, content: str | None = None):
    if content is None:
        function = Functions.get_function_by_id(function_id)
        if not function:
            raise Exception(f"Function not found: {function_id}")
        content = function.content

        content = replace_imports(content)
        Functions.update_function_by_id(function_id, {"content": content})
    else:
        frontmatter = extract_frontmatter(content)
        install_frontmatter_requirements(frontmatter.get("requirements", ""))

    module_name = f"function_{function_id}"
    module = types.ModuleType(module_name)
    sys.modules[module_name] = module

    temp_file = tempfile.NamedTemporaryFile(delete=False)
    temp_file.close()
    try:
        with open(temp_file.name, "w", encoding="utf-8") as f:
            f.write(content)
        module.__dict__["__file__"] = temp_file.name

        exec(content, module.__dict__)
        frontmatter = extract_frontmatter(content)
        log.info(f"Loaded module: {module.__name__}")

        if hasattr(module, "Pipe"):
            return module.Pipe(), "pipe", frontmatter
        if hasattr(module, "Filter"):
            return module.Filter(), "filter", frontmatter
        if hasattr(module, "Action"):
            return module.Action(), "action", frontmatter
        raise Exception("No Function class found in the module")
    except Exception as e:
        log.error(f"Error loading module: {function_id}: {e}")
        del sys.modules[module_name]

        Functions.update_function_by_id(function_id, {"is_active": False})
        raise e
    finally:
        os.unlink(temp_file.name)


def get_function_module_from_cache(request, function_id, load_from_db=True):
    if load_from_db:
        function = Functions.get_function_by_id(function_id)
        if not function:
            raise Exception(f"Function not found: {function_id}")
        content = function.content

        new_content = replace_imports(content)
        if new_content != content:
            content = new_content
            Functions.update_function_by_id(function_id, {"content": content})

        if (
            hasattr(request.app.state, "FUNCTION_CONTENTS") and function_id in request.app.state.FUNCTION_CONTENTS
        ) and (hasattr(request.app.state, "FUNCTIONS") and function_id in request.app.state.FUNCTIONS):
            if request.app.state.FUNCTION_CONTENTS[function_id] == content:
                return request.app.state.FUNCTIONS[function_id], None, None

        function_module, function_type, frontmatter = load_function_module_by_id(function_id, content)
    else:
        if hasattr(request.app.state, "FUNCTIONS") and function_id in request.app.state.FUNCTIONS:
            return request.app.state.FUNCTIONS[function_id], None, None

        function_module, function_type, frontmatter = load_function_module_by_id(function_id)

    if not hasattr(request.app.state, "FUNCTIONS"):
        request.app.state.FUNCTIONS = {}

    if not hasattr(request.app.state, "FUNCTION_CONTENTS"):
        request.app.state.FUNCTION_CONTENTS = {}

    request.app.state.FUNCTIONS[function_id] = function_module
    request.app.state.FUNCTION_CONTENTS[function_id] = content

    return function_module, function_type, frontmatter


def install_frontmatter_requirements(requirements: str):
    if requirements:
        try:
            req_list = [req.strip() for req in requirements.split(",")]
            log.info(f"Installing requirements: {' '.join(req_list)}")
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install"] + PIP_OPTIONS + req_list + PIP_PACKAGE_INDEX_OPTIONS
            )
        except Exception as e:
            log.error(f"Error installing packages: {' '.join(req_list)}")
            raise e

    else:
        log.info("No requirements found in frontmatter.")


def install_tool_and_function_dependencies():
    function_list = Functions.get_functions(active_only=True)

    all_dependencies = ""
    try:
        for function in function_list:
            frontmatter = extract_frontmatter(replace_imports(function.content))
            if dependencies := frontmatter.get("requirements"):
                all_dependencies += f"{dependencies}, "

        install_frontmatter_requirements(all_dependencies.strip(", "))
    except Exception as e:
        log.error(f"Error installing requirements: {e}")
