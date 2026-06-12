import { apiRequest } from "../client.js";
export const registerCoachingTools = (server) => {
    server.tool("get_coaching_session", "今週のコーチングセッション情報を取得する", {}, async () => {
        const data = await apiRequest("GET", "/coaching/session");
        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
    });
    server.tool("start_coaching", "新しいコーチングセッションを開始する", {}, async () => {
        const data = await apiRequest("POST", "/coaching/session");
        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
    });
};
