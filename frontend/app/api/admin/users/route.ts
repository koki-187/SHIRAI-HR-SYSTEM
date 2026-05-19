import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllUsers, setUserActive, deleteUser } from '@/lib/db';

function requireAdmin(session: any) {
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;
  const users = await getAllUsers();
  return NextResponse.json(users);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;
  const { userId, active } = await req.json();
  await setUserActive(userId, active);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;
  const { userId } = await req.json();
  await deleteUser(userId);
  return NextResponse.json({ ok: true });
}
