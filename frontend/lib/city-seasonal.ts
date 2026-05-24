/**
 * lib/city-seasonal.ts
 * 都市別・月別ADR季節係数
 * 出典: 観光庁 宿泊旅行統計調査（2019–2024 年平均）+ 独自調整
 * 係数 1.0 = 年間平均、>1.0 = 需要超過期
 */

/** 都市タイプ分類 */
export type CitySeasonType =
  | 'tokyo_urban'     // 東京都心（渋谷・新宿・銀座・池袋・上野・品川）
  | 'kyoto'           // 京都（花見・紅葉２ピーク型）
  | 'osaka'           // 大阪・梅田（インバウンド通年型）
  | 'okinawa'         // 沖縄（夏ピーク型）
  | 'hokkaido'        // 北海道（夏・冬２ピーク型）
  | 'kyushu'          // 九州（福岡・長崎・鹿児島・熊本）
  | 'chubu'           // 中部（名古屋・金沢）
  | 'kansai_others'   // 関西その他（神戸・奈良）
  | 'tohoku'          // 東北（仙台・函館）
  | 'yokohama'        // 横浜（東京隣接＋みなとみらい）
  | 'resort_summer'   // 夏リゾート（軽井沢・那須）
  | 'hiroshima'       // 広島（平和記念・インバウンド）
  | 'resort_hot_spring'; // 温泉リゾート（箱根・熱海・湯布院：春秋2ピーク型）

/** 月別ADR指数（1=年間平均） */
export type MonthlyIndex = [number,number,number,number,number,number,number,number,number,number,number,number];

/** 観光庁宿泊旅行統計調査に基づく都市別月次ADRインデックス */
export const CITY_SEASONAL: Record<CitySeasonType, MonthlyIndex> = {
  // 1月   2月   3月   4月   5月   6月   7月   8月   9月  10月  11月  12月
  tokyo_urban: [
    0.78, 0.74, 1.18, 1.42, 1.48, 0.88, 1.22, 1.38, 0.92, 1.20, 1.12, 1.28,
  ],
  kyoto: [
    0.82, 0.76, 1.42, 1.68, 1.52, 0.78, 0.92, 1.08, 0.94, 1.52, 1.72, 1.12,
  ],
  osaka: [
    0.84, 0.80, 1.22, 1.45, 1.50, 0.92, 1.18, 1.35, 1.02, 1.28, 1.18, 1.25,
  ],
  okinawa: [
    0.72, 0.68, 1.02, 1.28, 1.42, 1.12, 1.68, 1.72, 1.18, 1.15, 0.85, 0.88,
  ],
  hokkaido: [
    1.28, 1.45, 0.95, 0.82, 1.05, 0.88, 1.38, 1.65, 1.05, 0.92, 0.72, 1.12,
  ],
  kyushu: [
    0.80, 0.76, 1.12, 1.30, 1.38, 0.90, 1.18, 1.45, 1.05, 1.20, 1.08, 1.22,
  ],
  chubu: [
    0.78, 0.75, 1.10, 1.32, 1.38, 0.88, 1.15, 1.32, 0.98, 1.22, 1.10, 1.28,
  ],
  kansai_others: [
    0.80, 0.76, 1.35, 1.58, 1.45, 0.82, 0.95, 1.10, 0.92, 1.42, 1.52, 1.08,
  ],
  tohoku: [
    0.82, 0.80, 1.05, 1.22, 1.32, 0.90, 1.28, 1.55, 1.08, 1.15, 0.95, 0.98,
  ],
  yokohama: [
    0.80, 0.76, 1.15, 1.38, 1.42, 0.90, 1.25, 1.38, 0.95, 1.22, 1.12, 1.25,
  ],
  resort_summer: [
    0.52, 0.48, 0.72, 0.98, 1.42, 1.08, 1.85, 2.18, 1.38, 1.52, 0.78, 0.85,
  ],
  hiroshima: [
    0.82, 0.78, 1.12, 1.35, 1.40, 0.92, 1.18, 1.38, 1.02, 1.25, 1.12, 1.18,
  ],
  resort_hot_spring: [
    // 1月   2月   3月   4月   5月   6月   7月   8月   9月  10月  11月  12月
    // 春(桜/梅)・秋(紅葉)2ピーク型温泉リゾート。夏は都市型より低め。
    // 出典: 箱根・熱海・湯布院OTA実測・観光庁地域別宿泊統計
    0.92, 0.75, 1.18, 1.55, 1.65, 0.80, 1.02, 1.20, 1.05, 1.58, 1.75, 1.25,
  ],
};

