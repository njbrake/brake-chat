import asyncio
import logging
from contextlib import AsyncExitStack

import anyio
from mcp import ClientSession
from mcp.client.sse import sse_client
from mcp.client.streamable_http import streamablehttp_client
from open_webui.env import SRC_LOG_LEVELS

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MCP"])


class MCPClient:
    def __init__(self) -> None:
        self.session: ClientSession | None = None
        self.exit_stack = None
        self.protocol: str = "streamable_http"
        self.url: str = ""
        self.headers: dict | None = None

    async def connect(self, url: str, headers: dict | None = None, protocol: str = "streamable_http"):
        self.protocol = protocol
        self.url = url
        self.headers = headers

        log.debug(f"Connecting to MCP server with protocol: {protocol}")
        log.debug(f"URL: {url}")
        log.debug(f"Headers: {headers}")

        async with AsyncExitStack() as exit_stack:
            try:
                if protocol == "streamable_http":
                    log.debug("Using streamable_http protocol")
                    self._streams_context = streamablehttp_client(url, headers=headers)
                    transport = await exit_stack.enter_async_context(self._streams_context)
                    read_stream, write_stream, _ = transport
                    self._session_context = ClientSession(read_stream, write_stream)
                elif protocol == "http_sse":
                    log.debug("Using HTTP+SSE protocol")
                    # Use the official MCP SSE client implementation
                    self._sse_context = sse_client(url, headers=headers)
                    transport = await exit_stack.enter_async_context(self._sse_context)
                    read_stream, write_stream = transport
                    self._session_context = ClientSession(read_stream, write_stream)
                else:
                    raise ValueError(f"Unsupported MCP protocol: {protocol}")

                self.session = await exit_stack.enter_async_context(self._session_context)
                log.debug("Session created, initializing...")
                with anyio.fail_after(10):
                    await self.session.initialize()
                log.debug("Session initialized successfully")
                self.exit_stack = exit_stack.pop_all()
            except Exception as e:
                log.error(f"Exception during MCP connection: {e}")
                log.debug("Exception details:", exc_info=True)
                await asyncio.shield(self.disconnect())
                raise e

    async def list_tool_specs(self) -> dict | None:
        log.debug("Listing tool specs")
        if not self.session:
            log.error("MCP client is not connected")
            raise RuntimeError("MCP client is not connected.")

        try:
            result = await self.session.list_tools()
            tools = result.tools

            tool_specs = []
            for tool in tools:
                name = tool.name
                description = tool.description

                inputSchema = tool.inputSchema

                getattr(tool, "outputSchema", None)

                tool_specs.append({"name": name, "description": description, "parameters": inputSchema})

            log.debug(f"Found {len(tool_specs)} tool specs")
            return tool_specs
        except Exception as e:
            log.error(f"Error listing tool specs: {e}")
            log.debug("Tool specs error details:", exc_info=True)
            raise

    async def call_tool(self, function_name: str, function_args: dict) -> dict | None:
        log.debug(f"Calling tool: {function_name} with args: {function_args}")
        if not self.session:
            log.error("MCP client is not connected")
            raise RuntimeError("MCP client is not connected.")

        try:
            result = await self.session.call_tool(function_name, function_args)
            if not result:
                log.error("No result returned from MCP tool call")
                raise Exception("No result returned from MCP tool call.")

            result_dict = result.model_dump(mode="json")
            result_content = result_dict.get("content", {})

            if result.isError:
                log.error(f"MCP tool call returned error: {result_content}")
                raise Exception(result_content)

            log.debug(f"Tool call successful, result: {result_content}")
            return result_content
        except Exception as e:
            log.error(f"Error calling tool {function_name}: {e}")
            log.debug("Tool call error details:", exc_info=True)
            raise

    async def list_resources(self, cursor: str | None = None) -> dict | None:
        if not self.session:
            raise RuntimeError("MCP client is not connected.")

        result = await self.session.list_resources(cursor=cursor)
        if not result:
            raise Exception("No result returned from MCP list_resources call.")

        result_dict = result.model_dump()
        resources = result_dict.get("resources", [])

        return resources

    async def read_resource(self, uri: str) -> dict | None:
        if not self.session:
            raise RuntimeError("MCP client is not connected.")

        result = await self.session.read_resource(uri)
        if not result:
            raise Exception("No result returned from MCP read_resource call.")
        result_dict = result.model_dump()

        return result_dict

    async def disconnect(self):
        # Clean up and close the session
        await self.exit_stack.aclose()

    async def __aenter__(self):
        await self.exit_stack.__aenter__()
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        await self.exit_stack.__aexit__(exc_type, exc_value, traceback)
        await self.disconnect()
