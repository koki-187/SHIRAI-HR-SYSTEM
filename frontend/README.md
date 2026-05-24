# HotelScope Frontend

Next.js 14 (App Router) + TypeScript + Tailwind CSS で構築されたホテル市場調査システムのフロントエンドです。

## 環境変数の設定

### ローカル開発

```bash
cp .env.local.example .env.local
# .env.local を編集して各値を設定
```

### Vercel 本番デプロイ

Vercel ダッシュボード → プロジェクト → Settings → Environment Variables に以下を設定：

| 変数名 | 説明 | 必須 |
|---|---|---|
| `NEXTAUTH_SECRET` | JWT署名 + APIキー暗号化（`openssl rand -base64 32`） | ✅ |
| `ADMIN_EMAIL` | 管理者ログインメールアドレス | ✅ |
| `ADMIN_PASSWORD` | 管理者ログインパスワード | ✅ |
| `ADMIN_GEMINI_KEY` | 管理者用 Gemini API キー（[取得](https://aistudio.google.com/app/apikey)） | 推奨 |
| `RAKUTEN_APP_ID` | 楽天トラベル API ID（[取得](https://webservice.rakuten.co.jp/)） | 推奨 |
| `DATABASE_URL` | Neon PostgreSQL 接続文字列（未設定時はJSON） | 推奨 |
| `CRON_SECRET` | Cron保護シークレット（`openssl rand -hex 32`） | 任意 |

> ⚠️ `NEXTAUTH_SECRET` はローカルと本番で**同じ値**を使用してください（異なると暗号化済みAPIキーの復号に失敗します）
