/**
 * lib/rakuten.ts
 * 楽天トラベル API 統合クライアント
 * - SimpleHotelSearch  : 基本ホテル検索（日付なし可）
 * - VacantHotelSearch  : 空室連動料金検索（日付必須・より精度高い）
 * - HotelRanking       : エリア別ホテルランキング
 *
 * docs: https://webservice.rakuten.co.jp/documentation/
 * env : RAKUTEN_APP_ID
 */

import type { HotelData } from '@/types';

const BASE = 'https://app.rakuten.co.jp/services/api/Travel';
const DEFAULT_TIMEOUT = 12_000;
const AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID ?? '';

// ---------- 共通型 ----------

export interface RakutenRankedHotel {
  rank: number;
  hotelNo: number;
  hotelName: string;
  hotelKanaName: string;
  hotelSpecial: string;
  hotelMinCharge: number | null;
  reviewAverage: number | null;
  reviewCount: number | null;
  hotelImageUrl: string;
  hotelInformationUrl: string;
  prefecture: string;
}

export interface RakutenSearchOptions {
  lat: number;
  lng: number;
  checkIn?: string;   // YYYY-MM-DD
  checkOut?: string;  // YYYY-MM-DD
  hotelType?: string; // 'all' | 'business' | 'resort' | 'budget'
  radius?: number;    // km, default 3
  hits?: number;      // default 30
}

// ---------- ヘルパー ----------

function toDate(iso: string) { return iso.replace(/-/g, ''); }

function hotelTypeParam(hotelType?: string) {
  if (hotelType === 'business') return 'BusinessHotel';
  if (hotelType === 'resort')   return 'Resort';
  if (hotelType === 'budget')   return 'GuestHouse';
  return null;
}

// 緯度経度→都道府県コード（楽天ランキングAPI用）
export function latLngToPref(lat: number, lng: number): string {
  if (lat >= 43.0 && lng >= 141.0) return '01'; // 北海道
  if (lat >= 40.0 && lat < 43.0 && lng >= 140.0) return '03'; // 岩手/青森周辺→岩手
  if (lat >= 38.0 && lat < 40.0 && lng >= 140.5) return '04'; // 宮城
  if (lat >= 35.5 && lat < 36.5 && lng >= 139.3 && lng < 139.9) return '13'; // 東京
  if (lat >= 35.2 && lat < 35.5 && lng >= 139.3 && lng < 139.8) return '14'; // 神奈川
  if (lat >= 35.8 && lat < 36.5 && lng >= 138.5 && lng < 140.0) return '11'; // 埼玉
  if (lat >= 35.5 && lat < 36.0 && lng >= 139.8 && lng < 140.5) return '12'; // 千葉
  if (lat >= 34.9 && lat < 35.3 && lng >= 136.6 && lng < 137.2) return '23'; // 愛知
  if (lat >= 34.9 && lat < 35.1 && lng >= 135.7 && lng < 135.9) return '26'; // 京都
  if (lat >= 34.5 && lat < 34.8 && lng >= 135.3 && lng < 135.7) return '27'; // 大阪
  if (lat >= 34.6 && lat < 34.8 && lng >= 135.0 && lng < 135.4) return '28'; // 兵庫
  if (lat >= 33.5 && lat < 33.8 && lng >= 130.3 && lng < 130.6) return '40'; // 福岡
  if (lat >= 26.0 && lat < 26.8 && lng >= 127.5 && lng < 128.3) return '47'; // 沖縄
  if (lat >= 36.5 && lat < 36.7 && lng >= 136.5 && lng < 136.8) return '17'; // 石川
  if (lat >= 43.0 && lat < 44.0 && lng >= 141.3 && lng < 141.5) return '01'; // 札幌
  return '13'; // デフォルト東京
}

// ---------- SimpleHotelSearch ----------

