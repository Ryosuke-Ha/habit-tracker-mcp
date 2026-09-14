import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { apiRequest } from "../client.js"
import { LIMITS, validationError } from "../validation/limits.js"

// ──────────────────────────────────────────────────────────────────────────────
// 予防層: zodスキーマ
// ──────────────────────────────────────────────────────────────────────────────

export const addKptItemSchema = z.object({
  type: z.enum(["keep", "problem", "try"], {
    errorMap: () => ({
      message: 'type は "keep" / "problem" / "try" のいずれかで指定して再実行してください。',
    }),
  }).describe("KPTの種別（keep・problem・try）"),
  content: z.string().trim()
    .min(1, { message: "content は必須です。1文字以上を指定して再実行してください。" })
    .max(LIMITS.KPT_CONTENT_MAX, {
      message: `content が上限を超えています（上限${LIMITS.KPT_CONTENT_MAX}文字）。短縮して再実行してください。`,
    })
    .describe("KPTアイテムの内容"),
})

// ──────────────────────────────────────────────────────────────────────────────
// ツール登録
// ──────────────────────────────────────────────────────────────────────────────

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
    addKptItemSchema.shape,
    async ({ type, content }) => {
      // 強制層
      if (content.length > LIMITS.KPT_CONTENT_MAX) {
        return validationError(`[content] 上限${LIMITS.KPT_CONTENT_MAX}文字を超えています（入力${content.length}文字）。短縮して再実行してください。`)
      }

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
