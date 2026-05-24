/**
 * historical-seed.ts
 * 全国主要エリアの過去12ヶ月分推計ADRデータを生成する。
 * 日本の実際の観光需要パターン（桜・GW・Obon・年末）に基づく。
 */

/** 月別季節係数（1=平均、>1=強い季節需要） */
const MONTHLY_FACTOR: Record<number, number> = {
  1:  0.82,  // 元日明け・閑散期
  2:  0.78,  // 最閑散（梅雨前寒季）
  3:  1.18,  // 春休み・桜シーズン開始
  4:  1.42,  // 桜満開・GW前
  5:  1.48,  // GW（最高峰）
  6:  0.88,  // 梅雨
  7:  1.22,  // 夏休み開始・海の日
  8:  1.55,  // お盆（年最高峰）
  9:  0.92,  // シルバーウィーク含む→需要回復
  10: 1.18,  // 紅葉開始・秋旅行
  11: 1.12,  // 紅葉ピーク
  12: 1.28,  // 年末・クリスマス
};

/** 週末プレミアム係数 */
const WEEKEND_MULT = 1.32;

/** 繁忙期補正 */
const PEAK_MONTHS = new Set([3, 4, 5, 8, 12]);

/** 2025年上半期インバウンド需要サージ係数（対前年比） */
const INBOUND_SURGE: Record<number, number> = {
  1: 1.08, 2: 1.10, 3: 1.15, 4: 1.20, 5: 1.18,
  6: 1.12, 7: 1.14, 8: 1.16, 9: 1.10, 10: 1.12,
  11: 1.09, 12: 1.10,
};

interface SnapshotRow {
  area_key:    string;
  area_name:   string;
  survey_date: string;   // 'YYYY-MM-DD' （各月1日）
  avg_adr:     number;
  min_adr:     number;
  max_adr:     number;
  weekday_avg: number;
  weekend_avg: number;
  peak_avg:    number | null;
  hotel_count: number;
  data_source: string;
}

/**
 * 指定エリア・基準ADRで過去N ヶ月分の推計スナップショット行を返す。
 * survey_date は各月の1日。
 */
export function generateHistoricalRows(
  areaKey:   string,
  areaName:  string,
  baseADR:   number,
  hotelCount: number,
  months: number = 13,
): SnapshotRow[] {
  const today = new Date();
  const rows: SnapshotRow[] = [];

  for (let i = months; i >= 1; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year  = d.getFullYear();
    const month = d.getMonth() + 1;    // 1-12
    const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;

    const factor  = MONTHLY_FACTOR[month] ?? 1.0;
    const surge   = INBOUND_SURGE[month]  ?? 1.1;
    // 微ノイズ（月・年に依存した疑似ランダム）
    const noise   = 0.97 + ((Math.sin(month * 13.7 + year * 0.3) + 1) / 2) * 0.06;

    const weekday = Math.round(baseADR * factor * surge * noise / 100) * 100;
    const weekend = Math.round(weekday * WEEKEND_MULT / 100) * 100;
    const peak    = PEAK_MONTHS.has(month)
      ? Math.round(weekday * 1.42 / 100) * 100
      : null;
    const avg     = Math.round((weekday * 5 + weekend * 2) / 7 / 100) * 100;
    const minAdr  = Math.round(weekday * 0.65 / 100) * 100;
    const maxAdr  = Math.round((peak ?? weekend) * 1.35 / 100) * 100;

    rows.push({
      area_key:    areaKey,
      area_name:   areaName,
      survey_date: dateStr,
      avg_adr:     avg,
      min_adr:     minAdr,
      max_adr:     maxAdr,
      weekday_avg: weekday,
      weekend_avg: weekend,
      peak_avg:    peak,
      hotel_count: hotelCount,
      data_source: 'estimated',
    });
  }
  return rows;
}

/**
 * 都市別係数を使った高精度推計行を生成する。
 * city-seasonal.ts の CITY_SEASONAL 係数を使用。
 */
