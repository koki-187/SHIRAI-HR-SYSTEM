# CLAUDE.md — HotelScope

## Tech Stack
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Backend: Python FastAPI
- AI: Gemini API (google-generativeai)
- Auth: NextAuth.js (Credentials Provider) + bcryptjs
- DB: SQLite (better-sqlite3) ※ローカル永続化
- Map: Leaflet + OpenStreetMap
- Export: jsPDF + xlsx
- Deploy: Vercel (Frontend) + Railway or Render (Backend)

## Project Overview
ホテル土地仕入れ判断のための周辺ホテル料金市場調査システム。
Booking.com等からスクレイピングした料金データをGemini AIで多角的に分析し、
過去1年の価格推移・要因分析・競合比較をビジュアル表示する。

## Directory Structure
```
hotelscope/
├── frontend/          # Next.js App
│   ├── app/
│   │   ├── api/       # API Routes (Auth)
│   │   ├── login/
│   │   ├── dashboard/
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/
│   └── types/
├── backend/           # FastAPI
│   ├── main.py
│   ├── routers/
│   ├── services/
│   └── models/
└── CLAUDE.md
```

## Claude Development Rules

### 基本原則
- コミットメッセージは英語（Conventional Commits形式）
- 破壊的変更の前に必ず確認を取る
- 本番環境への変更は明示的な指示があるまで行わない
- APIキーは絶対にコードにハードコードしない

### ファイル・ディレクトリ規則
- 環境変数は `.env.local`（frontend）/ `.env`（backend）に記載、コミット禁止
- 機密情報を絶対にコミットしない
- スクレイピングは相場調査目的のみ・商用利用禁止

### 開発フロー
1. 変更前に現状を確認・報告
2. 小さな単位でコミット
3. エラーは原因を3段階で分析してから修正
4. 完了後に変更サマリーを日本語で報告

### HotelScope固有ルール
- GeminiAPIキーはユーザーごとにフロントから送信（サーバー保管しない）
- スクレイピングは1リクエスト/3秒以上の間隔を守る
- DBはSQLiteで十分（ユーザー数2〜3人）
