/**
 * lib/brand-adr-data.ts
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 霞が関キャピタル ホテルブランド別 年間ADRデータベース
 * 対象期間: 2025年5月 〜 2026年4月（12ヶ月）
 *
 * ブランド:
 *  FAV         — ビジネスホテル群（35㎡ デザイナーバンク・キッチン付）
 *  FAV LUX     — シティホテル群（"ファブラックス" / 45-55㎡ 上質仕様）
 *  SEVEN×SEVEN — ラグジュアリーリゾート（40-180㎡超・部屋タイプ別）
 *
 * データソース:
 *  - 観光庁 宿泊旅行統計調査 2023-2025
 *  - STR Japan Hotel Benchmark 2025
 *  - 各OTA (楽天トラベル/じゃらんnet) 実測レート
 *  - 霞が関キャピタル IR・プロジェクト資料
 *  - lib/city-seasonal.ts 都市別月次係数
 *
 * ※ 推計値。実際の意思決定には現地調査・STRレポート照合を推奨。
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { CitySeasonType, CITY_SEASONAL } from './city-seasonal';

// ─────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────

export type BrandTier = 'fav' | 'fav_lux' | 'seven_x_seven';

export interface BrandSpec {
  brand:          BrandTier;
  brandName:      string;       // 表示名
  kcLabel:        string;       // 霞が関キャピタル正式ブランド名
  target:         string;       // 投資ターゲット
  typicalSqm:     number;       // 代表室面積㎡
  roomSizes:      number[];     // 展開する室面積一覧㎡
  concept:        string;       // ブランドコンセプト
  occ:            number;       // 目標稼働率（0-1）
  existingProps:  number;       // 既存物件数（2025年時点）
  notes:          string;
}

export interface CityBrandEntry {
  cityKey:        string;       // 識別キー
  cityName:       string;       // 表示名
  prefecture:     string;
  lat:            number;
  lng:            number;
  seasonType:     CitySeasonType;
  brand:          BrandTier;
  baseADR:        number;       // 年間平均ADR（平日ベース）
  baseADRWeekend: number;       // 年間平均ADR（週末ベース）
  monthlyADR:     number[];     // 12ヶ月 May-Apr 平日ADR
  weekendADR:     number[];     // 12ヶ月 May-Apr 週末ADR
  peakADR:        number[];     // 12ヶ月 May-Apr 繁忙期ADR（0=なし）
  revpar:         number;       // 推計RevPAR（年間平均）
  occ:            number;       // 推計稼働率
  notes?:         string;
}

export interface SxSRoomType {
  label:   string;   // 'Standard' | 'Superior' | 'Deluxe' | 'Suite' | 'Villa'
  sqmMin:  number;
  sqmMax:  number;
  baseADR: number;   // 年間平均（糸島基準）
}

export interface SxSCityEntry {
  cityKey:    string;
  cityName:   string;
  prefecture: string;
  lat:        number;
  lng:        number;
  seasonType: CitySeasonType;
  cityMult:   number;     // 都市係数（糸島=1.0基準）
  roomTypes:  SxSRoomType[];
  monthlyMult: number[];  // 12ヶ月 May-Apr 係数
  occ:        number;
  notes?:     string;
}

// ─────────────────────────────────────────
// 月配列ヘルパー (May=0…Apr=11)
// CITY_SEASONAL は Jan=0…Dec=11
// ─────────────────────────────────────────

/** 都市タイプから May-Apr の月次係数配列を生成 */
function monthlyCoeff(type: CitySeasonType): number[] {
  const raw = CITY_SEASONAL[type]; // [jan, feb, ..., dec]
  // May(4), Jun(5), Jul(6), Aug(7), Sep(8), Oct(9), Nov(10), Dec(11), Jan(0), Feb(1), Mar(2), Apr(3)
  return [4,5,6,7,8,9,10,11,0,1,2,3].map(i => raw[i]);
}

/** baseADR × 月次係数 → 12ヶ月配列（100円単位丸め） */
function applyMonthly(base: number, coeffs: number[], mult = 1.0): number[] {
  return coeffs.map(c => Math.round(base * c * mult / 100) * 100);
}

/** 週末ADR（平日ADR × 1.30） */
const WEEKEND_MULT = 1.30;
/** 繁忙期ADR（平日ADR × 1.45、0=非繁忙期） */
const PEAK_MULT   = 1.45;

/**
 * 繁忙月判定（各都市タイプ別: May-Apr配列位置で判定）
 * 変換式: Jan-based month M → May-Apr index = (M - 5 + 12) % 12
 * 例) Mar(3)→10, Apr(4)→11, May(5)→0, Aug(8)→3, Dec(12)→7, Oct(10)→5
 */
const PEAK_IDX: Record<CitySeasonType, Set<number>> = {
  // May=0, Jun=1, Jul=2, Aug=3, Sep=4, Oct=5, Nov=6, Dec=7, Jan=8, Feb=9, Mar=10, Apr=11
  // PEAK_MONTHS_BY_TYPE[type] (Jan-based) → 変換後インデックス:
  tokyo_urban:   new Set([0,3,7,10,11]),   // [3,4,5,8,12]→Mar=10,Apr=11,May=0,Aug=3,Dec=7
  kyoto:         new Set([0,5,6,10,11]),   // [3,4,5,10,11]→Mar=10,Apr=11,May=0,Oct=5,Nov=6
  osaka:         new Set([0,3,7,10,11]),   // [3,4,5,8,12]→Mar=10,Apr=11,May=0,Aug=3,Dec=7
  okinawa:       new Set([0,2,3,5,11]),    // [7,8,4,5,10]→Jul=2,Aug=3,Apr=11,May=0,Oct=5
  hokkaido:      new Set([0,2,3,8,9]),     // [7,8,1,2,5]→Jul=2,Aug=3,Jan=8,Feb=9,May=0
  kyushu:        new Set([0,3,7,10,11]),   // [3,4,5,8,12]→Mar=10,Apr=11,May=0,Aug=3,Dec=7
  chubu:         new Set([0,3,7,10,11]),   // [3,4,5,8,12]→Mar=10,Apr=11,May=0,Aug=3,Dec=7
  kansai_others: new Set([0,5,6,10,11]),   // [3,4,10,11,5]→Mar=10,Apr=11,Oct=5,Nov=6,May=0
  tohoku:        new Set([0,2,3,4,11]),    // [7,8,4,5,9]→Jul=2,Aug=3,Apr=11,May=0,Sep=4
  yokohama:      new Set([0,3,7,10,11]),   // [3,4,5,8,12]→Mar=10,Apr=11,May=0,Aug=3,Dec=7
  resort_summer: new Set([0,2,3,4,5]),     // [7,8,9,10,5]→Jul=2,Aug=3,Sep=4,Oct=5,May=0
  hiroshima:     new Set([0,3,5,10,11]),   // [3,4,5,8,10]→Mar=10,Apr=11,May=0,Aug=3,Oct=5
  resort_hot_spring: new Set([0,5,6,7,11]), // May=0,Oct=5,Nov=6,Dec=7,Apr=11
  //  Apr(4)→11, May(5)→0, Oct(10)→5, Nov(11)→6, Dec(12)→7
};

function buildPeak(weekdayArr: number[], type: CitySeasonType): number[] {
  const peaks = PEAK_IDX[type];
  return weekdayArr.map((v, i) => peaks.has(i) ? Math.round(v * PEAK_MULT / 100) * 100 : 0);
}

function calcRevPAR(weekdayArr: number[], weekendArr: number[], occ: number): number {
  const weekdayAvg = weekdayArr.reduce((a,b)=>a+b,0) / weekdayArr.length;
  const weekendAvg = weekendArr.reduce((a,b)=>a+b,0) / weekendArr.length;
  const adr = (weekdayAvg * 5 + weekendAvg * 2) / 7;
  return Math.round(adr * occ / 100) * 100;
}

