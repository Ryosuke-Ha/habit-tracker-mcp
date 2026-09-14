import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { apiRequest } from "../client.js"
import { getJSTDayOfWeek, isJSTWeekday, ceilToNextSlot } from "../utils/datetime.js"
import { LIMITS, PATTERNS, NOTIFICATION_OFFSETS, validationError } from "../validation/limits.js"

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

// ──────────────────────────────────────────────────────────────────────────────
// 予防層: zodスキーマ（AIが読むJSON Schemaに制約を出す + MCPレベルで弾く）
// ──────────────────────────────────────────────────────────────────────────────

export const addTodoSchema = z.object({
  title: z.string().trim()
    .min(1, { message: "title は必須です。1文字以上を指定して再実行してください。" })
    .max(LIMITS.TITLE_MAX, {
      message: `title が上限を超えています（上限${LIMITS.TITLE_MAX}文字）。${LIMITS.TITLE_MAX}文字以内に短縮して再実行してください。`,
    })
    .describe("TODOのタイトル"),
  scheduled_time: z.string()
    .regex(PATTERNS.TIME, {
      message: "scheduled_time の形式が不正です。HH:MM（24時間表記、例 09:30）で指定して再実行してください。",
    })
    .optional()
    .describe("予定時刻（HH:MM形式）"),
  location: z.string().trim()
    .max(LIMITS.LOCATION_MAX, {
      message: `location が上限を超えています（上限${LIMITS.LOCATION_MAX}文字）。短縮して再実行してください。`,
    })
    .optional()
    .describe("場所"),
})

export const completeTodoSchema = z.object({
  todo_id: z.number()
    .int({ message: "todo_id は整数で指定してください。" })
    .positive({ message: "todo_id は正の整数で指定してください。get_today_todos で正しい ID を確認して再実行してください。" })
    .describe("完了にするTODOのID"),
})

export const addScheduledTodoSchema = z.object({
  title: z.string().trim()
    .min(1, { message: "title は必須です。1文字以上を指定して再実行してください。" })
    .max(LIMITS.TITLE_MAX, {
      message: `title が上限を超えています（上限${LIMITS.TITLE_MAX}文字）。${LIMITS.TITLE_MAX}文字以内に短縮して再実行してください。`,
    })
    .describe("TODOメモのタイトル"),
  scheduled_date: z.string()
    .regex(PATTERNS.DATE, {
      message: "scheduled_date の形式が不正です。YYYY-MM-DD（例 2024-12-31）で指定して再実行してください。",
    })
    .describe("予定日（YYYY-MM-DD形式）。「明日」「来週月曜」などの相対表現はJSTで計算して変換すること"),
  scheduled_time: z.string()
    .regex(PATTERNS.TIME, {
      message: "scheduled_time の形式が不正です。HH:MM（24時間表記、例 09:30）で指定して再実行してください。",
    })
    .optional()
    .describe("予定時刻（HH:MM形式、任意）"),
  location: z.string().trim()
    .max(LIMITS.LOCATION_MAX, {
      message: `location が上限を超えています（上限${LIMITS.LOCATION_MAX}文字）。短縮して再実行してください。`,
    })
    .optional()
    .describe("場所（任意）"),
  notification_offset_1: z.enum(NOTIFICATION_OFFSETS, {
    errorMap: () => ({
      message: `notification_offset_1 は ${NOTIFICATION_OFFSETS.join(" / ")} のいずれかで指定して再実行してください。`,
    }),
  }).optional().describe("通知タイミング1（任意）"),
  notification_offset_2: z.enum(NOTIFICATION_OFFSETS, {
    errorMap: () => ({
      message: `notification_offset_2 は ${NOTIFICATION_OFFSETS.join(" / ")} のいずれかで指定して再実行してください。`,
    }),
  }).optional().describe("通知タイミング2（任意）"),
})

export const addPersistentTodoSchema = z.object({
  title: z.string().trim()
    .min(1, { message: "title は必須です。1文字以上を指定して再実行してください。" })
    .max(LIMITS.TITLE_MAX, {
      message: `title が上限を超えています（上限${LIMITS.TITLE_MAX}文字）。${LIMITS.TITLE_MAX}文字以内に短縮して再実行してください。`,
    })
    .describe("持ち越しTODOのタイトル"),
  scheduled_time: z.string()
    .regex(PATTERNS.TIME, {
      message: "scheduled_time の形式が不正です。HH:MM（24時間表記、例 09:30）で指定して再実行してください。",
    })
    .optional()
    .describe("予定時刻"),
})

