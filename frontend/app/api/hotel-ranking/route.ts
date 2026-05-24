/**
 * GET /api/hotel-ranking?lat=xx&lng=yy&genre=all
 * 楽天トラベル ホテルランキングを返す
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hotelRanking, latLngToPref } from '@/lib/rakuten';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // レート制限チェック
  const userId = (session.user as any)?.id;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? undefined;
  const rl = checkRateLimit(getIdentifier(userId, ip), 'hotel-ranking');
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'リクエスト数の上限に達しました。しばらくお待ちください。' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const lat   = parseFloat(searchParams.get('lat')   ?? '');
  const lng   = parseFloat(searchParams.get('lng')   ?? '');
  const genre = (searchParams.get('genre') ?? 'all') as 'all' | 'hotel' | 'business' | 'resort';

  if (!process.env.RAKUTEN_APP_ID) {
    return NextResponse.json({ error: 'RAKUTEN_APP_ID not configured', hotels: [] });
  }

  try {
    const prefecture = (!isNaN(lat) && !isNaN(lng)) ? latLngToPref(lat, lng) : '13';
    const hotels = await hotelRanking({ genre, prefecture, lat: isNaN(lat) ? undefined : lat, lng: isNaN(lng) ? undefined : lng });

    return NextResponse.json({
      ok: true,
      source: 'rakuten_ranking',
      sourceLabel: '楽天トラベル ホテルランキング',
      prefecture,
      genre,
      hotels,
      count: hotels.length,
    });
  } catch (e: any) {
    console.error('[hotel-ranking]', e);
    return NextResponse.json({ error: '処理中にエラーが発生しました', hotels: [] }, { status: 500 });
  }
}