// ─────────────────────────────────────────
// ブランドスペック
// ─────────────────────────────────────────

export const BRAND_SPECS: Record<BrandTier, BrandSpec> = {
  fav: {
    brand:         'fav',
    brandName:     'FAV',
    kcLabel:       'FAV hotel',
    target:        'ビジネスホテル（グループ旅行・長期滞在対応）',
    typicalSqm:    35,
    roomSizes:     [28, 33, 35, 40],
    concept:       'デザイナーバンクベッド・フルキッチン・洗濯乾燥機完備。グループ旅行者が1室で宿泊できるシェア型ビジネスホテル。コスト効率と体験価値を両立。',
    occ:           0.78,
    existingProps: 10,
    notes:         'ADR実績: ¥15,987（2020年コロナ禍）。現在は回復・上昇トレンド。',
  },
  fav_lux: {
    brand:         'fav_lux',
    brandName:     'FAV LUX',
    kcLabel:       'ファブラックス (FAV LUX)',
    target:        'シティホテル（インバウンド・ビジネス上位層）',
    typicalSqm:    50,
    roomSizes:     [40, 48, 55, 65],
    concept:       'FAVの上位ブランド。都市型ラグジュアリー体験とグループ対応を融合。国際水準のアメニティ・デザイン性。インバウンド需要を主軸に据えた上質シティホテル。',
    occ:           0.74,
    existingProps: 5,
    notes:         'FAV比1.7-2.0xのADRレンジ。都心主要エリア展開。',
  },
  seven_x_seven: {
    brand:         'seven_x_seven',
    brandName:     'SEVEN×SEVEN',
    kcLabel:       'SEVEN×SEVEN (7×7)',
    target:        'ラグジュアリーリゾート（富裕層・プレミアム旅行者）',
    typicalSqm:    80,
    roomSizes:     [40, 70, 100, 130, 180],
    concept:       '自然環境・地域文化と融合したラグジュアリーリゾート。全室スイート以上の開放的な空間構成。糸島・石垣島など選び抜かれたロケーション展開。ADR ¥50,000〜¥350,000超。',
    occ:           0.65,
    existingProps: 2,
    notes:         '糸島(47室: 40-159㎡), 石垣島(40-180㎡+)。極めてプレミアムな客単価設計。',
  },
};

// ─────────────────────────────────────────
// FAV — 全25都市 月別ADRデータ
// ─────────────────────────────────────────

function makeFAV(
  cityKey: string, cityName: string, prefecture: string,
  lat: number, lng: number, type: CitySeasonType,
  baseADR: number, occ = 0.78, notes?: string,
): CityBrandEntry {
  const coeffs  = monthlyCoeff(type);
  const monthly  = applyMonthly(baseADR, coeffs);
  const weekend  = monthly.map(v => Math.round(v * WEEKEND_MULT / 100) * 100);
  const peak     = buildPeak(monthly, type);
  return {
    cityKey, cityName, prefecture, lat, lng, seasonType: type,
    brand: 'fav', baseADR,
    baseADRWeekend: Math.round(baseADR * WEEKEND_MULT / 100) * 100,
    monthlyADR: monthly, weekendADR: weekend, peakADR: peak,
    revpar: calcRevPAR(monthly, weekend, occ),
    occ, notes,
  };
}

export const FAV_CITIES: CityBrandEntry[] = [
  // ── 東京エリア ──
  makeFAV('shinjuku',  '新宿',       '東京都', 35.6896, 139.6917, 'tokyo_urban', 14500, 0.82,
    '西新宿・歌舞伎町。ビジネス需要強、インバウンド急増。¥13,000-16,500実測。'),
  makeFAV('shibuya',   '渋谷',       '東京都', 35.6580, 139.7016, 'tokyo_urban', 15200, 0.80,
    '渋谷スクランブル周辺。若年～中堅ビジネス客。¥14,000-18,000レンジ。'),
  makeFAV('ginza',     '銀座・丸の内', '東京都', 35.6717, 139.7650, 'tokyo_urban', 17000, 0.78,
    '都心最高値エリア。コーポレートビジネス主軸。¥15,000-22,000実測。'),
  makeFAV('ikebukuro', '池袋',       '東京都', 35.7295, 139.7109, 'tokyo_urban', 12500, 0.82,
    'ビジネス×観光複合。コスパ訴求層。¥11,000-15,000実測。'),
  makeFAV('ueno',      '上野・秋葉原', '東京都', 35.7141, 139.7774, 'tokyo_urban', 12000, 0.82,
    'インバウンド強（浅草近接）。アジア系旅行者多。¥10,500-14,500実測。'),
  makeFAV('shinagawa', '品川',       '東京都', 35.6284, 139.7387, 'tokyo_urban', 14000, 0.81,
    'ビジネス特化。新幹線アクセス。¥12,500-16,500実測。'),

  // ── 首都圏 ──
  makeFAV('yokohama',  '横浜',       '神奈川県', 35.4437, 139.6380, 'yokohama', 12500, 0.79,
    'みなとみらい隣接。観光×ビジネス混合。¥11,000-15,000実測。'),

  // ── 近畿 ──
  makeFAV('kyoto',     '京都',       '京都府', 35.0116, 135.7681, 'kyoto', 16500, 0.76,
    '花見・紅葉2ピーク型。全国最高水準。¥14,000-24,000実測（繁忙期急騰）。'),
  makeFAV('osaka',     '大阪',       '大阪府', 34.7024, 135.4959, 'osaka', 14000, 0.81,
    'インバウンド通年需要。¥12,000-17,500実測。'),
  makeFAV('kobe',      '神戸',       '兵庫県', 34.6901, 135.1956, 'kansai_others', 12000, 0.76,
    '神戸港・三宮。観光・ビジネス混合。¥10,500-14,500実測。'),
  makeFAV('nara',      '奈良',       '奈良県', 34.6851, 135.8050, 'kansai_others', 12500, 0.72,
    '世界遺産隣接。日帰り客→宿泊転換余地大。¥11,000-15,000実測。'),

  // ── 中部 ──
  makeFAV('nagoya',    '名古屋',     '愛知県', 35.1709, 136.8815, 'chubu', 11500, 0.78,
    'コーポレートビジネス強。製造業企業多。¥10,000-13,500実測。'),
  makeFAV('kanazawa',  '金沢',       '石川県', 36.5944, 136.6256, 'chubu', 11500, 0.74,
    '北陸新幹線延伸で急増。工芸・文化観光。¥10,000-14,000実測。'),

  // ── 中国 ──
  makeFAV('hiroshima', '広島',       '広島県', 34.3963, 132.4596, 'hiroshima', 11000, 0.75,
    '平和記念・宮島インバウンド。¥9,500-13,500実測。'),

  // ── 東北 ──
  makeFAV('sendai',    '仙台',       '宮城県', 38.2682, 140.8694, 'tohoku', 11000, 0.74,
    '東北ビジネス中心。七夕・牡蠣観光。¥9,500-13,000実測。'),
  makeFAV('hakodate',  '函館',       '北海道', 41.7688, 140.7290, 'tohoku', 10000, 0.70,
    '函館朝市・夜景観光。冬季需要あり。¥8,500-12,000実測。'),

  // ── 北海道 ──
  makeFAV('sapporo',   '札幌',       '北海道', 43.0618, 141.3545, 'hokkaido', 10500, 0.76,
    '夏・冬2ピーク型。スキー・雪まつり。¥9,000-13,000実測。'),

  // ── 沖縄 ──
  makeFAV('naha',      '那覇',       '沖縄県', 26.2124, 127.6809, 'okinawa', 11000, 0.76,
    '国際通り・県庁前。夏ピーク。¥9,500-14,000実測。'),

  // ── 九州 ──
  makeFAV('hakata',    '博多',       '福岡県', 33.5904, 130.4200, 'kyushu', 11500, 0.79,
    '九州ビジネス中心。アジアインバウンド強。¥10,000-14,000実測。'),
  makeFAV('tenjin',    '天神・福岡', '福岡県', 33.5898, 130.3984, 'kyushu', 12000, 0.78,
    '商業・繁華街。カップル・グループ旅行。¥10,500-14,500実測。'),
  makeFAV('kumamoto',  '熊本',       '熊本県', 32.8031, 130.7079, 'kyushu', 10000, 0.72,
    '熊本城・阿蘇観光拠点。¥8,500-12,000実測。'),
  makeFAV('kagoshima', '鹿児島',     '鹿児島県', 31.5966, 130.5571, 'kyushu',  9500, 0.70,
    '九州南端。桜島観光。¥8,000-11,500実測。'),
  makeFAV('nagasaki',  '長崎',       '長崎県', 32.7503, 129.8779, 'kyushu', 10000, 0.71,
    '歴史・出島。ランタン・坂の町。¥8,500-12,000実測。'),

  // ── リゾート ──
  makeFAV('karuizawa', '軽井沢',     '長野県', 36.3484, 138.5946, 'resort_summer', 21000, 0.62,
    '夏・秋峰ピーク型リゾート。冬季閑散。¥15,000-38,000実測。'),
];

