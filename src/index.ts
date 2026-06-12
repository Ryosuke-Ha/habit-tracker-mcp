import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"
import { registerTodoTools } from "./tools/todos.js"
import { registerReviewTools } from "./tools/reviews.js"
import { registerCoachingTools } from "./tools/coaching.js"
import http from "http"

const server = new McpServer({
  name: "habit-tracker",
  version: "1.0.0",
})

registerTodoTools(server)
registerReviewTools(server)
registerCoachingTools(server)

const PORT = process.env.PORT || 8080

const transports = new Map<string, SSEServerTransport>()

const httpServer = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id")

  if (req.method === "OPTIONS") {
    res.writeHead(200)
    res.end()
    return
  }

  if (req.url === "/sse" && req.method === "GET") {
    const transport = new SSEServerTransport("/message", res)
    transports.set(transport.sessionId, transport)
    transport.onclose = () => transports.delete(transport.sessionId)
    await server.connect(transport)
    return
  }

  if (req.url === "/message" && req.method === "POST") {
    const sessionId = req.headers["mcp-session-id"] as string
    const transport = transports.get(sessionId)
    if (!transport) {
      res.writeHead(400)
      res.end("No transport found for session")
      return
    }
    await transport.handlePostMessage(req, res)
    return
  }

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ status: "ok", name: "habit-tracker-mcp" }))
    return
  }

  res.writeHead(404)
  res.end("Not found")
})

httpServer.listen(PORT, () => {
  console.error(`habit-tracker MCP server running on port ${PORT}`)
})
