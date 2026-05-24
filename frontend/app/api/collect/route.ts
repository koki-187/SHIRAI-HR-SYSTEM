/**
 * GET /api/collect
 * Vercel Cron Job から呼ばれる日次データ収集エンドポイント。
 * 全シードエリアについて、今後12週分の土曜チェックイン日を楽天トラベルAPIで照会し、
 * hotel_prices テーブルに保存する。楽天失敗時はシードデータにフォールバック。
 *
 * 認証: Authorization: Bearer ${CRON_SECRET}
 * Cron schedule: 0 21 * * * (JST 06:00 = UTC 21:00)
 * 環境変数: CRON_SECRET, RAKUTEN_APP_ID (任意)
 */
import { NextRequest, NextResponse } from 'next/server';
import { initSchema, toAreaKey, saveSnapshot, saveHotelPrice } from '@/lib/db';
import { SEED_AREAS } from '@/lib/historical-seed';
import { findSeedHotels, generateSeedMonthlyStats } from '@/lib/seed-hotels';
import type { HotelData } from '@/types';

// ---- 認証 ----
function auth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') return false;
    return true; // dev only
  }
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

// ---- 次のN回の土曜日を返す ----
function nextSaturdays(n: number, fromDate = new Date()): string[] {
  const dates: string[] = [];
  const d = new Date(fromDate);
  // 今日以降の最初の土曜へ進める
  const dayOfWeek = d.getDay(); // 0=日, 6=土
  const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
  d.setDate(d.getDate() + daysUntilSaturday);

  for (let i = 0; i < n; i++) {
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

// ---- レート制限付きスリープ ----
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---- 楽天トラベルAPI照会 ----
async function fetchRakutenForDate(
  lat: number, lng: number,
  checkIn: string,   // 'YYYY-MM-DD'
  checkOut: string,  // 'YYYY-MM-DD'
): Promise<HotelData[] | null> {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) return null;

  try {
    const params = new URLSearchParams({
      applicationId: appId,
      format:        'json',
      latitude:      String(lat),
      longitude:     String(lng),
      searchRadius:  '3',
      datumType:     '1',
      hits:          '30',
      sort:          'standard',
      checkinDate:   checkIn.replace(/-/g, ''),
      checkoutDate:  checkOut.replace(/-/g, ''),
    });

    const url = `https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426?${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.hotels || !Array.isArray(json.hotels)) return null;

    const hotels: HotelData[] = json.hotels
      .map((entry: any[]) => {
        const basic = entry.find((e: any) => e.hotelBasicInfo)?.hotelBasicInfo;
        if (!basic || !basic.hotelMinCharge) return null;
        return {
          name:            basic.hotelName || '不明',
          price_per_night: basic.hotelMinCharge,
          rating:          basic.reviewAverage ? parseFloat(basic.reviewAverage) : undefined,
          review_count:    basic.reviewCount || undefined,
          url:             basic.hotelInformationUrl || '',
          lat:             basic.latitude  ? parseFloat(basic.latitude)  : undefined,
          lng:             basic.longitude ? parseFloat(basic.longitude) : undefined,
          source:          'rakuten' as const,
        } satisfies HotelData;
      })
      .filter((h: HotelData | null): h is HotelData => h !== null);

    return hotels.length > 0 ? hotels : null;
  } catch {
    return null;
  }
}

// ---- チェックアウト日を計算（翌日） ----
function nextDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const t0 = Date.now();
  try {
    await initSchema();

    const today      = new Date().toISOString().split('T')[0];
    const saturdays  = nextSaturdays(12); // 12週分
    const hasRakuten = !!process.env.RAKUTEN_APP_ID;

    let totalHotelPrices = 0;
    let totalSnapshots   = 0;
    let totalErrors      = 0;
    const areaResults: Record<string, { rakuten: number; seed: number }> = {};

    for (const area of SEED_AREAS) {
      const areaKey = toAreaKey(area.lat, area.lng);
      areaResults[area.name] = { rakuten: 0, seed: 0 };

      // ── 1. 楽天APIで12週分の土曜を照会 ──
      if (hasRakuten) {
        for (const sat of saturdays) {
          try {
            const checkOut = nextDay(sat);
            const hotels   = await fetchRakutenForDate(area.lat, area.lng, sat, checkOut);

            if (hotels && hotels.length > 0) {
              // ホテル個別価格を保存
              for (const h of hotels) {
                try {
                  await saveHotelPrice({
                    hotelName:   h.name,
                    areaKey,
                    otaSource:   'rakuten',
                    checkinDate: sat,
                    queryDate:   today,
                    price:       h.price_per_night,
                    rating:      h.rating ?? null,
                    lat:         h.lat ?? null,
                    lng:         h.lng ?? null,
                  });
                  totalHotelPrices++;
                } catch { /* 個別保存失敗は継続 */ }
              }
              areaResults[area.name].rakuten++;

              // 直近土曜のデータをエリアスナップショットにも保存
              if (sat === saturdays[0]) {
                const avgADR = Math.round(hotels.reduce((s, h) => s + h.price_per_night, 0) / hotels.length);
                const minADR = Math.min(...hotels.map(h => h.price_per_night));
                const maxADR = Math.max(...hotels.map(h => h.price_per_night));
                try {
                  await saveSnapshot({
                    areaKey,
                    areaName:   area.name,
                    surveyDate: today,
                    avgAdr:     avgADR,
                    minAdr:     minADR,
                    maxAdr:     maxADR,
                    weekdayAvg: Math.round(avgADR * 0.85),
                    weekendAvg: avgADR,          // 土曜価格をweekendとして保存
                    peakAvg:    null,
                    hotelCount: hotels.length,
                    dataSource: 'rakuten',
                    checkinDate: sat,
                    otaSource:  'rakuten',
                  });
                  totalSnapshots++;
                } catch { /* スナップショット保存失敗は継続 */ }
              }
            }

            // レート制限: 3秒以上待機
            await sleep(3200);
          } catch (err) {
            console.error(`[collect] Rakuten ${area.name} ${sat}:`, err);
            totalErrors++;
            await sleep(3200);
          }
        }
      }

      // ── 2. シードデータでフォールバックスナップショット（楽天で取れなかった分） ──
      if (areaResults[area.name].rakuten === 0) {
        try {
          const hotels = findSeedHotels(area.lat, area.lng);
          if (hotels && hotels.length > 0) {
            const stats = generateSeedMonthlyStats(hotels);
            const thisMonth = new Date().getMonth();
            const stat = stats[thisMonth];
            if (stat) {
              const avgADR = Math.round(hotels.reduce((s, h) => s + h.price_per_night, 0) / hotels.length);
              await saveSnapshot({
                areaKey,
                areaName:   area.name,
                surveyDate: today,
                avgAdr:     avgADR,
                minAdr:     Math.min(...hotels.map(h => h.price_per_night)),
                maxAdr:     Math.max(...hotels.map(h => h.price_per_night)),
                weekdayAvg: stat.weekday_avg,
                weekendAvg: stat.weekend_avg,
                peakAvg:    stat.peak_avg ?? null,
                hotelCount: hotels.length,
                dataSource: 'seed',
                checkinDate: null,
                otaSource:  'seed',
              });
              totalSnapshots++;
              areaResults[area.name].seed++;
            }
          }
        } catch (err) {
          console.error(`[collect] seed fallback ${area.name}:`, err);
          totalErrors++;
        }
      }
    }

    const elapsed = Math.round((Date.now() - t0) / 1000);
    return NextResponse.json({
      ok:              true,
      date:            today,
      saturdays:       saturdays.slice(0, 3),      // 最初の3件のみログ
      hasRakuten,
      totalSnapshots,
      totalHotelPrices,
      totalErrors,
      elapsed_sec:     elapsed,
      areas:           areaResults,
    });

  } catch (e: any) {
    console.error('[collect] fatal:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Vercel Cron は GET リクエストで呼び出す