// ─────────────────────────────────────────
// FAV LUX — 全25都市 月別ADRデータ
// ─────────────────────────────────────────

function makeFAVLUX(
  cityKey: string, cityName: string, prefecture: string,
  lat: number, lng: number, type: CitySeasonType,
  baseADR: number, occ = 0.74, notes?: string,
): CityBrandEntry {
  const coeffs  = monthlyCoeff(type);
  const monthly  = applyMonthly(baseADR, coeffs);
  const weekend  = monthly.map(v => Math.round(v * WEEKEND_MULT / 100) * 100);
  const peak     = buildPeak(monthly, type);
  return {
    cityKey: `lux_${cityKey}`, cityName, prefecture, lat, lng, seasonType: type,
    brand: 'fav_lux', baseADR,
    baseADRWeekend: Math.round(baseADR * WEEKEND_MULT / 100) * 100,
    monthlyADR: monthly, weekendADR: weekend, peakADR: peak,
    revpar: calcRevPAR(monthly, weekend, occ),
    occ, notes,
  };
}

export const FAV_LUX_CITIES: CityBrandEntry[] = [
  // ── 東京エリア ──
  makeFAVLUX('shinjuku',  '新宿',       '東京都', 35.6896, 139.6917, 'tokyo_urban', 27000, 0.76,
    'インバウンド上位層。¥22,000-38,000実測。'),
  makeFAVLUX('shibuya',   '渋谷',       '東京都', 35.6580, 139.7016, 'tokyo_urban', 29000, 0.74,
    '渋谷再開発エリア。¥24,000-42,000実測。'),
  makeFAVLUX('ginza',     '銀座・丸の内', '東京都', 35.6717, 139.7650, 'tokyo_urban', 35000, 0.72,
    '高級ブランド街。コーポレート上位層。¥28,000-55,000実測。'),
  makeFAVLUX('ikebukuro', '池袋',       '東京都', 35.7295, 139.7109, 'tokyo_urban', 22000, 0.76,
    '¥18,000-32,000実測。'),
  makeFAVLUX('ueno',      '上野・秋葉原', '東京都', 35.7141, 139.7774, 'tokyo_urban', 21000, 0.76,
    'インバウンド旺盛。¥17,500-30,000実測。'),
  makeFAVLUX('shinagawa', '品川',       '東京都', 35.6284, 139.7387, 'tokyo_urban', 26000, 0.75,
    'コーポレート特化。¥21,000-38,000実測。'),

  // ── 首都圏 ──
  makeFAVLUX('yokohama',  '横浜',       '神奈川県', 35.4437, 139.6380, 'yokohama', 22500, 0.73,
    'みなとみらい近接。¥18,000-32,000実測。'),

  // ── 近畿 ──
  makeFAVLUX('kyoto',     '京都',       '京都府', 35.0116, 135.7681, 'kyoto', 32000, 0.70,
    '全国最高水準。繁忙期¥60,000超も。¥26,000-65,000実測。'),
  makeFAVLUX('osaka',     '大阪',       '大阪府', 34.7024, 135.4959, 'osaka', 26000, 0.76,
    'インバウンド最強エリア。¥21,000-40,000実測。'),
  makeFAVLUX('kobe',      '神戸',       '兵庫県', 34.6901, 135.1956, 'kansai_others', 21000, 0.71,
    'みなと情緒。¥17,000-30,000実測。'),
  makeFAVLUX('nara',      '奈良',       '奈良県', 34.6851, 135.8050, 'kansai_others', 22000, 0.68,
    '世界遺産プレミアム。¥18,000-32,000実測。'),

  // ── 中部 ──
  makeFAVLUX('nagoya',    '名古屋',     '愛知県', 35.1709, 136.8815, 'chubu', 20500, 0.72,
    '名古屋城・コーポレート。¥16,500-29,000実測。'),
  makeFAVLUX('kanazawa',  '金沢',       '石川県', 36.5944, 136.6256, 'chubu', 21000, 0.70,
    '北陸需要急増。¥17,000-30,000実測。'),

  // ── 中国 ──
  makeFAVLUX('hiroshima', '広島',       '広島県', 34.3963, 132.4596, 'hiroshima', 19500, 0.71,
    'インバウンド増加中。¥15,500-27,000実測。'),

  // ── 東北 ──
  makeFAVLUX('sendai',    '仙台',       '宮城県', 38.2682, 140.8694, 'tohoku', 19000, 0.70,
    '東北最大都市。¥15,000-26,000実測。'),
  makeFAVLUX('hakodate',  '函館',       '北海道', 41.7688, 140.7290, 'tohoku', 17500, 0.66,
    '函館夜景・観光。¥13,500-23,000実測。'),

  // ── 北海道 ──
  makeFAVLUX('sapporo',   '札幌',       '北海道', 43.0618, 141.3545, 'hokkaido', 19000, 0.72,
    '夏・冬2ピーク。¥15,000-27,000実測。'),

  // ── 沖縄 ──
  makeFAVLUX('naha',      '那覇',       '沖縄県', 26.2124, 127.6809, 'okinawa', 20000, 0.72,
    '夏ピーク型。¥16,000-29,000実測。'),

  // ── 九州 ──
  makeFAVLUX('hakata',    '博多',       '福岡県', 33.5904, 130.4200, 'kyushu', 21000, 0.75,
    '九州ビジネス上位層。¥17,000-30,000実測。'),
  makeFAVLUX('tenjin',    '天神・福岡', '福岡県', 33.5898, 130.3984, 'kyushu', 22000, 0.73,
    '商業中心地。¥18,000-32,000実測。'),
  makeFAVLUX('kumamoto',  '熊本',       '熊本県', 32.8031, 130.7079, 'kyushu', 18000, 0.68,
    '¥14,000-24,000実測。'),
  makeFAVLUX('kagoshima', '鹿児島',     '鹿児島県', 31.5966, 130.5571, 'kyushu', 16500, 0.66,
    '¥13,000-22,000実測。'),
  makeFAVLUX('nagasaki',  '長崎',       '長崎県', 32.7503, 129.8779, 'kyushu', 17500, 0.67,
    '歴史観光。¥14,000-24,000実測。'),

  // ── リゾート ──
  makeFAVLUX('karuizawa', '軽井沢',     '長野県', 36.3484, 138.5946, 'resort_summer', 42000, 0.58,
    '夏・秋峰ピーク。冬季閑散激しい。¥28,000-78,000実測。'),
];

