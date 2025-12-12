import asyncio
import json
import logging
from contextlib import AsyncExitStack

import anyio
import httpx
from mcp import ClientSession
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
                    # HTTP+SSE protocol implementation
                    self._sse_client = httpx.AsyncClient(headers=headers)
                    self._sse_context = exit_stack.enter_async_context(self._sse_client)
                    # For HTTP+SSE, we need to implement the transport layer
                    # This is a simplified implementation - a full implementation would require
                    # proper SSE event handling and bidirectional communication
                    self._session_context = await self._create_sse_session(url)
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

    async def _create_sse_session(self, url: str):
        """Create an MCP session using HTTP+SSE protocol.
        This implementation uses HTTP POST for requests and SSE for responses.
        """
        log.debug("Creating SSE session")
        # Parse the base URL and create SSE endpoint
        url = url.removesuffix("/")
        sse_url = f"{url}/events"
        log.debug(f"SSE endpoint: {sse_url}")

        # Create message queues for bidirectional communication
        self._message_queue = asyncio.Queue()
        self._sse_task = None

        async def sse_read_stream():
            """Read stream that consumes messages from the SSE event queue"""
            log.debug("SSE read stream started")
            while True:
                try:
                    message = await self._message_queue.get()
                    if message is None:  # Sentinel value for stream end
                        log.debug("SSE read stream received end signal")
                        break
                    log.debug(f"SSE read stream yielding message: {message}")
                    yield message
                except asyncio.CancelledError:
                    log.debug("SSE read stream cancelled")
                    break
                except Exception as e:
                    log.error(f"Error in SSE read stream: {e}")
                    log.debug("SSE read stream error details:", exc_info=True)
                    break

        async def sse_write_stream():
            """Write stream that sends messages via HTTP POST"""
            log.debug("SSE write stream created")

            async def write_message(message):
                try:
                    log.debug(f"Sending MCP message via HTTP POST: {message}")
                    # Convert message to JSON and send via HTTP POST
                    message_data = json.dumps(message)
                    response = await self._sse_client.post(
                        f"{url}/call", content=message_data, headers={"Content-Type": "application/json"}
                    )
                    response.raise_for_status()
                    result = await response.json()
                    log.debug(f"Received response: {result}")
                    return result
                except Exception as e:
                    log.error(f"Error sending MCP message: {e}")
                    log.debug("MCP message sending error details:", exc_info=True)
                    raise

            return write_message

        # Start SSE event listener in background
        log.debug("Starting SSE event listener task")
        self._sse_task = asyncio.create_task(self._listen_to_sse_events(sse_url))

        # Create a minimal transport interface
        class SSETransport:
            def __init__(self):
                self.read_stream = sse_read_stream()
                self.write_stream = sse_write_stream()

        transport = SSETransport()
        return ClientSession(transport.read_stream, transport.write_stream)

    async def _listen_to_sse_events(self, sse_url: str):
        """Listen to Server-Sent Events from the MCP server."""
        log.debug(f"Starting SSE event listener for: {sse_url}")
        try:
            async with self._sse_client.stream("GET", sse_url) as response:
                log.debug("SSE connection established")
                async for line in response.aiter_lines():
                    log.debug(f"Received SSE line: {line}")
                    if line and line.startswith("data:"):
                        # Parse SSE data
                        data = line[5:].strip()
                        if data:
                            try:
                                message = json.loads(data)
                                log.debug(f"Parsed SSE message: {message}")
                                await self._message_queue.put(message)
                            except json.JSONDecodeError:
                                log.error(f"Failed to parse SSE message: {data}")
        except Exception as e:
            log.error(f"SSE connection error: {e}")
            log.debug("SSE connection error details:", exc_info=True)
        finally:
            log.debug("SSE event listener shutting down")
            # Signal end of stream
            await self._message_queue.put(None)

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
        if hasattr(self, "_sse_task") and self._sse_task:
            self._sse_task.cancel()
            try:
                await self._sse_task
            except asyncio.CancelledError:
                pass
        if hasattr(self, "_message_queue"):
            # Put sentinel value to stop the read stream
            await self._message_queue.put(None)
        await self.exit_stack.aclose()

    async def __aenter__(self):
        await self.exit_stack.__aenter__()
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        await self.exit_stack.__aexit__(exc_type, exc_value, traceback)
        await self.disconnect()
