/**
 * JSTでの現在日時を取得するユーティリティ
 * RailwayはUTCで動作するため、必ずこの関数を使うこと
 */

const JST_OFFSET = 9 * 60 * 60 * 1000 // 9時間をミリ秒で

/**
 * JSTでの現在日付をYYYY-MM-DD形式で返す
 */
export function getJSTDateString(): string {
  const now = new Date()
  const jstDate = new Date(now.getTime() + JST_OFFSET)
  return jstDate.toISOString().split('T')[0]
}

/**
 * JSTでの現在の曜日を返す
 * 0=日曜, 1=月曜, ..., 6=土曜
 */
export function getJSTDayOfWeek(): number {
  const now = new Date()
  const jstDate = new Date(now.getTime() + JST_OFFSET)
  return jstDate.getUTCDay()
}

/**
 * JSTで平日かどうかを返す
 */
export function isJSTWeekday(): boolean {
  const day = getJSTDayOfWeek()
  return day >= 1 && day <= 5
}

/**
 * JSTでの曜日キーを返す
 * 例: "monday", "tuesday", ...
 */
export function getJSTDayKey(): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  return days[getJSTDayOfWeek()]
}

/**
 * JSTで指定日数後の日付をYYYY-MM-DD形式で返す
 */
export function getJSTDateAfterDays(days: number): string {
  const now = new Date()
  const jstDate = new Date(now.getTime() + JST_OFFSET + days * 24 * 60 * 60 * 1000)
  return jstDate.toISOString().split('T')[0]
}

/**
 * JSTで今日の日付をYYYY-MM-DD形式で返す（getJSTDateStringのエイリアス）
 */
export function getJSTToday(): string {
  return getJSTDateString()
}

/**
 * JSTで明日の日付をYYYY-MM-DD形式で返す
 */
export function getJSTTomorrow(): string {
  return getJSTDateAfterDays(1)
}

/** 丸め間隔（分） - ここを変えると全エンドポイントに反映される */
export const ROUND_INTERVAL_MINUTES = 30

/**
 * 総秒数（0–86399）を ROUND_INTERVAL_MINUTES 単位でceil丸めし、HH:MM 文字列を返す。
 * ちょうどの枠（秒数が interval の倍数）はそのまま返す。
 * 24時をまたぐ場合は 00:MM にロールオーバーする。
 * テストから直接呼べるようにエクスポートする。
 */
export function ceilTimeSeconds(totalSeconds: number): string {
  const intervalSeconds = ROUND_INTERVAL_MINUTES * 60
  const ceiledSeconds =
    totalSeconds % intervalSeconds === 0
      ? totalSeconds
      : Math.ceil(totalSeconds / intervalSeconds) * intervalSeconds
  const wrapped = ceiledSeconds % (24 * 3600)
  const h = Math.floor(wrapped / 3600)
  const m = Math.floor((wrapped % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * 時刻パラメータ（HH:MM）のデフォルト補完。
 * - 値が渡されている場合はそのまま返す。
 * - 未指定 / null / 空文字の場合、現在JST時刻を ROUND_INTERVAL_MINUTES 単位で
 *   切り上げた時刻（HH:MM）を返す。
 */
export function ceilToNextSlot(time?: string | null): string {
  if (time != null && time !== '') {
    return time
  }

  const now = new Date()
  const jstNow = new Date(now.getTime() + JST_OFFSET)
  const h = jstNow.getUTCHours()
  const m = jstNow.getUTCMinutes()
  const s = jstNow.getUTCSeconds()
  return ceilTimeSeconds(h * 3600 + m * 60 + s)
}
