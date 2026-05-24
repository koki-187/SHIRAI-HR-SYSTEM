import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail } from '@/lib/db';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  // IPベースのレート制限
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? undefined;
  const rl = checkRateLimit(getIdentifier(undefined, ip), 'register');
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'リクエスト数の上限に達しました。しばらくお待ちください。' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: '全項目を入力してください' }, { status: 400 });
    }

    // メール形式バリデーション
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: '有効なメールアドレスを入力してください' }, { status: 400 });
    }

    // パスワード最低8文字チェック
    if (password.length < 8) {
      return NextResponse.json({ error: 'パスワードは8文字以上で入力してください' }, { status: 400 });
    }

    // アカウント列挙防止: 既存メールでも同一レスポンスを返す
    const existing = await getUserByEmail(email);
    if (!existing) {
      const hash = await bcrypt.hash(password, 12);
      await createUser(email, hash, name);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[register] error:', e);
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 });
  }
}
