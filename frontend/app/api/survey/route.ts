import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGeminiKey } from '@/lib/db';
import { decryptApiKey } from '@/lib/crypto';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    // サーバー側でAPIキーを取得（クライアントから送られたキーより優先）
    let geminiKey = body.gemini_api_key || '';
    if (!geminiKey && !(session.user as any).isAdmin) {
      const userId = parseInt((session.user as any).id);
      const enc = await getGeminiKey(userId);
      if (enc) {
        try { geminiKey = decryptApiKey(enc); } catch { /* fallback */ }
      }
    }

    const res = await fetch(`${BACKEND_URL}/api/scrape/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: body.location,
        check_in: body.check_in,
        check_out: body.check_out,
        hotel_type: body.hotel_type,
        radius_km: body.radius_km,
        gemini_api_key: geminiKey,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (e: any) {
    if (e?.name === 'TimeoutError') {
      return NextResponse.json({ error: 'バックエンドがタイムアウトしました（120秒）' }, { status: 504 });
    }
    return NextResponse.json(
      { error: 'バックエンドサーバーに接続できません。管理者にお問い合わせください。' },
      { status: 503 }
    );
  }
}
