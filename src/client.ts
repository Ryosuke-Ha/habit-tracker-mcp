import fetch from "node-fetch"

const API_URL = process.env.HABIT_TRACKER_API_URL
const API_KEY = process.env.HABIT_TRACKER_API_KEY
const USER_EMAIL = process.env.HABIT_TRACKER_USER_EMAIL

export const apiRequest = async (
  method: string,
  path: string,
  body?: unknown
) => {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY || "",
      "X-User-Email": USER_EMAIL || "",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}