export function generateCityAwareRows(
  areaKey:    string,
  areaName:   string,
  baseADR:    number,
  hotelCount: number,
  months:     number = 13,
): SnapshotRow[] {
  // 都市名から季節タイプを特定
  const AREA_MAP: Record<string, number[]> = {
    '京都': [0.82,0.76,1.42,1.68,1.52,0.78,0.92,1.08,0.94,1.52,1.72,1.12],
    '大阪': [0.84,0.80,1.22,1.45,1.50,0.92,1.18,1.35,1.02,1.28,1.18,1.25],
    '沖縄': [0.72,0.68,1.02,1.28,1.42,1.12,1.68,1.72,1.18,1.15,0.85,0.88],
    '那覇': [0.72,0.68,1.02,1.28,1.42,1.12,1.68,1.72,1.18,1.15,0.85,0.88],
    '札幌': [1.28,1.45,0.95,0.82,1.05,0.88,1.38,1.65,1.05,0.92,0.72,1.12],
    '函館': [1.25,1.38,0.92,0.85,1.08,0.90,1.42,1.62,1.05,0.92,0.72,1.08],
    '仙台': [0.82,0.80,1.05,1.22,1.32,0.90,1.28,1.55,1.08,1.15,0.95,0.98],
    '横浜': [0.80,0.76,1.15,1.38,1.42,0.90,1.25,1.38,0.95,1.22,1.12,1.25],
    '名古屋': [0.78,0.75,1.10,1.32,1.38,0.88,1.15,1.32,0.98,1.22,1.10,1.28],
    '金沢': [0.80,0.76,1.12,1.35,1.40,0.90,1.18,1.35,0.98,1.25,1.12,1.22],
    '神戸': [0.80,0.76,1.35,1.58,1.45,0.82,0.95,1.10,0.92,1.42,1.52,1.08],
    '奈良': [0.78,0.72,1.38,1.62,1.45,0.80,0.92,1.08,0.90,1.45,1.58,1.05],
    '広島': [0.82,0.78,1.12,1.35,1.40,0.92,1.18,1.38,1.02,1.25,1.12,1.18],
    '軽井沢': [0.52,0.48,0.72,0.98,1.42,1.08,1.85,2.18,1.38,1.52,0.78,0.85],
    '博多': [0.80,0.76,1.12,1.30,1.38,0.90,1.18,1.45,1.05,1.20,1.08,1.22],
    '福岡': [0.80,0.76,1.12,1.30,1.38,0.90,1.18,1.45,1.05,1.20,1.08,1.22],
    '鹿児島': [0.80,0.76,1.10,1.28,1.35,0.90,1.18,1.42,1.05,1.18,1.05,1.20],
    '長崎': [0.80,0.76,1.12,1.30,1.35,0.90,1.15,1.40,1.05,1.18,1.08,1.20],
    '熊本': [0.80,0.76,1.10,1.28,1.35,0.90,1.15,1.40,1.05,1.18,1.05,1.20],
  };

  // 都市名キーワードマッチ
  let coeffs: number[] | null = null;
  for (const [key, c] of Object.entries(AREA_MAP)) {
    if (areaName.includes(key)) { coeffs = c; break; }
  }
  // デフォルト: 東京都心型
  if (!coeffs) coeffs = [0.78,0.74,1.18,1.42,1.48,0.88,1.22,1.38,0.92,1.20,1.12,1.28];

  const WEEKEND_MULT_LOCAL = 1.32;
  const today = new Date();
  const rows: SnapshotRow[] = [];

  for (let i = months; i >= 1; i--) {
    const d     = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year  = d.getFullYear();
    const month = d.getMonth() + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;

    const cityFactor = coeffs[month - 1] ?? 1.0;
    const surge      = INBOUND_SURGE[month] ?? 1.1;
    const noise      = 0.98 + ((Math.sin(month * 11.3 + year * 0.5) + 1) / 2) * 0.04;

    const weekday = Math.round(baseADR * cityFactor * surge * noise / 100) * 100;
    const weekend = Math.round(weekday * WEEKEND_MULT_LOCAL / 100) * 100;
    // 繁忙期：都市別係数の上位4ヶ月
    const sortedFactors = [...coeffs].sort((a, b) => b - a);
    const peakThreshold = sortedFactors[3] ?? 1.3;
    const peak    = cityFactor >= peakThreshold
      ? Math.round(weekday * 1.42 / 100) * 100
      : null;
    const avg     = Math.round((weekday * 5 + weekend * 2) / 7 / 100) * 100;
    const minAdr  = Math.round(weekday * 0.62 / 100) * 100;
    const maxAdr  = Math.round((peak ?? weekend) * 1.38 / 100) * 100;

    rows.push({
      area_key:    areaKey,
      area_name:   areaName,
      survey_date: dateStr,
      avg_adr:     avg,
      min_adr:     minAdr,
      max_adr:     maxAdr,
      weekday_avg: weekday,
      weekend_avg: weekend,
      peak_avg:    peak,
      hotel_count: hotelCount,
      data_source: 'estimated',
    });
  }
  return rows;
}

