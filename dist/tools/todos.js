import { z } from "zod";
import { apiRequest } from "../client.js";
export const registerTodoTools = (server) => {
    server.tool("get_today_todos", "今日のTODO一覧を取得する", {}, async () => {
        const data = await apiRequest("GET", "/todos/today");
        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
    });
    server.tool("add_todo", "今日のTODOを追加する", {
        title: z.string().describe("TODOのタイトル"),
        scheduled_time: z.string().optional().describe("予定時刻（HH:MM形式）"),
        location: z.string().optional().describe("場所"),
    }, async ({ title, scheduled_time, location }) => {
        const data = await apiRequest("POST", "/todos", {
            title,
            scheduled_time,
            location,
        });
        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
    });
    server.tool("complete_todo", "TODOを完了にする", {
        todo_id: z.number().describe("完了にするTODOのID"),
    }, async ({ todo_id }) => {
        const data = await apiRequest("PATCH", `/todos/${todo_id}/complete`);
        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
    });
    server.tool("get_persistent_todos", "持ち越しTODO一覧を取得する", {}, async () => {
        const data = await apiRequest("GET", "/todos/persistent");
        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
    });
    server.tool("add_persistent_todo", "持ち越しTODOを追加する", {
        title: z.string().describe("持ち越しTODOのタイトル"),
        scheduled_time: z.string().optional().describe("予定時刻"),
    }, async ({ title, scheduled_time }) => {
        const data = await apiRequest("POST", "/todos/persistent", {
            title,
            scheduled_time,
        });
        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
    });
};
