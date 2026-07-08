/**
 * JSTでの現在日時を取得するユーティリティ
 * RailwayはUTCで動作するため、必ずこの関数を使うこと
 */
const JST_OFFSET = 9 * 60 * 60 * 1000; // 9時間をミリ秒で
/**
 * JSTでの現在日付をYYYY-MM-DD形式で返す
 */
export function getJSTDateString() {
    const now = new Date();
    const jstDate = new Date(now.getTime() + JST_OFFSET);
    return jstDate.toISOString().split('T')[0];
}
/**
 * JSTでの現在の曜日を返す
 * 0=日曜, 1=月曜, ..., 6=土曜
 */
export function getJSTDayOfWeek() {
    const now = new Date();
    const jstDate = new Date(now.getTime() + JST_OFFSET);
    return jstDate.getUTCDay();
}
/**
 * JSTで平日かどうかを返す
 */
export function isJSTWeekday() {
    const day = getJSTDayOfWeek();
    return day >= 1 && day <= 5;
}