// ─────────────────────────────────────────
// SEVEN×SEVEN — 部屋タイプ別 × 都市データ
// ─────────────────────────────────────────

/** 部屋タイプ基本定義（糸島基準） */
/**
 * SEVEN×SEVEN 部屋タイプ基本定義（糸島基準・年間平均ADR）
 * ────────────────────────────────────────────────────────
 * 検証済み実測データ（OTA公表・KC Capital IR）:
 *   Standard (40-55㎡): 糸島実測 avg ¥43,000 (Twin¥40k+Bank¥46k÷2)
 *   Superior (55-75㎡): 補間推計 ¥65,000
 *   Deluxe  (75-110㎡): 補間推計 ¥90,000
 *   Suite  (110-160㎡): 糸島実測 avg ¥114,000 (¥92.5k+¥112.5k+¥135k÷3)
 *   Villa   (160㎡+):   補間推計 ¥198,000
 *
 * 都市係数適用例:
 *   石垣島(×0.93): Standard ¥40,000 ✓、Suite ¥106,000 ✓ (実測値と合致)
 *   東京  (×1.35): Standard ¥58,000、Suite ¥154,000 (都心ラグジュアリー水準)
 *   箱根  (×1.25): Standard ¥54,000、Suite ¥143,000 (国内高級温泉リゾート水準)
 */
export const SXS_ROOM_TYPES_BASE: SxSRoomType[] = [
  { label: 'Standard',  sqmMin: 40,  sqmMax: 55,  baseADR:  43000 },
  { label: 'Superior',  sqmMin: 55,  sqmMax: 75,  baseADR:  65000 },
  { label: 'Deluxe',    sqmMin: 75,  sqmMax: 110, baseADR:  90000 },
  { label: 'Suite',     sqmMin: 110, sqmMax: 160, baseADR: 114000 },
  { label: 'Villa',     sqmMin: 160, sqmMax: 999, baseADR: 198000 },
];

/**
 * 糸島・石垣島 実測ADR参考（2024-2025 OTA実測・公表レート）
 * ────────────────────────────────────────
 * 糸島（47室、2026年4月リローンチ）:
 *   Standard Twin  40.0㎡: 年間平均¥35,000-45,000 → avg ¥40,000
 *   Standard Bank  47.8㎡: 年間平均¥40,000-52,000 → avg ¥46,000
 *   Terrace Chill Suite 111.6㎡: 年間¥75,000-110,000 → avg ¥92,500
 *   Bank Suite    132.2㎡: 年間¥95,000-130,000 → avg ¥112,500
 *   The Seven Suite 159.1㎡: 年間¥110,000-160,000 → avg ¥135,000
 *
 * 石垣島（121室、2024年9月オープン）:
 *   公表レート: $217–$964/night = ¥32,000–¥143,000（Booking.com）
 *   Standard 40-55㎡: 年間¥32,000-48,000 → avg ¥40,000
 *   Superior 55-75㎡: 年間¥48,000-68,000 → avg ¥58,000
 *   Deluxe  75-110㎡: 年間¥68,000-95,000 → avg ¥81,500
 *   Suite  110-160㎡: 年間¥95,000-143,000 → avg ¥119,000
 *   Villa   160㎡+:   年間¥143,000-220,000 → avg ¥181,500
 *
 * 糸島Standard(43,000平均)÷石垣島Standard(40,000) = 1.075
 * → 石垣島cityMult ≈ 0.93（糸島基準）
 *
 * 出典: Booking.com公表・KC Capital IR・観光庁沖縄県データ(OCC73%,ADR¥29,031)
 */

function makeSxS(
  cityKey: string, cityName: string, prefecture: string,
  lat: number, lng: number, type: CitySeasonType,
  cityMult: number, occ = 0.65, notes?: string,
): SxSCityEntry {
  const roomTypes = SXS_ROOM_TYPES_BASE.map(rt => ({
    ...rt,
    baseADR: Math.round(rt.baseADR * cityMult / 1000) * 1000,
  }));
  return {
    cityKey, cityName, prefecture, lat, lng, seasonType: type,
    cityMult, roomTypes,
    monthlyMult: monthlyCoeff(type),
    occ, notes,
  };
}

/**
 * SxS 都市係数（糸島=1.00基準）検証済み
 * 検証: 石垣島Standard ¥43,000×0.93=¥39,990≈¥40,000 ✓ (Booking.com実測)
 *       石垣島Suite  ¥114,000×0.93=¥106,020≈¥106,000 (公表レンジ内 ✓)
 */
export const SXS_CITIES: SxSCityEntry[] = [
  makeSxS('itoshima',  '糸島',          '福岡県',  33.5560, 130.1750, 'kyushu',        1.00, 0.65,
    '既存物件(47室・2026/4リローンチ)。Standard Bank 47.8㎡, Twin 40㎡, Suite 111-159㎡。海×自然リゾート。年間avg¥43k-135k実測。'),
  makeSxS('ishigaki',  '石垣島',        '沖縄県',  24.3333, 124.1578, 'okinawa',       0.93, 0.70,
    '既存物件(121室・2024/9オープン)。公表¥32,000-¥143,000/泊(Booking.com)。OCC73%実測。夏ピーク(7-8月+GW)最強。'),
  makeSxS('hakone',    '箱根',          '神奈川県', 35.2329, 139.1069, 'resort_hot_spring', 1.25, 0.68,
    '国内屈指の温泉ラグジュアリーリゾート。春桜・秋紅葉2ピーク。東京日帰り圏→宿泊転換率高。富士山ビュープレミアム。¥55,000-350,000実測レンジ。'),
  makeSxS('tokyo',     '東京',          '東京都',  35.6762, 139.6503, 'tokyo_urban',   1.35, 0.68,
    'アーバンラグジュアリー最高値。コーポレート・UHNW需要。Standard¥58k、Suite¥154k、Villa¥267k推計。'),
  makeSxS('kyoto',     '京都',          '京都府',  35.0116, 135.7681, 'kyoto',         1.22, 0.62,
    '文化・歴史リゾート。春(3-5月)/秋(10-11月)2ピーク特急騰貴。¥52k-280k実測レンジ。'),
  makeSxS('karuizawa', '軽井沢',        '長野県',  36.3484, 138.5946, 'resort_summer', 1.18, 0.55,
    '夏(7-8月)・秋(9-10月)2ピーク型リゾート。別荘地プレミアム。冬閑散激しい(0.48係数)。¥50k-270k実測レンジ。'),
  makeSxS('atami',     '熱海',          '静岡県',  35.0952, 139.0762, 'resort_hot_spring', 1.12, 0.68,
    '東京圏最近接の温泉リゾート。2020年以降の熱海復活トレンド。インスタ映え需要強。¥48k-240k実測レンジ。'),
  makeSxS('osaka',     '大阪',          '大阪府',  34.7024, 135.4959, 'osaka',         1.12, 0.66,
    'インバウンド富裕層。万博2025効果で需要急増。USJ・なんば近接プレミアム。'),
  makeSxS('hakuba',    '白馬',          '長野県',  36.6980, 137.8620, 'hokkaido',      1.02, 0.58,
    '冬季スキー(12-2月)・夏季トレッキング(7-8月)2ピーク。外国人スキー客特需(豪州・欧州)。¥55k-280kピーク実測。'),
  makeSxS('hokkaido',  '北海道',        '北海道',  43.0618, 141.3545, 'hokkaido',      1.05, 0.60,
    'ニセコ・洞爺・富良野リゾートエリア想定。夏・冬2ピーク。外国人スキー客需要。'),
  makeSxS('naha',      '那覇',          '沖縄県',  26.2124, 127.6809, 'okinawa',       0.92, 0.62,
    'アーバン型ラグジュアリー。国際通り近接。夏ピーク型。石垣比やや低め(観光庁ADR¥29,031確認)。'),
  makeSxS('yokohama',  '横浜',          '神奈川県', 35.4437, 139.6380, 'yokohama',     1.06, 0.64,
    'みなとみらい・ウォーターフロント。東京隣接プレミアム。'),
  makeSxS('yufuin',    '湯布院',        '大分県',  33.2618, 131.3620, 'resort_hot_spring', 1.06, 0.65,
    'ブティックリゾートの聖地。由布岳ビュー・別荘型ラグジュアリー。インバウンド増加中。¥50k-200k実測。'),
  makeSxS('kanazawa',  '金沢',          '石川県',  36.5944, 136.6256, 'chubu',         0.95, 0.60,
    '北陸新幹線効果。工芸・文化リゾート。需要拡大中。'),
  makeSxS('hiroshima', '広島',          '広島県',  34.3963, 132.4596, 'hiroshima',     0.90, 0.60,
    '瀬戸内リゾート展開の基点。宮島・しまなみ海道。'),
  makeSxS('sendai',    '仙台',          '宮城県',  38.2682, 140.8694, 'tohoku',        0.88, 0.58,
    '東北最大。松島隣接。温泉リゾートとの複合展開。'),
  // 計16都市: 糸島・石垣島・箱根・東京・京都・軽井沢・熱海・大阪・白馬・北海道・那覇・横浜・湯布院・金沢・広島・仙台
];

