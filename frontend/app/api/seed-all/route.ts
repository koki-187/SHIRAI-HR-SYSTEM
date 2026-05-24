/**
 * GET /api/seed-all
 * 全シードエリア（25都市）× 13ヶ月分の推計ADRデータを price_snapshots に一括投入する。
 * 都市別係数（観光庁宿泊旅行統計ベース）を使用した高精度推計。
 * 初回のみ実行。2回目以降は ON CONFLICT DO NOTHING で重複をスキップ。
 *
 * 認証: Authorization: Bearer ${CRON_SECRET}（CRON_SECRET未設定時は開発環境として許可）
 */
import { NextRequest, NextResponse } from 'next/server';
import { initSchema, bulkInsertSnapshots, getSnapshotCount, toAreaKey } from '@/lib/db';
import { SEED_AREAS, generateCityAwareRows } from '@/lib/historical-seed';

function auth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') return false;
    return true; // dev only
  }
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initSchema();

    const results: Array<{ area: string; inserted: number; skipped: number }> = [];
    let totalInserted = 0;
    let totalSkipped  = 0;

    for (const area of SEED_AREAS) {
      const areaKey   = toAreaKey(area.lat, area.lng);
      const before    = await getSnapshotCount(areaKey);

      // 13ヶ月分の推計データを生成（都市別係数使用）
      const rows = generateCityAwareRows(
        areaKey,
        area.name,
        area.baseADR,
        area.count,
        13,
      );

      await bulkInsertSnapshots(rows);

      const after   = await getSnapshotCount(areaKey);
      const inserted = after - before;
      const skipped  = rows.length - inserted;

      results.push({ area: area.name, inserted, skipped });
      totalInserted += inserted;
      totalSkipped  += skipped;
    }

    const summary = {
      ok: true,
      total_areas:    SEED_AREAS.length,
      total_inserted: totalInserted,
      total_skipped:  totalSkipped,
      months_per_area: 13,
      expected_total: SEED_AREAS.length * 13,
      coverage_pct:   Math.round((totalInserted + totalSkipped) / (SEED_AREAS.length * 13) * 100),
      results,
    };

    console.log('[seed-all] complete:', JSON.stringify(summary));
    return NextResponse.json(summary);
  } catch (e: any) {
    console.error('[seed-all] fatal:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
