import importlib
import sys

from fastapi import FastAPI


MODULE_NAME = "open_webui.utils.telemetry.instrumentors"


def test_instrument_fastapi_graceful_without_chromadb(monkeypatch):
    """instrument_fastapi should remain callable when chromadb is absent."""

    original_find_spec = importlib.util.find_spec

    def fake_find_spec(name, *args, **kwargs):
        if name == "chromadb":
            return None
        return original_find_spec(name, *args, **kwargs)

    monkeypatch.setattr(importlib.util, "find_spec", fake_find_spec)
    sys.modules.pop(MODULE_NAME, None)
    sys.modules.pop("chromadb", None)

    instrumentors = importlib.import_module(MODULE_NAME)

    app = FastAPI()
    result = instrumentors.instrument_fastapi(app)

    assert result is app