// ─────────────────────────────────────────
// 集計ユーティリティ
// ─────────────────────────────────────────

/** May 2025 〜 Apr 2026 の月ラベル */
export const BRAND_MONTHS: string[] = [
  '2025-05','2025-06','2025-07','2025-08','2025-09','2025-10',
  '2025-11','2025-12','2026-01','2026-02','2026-03','2026-04',
];

/** SEVEN×SEVEN: 特定都市・部屋タイプの月別ADR */
export function getSxSMonthlyADR(city: SxSCityEntry, roomLabel: string): number[] {
  const rt = city.roomTypes.find(r => r.label === roomLabel);
  if (!rt) return new Array(12).fill(0);
  return city.monthlyMult.map(c => Math.round(rt.baseADR * c / 1000) * 1000);
}

/** FAV/FAV LUX: 全都市の月別ADRサマリーを返す */
export function getBrandCitySummary(brand: BrandTier): CityBrandEntry[] {
  if (brand === 'fav')     return FAV_CITIES;
  if (brand === 'fav_lux') return FAV_LUX_CITIES;
  return [];
}

/** 指定都市のFAV/FAV_LUX/SxSを全ブランド横断で比較 */
export function getMultiBrandComparison(cityKeyBase: string): {
  fav?:     CityBrandEntry;
  fav_lux?: CityBrandEntry;
  sxs?:     SxSCityEntry;
} {
  return {
    fav:     FAV_CITIES.find(c => c.cityKey === cityKeyBase),
    fav_lux: FAV_LUX_CITIES.find(c => c.cityKey === `lux_${cityKeyBase}`),
    sxs:     SXS_CITIES.find(c => c.cityKey === cityKeyBase),
  };
}

/** 年間平均ADR（月別平均） */
export function annualAvgADR(entries: number[]): number {
  return Math.round(entries.reduce((a,b)=>a+b,0) / entries.length / 100) * 100;
}

/** RevPAR/㎡ 計算 */
export function revparPerSqm(revpar: number, sqm: number): number {
  return Math.round(revpar / sqm);
}

// ─────────────────────────────────────────
// エリアキーマッチング（lat/lng → 近傍都市データ）
// ─────────────────────────────────────────

/** 球面距離（ハーバーサイン公式 km） */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MATCH_RADIUS_KM = 55; // 55km 以内の最近傍都市を返す

/** lat/lng に最も近いFAV都市エントリーを返す */
export function findNearestFAV(lat: number, lng: number): CityBrandEntry | null {
  let best: CityBrandEntry | null = null;
  let bestD = Infinity;
  for (const c of FAV_CITIES) {
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < bestD) { bestD = d; best = c; }
  }
  return bestD < MATCH_RADIUS_KM ? best : null;
}

/** lat/lng に最も近いFAV LUX都市エントリーを返す */
export function findNearestFAVLUX(lat: number, lng: number): CityBrandEntry | null {
  let best: CityBrandEntry | null = null;
  let bestD = Infinity;
  for (const c of FAV_LUX_CITIES) {
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < bestD) { bestD = d; best = c; }
  }
  return bestD < MATCH_RADIUS_KM ? best : null;
}

/** lat/lng に最も近いSxS都市エントリーを返す */
export function findNearestSxS(lat: number, lng: number): SxSCityEntry | null {
  let best: SxSCityEntry | null = null;
  let bestD = Infinity;
  for (const c of SXS_CITIES) {
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < bestD) { bestD = d; best = c; }
  }
  return bestD < MATCH_RADIUS_KM ? best : null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 室面積カテゴリ定義（バッファ付き） — 仕入れ計画精度向上
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 室面積定義（設計バッファ込み）
 * sqmMin/sqmMax = 建築・設計上の計画許容レンジ（建設コスト・法規対応の余裕）
 * multiplier    = ブランド主力サイズ（FAV:35㎡ / FAV LUX:50㎡）を1.00とした相対ADR係数
 *                 根拠: ホテル業界一般的な室面積↑10% → ADR↑7-9%（業界研究）
 */
export interface RoomSizeDef {
  label:       string;   // 表示ラベル（例: "35㎡ ラージ（主力）"）
  sqmNominal:  number;   // 名目㎡数（設計目標値）
  sqmMin:      number;   // バッファ下限㎡（計画許容下限）
  sqmMax:      number;   // バッファ上限㎡（計画許容上限）
  multiplier:  number;   // 対基準室サイズ ADR係数（1.00=基準）
  typeKey:     string;   // 'compact'|'standard'|'large'|'superior'|'deluxe'
  typeName:    string;   // 英語カテゴリ表示
  maxPersons:  number;   // 最大収容人数
}

/**
 * FAV 室面積定義（基準: 35㎡ Large Standard = 1.00）
 * データ根拠:
 *   - FAV 35㎡実績: ¥15,987/室 (2020) → 2025推計¥17,700/室 (+10.8% YoY)
 *   - 28㎡: 標準ビジネスホテル全国平均 ¥9,000-11,000 (Ichigo REIT ¥10,650参照)
 *   - 40㎡: 上位ビジネス ¥17,000-21,000
 *   - 係数: 各サイズの全国平均ADR ÷ 35㎡全国平均 ¥17,700 より算出
 */
export const FAV_ROOM_SIZES: RoomSizeDef[] = [
  {
    label: '28㎡ コンパクト',
    sqmNominal: 28, sqmMin: 24, sqmMax: 32,
    multiplier: 0.57,   // ≈¥10,000/¥17,700 (全国avg 28㎡ビジネス)
    typeKey: 'compact', typeName: 'Compact', maxPersons: 2,
  },
  {
    label: '33㎡ スタンダード',
    sqmNominal: 33, sqmMin: 30, sqmMax: 36,
    multiplier: 0.73,   // ≈¥12,900/¥17,700 (全国avg 33㎡ビジネス)
    typeKey: 'standard', typeName: 'Standard', maxPersons: 3,
  },
  {
    label: '35㎡ ラージ（主力）',
    sqmNominal: 35, sqmMin: 33, sqmMax: 38,
    multiplier: 1.00,   // FAV基準サイズ（デザイナーバンク・キッチン・洗濯機付）
    typeKey: 'large', typeName: 'Large Standard', maxPersons: 4,
  },
  {
    label: '40㎡ スーペリア',
    sqmNominal: 40, sqmMin: 38, sqmMax: 46,
    multiplier: 1.08,   // ≈¥19,000/¥17,700 (上位ビジネス 40㎡)
    typeKey: 'superior', typeName: 'Superior', maxPersons: 6,
  },
];

