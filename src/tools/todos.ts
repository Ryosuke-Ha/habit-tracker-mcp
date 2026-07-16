import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { apiRequest } from "../client.js"
import { getJSTDayOfWeek, isJSTWeekday } from "../utils/datetime.js"

const getTemplateId = async (): Promise<number | null> => {
  try {
    // settingsから曜日別テンプレートマップを取得
    const settings = (await apiRequest("GET", "/settings")) as {
      habit_day_template_map?: string
    }

    if (settings.habit_day_template_map) {
      // JSON文字列をパース
      const dayTemplateMap = JSON.parse(settings.habit_day_template_map) as Record<string, string>

      // JSTでの今日の曜日番号を取得
      const dayOfWeek = getJSTDayOfWeek()
      const templateId = dayTemplateMap[String(dayOfWeek)]

      if (templateId) {
        return parseInt(templateId, 10)
      }
    }
  } catch (e) {
    console.error("Failed to get template from settings:", e)
  }

  // フォールバック: 平日/休日のキーワードマッチング
  const templates = (await apiRequest("GET", "/templates")) as Array<{ id: number; name: string }>
  if (!templates || templates.length === 0) return null

  const keyword = isJSTWeekday() ? "平日" : "休日"
  const template = templates.find((t) => t.name.includes(keyword)) ?? templates[0]
  return template?.id ?? null
}

export const registerTodoTools = (server: McpServer) => {
  server.tool(
    "get_today_todos",
    "今日のTODO一覧を取得する",
    {},
    async () => {
      const templateId = await getTemplateId()
      if (templateId === null) {
        return { content: [{ type: "text", text: "テンプレートが見つかりません" }] }
      }

      const data = await apiRequest("GET", `/logs/today?template_id=${templateId}`)
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      }
    }
  )

  server.tool(
    "add_todo",
    "今日の習慣ログにTODOを追加する。毎日繰り返す習慣・今日やることに使う。特定日の予定（歯医者・会議など）はadd_scheduled_todoを使うこと。",
    {
      title: z.string().describe("TODOのタイトル"),
      scheduled_time: z.string().optional().describe("予定時刻（HH:MM形式）"),
      location: z.string().optional().describe("場所"),
    },
    async ({ title, scheduled_time, location }) => {
      const templateId = await getTemplateId()
      if (templateId === null) {
        return { content: [{ type: "text", text: "テンプレートが見つかりません" }] }
      }

      const data = await apiRequest("POST", "/logs/standalone", {
        title,
        scheduled_time,
        location,
        template_id: templateId,
      })
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      }
    }
  )

  server.tool(
    "complete_todo",
    "TODOを完了にする",
    {
      todo_id: z.number().describe("完了にするTODOのID"),
    },
    async ({ todo_id }) => {
      const data = await apiRequest("POST", `/logs/${todo_id}/toggle`)
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      }
    }
  )

  server.tool(
    "get_persistent_todos",
    "持ち越しTODO一覧を取得する",
    {},
    async () => {
      const data = await apiRequest("GET", "/persistent-todos")
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      }
    }
  )

  server.tool(
    "add_scheduled_todo",
    "特定の日付のTODOメモを追加する。歯医者・会議など特定日の予定タスクに使う。毎日繰り返す習慣・今日やることへの追加はadd_todoを使うこと。",
    {
      title: z.string().describe("TODOメモのタイトル"),
      scheduled_date: z.string().describe("予定日（YYYY-MM-DD形式）。「明日」「来週月曜」などの相対表現はJSTで計算して変換すること"),
      scheduled_time: z.string().optional().describe("予定時刻（HH:MM形式、任意）"),
      location: z.string().optional().describe("場所（任意）"),
      notification_offset_1: z.enum([
        "on_time",
        "30min_before",
        "1hour_before",
        "2hour_before",
        "1day_before",
        "2day_before"
      ]).optional().describe("通知タイミング1（任意）"),
      notification_offset_2: z.enum([
        "on_time",
        "30min_before",
        "1hour_before",
        "2hour_before",
        "1day_before",
        "2day_before"
      ]).optional().describe("通知タイミング2（任意）"),
    },
    async ({ title, scheduled_date, scheduled_time, location, notification_offset_1, notification_offset_2 }) => {
      const data = await apiRequest("POST", "/scheduled-todos", {
        title,
        scheduled_date,
        scheduled_time: scheduled_time || null,
        location: location || null,
        notification_offset_1: notification_offset_1 || null,
        notification_offset_2: notification_offset_2 || null,
      })
      return {
        content: [{
          type: "text",
          text: JSON.stringify(data, null, 2)
        }],
      }
    }
  )

  server.tool(
    "add_persistent_todo",
    "持ち越しTODOを追加する",
    {
      title: z.string().describe("持ち越しTODOのタイトル"),
      scheduled_time: z.string().optional().describe("予定時刻"),
    },
    async ({ title, scheduled_time }) => {
      const data = await apiRequest("POST", "/persistent-todos", {
        title,
        scheduled_time,
      })
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      }
    }
  )
}