// ──────────────────────────────────────────────────────────────────────────────
// ツール登録
// ──────────────────────────────────────────────────────────────────────────────

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
    addTodoSchema.shape,
    async ({ title, scheduled_time, location }) => {
      // 強制層: 実測値付きエラーメッセージ（予防層をすり抜けた場合の保険）
      if (title.length > LIMITS.TITLE_MAX) {
        return validationError(`[title] 上限${LIMITS.TITLE_MAX}文字を超えています（入力${title.length}文字）。${LIMITS.TITLE_MAX}文字以内に短縮して再実行してください。`)
      }
      if (location !== undefined && location.length > LIMITS.LOCATION_MAX) {
        return validationError(`[location] 上限${LIMITS.LOCATION_MAX}文字を超えています（入力${location.length}文字）。短縮して再実行してください。`)
      }
      if (scheduled_time !== undefined && !PATTERNS.TIME.test(scheduled_time)) {
        return validationError(`[scheduled_time] 形式が不正です（入力: "${scheduled_time}"）。HH:MM（24時間表記、例 09:30）で指定して再実行してください。`)
      }

      const templateId = await getTemplateId()
      if (templateId === null) {
        return { content: [{ type: "text", text: "テンプレートが見つかりません" }] }
      }

      const data = await apiRequest("POST", "/logs/standalone", {
        title,
        scheduled_time: ceilToNextSlot(scheduled_time),
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
    completeTodoSchema.shape,
    async ({ todo_id }) => {
      // 強制層
      if (!Number.isInteger(todo_id) || todo_id <= 0) {
        return validationError(`[todo_id] 正の整数で指定してください（入力: ${todo_id}）。get_today_todos で正しい ID を確認して再実行してください。`)
      }

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
    addScheduledTodoSchema.shape,
    async ({ title, scheduled_date, scheduled_time, location, notification_offset_1, notification_offset_2 }) => {
      // 強制層
      if (title.length > LIMITS.TITLE_MAX) {
        return validationError(`[title] 上限${LIMITS.TITLE_MAX}文字を超えています（入力${title.length}文字）。${LIMITS.TITLE_MAX}文字以内に短縮して再実行してください。`)
      }
      if (!PATTERNS.DATE.test(scheduled_date)) {
        return validationError(`[scheduled_date] 形式が不正です（入力: "${scheduled_date}"）。YYYY-MM-DD（例 2024-12-31）で指定して再実行してください。`)
      }
      if (scheduled_time !== undefined && !PATTERNS.TIME.test(scheduled_time)) {
        return validationError(`[scheduled_time] 形式が不正です（入力: "${scheduled_time}"）。HH:MM（24時間表記、例 09:30）で指定して再実行してください。`)
      }
      if (location !== undefined && location.length > LIMITS.LOCATION_MAX) {
        return validationError(`[location] 上限${LIMITS.LOCATION_MAX}文字を超えています（入力${location.length}文字）。短縮して再実行してください。`)
      }

      const data = await apiRequest("POST", "/scheduled-todos", {
        title,
        scheduled_date,
        scheduled_time: ceilToNextSlot(scheduled_time),
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
    addPersistentTodoSchema.shape,
    async ({ title, scheduled_time }) => {
      // 強制層
      if (title.length > LIMITS.TITLE_MAX) {
        return validationError(`[title] 上限${LIMITS.TITLE_MAX}文字を超えています（入力${title.length}文字）。${LIMITS.TITLE_MAX}文字以内に短縮して再実行してください。`)
      }
      if (scheduled_time !== undefined && !PATTERNS.TIME.test(scheduled_time)) {
        return validationError(`[scheduled_time] 形式が不正です（入力: "${scheduled_time}"）。HH:MM（24時間表記、例 09:30）で指定して再実行してください。`)
      }

      const data = await apiRequest("POST", "/persistent-todos", {
        title,
        scheduled_time: ceilToNextSlot(scheduled_time),
      })
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      }
    }
  )
}
