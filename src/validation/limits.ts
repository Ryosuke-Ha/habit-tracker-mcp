// TODO: backendのDB制約と要整合 - 以下はすべて暫定値
export const LIMITS = {
  TITLE_MAX: 200,
  LOCATION_MAX: 100,
  KPT_CONTENT_MAX: 500,
} as const

export const PATTERNS = {
  /** HH:MM 24時間表記 */
  TIME: /^([01]\d|2[0-3]):[0-5]\d$/,
  /** YYYY-MM-DD（月01-12, 日01-31） */
  DATE: /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/,
} as const

/** 通知オフセットの有効値（add_scheduled_todo の notification_offset_* で使用） */
export const NOTIFICATION_OFFSETS = [
  "on_time",
  "30min_before",
  "1hour_before",
  "2hour_before",
  "1day_before",
  "2day_before",
] as const

/**
 * AIが読んで自己修正できる形式のエラー tool result を返す。
 * 〔どのパラメータが〕〔上限〕〔実測値〕〔どう直すか〕を含む文面を渡すこと。
 */
export function validationError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  }
}
