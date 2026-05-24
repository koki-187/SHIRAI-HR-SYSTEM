# PWA Icons

以下のファイルを配置してください：
- `icon-192.png` — 192×192px PNG（マスカブル対応推奨）
- `icon-512.png` — 512×512px PNG（マスカブル対応推奨）

アイコンは `app/apple-icon.tsx` の ImageResponse と同じデザインを PNG 書き出しして配置してください。
暫定的には `app/icon.tsx` / `app/apple-icon.tsx` が自動生成するため、manifest の icons パスと一致させる必要があります。
