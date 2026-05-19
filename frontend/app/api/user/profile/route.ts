import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateGeminiKey, getGeminiKey } from '@/lib/db';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt((session.user as any).id);
  const enc = await getGeminiKey(userId);
  const hasKey = !!enc;
  // キーが存在する場合は「設定済み」だけ返す（平文は返さない）
  return NextResponse.json({ hasKey, maskedKey: hasKey ? '●●●●●●●●●●●●●●●●' : null });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt((session.user as any).id);
  const { apiKey } = await req.json();

  if (!apiKey) {
    // 削除
    await updateGeminiKey(userId, null);
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (!apiKey.startsWith('AIza') || apiKey.length < 20) {
    return NextResponse.json({ error: '無効なAPIキー形式です' }, { status: 400 });
  }

  const encrypted = encryptApiKey(apiKey);
  await updateGeminiKey(userId, encrypted);
  return NextResponse.json({ ok: true });
}

// 内部専用: APIキーを復号して返す（サーバーサイドのみ）
export async function getDecryptedApiKey(userId: number): Promise<string | null> {
  const enc = await getGeminiKey(userId);
  if (!enc) return null;
  try {
    return decryptApiKey(enc);
  } catch {
    return null;
  }
}
