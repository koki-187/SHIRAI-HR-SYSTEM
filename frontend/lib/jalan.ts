/**
 * lib/jalan.ts
 * じゃらんnet アフィリエイトAPI クライアント
 * 環境変数: JALAN_CLIENT_ID
 *
 * API docs: https://jws.jalan.net/APIContents/hotel/V1/
 * レート制限: 1リクエスト/3秒以上の間隔を厳守
 */

import type { HotelData } from '@/types';

const JALAN_API_BASE = 'https://jws.jalan.net/APISrv/hotel/V1/';

export interface JalanSearchParams {
  lat:      number;
  lng:      number;
  checkIn:  string; // 'YYYYMMDD'
  checkOut: string; // 'YYYYMMDD'
  radius?:  number; // km, default 3
  count?:   number; // max 30
}

interface JalanHotelItem {
  hotel_id?:    string;
  hotel_name?:  string;
  plan_name?:   string;
  charge?:      number | string;
  charge_tax?:  number | string;
  latitude?:    string | number;
  longitude?:   string | number;
  review_avg?:  string | number;
  review_cnt?:  string | number;
  hotel_url?:   string;
}

/**
 * じゃらんnetから近隣ホテル価格を取得する。
 * JALAN_CLIENT_IDが未設定の場合はnullを返す。
 */
export async function fetchJalanHotels(params: JalanSearchParams): Promise<HotelData[] | null> {
  const clientId = process.env.JALAN_CLIENT_ID;
  if (!clientId) return null;

  const radius  = params.radius ?? 3;
  const count   = params.count  ?? 30;

  try {
    // じゃらんnet APIは緯度・経度・チェックイン日での検索をサポート
    const query = new URLSearchParams({
      client_id:  clientId,
      latitude:   String(params.lat),
      longitude:  String(params.lng),
      'search-range': String(Math.min(radius, 5)), // max 5km
      'check-in-date':  params.checkIn,
      'check-out-date': params.checkOut,
      'hits-per-page':  String(count),
      'response-type':  'json',
    });

    const url = `${JALAN_API_BASE}?${query}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'HotelScope/1.0 (navigator.koki@gmail.com)',
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      console.warn('[jalan] API response not ok:', res.status);
      return null;
    }

    const json = await res.json();

    // じゃらんAPIのレスポンス形式に合わせてパース
    // 実際のフィールド名はAPIバージョンによって異なる場合がある
    const items: JalanHotelItem[] = Array.isArray(json.hotel)
      ? json.hotel
      : Array.isArray(json.hotels)
        ? json.hotels
        : Array.isArray(json.results?.hotel)
          ? json.results.hotel
          : [];

    if (items.length === 0) return null;

    const hotels: HotelData[] = items
      .map((item): HotelData | null => {
        const charge = typeof item.charge === 'string'
          ? parseInt(item.charge, 10)
          : (item.charge ?? 0);
        if (!charge || charge <= 0) return null;

        const lat = item.latitude  ? parseFloat(String(item.latitude))  : undefined;
        const lng = item.longitude ? parseFloat(String(item.longitude)) : undefined;
        const rating = item.review_avg ? parseFloat(String(item.review_avg)) : undefined;
        const reviewCount = item.review_cnt ? parseInt(String(item.review_cnt), 10) : undefined;

        return {
          name:            item.hotel_name || '不明',
          price_per_night: charge,
          rating:          rating,
          review_count:    reviewCount,
          url:             item.hotel_url  || '',
          lat,
          lng,
          source:          'jalan' as any, // HotelData.source拡張
        };
      })
      .filter((h): h is HotelData => h !== null);

    return hotels.length > 0 ? hotels : null;

  } catch (err) {
    console.error('[jalan] fetch error:', err);
    return null;
  }
}

/**
 * じゃらんnet日付フォーマット変換（YYYY-MM-DD → YYYYMMDD）
 */
export function toJalanDate(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

/**
 * じゃらんAPIが利用可能かチェック
 */
export function isJalanEnabled(): boolean {
  return !!process.env.JALAN_CLIENT_ID;
}
