import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGeminiKey } from '@/lib/db';
import { decryptApiKey } from '@/lib/crypto';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // ── レート制限チェック ──
  const userId = (session.user as any)?.id;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? undefined;
  const rl = checkRateLimit(getIdentifier(userId, ip), 'analyze');
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'リクエスト数の上限に達しました。しばらくお待ちください。' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const { prompt } = await req.json();
  if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });

  // APIキーをサーバー側で取得
  let apiKey = '';
  if ((session.user as any).isAdmin) {
    apiKey = process.env.ADMIN_GEMINI_KEY || '';
  } else {
    const userId = parseInt((session.user as any).id);
    const enc = await getGeminiKey(userId);
    if (enc) {
      try { apiKey = decryptApiKey(enc); } catch { /* fallback */ }
    }
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini APIキーが登録されていません。フォームの「登録する」からAPIキーを保存してください。' },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      console.error('[analyze] Gemini API error:', err);
      return NextResponse.json(
        { error: 'Gemini API でエラーが発生しました' },
        { status: res.status },
      );
    }

    const result = await res.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '分析結果が空です';
    return NextResponse.json({ text });
  } catch (e: any) {
    if (e?.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Gemini APIがタイムアウトしました' }, { status: 504 });
    }
    console.error('[analyze] unexpected error:', e);
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 });
  }
}
