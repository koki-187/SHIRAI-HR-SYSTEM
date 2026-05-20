import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 });

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HotelScope/1.0 (navigator.koki@gmail.com)' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return NextResponse.json({ error: `Nominatim error: ${res.status}` }, { status: 502 });
    const results = await res.json();
    if (!results.length) return NextResponse.json({ error: `住所が見つかりませんでした: ${q}` }, { status: 404 });
    const hit = results[0];
    return NextResponse.json({
      lat: parseFloat(hit.lat),
      lng: parseFloat(hit.lon),
      display_name: hit.display_name,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'ジオコーディングエラー' }, { status: 502 });
  }
}
