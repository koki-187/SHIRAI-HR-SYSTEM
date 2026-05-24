import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGeminiKey, saveSnapshot, toAreaKey, initSchema } from '@/lib/db';
import { decryptApiKey } from '@/lib/crypto';
import { HotelData, MonthlyStats } from '@/types';
import { findSeedHotels, generateSeedMonthlyStats, attachRoomTypes } from '@/lib/seed-hotels';
import { fetchJalanHotels, toJalanDate } from '@/lib/jalan';
import { fetchBookingHotels, isBookingEnabled } from '@/lib/booking-com';
import { simpleHotelSearch, vacantHotelSearch } from '@/lib/rakuten';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';

// ---- Geocoding via Nominatim ----
async function geocode(location: string): Promise<{ lat: number; lng: number; display_name: string }> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'HotelScope/1.0 (navigator.koki@gmail.com)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  const results = await res.json();
  if (!results.length) throw new Error(`住所が見つかりませんでした: ${location}`);
  const hit = results[0];
  return { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon), display_name: hit.display_name };
}

// ---- Rakuten Travel API (Vacant優先・Simpleフォールバック) ----
async function fetchRakutenHotels(
  lat: number, lng: number,
  checkIn: string, checkOut: string,
  hotelType: string
): Promise<{ hotels: HotelData[]; source: 'rakuten_vacant' | 'rakuten' } | null> {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) return null;

  const opts = { lat, lng, checkIn, checkOut, hotelType, hits: 30, radius: 3 };

  // 日付あり → VacantHotelSearch（実際の空室料金）を優先
  if (checkIn && checkOut) {
    const vacant = await vacantHotelSearch(opts);
    if (vacant && vacant.length > 0) return { hotels: vacant, source: 'rakuten_vacant' };
  }

  // フォールバック: SimpleHotelSearch
  const simple = await simpleHotelSearch(opts);
  if (simple && simple.length > 0) return { hotels: simple, source: 'rakuten' };

  return null;
}

// ---- Monthly stats aggregation ----
function aggregateMonthlyStats(hotels: HotelData[], year = 2024): MonthlyStats[] {
  if (!hotels.length) return [];
  const seasonality: Record<number, number> = {
    1: 0.85, 2: 0.90, 3: 1.20, 4: 1.40, 5: 1.50,
    6: 0.95, 7: 1.30, 8: 1.60, 9: 1.10, 10: 1.25, 11: 1.05, 12: 1.35,
  };
  const basePrice = hotels.reduce((s, h) => s + h.price_per_night, 0) / hotels.length;
  const minPrice = Math.min(...hotels.map(h => h.price_per_night));
  const maxPrice = Math.max(...hotels.map(h => h.price_per_night));
  const peakMonths = new Set([3, 4, 5, 8, 12]);

  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const factor = seasonality[month] ?? 1.0;
    const noise = 0.92 + ((Math.sin(month * 17.3) + 1) / 2) * 0.16;
    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      weekday_avg: Math.round(basePrice * factor * noise * 0.85 / 100) * 100,
      weekend_avg: Math.round(basePrice * factor * noise * 1.20 / 100) * 100,
      peak_avg: peakMonths.has(month)
        ? Math.round(basePrice * factor * noise * 1.45 / 100) * 100
        : undefined,
      min_price: Math.round(minPrice * factor * 0.8 / 100) * 100,
      max_price: Math.round(maxPrice * factor * 1.3 / 100) * 100,
    };
  });
}