/** 主要シードエリア一覧（seed-hotels.ts と座標一致） */
export const SEED_AREAS = [
  { name: '渋谷・渋谷駅',     lat: 35.658, lng: 139.701, baseADR: 15000, count: 10 },
  { name: '新宿・新宿駅',     lat: 35.694, lng: 139.703, baseADR: 13000, count: 10 },
  { name: '大阪・梅田',       lat: 34.702, lng: 135.496, baseADR: 19000, count: 10 },
  { name: '京都・京都駅',     lat: 34.986, lng: 135.758, baseADR: 26000, count: 10 },
  { name: '名古屋・栄',       lat: 35.169, lng: 136.906, baseADR: 11000, count: 10 },
  { name: '博多・天神',       lat: 33.589, lng: 130.420, baseADR: 15000, count: 10 },
  { name: '札幌・大通',       lat: 43.062, lng: 141.354, baseADR: 10000, count: 10 },
  { name: '横浜・みなとみらい', lat: 35.455, lng: 139.631, baseADR: 16000, count: 10 },
  { name: '浅草・東京東部',   lat: 35.711, lng: 139.796, baseADR: 13500, count: 10 },
  { name: '品川・大崎',       lat: 35.629, lng: 139.739, baseADR: 14500, count: 10 },
  { name: '池袋・豊島',       lat: 35.729, lng: 139.711, baseADR: 11500, count: 10 },
  { name: '銀座・丸の内',     lat: 35.671, lng: 139.765, baseADR: 38000, count: 10 },
  { name: '沖縄・那覇',       lat: 26.212, lng: 127.679, baseADR: 14000, count: 10 },
  { name: '神戸・三ノ宮',     lat: 34.695, lng: 135.196, baseADR: 13000, count: 10 },
  { name: '仙台・駅前',       lat: 38.260, lng: 140.882, baseADR: 10000, count: 10 },
  { name: '上野・秋葉原',     lat: 35.714, lng: 139.777, baseADR: 12000, count: 7  },
  { name: '広島・広島駅',     lat: 34.396, lng: 132.460, baseADR: 11500, count: 7  },
  { name: '金沢・金沢駅',     lat: 36.578, lng: 136.648, baseADR: 14000, count: 6  },
  { name: '函館・函館駅',     lat: 41.769, lng: 140.729, baseADR: 14500, count: 5  },
  { name: '鹿児島・中央駅',   lat: 31.589, lng: 130.545, baseADR: 10500, count: 6  },
  { name: '長崎・長崎駅',     lat: 32.750, lng: 129.878, baseADR: 12000, count: 5  },
  { name: '奈良・奈良駅',     lat: 34.685, lng: 135.805, baseADR: 22000, count: 5  },
  { name: '軽井沢・リゾート', lat: 36.348, lng: 138.596, baseADR: 42000, count: 5  },
  { name: '熊本・熊本駅',     lat: 32.794, lng: 130.696, baseADR: 11000, count: 6  },
  { name: '福岡・天神',       lat: 33.589, lng: 130.398, baseADR: 14000, count: 8  },
] as const;