export async function simpleHotelSearch(opts: RakutenSearchOptions): Promise<HotelData[] | null> {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) return null;

  try {
    const p = new URLSearchParams({
      applicationId: appId,
      format: 'json',
      latitude:     String(opts.lat),
      longitude:    String(opts.lng),
      searchRadius: String(opts.radius ?? 3),
      datumType:    '1',
      hits:         String(opts.hits ?? 30),
      sort:         'standard',
    });
    if (opts.checkIn)  p.set('checkinDate',  toDate(opts.checkIn));
    if (opts.checkOut) p.set('checkoutDate', toDate(opts.checkOut));
    const ht = hotelTypeParam(opts.hotelType);
    if (ht) p.set('hotelType', ht);
    if (AFFILIATE_ID) p.set('affiliateId', AFFILIATE_ID);

    const res = await fetch(`${BASE}/SimpleHotelSearch/20170426?${p}`, {
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return parseHotelList(json.hotels, 'rakuten');
  } catch { return null; }
}

// ---------- VacantHotelSearch ----------

export async function vacantHotelSearch(opts: RakutenSearchOptions): Promise<HotelData[] | null> {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId || !opts.checkIn || !opts.checkOut) return null;

  try {
    const p = new URLSearchParams({
      applicationId: appId,
      format:        'json',
      latitude:      String(opts.lat),
      longitude:     String(opts.lng),
      searchRadius:  String(opts.radius ?? 3),
      datumType:     '1',
      hits:          String(opts.hits ?? 30),
      checkinDate:   toDate(opts.checkIn),
      checkoutDate:  toDate(opts.checkOut),
      adultNum:      '2',
      sort:          'standard',
    });
    const ht = hotelTypeParam(opts.hotelType);
    if (ht) p.set('hotelType', ht);
    if (AFFILIATE_ID) p.set('affiliateId', AFFILIATE_ID);

    const res = await fetch(`${BASE}/VacantHotelSearch/20170426?${p}`, {
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
    });
    if (!res.ok) return null;
    const json = await res.json();

    // VacantHotelSearch の roomInfo から実際の宿泊料金を取得
    const hotels = json.hotels;
    if (!Array.isArray(hotels)) return null;

    return hotels.map((entry: any[]): HotelData | null => {
      const basic = entry.find((e: any) => e.hotelBasicInfo)?.hotelBasicInfo;
      if (!basic) return null;

      // roomInfo から全プランを比較して最安の1泊料金を取得
      const roomInfoArr = entry.find((e: any) => e.roomInfo)?.roomInfo ?? [];
      let price = basic.hotelMinCharge ?? 0;
      let minCharge = Infinity;
      for (const ri of roomInfoArr) {
        const daily = ri?.dailyCharge;
        if (daily?.rakutenCharge && daily.rakutenCharge > 0) {
          minCharge = Math.min(minCharge, daily.rakutenCharge);
        }
      }
      if (minCharge < Infinity) price = minCharge;
      if (!price || price <= 0) return null;

      return {
        name:            basic.hotelName ?? '不明',
        price_per_night: price,
        rating:          basic.reviewAverage ? parseFloat(String(basic.reviewAverage)) : undefined,
        review_count:    basic.reviewCount   ?? undefined,
        url:             basic.hotelInformationUrl ?? '',
        lat:             basic.latitude  ? parseFloat(String(basic.latitude))  : undefined,
        lng:             basic.longitude ? parseFloat(String(basic.longitude)) : undefined,
        source:          'rakuten_vacant',
      };
    }).filter((h): h is HotelData => h !== null);
  } catch { return null; }
}

// ---------- HotelRanking ----------

export interface HotelRankingOptions {
  genre?: 'all' | 'hotel' | 'business' | 'resort' | 'pension';
  prefecture?: string; // '13' など
  lat?: number;
  lng?: number;
}

export async function hotelRanking(opts: HotelRankingOptions = {}): Promise<RakutenRankedHotel[]> {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) return [];

  try {
    const pref = opts.prefecture
      ?? (opts.lat && opts.lng ? latLngToPref(opts.lat, opts.lng) : '13');

    const p = new URLSearchParams({
      applicationId: appId,
      format:        'json',
      genre:         opts.genre ?? 'all',
      prefecture:    pref,
    });

    const res = await fetch(`${BASE}/HotelRanking/20170426?${p}`, {
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
    });
    if (!res.ok) return [];
    const json = await res.json();

    const list: any[] = json.Hotels ?? json.hotels ?? [];
    return list.map((item: any, idx: number): RakutenRankedHotel => {
      const h = item.Hotel ?? item;
      return {
        rank:                idx + 1,
        hotelNo:             h.hotelNo ?? 0,
        hotelName:           h.hotelName ?? '不明',
        hotelKanaName:       h.hotelKanaName ?? '',
        hotelSpecial:        h.hotelSpecial ?? '',
        hotelMinCharge:      h.hotelMinCharge ?? null,
        reviewAverage:       h.reviewAverage ? parseFloat(String(h.reviewAverage)) : null,
        reviewCount:         h.reviewCount ?? null,
        hotelImageUrl:       h.hotelImageUrl ?? '',
        hotelInformationUrl: h.hotelInformationUrl ?? '',
        prefecture:          pref,
      };
    });
  } catch { return []; }
}

// ---------- 共通パーサー ----------

function parseHotelList(hotels: any, source: string): HotelData[] | null {
  if (!Array.isArray(hotels)) return null;
  const result = hotels.map((entry: any[]): HotelData | null => {
    const basic = entry.find((e: any) => e.hotelBasicInfo)?.hotelBasicInfo;
    if (!basic || !basic.hotelMinCharge) return null;
    return {
      name:            basic.hotelName ?? '不明',
      price_per_night: basic.hotelMinCharge,
      rating:          basic.reviewAverage ? parseFloat(String(basic.reviewAverage)) : undefined,
      review_count:    basic.reviewCount ?? undefined,
      url:             basic.hotelInformationUrl ?? '',
      lat:             basic.latitude  ? parseFloat(String(basic.latitude))  : undefined,
      lng:             basic.longitude ? parseFloat(String(basic.longitude)) : undefined,
      source,
    };
  }).filter((h): h is HotelData => h !== null);
  return result.length > 0 ? result : null;
}
