/**
 * GET /api/snapshots?lat=xx&lng=yy&months=13
 * 指定座標のエリアの過去ADRスナップショットを返す。
 * データが存在しない場合は推計シードデータを自動投入してから返す。
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  initSchema,
  toAreaKey,
  getSnapshots,
  getSnapshotCount,
  bulkInsertSnapshots,
} from '@/lib/db';
import { generateCityAwareRows, SEED_AREAS } from '@/lib/historical-seed';

// ─────────────────────────────────────────
// 最近傍シードエリアを探す
// ─────────────────────────────────────────
function findNearestSeedArea(lat: number, lng: number) {
  let best: (typeof SEED_AREAS)[number] | null = null;
  let bestDist = Infinity;
  for (const area of SEED_AREAS) {
    const d = Math.sqrt((area.lat - lat) ** 2 + (area.lng - lng) ** 2);
    if (d < bestDist) { bestDist = d; best = area; }
  }
  // 約 50km 以内（緯度経度差 ≈ 0.45°）のみマッチとする
  return bestDist < 0.45 ? best : null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lat    = parseFloat(searchParams.get('lat')    ?? '');
  const lng    = parseFloat(searchParams.get('lng')    ?? '');
  const months = parseInt(searchParams.get('months')   ?? '13');

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat/lng required' }, { status: 400 });
  }

  try {
    await initSchema();

    const areaKey = toAreaKey(lat, lng);
    let count = await getSnapshotCount(areaKey);

    // データが少ない場合 → 推計シードデータを自動投入
    if (count < 6) {
      const nearest = findNearestSeedArea(lat, lng);
      if (nearest) {
        const seedKey = toAreaKey(nearest.lat, nearest.lng);
        const seedCount = await getSnapshotCount(seedKey);

        if (seedCount < 6) {
          // シードエリア自身のデータも未投入 → 両方投入
          const seedRows = generateCityAwareRows(
            seedKey, nearest.name, nearest.baseADR, nearest.count,
          );
          await bulkInsertSnapshots(seedRows);
        }

        // 検索エリアがシードエリアとほぼ同一でない場合は別途投入
        if (areaKey !== seedKey && count < 6) {
          const rows = generateCityAwareRows(
            areaKey,
            nearest.name,
            nearest.baseADR,
            nearest.count,
          );
          await bulkInsertSnapshots(rows);
        }
        count = await getSnapshotCount(areaKey);
      }

      // シードエリアに近くない場合もクエリエリアキーで投入
      if (count < 6) {
        // 中央値的なADR（地方都市想定）
        const fallbackRows = generateCityAwareRows(areaKey, '調査エリア', 10000, 8);
        await bulkInsertSnapshots(fallbackRows);
      }
    }

    const rows = await getSnapshots(areaKey, months);
    return NextResponse.json({ area_key: areaKey, snapshots: rows });
  } catch (e: any) {
    console.error('[snapshots] error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
