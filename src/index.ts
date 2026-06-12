import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { registerTodoTools } from "./tools/todos.js"
import { registerReviewTools } from "./tools/reviews.js"
import { registerCoachingTools } from "./tools/coaching.js"

const server = new McpServer({
  name: "habit-tracker",
  version: "1.0.0",
})

registerTodoTools(server)
registerReviewTools(server)
registerCoachingTools(server)

const transport = new StdioServerTransport()
await server.connect(transport)
console.error("habit-tracker MCP server running")
