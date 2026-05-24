/**
 * GET /api/adr-report?lat=xx.xx&lng=yy.yy&months=13
 * 仕入れ判断用 年間ADRレポートを返す。
 * price_snapshots + hotel_prices から集計。データなし時は自動シード投入。
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  initSchema, toAreaKey, getAnnualADRReport,
  getSnapshotCount, bulkInsertSnapshots,
} from '@/lib/db';
import { SEED_AREAS, generateCityAwareRows } from '@/lib/historical-seed';

function findNearestArea(lat: number, lng: number) {
  let best: (typeof SEED_AREAS)[number] | null = null;
  let bestDist = Infinity;
  for (const area of SEED_AREAS) {
    const d = Math.sqrt((area.lat - lat) ** 2 + (area.lng - lng) ** 2);
    if (d < bestDist) { bestDist = d; best = area; }
  }
  return bestDist < 0.45 ? best : null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lat    = parseFloat(searchParams.get('lat')    ?? '');
  const lng    = parseFloat(searchParams.get('lng')    ?? '');
  const months = Math.min(parseInt(searchParams.get('months') ?? '13', 10), 24);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  try {
    await initSchema();
    const areaKey = toAreaKey(lat, lng);

    // データ不足なら自動シード投入（都市別係数使用）
    let isSynthesized = false;
    let count = await getSnapshotCount(areaKey);
    if (count < 6 && process.env.NODE_ENV !== 'production') {
      // 開発環境のみ: 自動シード投入
      const nearest = findNearestArea(lat, lng);
      if (nearest) {
        const seedKey = toAreaKey(nearest.lat, nearest.lng);
        const seedCount = await getSnapshotCount(seedKey);
        if (seedCount < 6) {
          const rows = generateCityAwareRows(seedKey, nearest.name, nearest.baseADR, nearest.count, months);
          await bulkInsertSnapshots(rows);
        }
        if (areaKey !== seedKey) {
          const rows = generateCityAwareRows(areaKey, nearest.name, nearest.baseADR, nearest.count, months);
          await bulkInsertSnapshots(rows);
        }
      } else {
        const rows = generateCityAwareRows(areaKey, '調査エリア', 12000, 8, months);
        await bulkInsertSnapshots(rows);
      }
      // シード投入後にcountを再取得して data_available 判定を最新化
      count = await getSnapshotCount(areaKey);
    } else if (count < 6) {
      isSynthesized = true; // 本番ではデータ不足フラグのみ
    }

    const report = await getAnnualADRReport(areaKey);

    // 12ヶ月カレンダー形式に整形（UI用）
    const monthlyCalendar = Array.from({ length: 12 }, (_, i) => {
      const m    = i + 1;
      const snap = report.snapshot_months.find((r: any) => Number(r.month) === m) as any;
      const hp   = report.hotel_prices_monthly.find((r: any) => Number(r.month) === m) as any;
      return {
        month:       m,
        weekday_adr: snap ? Number(snap.weekday_avg) : null,
        weekend_adr: snap ? Number(snap.weekend_avg) : null,
        peak_adr:    snap ? (Number(snap.peak_avg) || null) : null,
        min_adr:     snap ? Number(snap.min_adr)    : null,
        max_adr:     snap ? Number(snap.max_adr)    : null,
        avg_adr:     snap ? Number(snap.avg_adr)    : null,
        hotel_count: snap ? Number(snap.hotel_count): null,
        data_source: snap ? snap.data_source        : null,
        // 実測hotel_pricesがあれば上書き
        real_avg:    hp   ? Number(hp.avg_price)    : null,
        real_sample: hp   ? Number(hp.sample_size)  : null,
      };
    });

    return NextResponse.json({
      ...report,
      monthly_calendar: monthlyCalendar,
      area_key: areaKey,
      is_synthesized: isSynthesized,
      data_available: count >= 6,
    });

  } catch (e: any) {
    console.error('[adr-report]', e);
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 });
  }
}