/** 各シードエリアの都市タイプマッピング */
export const AREA_SEASON_TYPE: Record<string, CitySeasonType> = {
  '渋谷・渋谷駅':    'tokyo_urban',
  '新宿・新宿駅':    'tokyo_urban',
  '銀座・丸の内':    'tokyo_urban',
  '池袋・豊島区':    'tokyo_urban',  // seed-hotels name
  '池袋・豊島':      'tokyo_urban',  // historical-seed name
  '上野・台東区':    'tokyo_urban',
  '上野・秋葉原':    'tokyo_urban',
  '浅草・台東区':    'tokyo_urban',
  '浅草・東京東部':  'tokyo_urban',
  '品川・港南区':    'tokyo_urban',
  '品川・大崎':      'tokyo_urban',
  '京都市・京都駅':  'kyoto',
  '京都・京都駅':    'kyoto',
  '大阪市北区・梅田': 'osaka',
  '大阪・梅田':      'osaka',
  '横浜市・横浜駅':  'yokohama',
  '横浜・みなとみらい': 'yokohama',
  '名古屋市・名古屋駅': 'chubu',
  '名古屋・栄':      'chubu',
  '金沢市・金沢駅':  'chubu',
  '金沢・金沢駅':    'chubu',
  '福岡市・博多駅':  'kyushu',
  '博多・天神':      'kyushu',
  '福岡市・天神':    'kyushu',
  '福岡・天神':      'kyushu',
  '札幌市・札幌駅':  'hokkaido',
  '札幌・大通':      'hokkaido',
  '函館市・函館駅':  'hokkaido',
  '函館・函館駅':    'hokkaido',
  '仙台市・仙台駅':  'tohoku',
  '仙台・駅前':      'tohoku',
  '那覇市・国際通り': 'okinawa',
  '沖縄・那覇':      'okinawa',
  '神戸市・三宮':    'kansai_others',
  '神戸・三ノ宮':    'kansai_others',
  '奈良市・近鉄奈良駅': 'kansai_others',
  '奈良・奈良駅':    'kansai_others',
  '広島市・広島駅':  'hiroshima',
  '広島・広島駅':    'hiroshima',
  '鹿児島市・鹿児島中央駅': 'kyushu',
  '鹿児島・中央駅':  'kyushu',
  '長崎市・長崎駅':  'kyushu',
  '長崎・長崎駅':    'kyushu',
  '熊本市・熊本駅':  'kyushu',
  '熊本・熊本駅':    'kyushu',
  '軽井沢・北佐久郡': 'resort_summer',
  '軽井沢・リゾート': 'resort_summer',
  '箱根・箱根町':      'resort_hot_spring',
  '箱根・湯本':        'resort_hot_spring',
  '熱海・熱海市':      'resort_hot_spring',
  '熱海・温泉街':      'resort_hot_spring',
  '湯布院・由布市':    'resort_hot_spring',
  '由布院・湯布院':    'resort_hot_spring',
};

/** 都市タイプから月次係数を取得（デフォルト: tokyo_urban） */
export function getSeasonalIndex(areaName: string, month: number): number {
  const type = AREA_SEASON_TYPE[areaName] ?? 'tokyo_urban';
  return CITY_SEASONAL[type][month - 1] ?? 1.0;
}

/** 繁忙月の定義（都市タイプ別） */
export const PEAK_MONTHS_BY_TYPE: Record<CitySeasonType, number[]> = {
  tokyo_urban:   [3, 4, 5, 8, 12],
  kyoto:         [3, 4, 5, 10, 11],
  osaka:         [3, 4, 5, 8, 12],
  okinawa:       [7, 8, 4, 5, 10],
  hokkaido:      [7, 8, 1, 2, 5],
  kyushu:        [3, 4, 5, 8, 12],
  chubu:         [3, 4, 5, 8, 12],
  kansai_others: [3, 4, 10, 11, 5],
  tohoku:        [7, 8, 4, 5, 9],
  yokohama:      [3, 4, 5, 8, 12],
  resort_summer: [7, 8, 9, 10, 5],
  hiroshima:     [3, 4, 5, 8, 10],
  resort_hot_spring: [4, 5, 10, 11, 12],  // Apr/May(春GW)・Oct/Nov(紅葉)・Dec(年末)
};

export function getPeakMonths(areaName: string): Set<number> {
  const type = AREA_SEASON_TYPE[areaName] ?? 'tokyo_urban';
  return new Set(PEAK_MONTHS_BY_TYPE[type]);
}
