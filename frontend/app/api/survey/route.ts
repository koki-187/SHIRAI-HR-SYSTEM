import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGeminiKey } from '@/lib/db';
import { decryptApiKey } from '@/lib/crypto';
import { HotelData, MonthlyStats } from '@/types';
import { findSeedHotels, generateSeedMonthlyStats } from '@/lib/seed-hotels';

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

// ---- Rakuten Travel API ----
async function fetchRakutenHotels(
  lat: number, lng: number,
  checkIn: string, checkOut: string,
  hotelType: string
): Promise<HotelData[] | null> {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) return null;

  try {
    const params = new URLSearchParams({
      applicationId: appId,
      format: 'json',
      latitude: String(lat),
      longitude: String(lng),
      searchRadius: '3',
      datumType: '1',
      hits: '30',
      sort: 'standard',
    });

    if (checkIn) params.set('checkinDate', checkIn.replace(/-/g, ''));
    if (checkOut) params.set('checkoutDate', checkOut.replace(/-/g, ''));
    if (hotelType === 'business') params.set('hotelType', 'BusinessHotel');
    else if (hotelType === 'resort') params.set('hotelType', 'Resort');
    else if (hotelType === 'budget') params.set('hotelType', 'GuestHouse');

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
          name: basic.hotelName || '不明',
          price_per_night: basic.hotelMinCharge,
          rating: basic.reviewAverage ? parseFloat(basic.reviewAverage) : undefined,
          review_count: basic.reviewCount || undefined,
          url: basic.hotelInformationUrl || '',
          lat: basic.latitude ? parseFloat(basic.latitude) : undefined,
          lng: basic.longitude ? parseFloat(basic.longitude) : undefined,
          source: 'rakuten',
        } as HotelData;
      })
      .filter((h: HotelData | null): h is HotelData => h !== null);

    return hotels.length > 0 ? hotels : null;
  } catch {
    return null;
  }
}

// ---- Mock hotel data generator (deterministic by location) ----
function generateMockHotels(lat: number, lng: number, checkIn: string, hotelType: string): HotelData[] {
  const names = [
    'ホテルグランデ', 'ビジネスホテルサクラ', 'シティホテル東横', 'ルートイン', 'コンフォートホテル',
    'ドーミーイン', 'アパホテル', '東横INN', 'スーパーホテル', 'ダイワロイネット',
    'ホテルマイステイズ', 'ソラリア西鉄ホテル', 'ワシントンホテル', 'クロスホテル', 'リッチモンドホテル',
  ];
  const basePriceMap: Record<string, number> = {
    business: 8000, resort: 20000, budget: 5000, all: 10000,
  };
  const basePrice = basePriceMap[hotelType] ?? 10000;

  const seed = (lat * 1000 + lng * 1000) | 0;
  const rand = (i: number, min: number, max: number) => {
    const x = Math.sin(seed + i * 127.1) * 43758.5453;
    return min + (x - Math.floor(x)) * (max - min);
  };

  return names.map((name, i) => ({
    name,
    price_per_night: Math.round(basePrice * rand(i, 0.7, 2.5) / 100) * 100,
    rating: Math.round(rand(i + 100, 7.0, 9.5) * 10) / 10,
    review_count: Math.round(rand(i + 200, 50, 2000)),
    url: `https://www.booking.com/hotel/jp/example${i}.ja.html`,
    lat: lat + rand(i + 300, -0.02, 0.02),
    lng: lng + rand(i + 400, -0.02, 0.02),
    source: 'mock',
  }));
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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { location, check_in, check_out, hotel_type = 'all', radius_km = 3, data_source = 'auto' } = body;

    if (!location) return NextResponse.json({ error: 'location is required' }, { status: 400 });

    // Gemini key resolution (for future AI use)
    let geminiKey = body.gemini_api_key || '';
    if (!geminiKey) {
      if ((session.user as any).isAdmin) {
        geminiKey = process.env.ADMIN_GEMINI_KEY || '';
      } else {
        const userId = parseInt((session.user as any).id);
        if (!isNaN(userId)) {
          const enc = await getGeminiKey(userId);
          if (enc) { try { geminiKey = decryptApiKey(enc); } catch { /* ignore */ } }
        }
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
    // 1. 楽天トラベルAPI（data_source='rakuten' または 'auto' かつ RAKUTEN_APP_ID あり）
    if (data_source === 'rakuten' || data_source === 'auto') {
      const rakutenHotels = await fetchRakutenHotels(geo.lat, geo.lng, check_in, check_out, hotel_type);
      if (rakutenHotels && rakutenHotels.length > 0) {
        hotels = rakutenHotels;
        monthly_stats = aggregateMonthlyStats(hotels);
        actualSource = 'rakuten';
      }
    }

    // 2. シードデータ（主要都市にマッチ）
    if (hotels.length === 0 && data_source !== 'rakuten') {
      const seedHotels = findSeedHotels(geo.lat, geo.lng);
      if (seedHotels && seedHotels.length > 0) {
        // ホテルタイプフィルタ
        let filtered = seedHotels;
        if (hotel_type === 'business') {
          filtered = seedHotels.filter(h => h.price_per_night < 18000);
        } else if (hotel_type === 'resort') {
          filtered = seedHotels.filter(h => h.price_per_night >= 25000);
        } else if (hotel_type === 'budget') {
          filtered = seedHotels.filter(h => h.price_per_night < 10000);
        }
        hotels = filtered.length > 0 ? filtered : seedHotels;
        monthly_stats = generateSeedMonthlyStats(hotels);
        actualSource = 'seed';
      }
    }

    // 3. モックデータ（フォールバック）
    if (hotels.length === 0) {
      hotels = generateMockHotels(geo.lat, geo.lng, check_in, hotel_type);
      monthly_stats = aggregateMonthlyStats(hotels);
      actualSource = 'mock';
    }

    return NextResponse.json({
      hotels,
      monthly_stats,
      geocoded_lat: geo.lat,
      geocoded_lng: geo.lng,
      search_address: geo.display_name,
      data_source: actualSource,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '不明なエラー' }, { status: 500 });
  }
}
