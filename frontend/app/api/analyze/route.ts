import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGeminiKey } from '@/lib/db';
import { decryptApiKey } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: err.error?.message || 'Gemini API エラー' },
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
