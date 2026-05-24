/**
 * GET /api/occ?lat=xx.xx&lng=yy.yy
 * 観光庁宿泊旅行統計（e-Stat）から近隣エリアの客室稼働率を返す
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchOccByCoords, isEstatEnabled } from '@/lib/estat';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat/lng required' }, { status: 400 });
  }

  if (!isEstatEnabled()) {
    return NextResponse.json({
      ok: false,
      source: 'none',
      message: 'ESTAT_API_KEY が未設定です。e-Stat APIキーを環境変数に設定してください。',
      occ: null,
    });
  }

  try {
    const occ = await fetchOccByCoords(lat, lng);
    if (!occ) {
      return NextResponse.json({
        ok: false,
        source: 'estat',
        message: 'このエリアのOCCデータが取得できませんでした',
        occ: null,
      });
    }

    return NextResponse.json({
      ok: true,
      source: 'estat',
      sourceLabel: '観光庁宿泊旅行統計（e-Stat）',
      prefCode: occ.prefCode,
      prefName: occ.prefName,
      occRate: occ.occRate,
      dataLabel: occ.dataLabel,
      note: '観光庁「宿泊旅行統計調査」都道府県別月次データ（政府統計）',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
