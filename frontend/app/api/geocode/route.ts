import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 });

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/geocode/?q=${encodeURIComponent(q)}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return NextResponse.json({ error: 'Backend error' }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'バックエンドサーバーに接続できません' }, { status: 503 });
  }
}