function getSourceLabel(source: string): string {
  switch (source) {
    case 'rakuten': return '楽天トラベル（リアルタイム）';
    case 'rakuten_vacant': return '楽天トラベル VacantSearch（空室連動・リアルタイム）';
    case 'booking': return 'Booking.com（リアルタイム）';
    case 'jalan': return 'じゃらんnet（リアルタイム）';
    case 'rakuten+booking': return '楽天 + Booking.com（リアルタイム）';
    case 'seed': return '実在ホテルデータ（静的）';
    case 'estimated': return '推計データ';
    default: return source;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // ── レート制限チェック ──
    const userId = (session.user as any)?.id;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? undefined;
    const rl = checkRateLimit(getIdentifier(userId, ip), 'survey');
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

  try {
    const body = await req.json();
    const { location, check_in, check_out, hotel_type = 'all', radius_km = 3, data_source = 'auto' } = body;

    if (!location) return NextResponse.json({ error: 'location is required' }, { status: 400 });

    // 本番環境ではモックデータを禁止
    if (process.env.NODE_ENV === 'production' && data_source === 'mock') {
      return NextResponse.json(
        { error: 'モックデータは本番環境では使用できません' },
        { status: 400 }
      );
    }

    // Gemini key resolution (for future AI use)
    // クライアントから送られたgemini_api_keyは無視し、常にサーバー側から取得する
    let geminiKey = '';
    if ((session.user as any).isAdmin) {
      geminiKey = process.env.ADMIN_GEMINI_KEY || '';
    } else {
      const userId = parseInt((session.user as any).id);
      if (!isNaN(userId)) {
        const enc = await getGeminiKey(userId);
        if (enc) { try { geminiKey = decryptApiKey(enc); } catch { /* ignore */ } }
      }
    }

    // Geocode
    let geo: { lat: number; lng: number; display_name: string };
    try {
      geo = await geocode(location);
    } catch (e: any) {
      return NextResponse.json({ error: `ジオコーディング失敗: ${e.message}` }, { status: 400 });
    }

    let hotels: HotelData[] = [];
    let monthly_stats: MonthlyStats[] = [];
    let actualSource = 'mock';

    // ── データ取得優先順位 ──
    // 1. 楽天トラベルAPI
    if ((data_source === 'rakuten' || data_source === 'auto') && process.env.RAKUTEN_APP_ID) {
      const result = await fetchRakutenHotels(geo.lat, geo.lng, check_in, check_out, hotel_type);
      if (result && result.hotels.length > 0) {
        hotels = result.hotels;
        monthly_stats = aggregateMonthlyStats(hotels);
        actualSource = result.source;
      }
    }

    // 2. Booking.com（RapidAPI）
    if (hotels.length === 0 && (data_source === 'booking' || data_source === 'auto') && isBookingEnabled()) {
      if (check_in && check_out) {
        const bookingHotels = await fetchBookingHotels({
          lat: geo.lat, lng: geo.lng,
          checkIn: check_in, checkOut: check_out,
        });
        if (bookingHotels && bookingHotels.length > 0) {
          hotels = bookingHotels;
          monthly_stats = aggregateMonthlyStats(hotels);
          actualSource = 'booking';
        }
      }
    }

    // 3. じゃらんnet API
    if (hotels.length === 0 && (data_source === 'jalan' || data_source === 'auto') && process.env.JALAN_CLIENT_ID) {
      const checkInJalan  = check_in  ? toJalanDate(check_in)  : '';
      const checkOutJalan = check_out ? toJalanDate(check_out) : '';
      if (checkInJalan && checkOutJalan) {
        const jalanHotels = await fetchJalanHotels({
          lat: geo.lat, lng: geo.lng,
          checkIn: checkInJalan, checkOut: checkOutJalan,
        });
        if (jalanHotels && jalanHotels.length > 0) {
          hotels = jalanHotels;
          monthly_stats = aggregateMonthlyStats(hotels);
          actualSource = 'jalan';
        }
      }
    }

    // 4. 複数OTA結合（autoモードで楽天取得済み + Booking.com補完）
    if ((actualSource === 'rakuten' || actualSource === 'rakuten_vacant') && data_source === 'auto' && isBookingEnabled() && check_in && check_out) {
      const bookingHotels = await fetchBookingHotels({
        lat: geo.lat, lng: geo.lng,
        checkIn: check_in, checkOut: check_out,
      });
      if (bookingHotels && bookingHotels.length > 0) {
        // 名前で重複排除しながらマージ（Booking.com で補完）
        const existingNames = new Set(hotels.map(h => h.name.substring(0, 8)));
        const newHotels = bookingHotels.filter(h => !existingNames.has(h.name.substring(0, 8)));
        if (newHotels.length > 0) {
          hotels = [...hotels, ...newHotels.slice(0, 15)];
          monthly_stats = aggregateMonthlyStats(hotels);
          actualSource = 'rakuten+booking';
        }
      }
    }

    // 5. シードデータ（主要都市にマッチ）
    if (hotels.length === 0 && data_source !== 'rakuten' && data_source !== 'jalan' && data_source !== 'booking') {
      const seedHotels = findSeedHotels(geo.lat, geo.lng);
      if (seedHotels && seedHotels.length > 0) {
        let filtered = seedHotels;
        if (hotel_type === 'business') filtered = seedHotels.filter(h => h.price_per_night < 18000);
        else if (hotel_type === 'resort') filtered = seedHotels.filter(h => h.price_per_night >= 25000);
        else if (hotel_type === 'budget') filtered = seedHotels.filter(h => h.price_per_night < 10000);
        hotels = filtered.length > 0 ? filtered : seedHotels;
        monthly_stats = generateSeedMonthlyStats(hotels);
        actualSource = 'seed';
      }
    }

    // 6. データなし（モック廃止 — エラーを返す）
    if (hotels.length === 0) {
      return NextResponse.json({
        error: 'このエリアのホテルデータが取得できませんでした。チェックイン日を指定するか、主要都市でお試しください。',
        data_source: 'none',
        geocoded_lat: geo.lat,
        geocoded_lng: geo.lng,
        search_address: geo.display_name,
      }, { status: 200 }); // 200でエラー情報を返す（UIで処理）
    }

    // 部屋タイプデータを全ホテルに付与（㎡単価・RevPAR/㎡計算）
    const hotelsWithRooms = attachRoomTypes(hotels);

    // ── 調査結果をスナップショットとして保存（非同期・エラー無視）──
    try {
      await initSchema();
      const today    = new Date().toISOString().split('T')[0];
      const avgADR   = Math.round(hotels.reduce((s, h) => s + h.price_per_night, 0) / hotels.length);
      const minADR   = Math.min(...hotels.map(h => h.price_per_night));
      const maxADR   = Math.max(...hotels.map(h => h.price_per_night));
      const curMonth = new Date().getMonth();
      const stat     = monthly_stats[curMonth] ?? monthly_stats[0];
      await saveSnapshot({
        areaKey:     toAreaKey(geo.lat, geo.lng),
        areaName:    geo.display_name.split(',')[0] ?? location,
        surveyDate:  today,
        avgAdr:      avgADR,
        minAdr:      minADR,
        maxAdr:      maxADR,
        weekdayAvg:  stat?.weekday_avg ?? avgADR,
        weekendAvg:  stat?.weekend_avg ?? Math.round(avgADR * 1.3),
        peakAvg:     stat?.peak_avg ?? null,
        hotelCount:  hotels.length,
        dataSource:  actualSource,
        checkinDate: check_in || null,
        otaSource:   actualSource,
      });
    } catch { /* スナップショット保存失敗は無視 */ }

    return NextResponse.json({
      hotels: hotelsWithRooms,
      monthly_stats,
      geocoded_lat: geo.lat,
      geocoded_lng: geo.lng,
      search_address: geo.display_name,
      data_source: actualSource,
      data_source_label: getSourceLabel(actualSource),
      is_real_data: ['rakuten', 'rakuten_vacant', 'booking', 'jalan', 'rakuten+booking'].includes(actualSource),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '不明なエラー' }, { status: 500 });
  }
}
