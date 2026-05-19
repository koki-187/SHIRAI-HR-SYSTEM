import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveHistory, getHistory, deleteHistory } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = parseInt((session.user as any).id);
  return NextResponse.json(await getHistory(userId));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = parseInt((session.user as any).id);
  const { id, location, search_address, params, result } = await req.json();
  await saveHistory(userId, id, location, search_address, params, result);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = parseInt((session.user as any).id);
  const { id } = await req.json();
  await deleteHistory(id, userId);
  return NextResponse.json({ ok: true });
}
