import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { registerTodoTools } from "./tools/todos.js";
import { registerReviewTools } from "./tools/reviews.js";
import { registerCoachingTools } from "./tools/coaching.js";
import http from "http";
const PORT = parseInt(process.env.PORT || "8080");
// セッションごとにtransportを管理
const transports = new Map();
const httpServer = http.createServer(async (req, res) => {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }
    // ヘルスチェック
    if (req.url === "/health" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", name: "habit-tracker-mcp" }));
        return;
    }
    // SSE接続エンドポイント
    if (req.url === "/sse" && req.method === "GET") {
        const server = new McpServer({
            name: "habit-tracker",
            version: "1.0.0",
        });
        registerTodoTools(server);
        registerReviewTools(server);
        registerCoachingTools(server);
        const transport = new SSEServerTransport("/message", res);
        transports.set(transport.sessionId, transport);
        res.on("close", () => {
            transports.delete(transport.sessionId);
        });
        await server.connect(transport);
        return;
    }
    // メッセージ受信エンドポイント
    if (req.url?.startsWith("/message") && req.method === "POST") {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const sessionId = url.searchParams.get("sessionId");
        if (!sessionId) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "sessionId is required" }));
            return;
        }
        const transport = transports.get(sessionId);
        if (!transport) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Session not found" }));
            return;
        }
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", async () => {
            try {
                await transport.handlePostMessage(req, res, JSON.parse(body));
            }
            catch (e) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: String(e) }));
            }
        });
        return;
    }
    res.writeHead(404);
    res.end("Not found");
});
httpServer.listen(PORT, "0.0.0.0", () => {
    console.error(`habit-tracker MCP server running on port ${PORT}`);
});
