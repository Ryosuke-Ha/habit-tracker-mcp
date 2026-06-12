# habit-tracker-mcp

habit-tracker FastAPI バックエンド用の MCP サーバー。

## セットアップ

```bash
cp .env.example .env
# .env を編集して環境変数を設定

npm install
npm run build
```

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `HABIT_TRACKER_API_URL` | FastAPI サーバーの URL（例: `http://localhost:8000`） |
| `HABIT_TRACKER_API_KEY` | API キー |
| `HABIT_TRACKER_USER_EMAIL` | ユーザーのメールアドレス |

## 利用可能なツール

### TODO 関連
- `get_today_todos` - 今日の TODO 一覧を取得
- `add_todo` - 今日の TODO を追加
- `complete_todo` - TODO を完了にする
- `get_persistent_todos` - 持ち越し TODO 一覧を取得
- `add_persistent_todo` - 持ち越し TODO を追加

### 振り返り関連
- `get_weekly_summary` - 今週の振り返りデータを取得（達成率・KPT）
- `add_kpt_item` - 今週の KPT にアイテムを追加
- `get_monthly_stats` - 今月の達成率・streak を取得

### コーチング関連
- `get_coaching_session` - 今週のコーチングセッション情報を取得
- `start_coaching` - 新しいコーチングセッションを開始

## Claude.ai Integrations での使用

ビルド後、`dist/index.js` を MCP サーバーのエントリーポイントとして指定する。

```json
{
  "command": "node",
  "args": ["/path/to/habit-tracker-mcp/dist/index.js"],
  "env": {
    "HABIT_TRACKER_API_URL": "http://localhost:8000",
    "HABIT_TRACKER_API_KEY": "your_api_key",
    "HABIT_TRACKER_USER_EMAIL": "your_email@example.com"
  }
}
```
