/**
 * lib/estat.ts
 * e-Stat API client — 観光庁 宿泊旅行統計調査
 * env: ESTAT_API_KEY
 * docs: https://api.e-stat.go.jp/rest/3.0/app/
 */

const ESTAT_BASE = 'https://api.e-stat.go.jp/rest/3.0/app/json';

// 観光庁宿泊旅行統計 statsDataId（客室稼働率・都道府県月次）
// e-Statの「宿泊旅行統計調査」統計表
const OCC_STATS_ID = '0003148422';

export interface OccData {
  prefCode: string;
  prefName: string;
  occRate: number;      // 客室稼働率 0-100
  revpar: number | null; // RevPAR（円）
  adr: number | null;   // ADR（円）
  year: number;
  month: number;
  dataLabel: string;    // "2025年3月"
  source: 'estat';
  sourceLabel: '観光庁宿泊旅行統計（e-Stat）';
}

// 都道府県コードマップ
const PREF_MAP: Record<string, string> = {
  '01': '北海道', '04': '宮城県', '13': '東京都', '14': '神奈川県',
  '22': '静岡県', '23': '愛知県', '26': '京都府', '27': '大阪府',
  '28': '兵庫県', '33': '岡山県', '34': '広島県', '40': '福岡県',
  '43': '熊本県', '47': '沖縄県', '17': '石川県',
};

/** 緯度経度 → 都道府県コード（簡易判定） */
export function coordsToPrefCode(lat: number, lng: number): string {
  if (lat >= 43.0 && lng >= 141.0 && lng <= 145.5) return '01'; // 北海道
  if (lat >= 38.0 && lat <= 39.5 && lng >= 140.5 && lng <= 141.5) return '04'; // 宮城
  if (lat >= 35.5 && lat <= 35.9 && lng >= 139.3 && lng <= 140.1) return '13'; // 東京
  if (lat >= 35.2 && lat <= 35.5 && lng >= 139.3 && lng <= 139.8) return '14'; // 神奈川
  if (lat >= 34.8 && lat <= 35.3 && lng >= 136.6 && lng <= 137.2) return '23'; // 愛知
  if (lat >= 34.9 && lat <= 35.1 && lng >= 135.7 && lng <= 135.9) return '26'; // 京都
  if (lat >= 34.5 && lat <= 34.8 && lng >= 135.3 && lng <= 135.7) return '27'; // 大阪
  if (lat >= 34.6 && lat <= 34.8 && lng >= 135.0 && lng <= 135.4) return '28'; // 兵庫
  if (lat >= 33.5 && lat <= 33.7 && lng >= 130.3 && lng <= 130.5) return '40'; // 福岡
  if (lat >= 26.0 && lat <= 26.8 && lng >= 127.5 && lng <= 128.3) return '47'; // 沖縄
  if (lat >= 36.5 && lat <= 36.6 && lng >= 136.5 && lng <= 136.8) return '17'; // 石川
  if (lat >= 38.2 && lat <= 38.4 && lng >= 140.8 && lng <= 141.0) return '04'; // 仙台→宮城
  return '13'; // デフォルト東京
}

/** 都道府県コードから稼働率を取得（e-Stat API） */
export async function fetchOccByPref(prefCode: string): Promise<OccData | null> {
  const apiKey = process.env.ESTAT_API_KEY;
  if (!apiKey) return null;

  try {
    // 直近12ヶ月の客室稼働率を取得
    const params = new URLSearchParams({
      appId: apiKey,
      statsDataId: OCC_STATS_ID,
      cdArea: prefCode.padStart(2, '0'),
      metaGetFlg: 'N',
      cntGetFlg: 'N',
      limit: '12',
    });
    const url = `${ESTAT_BASE}/getStatsData?${params}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'HotelScope/1.0' },
    });
    if (!res.ok) return null;

    const json = await res.json();
    const values: any[] =
      json?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE ?? [];
    if (!values.length) return null;

    // @time フィールドでソートして最新月を取得
    const sorted = [...values].sort((a, b) => {
      const ta = String(a?.['@time'] ?? '');
      const tb = String(b?.['@time'] ?? '');
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });
    const latest = sorted[sorted.length - 1];
    const occ = parseFloat(String(latest?.['$'] ?? ''));
    if (isNaN(occ)) return null;

    // 時間コード解析: '2025C1M03' → 2025年3月
    const timeCode = String(latest?.['@time'] ?? '');
    const year = parseInt(timeCode.slice(0, 4));
    const monthMatch = timeCode.match(/(\d{2})$/);
    const month = monthMatch ? parseInt(monthMatch[1]) : new Date().getMonth() + 1;
    if (isNaN(year) || isNaN(month)) return null;

    return {
      prefCode,
      prefName: PREF_MAP[prefCode] ?? `都道府県${prefCode}`,
      occRate: occ,
      revpar: null,
      adr: null,
      year,
      month,
      dataLabel: `${year}年${month}月`,
      source: 'estat',
      sourceLabel: '観光庁宿泊旅行統計（e-Stat）',
    };
  } catch (e) {
    console.warn('[estat] fetchOccByPref error:', e);
    return null;
  }
}

/** 緯度経度から近隣都道府県のOCC取得 */
export async function fetchOccByCoords(lat: number, lng: number): Promise<OccData | null> {
  const prefCode = coordsToPrefCode(lat, lng);
  return fetchOccByPref(prefCode);
}

export function isEstatEnabled(): boolean {
  return !!process.env.ESTAT_API_KEY;
}
