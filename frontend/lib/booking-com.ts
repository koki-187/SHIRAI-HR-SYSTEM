/**
 * lib/booking-com.ts
 * Booking.com ホテル価格取得 via RapidAPI
 * env: BOOKING_RAPIDAPI_KEY
 * API: booking-com.p.rapidapi.com
 *
 * RapidAPI登録: https://rapidapi.com/DataCrawler/api/booking-com15
 */

import type { HotelData } from '@/types';

const RAPIDAPI_HOST = 'booking-com15.p.rapidapi.com';
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}/api/v1`;

export interface BookingSearchParams {
  lat: number;
  lng: number;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD
  radius?: number;   // km, default 3
  adults?: number;
  rooms?: number;
}

interface BookingHotelRaw {
  hotel_id?: number | string;
  property?: {
    name?: string;
    reviewScore?: number;
    reviewCount?: number;
    latitude?: number;
    longitude?: number;
    wishlistName?: string;
  };
  priceBreakdown?: {
    grossPrice?: { value?: number; currency?: string };
  };
  accessibilityLabel?: string;
}

/**
 * RapidAPI Booking.com から近隣ホテルを取得
 * BOOKING_RAPIDAPI_KEY が未設定の場合は null を返す
 */
export async function fetchBookingHotels(params: BookingSearchParams): Promise<HotelData[] | null> {
  const apiKey = process.env.BOOKING_RAPIDAPI_KEY;
  if (!apiKey) return null;

  try {
    // Step1: 座標からdestIdを取得（Booking.com形式）
    const destId = await resolveDestId(params.lat, params.lng, apiKey);
    if (!destId) return null;

    // Step2: ホテル検索
    const searchParams = new URLSearchParams({
      dest_id: destId,
      search_type: 'CITY',
      arrival_date: params.checkIn,
      departure_date: params.checkOut,
      adults: String(params.adults ?? 1),
      room_qty: String(params.rooms ?? 1),
      units: 'metric',
      temperature_unit: 'c',
      languagecode: 'ja',
      currency_code: 'JPY',
      location: `${params.lat},${params.lng}`,
      page_number: '1',
    });

    const res = await fetch(
      `${RAPIDAPI_BASE}/hotels/searchHotels?${searchParams}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        },
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!res.ok) {
      console.warn('[booking-com] search failed:', res.status);
      return null;
    }

    const json = await res.json();
    const hotelList: BookingHotelRaw[] = json?.data?.hotels ?? [];
    if (!hotelList.length) return null;

    // 宿泊日数を計算（最低1泊）
    const nights = params.checkIn && params.checkOut
      ? Math.max(1, Math.round((new Date(params.checkOut).getTime() - new Date(params.checkIn).getTime()) / 86400000))
      : 1;

    const hotels: HotelData[] = hotelList
      .map((h): HotelData | null => {
        const totalPrice = h.priceBreakdown?.grossPrice?.value;
        if (!totalPrice || totalPrice <= 0) return null;

        // 1泊あたり料金に変換（円換算、JPY以外の場合は概算）
        const priceJpy = Math.round(totalPrice / nights);

        return {
          name: h.property?.name ?? '不明',
          price_per_night: priceJpy,
          rating: h.property?.reviewScore
            ? h.property.reviewScore / 2  // Booking.comは10点満点→5点満点に正規化
            : undefined,
          review_count: h.property?.reviewCount ?? undefined,
          url: h.property?.name
            ? `https://www.booking.com/searchresults.ja.html?ss=${encodeURIComponent(h.property.name ?? '')}`
            : '',
          lat: h.property?.latitude,
          lng: h.property?.longitude,
          source: 'booking',
        };
      })
      .filter((h): h is HotelData => h !== null)
      .slice(0, 30);

    return hotels.length > 0 ? hotels : null;
  } catch (e) {
    console.warn('[booking-com] fetch error:', e);
    return null;
  }
}

/** 座標からdestIdを解決 */
async function resolveDestId(lat: number, lng: number, apiKey: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      query: `${lat},${lng}`,
      languagecode: 'ja',
    });
    const res = await fetch(
      `${RAPIDAPI_BASE}/hotels/searchDestination?${params}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        },
        signal: AbortSignal.timeout(8_000),
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const destinations = json?.data ?? [];
    if (!destinations.length) return null;

    // 最も近い都市/地区のIDを返す
    const city = destinations.find((d: any) => d.search_type === 'city' || d.search_type === 'district')
      ?? destinations[0];
    return city?.dest_id ?? null;
  } catch {
    return null;
  }
}

export function isBookingEnabled(): boolean {
  return !!process.env.BOOKING_RAPIDAPI_KEY;
}
