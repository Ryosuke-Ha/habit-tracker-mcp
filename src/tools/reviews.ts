import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { apiRequest } from "../client.js"

export const registerReviewTools = (server: McpServer) => {
  server.tool(
    "get_weekly_summary",
    "今週の振り返りデータを取得する（達成率・KPT）",
    {},
    async () => {
      const data = await apiRequest("GET", "/reviews/weekly")
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      }
    }
  )

  server.tool(
    "add_kpt_item",
    "今週のKPTにアイテムを追加する",
    {
      type: z
        .enum(["keep", "problem", "try"])
        .describe("KPTの種別（keep・problem・try）"),
      content: z.string().describe("KPTアイテムの内容"),
    },
    async ({ type, content }) => {
      const data = await apiRequest("POST", "/reviews/kpt", { type, content })
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      }
    }
  )

  server.tool(
    "get_monthly_stats",
    "今月の達成率・streakを取得する",
    {},
    async () => {
      const data = await apiRequest("GET", "/stats/monthly")
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      }
    }
  )
}