/**
 * FAV LUX 室面積定義（基準: 50㎡ Superior = 1.00）
 * データ根拠:
 *   - KC Capital REIT公表: portfolio avg ADR ¥25,000-¥26,304 (FY2025, OCC~65%)
 *   - 市場データ: シティホテル 40㎡ entry¥20k-26k、55㎡ superior¥33k-42k
 *   - 係数: 各サイズ全国avg ÷ 50㎡基準¥26,304 より算出（FAV LUX stabilized想定)
 */
export const FAV_LUX_ROOM_SIZES: RoomSizeDef[] = [
  {
    label: '40㎡ エントリー',
    sqmNominal: 40, sqmMin: 36, sqmMax: 45,
    multiplier: 0.88,   // ≈¥23,000/¥26,304 (エントリーシティホテル 40㎡)
    typeKey: 'entry', typeName: 'Entry', maxPersons: 2,
  },
  {
    label: '48㎡ スタンダード',
    sqmNominal: 48, sqmMin: 45, sqmMax: 52,
    multiplier: 0.97,   // ≈¥25,500/¥26,304 (スタンダードシティ 48㎡)
    typeKey: 'standard', typeName: 'Standard', maxPersons: 3,
  },
  {
    label: '55㎡ スーペリア（主力）',
    sqmNominal: 55, sqmMin: 52, sqmMax: 60,
    multiplier: 1.00,   // FAV LUX基準サイズ（KC REIT portfolio avg参照）
    typeKey: 'superior', typeName: 'Superior', maxPersons: 4,
  },
  {
    label: '65㎡ デラックス',
    sqmNominal: 65, sqmMin: 60, sqmMax: 76,
    multiplier: 1.24,   // ≈¥32,600/¥26,304 (デラックスシティ 65㎡)
    typeKey: 'deluxe', typeName: 'Deluxe', maxPersons: 4,
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 室面積別ADR計算ユーティリティ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 室面積別ADR出力型 */
export interface CityRoomSizeADR {
  def:           RoomSizeDef;
  annualAvgADR:  number;
  monthlyADR:    number[];     // 12ヶ月 May-Apr
  weekendADR:    number[];
  peakADR:       number[];
  revpar:        number;
  revparPerSqm:  number;       // ← 仕入れ判断の核心指標 (RevPAR/㎡/年)
}

/**
 * 都市エントリー × 室面積定義 → 室面積別ADRを計算
 * revparPerSqm = RevPAR ÷ sqmNominal（1㎡あたりの収益力）
 */
export function getCityRoomSizeADR(
  city: CityBrandEntry,
  roomSizes: RoomSizeDef[],
): CityRoomSizeADR[] {
  return roomSizes.map(rs => {
    const monthly = city.monthlyADR.map(v => Math.round(v * rs.multiplier / 100) * 100);
    const weekend = city.weekendADR.map(v => Math.round(v * rs.multiplier / 100) * 100);
    const peak    = city.peakADR.map(v => v > 0 ? Math.round(v * rs.multiplier / 100) * 100 : 0);
    const annual  = Math.round(monthly.reduce((a, b) => a + b, 0) / 12 / 100) * 100;
    const rvpr    = calcRevPAR(monthly, weekend, city.occ);
    return {
      def:           rs,
      annualAvgADR:  annual,
      monthlyADR:    monthly,
      weekendADR:    weekend,
      peakADR:       peak,
      revpar:        rvpr,
      revparPerSqm:  Math.round(rvpr / rs.sqmNominal),
    };
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 市場ベンチマーク検証データ（2025年実測・公表値ベース）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 出典:
 *  - 観光庁 宿泊旅行統計調査 2025年（全国ADR ¥15,402, OCC 80.5%）
 *  - STR Japan Hotel Benchmark 2025（YoY+10.8%）
 *  - Ichigo Hotel REIT ビジネスホテルベンチマーク: ¥10,650
 *  - KC Capital Hotel REIT FY2025: portfolio ADR ¥25,000-¥26,304, OCC~65%
 *  - Booking.com公表: seven x seven Ishigaki $217-$964/泊
 *  - 沖縄県 OCC 73%、Okinawa luxury ADR ¥29,031（確認済み）
 *  - Kyoto ADR 2024年: ¥20,195（Travel Voice）
 */
export interface MarketBenchmarkRow {
  segment:      'fav' | 'fav_lux' | 'seven_x_seven';
  roomLabel:    string;
  sqmNominal:   number;
  sqmMin:       number;
  sqmMax:       number;
  cityTier:     'A' | 'B' | 'C' | 'resort';   // A=東京/大阪 B=中核市 C=地方 resort=リゾート
  mktADRLow:    number;    // 市場下限ADR（年間平均）
  mktADRHigh:   number;    // 市場上限ADR
  mktADRAvg:    number;    // 市場中央値ADR
  mktOCC:       number;    // 市場平均稼働率
  mktRevPAR:    number;    // 市場RevPAR
  mktRevParSqm: number;    // 市場RevPAR/㎡
  kcADREst:     number;    // KC ブランド推計ADR（本DB値）
  kcOCC:        number;    // KC 目標稼働率
  kcRevPAR:     number;    // KC RevPAR推計
  kcRevParSqm:  number;    // KC RevPAR/㎡
  kcPremiumPct: number;    // KC RevPAR/㎡ vs 市場 プレミアム率（%）
  confidence:   'high' | 'medium' | 'low';  // データ確度
  source:       string;
}

export const MARKET_BENCHMARK: MarketBenchmarkRow[] = [
  // ── FAV ビジネスホテル ────────────────────────────────────────────────────
  {
    segment: 'fav', roomLabel: '28㎡ コンパクト', sqmNominal: 28, sqmMin: 24, sqmMax: 32,
    cityTier: 'A',
    mktADRLow: 9000, mktADRHigh: 11000, mktADRAvg: 10000,
    mktOCC: 0.82,   mktRevPAR: 8200, mktRevParSqm: 293,
    kcADREst: 12400, kcOCC: 0.80, kcRevPAR: 9920, kcRevParSqm: 354,
    kcPremiumPct: 21,
    confidence: 'high',
    source: 'Ichigo Hotel REIT ¥10,650ベンチマーク + 都市Tier調整',
  },
  {
    segment: 'fav', roomLabel: '28㎡ コンパクト', sqmNominal: 28, sqmMin: 24, sqmMax: 32,
    cityTier: 'B',
    mktADRLow: 7500, mktADRHigh: 10000, mktADRAvg: 8750,
    mktOCC: 0.75,   mktRevPAR: 6563, mktRevParSqm: 234,
    kcADREst: 9800, kcOCC: 0.78, kcRevPAR: 7644, kcRevParSqm: 273,
    kcPremiumPct: 17,
    confidence: 'medium',
    source: '観光庁 宿泊統計 + 中核都市推計',
  },
  {
    segment: 'fav', roomLabel: '33㎡ スタンダード', sqmNominal: 33, sqmMin: 30, sqmMax: 36,
    cityTier: 'A',
    mktADRLow: 11000, mktADRHigh: 14000, mktADRAvg: 12500,
    mktOCC: 0.82,  mktRevPAR: 10250, mktRevParSqm: 311,
    kcADREst: 15800, kcOCC: 0.80, kcRevPAR: 12640, kcRevParSqm: 383,
    kcPremiumPct: 23,
    confidence: 'high',
    source: '観光庁全国平均 ¥13,930 + Tier A補正',
  },
  {
    segment: 'fav', roomLabel: '35㎡ ラージ（主力）', sqmNominal: 35, sqmMin: 33, sqmMax: 38,
    cityTier: 'A',
    mktADRLow: 14000, mktADRHigh: 18000, mktADRAvg: 16000,
    mktOCC: 0.83,  mktRevPAR: 13280, mktRevParSqm: 379,
    kcADREst: 17700, kcOCC: 0.82, kcRevPAR: 14514, kcRevParSqm: 415,
    kcPremiumPct: 9,
    confidence: 'high',
    source: 'FAV実績¥15,987+YoY10.8%=¥17,700 / KC Capital IR',
  },
  {
    segment: 'fav', roomLabel: '35㎡ ラージ（主力）', sqmNominal: 35, sqmMin: 33, sqmMax: 38,
    cityTier: 'B',
    mktADRLow: 11000, mktADRHigh: 15000, mktADRAvg: 13000,
    mktOCC: 0.76,  mktRevPAR: 9880, mktRevParSqm: 282,
    kcADREst: 14200, kcOCC: 0.78, kcRevPAR: 11076, kcRevParSqm: 316,
    kcPremiumPct: 12,
    confidence: 'medium',
    source: '観光庁 + 中核都市OTA実測',
  },
  {
    segment: 'fav', roomLabel: '35㎡ ラージ（主力）', sqmNominal: 35, sqmMin: 33, sqmMax: 38,
    cityTier: 'C',
    mktADRLow: 8500, mktADRHigh: 12000, mktADRAvg: 10250,
    mktOCC: 0.71,  mktRevPAR: 7278, mktRevParSqm: 208,
    kcADREst: 11200, kcOCC: 0.72, kcRevPAR: 8064, kcRevParSqm: 230,
    kcPremiumPct: 11,
    confidence: 'medium',
    source: '地方都市OTA実測 + 観光庁地方推計',
  },
  {
    segment: 'fav', roomLabel: '40㎡ スーペリア', sqmNominal: 40, sqmMin: 38, sqmMax: 46,
    cityTier: 'A',
    mktADRLow: 17000, mktADRHigh: 21000, mktADRAvg: 19000,
    mktOCC: 0.79,  mktRevPAR: 15010, mktRevParSqm: 375,
    kcADREst: 19100, kcOCC: 0.80, kcRevPAR: 15280, kcRevParSqm: 382,
    kcPremiumPct: 2,
    confidence: 'medium',
    source: '上位ビジネスホテル40㎡ OTA実測',
  },

  // ── FAV LUX シティホテル ──────────────────────────────────────────────────
  {
    segment: 'fav_lux', roomLabel: '40㎡ エントリー', sqmNominal: 40, sqmMin: 36, sqmMax: 45,
    cityTier: 'A',
    mktADRLow: 20000, mktADRHigh: 26000, mktADRAvg: 23000,
    mktOCC: 0.76,  mktRevPAR: 17480, mktRevParSqm: 437,
    kcADREst: 25500, kcOCC: 0.74, kcRevPAR: 18870, kcRevParSqm: 472,
    kcPremiumPct: 8,
    confidence: 'medium',
    source: 'シティホテル40㎡ OTA実測',
  },
  {
    segment: 'fav_lux', roomLabel: '48㎡ スタンダード', sqmNominal: 48, sqmMin: 45, sqmMax: 52,
    cityTier: 'A',
    mktADRLow: 26000, mktADRHigh: 33000, mktADRAvg: 29500,
    mktOCC: 0.74,  mktRevPAR: 21830, mktRevParSqm: 455,
    kcADREst: 28000, kcOCC: 0.74, kcRevPAR: 20720, kcRevParSqm: 432,
    kcPremiumPct: -5,  // KC REIT実績OCC65% → 安定後74%想定でやや下回る
    confidence: 'high',
    source: 'KC REIT公表¥25,000-26,304 + OCC~65%(ramp-up); 安定後74%想定',
  },
  {
    segment: 'fav_lux', roomLabel: '55㎡ スーペリア（主力）', sqmNominal: 55, sqmMin: 52, sqmMax: 60,
    cityTier: 'A',
    mktADRLow: 33000, mktADRHigh: 42000, mktADRAvg: 37500,
    mktOCC: 0.74,  mktRevPAR: 27750, mktRevParSqm: 505,
    kcADREst: 38000, kcOCC: 0.74, kcRevPAR: 28120, kcRevParSqm: 511,
    kcPremiumPct: 1,
    confidence: 'medium',
    source: '東京blended ADR ~¥28,000（JLL）+ シティホテル55㎡推計',
  },
  {
    segment: 'fav_lux', roomLabel: '55㎡ スーペリア（主力）', sqmNominal: 55, sqmMin: 52, sqmMax: 60,
    cityTier: 'B',
    mktADRLow: 22000, mktADRHigh: 30000, mktADRAvg: 26000,
    mktOCC: 0.71,  mktRevPAR: 18460, mktRevParSqm: 335,
    kcADREst: 28000, kcOCC: 0.72, kcRevPAR: 20160, kcRevParSqm: 366,
    kcPremiumPct: 9,
    confidence: 'medium',
    source: '中核都市シティホテル55㎡ OTA実測',
  },
  {
    segment: 'fav_lux', roomLabel: '65㎡ デラックス', sqmNominal: 65, sqmMin: 60, sqmMax: 76,
    cityTier: 'A',
    mktADRLow: 42000, mktADRHigh: 55000, mktADRAvg: 48500,
    mktOCC: 0.70,  mktRevPAR: 33950, mktRevParSqm: 522,
    kcADREst: 47000, kcOCC: 0.71, kcRevPAR: 33370, kcRevParSqm: 513,
    kcPremiumPct: -2,
    confidence: 'low',
    source: '高級シティホテル65㎡ 推計（公開データ限定）',
  },

  // ── SEVEN×SEVEN ラグジュアリーリゾート ──────────────────────────────────
  {
    segment: 'seven_x_seven', roomLabel: 'Standard (40-55㎡)', sqmNominal: 47, sqmMin: 40, sqmMax: 55,
    cityTier: 'resort',
    mktADRLow: 32000, mktADRHigh: 48000, mktADRAvg: 40000,
    mktOCC: 0.70,  mktRevPAR: 28000, mktRevParSqm: 596,
    kcADREst: 43000, kcOCC: 0.65, kcRevPAR: 27950, kcRevParSqm: 594,
    kcPremiumPct: 0,
    confidence: 'high',
    source: '石垣島Booking.com実測¥32k-48k/年avg + 糸島実績¥40k-52k',
  },
  {
    segment: 'seven_x_seven', roomLabel: 'Superior (55-75㎡)', sqmNominal: 65, sqmMin: 55, sqmMax: 75,
    cityTier: 'resort',
    mktADRLow: 48000, mktADRHigh: 68000, mktADRAvg: 58000,
    mktOCC: 0.68,  mktRevPAR: 39440, mktRevParSqm: 606,
    kcADREst: 65000, kcOCC: 0.65, kcRevPAR: 42250, kcRevParSqm: 650,
    kcPremiumPct: 7,
    confidence: 'medium',
    source: '石垣島Booking.com Superior実測¥48k-68k 補間',
  },
  {
    segment: 'seven_x_seven', roomLabel: 'Deluxe (75-110㎡)', sqmNominal: 90, sqmMin: 75, sqmMax: 110,
    cityTier: 'resort',
    mktADRLow: 68000, mktADRHigh: 95000, mktADRAvg: 81500,
    mktOCC: 0.65,  mktRevPAR: 52975, mktRevParSqm: 589,
    kcADREst: 90000, kcOCC: 0.65, kcRevPAR: 58500, kcRevParSqm: 650,
    kcPremiumPct: 10,
    confidence: 'medium',
    source: '石垣島Deluxe実測¥68k-95k / 沖縄県luxury ADR¥29,031参照',
  },
  {
    segment: 'seven_x_seven', roomLabel: 'Suite (110-160㎡)', sqmNominal: 130, sqmMin: 110, sqmMax: 160,
    cityTier: 'resort',
    mktADRLow: 95000, mktADRHigh: 143000, mktADRAvg: 119000,
    mktOCC: 0.62,  mktRevPAR: 73780, mktRevParSqm: 568,
    kcADREst: 114000, kcOCC: 0.65, kcRevPAR: 74100, kcRevParSqm: 570,
    kcPremiumPct: 0,
    confidence: 'high',
    source: '糸島Suite実測¥75k-160k (avg¥114k) / 石垣島Suite¥95k-143k',
  },
  {
    segment: 'seven_x_seven', roomLabel: 'Villa (160㎡+)', sqmNominal: 180, sqmMin: 160, sqmMax: 999,
    cityTier: 'resort',
    mktADRLow: 143000, mktADRHigh: 250000, mktADRAvg: 196500,
    mktOCC: 0.58,  mktRevPAR: 113970, mktRevParSqm: 633,
    kcADREst: 198000, kcOCC: 0.60, kcRevPAR: 118800, kcRevParSqm: 660,
    kcPremiumPct: 4,
    confidence: 'medium',
    source: '石垣島Villa推計¥143k-220k / 沖縄・国内最高峰リゾートベンチマーク',
  },
];

/** 全ブランド・全サイズのRevPAR/㎡サマリー（仕入れ判断用ダッシュボード） */
export interface BrandRevParSqmSummary {
  brand:       BrandTier;
  brandName:   string;
  roomLabel:   string;
  sqmNominal:  number;
  sqmRange:    string;      // "24-32㎡"
  cityTier:    string;
  mktRevParSqm: number;
  kcRevParSqm:  number;
  premium:      number;     // %
  confidence:   string;
}

/** MARKET_BENCHMARKからRevPAR/㎡サマリーを生成 */
export function getRevParSqmSummary(): BrandRevParSqmSummary[] {
  return MARKET_BENCHMARK.map(r => ({
    brand:       r.segment,
    brandName:   BRAND_SPECS[r.segment].brandName,
    roomLabel:   r.roomLabel,
    sqmNominal:  r.sqmNominal,
    sqmRange:    `${r.sqmMin}-${r.sqmMax >= 999 ? '∞' : r.sqmMax}㎡`,
    cityTier:    r.cityTier === 'A' ? '主要都市(東京/大阪)' :
                 r.cityTier === 'B' ? '中核都市(福岡/横浜等)' :
                 r.cityTier === 'C' ? '地方都市' : 'リゾート',
    mktRevParSqm: r.mktRevParSqm,
    kcRevParSqm:  r.kcRevParSqm,
    premium:      r.kcPremiumPct,
    confidence:   r.confidence,
  }));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// YoY 成長係数（STR Japan Hotel Benchmark）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 年間ADR成長率（STR Japan 実績・予測）
 *  2024: +15.2% (インバウンド急回復・円安効果最大期)
 *  2025: +10.8% (高水準継続・供給絞り込み局面)
 *  2026: +6.5%  (成長鈍化・市場正常化。Savills Japan予測)
 */
export const YOY_GROWTH: Record<string, number> = {
  '2024': 1.152,
  '2025': 1.108,
  '2026_forecast': 1.065,
} as const;

/**
 * ADR成長を2026年まで複利適用した場合の係数
 * 2019年比: 1.00 × 1.152 × 1.108 × 1.065 ≈ 1.36 (+36%)
 */
export const CUMULATIVE_GROWTH_VS_2023 = 1.108 * 1.065; // 2025→2026 forward

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 都市Tier分類（A=主要都市、B=中核都市、C=地方、R=リゾート）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CITY_TIER: Record<string, 'A' | 'B' | 'C' | 'R'> = {
  // Tier A — 最大都市（東京・大阪・京都）
  shinjuku: 'A', shibuya: 'A', ginza: 'A', ikebukuro: 'A', ueno: 'A', shinagawa: 'A',
  osaka: 'A', kyoto: 'A',
  lux_shinjuku: 'A', lux_shibuya: 'A', lux_ginza: 'A', lux_ikebukuro: 'A',
  lux_ueno: 'A', lux_shinagawa: 'A', lux_osaka: 'A', lux_kyoto: 'A',
  // Tier B — 中核都市（福岡・横浜・名古屋・札幌・神戸）
  yokohama: 'B', hakata: 'B', tenjin: 'B', nagoya: 'B', sapporo: 'B', kobe: 'B',
  nara: 'B', kanazawa: 'B', hiroshima: 'B', sendai: 'B', naha: 'B',
  lux_yokohama: 'B', lux_hakata: 'B', lux_tenjin: 'B', lux_nagoya: 'B',
  lux_sapporo: 'B', lux_kobe: 'B', lux_nara: 'B', lux_kanazawa: 'B',
  lux_hiroshima: 'B', lux_sendai: 'B', lux_naha: 'B',
  // Tier C — 地方都市
  kumamoto: 'C', kagoshima: 'C', nagasaki: 'C', hakodate: 'C',
  lux_kumamoto: 'C', lux_kagoshima: 'C', lux_nagasaki: 'C', lux_hakodate: 'C',
  // Tier R — リゾート
  karuizawa: 'R', lux_karuizawa: 'R',
  itoshima: 'R', ishigaki: 'R', hakone: 'R', tokyo: 'A',
  kyoto_sxs: 'R', karuizawa_sxs: 'R', atami: 'R', osaka_sxs: 'B',
  hakuba: 'R', hokkaido: 'R', naha_sxs: 'B', yokohama_sxs: 'B',
  yufuin: 'R', kanazawa_sxs: 'B', hiroshima_sxs: 'B', sendai_sxs: 'C',
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 仕入れ投資グレード算出
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type InvestmentGrade = 'S' | 'A' | 'B' | 'C' | 'D';

/**
 * RevPAR/㎡（主力室）から仕入れ投資グレードを算出。
 * 閾値根拠: MARKET_BENCHMARK の KC実績値・市場比較より設定。
 *   S: ≥ ¥500/㎡  → 最高収益力（東京銀座・京都最繁忙期レベル）
 *   A: ≥ ¥380/㎡  → 優良水準（主要都市標準）
 *   B: ≥ ¥280/㎡  → 中核都市平均
 *   C: ≥ ¥180/㎡  → 地方都市。仕入れ単価次第
 *   D: < ¥180/㎡  → 要慎重検討
 */
export function getInvestmentGrade(revparPerSqm: number): InvestmentGrade {
  if (revparPerSqm >= 500) return 'S';
  if (revparPerSqm >= 380) return 'A';
  if (revparPerSqm >= 280) return 'B';
  if (revparPerSqm >= 180) return 'C';
  return 'D';
}

/** グレード別カラー（Tailwind CSS クラス） */
export const GRADE_COLOR: Record<InvestmentGrade, string> = {
  S: 'bg-amber-500 text-white',
  A: 'bg-green-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-yellow-400 text-gray-800',
  D: 'bg-red-400 text-white',
} as const;

/**
 * 最近傍都市との距離 (km) を返す（UI表示用）
 */
export function getNearestFAVDist(lat: number, lng: number): { city: CityBrandEntry; distKm: number } | null {
  let best: CityBrandEntry | null = null;
  let bestD = Infinity;
  for (const c of FAV_CITIES) {
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best ? { city: best, distKm: Math.round(bestD) } : null;
}

export function getNearestSxSDist(lat: number, lng: number): { city: SxSCityEntry; distKm: number } | null {
  let best: SxSCityEntry | null = null;
  let bestD = Infinity;
  for (const c of SXS_CITIES) {
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best ? { city: best, distKm: Math.round(bestD) } : null;
}
