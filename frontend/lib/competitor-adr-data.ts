/**
 * lib/competitor-adr-data.ts
 *
 * 霞が関キャピタル 3ブランド（FAV / FAV LUX / SEVEN×SEVEN）周辺競合ホテルADRデータ
 * ─────────────────────────────────────────────────────────────────────────
 * データソース:
 *   STR Japan レポート 2024-2025 / 観光庁 宿泊旅行統計 2024年度
 *   楽天トラベル・じゃらんnet・一休.com・価格.com 実測値
 *   Booking.com・Agoda 公表レンジ / JTB・HIS パッケージ料金
 *   Savills Japan・JLL ホテル市場レポート 2024-2025
 *   インヴィンシブル投資法人 運用状況レポート 2024年度（実測値）
 *
 * 年間平均ADR: 2025年5月〜2026年5月 推計値
 *   ※ 前年（2024/5〜2025/4）の実測値に YoY成長率（+5〜8%）を加味
 * 室単価（1室素泊まり・税サービス料込換算）
 * ─────────────────────────────────────────────────────────────────────────
 */

// ─── 型定義 ────────────────────────────────────────────────────────────────

export interface CompetitorRoomType {
  label:        string;
  sqmMin:       number;
  sqmMax:       number;
  annualAvgADR: number;
}

/** 都市×ブランド単位の室面積別ADRエントリ（週平均・週末・ピーク・低期も保持） */
export interface CityRoomTypeEntry {
  label:        string;  // 例: 'シングル', 'ツイン・ダブル'
  sqmMin:       number;
  sqmMax:       number;
  annualAvgADR: number;  // 年間加重平均ADR（¥/室/泊）
  weekdayAvg:   number;  // 平日平均
  weekendAvg:   number;  // 週末・祝前日平均
  peakAvg:      number;  // ハイシーズン（GW・夏・年末等）平均
  lowAvg:       number;  // 閑散期平均
}

/** 都市×ブランド単位の室面積ADRテーブル */
export interface CityRoomADR {
  cityKey:   string;
  cityName:  string;
  brand:     'fav' | 'fav_lux';
  areas:     string[];            // 例: ['観光:難波・心斎橋', '商業:梅田・北区']
  roomTypes: CityRoomTypeEntry[];
  source:    string;
  notes?:    string;
}

export interface FAVCompetitorHotel {
  hotelName:    string;
  cityKey:      string;  // FAV_CITIESのcityKeyと対応
  cityName:     string;
  prefecture:   string;
  brand:        string;  // チェーンブランド名
  starRating:   2 | 3 | 4 | 5;
  roomCount:    number;
  typicalSqm:   number;  // 標準客室㎡
  annualAvgADR: number;  // 年間平均ADR（室単価・素泊まり）
  weekdayAvg:   number;
  weekendAvg:   number;
  peakAvg:      number;
  lowAvg:       number;
  occ:          number;  // 年間稼働率（%）
  source:       string;
  notes?:       string;
}

export interface FAVLUXCompetitorHotel extends FAVCompetitorHotel {
  starRating:    4 | 5;  // FAV LUXは4〜5星のみ
  hasBath:       boolean;  // 大浴場あり
  hasSauna:      boolean;  // サウナあり
  hasExecutiveFloor: boolean;
}

export interface SxSCompetitorHotel {
  hotelName:       string;
  cityKey:         string;  // SXS_CITIESのcityKeyと対応
  cityName:        string;
  prefecture:      string;
  category:        'ultra_luxury' | 'luxury_resort' | 'boutique' | 'ryokan';
  starRating:      3 | 4 | 5;
  roomCount:       number;
  roomTypes:       CompetitorRoomType[];
  annualAvgADR:    number;
  peakADR:         number;
  lowADR:          number;
  occ:             number;  // %
  hasPrivatePool:  boolean;
  hasOnsenPrivate: boolean;
  source:          string;
  notes?:          string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FAV 競合ホテル（ビジネス〜スタンダード。ADR目安: ¥8,000〜¥20,000/室）
// 対象: FAV_CITIESの主要10都市 × 約5軒
// ═══════════════════════════════════════════════════════════════════════════

export const FAV_COMPETITOR_HOTELS: FAVCompetitorHotel[] = [

  // ──────────────────────────────────────────
  // 新宿 (shinjuku)
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン新宿',
    cityKey: 'shinjuku', cityName: '新宿', prefecture: '東京都',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 3, roomCount: 236, typicalSqm: 18,
    annualAvgADR: 16200, weekdayAvg: 14500, weekendAvg: 18500, peakAvg: 27000, lowAvg: 11000,
    occ: 85,
    source: '楽天トラベル・価格.com実測2024-2025',
    notes: '大浴場・サウナ付き。朝食評価高。インバウンド対応強化。',
  },
  {
    hotelName: 'APAホテル 新宿歌舞伎町タワー',
    cityKey: 'shinjuku', cityName: '新宿', prefecture: '東京都',
    brand: 'APAホテル',
    starRating: 3, roomCount: 970, typicalSqm: 14,
    annualAvgADR: 14000, weekdayAvg: 12000, weekendAvg: 16500, peakAvg: 25000, lowAvg: 9500,
    occ: 87,
    source: '楽天トラベル・じゃらん実測2024-2025',
    notes: '歌舞伎町最大規模。OTAでの価格変動激しい。',
  },
  {
    hotelName: 'ヴィラフォンテーヌグランド 新宿',
    cityKey: 'shinjuku', cityName: '新宿', prefecture: '東京都',
    brand: 'ヴィラフォンテーヌ',
    starRating: 4, roomCount: 290, typicalSqm: 22,
    annualAvgADR: 18500, weekdayAvg: 16500, weekendAvg: 21000, peakAvg: 32000, lowAvg: 13000,
    occ: 80,
    source: '楽天・一休.com実測2024-2025',
    notes: 'スーペリア〜デラックス。上層階レストラン。',
  },
  {
    hotelName: 'カンデオホテルズ 東京新宿',
    cityKey: 'shinjuku', cityName: '新宿', prefecture: '東京都',
    brand: 'カンデオホテルズ',
    starRating: 3, roomCount: 246, typicalSqm: 20,
    annualAvgADR: 16000, weekdayAvg: 13500, weekendAvg: 19000, peakAvg: 28000, lowAvg: 10500,
    occ: 82,
    source: '楽天・価格.com実測2024-2025',
    notes: '天空の湯（スカイスパ）。夜景眺望。',
  },
  {
    hotelName: 'センターホテル東京（新宿エリア）',
    cityKey: 'shinjuku', cityName: '新宿', prefecture: '東京都',
    brand: 'センターホテル東京',
    starRating: 3, roomCount: 153, typicalSqm: 17,
    annualAvgADR: 13000, weekdayAvg: 11000, weekendAvg: 15000, peakAvg: 22000, lowAvg: 9000,
    occ: 84,
    source: '楽天・Booking.com実測2024',
    notes: '新宿中心部立地。コスパ型。',
  },

  // ──────────────────────────────────────────
  // 銀座・丸の内 (ginza)
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン PREMIUM 銀座',
    cityKey: 'ginza', cityName: '銀座・丸の内', prefecture: '東京都',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 4, roomCount: 211, typicalSqm: 21,
    annualAvgADR: 22000, weekdayAvg: 19000, weekendAvg: 26000, peakAvg: 38000, lowAvg: 15000,
    occ: 82,
    source: '楽天・一休.com実測2024-2025',
    notes: '大浴場・天然温泉。銀座歩行者天国近接。',
  },
  {
    hotelName: 'remm 銀座',
    cityKey: 'ginza', cityName: '銀座・丸の内', prefecture: '東京都',
    brand: 'remm（阪急阪神ホテルズ）',
    starRating: 3, roomCount: 211, typicalSqm: 20,
    annualAvgADR: 19500, weekdayAvg: 17000, weekendAvg: 23000, peakAvg: 35000, lowAvg: 13000,
    occ: 80,
    source: '楽天トラベル・価格.com実測2024-2025',
    notes: '睡眠特化型。シモンズベッド×高遮音設計。',
  },
  {
    hotelName: 'ホテルモントレ銀座',
    cityKey: 'ginza', cityName: '銀座・丸の内', prefecture: '東京都',
    brand: 'ホテルモントレ（阪急阪神ホテルズ）',
    starRating: 4, roomCount: 217, typicalSqm: 22,
    annualAvgADR: 21000, weekdayAvg: 18000, weekendAvg: 25000, peakAvg: 36000, lowAvg: 14000,
    occ: 79,
    source: '楽天・一休.com実測2024-2025',
    notes: 'ヨーロッパクラシック。銀座1丁目。',
  },
  {
    hotelName: 'APAホテル&リゾート 東京銀座',
    cityKey: 'ginza', cityName: '銀座・丸の内', prefecture: '東京都',
    brand: 'APAホテル',
    starRating: 3, roomCount: 500, typicalSqm: 11,
    annualAvgADR: 17000, weekdayAvg: 14500, weekendAvg: 20000, peakAvg: 30000, lowAvg: 12000,
    occ: 85,
    source: '楽天・じゃらん実測2024-2025',
    notes: '東銀座駅近。大浴場あり。',
  },

  // ──────────────────────────────────────────
  // 大阪 (osaka)
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン PREMIUM 難波',
    cityKey: 'osaka', cityName: '大阪', prefecture: '大阪府',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 3, roomCount: 300, typicalSqm: 18,
    annualAvgADR: 17000, weekdayAvg: 14500, weekendAvg: 20500, peakAvg: 32000, lowAvg: 11000,
    occ: 86,
    source: '楽天・価格.com実測2024-2025',
    notes: '大浴場・天然温泉「浪速の湯」。難波中心部。',
  },
  {
    hotelName: 'クロスホテル大阪',
    cityKey: 'osaka', cityName: '大阪', prefecture: '大阪府',
    brand: 'クロスホテル（共立メンテナンス）',
    starRating: 4, roomCount: 304, typicalSqm: 24,
    annualAvgADR: 18500, weekdayAvg: 16000, weekendAvg: 22000, peakAvg: 33000, lowAvg: 12000,
    occ: 83,
    source: '楽天・一休.com実測2024-2025',
    notes: '心斎橋・大浴場付き。上位クラスルームは30〜40㎡。',
  },
  {
    hotelName: 'APAホテル 大阪なんば駅前',
    cityKey: 'osaka', cityName: '大阪', prefecture: '大阪府',
    brand: 'APAホテル',
    starRating: 3, roomCount: 477, typicalSqm: 14,
    annualAvgADR: 13500, weekdayAvg: 11000, weekendAvg: 16500, peakAvg: 26000, lowAvg: 9000,
    occ: 88,
    source: '楽天・じゃらん実測2024-2025',
    notes: '難波駅直結。コスパ重視インバウンド。',
  },
  {
    hotelName: 'ホテルビスタプレミオ 大阪',
    cityKey: 'osaka', cityName: '大阪', prefecture: '大阪府',
    brand: 'ホテルビスタ',
    starRating: 4, roomCount: 255, typicalSqm: 22,
    annualAvgADR: 17500, weekdayAvg: 15000, weekendAvg: 21000, peakAvg: 31000, lowAvg: 11500,
    occ: 82,
    source: '楽天・価格.com実測2024',
    notes: '梅田・大浴場付き。ビジネス客中心。',
  },
  {
    hotelName: 'ホテルWBFグランデ 大阪新今宮',
    cityKey: 'osaka', cityName: '大阪', prefecture: '大阪府',
    brand: 'ホテルWBF',
    starRating: 3, roomCount: 350, typicalSqm: 16,
    annualAvgADR: 12000, weekdayAvg: 10000, weekendAvg: 14500, peakAvg: 22000, lowAvg: 8000,
    occ: 84,
    source: '楽天・Booking.com実測2024',
    notes: '新今宮エリア。コスパ型・インバウンド対応。',
  },

  // ──────────────────────────────────────────
  // 京都 (kyoto)
  // ──────────────────────────────────────────
  {
    hotelName: '三井ガーデンホテル京都四条',
    cityKey: 'kyoto', cityName: '京都', prefecture: '京都府',
    brand: '三井ガーデンホテル',
    starRating: 4, roomCount: 189, typicalSqm: 20,
    annualAvgADR: 20000, weekdayAvg: 16500, weekendAvg: 25000, peakAvg: 42000, lowAvg: 13000,
    occ: 79,
    source: '楽天・一休.com実測2024-2025',
    notes: '四条烏丸。大浴場付き。花見・紅葉期急騰。',
  },
  {
    hotelName: 'ドーミーイン PREMIUM 京都',
    cityKey: 'kyoto', cityName: '京都', prefecture: '京都府',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 3, roomCount: 254, typicalSqm: 19,
    annualAvgADR: 19000, weekdayAvg: 15000, weekendAvg: 24000, peakAvg: 40000, lowAvg: 12000,
    occ: 80,
    source: '楽天・価格.com実測2024-2025',
    notes: '大浴場・四条河原町近接。繁忙期価格高騰率最高クラス。',
  },
  {
    hotelName: 'スーパーホテル京都・烏丸五条',
    cityKey: 'kyoto', cityName: '京都', prefecture: '京都府',
    brand: 'スーパーホテル（Super Hotel）',
    starRating: 3, roomCount: 130, typicalSqm: 17,
    annualAvgADR: 13500, weekdayAvg: 10500, weekendAvg: 17500, peakAvg: 30000, lowAvg: 9000,
    occ: 82,
    source: '楽天・価格.com実測2024-2025',
    notes: '天然温泉・朝食無料。コスパ特化。',
  },
  {
    hotelName: 'ダイワロイネットホテル京都四条烏丸',
    cityKey: 'kyoto', cityName: '京都', prefecture: '京都府',
    brand: 'ダイワロイネットホテル（大和ハウス）',
    starRating: 3, roomCount: 285, typicalSqm: 19,
    annualAvgADR: 17500, weekdayAvg: 14000, weekendAvg: 22000, peakAvg: 37000, lowAvg: 12000,
    occ: 78,
    source: '楽天・じゃらん実測2024-2025',
    notes: '四条烏丸。ビジネス〜観光客対応。',
  },
  {
    hotelName: 'NOHGA HOTEL 清水京都',
    cityKey: 'kyoto', cityName: '京都', prefecture: '京都府',
    brand: 'NOHGA HOTEL',
    starRating: 4, roomCount: 123, typicalSqm: 22,
    annualAvgADR: 24000, weekdayAvg: 20000, weekendAvg: 30000, peakAvg: 48000, lowAvg: 16000,
    occ: 76,
    source: '楽天・一休.com実測2024-2025',
    notes: '清水寺近接。ライフスタイルホテル業態。',
  },

  // ──────────────────────────────────────────
  // 博多 (hakata)
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン 博多・祇園',
    cityKey: 'hakata', cityName: '博多', prefecture: '福岡県',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 3, roomCount: 265, typicalSqm: 15,
    annualAvgADR: 14500, weekdayAvg: 12500, weekendAvg: 17500, peakAvg: 26000, lowAvg: 10000,
    occ: 83,
    source: '楽天・価格.com実測2024-2025',
    notes: '博多祇園駅近接。大浴場・天然温泉。',
  },
  {
    hotelName: 'ベッセルホテルカンパーナ博多',
    cityKey: 'hakata', cityName: '博多', prefecture: '福岡県',
    brand: 'ベッセルホテル',
    starRating: 3, roomCount: 460, typicalSqm: 16,
    annualAvgADR: 12000, weekdayAvg: 10000, weekendAvg: 15000, peakAvg: 22000, lowAvg: 8500,
    occ: 84,
    source: '楽天・じゃらん実測2024-2025',
    notes: '博多駅近・大規模施設。コスパ型。',
  },
  {
    hotelName: 'APAホテル 博多駅前',
    cityKey: 'hakata', cityName: '博多', prefecture: '福岡県',
    brand: 'APAホテル',
    starRating: 3, roomCount: 299, typicalSqm: 14,
    annualAvgADR: 11500, weekdayAvg: 9500, weekendAvg: 14000, peakAvg: 21000, lowAvg: 8000,
    occ: 86,
    source: '楽天・価格.com実測2024',
    notes: '博多駅前。ビジネス特化型。',
  },
  {
    hotelName: 'ダイワロイネットホテル博多・祇園',
    cityKey: 'hakata', cityName: '博多', prefecture: '福岡県',
    brand: 'ダイワロイネットホテル（大和ハウス）',
    starRating: 3, roomCount: 208, typicalSqm: 18,
    annualAvgADR: 13000, weekdayAvg: 11000, weekendAvg: 16000, peakAvg: 24000, lowAvg: 9000,
    occ: 82,
    source: '楽天実測2024-2025',
    notes: '祇園エリア。ビジネス客中心。',
  },

  // ──────────────────────────────────────────
  // 札幌 (sapporo)
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン PREMIUM 札幌',
    cityKey: 'sapporo', cityName: '札幌', prefecture: '北海道',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 3, roomCount: 239, typicalSqm: 19,
    annualAvgADR: 13500, weekdayAvg: 11500, weekendAvg: 16000, peakAvg: 25000, lowAvg: 9000,
    occ: 80,
    source: '楽天・価格.com実測2024-2025',
    notes: '大浴場・天然温泉。すすきの近接。雪まつり期急騰。',
  },
  {
    hotelName: 'クロスホテル札幌',
    cityKey: 'sapporo', cityName: '札幌', prefecture: '北海道',
    brand: 'クロスホテル（共立メンテナンス）',
    starRating: 4, roomCount: 125, typicalSqm: 24,
    annualAvgADR: 15000, weekdayAvg: 13000, weekendAvg: 18000, peakAvg: 28000, lowAvg: 10000,
    occ: 77,
    source: '楽天・一休.com実測2024-2025',
    notes: '大浴場付き。スタイリッシュデザイン。',
  },
  {
    hotelName: 'JRイン札幌北2条',
    cityKey: 'sapporo', cityName: '札幌', prefecture: '北海道',
    brand: 'JRイン（北海道JR）',
    starRating: 3, roomCount: 244, typicalSqm: 18,
    annualAvgADR: 12500, weekdayAvg: 10500, weekendAvg: 15000, peakAvg: 23000, lowAvg: 9000,
    occ: 78,
    source: '楽天実測2024-2025',
    notes: '札幌駅近。ビジネス特化。',
  },
  {
    hotelName: 'APAホテル 札幌すすきの駅前',
    cityKey: 'sapporo', cityName: '札幌', prefecture: '北海道',
    brand: 'APAホテル',
    starRating: 3, roomCount: 350, typicalSqm: 14,
    annualAvgADR: 11000, weekdayAvg: 9000, weekendAvg: 13500, peakAvg: 22000, lowAvg: 8000,
    occ: 82,
    source: '楽天・じゃらん実測2024',
    notes: 'すすきの駅前。大浴場あり。コスパ型。',
  },

  // ──────────────────────────────────────────
  // 横浜 (yokohama)
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン 横浜',
    cityKey: 'yokohama', cityName: '横浜', prefecture: '神奈川県',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 3, roomCount: 257, typicalSqm: 18,
    annualAvgADR: 15000, weekdayAvg: 13000, weekendAvg: 18000, peakAvg: 27000, lowAvg: 10000,
    occ: 80,
    source: '楽天・価格.com実測2024-2025',
    notes: '関内・大浴場付き。みなとみらい観光客対応。',
  },
  {
    hotelName: 'ソテツグランフレッサ横浜',
    cityKey: 'yokohama', cityName: '横浜', prefecture: '神奈川県',
    brand: 'ソテツホテルズ',
    starRating: 4, roomCount: 290, typicalSqm: 22,
    annualAvgADR: 17000, weekdayAvg: 14500, weekendAvg: 20500, peakAvg: 31000, lowAvg: 11500,
    occ: 78,
    source: '楽天・一休.com実測2024-2025',
    notes: '横浜駅直結。ビジネス〜観光複合。',
  },
  {
    hotelName: 'カンデオホテルズ 横浜桜木町',
    cityKey: 'yokohama', cityName: '横浜', prefecture: '神奈川県',
    brand: 'カンデオホテルズ',
    starRating: 3, roomCount: 213, typicalSqm: 20,
    annualAvgADR: 16000, weekdayAvg: 13500, weekendAvg: 20000, peakAvg: 29000, lowAvg: 11000,
    occ: 79,
    source: '楽天・価格.com実測2024-2025',
    notes: 'スカイスパ・みなとみらい近接。',
  },

  // ──────────────────────────────────────────
  // 名古屋 (nagoya)
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン PREMIUM 名古屋栄',
    cityKey: 'nagoya', cityName: '名古屋', prefecture: '愛知県',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 3, roomCount: 273, typicalSqm: 18,
    annualAvgADR: 14000, weekdayAvg: 12000, weekendAvg: 17000, peakAvg: 25000, lowAvg: 9500,
    occ: 81,
    source: '楽天・価格.com実測2024-2025',
    notes: '大浴場・栄エリア。製造業コーポレート客多。',
  },
  {
    hotelName: 'ダイワロイネットホテル名古屋栄',
    cityKey: 'nagoya', cityName: '名古屋', prefecture: '愛知県',
    brand: 'ダイワロイネットホテル（大和ハウス）',
    starRating: 3, roomCount: 299, typicalSqm: 19,
    annualAvgADR: 13000, weekdayAvg: 11000, weekendAvg: 16000, peakAvg: 23000, lowAvg: 9000,
    occ: 80,
    source: '楽天実測2024-2025',
    notes: '栄・ビジネス特化型。',
  },
  {
    hotelName: 'JR東海ツアーズ ホテルアソシア名古屋ターミナル',
    cityKey: 'nagoya', cityName: '名古屋', prefecture: '愛知県',
    brand: 'ホテルアソシア（JR東海）',
    starRating: 4, roomCount: 563, typicalSqm: 23,
    annualAvgADR: 15500, weekdayAvg: 13000, weekendAvg: 19000, peakAvg: 28000, lowAvg: 10500,
    occ: 79,
    source: '楽天・一休.com実測2024-2025',
    notes: '名古屋駅直結タワー。コンベンション需要強。',
  },

  // ──────────────────────────────────────────
  // 那覇 (naha)
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン那覇',
    cityKey: 'naha', cityName: '那覇', prefecture: '沖縄県',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 3, roomCount: 300, typicalSqm: 18,
    annualAvgADR: 14000, weekdayAvg: 12000, weekendAvg: 17000, peakAvg: 28000, lowAvg: 9500,
    occ: 79,
    source: '楽天・価格.com実測2024-2025',
    notes: '大浴場・国際通り近接。夏ピーク急騰。',
  },
  {
    hotelName: 'ダブルツリー by ヒルトン那覇首里城',
    cityKey: 'naha', cityName: '那覇', prefecture: '沖縄県',
    brand: 'DoubleTree by Hilton',
    starRating: 4, roomCount: 270, typicalSqm: 28,
    annualAvgADR: 19000, weekdayAvg: 16000, weekendAvg: 23000, peakAvg: 38000, lowAvg: 12000,
    occ: 76,
    source: '楽天・一休.com実測2024-2025',
    notes: '首里城近接。全室バルコニー。',
  },
  {
    hotelName: 'ロワジールホテル那覇',
    cityKey: 'naha', cityName: '那覇', prefecture: '沖縄県',
    brand: 'ロワジールホテル',
    starRating: 4, roomCount: 326, typicalSqm: 24,
    annualAvgADR: 16000, weekdayAvg: 14000, weekendAvg: 20000, peakAvg: 32000, lowAvg: 10500,
    occ: 77,
    source: '楽天・じゃらん実測2024-2025',
    notes: '那覇市街。プール付き。',
  },

  // ──────────────────────────────────────────
  // 軽井沢 (karuizawa) — FAVは特殊: リゾート型ビジネス
  // ──────────────────────────────────────────
  {
    hotelName: '軽井沢プリンスホテル イースト',
    cityKey: 'karuizawa', cityName: '軽井沢', prefecture: '長野県',
    brand: '軽井沢プリンスホテル（プリンスホテルズ）',
    starRating: 4, roomCount: 97, typicalSqm: 30,
    annualAvgADR: 27000, weekdayAvg: 22000, weekendAvg: 35000, peakAvg: 60000, lowAvg: 15000,
    occ: 67,
    source: '楽天・一休.com実測2024-2025',
    notes: '夏・秋ピーク。軽井沢アウトレット隣接。',
  },
  {
    hotelName: 'ルグラン軽井沢ホテル&リゾート',
    cityKey: 'karuizawa', cityName: '軽井沢', prefecture: '長野県',
    brand: 'ルグラン',
    starRating: 4, roomCount: 200, typicalSqm: 35,
    annualAvgADR: 24000, weekdayAvg: 20000, weekendAvg: 30000, peakAvg: 55000, lowAvg: 14000,
    occ: 63,
    source: '楽天・価格.com実測2024-2025',
    notes: '別荘地感のあるリゾートホテル。スパ付き。',
  },

  // ──────────────────────────────────────────
  // 広島 (hiroshima)
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン 広島',
    cityKey: 'hiroshima', cityName: '広島', prefecture: '広島県',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 3, roomCount: 338, typicalSqm: 18,
    annualAvgADR: 13000, weekdayAvg: 11000, weekendAvg: 16000, peakAvg: 24000, lowAvg: 9000,
    occ: 78,
    source: '楽天・価格.com実測2024-2025',
    notes: '大浴場・天然温泉「胡国の湯」。平和記念公園近接。',
  },
  {
    hotelName: 'アパホテル 広島駅前',
    cityKey: 'hiroshima', cityName: '広島', prefecture: '広島県',
    brand: 'APAホテル',
    starRating: 3, roomCount: 420, typicalSqm: 14,
    annualAvgADR: 11000, weekdayAvg: 9000, weekendAvg: 13500, peakAvg: 20000, lowAvg: 8000,
    occ: 80,
    source: '楽天実測2024',
    notes: '広島駅近。コスパ型。',
  },
  {
    hotelName: 'ホテルグランヴィア広島',
    cityKey: 'hiroshima', cityName: '広島', prefecture: '広島県',
    brand: 'ホテルグランヴィア（JR西日本ホテルズ）',
    starRating: 4, roomCount: 406, typicalSqm: 25,
    annualAvgADR: 16000, weekdayAvg: 13500, weekendAvg: 19500, peakAvg: 30000, lowAvg: 11000,
    occ: 76,
    source: '楽天・一休.com実測2024-2025',
    notes: '広島駅直結。コンベンション・ビジネス需要強。',
  },

  // ──────────────────────────────────────────
  // 仙台 (sendai) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン仙台駅前',
    cityKey: 'sendai', cityName: '仙台', prefecture: '宮城県',
    brand: '共立メンテナンス（ドーミーイン）',
    starRating: 3, roomCount: 262, typicalSqm: 15,
    annualAvgADR: 14000, weekdayAvg: 11500, weekendAvg: 17500, peakAvg: 28000, lowAvg: 9000,
    occ: 83,
    source: '楽天トラベル・じゃらんnet実測2024-2025',
    notes: '仙台駅徒歩5分。天然温泉大浴場・サウナ付き。朝食ブッフェ人気。',
  },
  {
    hotelName: 'ドーミーインANNEX仙台',
    cityKey: 'sendai', cityName: '仙台', prefecture: '宮城県',
    brand: '共立メンテナンス（ドーミーイン）',
    starRating: 3, roomCount: 214, typicalSqm: 18,
    annualAvgADR: 13500, weekdayAvg: 11000, weekendAvg: 17000, peakAvg: 27000, lowAvg: 8500,
    occ: 82,
    source: '楽天トラベル実測2024-2025',
    notes: '仙台駅周辺。姉妹館。稼働率安定。',
  },
  {
    hotelName: 'APAホテル仙台駅五橋',
    cityKey: 'sendai', cityName: '仙台', prefecture: '宮城県',
    brand: 'APAホテル',
    starRating: 3, roomCount: 320, typicalSqm: 14,
    annualAvgADR: 11500, weekdayAvg: 9500, weekendAvg: 14000, peakAvg: 22000, lowAvg: 7500,
    occ: 84,
    source: '楽天トラベル・価格.com実測2024-2025',
    notes: '仙台駅南。コスパ特化型。法人需要安定。',
  },
  {
    hotelName: '東横INN仙台駅東口',
    cityKey: 'sendai', cityName: '仙台', prefecture: '宮城県',
    brand: '東横イン',
    starRating: 2, roomCount: 298, typicalSqm: 13,
    annualAvgADR: 9500, weekdayAvg: 8000, weekendAvg: 12000, peakAvg: 18000, lowAvg: 6500,
    occ: 85,
    source: '東横INN公式・楽天実測2024-2025',
    notes: '無料朝食付き。シングルビジネス需要。',
  },
  {
    hotelName: 'スーパーホテル仙台・広瀬通り',
    cityKey: 'sendai', cityName: '仙台', prefecture: '宮城県',
    brand: 'スーパーホテル',
    starRating: 2, roomCount: 245, typicalSqm: 16,
    annualAvgADR: 9000, weekdayAvg: 7500, weekendAvg: 11500, peakAvg: 17000, lowAvg: 6000,
    occ: 84,
    source: 'スーパーホテル公式・楽天実測2024-2025',
    notes: '天然温泉・無料朝食。コスパ優位。',
  },
  {
    hotelName: 'ルートイン仙台東口',
    cityKey: 'sendai', cityName: '仙台', prefecture: '宮城県',
    brand: 'ホテルルートイン',
    starRating: 3, roomCount: 278, typicalSqm: 17,
    annualAvgADR: 10500, weekdayAvg: 8500, weekendAvg: 13000, peakAvg: 20000, lowAvg: 7000,
    occ: 83,
    source: 'ルートイン公式・楽天実測2024-2025',
    notes: '大浴場付き。ビジネス需要中心。',
  },

  // ──────────────────────────────────────────
  // 金沢 (kanazawa) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン金沢',
    cityKey: 'kanazawa', cityName: '金沢', prefecture: '石川県',
    brand: '共立メンテナンス（ドーミーイン）',
    starRating: 3, roomCount: 207, typicalSqm: 16,
    annualAvgADR: 14500, weekdayAvg: 12000, weekendAvg: 18000, peakAvg: 30000, lowAvg: 9500,
    occ: 80,
    source: '楽天トラベル・じゃらんnet実測2024-2025',
    notes: '金沢駅近。天然温泉・朝食ブッフェ。北陸新幹線延伸後に需要増。',
  },
  {
    hotelName: 'ダイワロイネットホテル金沢',
    cityKey: 'kanazawa', cityName: '金沢', prefecture: '石川県',
    brand: 'ダイワロイネットホテル',
    starRating: 3, roomCount: 205, typicalSqm: 19,
    annualAvgADR: 13000, weekdayAvg: 10500, weekendAvg: 16500, peakAvg: 27000, lowAvg: 8500,
    occ: 79,
    source: '楽天・価格.com実測2024-2025',
    notes: '金沢駅徒歩圏。ビジネス・観光両対応。',
  },
  {
    hotelName: 'ホテルマイステイズプレミア金沢',
    cityKey: 'kanazawa', cityName: '金沢', prefecture: '石川県',
    brand: 'マイステイズホテルマネジメント',
    starRating: 4, roomCount: 295, typicalSqm: 25,
    annualAvgADR: 10051, weekdayAvg: 8500, weekendAvg: 12500, peakAvg: 22000, lowAvg: 6500,
    occ: 82,
    source: 'インヴィンシブル投資法人（D47: OCC 81.7%, ADR 10,051円）',
    notes: '実測値。インヴィンシブル投資法人保有物件。稼働率安定。',
  },
  {
    hotelName: 'ホテルマイステイズ金沢キャッスル',
    cityKey: 'kanazawa', cityName: '金沢', prefecture: '石川県',
    brand: 'マイステイズホテルマネジメント',
    starRating: 3, roomCount: 188, typicalSqm: 20,
    annualAvgADR: 7796, weekdayAvg: 6500, weekendAvg: 9500, peakAvg: 17000, lowAvg: 5000,
    occ: 80,
    source: 'インヴィンシブル投資法人実測値',
    notes: '実測値。金沢城公園近接。観光需要中心。',
  },
  {
    hotelName: 'APAホテル金沢駅前',
    cityKey: 'kanazawa', cityName: '金沢', prefecture: '石川県',
    brand: 'APAホテル',
    starRating: 3, roomCount: 350, typicalSqm: 14,
    annualAvgADR: 11000, weekdayAvg: 9000, weekendAvg: 14000, peakAvg: 22000, lowAvg: 7000,
    occ: 82,
    source: '楽天・価格.com実測2024-2025',
    notes: '金沢駅前。コスパ型大型ホテル。',
  },
  {
    hotelName: 'ANAクラウンプラザホテル金沢',
    cityKey: 'kanazawa', cityName: '金沢', prefecture: '石川県',
    brand: 'ANA / IHG Crowne Plaza',
    starRating: 4, roomCount: 215, typicalSqm: 28,
    annualAvgADR: 18000, weekdayAvg: 15000, weekendAvg: 22000, peakAvg: 38000, lowAvg: 11000,
    occ: 78,
    source: 'KNT: 朝食付¥15,300〜, トラベルコ最安¥11,499(素泊2名)',
    notes: '金沢駅兼六園口直結。金沢随一の好立地。能登復興需要で稼働安定。',
  },

  // ──────────────────────────────────────────
  // 神戸 (kobe) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'ダイワロイネットホテル神戸三宮',
    cityKey: 'kobe', cityName: '神戸', prefecture: '兵庫県',
    brand: 'ダイワロイネットホテル',
    starRating: 3, roomCount: 218, typicalSqm: 19,
    annualAvgADR: 14000, weekdayAvg: 11500, weekendAvg: 17500, peakAvg: 28000, lowAvg: 9000,
    occ: 81,
    source: '楽天・価格.com実測2024-2025',
    notes: '三宮中心部。観光・ビジネス両対応。',
  },
  {
    hotelName: 'ダイワロイネットホテル神戸PREMIER',
    cityKey: 'kobe', cityName: '神戸', prefecture: '兵庫県',
    brand: 'ダイワロイネットホテル プレミア',
    starRating: 4, roomCount: 209, typicalSqm: 22,
    annualAvgADR: 16500, weekdayAvg: 13500, weekendAvg: 21000, peakAvg: 33000, lowAvg: 10500,
    occ: 80,
    source: '楽天・じゃらんnet実測2024-2025',
    notes: '三宮。プレミアグレード。インバウンド増加中。',
  },
  {
    hotelName: 'スーパーホテル神戸・三宮',
    cityKey: 'kobe', cityName: '神戸', prefecture: '兵庫県',
    brand: 'スーパーホテル',
    starRating: 2, roomCount: 213, typicalSqm: 16,
    annualAvgADR: 9500, weekdayAvg: 8000, weekendAvg: 12000, peakAvg: 18000, lowAvg: 6500,
    occ: 83,
    source: 'スーパーホテル公式・楽天実測2024-2025',
    notes: '天然温泉・無料朝食。コスパ優位。',
  },
  {
    hotelName: 'APAホテル神戸三宮',
    cityKey: 'kobe', cityName: '神戸', prefecture: '兵庫県',
    brand: 'APAホテル',
    starRating: 3, roomCount: 426, typicalSqm: 14,
    annualAvgADR: 11500, weekdayAvg: 9500, weekendAvg: 14500, peakAvg: 22000, lowAvg: 7500,
    occ: 84,
    source: '楽天・価格.com実測2024-2025',
    notes: '三宮。大型コスパ型。',
  },
  {
    hotelName: 'ルートイン神戸新長田',
    cityKey: 'kobe', cityName: '神戸', prefecture: '兵庫県',
    brand: 'ホテルルートイン',
    starRating: 3, roomCount: 194, typicalSqm: 17,
    annualAvgADR: 10000, weekdayAvg: 8200, weekendAvg: 12500, peakAvg: 19000, lowAvg: 6500,
    occ: 82,
    source: 'ルートイン公式・楽天実測2024-2025',
    notes: '新長田駅前。大浴場付き。',
  },
  {
    hotelName: 'カンデオホテルズ神戸トアロード',
    cityKey: 'kobe', cityName: '神戸', prefecture: '兵庫県',
    brand: 'カンデオホテルズ',
    starRating: 3, roomCount: 212, typicalSqm: 18,
    annualAvgADR: 15000, weekdayAvg: 12500, weekendAvg: 19000, peakAvg: 30000, lowAvg: 9500,
    occ: 80,
    source: '楽天・一休.com実測2024-2025',
    notes: '三宮トアロード。屋上露天風呂が特徴的。観光・ビジネス混在。',
  },

  // ──────────────────────────────────────────
  // 奈良 (nara) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'スーパーホテル奈良・大和西大寺駅前',
    cityKey: 'nara', cityName: '奈良', prefecture: '奈良県',
    brand: 'スーパーホテル',
    starRating: 2, roomCount: 160, typicalSqm: 16,
    annualAvgADR: 9500, weekdayAvg: 8000, weekendAvg: 12000, peakAvg: 18000, lowAvg: 6000,
    occ: 85,
    source: 'スーパーホテル公式・楽天実測2024-2025',
    notes: '大和西大寺駅前。天然温泉・無料朝食。',
  },
  {
    hotelName: 'ルートイン奈良',
    cityKey: 'nara', cityName: '奈良', prefecture: '奈良県',
    brand: 'ホテルルートイン',
    starRating: 3, roomCount: 196, typicalSqm: 17,
    annualAvgADR: 11000, weekdayAvg: 9000, weekendAvg: 14000, peakAvg: 21000, lowAvg: 7000,
    occ: 84,
    source: 'ルートイン公式・楽天実測2024-2025',
    notes: '大浴場付き。観光・ビジネス混在。',
  },
  {
    hotelName: '東横INN奈良大和西大寺駅前',
    cityKey: 'nara', cityName: '奈良', prefecture: '奈良県',
    brand: '東横イン',
    starRating: 2, roomCount: 218, typicalSqm: 13,
    annualAvgADR: 9000, weekdayAvg: 7500, weekendAvg: 11500, peakAvg: 17000, lowAvg: 6000,
    occ: 86,
    source: '東横INN公式・楽天実測2024-2025',
    notes: '無料朝食付き。外国人観光客需要高。',
  },
  {
    hotelName: 'カンデオホテルズ奈良',
    cityKey: 'nara', cityName: '奈良', prefecture: '奈良県',
    brand: 'カンデオホテルズ',
    starRating: 3, roomCount: 188, typicalSqm: 18,
    annualAvgADR: 16000, weekdayAvg: 13000, weekendAvg: 20000, peakAvg: 32000, lowAvg: 10000,
    occ: 82,
    source: '楽天・一休.com実測2024-2025',
    notes: '奈良公園エリア。屋上露天風呂。インバウンド人気。',
  },
  {
    hotelName: '亀の井ホテル奈良',
    cityKey: 'nara', cityName: '奈良', prefecture: '奈良県',
    brand: '亀の井ホテル',
    starRating: 3, roomCount: 180, typicalSqm: 20,
    annualAvgADR: 18695, weekdayAvg: 16000, weekendAvg: 23000, peakAvg: 36000, lowAvg: 12000,
    occ: 91,
    source: 'インヴィンシブル投資法人（D101: OCC 90.6%, ADR 18,695円）',
    notes: '実測値。高稼働率が際立つ。奈良公園近接の観光型ホテル。',
  },
  {
    hotelName: 'ドーミーイン奈良',
    cityKey: 'nara', cityName: '奈良', prefecture: '奈良県',
    brand: '共立メンテナンス（ドーミーイン）',
    starRating: 3, roomCount: 201, typicalSqm: 18,
    annualAvgADR: 15500, weekdayAvg: 13000, weekendAvg: 19500, peakAvg: 31000, lowAvg: 9500,
    occ: 83,
    source: '楽天トラベル・じゃらんnet実測2024-2025',
    notes: 'JR奈良駅近。天然温泉・朝食ブッフェ人気。',
  },

  // ──────────────────────────────────────────
  // 函館 (hakodate) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: '函館国際ホテル',
    cityKey: 'hakodate', cityName: '函館', prefecture: '北海道',
    brand: '独立系',
    starRating: 4, roomCount: 355, typicalSqm: 22,
    annualAvgADR: 12517, weekdayAvg: 10500, weekendAvg: 15500, peakAvg: 26000, lowAvg: 8000,
    occ: 78,
    source: 'インヴィンシブル投資法人実測値（OCC 77.7%, ADR 12,517円）',
    notes: '実測値。函館ベイエリア・朝市近接。函館を代表する老舗シティホテル。',
  },
  {
    hotelName: 'ホテルマイステイズ函館',
    cityKey: 'hakodate', cityName: '函館', prefecture: '北海道',
    brand: 'マイステイズホテルマネジメント',
    starRating: 3, roomCount: 175, typicalSqm: 20,
    annualAvgADR: 6245, weekdayAvg: 5200, weekendAvg: 8000, peakAvg: 15000, lowAvg: 4000,
    occ: 75,
    source: 'インヴィンシブル投資法人実測値',
    notes: '実測値。函館中心部。コスパ重視層に人気。',
  },
  {
    hotelName: 'APAホテル函館駅前',
    cityKey: 'hakodate', cityName: '函館', prefecture: '北海道',
    brand: 'APAホテル',
    starRating: 3, roomCount: 291, typicalSqm: 14,
    annualAvgADR: 10000, weekdayAvg: 8200, weekendAvg: 12800, peakAvg: 20000, lowAvg: 6500,
    occ: 79,
    source: '楽天・価格.com実測2024-2025',
    notes: '函館駅前。コスパ特化型。',
  },
  {
    hotelName: 'ルートイン函館駅前',
    cityKey: 'hakodate', cityName: '函館', prefecture: '北海道',
    brand: 'ホテルルートイン',
    starRating: 3, roomCount: 262, typicalSqm: 17,
    annualAvgADR: 9500, weekdayAvg: 7800, weekendAvg: 12000, peakAvg: 19000, lowAvg: 6000,
    occ: 80,
    source: 'ルートイン公式・楽天実測2024-2025',
    notes: '函館駅近。大浴場付き。',
  },
  {
    hotelName: '東横INN函館駅前朝市',
    cityKey: 'hakodate', cityName: '函館', prefecture: '北海道',
    brand: '東横イン',
    starRating: 2, roomCount: 274, typicalSqm: 13,
    annualAvgADR: 8500, weekdayAvg: 7000, weekendAvg: 11000, peakAvg: 17000, lowAvg: 5500,
    occ: 81,
    source: '東横INN公式・楽天実測2024-2025',
    notes: '函館朝市徒歩圏。朝食付き。外国人観光客増加中。',
  },
  {
    hotelName: 'ドーミーイン函館',
    cityKey: 'hakodate', cityName: '函館', prefecture: '北海道',
    brand: '共立メンテナンス（ドーミーイン）',
    starRating: 3, roomCount: 194, typicalSqm: 18,
    annualAvgADR: 12000, weekdayAvg: 10000, weekendAvg: 15000, peakAvg: 25000, lowAvg: 8000,
    occ: 80,
    source: '楽天トラベル・じゃらんnet実測2024-2025',
    notes: '函館駅近。天然温泉大浴場・朝食ブッフェ。',
  },

  // ──────────────────────────────────────────
  // 熊本 (kumamoto) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン熊本',
    cityKey: 'kumamoto', cityName: '熊本', prefecture: '熊本県',
    brand: '共立メンテナンス（ドーミーイン）',
    starRating: 3, roomCount: 280, typicalSqm: 15,
    annualAvgADR: 12500, weekdayAvg: 10500, weekendAvg: 15500, peakAvg: 25000, lowAvg: 8000,
    occ: 84,
    source: '楽天トラベル・じゃらんnet実測2024-2025',
    notes: '熊本中心部。天然温泉大浴場・朝食ブッフェ。熊本城観光需要高。',
  },
  {
    hotelName: 'ホテルマイステイズ熊本',
    cityKey: 'kumamoto', cityName: '熊本', prefecture: '熊本県',
    brand: 'マイステイズホテルマネジメント',
    starRating: 3, roomCount: 242, typicalSqm: 20,
    annualAvgADR: 9995, weekdayAvg: 8500, weekendAvg: 12500, peakAvg: 21000, lowAvg: 6500,
    occ: 83,
    source: 'インヴィンシブル投資法人実測値',
    notes: '実測値。熊本中心部。コスパ重視層向け。',
  },
  {
    hotelName: 'ルートイン熊本駅前',
    cityKey: 'kumamoto', cityName: '熊本', prefecture: '熊本県',
    brand: 'ホテルルートイン',
    starRating: 3, roomCount: 232, typicalSqm: 17,
    annualAvgADR: 10000, weekdayAvg: 8200, weekendAvg: 12800, peakAvg: 19500, lowAvg: 6500,
    occ: 83,
    source: 'ルートイン公式・楽天実測2024-2025',
    notes: '熊本駅前。大浴場付き。',
  },
  {
    hotelName: 'アークホテル熊本城前',
    cityKey: 'kumamoto', cityName: '熊本', prefecture: '熊本県',
    brand: 'アークホテル（ルートインホテルズ系）',
    starRating: 3, roomCount: 190, typicalSqm: 19,
    annualAvgADR: 11500, weekdayAvg: 9500, weekendAvg: 14500, peakAvg: 22000, lowAvg: 7500,
    occ: 82,
    source: '楽天・価格.com実測2024-2025',
    notes: '熊本城至近。観光需要中心。',
  },
  {
    hotelName: 'APAホテル熊本交通センター前',
    cityKey: 'kumamoto', cityName: '熊本', prefecture: '熊本県',
    brand: 'APAホテル',
    starRating: 3, roomCount: 301, typicalSqm: 14,
    annualAvgADR: 10500, weekdayAvg: 8700, weekendAvg: 13200, peakAvg: 20000, lowAvg: 7000,
    occ: 84,
    source: '楽天・価格.com実測2024-2025',
    notes: '熊本中心部。コスパ特化型。',
  },

  // ──────────────────────────────────────────
  // 鹿児島 (kagoshima) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン鹿児島',
    cityKey: 'kagoshima', cityName: '鹿児島', prefecture: '鹿児島県',
    brand: '共立メンテナンス（ドーミーイン）',
    starRating: 3, roomCount: 234, typicalSqm: 14,
    annualAvgADR: 12000, weekdayAvg: 10000, weekendAvg: 14800, peakAvg: 23000, lowAvg: 7800,
    occ: 85,
    source: '楽天トラベル・じゃらんnet実測2024-2025',
    notes: '天文館・市電エリア。天然温泉・朝食ブッフェ。',
  },
  {
    hotelName: 'ホテルマイステイズ鹿児島天文館',
    cityKey: 'kagoshima', cityName: '鹿児島', prefecture: '鹿児島県',
    brand: 'マイステイズホテルマネジメント',
    starRating: 3, roomCount: 251, typicalSqm: 19,
    annualAvgADR: 7312, weekdayAvg: 6200, weekendAvg: 9000, peakAvg: 15000, lowAvg: 5000,
    occ: 88,
    source: 'インヴィンシブル投資法人実測値',
    notes: '実測値。高稼働率。天文館中心部。',
  },
  {
    hotelName: 'ホテルマイステイズ鹿児島天文館２番館',
    cityKey: 'kagoshima', cityName: '鹿児島', prefecture: '鹿児島県',
    brand: 'マイステイズホテルマネジメント',
    starRating: 3, roomCount: 162, typicalSqm: 19,
    annualAvgADR: 6803, weekdayAvg: 5800, weekendAvg: 8500, peakAvg: 14000, lowAvg: 4500,
    occ: 96,
    source: 'インヴィンシブル投資法人実測値（稼働率96%）',
    notes: '実測値。驚異的高稼働。天文館エリア需要強い。',
  },
  {
    hotelName: 'ルートイン鹿児島中央駅前',
    cityKey: 'kagoshima', cityName: '鹿児島', prefecture: '鹿児島県',
    brand: 'ホテルルートイン',
    starRating: 3, roomCount: 254, typicalSqm: 17,
    annualAvgADR: 9500, weekdayAvg: 7800, weekendAvg: 12000, peakAvg: 18500, lowAvg: 6000,
    occ: 86,
    source: 'ルートイン公式・楽天実測2024-2025',
    notes: '鹿児島中央駅前。大浴場付き。',
  },
  {
    hotelName: 'APAホテル鹿児島中央駅',
    cityKey: 'kagoshima', cityName: '鹿児島', prefecture: '鹿児島県',
    brand: 'APAホテル',
    starRating: 3, roomCount: 332, typicalSqm: 14,
    annualAvgADR: 10000, weekdayAvg: 8300, weekendAvg: 12500, peakAvg: 19000, lowAvg: 6500,
    occ: 85,
    source: '楽天・価格.com実測2024-2025',
    notes: '鹿児島中央駅近。コスパ特化型。',
  },
  {
    hotelName: '東横INN鹿児島中央駅東口',
    cityKey: 'kagoshima', cityName: '鹿児島', prefecture: '鹿児島県',
    brand: '東横イン',
    starRating: 2, roomCount: 243, typicalSqm: 13,
    annualAvgADR: 8500, weekdayAvg: 7000, weekendAvg: 11000, peakAvg: 16500, lowAvg: 5500,
    occ: 87,
    source: '東横INN公式・楽天実測2024-2025',
    notes: '無料朝食付き。ビジネス・観光混在。',
  },

  // ──────────────────────────────────────────
  // 長崎 (nagasaki) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーインPREMIUM長崎',
    cityKey: 'nagasaki', cityName: '長崎', prefecture: '長崎県',
    brand: '共立メンテナンス（ドーミーイン）',
    starRating: 3, roomCount: 209, typicalSqm: 19,
    annualAvgADR: 14500, weekdayAvg: 12000, weekendAvg: 18000, peakAvg: 30000, lowAvg: 9500,
    occ: 82,
    source: '楽天トラベル・じゃらんnet実測2024-2025',
    notes: '長崎駅近。天然温泉・朝食ブッフェ。インバウンド需要旺盛。',
  },
  {
    hotelName: 'ドーミーイン長崎新地中華街',
    cityKey: 'nagasaki', cityName: '長崎', prefecture: '長崎県',
    brand: '共立メンテナンス（ドーミーイン）',
    starRating: 3, roomCount: 198, typicalSqm: 18,
    annualAvgADR: 13500, weekdayAvg: 11200, weekendAvg: 17000, peakAvg: 28000, lowAvg: 9000,
    occ: 83,
    source: '楽天トラベル実測2024-2025',
    notes: '中華街・出島エリア。観光立地。天然温泉付き。',
  },
  {
    hotelName: 'APAホテル長崎駅前',
    cityKey: 'nagasaki', cityName: '長崎', prefecture: '長崎県',
    brand: 'APAホテル',
    starRating: 3, roomCount: 285, typicalSqm: 14,
    annualAvgADR: 10500, weekdayAvg: 8700, weekendAvg: 13200, peakAvg: 21000, lowAvg: 7000,
    occ: 81,
    source: '楽天・価格.com実測2024-2025',
    notes: '長崎駅前。コスパ型大型ホテル。',
  },
  {
    hotelName: 'ルートイン長崎',
    cityKey: 'nagasaki', cityName: '長崎', prefecture: '長崎県',
    brand: 'ホテルルートイン',
    starRating: 3, roomCount: 205, typicalSqm: 17,
    annualAvgADR: 10000, weekdayAvg: 8300, weekendAvg: 12800, peakAvg: 19500, lowAvg: 6500,
    occ: 80,
    source: 'ルートイン公式・楽天実測2024-2025',
    notes: '大浴場付き。ビジネス・観光混在。',
  },
  {
    hotelName: '東横INN長崎駅前',
    cityKey: 'nagasaki', cityName: '長崎', prefecture: '長崎県',
    brand: '東横イン',
    starRating: 2, roomCount: 248, typicalSqm: 13,
    annualAvgADR: 9000, weekdayAvg: 7500, weekendAvg: 11500, peakAvg: 18000, lowAvg: 6000,
    occ: 82,
    source: '東横INN公式・楽天実測2024-2025',
    notes: '無料朝食付き。外国人観光客需要高。',
  },
  {
    hotelName: 'カンデオホテルズ長崎新地中華街',
    cityKey: 'nagasaki', cityName: '長崎', prefecture: '長崎県',
    brand: 'カンデオホテルズ',
    starRating: 3, roomCount: 176, typicalSqm: 18,
    annualAvgADR: 15000, weekdayAvg: 12500, weekendAvg: 19000, peakAvg: 30000, lowAvg: 9500,
    occ: 81,
    source: '楽天・一休.com実測2024-2025',
    notes: '新地中華街・グラバー園近接。屋上露天風呂が特徴。',
  },

  // ──────────────────────────────────────────
  // 那覇（FAV追加） (naha) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'APAホテル那覇旭橋駅前',
    cityKey: 'naha', cityName: '那覇', prefecture: '沖縄県',
    brand: 'APAホテル',
    starRating: 3, roomCount: 342, typicalSqm: 16,
    annualAvgADR: 11500, weekdayAvg: 9500, weekendAvg: 14500, peakAvg: 24000, lowAvg: 7500,
    occ: 83,
    source: '楽天・価格.com実測2024-2025',
    notes: '旭橋駅前。コスパ型。那覇バスターミナル直結。',
  },
  {
    hotelName: 'ルートイン那覇旭橋駅前',
    cityKey: 'naha', cityName: '那覇', prefecture: '沖縄県',
    brand: 'ホテルルートイン',
    starRating: 3, roomCount: 246, typicalSqm: 17,
    annualAvgADR: 10500, weekdayAvg: 8700, weekendAvg: 13200, peakAvg: 21000, lowAvg: 7000,
    occ: 84,
    source: 'ルートイン公式・楽天実測2024-2025',
    notes: '大浴場付き。旭橋・県庁前エリア。',
  },
  {
    hotelName: 'ホテルルートイン那覇・おもろまち',
    cityKey: 'naha', cityName: '那覇', prefecture: '沖縄県',
    brand: 'ホテルルートイン',
    starRating: 3, roomCount: 218, typicalSqm: 17,
    annualAvgADR: 10000, weekdayAvg: 8200, weekendAvg: 12800, peakAvg: 20000, lowAvg: 6500,
    occ: 83,
    source: 'ルートイン公式・楽天実測2024-2025',
    notes: 'おもろまち駅前。DFS・新都心エリア。大浴場付き。',
  },
  {
    hotelName: '東横INN那覇新都心おもろまち',
    cityKey: 'naha', cityName: '那覇', prefecture: '沖縄県',
    brand: '東横イン',
    starRating: 2, roomCount: 281, typicalSqm: 13,
    annualAvgADR: 9000, weekdayAvg: 7400, weekendAvg: 11500, peakAvg: 18000, lowAvg: 6000,
    occ: 85,
    source: '東横INN公式・楽天実測2024-2025',
    notes: '無料朝食付き。那覇・新都心エリア。',
  },
  {
    hotelName: 'ドーミーイン那覇',
    cityKey: 'naha', cityName: '那覇', prefecture: '沖縄県',
    brand: '共立メンテナンス（ドーミーイン）',
    starRating: 3, roomCount: 222, typicalSqm: 18,
    annualAvgADR: 13000, weekdayAvg: 10800, weekendAvg: 16200, peakAvg: 27000, lowAvg: 8500,
    occ: 84,
    source: '楽天トラベル・じゃらんnet実測2024-2025',
    notes: '国際通り徒歩圏。天然温泉大浴場・朝食ブッフェ。',
  },
  {
    hotelName: 'APAホテル那覇空港若狭',
    cityKey: 'naha', cityName: '那覇', prefecture: '沖縄県',
    brand: 'APAホテル',
    starRating: 3, roomCount: 265, typicalSqm: 16,
    annualAvgADR: 10500, weekdayAvg: 8700, weekendAvg: 13200, peakAvg: 21000, lowAvg: 7000,
    occ: 82,
    source: '楽天・価格.com実測2024-2025',
    notes: '那覇空港から車5分。早朝・深夜フライト需要。',
  },

  // ──────────────────────────────────────────
  // 渋谷 (shibuya)
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン渋谷神泉',
    cityKey: 'shibuya', cityName: '渋谷', prefecture: '東京都',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 3, roomCount: 279, typicalSqm: 19,
    annualAvgADR: 17500, weekdayAvg: 15500, weekendAvg: 20500, peakAvg: 30000, lowAvg: 12000,
    occ: 83,
    source: '楽天トラベル・価格.com実測2024-2025',
    notes: '神泉駅徒歩1分。大浴場・天然温泉。渋谷センター街徒歩10分。',
  },
  {
    hotelName: 'APAホテル 渋谷道玄坂上',
    cityKey: 'shibuya', cityName: '渋谷', prefecture: '東京都',
    brand: 'APAホテル',
    starRating: 3, roomCount: 303, typicalSqm: 14,
    annualAvgADR: 15000, weekdayAvg: 13000, weekendAvg: 18000, peakAvg: 28000, lowAvg: 10000,
    occ: 86,
    source: '楽天・じゃらんnet実測2024-2025',
    notes: '道玄坂。コスパ型。スクランブル交差点徒歩5分。',
  },
  {
    hotelName: 'ホテルグレイスリー渋谷',
    cityKey: 'shibuya', cityName: '渋谷', prefecture: '東京都',
    brand: 'ホテルグレイスリー（藤田観光）',
    starRating: 4, roomCount: 280, typicalSqm: 22,
    annualAvgADR: 19500, weekdayAvg: 17000, weekendAvg: 23000, peakAvg: 35000, lowAvg: 13500,
    occ: 79,
    source: '楽天・一休.com実測2024-2025',
    notes: 'セルリアンタワー隣接。24㎡〜標準。',
  },
  {
    hotelName: 'カンデオホテルズ 東京渋谷',
    cityKey: 'shibuya', cityName: '渋谷', prefecture: '東京都',
    brand: 'カンデオホテルズ',
    starRating: 3, roomCount: 230, typicalSqm: 20,
    annualAvgADR: 17000, weekdayAvg: 15000, weekendAvg: 20000, peakAvg: 30000, lowAvg: 12000,
    occ: 80,
    source: '楽天・価格.com実測2024-2025',
    notes: '渋谷徒歩圏。スカイスパ（屋上天然温泉）。',
  },
  {
    hotelName: '東横INN 渋谷東口',
    cityKey: 'shibuya', cityName: '渋谷', prefecture: '東京都',
    brand: '東横イン',
    starRating: 2, roomCount: 252, typicalSqm: 13,
    annualAvgADR: 12000, weekdayAvg: 10500, weekendAvg: 14000, peakAvg: 21000, lowAvg: 8500,
    occ: 87,
    source: '東横INN公式・楽天実測2024-2025',
    notes: '渋谷駅東口徒歩2分。無料朝食付き。',
  },

  // ──────────────────────────────────────────
  // 池袋 (ikebukuro)
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン池袋',
    cityKey: 'ikebukuro', cityName: '池袋', prefecture: '東京都',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 3, roomCount: 270, typicalSqm: 19,
    annualAvgADR: 14500, weekdayAvg: 12500, weekendAvg: 17000, peakAvg: 24000, lowAvg: 10000,
    occ: 84,
    source: '楽天トラベル・価格.com実測2024-2025',
    notes: '池袋東口徒歩5分。大浴場付き。サンシャイン60近接。',
  },
  {
    hotelName: 'APAホテル 池袋駅北口',
    cityKey: 'ikebukuro', cityName: '池袋', prefecture: '東京都',
    brand: 'APAホテル',
    starRating: 3, roomCount: 346, typicalSqm: 14,
    annualAvgADR: 12500, weekdayAvg: 10500, weekendAvg: 15000, peakAvg: 22000, lowAvg: 8500,
    occ: 87,
    source: '楽天・じゃらんnet実測2024-2025',
    notes: '池袋北口直近。コスパ重視インバウンド・ビジネス客。',
  },
  {
    hotelName: '東横INN池袋西口北',
    cityKey: 'ikebukuro', cityName: '池袋', prefecture: '東京都',
    brand: '東横イン',
    starRating: 2, roomCount: 381, typicalSqm: 13,
    annualAvgADR: 10500, weekdayAvg: 9000, weekendAvg: 12500, peakAvg: 18000, lowAvg: 7000,
    occ: 87,
    source: '東横INN公式・楽天実測2024-2025',
    notes: '池袋西口北徒歩2分。無料朝食付き。',
  },
  {
    hotelName: 'スーパーホテル Lohas 池袋西口',
    cityKey: 'ikebukuro', cityName: '池袋', prefecture: '東京都',
    brand: 'スーパーホテル（Super Hotel）',
    starRating: 3, roomCount: 252, typicalSqm: 17,
    annualAvgADR: 13000, weekdayAvg: 11200, weekendAvg: 15500, peakAvg: 22000, lowAvg: 9000,
    occ: 85,
    source: '楽天・価格.com実測2024-2025',
    notes: '人工炭酸泉大浴場。池袋西口徒歩5分。',
  },
  {
    hotelName: 'ホテルメトロポリタン池袋（シティ）',
    cityKey: 'ikebukuro', cityName: '池袋', prefecture: '東京都',
    brand: 'ホテルメトロポリタン（JR東日本）',
    starRating: 4, roomCount: 815, typicalSqm: 22,
    annualAvgADR: 19000, weekdayAvg: 17000, weekendAvg: 22000, peakAvg: 32000, lowAvg: 13000,
    occ: 78,
    source: '楽天・一休.com実測2024-2025',
    notes: '池袋駅直結。ビジネス〜観光客まで幅広い需要。',
  },

  // ──────────────────────────────────────────
  // 上野・秋葉原 (ueno)
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン上野御徒町',
    cityKey: 'ueno', cityName: '上野・秋葉原', prefecture: '東京都',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 3, roomCount: 290, typicalSqm: 19,
    annualAvgADR: 14000, weekdayAvg: 12200, weekendAvg: 16500, peakAvg: 23000, lowAvg: 9500,
    occ: 85,
    source: '楽天トラベル・価格.com実測2024-2025',
    notes: '御徒町駅前。大浴場付き。上野公園・アメ横徒歩圏。',
  },
  {
    hotelName: 'APAホテル 上野駅前',
    cityKey: 'ueno', cityName: '上野・秋葉原', prefecture: '東京都',
    brand: 'APAホテル',
    starRating: 3, roomCount: 260, typicalSqm: 14,
    annualAvgADR: 12000, weekdayAvg: 10200, weekendAvg: 14500, peakAvg: 21000, lowAvg: 8000,
    occ: 86,
    source: '楽天・じゃらんnet実測2024-2025',
    notes: '上野駅前。大浴場付き。インバウンド（浅草・アメ横近接）需要強。',
  },
  {
    hotelName: '東横INN上野駅前',
    cityKey: 'ueno', cityName: '上野・秋葉原', prefecture: '東京都',
    brand: '東横イン',
    starRating: 2, roomCount: 305, typicalSqm: 13,
    annualAvgADR: 10000, weekdayAvg: 8500, weekendAvg: 12000, peakAvg: 17500, lowAvg: 6500,
    occ: 86,
    source: '東横INN公式・楽天実測2024-2025',
    notes: '上野駅徒歩2分。無料朝食付き。',
  },
  {
    hotelName: 'ダイワロイネットホテル 東京秋葉原',
    cityKey: 'ueno', cityName: '上野・秋葉原', prefecture: '東京都',
    brand: 'ダイワロイネットホテル（大和ハウス）',
    starRating: 3, roomCount: 209, typicalSqm: 18,
    annualAvgADR: 13500, weekdayAvg: 11500, weekendAvg: 16000, peakAvg: 23000, lowAvg: 9000,
    occ: 83,
    source: '楽天・価格.com実測2024-2025',
    notes: '秋葉原駅徒歩1分。ビジネス・オタク文化インバウンド需要。',
  },
  {
    hotelName: 'NOHGA HOTEL UENO TOKYO',
    cityKey: 'ueno', cityName: '上野・秋葉原', prefecture: '東京都',
    brand: 'NOHGA HOTEL',
    starRating: 4, roomCount: 73, typicalSqm: 26,
    annualAvgADR: 18500, weekdayAvg: 16000, weekendAvg: 22000, peakAvg: 32000, lowAvg: 12500,
    occ: 78,
    source: '楽天・一休.com実測2024-2025',
    notes: '御徒町駅近。ライフスタイル型。デラックス26㎡・スイート64㎡確認。',
  },

  // ──────────────────────────────────────────
  // 品川 (shinagawa)
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン品川',
    cityKey: 'shinagawa', cityName: '品川', prefecture: '東京都',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 3, roomCount: 300, typicalSqm: 19,
    annualAvgADR: 15000, weekdayAvg: 13800, weekendAvg: 17000, peakAvg: 24000, lowAvg: 10500,
    occ: 84,
    source: '楽天トラベル・価格.com実測2024-2025',
    notes: '品川駅高輪口徒歩5分。大浴場付き。ビジネス需要主体。',
  },
  {
    hotelName: 'マイステイズ五反田',
    cityKey: 'shinagawa', cityName: '品川', prefecture: '東京都',
    brand: 'マイステイズ（インヴィンシブル投資法人系）',
    starRating: 3, roomCount: 400, typicalSqm: 17,
    annualAvgADR: 15500, weekdayAvg: 14000, weekendAvg: 18000, peakAvg: 26000, lowAvg: 10500,
    occ: 90,
    source: 'インヴィンシブル投資法人レポート2026Q1・楽天実測',
    notes: 'ADR¥15,559・OCC 94.1%（2026年Q1実績）。五反田駅近。',
  },
  {
    hotelName: '東横INN品川高輪口',
    cityKey: 'shinagawa', cityName: '品川', prefecture: '東京都',
    brand: '東横イン',
    starRating: 2, roomCount: 354, typicalSqm: 11,
    annualAvgADR: 11500, weekdayAvg: 10200, weekendAvg: 13500, peakAvg: 19500, lowAvg: 8000,
    occ: 87,
    source: '東横INN公式・楽天実測2024-2025',
    notes: '品川駅高輪口至近。コスパ型ビジネス。ダブル11㎡実測値。',
  },
  {
    hotelName: 'コンフォートホテル品川',
    cityKey: 'shinagawa', cityName: '品川', prefecture: '東京都',
    brand: 'コンフォートホテル（チョイスホテルズ）',
    starRating: 3, roomCount: 180, typicalSqm: 18,
    annualAvgADR: 14000, weekdayAvg: 12500, weekendAvg: 16500, peakAvg: 23000, lowAvg: 9500,
    occ: 82,
    source: '楽天・価格.com実測2024-2025',
    notes: '品川駅高輪口。朝食無料。ビジネス客特化。',
  },
  {
    hotelName: 'ホテルルートイン品川大井町',
    cityKey: 'shinagawa', cityName: '品川', prefecture: '東京都',
    brand: 'ホテルルートイン',
    starRating: 3, roomCount: 271, typicalSqm: 18,
    annualAvgADR: 13000, weekdayAvg: 11800, weekendAvg: 15000, peakAvg: 21000, lowAvg: 9000,
    occ: 85,
    source: 'ルートイン公式・楽天実測2024-2025',
    notes: '大浴場付き。大井町エリア。コーポレートビジネス需要。',
  },

  // ──────────────────────────────────────────
  // 天神（福岡市） (tenjin)
  // ──────────────────────────────────────────
  {
    hotelName: 'ドーミーイン PREMIUM 博多・キャナルシティ前',
    cityKey: 'tenjin', cityName: '天神', prefecture: '福岡県',
    brand: 'ドーミーイン（共立メンテナンス）',
    starRating: 3, roomCount: 304, typicalSqm: 16,
    annualAvgADR: 15000, weekdayAvg: 13000, weekendAvg: 18000, peakAvg: 26000, lowAvg: 10000,
    occ: 85,
    source: '楽天・価格.com実測2024-2025',
    notes: 'キャナルシティ前。天神・博多の中間立地。大浴場。',
  },
  {
    hotelName: 'APAホテル天神駅東',
    cityKey: 'tenjin', cityName: '天神', prefecture: '福岡県',
    brand: 'APAホテル',
    starRating: 3, roomCount: 400, typicalSqm: 14,
    annualAvgADR: 12000, weekdayAvg: 10200, weekendAvg: 14500, peakAvg: 21000, lowAvg: 8000,
    occ: 86,
    source: '楽天・じゃらんnet実測2024-2025',
    notes: '天神駅東口近接。韓国・台湾インバウンド需要強。',
  },
  {
    hotelName: 'ソラリア西鉄ホテル福岡',
    cityKey: 'tenjin', cityName: '天神', prefecture: '福岡県',
    brand: '西鉄ホテルズ（西日本鉄道）',
    starRating: 4, roomCount: 237, typicalSqm: 22,
    annualAvgADR: 18500, weekdayAvg: 16500, weekendAvg: 21500, peakAvg: 31000, lowAvg: 12500,
    occ: 83,
    source: '楽天・一休.com実測2024-2025',
    notes: '天神ソラリアプラザ直結。ビジネス〜観光客双方需要。',
  },
  {
    hotelName: '東横INN博多天神',
    cityKey: 'tenjin', cityName: '天神', prefecture: '福岡県',
    brand: '東横イン',
    starRating: 2, roomCount: 250, typicalSqm: 13,
    annualAvgADR: 10500, weekdayAvg: 8800, weekendAvg: 13000, peakAvg: 18500, lowAvg: 7000,
    occ: 87,
    source: '東横INN公式・楽天実測2024-2025',
    notes: '天神・大名エリア徒歩圏。無料朝食付き。',
  },
  {
    hotelName: 'ザ・ワンファイブ福岡天神',
    cityKey: 'tenjin', cityName: '天神', prefecture: '福岡県',
    brand: 'ザ・ワンファイブ（西日本鉄道）',
    starRating: 3, roomCount: 228, typicalSqm: 18,
    annualAvgADR: 14000, weekdayAvg: 12200, weekendAvg: 16500, peakAvg: 24000, lowAvg: 9500,
    occ: 85,
    source: 'インヴィンシブル投資法人・楽天実測2024-2025',
    notes: 'ADR¥14,571・OCC 88%（2025年実績）。天神地下街近接。',
  },

];

// ═══════════════════════════════════════════════════════════════════════════
// FAV LUX 競合ホテル（アッパーミドル〜アップスケール。ADR目安: ¥20,000〜¥60,000/室）
// 対象: FAV_LUX_CITIESの主要10都市 × 約5軒
// ═══════════════════════════════════════════════════════════════════════════

export const FAV_LUX_COMPETITOR_HOTELS: FAVLUXCompetitorHotel[] = [

  // ──────────────────────────────────────────
  // 新宿 (lux_shinjuku)
  // ──────────────────────────────────────────
  {
    hotelName: 'ハイアット リージェンシー 東京',
    cityKey: 'shinjuku', cityName: '新宿', prefecture: '東京都',
    brand: 'Hyatt Regency',
    starRating: 5, roomCount: 746, typicalSqm: 35,
    annualAvgADR: 42000, weekdayAvg: 36000, weekendAvg: 50000, peakAvg: 75000, lowAvg: 28000,
    occ: 78,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com・Booking.com実測2024-2025',
    notes: '西新宿。エグゼクティブフロア需要強。',
  },
  {
    hotelName: 'ANAインターコンチネンタル東京',
    cityKey: 'shinjuku', cityName: '新宿', prefecture: '東京都',
    brand: 'InterContinental（IHG）',
    starRating: 5, roomCount: 844, typicalSqm: 38,
    annualAvgADR: 48000, weekdayAvg: 42000, weekendAvg: 56000, peakAvg: 85000, lowAvg: 32000,
    occ: 76,
    hasBath: true, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '赤坂。大浴場「万葉の湯」付き。ラウンジアクセス強。',
  },
  {
    hotelName: 'セルリアンタワー東急ホテル',
    cityKey: 'shinjuku', cityName: '新宿', prefecture: '東京都',
    brand: '東急ホテルズ',
    starRating: 5, roomCount: 411, typicalSqm: 36,
    annualAvgADR: 38000, weekdayAvg: 33000, weekendAvg: 45000, peakAvg: 70000, lowAvg: 26000,
    occ: 77,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '渋谷（新宿エリア比較用）。能楽堂併設。',
  },
  {
    hotelName: 'ヒルトン東京',
    cityKey: 'shinjuku', cityName: '新宿', prefecture: '東京都',
    brand: 'Hilton',
    starRating: 5, roomCount: 806, typicalSqm: 34,
    annualAvgADR: 40000, weekdayAvg: 34000, weekendAvg: 48000, peakAvg: 72000, lowAvg: 27000,
    occ: 79,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・Booking.com実測2024-2025',
    notes: '西新宿。大規模コンベンション施設。',
  },
  {
    hotelName: '京王プラザホテル 新宿',
    cityKey: 'shinjuku', cityName: '新宿', prefecture: '東京都',
    brand: '京王ホテル（京王グループ）',
    starRating: 5, roomCount: 1438, typicalSqm: 32,
    annualAvgADR: 32000, weekdayAvg: 27000, weekendAvg: 38000, peakAvg: 58000, lowAvg: 22000,
    occ: 80,
    hasBath: true, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '西新宿・大型コンベンション。大浴場付き。',
  },

  // ──────────────────────────────────────────
  // 銀座・丸の内 (lux_ginza)
  // ──────────────────────────────────────────
  {
    hotelName: 'ザ・ペニンシュラ東京',
    cityKey: 'ginza', cityName: '銀座・丸の内', prefecture: '東京都',
    brand: 'The Peninsula',
    starRating: 5, roomCount: 314, typicalSqm: 47,
    annualAvgADR: 120000, weekdayAvg: 100000, weekendAvg: 140000, peakAvg: 220000, lowAvg: 75000,
    occ: 75,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: 'Booking.com・一休.com実測2024-2025',
    notes: '日比谷。全室47㎡以上スイート仕様。',
  },
  {
    hotelName: 'ザ・パレスホテル東京',
    cityKey: 'ginza', cityName: '銀座・丸の内', prefecture: '東京都',
    brand: 'Palace Hotel Tokyo',
    starRating: 5, roomCount: 290, typicalSqm: 45,
    annualAvgADR: 110000, weekdayAvg: 90000, weekendAvg: 130000, peakAvg: 200000, lowAvg: 70000,
    occ: 73,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '皇居外苑ビュー。フォレストガーデン付き。',
  },
  {
    hotelName: 'コンラッド東京',
    cityKey: 'ginza', cityName: '銀座・丸の内', prefecture: '東京都',
    brand: 'Conrad（Hilton）',
    starRating: 5, roomCount: 290, typicalSqm: 48,
    annualAvgADR: 95000, weekdayAvg: 80000, weekendAvg: 110000, peakAvg: 180000, lowAvg: 62000,
    occ: 74,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・Booking.com実測2024-2025',
    notes: '汐留・浜離宮ビュー。スパ&フィットネス完備。',
  },
  {
    hotelName: 'マリオット東京（東京マリオットホテル）',
    cityKey: 'ginza', cityName: '銀座・丸の内', prefecture: '東京都',
    brand: 'Marriott',
    starRating: 5, roomCount: 249, typicalSqm: 40,
    annualAvgADR: 55000, weekdayAvg: 46000, weekendAvg: 66000, peakAvg: 100000, lowAvg: 36000,
    occ: 78,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '品川（銀座丸の内エリア参考）。チャペル併設。',
  },

  // ──────────────────────────────────────────
  // 大阪 (lux_osaka)
  // ──────────────────────────────────────────
  {
    hotelName: 'ザ・リッツ・カールトン大阪',
    cityKey: 'osaka', cityName: '大阪', prefecture: '大阪府',
    brand: 'Ritz-Carlton（Marriott）',
    starRating: 5, roomCount: 291, typicalSqm: 50,
    annualAvgADR: 80000, weekdayAvg: 68000, weekendAvg: 95000, peakAvg: 160000, lowAvg: 52000,
    occ: 74,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com・Booking.com実測2024-2025',
    notes: '梅田・大阪ヒルトンプラザ。欧州クラシックデザイン。',
  },
  {
    hotelName: 'スイスホテル南海大阪（Sofitel）',
    cityKey: 'osaka', cityName: '大阪', prefecture: '大阪府',
    brand: 'Sofitel（Accor）',
    starRating: 5, roomCount: 546, typicalSqm: 38,
    annualAvgADR: 55000, weekdayAvg: 46000, weekendAvg: 66000, peakAvg: 110000, lowAvg: 36000,
    occ: 76,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '難波駅直結。高島屋タワー36-57F。',
  },
  {
    hotelName: 'セントレジス大阪',
    cityKey: 'osaka', cityName: '大阪', prefecture: '大阪府',
    brand: 'St. Regis（Marriott）',
    starRating: 5, roomCount: 160, typicalSqm: 50,
    annualAvgADR: 75000, weekdayAvg: 62000, weekendAvg: 90000, peakAvg: 150000, lowAvg: 48000,
    occ: 72,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '本町。全室バトラーサービス。フルバー付きスイート。',
  },
  {
    hotelName: 'コンラッド大阪',
    cityKey: 'osaka', cityName: '大阪', prefecture: '大阪府',
    brand: 'Conrad（Hilton）',
    starRating: 5, roomCount: 225, typicalSqm: 52,
    annualAvgADR: 70000, weekdayAvg: 58000, weekendAvg: 84000, peakAvg: 140000, lowAvg: 44000,
    occ: 73,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '中之島フェスティバルタワー33-40F。全室55㎡以上。',
  },
  {
    hotelName: 'ヒルトン大阪',
    cityKey: 'osaka', cityName: '大阪', prefecture: '大阪府',
    brand: 'Hilton',
    starRating: 5, roomCount: 525, typicalSqm: 32,
    annualAvgADR: 40000, weekdayAvg: 34000, weekendAvg: 48000, peakAvg: 80000, lowAvg: 26000,
    occ: 79,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・Booking.com実測2024-2025',
    notes: '梅田・大阪駅近。大型コンベンション需要。',
  },

  // ──────────────────────────────────────────
  // 京都 (lux_kyoto)
  // ──────────────────────────────────────────
  {
    hotelName: 'フォーシーズンズホテル京都',
    cityKey: 'kyoto', cityName: '京都', prefecture: '京都府',
    brand: 'Four Seasons',
    starRating: 5, roomCount: 180, typicalSqm: 55,
    annualAvgADR: 120000, weekdayAvg: 95000, weekendAvg: 150000, peakAvg: 280000, lowAvg: 72000,
    occ: 70,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・Booking.com・一休.com実測2024-2025',
    notes: '東山。庭園800年の歴史。全室プレミアムグレード。',
  },
  {
    hotelName: 'ウェスティン都ホテル京都',
    cityKey: 'kyoto', cityName: '京都', prefecture: '京都府',
    brand: 'Westin（Marriott）',
    starRating: 5, roomCount: 718, typicalSqm: 35,
    annualAvgADR: 45000, weekdayAvg: 36000, weekendAvg: 56000, peakAvg: 100000, lowAvg: 28000,
    occ: 74,
    hasBath: true, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '東山三条。大浴場「みやびの湯」。',
  },
  {
    hotelName: 'ハイアット リージェンシー 京都',
    cityKey: 'kyoto', cityName: '京都', prefecture: '京都府',
    brand: 'Hyatt Regency',
    starRating: 5, roomCount: 189, typicalSqm: 36,
    annualAvgADR: 50000, weekdayAvg: 40000, weekendAvg: 62000, peakAvg: 110000, lowAvg: 32000,
    occ: 73,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・一休.com実測2024-2025',
    notes: '七条。国立博物館横。デザイン重視。',
  },
  {
    hotelName: 'ザ・リッツ・カールトン京都',
    cityKey: 'kyoto', cityName: '京都', prefecture: '京都府',
    brand: 'Ritz-Carlton（Marriott）',
    starRating: 5, roomCount: 134, typicalSqm: 52,
    annualAvgADR: 140000, weekdayAvg: 115000, weekendAvg: 170000, peakAvg: 350000, lowAvg: 88000,
    occ: 72,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: 'Booking.com・一休.com実測2024-2025',
    notes: '鴨川沿い。インバウンドUHNW需要最強エリア。',
  },

  // ──────────────────────────────────────────
  // 博多 (lux_hakata)
  // ──────────────────────────────────────────
  {
    hotelName: 'ヒルトン福岡シーホーク',
    cityKey: 'hakata', cityName: '博多', prefecture: '福岡県',
    brand: 'Hilton',
    starRating: 5, roomCount: 1053, typicalSqm: 30,
    annualAvgADR: 32000, weekdayAvg: 26000, weekendAvg: 40000, peakAvg: 65000, lowAvg: 20000,
    occ: 79,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '百道浜・ヤフオクドーム隣接。九州最大の宴会場。',
  },
  {
    hotelName: 'ANAクラウンプラザホテル福岡',
    cityKey: 'hakata', cityName: '博多', prefecture: '福岡県',
    brand: 'Crowne Plaza（IHG）',
    starRating: 5, roomCount: 390, typicalSqm: 32,
    annualAvgADR: 28000, weekdayAvg: 23000, weekendAvg: 35000, peakAvg: 55000, lowAvg: 18000,
    occ: 77,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天実測2024-2025',
    notes: 'キャナルシティ博多隣接。ビジネス・観光複合。',
  },
  {
    hotelName: 'グランドハイアット福岡',
    cityKey: 'hakata', cityName: '博多', prefecture: '福岡県',
    brand: 'Grand Hyatt',
    starRating: 5, roomCount: 370, typicalSqm: 37,
    annualAvgADR: 38000, weekdayAvg: 32000, weekendAvg: 47000, peakAvg: 75000, lowAvg: 25000,
    occ: 76,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: 'キャナルシティ博多内。ラグジュアリー最上位層対応。',
  },
  {
    hotelName: 'ソラリア西鉄ホテル福岡',
    cityKey: 'hakata', cityName: '博多', prefecture: '福岡県',
    brand: '西鉄ホテルズ',
    starRating: 4, roomCount: 353, typicalSqm: 26,
    annualAvgADR: 24000, weekdayAvg: 20000, weekendAvg: 30000, peakAvg: 48000, lowAvg: 16000,
    occ: 79,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・価格.com実測2024-2025',
    notes: '天神・ソラリアプラザ内。インバウンド受容。',
  },

  // ──────────────────────────────────────────
  // 札幌 (lux_sapporo)
  // ──────────────────────────────────────────
  {
    hotelName: 'ホテルモントレエーデルホフ札幌',
    cityKey: 'sapporo', cityName: '札幌', prefecture: '北海道',
    brand: 'ホテルモントレ（阪急阪神ホテルズ）',
    starRating: 4, roomCount: 218, typicalSqm: 28,
    annualAvgADR: 32000, weekdayAvg: 27000, weekendAvg: 40000, peakAvg: 65000, lowAvg: 20000,
    occ: 74,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天トラベル・一休.com実測2024-2025',
    notes: '大通公園至近。ヨーロッパクラシックスタイル。雪まつり・ニセコスキー需要取込。',
  },
  {
    hotelName: 'ポールスター札幌',
    cityKey: 'sapporo', cityName: '札幌', prefecture: '北海道',
    brand: 'ポールスター',
    starRating: 4, roomCount: 300, typicalSqm: 26,
    annualAvgADR: 22000, weekdayAvg: 18000, weekendAvg: 28000, peakAvg: 45000, lowAvg: 14000,
    occ: 76,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天実測2024-2025',
    notes: '大通公園前。ビジネス〜観光複合。',
  },
  {
    hotelName: 'ANAホリデイ・インン札幌すすきの',
    cityKey: 'sapporo', cityName: '札幌', prefecture: '北海道',
    brand: 'Holiday Inn（IHG）',
    starRating: 4, roomCount: 301, typicalSqm: 28,
    annualAvgADR: 24000, weekdayAvg: 20000, weekendAvg: 30000, peakAvg: 50000, lowAvg: 15000,
    occ: 75,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・じゃらん実測2024-2025',
    notes: 'すすきの直近。IHGブランド。',
  },

  // ──────────────────────────────────────────
  // 横浜 (lux_yokohama)
  // ──────────────────────────────────────────
  {
    hotelName: 'ヨコハマ グランド インターコンチネンタル ホテル',
    cityKey: 'yokohama', cityName: '横浜', prefecture: '神奈川県',
    brand: 'InterContinental（IHG）',
    starRating: 5, roomCount: 594, typicalSqm: 37,
    annualAvgADR: 42000, weekdayAvg: 35000, weekendAvg: 52000, peakAvg: 85000, lowAvg: 27000,
    occ: 76,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: 'みなとみらい・帆船型タワー。ベイビュー最強。',
  },
  {
    hotelName: 'ハイアット リージェンシー 横浜',
    cityKey: 'yokohama', cityName: '横浜', prefecture: '神奈川県',
    brand: 'Hyatt Regency',
    starRating: 5, roomCount: 320, typicalSqm: 38,
    annualAvgADR: 45000, weekdayAvg: 38000, weekendAvg: 55000, peakAvg: 90000, lowAvg: 30000,
    occ: 75,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '馬車道・横浜スタジアム近接。2020年開業。',
  },
  {
    hotelName: 'ニューグランドホテル横浜',
    cityKey: 'yokohama', cityName: '横浜', prefecture: '神奈川県',
    brand: 'ホテルニューグランド',
    starRating: 4, roomCount: 182, typicalSqm: 28,
    annualAvgADR: 28000, weekdayAvg: 23000, weekendAvg: 35000, peakAvg: 55000, lowAvg: 18000,
    occ: 74,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・一休.com実測2024-2025',
    notes: '1927年創業クラシックホテル。山下公園前。',
  },

  // ──────────────────────────────────────────
  // 名古屋 (lux_nagoya)
  // ──────────────────────────────────────────
  {
    hotelName: 'ウェスティンナゴヤキャッスル',
    cityKey: 'nagoya', cityName: '名古屋', prefecture: '愛知県',
    brand: 'Westin（Marriott）',
    starRating: 5, roomCount: 232, typicalSqm: 36,
    annualAvgADR: 35000, weekdayAvg: 29000, weekendAvg: 43000, peakAvg: 68000, lowAvg: 22000,
    occ: 75,
    hasBath: true, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '名古屋城隣接。大浴場付き。',
  },
  {
    hotelName: 'ヒルトン名古屋',
    cityKey: 'nagoya', cityName: '名古屋', prefecture: '愛知県',
    brand: 'Hilton',
    starRating: 5, roomCount: 460, typicalSqm: 35,
    annualAvgADR: 33000, weekdayAvg: 27000, weekendAvg: 42000, peakAvg: 65000, lowAvg: 21000,
    occ: 76,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '栄・名古屋中心部。エグゼクティブラウンジ人気。',
  },
  {
    hotelName: 'マリオットアソシアホテル名古屋',
    cityKey: 'nagoya', cityName: '名古屋', prefecture: '愛知県',
    brand: 'Marriott（JR東海）',
    starRating: 5, roomCount: 775, typicalSqm: 30,
    annualAvgADR: 30000, weekdayAvg: 25000, weekendAvg: 38000, peakAvg: 58000, lowAvg: 19000,
    occ: 78,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '名古屋駅JRセントラルタワーズ。コンベンション最大規模。',
  },

  // ──────────────────────────────────────────
  // 那覇 (lux_naha)
  // ──────────────────────────────────────────
  {
    hotelName: 'ハイアット リージェンシー 那覇',
    cityKey: 'naha', cityName: '那覇', prefecture: '沖縄県',
    brand: 'Hyatt Regency',
    starRating: 5, roomCount: 296, typicalSqm: 36,
    annualAvgADR: 35000, weekdayAvg: 28000, weekendAvg: 44000, peakAvg: 72000, lowAvg: 22000,
    occ: 74,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '国際通り近接。2015年開業。リゾート型ラグジュアリー。',
  },
  {
    hotelName: 'ANAインターコンチネンタル万座ビーチリゾート',
    cityKey: 'naha', cityName: '那覇', prefecture: '沖縄県',
    brand: 'InterContinental（IHG）',
    starRating: 5, roomCount: 323, typicalSqm: 38,
    annualAvgADR: 48000, weekdayAvg: 38000, weekendAvg: 62000, peakAvg: 110000, lowAvg: 28000,
    occ: 72,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・Booking.com実測2024-2025',
    notes: '恩納村・ビーチフロント。プライベートビーチ。',
  },
  {
    hotelName: 'ダブルツリー by ヒルトン那覇',
    cityKey: 'naha', cityName: '那覇', prefecture: '沖縄県',
    brand: 'DoubleTree by Hilton',
    starRating: 4, roomCount: 270, typicalSqm: 28,
    annualAvgADR: 26000, weekdayAvg: 21000, weekendAvg: 33000, peakAvg: 55000, lowAvg: 16000,
    occ: 76,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・Booking.com実測2024-2025',
    notes: '首里城近接。インバウンド受け入れ強。',
  },

  // ──────────────────────────────────────────
  // 渋谷 (shibuya) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'セルリアンタワー東急ホテル',
    cityKey: 'shibuya', cityName: '渋谷', prefecture: '東京都',
    brand: '東急ホテルズ',
    starRating: 5, roomCount: 411, typicalSqm: 38,
    annualAvgADR: 42000, weekdayAvg: 38000, weekendAvg: 50000, peakAvg: 80000, lowAvg: 28000,
    occ: 80,
    hasBath: true, hasSauna: false, hasExecutiveFloor: true,
    source: '価格.com: 2名合計¥50,100〜¥516,120, じゃらんnet, JTBプラン2024',
    notes: '渋谷駅徒歩3分。地上40F。NOHシアター文化施設併設。タワーのランドマーク感が強み。',
  },
  {
    hotelName: '渋谷エクセルホテル東急',
    cityKey: 'shibuya', cityName: '渋谷', prefecture: '東京都',
    brand: '東急ホテルズ',
    starRating: 4, roomCount: 408, typicalSqm: 27,
    annualAvgADR: 30000, weekdayAvg: 26000, weekendAvg: 36000, peakAvg: 55000, lowAvg: 20000,
    occ: 84,
    hasBath: true, hasSauna: false, hasExecutiveFloor: false,
    source: 'トラベルコ最安¥24,300〜, JTB, じゃらんnet: 2名¥26,540〜',
    notes: '渋谷マークシティ直結。スクランブル交差点近接。インバウンド集客力高い。',
  },
  {
    hotelName: '渋谷ストリームエクセルホテル東急',
    cityKey: 'shibuya', cityName: '渋谷', prefecture: '東京都',
    brand: '東急ホテルズ',
    starRating: 4, roomCount: 166, typicalSqm: 30,
    annualAvgADR: 32000, weekdayAvg: 28000, weekendAvg: 38000, peakAvg: 58000, lowAvg: 22000,
    occ: 82,
    hasBath: true, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天トラベル, 一休.com, じゃらんnet 実勢価格 2024-2025',
    notes: '渋谷ストリーム内。渋谷川沿い再開発エリア。モダンなデザインホテル。',
  },
  {
    hotelName: 'ヒルトン東京お台場',
    cityKey: 'shibuya', cityName: '渋谷・お台場', prefecture: '東京都',
    brand: 'ヒルトン',
    starRating: 5, roomCount: 453, typicalSqm: 40,
    annualAvgADR: 38000, weekdayAvg: 34000, weekendAvg: 46000, peakAvg: 75000, lowAvg: 26000,
    occ: 77,
    hasBath: true, hasSauna: true, hasExecutiveFloor: true,
    source: '一休.com, じゃらんnet, JTB 2024-2025実勢価格',
    notes: 'お台場代表ラグジュアリー。レインボーブリッジ・東京湾望む。ヒルトン上位ティア施設。',
  },

  // ──────────────────────────────────────────
  // 金沢 FAV LUX (kanazawa) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: '金沢白鳥路 ホテル山楽',
    cityKey: 'kanazawa', cityName: '金沢', prefecture: '石川県',
    brand: '県都ホテルグループ',
    starRating: 4, roomCount: 111, typicalSqm: 28,
    annualAvgADR: 21000, weekdayAvg: 17000, weekendAvg: 27000, peakAvg: 45000, lowAvg: 13000,
    occ: 75,
    hasBath: true, hasSauna: false, hasExecutiveFloor: false,
    source: 'じゃらんnet: 1泊¥13,400〜(2名素泊), KNT: 1人¥18,000〜(朝食付), agoda2025',
    notes: '白鳥路温泉（天然温泉「美人の湯」）が最大特徴。兼六園そば。和の設えでリゾート感あり。',
  },
  {
    hotelName: '金沢東急ホテル',
    cityKey: 'kanazawa', cityName: '金沢', prefecture: '石川県',
    brand: '東急ホテルズ',
    starRating: 4, roomCount: 171, typicalSqm: 25,
    annualAvgADR: 19000, weekdayAvg: 16000, weekendAvg: 24000, peakAvg: 40000, lowAvg: 11000,
    occ: 78,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: 'じゃらんnet: 2名¥14,000〜, KNTプラン, 一休.com実勢 2024',
    notes: '金沢駅から車6分。兼六園・21世紀美術館近接。北陸新幹線開業後に改装・グレードアップ。',
  },
  {
    hotelName: 'ANAクラウンプラザホテル金沢',
    cityKey: 'kanazawa', cityName: '金沢', prefecture: '石川県',
    brand: 'ANA / IHG Crowne Plaza',
    starRating: 4, roomCount: 215, typicalSqm: 28,
    annualAvgADR: 22000, weekdayAvg: 18000, weekendAvg: 28000, peakAvg: 45000, lowAvg: 11000,
    occ: 78,
    hasBath: true, hasSauna: false, hasExecutiveFloor: false,
    source: 'KNT: 朝食付¥15,300〜, 夕朝食¥43,000〜, トラベルコ最安¥11,499(素泊2名)',
    notes: '金沢駅兼六園口直結。金沢随一の好立地。ビジネス・観光客メイン。能登復興需要で稼働安定。',
  },

  // ──────────────────────────────────────────
  // 広島 FAV LUX (hiroshima) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'グランドプリンスホテル広島',
    cityKey: 'hiroshima', cityName: '広島市', prefecture: '広島県',
    brand: 'プリンスホテルズ&リゾーツ',
    starRating: 4, roomCount: 680, typicalSqm: 30,
    annualAvgADR: 25000, weekdayAvg: 21000, weekendAvg: 32000, peakAvg: 50000, lowAvg: 15000,
    occ: 76,
    hasBath: true, hasSauna: false, hasExecutiveFloor: true,
    source: 'JTB宿泊プラン一覧, プリンスホテル公式, じゃらんnet 2024-2025実勢',
    notes: '宇品港近く。広島湾望む大型シティリゾート。MICE対応可能な大規模宴会場。',
  },
  {
    hotelName: 'リーガロイヤルホテル広島',
    cityKey: 'hiroshima', cityName: '広島市', prefecture: '広島県',
    brand: 'ロイヤルホテルグループ',
    starRating: 4, roomCount: 490, typicalSqm: 28,
    annualAvgADR: 22000, weekdayAvg: 18000, weekendAvg: 28000, peakAvg: 45000, lowAvg: 14000,
    occ: 78,
    hasBath: true, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天トラベル, JTB, じゃらんnet 2024-2025実勢価格',
    notes: '広島城近く。老舗シティホテル。地元企業の会食・宴会需要が高い。',
  },

  // ──────────────────────────────────────────
  // 仙台 FAV LUX (sendai) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'ウェスティンホテル仙台',
    cityKey: 'sendai', cityName: '仙台', prefecture: '宮城県',
    brand: 'マリオット・インターナショナル（Westin）',
    starRating: 5, roomCount: 292, typicalSqm: 35,
    annualAvgADR: 32000, weekdayAvg: 27000, weekendAvg: 40000, peakAvg: 65000, lowAvg: 18000,
    occ: 78,
    hasBath: true, hasSauna: false, hasExecutiveFloor: true,
    source: 'トラベルコ, KNTハイクラス, 宿泊記ブログ(2025): 素泊¥18,000台/人〜, 最安¥30,360(4月)',
    notes: '仙台駅西口徒歩3分。38〜39F。仙台随一のインターナショナルラグジュアリー。ヘブンリーベッド。',
  },
  {
    hotelName: '仙台国際ホテル',
    cityKey: 'sendai', cityName: '仙台', prefecture: '宮城県',
    brand: '独立系',
    starRating: 4, roomCount: 272, typicalSqm: 28,
    annualAvgADR: 22000, weekdayAvg: 18000, weekendAvg: 28000, peakAvg: 45000, lowAvg: 13000,
    occ: 78,
    hasBath: true, hasSauna: false, hasExecutiveFloor: true,
    source: '一休.com, じゃらんnet, hotels.com仙台国際ホテル料金',
    notes: '仙台駅西口徒歩5分。老舗シティホテル。朝食ブッフェ約80種が人気。',
  },
  {
    hotelName: 'ホテルモントレ仙台',
    cityKey: 'sendai', cityName: '仙台', prefecture: '宮城県',
    brand: 'モントレグループ',
    starRating: 4, roomCount: 206, typicalSqm: 26,
    annualAvgADR: 20000, weekdayAvg: 17000, weekendAvg: 25000, peakAvg: 40000, lowAvg: 12000,
    occ: 80,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: 'じゃらんnet, 楽天トラベル, 仙台高級ホテルおすすめ8選(note 2026年版): 1万円台後半〜6万円台',
    notes: '仙台駅西口すぐ。ヨーロッパ調インテリア。ビジネス・観光客のコスパ重視層に人気。',
  },

  // ──────────────────────────────────────────
  // 天神（福岡市・上質） (lux_tenjin)
  // ──────────────────────────────────────────
  {
    hotelName: 'ホテルオークラ福岡',
    cityKey: 'tenjin', cityName: '天神', prefecture: '福岡県',
    brand: 'ホテルオークラ',
    starRating: 5, roomCount: 263, typicalSqm: 30,
    annualAvgADR: 38000, weekdayAvg: 33000, weekendAvg: 45000, peakAvg: 70000, lowAvg: 25000,
    occ: 74,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com・ホテルオークラ公式実測2024-2025',
    notes: 'コンパクトダブル22㎡・スタンダード25-28㎡・デラックス47㎡・ロイヤルスイート202㎡（公式確認）。天神ビジネスセンター直近。',
  },
  {
    hotelName: 'ANAクラウンプラザホテル福岡',
    cityKey: 'tenjin', cityName: '天神', prefecture: '福岡県',
    brand: 'IHG（ANAクラウンプラザ）',
    starRating: 5, roomCount: 434, typicalSqm: 32,
    annualAvgADR: 32000, weekdayAvg: 28000, weekendAvg: 38000, peakAvg: 58000, lowAvg: 21000,
    occ: 73,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '天神中心部。スタンダード28㎡・デラックス35㎡。法人コーポレートレート需要強。',
  },
  {
    hotelName: 'ザ・ロイヤルパークホテル福岡',
    cityKey: 'tenjin', cityName: '天神', prefecture: '福岡県',
    brand: 'ザ・ロイヤルパークホテル（三菱地所）',
    starRating: 4, roomCount: 200, typicalSqm: 28,
    annualAvgADR: 28000, weekdayAvg: 24500, weekendAvg: 33000, peakAvg: 50000, lowAvg: 18500,
    occ: 75,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・一休.com実測2024-2025',
    notes: '天神・渡辺通。スタンダード24㎡・デラックス28㎡・スイート60㎡。',
  },

  // ──────────────────────────────────────────
  // 熊本（上質） (lux_kumamoto)
  // ──────────────────────────────────────────
  {
    hotelName: 'ANAクラウンプラザホテル熊本ニュースカイ',
    cityKey: 'kumamoto', cityName: '熊本', prefecture: '熊本県',
    brand: 'IHG（ANAクラウンプラザ）',
    starRating: 5, roomCount: 241, typicalSqm: 28,
    annualAvgADR: 25000, weekdayAvg: 22000, weekendAvg: 29500, peakAvg: 44000, lowAvg: 16500,
    occ: 72,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com・ANA公式実測2024-2025',
    notes: 'スタンダードシングル¥11,580〜・スタンダードツイン¥12,080〜（2名税込）確認。熊本城眺望。',
  },
  {
    hotelName: '熊本ホテルキャッスル',
    cityKey: 'kumamoto', cityName: '熊本', prefecture: '熊本県',
    brand: '熊本ホテルキャッスル（独立系）',
    starRating: 4, roomCount: 191, typicalSqm: 28,
    annualAvgADR: 22000, weekdayAvg: 19000, weekendAvg: 26000, peakAvg: 40000, lowAvg: 14500,
    occ: 73,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・一休.com実測2024-2025',
    notes: 'エグゼクティブジュニアスイート51㎡・スイート72.64㎡・ロイヤルスイート93.46㎡確認。じゃらん¥6,900〜¥138,600（2名）。',
  },
  {
    hotelName: 'JRホテルクレメント熊本',
    cityKey: 'kumamoto', cityName: '熊本', prefecture: '熊本県',
    brand: 'JRホテルグループ',
    starRating: 4, roomCount: 305, typicalSqm: 26,
    annualAvgADR: 20000, weekdayAvg: 17500, weekendAvg: 23500, peakAvg: 36000, lowAvg: 13000,
    occ: 74,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・じゃらんnet実測2024-2025',
    notes: '熊本駅直結。スタンダード24㎡・デラックス26㎡。新幹線ビジネス需要中心。',
  },

  // ──────────────────────────────────────────
  // 鹿児島（上質） (lux_kagoshima)
  // ──────────────────────────────────────────
  {
    hotelName: '城山ホテル鹿児島（SHIROYAMA HOTEL kagoshima）',
    cityKey: 'kagoshima', cityName: '鹿児島', prefecture: '鹿児島県',
    brand: '城山観光',
    starRating: 5, roomCount: 341, typicalSqm: 35,
    annualAvgADR: 32000, weekdayAvg: 27500, weekendAvg: 38000, peakAvg: 60000, lowAvg: 21000,
    occ: 70,
    hasBath: true, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com・城山公式実測2024-2025',
    notes: 'スタンダード27㎡・デラックス桜島ビュー53㎡・ジュニアスイート66㎡・ロイヤルスイート126㎡確認。ロイヤルスイート¥126,000/室（じゃらん）。',
  },
  {
    hotelName: 'ガーデンテラス鹿児島',
    cityKey: 'kagoshima', cityName: '鹿児島', prefecture: '鹿児島県',
    brand: 'ガーデンテラス（西日本鉄道）',
    starRating: 5, roomCount: 50, typicalSqm: 45,
    annualAvgADR: 38000, weekdayAvg: 33000, weekendAvg: 45000, peakAvg: 72000, lowAvg: 25000,
    occ: 68,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・一休.com実測2024-2025',
    notes: '全室スイート構成（45-150㎡）。桜島・錦江湾の絶景。オールスイートリゾート型。',
  },
  {
    hotelName: 'かごしま桜島ホテル',
    cityKey: 'kagoshima', cityName: '鹿児島', prefecture: '鹿児島県',
    brand: '城山観光',
    starRating: 4, roomCount: 95, typicalSqm: 30,
    annualAvgADR: 22000, weekdayAvg: 18500, weekendAvg: 26500, peakAvg: 40000, lowAvg: 14500,
    occ: 69,
    hasBath: true, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・じゃらんnet実測2024-2025',
    notes: '桜島フェリーターミナル至近。溶岩露天風呂付き。桜島ビュー客室。',
  },

  // ──────────────────────────────────────────
  // 長崎（上質） (lux_nagasaki)
  // ──────────────────────────────────────────
  {
    hotelName: 'ガーデンテラス長崎',
    cityKey: 'nagasaki', cityName: '長崎', prefecture: '長崎県',
    brand: 'ガーデンテラス（西日本鉄道）',
    starRating: 5, roomCount: 30, typicalSqm: 55,
    annualAvgADR: 45000, weekdayAvg: 38000, weekendAvg: 54000, peakAvg: 85000, lowAvg: 29000,
    occ: 66,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・一休.com・ガーデンテラス公式実測2024-2025',
    notes: 'オーシャンスイート46-54㎡・タワースイート51-67㎡・ロイヤルスイート100-152㎡確認。長崎港・稲佐山眺望。',
  },
  {
    hotelName: 'ANAクラウンプラザホテル長崎グラバーヒル',
    cityKey: 'nagasaki', cityName: '長崎', prefecture: '長崎県',
    brand: 'IHG（ANAクラウンプラザ）',
    starRating: 4, roomCount: 210, typicalSqm: 24,
    annualAvgADR: 24000, weekdayAvg: 21000, weekendAvg: 28500, peakAvg: 44000, lowAvg: 15500,
    occ: 70,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・一休.com実測2024-2025',
    notes: 'スタンダードツイン20〜27㎡・スイート81㎡（6F・7F）確認。一休最低¥13,600〜（2名）。グラバー園近接。',
  },
  {
    hotelName: '長崎ホテル清風（大江戸温泉物語）',
    cityKey: 'nagasaki', cityName: '長崎', prefecture: '長崎県',
    brand: '大江戸温泉物語',
    starRating: 4, roomCount: 200, typicalSqm: 28,
    annualAvgADR: 22000, weekdayAvg: 18500, weekendAvg: 26500, peakAvg: 42000, lowAvg: 14000,
    occ: 68,
    hasBath: true, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・じゃらんnet実測2024-2025（和室2名¥14,910〜¥31,364/人）',
    notes: '大浴場・温泉あり。長崎港眺望。2026年4月リニューアル予定。',
  },

  // ──────────────────────────────────────────
  // 軽井沢（上質） (lux_karuizawa)
  // ──────────────────────────────────────────
  {
    hotelName: '星のや軽井沢',
    cityKey: 'karuizawa', cityName: '軽井沢', prefecture: '長野県',
    brand: '星のや（星野リゾート）',
    starRating: 5, roomCount: 77, typicalSqm: 60,
    annualAvgADR: 85000, weekdayAvg: 65000, weekendAvg: 108000, peakAvg: 175000, lowAvg: 48000,
    occ: 72,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '一休.com・じゃらんnet・星野リゾート公式実測2024-2025',
    notes: '全棟独立型ヴィラ。谷川河畔。ダイニングルーム付き客室60㎡。夏（7-8月）・秋（9-10月）・GW超繁忙期。',
  },
  {
    hotelName: 'ザ・プリンス軽井沢',
    cityKey: 'karuizawa', cityName: '軽井沢', prefecture: '長野県',
    brand: 'プリンスホテル（西武ホールディングス）',
    starRating: 5, roomCount: 78, typicalSqm: 40,
    annualAvgADR: 55000, weekdayAvg: 42000, weekendAvg: 72000, peakAvg: 120000, lowAvg: 32000,
    occ: 68,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・一休.com実測2024-2025',
    notes: 'ザ・プリンス パークタワー東京と同系列。軽井沢高原。スタンダード38㎡・デラックス45㎡。',
  },
  {
    hotelName: 'ホテルインディゴ軽井沢',
    cityKey: 'karuizawa', cityName: '軽井沢', prefecture: '長野県',
    brand: 'IHG（ホテルインディゴ）',
    starRating: 5, roomCount: 92, typicalSqm: 38,
    annualAvgADR: 52000, weekdayAvg: 40000, weekendAvg: 68000, peakAvg: 112000, lowAvg: 30000,
    occ: 70,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・一休.com・IHG公式実測2024-2025',
    notes: '軽井沢銀座徒歩圏。ブティックデザインホテル。スタンダード38㎡・スイート75㎡。2019年開業。',
  },

  // ──────────────────────────────────────────
  // 池袋（上質） (lux_ikebukuro)
  // ──────────────────────────────────────────
  {
    hotelName: 'ホテルメトロポリタン池袋',
    cityKey: 'ikebukuro', cityName: '池袋', prefecture: '東京都',
    brand: 'ホテルメトロポリタン（JR東日本ホテルズ）',
    starRating: 4, roomCount: 815, typicalSqm: 30,
    annualAvgADR: 28000, weekdayAvg: 25000, weekendAvg: 33000, peakAvg: 50000, lowAvg: 18500,
    occ: 76,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '池袋駅直結。スタンダード22㎡、クラブルーム33㎡、スイート130㎡。エグゼクティブフロアあり。',
  },
  {
    hotelName: 'サンシャインシティプリンスホテル',
    cityKey: 'ikebukuro', cityName: '池袋', prefecture: '東京都',
    brand: 'プリンスホテル（西武ホールディングス）',
    starRating: 4, roomCount: 1100, typicalSqm: 28,
    annualAvgADR: 22000, weekdayAvg: 19500, weekendAvg: 26000, peakAvg: 38000, lowAvg: 15000,
    occ: 75,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・じゃらんnet実測2024-2025',
    notes: 'サンシャインシティ直結。東京スカイツリー眺望。大型国際会議に強い。',
  },
  {
    hotelName: 'ホテルメトロポリタン池袋イースト',
    cityKey: 'ikebukuro', cityName: '池袋', prefecture: '東京都',
    brand: 'ホテルメトロポリタン（JR東日本ホテルズ）',
    starRating: 4, roomCount: 175, typicalSqm: 26,
    annualAvgADR: 25000, weekdayAvg: 22000, weekendAvg: 30000, peakAvg: 44000, lowAvg: 17000,
    occ: 74,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・価格.com実測2024-2025',
    notes: '池袋東口徒歩3分。コンパクト上質。スタンダード19㎡・スーペリア26㎡。',
  },

  // ──────────────────────────────────────────
  // 上野（上質） (lux_ueno)
  // ──────────────────────────────────────────
  {
    hotelName: '上野エクセルホテル東急',
    cityKey: 'ueno', cityName: '上野・秋葉原', prefecture: '東京都',
    brand: '東急ホテルズ',
    starRating: 4, roomCount: 436, typicalSqm: 28,
    annualAvgADR: 26000, weekdayAvg: 23000, weekendAvg: 31000, peakAvg: 46000, lowAvg: 17500,
    occ: 77,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・一休.com実測2024-2025',
    notes: '上野駅徒歩1分。スタンダード23㎡・スーペリア27㎡・デラックス28㎡（公式確認）。',
  },
  {
    hotelName: 'ホテルマイステイズプレミア上野',
    cityKey: 'ueno', cityName: '上野・秋葉原', prefecture: '東京都',
    brand: 'マイステイズプレミア',
    starRating: 4, roomCount: 229, typicalSqm: 25,
    annualAvgADR: 24000, weekdayAvg: 21000, weekendAvg: 28000, peakAvg: 42000, lowAvg: 16000,
    occ: 76,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・価格.com実測2024-2025',
    notes: '御徒町駅近接。スタンダード20㎡・デラックス25㎡。アメニティ充実。',
  },
  {
    hotelName: 'ザ ノット 東京上野',
    cityKey: 'ueno', cityName: '上野・秋葉原', prefecture: '東京都',
    brand: 'THE KNOT（共立リゾーツ）',
    starRating: 4, roomCount: 183, typicalSqm: 28,
    annualAvgADR: 28000, weekdayAvg: 24500, weekendAvg: 33000, peakAvg: 50000, lowAvg: 18500,
    occ: 74,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・一休.com実測2024-2025',
    notes: '上野・秋葉原エリア。デザイン型アッパーミドル。全室28㎡以上。',
  },

  // ──────────────────────────────────────────
  // 品川（上質） (lux_shinagawa)
  // ──────────────────────────────────────────
  {
    hotelName: 'ストリングスホテル東京インターコンチネンタル',
    cityKey: 'shinagawa', cityName: '品川', prefecture: '東京都',
    brand: 'IHG（インターコンチネンタル）',
    starRating: 5, roomCount: 206, typicalSqm: 35,
    annualAvgADR: 45000, weekdayAvg: 40000, weekendAvg: 53000, peakAvg: 78000, lowAvg: 30000,
    occ: 74,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com・IHG公式実測2024-2025',
    notes: 'クラシック23-31㎡・プレミアム32-38㎡・クラブ35-40㎡・スイート70㎡（公式確認）。最低¥49,200〜（2名）。',
  },
  {
    hotelName: 'グランドプリンスホテル高輪',
    cityKey: 'shinagawa', cityName: '品川', prefecture: '東京都',
    brand: 'プリンスホテル（西武ホールディングス）',
    starRating: 5, roomCount: 408, typicalSqm: 31,
    annualAvgADR: 32000, weekdayAvg: 28000, weekendAvg: 38000, peakAvg: 56000, lowAvg: 21000,
    occ: 73,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '高輪緑地5万㎡庭園。スタンダード28㎡・デラックス31㎡・スイート85㎡。',
  },
  {
    hotelName: '品川プリンスホテル（N棟・メインタワー）',
    cityKey: 'shinagawa', cityName: '品川', prefecture: '東京都',
    brand: 'プリンスホテル（西武ホールディングス）',
    starRating: 4, roomCount: 1300, typicalSqm: 24,
    annualAvgADR: 26000, weekdayAvg: 23000, weekendAvg: 31000, peakAvg: 46000, lowAvg: 17000,
    occ: 76,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・じゃらんnet実測2024-2025',
    notes: '品川駅高輪口直結。N棟スタンダード21㎡・メインタワー24㎡（公式確認）。',
  },

  // ──────────────────────────────────────────
  // 神戸（上質） (lux_kobe)
  // ──────────────────────────────────────────
  {
    hotelName: 'ホテルオークラ神戸',
    cityKey: 'kobe', cityName: '神戸', prefecture: '兵庫県',
    brand: 'ホテルオークラ',
    starRating: 5, roomCount: 476, typicalSqm: 32,
    annualAvgADR: 30000, weekdayAvg: 26500, weekendAvg: 35500, peakAvg: 52000, lowAvg: 20000,
    occ: 73,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com・ホテルオークラ公式実測2024-2025',
    notes: 'みなとの見える丘公園近接。スタンダード28㎡・デラックス34㎡・スイート53㎡。',
  },
  {
    hotelName: 'ANAクラウンプラザホテル神戸',
    cityKey: 'kobe', cityName: '神戸', prefecture: '兵庫県',
    brand: 'IHG（ANAクラウンプラザ）',
    starRating: 5, roomCount: 593, typicalSqm: 34,
    annualAvgADR: 28000, weekdayAvg: 24500, weekendAvg: 33000, peakAvg: 50000, lowAvg: 18500,
    occ: 74,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '新神戸駅直結。スタンダード30㎡・デラックス34㎡。新幹線アクセス最良立地。',
  },
  {
    hotelName: '神戸北野ホテル',
    cityKey: 'kobe', cityName: '神戸', prefecture: '兵庫県',
    brand: '神戸北野ホテル（独立系）',
    starRating: 5, roomCount: 27, typicalSqm: 38,
    annualAvgADR: 42000, weekdayAvg: 36500, weekendAvg: 50000, peakAvg: 75000, lowAvg: 28000,
    occ: 70,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・一休.com実測2024-2025',
    notes: '「世界一の朝食」で有名。異人館エリア。スタンダードツイン30㎡・朝食込み¥57,600〜（2名）確認。',
  },
  {
    hotelName: 'THE ORIENT KOBE（旧オリエンタルホテル神戸）',
    cityKey: 'kobe', cityName: '神戸', prefecture: '兵庫県',
    brand: 'THE ORIENT（オリックスホテルズ）',
    starRating: 5, roomCount: 188, typicalSqm: 40,
    annualAvgADR: 35000, weekdayAvg: 30500, weekendAvg: 42000, peakAvg: 62000, lowAvg: 23000,
    occ: 72,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com実測2024-2025',
    notes: '旧居留地。リブランド2023年。デラックス41.91㎡ ¥65,000〜（2名）実測確認。',
  },

  // ──────────────────────────────────────────
  // 奈良（上質） (lux_nara)
  // ──────────────────────────────────────────
  {
    hotelName: 'JWマリオット・ホテル奈良',
    cityKey: 'nara', cityName: '奈良', prefecture: '奈良県',
    brand: 'JW Marriott（Marriott International）',
    starRating: 5, roomCount: 158, typicalSqm: 38,
    annualAvgADR: 42000, weekdayAvg: 35000, weekendAvg: 52000, peakAvg: 85000, lowAvg: 27000,
    occ: 68,
    hasBath: false, hasSauna: false, hasExecutiveFloor: true,
    source: '楽天・一休.com・Marriott公式実測2024-2025',
    notes: 'デラックス36㎡ ¥40,000〜（1名）・エグゼクティブスイート92㎡ ¥90,000〜確認。2022年開業。',
  },
  {
    hotelName: '奈良ホテル',
    cityKey: 'nara', cityName: '奈良', prefecture: '奈良県',
    brand: '奈良ホテル（近鉄グループ）',
    starRating: 5, roomCount: 127, typicalSqm: 30,
    annualAvgADR: 32000, weekdayAvg: 26000, weekendAvg: 40000, peakAvg: 65000, lowAvg: 20000,
    occ: 70,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・一休.com・奈良ホテル公式実測2024-2025',
    notes: '1909年創業。「関西の迎賓館」。本館スタンダード21.8㎡・デラックス34-39㎡・インペリアルスイート87㎡確認。',
  },
  {
    hotelName: 'ホテルフジタ奈良',
    cityKey: 'nara', cityName: '奈良', prefecture: '奈良県',
    brand: 'フジタ観光',
    starRating: 4, roomCount: 117, typicalSqm: 26,
    annualAvgADR: 22000, weekdayAvg: 18000, weekendAvg: 27500, peakAvg: 45000, lowAvg: 14000,
    occ: 72,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・じゃらんnet実測2024-2025',
    notes: '近鉄奈良駅近接。スタンダード24㎡・デラックス28㎡。',
  },

  // ──────────────────────────────────────────
  // 函館（上質） (lux_hakodate)
  // ──────────────────────────────────────────
  {
    hotelName: 'ラビスタ函館ベイ',
    cityKey: 'hakodate', cityName: '函館', prefecture: '北海道',
    brand: 'ラビスタ（共立リゾーツ）',
    starRating: 4, roomCount: 307, typicalSqm: 34,
    annualAvgADR: 28000, weekdayAvg: 24000, weekendAvg: 33500, peakAvg: 52000, lowAvg: 18000,
    occ: 72,
    hasBath: true, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・一休.com実測2024-2025',
    notes: 'スタンダードツイン25㎡・デラックスツイン34㎡・特別室43㎡・ANNEX露天風呂付59㎡（公式確認）。2名合計¥15,700〜¥79,200。',
  },
  {
    hotelName: 'センチュリーマリーナ函館',
    cityKey: 'hakodate', cityName: '函館', prefecture: '北海道',
    brand: 'センチュリーマリーナ（共立メンテナンス）',
    starRating: 4, roomCount: 302, typicalSqm: 30,
    annualAvgADR: 25000, weekdayAvg: 21000, weekendAvg: 30000, peakAvg: 48000, lowAvg: 16000,
    occ: 71,
    hasBath: true, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・公式実測2024-2025',
    notes: 'ベイエリア。函館港一望。素泊2名1室¥17,600〜¥235,000確認。スーペリア27㎡・プレミア40㎡。',
  },
  {
    hotelName: '函館国際ホテル',
    cityKey: 'hakodate', cityName: '函館', prefecture: '北海道',
    brand: '函館国際ホテル（独立系）',
    starRating: 4, roomCount: 430, typicalSqm: 28,
    annualAvgADR: 20000, weekdayAvg: 17000, weekendAvg: 24000, peakAvg: 38000, lowAvg: 13000,
    occ: 68,
    hasBath: false, hasSauna: false, hasExecutiveFloor: false,
    source: '楽天・じゃらんnet実測2024-2025',
    notes: '函館朝市・ベイエリア直近。ビジネス〜観光客両対応。スーペリア24㎡・デラックス30㎡。',
  },

];

// ═══════════════════════════════════════════════════════════════════════════
// SEVEN×SEVEN 競合ホテル（ラグジュアリーリゾート。ADR目安: ¥30,000〜¥300,000+/室）
// 対象: SXS_CITIESの主要10都市 × 約6軒
// データ源: 2025年5月 STR Japan / じゃらんnet / 一休.com / 価格.com 実測値
// ═══════════════════════════════════════════════════════════════════════════

export const SXS_COMPETITOR_HOTELS: SxSCompetitorHotel[] = [

  // ===== 石垣島 (ishigaki) =====

  {
    hotelName: 'ANAインターコンチネンタル石垣リゾート',
    cityKey: 'ishigaki', cityName: '石垣島', prefecture: '沖縄県',
    category: 'luxury_resort', starRating: 5, roomCount: 458,
    roomTypes: [
      { label: 'Standard Ocean View', sqmMin: 38, sqmMax: 50, annualAvgADR: 38000 },
      { label: 'Club Intercontinental', sqmMin: 50, sqmMax: 75, annualAvgADR: 65000 },
      { label: 'Suite', sqmMin: 80, sqmMax: 150, annualAvgADR: 120000 },
    ],
    annualAvgADR: 48000, peakADR: 110000, lowADR: 22000, occ: 73,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: '価格.com実測・じゃらんnet・一休.com 2024-2025',
    notes: '石垣島最大級。マエサトビーチ隣接。',
  },
  {
    hotelName: 'フサキビーチリゾート ホテル＆ヴィラズ',
    cityKey: 'ishigaki', cityName: '石垣島', prefecture: '沖縄県',
    category: 'luxury_resort', starRating: 4, roomCount: 396,
    roomTypes: [
      { label: 'Standard Room', sqmMin: 32, sqmMax: 45, annualAvgADR: 22000 },
      { label: 'Ocean View Room', sqmMin: 45, sqmMax: 60, annualAvgADR: 35000 },
      { label: 'Villa', sqmMin: 70, sqmMax: 120, annualAvgADR: 65000 },
    ],
    annualAvgADR: 32000, peakADR: 90000, lowADR: 14000, occ: 75,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'フサキ公式・価格.com・トラベルコ実測 2024-2025',
    notes: '石垣島西端。ヴィラ棟あり。',
  },
  {
    hotelName: 'JUSANDI（ユサンディ）',
    cityKey: 'ishigaki', cityName: '石垣島', prefecture: '沖縄県',
    category: 'ultra_luxury', starRating: 5, roomCount: 5,
    roomTypes: [
      { label: 'Pool Villa Suite', sqmMin: 100, sqmMax: 200, annualAvgADR: 145000 },
      { label: 'Private Beach Villa', sqmMin: 150, sqmMax: 250, annualAvgADR: 190000 },
    ],
    annualAvgADR: 160000, peakADR: 300000, lowADR: 95000, occ: 72,
    hasPrivatePool: true, hasOnsenPrivate: false,
    source: '価格.com実測・一休.com 2024-2025',
    notes: 'ミシュランガイド2025二つ星。全5棟プールヴィラ。',
  },
  {
    hotelName: 'はいむるぶし（小浜島）',
    cityKey: 'ishigaki', cityName: '石垣島（小浜島）', prefecture: '沖縄県',
    category: 'luxury_resort', starRating: 4, roomCount: 120,
    roomTypes: [
      { label: 'Standard Cottage', sqmMin: 40, sqmMax: 60, annualAvgADR: 40000 },
      { label: 'Premium Villa', sqmMin: 80, sqmMax: 120, annualAvgADR: 100000 },
    ],
    annualAvgADR: 55000, peakADR: 140000, lowADR: 27000, occ: 68,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'じゃらんnet・価格.com実測 2024-2025',
    notes: '小浜島の老舗リゾート。2025年7月リニューアル。47㎡+40㎡ガーデン。',
  },
  {
    hotelName: 'クラブメッド石垣島',
    cityKey: 'ishigaki', cityName: '石垣島', prefecture: '沖縄県',
    category: 'luxury_resort', starRating: 4, roomCount: 350,
    roomTypes: [
      { label: 'Standard Room', sqmMin: 30, sqmMax: 45, annualAvgADR: 35000 },
      { label: 'Superior Room', sqmMin: 45, sqmMax: 60, annualAvgADR: 50000 },
    ],
    annualAvgADR: 42000, peakADR: 100000, lowADR: 18000, occ: 70,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'HIS・KNT・じゃらん実測 2024-2025',
    notes: 'オールインクルーシブ型。川平湾エリア。',
  },

  // ===== 糸島 (itoshima) =====

  {
    hotelName: 'Alba HOTEL & Glamping（糸島シーサイドリゾート）',
    cityKey: 'itoshima', cityName: '糸島', prefecture: '福岡県',
    category: 'boutique', starRating: 4, roomCount: 30,
    roomTypes: [
      { label: 'Hotel Room with Terrace Jacuzzi', sqmMin: 35, sqmMax: 60, annualAvgADR: 42000 },
      { label: 'Glamping Villa', sqmMin: 50, sqmMax: 80, annualAvgADR: 55000 },
    ],
    annualAvgADR: 48000, peakADR: 90000, lowADR: 25000, occ: 65,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'Alba公式・一休.com・楽天 2024-2025',
    notes: '全室テラスにジェットバス。屋上・屋内プール完備。',
  },
  {
    hotelName: '糸島 THE HOUSE（コンシェルジュ付きVilla）',
    cityKey: 'itoshima', cityName: '糸島', prefecture: '福岡県',
    category: 'ultra_luxury', starRating: 5, roomCount: 3,
    roomTypes: [
      { label: 'Exclusive Villa', sqmMin: 100, sqmMax: 200, annualAvgADR: 80000 },
    ],
    annualAvgADR: 80000, peakADR: 150000, lowADR: 45000, occ: 55,
    hasPrivatePool: true, hasOnsenPrivate: false,
    source: '一休・楽天推計（糸島ラグジュアリーヴィラ市場参考値）2024-2025',
    notes: 'プールヴィラ型。糸島エリア最高峰。',
  },

  // ===== 箱根 (hakone) =====

  {
    hotelName: '強羅花壇',
    cityKey: 'hakone', cityName: '箱根', prefecture: '神奈川県',
    category: 'ultra_luxury', starRating: 5, roomCount: 37,
    roomTypes: [
      { label: 'Standard Wa Room', sqmMin: 40, sqmMax: 60, annualAvgADR: 90000 },
      { label: 'Deluxe Room', sqmMin: 60, sqmMax: 80, annualAvgADR: 130000 },
      { label: 'Suite / Bettei', sqmMin: 100, sqmMax: 200, annualAvgADR: 220000 },
    ],
    annualAvgADR: 120000, peakADR: 300000, lowADR: 61000, occ: 75,
    hasPrivatePool: false, hasOnsenPrivate: true,
    source: 'BIGLOBE旅行・JTB・価格.com実測 2024-2025',
    notes: 'ミシュラン3キー(2025年)。1名1泊70,850〜107,850円。',
  },
  {
    hotelName: '界 仙石原（星野リゾート）',
    cityKey: 'hakone', cityName: '箱根', prefecture: '神奈川県',
    category: 'luxury_resort', starRating: 5, roomCount: 16,
    roomTypes: [
      { label: 'Suite with Rotenburo', sqmMin: 40, sqmMax: 60, annualAvgADR: 65000 },
    ],
    annualAvgADR: 65000, peakADR: 120000, lowADR: 40000, occ: 80,
    hasPrivatePool: false, hasOnsenPrivate: true,
    source: 'じゃらん・JTB実測 2024-2025',
    notes: '全16室・全室露天風呂付き。1泊2名128,700円〜。',
  },
  {
    hotelName: '仙石原古今',
    cityKey: 'hakone', cityName: '箱根', prefecture: '神奈川県',
    category: 'ultra_luxury', starRating: 5, roomCount: 5,
    roomTypes: [
      { label: 'Suite Room (92㎡〜)', sqmMin: 92, sqmMax: 130, annualAvgADR: 150000 },
    ],
    annualAvgADR: 155000, peakADR: 280000, lowADR: 73000, occ: 70,
    hasPrivatePool: false, hasOnsenPrivate: true,
    source: '価格.com実測・Klook 2024-2025',
    notes: '5室のみ。全室92㎡以上。素泊まり2名146,545円〜。',
  },
  {
    hotelName: '箱根吟遊',
    cityKey: 'hakone', cityName: '箱根', prefecture: '神奈川県',
    category: 'ultra_luxury', starRating: 5, roomCount: 13,
    roomTypes: [
      { label: 'Standard Suite', sqmMin: 45, sqmMax: 65, annualAvgADR: 70000 },
      { label: 'Deluxe Suite', sqmMin: 65, sqmMax: 100, annualAvgADR: 100000 },
    ],
    annualAvgADR: 80000, peakADR: 160000, lowADR: 42000, occ: 78,
    hasPrivatePool: false, hasOnsenPrivate: true,
    source: 'BIGLOBE旅行・価格.com実測 2024-2025',
    notes: '全室露天風呂付き。宮ノ下渓谷。',
  },
  {
    hotelName: 'ザ・プリンス箱根芦ノ湖',
    cityKey: 'hakone', cityName: '箱根', prefecture: '神奈川県',
    category: 'luxury_resort', starRating: 5, roomCount: 80,
    roomTypes: [
      { label: 'Standard Lake View', sqmMin: 35, sqmMax: 50, annualAvgADR: 30000 },
      { label: 'Deluxe Lake View', sqmMin: 50, sqmMax: 70, annualAvgADR: 48000 },
      { label: 'Suite', sqmMin: 80, sqmMax: 140, annualAvgADR: 90000 },
    ],
    annualAvgADR: 40000, peakADR: 100000, lowADR: 24000, occ: 72,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'HIS・トラベルコ実測 2024-2025',
    notes: '芦ノ湖畔クラシックリゾート。',
  },

  // ===== 京都 (kyoto) =====

  {
    hotelName: 'アマン京都',
    cityKey: 'kyoto', cityName: '京都', prefecture: '京都府',
    category: 'ultra_luxury', starRating: 5, roomCount: 26,
    roomTypes: [
      { label: 'Forest Studio', sqmMin: 77, sqmMax: 100, annualAvgADR: 280000 },
      { label: 'Pavilion Suite', sqmMin: 120, sqmMax: 180, annualAvgADR: 420000 },
    ],
    annualAvgADR: 320000, peakADR: 600000, lowADR: 180000, occ: 65,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'トラベルコ・一休.com実測 2024-2025',
    notes: '金閣寺北。スタンダードレート2名¥484,880〜。',
  },
  {
    hotelName: '翠嵐 ラグジュアリーコレクション京都',
    cityKey: 'kyoto', cityName: '京都', prefecture: '京都府',
    category: 'ultra_luxury', starRating: 5, roomCount: 39,
    roomTypes: [
      { label: 'Deluxe Room', sqmMin: 45, sqmMax: 65, annualAvgADR: 80000 },
      { label: 'Suite with Private Onsen', sqmMin: 80, sqmMax: 140, annualAvgADR: 180000 },
    ],
    annualAvgADR: 115000, peakADR: 380000, lowADR: 55000, occ: 72,
    hasPrivatePool: false, hasOnsenPrivate: true,
    source: 'JTB・価格.com実測 2024-2025',
    notes: '嵐山・渡月橋隣接。2名税込113,850〜379,500円。',
  },
  {
    hotelName: '俵屋旅館',
    cityKey: 'kyoto', cityName: '京都', prefecture: '京都府',
    category: 'ultra_luxury', starRating: 5, roomCount: 18,
    roomTypes: [
      { label: 'Standard Wa Room', sqmMin: 40, sqmMax: 60, annualAvgADR: 80000 },
      { label: 'Deluxe Suite', sqmMin: 80, sqmMax: 130, annualAvgADR: 150000 },
    ],
    annualAvgADR: 100000, peakADR: 200000, lowADR: 68000, occ: 78,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'JTB・トラベルコ実測 2024-2025',
    notes: '京都御三家。創業300年。朝食付き2名¥136,936〜。',
  },
  {
    hotelName: 'ザ・リッツ・カールトン京都',
    cityKey: 'kyoto', cityName: '京都', prefecture: '京都府',
    category: 'ultra_luxury', starRating: 5, roomCount: 134,
    roomTypes: [
      { label: 'Deluxe Room', sqmMin: 52, sqmMax: 70, annualAvgADR: 100000 },
      { label: 'Suite', sqmMin: 120, sqmMax: 250, annualAvgADR: 280000 },
    ],
    annualAvgADR: 140000, peakADR: 450000, lowADR: 75000, occ: 72,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'Booking.com・一休.com実測 2024-2025',
    notes: '鴨川沿い。インバウンドUHNW需要最強。',
  },

  // ===== 軽井沢 (karuizawa) =====

  {
    hotelName: '星野リゾート 軽井沢ホテルブレストンコート',
    cityKey: 'karuizawa', cityName: '軽井沢', prefecture: '長野県',
    category: 'luxury_resort', starRating: 5, roomCount: 77,
    roomTypes: [
      { label: 'Standard Cottage', sqmMin: 40, sqmMax: 65, annualAvgADR: 50000 },
      { label: 'Deluxe Cottage', sqmMin: 65, sqmMax: 90, annualAvgADR: 80000 },
      { label: 'Suite Cottage', sqmMin: 90, sqmMax: 150, annualAvgADR: 130000 },
    ],
    annualAvgADR: 68000, peakADR: 160000, lowADR: 35000, occ: 72,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'じゃらん・一休.com・HIS推計 2024-2025',
    notes: '木立コテージ型。フレンチ「ノルマンディー」併設。',
  },
  {
    hotelName: 'THE HIRAMATSU 軽井沢 御代田',
    cityKey: 'karuizawa', cityName: '軽井沢', prefecture: '長野県',
    category: 'ultra_luxury', starRating: 5, roomCount: 37,
    roomTypes: [
      { label: 'Cottage with Rotenburo', sqmMin: 50, sqmMax: 80, annualAvgADR: 80000 },
      { label: 'Premium Cottage', sqmMin: 80, sqmMax: 130, annualAvgADR: 130000 },
    ],
    annualAvgADR: 100000, peakADR: 200000, lowADR: 52000, occ: 70,
    hasPrivatePool: false, hasOnsenPrivate: true,
    source: 'JTB・じゃらん・トラベルコ実測 2024-2025',
    notes: '6万㎡の森に37室。全室テラス+半露天風呂。1室105,480〜246,440円。',
  },
  {
    hotelName: '軽井沢マリオットホテル',
    cityKey: 'karuizawa', cityName: '軽井沢', prefecture: '長野県',
    category: 'luxury_resort', starRating: 5, roomCount: 156,
    roomTypes: [
      { label: 'Deluxe Room', sqmMin: 38, sqmMax: 55, annualAvgADR: 40000 },
      { label: 'Suite', sqmMin: 80, sqmMax: 140, annualAvgADR: 100000 },
    ],
    annualAvgADR: 50000, peakADR: 130000, lowADR: 25000, occ: 68,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'Booking.com・楽天推計 2024-2025',
    notes: '軽井沢中心部。Marriott Bonvoy会員需要強。',
  },

  // ===== 東京 (tokyo) =====

  {
    hotelName: 'アマン東京',
    cityKey: 'tokyo', cityName: '東京', prefecture: '東京都',
    category: 'ultra_luxury', starRating: 5, roomCount: 84,
    roomTypes: [
      { label: 'Deluxe Suite (71㎡)', sqmMin: 71, sqmMax: 90, annualAvgADR: 200000 },
      { label: 'Premier Suite', sqmMin: 100, sqmMax: 180, annualAvgADR: 450000 },
    ],
    annualAvgADR: 280000, peakADR: 800000, lowADR: 180000, occ: 68,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'トラベルコ・JTB実測 2024-2025',
    notes: '大手町・常盤橋タワー。全室スイート71㎡〜。',
  },
  {
    hotelName: 'マンダリン オリエンタル 東京',
    cityKey: 'tokyo', cityName: '東京', prefecture: '東京都',
    category: 'ultra_luxury', starRating: 5, roomCount: 179,
    roomTypes: [
      { label: 'Deluxe Room', sqmMin: 50, sqmMax: 70, annualAvgADR: 80000 },
      { label: 'Suite', sqmMin: 100, sqmMax: 260, annualAvgADR: 250000 },
    ],
    annualAvgADR: 120000, peakADR: 500000, lowADR: 70000, occ: 72,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'トラベルコ・価格.com実測（RevPAR $701/2024実績）',
    notes: '日本橋・三越前。RevPAR前年比+16%（2024実績）。',
  },
  {
    hotelName: 'パーク ハイアット 東京',
    cityKey: 'tokyo', cityName: '東京', prefecture: '東京都',
    category: 'ultra_luxury', starRating: 5, roomCount: 178,
    roomTypes: [
      { label: 'Park Room', sqmMin: 47, sqmMax: 65, annualAvgADR: 80000 },
      { label: 'Park Suite', sqmMin: 100, sqmMax: 200, annualAvgADR: 200000 },
    ],
    annualAvgADR: 110000, peakADR: 400000, lowADR: 65000, occ: 70,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'Booking.com・楽天推計 2024-2025',
    notes: '西新宿52〜53階。2025年末リニューアル予定。',
  },
  {
    hotelName: 'ホテル雅叙園東京',
    cityKey: 'tokyo', cityName: '東京', prefecture: '東京都',
    category: 'luxury_resort', starRating: 5, roomCount: 35,
    roomTypes: [
      { label: 'Standard Suite', sqmMin: 60, sqmMax: 100, annualAvgADR: 70000 },
      { label: 'Deluxe Suite', sqmMin: 100, sqmMax: 200, annualAvgADR: 150000 },
    ],
    annualAvgADR: 90000, peakADR: 250000, lowADR: 55000, occ: 68,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: '一休.com・楽天推計 2024-2025',
    notes: '目黒川沿い。全室スイート。昭和豪華絢爛建築。',
  },

  // ===== 沖縄本島 (naha) — SXS_CITIESのcityKey='naha'に統一 =====
  // ※ 恩納村・名護エリアも沖縄SxS市場として naha でグルーピング

  {
    hotelName: 'ハレクラニ沖縄（恩納村）',
    cityKey: 'naha', cityName: '沖縄（恩納村）', prefecture: '沖縄県',
    category: 'ultra_luxury', starRating: 5, roomCount: 360,
    roomTypes: [
      { label: 'Premier Ocean View', sqmMin: 48, sqmMax: 70, annualAvgADR: 70000 },
      { label: 'Junior Suite', sqmMin: 80, sqmMax: 120, annualAvgADR: 120000 },
      { label: 'Villa', sqmMin: 150, sqmMax: 300, annualAvgADR: 250000 },
    ],
    annualAvgADR: 90000, peakADR: 300000, lowADR: 55000, occ: 72,
    hasPrivatePool: true, hasOnsenPrivate: false,
    source: 'hotel-zukan.com・luxehotelsworld.com実測 2024-2025',
    notes: '全室オーシャンビュー。夏ピーク10万円超。ヴィラ30万円〜。恩納村エリア。',
  },
  {
    hotelName: 'ザ・ブセナテラス（名護）',
    cityKey: 'naha', cityName: '沖縄（名護）', prefecture: '沖縄県',
    category: 'luxury_resort', starRating: 5, roomCount: 410,
    roomTypes: [
      { label: 'Standard Room', sqmMin: 35, sqmMax: 50, annualAvgADR: 35000 },
      { label: 'Ocean View Suite', sqmMin: 60, sqmMax: 100, annualAvgADR: 80000 },
      { label: 'Terrace Club Suite', sqmMin: 100, sqmMax: 200, annualAvgADR: 150000 },
    ],
    annualAvgADR: 55000, peakADR: 200000, lowADR: 22000, occ: 74,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'BIGLOBE旅行・HIS実測 2024-2025',
    notes: '部瀬名岬突端立地。1名21,920〜156,090円。名護エリア。',
  },
  {
    hotelName: 'ザ・リッツ・カールトン沖縄（名護）',
    cityKey: 'naha', cityName: '沖縄（名護）', prefecture: '沖縄県',
    category: 'ultra_luxury', starRating: 5, roomCount: 97,
    roomTypes: [
      { label: 'Deluxe Room 45㎡', sqmMin: 45, sqmMax: 58, annualAvgADR: 55000 },
      { label: 'Premium Deluxe 58㎡', sqmMin: 58, sqmMax: 75, annualAvgADR: 80000 },
      { label: 'Suite', sqmMin: 100, sqmMax: 250, annualAvgADR: 300000 },
    ],
    annualAvgADR: 80000, peakADR: 350000, lowADR: 45000, occ: 70,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: '価格.com・トラベルコ実測 2024-2025',
    notes: '全97室・名護湾ビュー。2名63,250〜151,800円。名護エリア。',
  },

  // ===== 由布院 (yufuin) =====

  {
    hotelName: '山荘 無量塔（MURATA）',
    cityKey: 'yufuin', cityName: '由布院', prefecture: '大分県',
    category: 'ultra_luxury', starRating: 5, roomCount: 12,
    roomTypes: [
      { label: 'Standard Cottage', sqmMin: 50, sqmMax: 80, annualAvgADR: 80000 },
      { label: 'Premium Suite', sqmMin: 100, sqmMax: 160, annualAvgADR: 140000 },
    ],
    annualAvgADR: 100000, peakADR: 200000, lowADR: 57000, occ: 75,
    hasPrivatePool: false, hasOnsenPrivate: true,
    source: '価格.com・楽天トラベル実測 2024-2025',
    notes: '由布院御三家。素泊まり2名114,400円〜。夕朝食171,600〜242,000円。',
  },
  {
    hotelName: '由布院 玉の湯',
    cityKey: 'yufuin', cityName: '由布院', prefecture: '大分県',
    category: 'ultra_luxury', starRating: 5, roomCount: 20,
    roomTypes: [
      { label: 'Standard Wa Room', sqmMin: 40, sqmMax: 65, annualAvgADR: 55000 },
      { label: 'Deluxe Room', sqmMin: 65, sqmMax: 100, annualAvgADR: 90000 },
    ],
    annualAvgADR: 65000, peakADR: 130000, lowADR: 35000, occ: 78,
    hasPrivatePool: false, hasOnsenPrivate: true,
    source: '価格.com・JTB実測 2024-2025',
    notes: '由布院御三家。朝食付き2名71,224円〜。',
  },
  {
    hotelName: '亀の井別荘',
    cityKey: 'yufuin', cityName: '由布院', prefecture: '大分県',
    category: 'ultra_luxury', starRating: 5, roomCount: 28,
    roomTypes: [
      { label: '離れ（60㎡）', sqmMin: 60, sqmMax: 80, annualAvgADR: 35000 },
      { label: '離れ くいな（140㎡）', sqmMin: 120, sqmMax: 160, annualAvgADR: 90000 },
    ],
    annualAvgADR: 50000, peakADR: 120000, lowADR: 27000, occ: 76,
    hasPrivatePool: false, hasOnsenPrivate: true,
    source: 'JTB・一休実測 2024-2025',
    notes: '由布院御三家。1名27,213〜69,505円。',
  },

  // ===== 熱海 (atami) =====

  {
    hotelName: 'ATAMIせかいえ',
    cityKey: 'atami', cityName: '熱海', prefecture: '静岡県',
    category: 'ultra_luxury', starRating: 5, roomCount: 21,
    roomTypes: [
      { label: 'Ocean View Suite', sqmMin: 50, sqmMax: 90, annualAvgADR: 65000 },
    ],
    annualAvgADR: 70000, peakADR: 150000, lowADR: 46000, occ: 72,
    hasPrivatePool: false, hasOnsenPrivate: true,
    source: '価格.com・Booking.com実測 2024-2025',
    notes: '全室オーシャンビュー・自家源泉露天風呂付き。2名93,500円〜。',
  },
  {
    hotelName: 'ふふ 熱海',
    cityKey: 'atami', cityName: '熱海', prefecture: '静岡県',
    category: 'ultra_luxury', starRating: 5, roomCount: 22,
    roomTypes: [
      { label: 'Comfort Suite Twin', sqmMin: 45, sqmMax: 70, annualAvgADR: 80000 },
      { label: 'Premium Suite', sqmMin: 80, sqmMax: 120, annualAvgADR: 130000 },
    ],
    annualAvgADR: 90000, peakADR: 200000, lowADR: 47000, occ: 75,
    hasPrivatePool: false, hasOnsenPrivate: true,
    source: 'トラベルコ・KAYAK実測 2024-2025',
    notes: '1名47,850円〜（2名1室、夕朝食付）。5〜10月74,800〜97,900円/名。',
  },
  {
    hotelName: 'リゾナーレ熱海（星野リゾート）',
    cityKey: 'atami', cityName: '熱海', prefecture: '静岡県',
    category: 'luxury_resort', starRating: 4, roomCount: 68,
    roomTypes: [
      { label: 'Suite Room', sqmMin: 45, sqmMax: 75, annualAvgADR: 50000 },
    ],
    annualAvgADR: 55000, peakADR: 120000, lowADR: 30000, occ: 74,
    hasPrivatePool: false, hasOnsenPrivate: true,
    source: '楽天・じゃらん推計 2024-2025',
    notes: '星野リゾート系。イタリアンダイニング併設。',
  },

  // ===== 白馬 (hakuba) =====

  {
    hotelName: 'KANOLLY Resorts HAKUBA',
    cityKey: 'hakuba', cityName: '白馬', prefecture: '長野県',
    category: 'ultra_luxury', starRating: 5, roomCount: 1,
    roomTypes: [
      { label: 'Exclusive 3LDK Lodge (400㎡)', sqmMin: 400, sqmMax: 400, annualAvgADR: 300000 },
    ],
    annualAvgADR: 300000, peakADR: 600000, lowADR: 250000, occ: 55,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: 'Relux・Goethe・LUX-BLO実測 2024-2025',
    notes: '1日1組限定400㎡3LDK+1000㎡ガーデン。1棟25万円〜。',
  },
  {
    hotelName: 'コルチナ・ジャパン',
    cityKey: 'hakuba', cityName: '白馬', prefecture: '長野県',
    category: 'boutique', starRating: 4, roomCount: 24,
    roomTypes: [
      { label: 'Standard Room', sqmMin: 25, sqmMax: 40, annualAvgADR: 30000 },
      { label: 'Superior Suite', sqmMin: 50, sqmMax: 75, annualAvgADR: 55000 },
    ],
    annualAvgADR: 38000, peakADR: 90000, lowADR: 18000, occ: 58,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: '楽天・じゃらん推計 2024-2025',
    notes: 'ヨーロピアン風シャレー。スキーシーズン集中型。',
  },
  {
    hotelName: '白馬岩岳 Japan Resorts',
    cityKey: 'hakuba', cityName: '白馬', prefecture: '長野県',
    category: 'luxury_resort', starRating: 4, roomCount: 20,
    roomTypes: [
      { label: 'Luxury Suite', sqmMin: 50, sqmMax: 80, annualAvgADR: 45000 },
    ],
    annualAvgADR: 50000, peakADR: 120000, lowADR: 25000, occ: 60,
    hasPrivatePool: false, hasOnsenPrivate: false,
    source: '公式・一休推計 2024-2025',
    notes: '岩岳スキー場近く。ガストロノミーダイニング。',
  },

  // ──────────────────────────────────────────
  // 大阪 (osaka) SxS追加 ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'フォーシーズンズホテル大阪',
    cityKey: 'osaka',
    cityName: '大阪',
    prefecture: '大阪府',
    category: 'ultra_luxury' as const,
    starRating: 5,
    roomCount: 175,
    roomTypes: [
      { label: 'デラックスルーム', sqmMin: 43, sqmMax: 46, annualAvgADR: 130000 },
      { label: 'プレミアムスイート', sqmMin: 100, sqmMax: 150, annualAvgADR: 500000 },
    ],
    annualAvgADR: 145000,
    peakADR: 200000,
    lowADR: 105000,
    occ: 72,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: '日本経済新聞2024/8報道, FourSeasons公式, 一休.com実測',
    notes: '2024年8月開業。堂島タワー28〜35F。スタンダード¥105,000〜（税サ別）。',
  },
  {
    hotelName: 'ウォルドーフ・アストリア大阪',
    cityKey: 'osaka',
    cityName: '大阪',
    prefecture: '大阪府',
    category: 'ultra_luxury' as const,
    starRating: 5,
    roomCount: 200,
    roomTypes: [
      { label: 'デラックスルーム', sqmMin: 45, sqmMax: 55, annualAvgADR: 110000 },
      { label: 'スイートルーム', sqmMin: 90, sqmMax: 150, annualAvgADR: 300000 },
    ],
    annualAvgADR: 120000,
    peakADR: 180000,
    lowADR: 84000,
    occ: 68,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: 'じゃらんnet実測, 宿泊記ブログ(2025/08), トラベルコ最安84,000円',
    notes: '2025年4月3日開業。グラングリーン大阪。ヒルトン最上級ブランド日本初進出。',
  },
  {
    hotelName: 'コンラッド大阪',
    cityKey: 'osaka',
    cityName: '大阪',
    prefecture: '大阪府',
    category: 'ultra_luxury' as const,
    starRating: 5,
    roomCount: 225,
    roomTypes: [
      { label: 'デラックスルーム', sqmMin: 45, sqmMax: 55, annualAvgADR: 80000 },
      { label: 'スイートルーム', sqmMin: 95, sqmMax: 130, annualAvgADR: 200000 },
    ],
    annualAvgADR: 88000,
    peakADR: 140000,
    lowADR: 60000,
    occ: 75,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: '価格.com, じゃらんnet: 75,686円〜711,930円 (2名/泊合計)',
    notes: '中之島フェスティバルタワーウエスト33〜40F。2025年¥80,000〜¥100,000水準。',
  },
  {
    hotelName: 'セントレジスホテル大阪',
    cityKey: 'osaka',
    cityName: '大阪',
    prefecture: '大阪府',
    category: 'ultra_luxury' as const,
    starRating: 5,
    roomCount: 160,
    roomTypes: [
      { label: 'デラックスルーム', sqmMin: 43, sqmMax: 55, annualAvgADR: 75000 },
      { label: 'グランドデラックス', sqmMin: 60, sqmMax: 80, annualAvgADR: 110000 },
    ],
    annualAvgADR: 78000,
    peakADR: 130000,
    lowADR: 55000,
    occ: 73,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: 'Wikipedia, じゃらんnet実勢価格, 格付けランキング記事2025',
    notes: '本町。バトラーサービス提供。2024〜2025年で70,000〜80,000円水準に上昇。',
  },
  {
    hotelName: '星野リゾート リゾナーレ大阪',
    cityKey: 'osaka',
    cityName: '大阪',
    prefecture: '大阪府',
    category: 'luxury_resort' as const,
    starRating: 4,
    roomCount: 136,
    roomTypes: [
      { label: 'スタンダードツイン', sqmMin: 35, sqmMax: 40, annualAvgADR: 45000 },
      { label: 'プレミアムルーム', sqmMin: 45, sqmMax: 60, annualAvgADR: 65000 },
    ],
    annualAvgADR: 50000,
    peakADR: 85000,
    lowADR: 32000,
    occ: 80,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: '星野リゾート公式, じゃらんnet, 楽天トラベル 2024-2025実勢',
    notes: '大阪・ビジネスリゾート型。2025年万博効果で需要増。星野リゾートの大人旅ブランド。',
  },

  // ──────────────────────────────────────────
  // 北海道/ニセコ (hokkaido) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'パーク ハイアット ニセコ HANAZONO',
    cityKey: 'hokkaido',
    cityName: 'ニセコ・倶知安',
    prefecture: '北海道',
    category: 'luxury_resort' as const,
    starRating: 5,
    roomCount: 100,
    roomTypes: [
      { label: 'パークキングルーム', sqmMin: 55, sqmMax: 65, annualAvgADR: 90000 },
      { label: 'パークスイート', sqmMin: 100, sqmMax: 130, annualAvgADR: 250000 },
    ],
    annualAvgADR: 105000,
    peakADR: 180000,
    lowADR: 45000,
    occ: 62,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: 'JTB公式プラン: ¥130,500〜(朝食付/2023-24ウィンター), HIS最安¥45,920, Klook2025実勢',
    notes: 'HANAZONOスキー場直結。ウィンターシーズン最低3泊制限あり。ウィンター偏重で夏季稼働低め。',
  },
  {
    hotelName: 'ヒルトンニセコビレッジ',
    cityKey: 'hokkaido',
    cityName: 'ニセコ・倶知安',
    prefecture: '北海道',
    category: 'luxury_resort' as const,
    starRating: 5,
    roomCount: 200,
    roomTypes: [
      { label: 'スタンダードルーム', sqmMin: 40, sqmMax: 50, annualAvgADR: 65000 },
      { label: 'ファミリールーム', sqmMin: 55, sqmMax: 70, annualAvgADR: 95000 },
    ],
    annualAvgADR: 72000,
    peakADR: 150000,
    lowADR: 15000,
    occ: 58,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: 'くまブログUSA宿泊記, タビアソビビビ調査: ハイシーズン¥15万〜/2名, オフ¥1.5万/人',
    notes: 'ニセコビレッジスキーリゾート直結。季節差が極めて大きい。',
  },
  {
    hotelName: 'ニセコ昆布温泉 鶴雅別荘 杢の抄',
    cityKey: 'hokkaido',
    cityName: 'ニセコ・蘭越',
    prefecture: '北海道',
    category: 'ryokan' as const,
    starRating: 5,
    roomCount: 30,
    roomTypes: [
      { label: '和モダンルーム', sqmMin: 40, sqmMax: 60, annualAvgADR: 55000 },
      { label: '特別室', sqmMin: 70, sqmMax: 100, annualAvgADR: 90000 },
    ],
    annualAvgADR: 62000,
    peakADR: 120000,
    lowADR: 35000,
    occ: 70,
    hasPrivatePool: false,
    hasOnsenPrivate: true,
    source: 'じゃらんnet, JTB, 一休.com: スキーシーズン¥17万〜/2名(人単価)/オフ¥4.5万〜/人',
    notes: '昆布温泉源泉。和モダン全室温泉。鶴雅グループ最高級施設。ニセコエリア希少な本格旅館。',
  },
  {
    hotelName: 'MUWA NISEKO',
    cityKey: 'hokkaido',
    cityName: 'ニセコ・倶知安',
    prefecture: '北海道',
    category: 'luxury_resort' as const,
    starRating: 5,
    roomCount: 53,
    roomTypes: [
      { label: 'スタジオルーム', sqmMin: 45, sqmMax: 55, annualAvgADR: 55000 },
      { label: 'スキーイン・スキーアウト スイート', sqmMin: 80, sqmMax: 120, annualAvgADR: 130000 },
    ],
    annualAvgADR: 68000,
    peakADR: 150000,
    lowADR: 31000,
    occ: 65,
    hasPrivatePool: false,
    hasOnsenPrivate: true,
    source: '価格.com: 2名/泊30,940円〜(朝食付); 一休.com; ミシュラン1キー(2024年7月)',
    notes: '2023年12月開業。スキーイン・スキーアウト。ウェルネスリゾート。露天風呂付客室あり。ミシュラン認定。',
  },
  {
    hotelName: 'ザ・ウィンザーホテル洞爺',
    cityKey: 'hokkaido',
    cityName: '洞爺湖町',
    prefecture: '北海道',
    category: 'luxury_resort' as const,
    starRating: 5,
    roomCount: 290,
    roomTypes: [
      { label: 'スタンダードルーム', sqmMin: 40, sqmMax: 55, annualAvgADR: 45000 },
      { label: 'スイートルーム', sqmMin: 80, sqmMax: 200, annualAvgADR: 150000 },
    ],
    annualAvgADR: 52000,
    peakADR: 100000,
    lowADR: 35000,
    occ: 68,
    hasPrivatePool: false,
    hasOnsenPrivate: true,
    source: 'じゃらんnet: 2名税込¥35,126〜, TripAdvisor2025, Windsor公式',
    notes: 'IHGヴィニェットコレクション加盟。洞爺湖畔・山頂立地。G8サミット開催地(2008年)。',
  },

  // ──────────────────────────────────────────
  // 那覇 SxS (naha) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'ザ・ナハテラス',
    cityKey: 'naha',
    cityName: '那覇',
    prefecture: '沖縄県',
    category: 'luxury_resort' as const,
    starRating: 5,
    roomCount: 157,
    roomTypes: [
      { label: 'デラックスルーム', sqmMin: 45, sqmMax: 55, annualAvgADR: 42000 },
      { label: 'スイートルーム', sqmMin: 85, sqmMax: 140, annualAvgADR: 120000 },
    ],
    annualAvgADR: 48000,
    peakADR: 90000,
    lowADR: 30000,
    occ: 78,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: '一休.com, 高級ホテルナビ, Hotels.com 那覇ラグジュアリーTOP10',
    notes: '那覇新都心。沖縄唯一のハイクラスシティリゾート型。バトラーサービス、プール完備。',
  },
  {
    hotelName: 'ハイアット リージェンシー 那覇 沖縄',
    cityKey: 'naha',
    cityName: '那覇',
    prefecture: '沖縄県',
    category: 'luxury_resort' as const,
    starRating: 5,
    roomCount: 296,
    roomTypes: [
      { label: 'スタンダードキング', sqmMin: 35, sqmMax: 45, annualAvgADR: 35000 },
      { label: 'リージェンシークラブルーム', sqmMin: 45, sqmMax: 55, annualAvgADR: 55000 },
    ],
    annualAvgADR: 40000,
    peakADR: 80000,
    lowADR: 23000,
    occ: 82,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: 'トラベルコ最安¥22,976〜, JTB, KNTハイクラス掲載',
    notes: '国際通りそば。琉球伝統工芸を随所に配したラグジュアリーホテル。',
  },
  {
    hotelName: 'ロワジール スパタワー 那覇',
    cityKey: 'naha',
    cityName: '那覇',
    prefecture: '沖縄県',
    category: 'boutique' as const,
    starRating: 4,
    roomCount: 186,
    roomTypes: [
      { label: 'スパタワースタンダード', sqmMin: 28, sqmMax: 38, annualAvgADR: 25000 },
      { label: 'スパタワースーペリア', sqmMin: 38, sqmMax: 50, annualAvgADR: 38000 },
    ],
    annualAvgADR: 28000,
    peakADR: 55000,
    lowADR: 14000,
    occ: 82,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: 'じゃらんnet: 2名税込¥14,400〜, KNT: 1人¥10,646〜¥73,695 (2024/12〜2025/10)',
    notes: '那覇唯一の天然温泉付きタワーホテル。温泉スパ施設が差別化要因。',
  },

  // ──────────────────────────────────────────
  // 横浜 SxS (yokohama) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'インターコンチネンタル横浜 Pier 8',
    cityKey: 'yokohama',
    cityName: '横浜',
    prefecture: '神奈川県',
    category: 'luxury_resort' as const,
    starRating: 5,
    roomCount: 173,
    roomTypes: [
      { label: 'デラックスルーム', sqmMin: 46, sqmMax: 55, annualAvgADR: 50000 },
      { label: 'スイートルーム', sqmMin: 90, sqmMax: 140, annualAvgADR: 150000 },
    ],
    annualAvgADR: 58000,
    peakADR: 110000,
    lowADR: 35000,
    occ: 75,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: 'じゃらんnet, KNT: 2名税込¥51,640〜, トラベルコ, IHG横浜Pier8公式',
    notes: '赤レンガ倉庫隣の埠頭。全室46㎡以上。3方向を海に囲まれた立地。ベイブリッジ・横浜港眺望。',
  },
  {
    hotelName: 'ヨコハマ グランド インターコンチネンタル ホテル',
    cityKey: 'yokohama',
    cityName: '横浜',
    prefecture: '神奈川県',
    category: 'luxury_resort' as const,
    starRating: 5,
    roomCount: 594,
    roomTypes: [
      { label: 'スタンダードルーム', sqmMin: 32, sqmMax: 42, annualAvgADR: 35000 },
      { label: 'クラブルーム', sqmMin: 42, sqmMax: 55, annualAvgADR: 60000 },
    ],
    annualAvgADR: 40000,
    peakADR: 80000,
    lowADR: 19000,
    occ: 78,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: 'じゃらんnet: 2名¥19,200〜¥116,250, JTB, パシフィコ横浜公式',
    notes: 'みなとみらい。帆船型の外観。パシフィコ横浜隣接。プール・サウナ・スパ完備。',
  },
  {
    hotelName: '横浜ベイホテル東急',
    cityKey: 'yokohama',
    cityName: '横浜',
    prefecture: '神奈川県',
    category: 'luxury_resort' as const,
    starRating: 5,
    roomCount: 603,
    roomTypes: [
      { label: 'スタンダードルーム', sqmMin: 33, sqmMax: 42, annualAvgADR: 33000 },
      { label: 'ベイクラブフロア', sqmMin: 42, sqmMax: 55, annualAvgADR: 55000 },
    ],
    annualAvgADR: 38000,
    peakADR: 75000,
    lowADR: 17000,
    occ: 80,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: 'トラベルコ最安¥17,280〜, JTB, 横浜ベイホテル東急公式 (2025/10-2026/02プラン確認)',
    notes: 'みなとみらい駅直結。クイーンズスクエア横浜内。大観覧車前。夜景が売り。',
  },

  // ──────────────────────────────────────────
  // 広島・宮島 SxS (hiroshima) ※追加
  // ──────────────────────────────────────────
  {
    hotelName: 'みやじまの宿 岩惣',
    cityKey: 'hiroshima',
    cityName: '廿日市市・宮島',
    prefecture: '広島県',
    category: 'ryokan' as const,
    starRating: 5,
    roomCount: 38,
    roomTypes: [
      { label: '和室スタンダード', sqmMin: 25, sqmMax: 35, annualAvgADR: 55000 },
      { label: '離れ', sqmMin: 50, sqmMax: 80, annualAvgADR: 120000 },
    ],
    annualAvgADR: 65000,
    peakADR: 130000,
    lowADR: 40000,
    occ: 82,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: 'じゃらんnet: 2名¥57,200〜¥161,898, 価格.com, 宮島老舗旅館宿泊記',
    notes: '幕末創業160年超の老舗。全38室和室。G7広島サミット(2023)ワーキングディナー会場。ミシュラン1つ星料理。',
  },
  {
    hotelName: '宮島グランドホテル 有もと',
    cityKey: 'hiroshima',
    cityName: '廿日市市・宮島',
    prefecture: '広島県',
    category: 'ryokan' as const,
    starRating: 4,
    roomCount: 55,
    roomTypes: [
      { label: '和室スタンダード', sqmMin: 22, sqmMax: 32, annualAvgADR: 35000 },
      { label: '特別室', sqmMin: 45, sqmMax: 70, annualAvgADR: 75000 },
    ],
    annualAvgADR: 40000,
    peakADR: 80000,
    lowADR: 27000,
    occ: 80,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: 'じゃらんnet, JTBプラン, 宮島グランドホテル有もと公式: 1泊2食1名¥27,500〜(税サ込)',
    notes: '400年の歴史。宮島桟橋から徒歩5分。瀬戸内の鮮魚を使った懐石料理。',
  },
  {
    hotelName: '宮島 錦水館',
    cityKey: 'hiroshima',
    cityName: '廿日市市・宮島',
    prefecture: '広島県',
    category: 'ryokan' as const,
    starRating: 4,
    roomCount: 42,
    roomTypes: [
      { label: '和室スタンダード', sqmMin: 20, sqmMax: 30, annualAvgADR: 38000 },
      { label: '潮湯温泉付き特別室', sqmMin: 45, sqmMax: 65, annualAvgADR: 80000 },
    ],
    annualAvgADR: 45000,
    peakADR: 80000,
    lowADR: 32000,
    occ: 80,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: '一休.com, じゃらんnet: 2名税込¥72,200〜, 錦水館公式(ベストレート保証)',
    notes: '明治35年創業。厳島神社大鳥居を望む海沿い。潮湯温泉が特徴。和モダンにリニューアル済み。',
  },
  {
    hotelName: 'シェラトングランドホテル広島',
    cityKey: 'hiroshima',
    cityName: '広島市',
    prefecture: '広島県',
    category: 'luxury_resort' as const,
    starRating: 5,
    roomCount: 380,
    roomTypes: [
      { label: 'デラックスルーム', sqmMin: 32, sqmMax: 42, annualAvgADR: 30000 },
      { label: 'クラブルーム(20〜21F)', sqmMin: 42, sqmMax: 55, annualAvgADR: 55000 },
    ],
    annualAvgADR: 35000,
    peakADR: 65000,
    lowADR: 20000,
    occ: 78,
    hasPrivatePool: false,
    hasOnsenPrivate: false,
    source: 'じゃらんnet, KNTハイクラス, 一休.com Sheraton Grand Hiroshima掲載',
    notes: '広島駅直結(新幹線口徒歩1分)。シェラトングランドコレクション。クラブラウンジ20〜21F。',
  },

];


// ═══════════════════════════════════════════════════════════════════════════
// 都市×ブランド別 室面積ADRテーブル（2025年5月〜2026年5月推計）
// FAV（ビジネスホテル）: シングル(13-16㎡)/セミダブル(16-19㎡)/ツイン・ダブル(20-28㎡)/スーペリア(28-40㎡)
// FAV LUX（上質ホテル）: スタンダード(28-42㎡)/デラックス(42-60㎡)/ジュニアスイート(60-90㎡)/スイート(90-200㎡)
// Sources: 楽天トラベル・じゃらんnet・一休.com実測 / STR Japan / JLL / Savills Japan 2024-2025
//          大阪万博ADR調査(カソク社) / 京都市観光協会データ年報2024 / 各ホテル公式・予約サイト実測
// ═══════════════════════════════════════════════════════════════════════════

export const FAV_CITY_ROOM_ADR: CityRoomADR[] = [
  // ── 東京エリア ──────────────────────────────────────────────────────────
  {
    cityKey:  'shinjuku',
    cityName: '新宿',
    brand:    'fav',
    areas:    ['観光:歌舞伎町・新宿御苑', '商業:新宿駅周辺・西新宿'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR: 13500, weekdayAvg: 11700, weekendAvg: 17000, peakAvg: 22000, lowAvg:  8500 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 15500, weekdayAvg: 13500, weekendAvg: 19500, peakAvg: 25000, lowAvg:  9800 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 20000, weekdayAvg: 17000, weekendAvg: 25000, peakAvg: 33000, lowAvg: 13000 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 26000, weekdayAvg: 22000, weekendAvg: 32000, peakAvg: 42000, lowAvg: 17000 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com 2024-2025実測推計（ドーミーイン・APA・ルートイン・ダイワロイネット参照）',
  },
  {
    cityKey:  'ginza',
    cityName: '銀座',
    brand:    'fav',
    areas:    ['商業・観光:銀座・有楽町・日比谷', '商業:汐留・新橋'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR: 14500, weekdayAvg: 12500, weekendAvg: 18500, peakAvg: 25000, lowAvg:  9000 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 17000, weekdayAvg: 14500, weekendAvg: 21500, peakAvg: 28500, lowAvg: 10500 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 22000, weekdayAvg: 19000, weekendAvg: 28000, peakAvg: 37000, lowAvg: 14500 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 29000, weekdayAvg: 25000, weekendAvg: 37000, peakAvg: 48000, lowAvg: 19000 },
    ],
    source: '楽天トラベル・じゃらんnet・一休.com 2024-2025実測推計（ドーミーインPREMIUM銀座・ダイワロイネット銀座PREMIER参照）',
    notes: 'ドーミーインPREMIUM銀座 シングル15.4-16.9㎡・ツイン19.3㎡（公式実測）',
  },
  {
    cityKey:  'yokohama',
    cityName: '横浜',
    brand:    'fav',
    areas:    ['観光・商業:みなとみらい・横浜駅周辺', '商業:関内・桜木町'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR: 11500, weekdayAvg: 10000, weekendAvg: 14500, peakAvg: 20000, lowAvg:  7200 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 13500, weekdayAvg: 11700, weekendAvg: 17000, peakAvg: 23500, lowAvg:  8500 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 17500, weekdayAvg: 15000, weekendAvg: 22000, peakAvg: 30000, lowAvg: 11000 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 23000, weekdayAvg: 19500, weekendAvg: 29000, peakAvg: 39000, lowAvg: 14500 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com 2024-2025実測推計（ダイワロイネット横浜公園 シングル18㎡・ツイン27㎡参照）',
  },
  {
    cityKey:  'shibuya',
    cityName: '渋谷',
    brand:    'fav',
    areas:    ['商業・観光:渋谷・表参道・原宿', '商業:恵比寿・代官山'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR: 13000, weekdayAvg: 11200, weekendAvg: 16500, peakAvg: 22000, lowAvg:  8200 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 15500, weekdayAvg: 13300, weekendAvg: 19500, peakAvg: 26000, lowAvg:  9800 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 20000, weekdayAvg: 17200, weekendAvg: 25500, peakAvg: 34000, lowAvg: 13000 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 26500, weekdayAvg: 22500, weekendAvg: 33500, peakAvg: 44000, lowAvg: 17000 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com 2024-2025実測推計（渋谷・恵比寿エリアビジネスホテル相場）',
  },
  // ── 関西エリア ──────────────────────────────────────────────────────────
  {
    cityKey:  'osaka',
    cityName: '大阪',
    brand:    'fav',
    areas:    ['観光:難波・心斎橋', '商業:梅田・大阪駅・北区'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR: 14800, weekdayAvg: 12800, weekendAvg: 18500, peakAvg: 26000, lowAvg:  9500 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 16700, weekdayAvg: 14400, weekendAvg: 21000, peakAvg: 29500, lowAvg: 10800 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 20000, weekdayAvg: 17200, weekendAvg: 25500, peakAvg: 35500, lowAvg: 13000 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 26000, weekdayAvg: 22500, weekendAvg: 33000, peakAvg: 46000, lowAvg: 17000 },
    ],
    source: '楽天トラベル・じゃらんnet・一休.com実測推計、野村不動産ソリューションズ市場データ、大阪万博ADR調査(カソク社)参照',
    notes: '大阪ビジネスホテルADR 2024年実績¥13,391（野村不動産）、2025年YoY+10.8%成長・万博期間ADR+46%を加重平均に反映',
  },
  {
    cityKey:  'kyoto',
    cityName: '京都',
    brand:    'fav',
    areas:    ['観光:祇園・東山', '商業:京都駅周辺', 'ビジネス:烏丸御池'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR: 16200, weekdayAvg: 13500, weekendAvg: 21000, peakAvg: 31000, lowAvg:  9800 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 18300, weekdayAvg: 15200, weekendAvg: 23800, peakAvg: 35000, lowAvg: 11000 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 22000, weekdayAvg: 18500, weekendAvg: 28500, peakAvg: 42000, lowAvg: 13500 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 29000, weekdayAvg: 24000, weekendAvg: 37500, peakAvg: 55000, lowAvg: 17500 },
    ],
    source: '京都市観光協会データ年報2024(確報)・月報2025、楽天トラベル・じゃらんnet・一休.com実測推計',
    notes: '京都市内全ホテル平均ADR2024年¥20,195（過去最高）。ビジネスホテル帯は全体平均の75-80%水準。桜(3-4月)・紅葉(11月)は全国最高峰の需要超過',
  },
  {
    cityKey:  'kobe',
    cityName: '神戸',
    brand:    'fav',
    areas:    ['商業・観光:三宮・元町', '観光:北野異人館エリア'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR: 12600, weekdayAvg: 10800, weekendAvg: 15800, peakAvg: 22000, lowAvg:  8000 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 14200, weekdayAvg: 12200, weekendAvg: 17800, peakAvg: 24800, lowAvg:  9000 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 17000, weekdayAvg: 14500, weekendAvg: 21500, peakAvg: 30000, lowAvg: 10800 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 22000, weekdayAvg: 18800, weekendAvg: 27500, peakAvg: 38500, lowAvg: 14000 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com実測推計、HotelBank神戸市ビジネスホテル分析2024-2025参照',
    notes: 'ダイワロイネット神戸三宮 シングル18㎡・ツイン27㎡（公式実測）。大阪ADR比▲15%水準',
  },
  {
    cityKey:  'nara',
    cityName: '奈良',
    brand:    'fav',
    areas:    ['観光:奈良公園・東大寺エリア', '商業:近鉄奈良駅周辺'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR:  9500, weekdayAvg:  8000, weekendAvg: 12000, peakAvg: 17500, lowAvg:  6000 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 10800, weekdayAvg:  9000, weekendAvg: 13500, peakAvg: 20000, lowAvg:  6800 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 13000, weekdayAvg: 10800, weekendAvg: 16500, peakAvg: 24000, lowAvg:  8200 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 17000, weekdayAvg: 14000, weekendAvg: 21500, peakAvg: 31000, lowAvg: 10500 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com実測推計、近鉄奈良駅周辺ビジネスホテル料金帯調査参照',
    notes: 'カンデオ奈良橿原 ガーデンツイン31㎡（公式実測）。日帰り観光客主体で宿泊需要は限定的。春(桜・鹿)・秋(紅葉)の繁閑差が大きい',
  },
  // ── 九州・沖縄エリア ────────────────────────────────────────────────────
  {
    cityKey:  'hakata',
    cityName: '博多',
    brand:    'fav',
    areas:    ['商業:博多駅周辺', '観光・商業:中洲・天神'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR: 12500, weekdayAvg: 10800, weekendAvg: 15800, peakAvg: 21000, lowAvg:  8000 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 14500, weekdayAvg: 12500, weekendAvg: 18500, peakAvg: 24500, lowAvg:  9300 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 18500, weekdayAvg: 16000, weekendAvg: 23500, peakAvg: 31000, lowAvg: 12000 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 24000, weekdayAvg: 20500, weekendAvg: 30500, peakAvg: 40000, lowAvg: 15500 },
    ],
    source: '楽天トラベル・じゃらんnet・一休.com 2024-2025実測推計（ドーミーイン博多祇園・ダイワロイネット博多祇園参照）',
    notes: 'ドーミーイン博多祇園 エコノミー12.2㎡・ダブル14.4-15.8㎡・ツイン21.5㎡（公式実測）。ダイワロイネット博多祇園 シングル18.2㎡・ツイン28.6㎡（一休実測）',
  },
  {
    cityKey:  'nagasaki',
    cityName: '長崎',
    brand:    'fav',
    areas:    ['観光:長崎駅周辺・新地中華街', '観光:グラバー園・南山手'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR:  8500, weekdayAvg:  7200, weekendAvg: 10800, peakAvg: 15500, lowAvg:  5500 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR:  9800, weekdayAvg:  8200, weekendAvg: 12500, peakAvg: 18000, lowAvg:  6200 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 12500, weekdayAvg: 10500, weekendAvg: 16000, peakAvg: 23000, lowAvg:  8000 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 16500, weekdayAvg: 14000, weekendAvg: 21000, peakAvg: 30000, lowAvg: 10500 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com 2024-2025実測推計（ドーミーイン長崎新地中華街参照）',
    notes: 'ドーミーイン長崎新地中華街 シングル14㎡・ツイン21.9-29.1㎡（公式実測）',
  },
  {
    cityKey:  'kumamoto',
    cityName: '熊本',
    brand:    'fav',
    areas:    ['商業:熊本駅周辺', '観光・商業:熊本城・上通・下通'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR:  9000, weekdayAvg:  7700, weekendAvg: 11500, peakAvg: 16500, lowAvg:  5800 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 10200, weekdayAvg:  8700, weekendAvg: 13000, peakAvg: 18500, lowAvg:  6500 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 13000, weekdayAvg: 11000, weekendAvg: 16500, peakAvg: 23500, lowAvg:  8300 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 17000, weekdayAvg: 14500, weekendAvg: 21500, peakAvg: 30500, lowAvg: 11000 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com 2024-2025実測推計（ドーミーイン熊本・マイステイズ熊本リバーサイド参照）',
    notes: 'ドーミーイン熊本 ダブル14.3-14.7㎡・ツイン22.4-23.0㎡（公式実測）。マイステイズ熊本リバーサイド シングル14.6㎡・ツイン21.4㎡・デラックスツイン27.3㎡（Trip.com実測）',
  },
  {
    cityKey:  'kagoshima',
    cityName: '鹿児島',
    brand:    'fav',
    areas:    ['観光・商業:天文館・鹿児島中央駅周辺', '港エリア'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR:  8000, weekdayAvg:  6800, weekendAvg: 10200, peakAvg: 14500, lowAvg:  5200 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR:  9200, weekdayAvg:  7800, weekendAvg: 11700, peakAvg: 16500, lowAvg:  5900 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 11800, weekdayAvg: 10000, weekendAvg: 15000, peakAvg: 21000, lowAvg:  7600 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 15500, weekdayAvg: 13000, weekendAvg: 19500, peakAvg: 27500, lowAvg: 10000 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com 2024-2025実測推計（ドーミーイン鹿児島・マイステイズ鹿児島天文館参照）',
    notes: 'ドーミーイン鹿児島 シングル13.0㎡・ダブル15-16㎡・ツイン22.2-22.9㎡（公式実測）。マイステイズ鹿児島天文館 ツイン23㎡（近畿ツーリスト実測）',
  },
  {
    cityKey:  'naha',
    cityName: '那覇',
    brand:    'fav',
    areas:    ['観光・商業:国際通り・那覇市内', '商業:那覇空港周辺'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR: 10500, weekdayAvg:  8800, weekendAvg: 13500, peakAvg: 19500, lowAvg:  7000 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 12200, weekdayAvg: 10200, weekendAvg: 15800, peakAvg: 22500, lowAvg:  8000 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 16000, weekdayAvg: 13200, weekendAvg: 20500, peakAvg: 29500, lowAvg: 10300 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 21500, weekdayAvg: 17800, weekendAvg: 27500, peakAvg: 39500, lowAvg: 14000 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com 2024-2025実測推計（APAホテル那覇松山 16㎡実測参照）',
    notes: 'APAホテル那覇松山 シングル16㎡（公式実測）。夏季(7-8月)・冬(2月)の繁閑差が大きいリゾート特性',
  },
  // ── 北日本・中部エリア ───────────────────────────────────────────────────
  {
    cityKey:  'sapporo',
    cityName: '札幌',
    brand:    'fav',
    areas:    ['観光・商業:すすきの・大通公園', '商業:札幌駅周辺'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR: 10500, weekdayAvg:  8900, weekendAvg: 13200, peakAvg: 19000, lowAvg:  6800 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 12200, weekdayAvg: 10400, weekendAvg: 15400, peakAvg: 22000, lowAvg:  7900 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 16000, weekdayAvg: 13500, weekendAvg: 20200, peakAvg: 29000, lowAvg: 10400 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 21000, weekdayAvg: 17700, weekendAvg: 26500, peakAvg: 38000, lowAvg: 13500 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com 2024-2025実測推計（ドーミーイン札幌ANNEX参照）',
    notes: 'ドーミーイン札幌ANNEX ダブル13.2-14.3㎡・ツイン18.2㎡・デラックスツイン24.8-27.4㎡（公式実測）。冬季(2月雪まつり)・夏(7-8月)が繁忙期',
  },
  {
    cityKey:  'sendai',
    cityName: '仙台',
    brand:    'fav',
    areas:    ['商業:仙台駅周辺・一番町', '観光・商業:国分町エリア'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR:  9500, weekdayAvg:  8100, weekendAvg: 12000, peakAvg: 17000, lowAvg:  6100 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 11000, weekdayAvg:  9400, weekendAvg: 14000, peakAvg: 19500, lowAvg:  7100 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 14000, weekdayAvg: 12000, weekendAvg: 17800, peakAvg: 25000, lowAvg:  9000 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 18500, weekdayAvg: 15700, weekendAvg: 23500, peakAvg: 33000, lowAvg: 12000 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com 2024-2025実測推計（ドーミーイン仙台駅前参照）',
    notes: 'ドーミーイン仙台駅前 コンパクトシングル約12㎡・シングル約15㎡・ツイン約22㎡（公式実測）',
  },
  {
    cityKey:  'hakodate',
    cityName: '函館',
    brand:    'fav',
    areas:    ['観光:函館山・元町', '商業:函館駅周辺'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR:  9000, weekdayAvg:  7600, weekendAvg: 11500, peakAvg: 17000, lowAvg:  5800 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 10500, weekdayAvg:  8900, weekendAvg: 13500, peakAvg: 19500, lowAvg:  6800 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 13500, weekdayAvg: 11400, weekendAvg: 17200, peakAvg: 25000, lowAvg:  8700 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 18000, weekdayAvg: 15200, weekendAvg: 23000, peakAvg: 33500, lowAvg: 11500 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com 2024-2025実測推計（ドーミーインEXPRESS函館五稜郭・マイステイズ函館五稜郭参照）',
    notes: 'ドーミーインEXPRESS函館五稜郭 ダブル18.6㎡・クイーン20.5㎡・ツイン22.0㎡（近畿ツーリスト実測）。インヴィンシブル投資法人実測ADR¥12,517',
  },
  {
    cityKey:  'kanazawa',
    cityName: '金沢',
    brand:    'fav',
    areas:    ['観光:兼六園・東茶屋街', '商業:金沢駅周辺・片町'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR: 10500, weekdayAvg:  8900, weekendAvg: 13500, peakAvg: 19500, lowAvg:  6700 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 12200, weekdayAvg: 10300, weekendAvg: 15700, peakAvg: 22500, lowAvg:  7800 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 16000, weekdayAvg: 13500, weekendAvg: 20500, peakAvg: 29500, lowAvg: 10200 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 21000, weekdayAvg: 17700, weekendAvg: 26800, peakAvg: 38500, lowAvg: 13500 },
    ],
    source: '楽天トラベル・じゃらんnet・一休.com 2024-2025実測推計（ドーミーイン金沢・マイステイズ金沢参照）',
    notes: 'ドーミーイン金沢 エコノミー12.0㎡・ダブル14.8-17.2㎡・ツイン21.9-25.5㎡（公式実測）。マイステイズ金沢片町 ダブル12.7-14.9㎡・ツイン17.3-21.1㎡（Yahoo!トラベル実測）。北陸新幹線延伸効果で高水準継続',
  },
  {
    cityKey:  'nagoya',
    cityName: '名古屋',
    brand:    'fav',
    areas:    ['商業:名古屋駅周辺・栄', '観光・商業:金山・大須'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR: 11500, weekdayAvg:  9900, weekendAvg: 14500, peakAvg: 20000, lowAvg:  7400 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 13200, weekdayAvg: 11400, weekendAvg: 16700, peakAvg: 23000, lowAvg:  8500 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 17000, weekdayAvg: 14700, weekendAvg: 21600, peakAvg: 29500, lowAvg: 11000 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 22500, weekdayAvg: 19200, weekendAvg: 28500, peakAvg: 39000, lowAvg: 14500 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com 2024-2025実測推計（ダイワロイネット名古屋・コンフォートホテル名古屋名駅南参照）',
    notes: 'ダイワロイネット名古屋駅前 全室18㎡以上・ツイン25㎡（公式実測）。コンフォートホテル名古屋名駅南 ダブル約22㎡（公式実測）',
  },
  {
    cityKey:  'hiroshima',
    cityName: '広島',
    brand:    'fav',
    areas:    ['観光・商業:広島駅周辺・流川', '観光:平和公園・原爆ドーム周辺'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR: 10000, weekdayAvg:  8500, weekendAvg: 12700, peakAvg: 18000, lowAvg:  6500 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 11500, weekdayAvg:  9800, weekendAvg: 14700, peakAvg: 20500, lowAvg:  7400 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 15000, weekdayAvg: 12800, weekendAvg: 19100, peakAvg: 26500, lowAvg:  9700 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 19500, weekdayAvg: 16600, weekendAvg: 24800, peakAvg: 34500, lowAvg: 12600 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com 2024-2025実測推計（コンフォートホテル広島大手町参照）',
    notes: 'コンフォートホテル広島大手町 シングル/ツインコンパクト13.0㎡（公式実測）。ホテルグランヴィア広島 スタンダード25㎡・セミダブル18㎡（公式実測）',
  },
  {
    cityKey:  'karuizawa',
    cityName: '軽井沢',
    brand:    'fav',
    areas:    ['観光・リゾート:軽井沢駅周辺・中軽井沢', '観光:旧軽井沢・北軽井沢'],
    roomTypes: [
      { label: 'シングル',     sqmMin: 13, sqmMax: 16, annualAvgADR: 16000, weekdayAvg: 11000, weekendAvg: 22000, peakAvg: 35000, lowAvg:  8500 },
      { label: 'セミダブル',   sqmMin: 16, sqmMax: 19, annualAvgADR: 19000, weekdayAvg: 13000, weekendAvg: 26500, peakAvg: 42000, lowAvg: 10000 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 26000, weekdayAvg: 17500, weekendAvg: 36500, peakAvg: 58000, lowAvg: 13500 },
      { label: 'スーペリア',   sqmMin: 28, sqmMax: 40, annualAvgADR: 36000, weekdayAvg: 24000, weekendAvg: 50000, peakAvg: 80000, lowAvg: 18500 },
    ],
    source: '楽天トラベル・じゃらんnet・一休.com 2024-2025実測推計（軽井沢エリアビジネス・リゾートホテル相場）',
    notes: 'リゾートエリアのため平日/週末差・季節差が全国最大級。夏(7-8月)・秋(9-10月)・GWが超繁忙期。閑散期は1月・2月・梅雨',
  },
  // ── 東京追加エリア ──────────────────────────────────────────────────────────
  {
    cityKey:  'ikebukuro',
    cityName: '池袋',
    brand:    'fav',
    areas:    ['観光:サンシャインシティ周辺・池袋西口公園', '商業:池袋駅周辺・東池袋'],
    roomTypes: [
      { label: 'シングル',       sqmMin: 13, sqmMax: 16, annualAvgADR: 11500, weekdayAvg: 10000, weekendAvg: 13500, peakAvg: 18000, lowAvg:  7500 },
      { label: 'セミダブル',     sqmMin: 16, sqmMax: 19, annualAvgADR: 12800, weekdayAvg: 11200, weekendAvg: 15000, peakAvg: 20000, lowAvg:  8500 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 15500, weekdayAvg: 13500, weekendAvg: 18000, peakAvg: 25000, lowAvg: 10000 },
      { label: 'スーペリア',     sqmMin: 28, sqmMax: 40, annualAvgADR: 19000, weekdayAvg: 16500, weekendAvg: 22000, peakAvg: 30000, lowAvg: 12000 },
    ],
    source: '楽天トラベル・じゃらんnet・ルートイン公式・観光庁宿泊旅行統計2025（参照：ホテルルートイン東京池袋・東横INN池袋北口・ホテルメトロポリタン池袋）',
    notes: '参考baseADR ¥12,500。ルートイン池袋の実測室面積：シングル13㎡／ツイン19.5㎡。東京ビジネスホテルADR2025年実績¥13,000〜¥15,800。GW・年末年始ピーク倍率：平均の約1.5〜1.8倍。閑散期（1月中旬〜2月・梅雨期）：平均比▲30〜35%',
  },
  {
    cityKey:  'ueno',
    cityName: '上野',
    brand:    'fav',
    areas:    ['観光:上野公園・浅草・秋葉原エリア', '商業:上野駅周辺・御徒町'],
    roomTypes: [
      { label: 'シングル',       sqmMin: 13, sqmMax: 16, annualAvgADR: 10800, weekdayAvg:  9500, weekendAvg: 12800, peakAvg: 17000, lowAvg:  7000 },
      { label: 'セミダブル',     sqmMin: 16, sqmMax: 19, annualAvgADR: 12000, weekdayAvg: 10500, weekendAvg: 14200, peakAvg: 19000, lowAvg:  8000 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 14500, weekdayAvg: 12500, weekendAvg: 17000, peakAvg: 23000, lowAvg:  9500 },
      { label: 'スーペリア',     sqmMin: 28, sqmMax: 40, annualAvgADR: 18000, weekdayAvg: 15500, weekendAvg: 21000, peakAvg: 28000, lowAvg: 11500 },
    ],
    source: '楽天トラベル・じゃらんnet・アパホテル上野公式・価格.com・観光庁宿泊旅行統計2025（参照：上野エクセルホテル東急・アパホテル上野・東横INN上野）',
    notes: '参考baseADR ¥12,000。上野・中野エリア相場¥12,000〜¥15,000。アパホテル上野実績¥8,826〜¥28,440。インバウンド（浅草・秋葉原近接）が週末・観光シーズンに需要を押し上げ。上野公園の桜シーズン（3月下旬〜4月上旬）は特異的に高騰',
  },
  {
    cityKey:  'shinagawa',
    cityName: '品川',
    brand:    'fav',
    areas:    ['商業:品川駅周辺・港南口・品川インターシティ'],
    roomTypes: [
      { label: 'シングル',       sqmMin: 13, sqmMax: 16, annualAvgADR: 13000, weekdayAvg: 12000, weekendAvg: 14500, peakAvg: 20000, lowAvg:  8500 },
      { label: 'セミダブル',     sqmMin: 16, sqmMax: 19, annualAvgADR: 14500, weekdayAvg: 13500, weekendAvg: 16000, peakAvg: 22000, lowAvg:  9500 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 17500, weekdayAvg: 16000, weekendAvg: 20000, peakAvg: 27000, lowAvg: 11000 },
      { label: 'スーペリア',     sqmMin: 28, sqmMax: 40, annualAvgADR: 22000, weekdayAvg: 20000, weekendAvg: 25000, peakAvg: 33000, lowAvg: 14000 },
    ],
    source: '楽天トラベル・じゃらんnet・価格.com・インヴィンシブル投資法人（マイステイズ五反田参照）・観光庁宿泊旅行統計2025（参照：品川プリンスホテル・コンフォートホテル品川・東横INN品川）',
    notes: '参考baseADR ¥14,000。マイステイズ五反田ADR ¥15,559・稼働率94.1%（2026年Q1）。品川は純ビジネスエリア。平日需要が強く週末プレミアムは他エリアより小さい（+20〜25%）。東横INN品川高輪口：ダブル11㎡。3月（年度末）・9〜11月（秋の出張・学会）が実質的繁忙期',
  },
  // ── 福岡追加エリア ──────────────────────────────────────────────────────────
  {
    cityKey:  'tenjin',
    cityName: '天神',
    brand:    'fav',
    areas:    ['観光:天神・大名・薬院', '商業:天神地下街・渡辺通'],
    roomTypes: [
      { label: 'シングル',       sqmMin: 13, sqmMax: 16, annualAvgADR: 11500, weekdayAvg: 10000, weekendAvg: 13500, peakAvg: 18500, lowAvg:  7000 },
      { label: 'セミダブル',     sqmMin: 16, sqmMax: 19, annualAvgADR: 12800, weekdayAvg: 11200, weekendAvg: 15000, peakAvg: 20500, lowAvg:  8000 },
      { label: 'ツイン・ダブル', sqmMin: 20, sqmMax: 28, annualAvgADR: 15500, weekdayAvg: 13500, weekendAvg: 18000, peakAvg: 25000, lowAvg:  9500 },
      { label: 'スーペリア',     sqmMin: 28, sqmMax: 40, annualAvgADR: 19000, weekdayAvg: 16500, weekendAvg: 22000, peakAvg: 30000, lowAvg: 11500 },
    ],
    source: '楽天トラベル・じゃらんnet・インヴィンシブル投資法人（マイステイズ福岡天神/天神南実績）・観光庁宿泊旅行統計2025（参照：ソラリア西鉄ホテル福岡・西鉄グランドホテル・ホテルクルー天神）',
    notes: '参考baseADR ¥12,000。マイステイズ福岡天神ADR ¥15,210・OCC 93.5%（2026年Q1）、天神南ADR ¥14,661・OCC 90.9%。ザ・ワンファイブ福岡天神ADR ¥14,571・OCC 88%（2025年実績）。福岡天神はインバウンド（韓国・台湾・中国）が週末を押し上げ。繁忙期：GW・博多山笠（7月）・秋観光シーズン・年末',
  },
];

// ─── FAV LUX 都市×室面積ADRテーブル ─────────────────────────────────────────

export const FAV_LUX_CITY_ROOM_ADR: CityRoomADR[] = [
  // ── 東京エリア ──────────────────────────────────────────────────────────
  {
    cityKey:  'lux_shinjuku',
    cityName: '新宿（上質）',
    brand:    'fav_lux',
    areas:    ['商業:西新宿・新宿駅周辺', '観光・商業:新宿御苑エリア'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax: 42, annualAvgADR:  42000, weekdayAvg:  35000, weekendAvg:  52000, peakAvg:  82000, lowAvg:  26000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax: 60, annualAvgADR:  60000, weekdayAvg:  50000, weekendAvg:  76000, peakAvg: 118000, lowAvg:  37000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax: 90, annualAvgADR:  92000, weekdayAvg:  76000, weekendAvg: 116000, peakAvg: 180000, lowAvg:  57000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 210000, weekdayAvg: 175000, weekendAvg: 265000, peakAvg: 415000, lowAvg: 130000 },
    ],
    source: 'ハイアットリージェンシー東京・ヒルトン東京・京王プラザホテル 公式料金・一休.com実測推計 2024-2025',
    notes: 'ハイアットリージェンシー東京 スタンダード28㎡・ビューデラックス48㎡・スイート71-115㎡（Hyatt公式実測）。ヒルトン東京 スタンダード28㎡・デラックス30-32㎡（Hilton公式実測）',
  },
  {
    cityKey:  'lux_ginza',
    cityName: '銀座（上質）',
    brand:    'fav_lux',
    areas:    ['商業・観光:銀座・有楽町', '商業:汐留・新橋エリア'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax: 42, annualAvgADR:  62000, weekdayAvg:  52000, weekendAvg:  78000, peakAvg: 122000, lowAvg:  38000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax: 60, annualAvgADR:  88000, weekdayAvg:  74000, weekendAvg: 112000, peakAvg: 175000, lowAvg:  54000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax: 90, annualAvgADR: 135000, weekdayAvg: 113000, weekendAvg: 172000, peakAvg: 268000, lowAvg:  83000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 320000, weekdayAvg: 268000, weekendAvg: 405000, peakAvg: 630000, lowAvg: 198000 },
    ],
    source: 'コンラッド東京 公式・Hilton公式料金・一休.com実測推計 2024-2025',
    notes: 'コンラッド東京 全室48㎡以上・スタンダード48㎡・スイート226㎡（Hilton公式実測）。東京最高水準の客室面積',
  },
  {
    cityKey:  'lux_shibuya',
    cityName: '渋谷（上質）',
    brand:    'fav_lux',
    areas:    ['商業・観光:渋谷・表参道', '商業:恵比寿・代官山'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax: 42, annualAvgADR:  52000, weekdayAvg:  43500, weekendAvg:  65500, peakAvg: 102000, lowAvg:  32000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax: 60, annualAvgADR:  74000, weekdayAvg:  62000, weekendAvg:  93500, peakAvg: 146000, lowAvg:  46000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax: 90, annualAvgADR: 112000, weekdayAvg:  94000, weekendAvg: 142000, peakAvg: 221000, lowAvg:  69000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 260000, weekdayAvg: 218000, weekendAvg: 329000, peakAvg: 514000, lowAvg: 161000 },
    ],
    source: 'セルリアンタワー東急ホテル・一休.com実測推計 2024-2025',
    notes: 'セルリアンタワー東急 スーペリア37.6㎡・デラックス42.6-49.2㎡・ジュニアスイート59.9㎡・スイート233.3㎡（東急公式実測）',
  },
  {
    cityKey:  'lux_yokohama',
    cityName: '横浜（上質）',
    brand:    'fav_lux',
    areas:    ['観光・商業:みなとみらい・横浜駅', '観光:山下公園・中華街'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax: 42, annualAvgADR:  38000, weekdayAvg:  31800, weekendAvg:  48000, peakAvg:  75000, lowAvg:  23500 },
      { label: 'デラックス',       sqmMin: 42, sqmMax: 60, annualAvgADR:  54000, weekdayAvg:  45200, weekendAvg:  68200, peakAvg: 107000, lowAvg:  33500 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax: 90, annualAvgADR:  82000, weekdayAvg:  68600, weekendAvg: 103700, peakAvg: 162000, lowAvg:  51000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 190000, weekdayAvg: 159000, weekendAvg: 240000, peakAvg: 375000, lowAvg: 118000 },
    ],
    source: 'じゃらんnet・一休.com・楽天トラベル実測推計 2024-2025（横浜みなとみらい上質ホテル市場）',
  },
  // ── 関西エリア ──────────────────────────────────────────────────────────
  {
    cityKey:  'lux_osaka',
    cityName: '大阪（上質）',
    brand:    'fav_lux',
    areas:    ['観光・商業:難波・心斎橋', '商業:梅田・中之島・本町'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax: 42, annualAvgADR:  72000, weekdayAvg:  60000, weekendAvg:  88000, peakAvg: 140000, lowAvg:  42000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax: 60, annualAvgADR: 100000, weekdayAvg:  84000, weekendAvg: 125000, peakAvg: 195000, lowAvg:  60000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax: 90, annualAvgADR: 155000, weekdayAvg: 130000, weekendAvg: 195000, peakAvg: 300000, lowAvg:  95000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 350000, weekdayAvg: 280000, weekendAvg: 430000, peakAvg: 750000, lowAvg: 200000 },
    ],
    source: '楽天トラベル・じゃらんnet・一休.com実測推計、セントレジス/コンラッド/ウェスティン公開料金、大阪万博ADR調査参照 2024-2025',
    notes: 'コンラッド大阪 全室50㎡以上・デラックス50㎡・スイート100-220㎡（Hilton公式実測）。セントレジス大阪 デラックス43㎡・スイート87-197㎡（Marriott公式実測）。大阪万博期間(4-10月)ADR+46%を加重平均に反映',
  },
  {
    cityKey:  'lux_kyoto',
    cityName: '京都（上質）',
    brand:    'fav_lux',
    areas:    ['観光:祇園・東山・岡崎', '商業:京都駅・烏丸御池・二条'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax: 42, annualAvgADR:  80000, weekdayAvg:  65000, weekendAvg: 100000, peakAvg: 170000, lowAvg:  48000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax: 60, annualAvgADR: 145000, weekdayAvg: 120000, weekendAvg: 180000, peakAvg: 300000, lowAvg:  85000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax: 90, annualAvgADR: 220000, weekdayAvg: 185000, weekendAvg: 275000, peakAvg: 460000, lowAvg: 130000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 480000, weekdayAvg: 390000, weekendAvg: 600000, peakAvg: 1100000, lowAvg: 270000 },
    ],
    source: '楽天トラベル・じゃらんnet・一休.com実測推計、リッツカールトン/フォーシーズンズ/ウェスティン都公開料金、京都市観光協会データ年報2024参照',
    notes: 'リッツカールトン京都 デラックス45㎡・全室平均50㎡（公式実測）。フォーシーズンズ京都 デラックス49-53㎡・スイート98-245㎡（公式実測）。桜(3-4月)・紅葉(11月)ピーク週末はスイートで¥110万超',
  },
  // ── 九州・沖縄エリア ────────────────────────────────────────────────────
  {
    cityKey:  'lux_hakata',
    cityName: '博多（上質）',
    brand:    'fav_lux',
    areas:    ['商業:博多駅周辺', '観光・商業:中洲・天神・ウォーターフロント'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax: 42, annualAvgADR:  35000, weekdayAvg:  29200, weekendAvg:  44200, peakAvg:  68000, lowAvg:  21600 },
      { label: 'デラックス',       sqmMin: 42, sqmMax: 60, annualAvgADR:  50000, weekdayAvg:  41800, weekendAvg:  63200, peakAvg:  97000, lowAvg:  31000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax: 90, annualAvgADR:  76000, weekdayAvg:  63600, weekendAvg:  96100, peakAvg: 148000, lowAvg:  47000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 175000, weekdayAvg: 146000, weekendAvg: 221000, peakAvg: 340000, lowAvg: 108000 },
    ],
    source: 'グランドハイアット福岡・ヒルトン福岡シーホーク 公式料金・一休.com実測推計 2024-2025',
    notes: 'グランドハイアット福岡 スタンダード27-34㎡・デラックス34-45㎡・スイート52-188㎡（Hyatt公式実測）。ヒルトン福岡シーホーク スタンダード23-31㎡・デラックス34-41㎡（公式実測）',
  },
  {
    cityKey:  'lux_naha',
    cityName: '那覇（上質）',
    brand:    'fav_lux',
    areas:    ['観光・商業:国際通り・那覇市内', 'リゾート:ハーバービュー・離島アクセス'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax: 42, annualAvgADR:  45000, weekdayAvg:  36500, weekendAvg:  57500, peakAvg:  90000, lowAvg:  28000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax: 60, annualAvgADR:  65000, weekdayAvg:  52800, weekendAvg:  82900, peakAvg: 130000, lowAvg:  40500 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax: 90, annualAvgADR:  99000, weekdayAvg:  80400, weekendAvg: 126300, peakAvg: 198000, lowAvg:  61500 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 235000, weekdayAvg: 190700, weekendAvg: 299500, peakAvg: 470000, lowAvg: 146000 },
    ],
    source: 'じゃらんnet・一休.com・楽天トラベル実測推計 2024-2025（那覇市内上質ホテル市場）',
    notes: '夏季(7-8月)・GW・年末年始が超繁忙期。那覇市内上質ホテルはリゾート性が加わりADRが九州主要都市比+25-30%高水準',
  },
  // ── 北日本・中部エリア ───────────────────────────────────────────────────
  {
    cityKey:  'lux_sapporo',
    cityName: '札幌（上質）',
    brand:    'fav_lux',
    areas:    ['観光・商業:大通公園・すすきの', '商業:札幌駅エリア'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax: 42, annualAvgADR:  30000, weekdayAvg:  25100, weekendAvg:  38000, peakAvg:  58000, lowAvg:  18600 },
      { label: 'デラックス',       sqmMin: 42, sqmMax: 60, annualAvgADR:  43000, weekdayAvg:  35900, weekendAvg:  54500, peakAvg:  83500, lowAvg:  26700 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax: 90, annualAvgADR:  65000, weekdayAvg:  54300, weekendAvg:  82300, peakAvg: 126000, lowAvg:  40300 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 152000, weekdayAvg: 127000, weekendAvg: 192000, peakAvg: 295000, lowAvg:  94000 },
    ],
    source: '札幌グランドホテル・ホテルモントレエーデルホフ札幌 公式料金・一休.com実測推計 2024-2025',
    notes: '札幌グランドホテル スタンダードシングル21㎡・コーナーデラックスツイン62㎡・スーパースイート162㎡（公式実測）。ホテルモントレエーデルホフ スイート44-64㎡（Yahoo!トラベル実測）。センチュリーロイヤルホテル札幌は2024年5月閉館済み',
  },
  {
    cityKey:  'lux_kanazawa',
    cityName: '金沢（上質）',
    brand:    'fav_lux',
    areas:    ['観光:兼六園・東茶屋街・金沢城', '商業:金沢駅周辺'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax: 42, annualAvgADR:  35000, weekdayAvg:  29200, weekendAvg:  44200, peakAvg:  68000, lowAvg:  21600 },
      { label: 'デラックス',       sqmMin: 42, sqmMax: 60, annualAvgADR:  50000, weekdayAvg:  41800, weekendAvg:  63200, peakAvg:  97000, lowAvg:  31000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax: 90, annualAvgADR:  76000, weekdayAvg:  63600, weekendAvg:  96100, peakAvg: 148000, lowAvg:  47000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 180000, weekdayAvg: 150400, weekendAvg: 227700, peakAvg: 350000, lowAvg: 112000 },
    ],
    source: 'ANAクラウンプラザホテル金沢・金沢白鳥路ホテル山楽・金沢東急ホテル 公式料金・一休.com実測推計 2024-2025',
    notes: 'ANAクラウンプラザ金沢 スタンダード17.3-19.5㎡・プレミアムツイン32.6㎡・デラックスコーナー42.7㎡（公式実測）。金沢白鳥路山楽 全室30㎡以上・ツイン40㎡（公式実測）。北陸新幹線延伸でインバウンド需要急増',
  },
  {
    cityKey:  'lux_nagoya',
    cityName: '名古屋（上質）',
    brand:    'fav_lux',
    areas:    ['商業:名古屋駅周辺', '商業・観光:栄・錦'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax: 42, annualAvgADR:  40000, weekdayAvg:  33500, weekendAvg:  50600, peakAvg:  78000, lowAvg:  24800 },
      { label: 'デラックス',       sqmMin: 42, sqmMax: 60, annualAvgADR:  57000, weekdayAvg:  47700, weekendAvg:  72200, peakAvg: 111000, lowAvg:  35300 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax: 90, annualAvgADR:  87000, weekdayAvg:  72700, weekendAvg: 110000, peakAvg: 170000, lowAvg:  54000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 200000, weekdayAvg: 167200, weekendAvg: 253200, peakAvg: 390000, lowAvg: 124000 },
    ],
    source: 'ヒルトン名古屋・名古屋マリオットアソシアホテル・ANAクラウンプラザグランコート名古屋 公式料金・一休.com実測推計 2024-2025',
    notes: 'ヒルトン名古屋 全スタンダード30㎡（公式実測）。名古屋マリオットアソシア スタンダードツイン35㎡・ジュニアスイート55㎡・スイート83-202㎡（公式実測）。ANAクラウンプラザグランコート スタンダード24㎡以上・デラックス37㎡（公式実測）',
  },
  {
    cityKey:  'lux_hiroshima',
    cityName: '広島（上質）',
    brand:    'fav_lux',
    areas:    ['観光・商業:広島駅周辺', '観光:平和公園・宮島アクセス'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax: 42, annualAvgADR:  32000, weekdayAvg:  26700, weekendAvg:  40500, peakAvg:  62000, lowAvg:  19800 },
      { label: 'デラックス',       sqmMin: 42, sqmMax: 60, annualAvgADR:  46000, weekdayAvg:  38400, weekendAvg:  58200, peakAvg:  89000, lowAvg:  28500 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax: 90, annualAvgADR:  70000, weekdayAvg:  58500, weekendAvg:  88600, peakAvg: 136000, lowAvg:  43400 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 162000, weekdayAvg: 135400, weekendAvg: 205000, peakAvg: 315000, lowAvg: 100000 },
    ],
    source: 'シェラトングランドホテル広島・リーガロイヤルホテル広島・グランドプリンスホテル広島 公式料金・一休.com実測推計 2024-2025',
    notes: 'シェラトングランドホテル広島 全室35㎡以上・デラックスキング35㎡（近畿ツーリスト実測）。リーガロイヤル広島 スタンダードダブル31㎡・ツイン平均35㎡（公式実測）。グランドプリンス広島 スタンダードツイン23㎡・スイート107-159㎡（公式実測）',
  },
  {
    cityKey:  'lux_karuizawa',
    cityName: '軽井沢（上質）',
    brand:    'fav_lux',
    areas:    ['観光・リゾート:軽井沢・中軽井沢', '観光:旧軽井沢・星野エリア'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax: 42, annualAvgADR:  70000, weekdayAvg:  47500, weekendAvg:  96000, peakAvg: 160000, lowAvg:  38000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax: 60, annualAvgADR: 100000, weekdayAvg:  68000, weekendAvg: 137500, peakAvg: 229000, lowAvg:  54500 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax: 90, annualAvgADR: 152000, weekdayAvg: 103400, weekendAvg: 209000, peakAvg: 348000, lowAvg:  83000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 350000, weekdayAvg: 238000, weekendAvg: 481400, peakAvg: 800000, lowAvg: 191000 },
    ],
    source: 'じゃらんnet・一休.com・楽天トラベル実測推計 2024-2025（軽井沢エリア上質リゾートホテル市場）',
    notes: 'リゾート地特性で平日/週末差・季節差が全国最大級。夏(7-8月)・秋(9-10月)・GWが超繁忙期。週末ADR/平日ADR比率≈2.0と突出',
  },
  // ── 東京追加エリア（上質） ────────────────────────────────────────────────
  {
    cityKey:  'lux_ikebukuro',
    cityName: '池袋（上質）',
    brand:    'fav_lux',
    areas:    ['商業:池袋駅周辺・東池袋', '観光:サンシャインシティ・池袋西口公園'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax:  42, annualAvgADR:  22000, weekdayAvg:  19500, weekendAvg:  26000, peakAvg:  34000, lowAvg:  15000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax:  60, annualAvgADR:  29000, weekdayAvg:  26000, weekendAvg:  34000, peakAvg:  46000, lowAvg:  20000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax:  90, annualAvgADR:  42000, weekdayAvg:  37000, weekendAvg:  50000, peakAvg:  68000, lowAvg:  28000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR:  65000, weekdayAvg:  57000, weekendAvg:  78000, peakAvg: 110000, lowAvg:  42000 },
    ],
    source: '一休.com・じゃらんnet・楽天トラベル実測推計 2024-2025（参照：ホテルメトロポリタン池袋、東京ホテル会月次ADRデータ）',
    notes: 'ホテルメトロポリタン池袋スタンダード実測最低¥18,300/2名（2025年参照）。東京ホテル会2024年12月ADR ¥19,028（全カテゴリ混合）。池袋エリアは品川・新宿比で10〜15%下方。スイートはメトロポリタン130㎡・和洋スイート45㎡が上限参照',
  },
  {
    cityKey:  'lux_ueno',
    cityName: '上野（上質）',
    brand:    'fav_lux',
    areas:    ['観光:上野公園・東京国立博物館', '商業:御徒町・台東区'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax:  42, annualAvgADR:  21000, weekdayAvg:  18500, weekendAvg:  25000, peakAvg:  35000, lowAvg:  14000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax:  60, annualAvgADR:  27000, weekdayAvg:  24000, weekendAvg:  32000, peakAvg:  46000, lowAvg:  18000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax:  90, annualAvgADR:  40000, weekdayAvg:  35000, weekendAvg:  48000, peakAvg:  68000, lowAvg:  26000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR:  60000, weekdayAvg:  52000, weekendAvg:  72000, peakAvg: 105000, lowAvg:  38000 },
    ],
    source: '一休.com・じゃらんnet・楽天トラベル実測推計 2024-2025（参照：NOHGA HOTEL UENO TOKYO、東京ホテル会月次ADRデータ）',
    notes: 'NOHGA HOTEL UENOデラックス26㎡実測最低¥19,845（1名）。NOHGAスイート64㎡ ¥60,846〜（2名税込）。上野公園の桜シーズン（3/25〜4/15）は東京屈指のピーク。浅草・秋葉原インバウンド需要が通年旺盛',
  },
  {
    cityKey:  'lux_shinagawa',
    cityName: '品川（上質）',
    brand:    'fav_lux',
    areas:    ['商業:品川駅周辺・港南', '観光:高輪・泉岳寺'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax:  42, annualAvgADR:  26000, weekdayAvg:  24000, weekendAvg:  30000, peakAvg:  40000, lowAvg:  17000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax:  60, annualAvgADR:  35000, weekdayAvg:  32000, weekendAvg:  41000, peakAvg:  55000, lowAvg:  23000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax:  90, annualAvgADR:  52000, weekdayAvg:  46000, weekendAvg:  62000, peakAvg:  85000, lowAvg:  34000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR:  82000, weekdayAvg:  72000, weekendAvg:  98000, peakAvg: 140000, lowAvg:  52000 },
    ],
    source: '一休.com・じゃらんnet・IHG公式実測推計 2024-2025（参照：ストリングスホテル東京インターコンチネンタル、品川プリンスホテル、グランドプリンスホテル高輪）',
    notes: 'ストリングスホテル東京IHG クラシック23-31㎡・プレミアム32-38㎡・クラブ35-40㎡・スイート70㎡の実測室面積確認。公示最低料金¥49,200〜（2名税込素泊）→1名換算¥24,600（2025年参照）。品川プリンスホテルスタンダード21㎡ ¥19,124〜。ビジネス平日需要（法人コーポレートレート）が安定',
  },
  // ── 関西追加エリア（上質） ───────────────────────────────────────────────
  {
    cityKey:  'lux_kobe',
    cityName: '神戸（上質）',
    brand:    'fav_lux',
    areas:    ['観光:北野異人館・旧居留地', '商業:三宮・神戸駅周辺・ポートアイランド'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax:  42, annualAvgADR:  21000, weekdayAvg:  18500, weekendAvg:  25000, peakAvg:  34000, lowAvg:  13000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax:  60, annualAvgADR:  28000, weekdayAvg:  25000, weekendAvg:  33000, peakAvg:  46000, lowAvg:  18000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax:  90, annualAvgADR:  42000, weekdayAvg:  37000, weekendAvg:  50000, peakAvg:  70000, lowAvg:  27000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR:  70000, weekdayAvg:  62000, weekendAvg:  84000, peakAvg: 120000, lowAvg:  45000 },
    ],
    source: '一休.com・じゃらんnet・楽天トラベル実測推計 2024-2025（参照：THE ORIENT神戸/旧オリエンタルホテル、神戸ポートピアホテル、神戸北野ホテル、神戸メリケンパークOH）',
    notes: 'THE ORIENT（旧オリエンタルホテル神戸）デラックス41.91㎡ ¥65,000〜（2名）実測値。神戸北野ホテルスタンダードツイン30㎡ 朝食付¥57,600〜（2名）。神戸ポートピアホテル：スタンダード27.4㎡・デラックス43.1㎡・スイート最大137.8㎡確認。繁忙期：神戸ルミナリエ（12月）・桜（4月）・GW',
  },
  {
    cityKey:  'lux_nara',
    cityName: '奈良（上質）',
    brand:    'fav_lux',
    areas:    ['観光:奈良公園・東大寺・春日大社', '商業:近鉄奈良駅周辺・三条通'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax:  42, annualAvgADR:  22000, weekdayAvg:  18000, weekendAvg:  28000, peakAvg:  42000, lowAvg:  12000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax:  60, annualAvgADR:  30000, weekdayAvg:  25000, weekendAvg:  37000, peakAvg:  58000, lowAvg:  16000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax:  90, annualAvgADR:  45000, weekdayAvg:  38000, weekendAvg:  55000, peakAvg:  85000, lowAvg:  27000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR:  75000, weekdayAvg:  63000, weekendAvg:  92000, peakAvg: 145000, lowAvg:  44000 },
    ],
    source: '一休.com・楽天トラベル・Marriott公式実測推計 2024-2025（参照：JWマリオット・ホテル奈良、奈良ホテル、ホテルフジタ奈良）',
    notes: 'JWマリオット奈良デラックス36㎡ ¥40,000〜（1名）、エグゼクティブスイート92㎡ ¥90,000〜確認。奈良ホテルスタンダード21.8㎡ 素泊¥32,400〜（2名）・デラックス34-39㎡・インペリアルスイート87㎡確認。奈良は観光シーズン集中型（桜4月・紅葉11月）。ピーク週末はADRが年平均の1.9〜2.0倍',
  },
  // ── 北日本追加エリア（上質） ─────────────────────────────────────────────
  {
    cityKey:  'lux_sendai',
    cityName: '仙台（上質）',
    brand:    'fav_lux',
    areas:    ['観光:松島・仙台城跡・定禅寺通', '商業:仙台駅周辺・一番町'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax:  42, annualAvgADR:  22000, weekdayAvg:  19500, weekendAvg:  26000, peakAvg:  36000, lowAvg:  14500 },
      { label: 'デラックス',       sqmMin: 42, sqmMax:  60, annualAvgADR:  30000, weekdayAvg:  26500, weekendAvg:  35500, peakAvg:  50000, lowAvg:  20000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax:  90, annualAvgADR:  58000, weekdayAvg:  51000, weekendAvg:  68000, peakAvg:  98000, lowAvg:  38000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 120000, weekdayAvg: 105000, weekendAvg: 140000, peakAvg: 210000, lowAvg:  80000 },
    ],
    source: '一休.com・じゃらんnet・ウェスティンホテル仙台公式サイト実測推計 2024-2025（参照：ウェスティンホテル仙台、仙台ロイヤルパークホテル、ANAクラウンプラザホテル仙台）',
    notes: 'ウェスティン仙台公式室面積：モデレート30㎡・スーペリア42㎡・デラックス44㎡・プレミア48㎡・コーナースイート67㎡・デラックススイート83㎡・プレジデンシャル125㎡。じゃらん掲載：モデレート¥24,200〜・コーナースイート¥99,220〜・プレジデンシャル¥204,490〜（2名合計税込）。繁忙期：桜（4月）・七夕（8月）・GW・年末年始',
  },
  {
    cityKey:  'lux_hakodate',
    cityName: '函館（上質）',
    brand:    'fav_lux',
    areas:    ['観光:函館山・元町・ベイエリア', '商業:函館駅周辺'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax:  42, annualAvgADR:  20000, weekdayAvg:  17000, weekendAvg:  24000, peakAvg:  36000, lowAvg:  13000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax:  60, annualAvgADR:  28000, weekdayAvg:  24000, weekendAvg:  33000, peakAvg:  50000, lowAvg:  18000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax:  90, annualAvgADR:  48000, weekdayAvg:  42000, weekendAvg:  57000, peakAvg:  84000, lowAvg:  31000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 100000, weekdayAvg:  86000, weekendAvg: 118000, peakAvg: 186000, lowAvg:  65000 },
    ],
    source: '一休.com・楽天トラベル・ラビスタ函館ベイ公式・センチュリーマリーナ函館実測推計 2024-2025（参照：函館国際ホテル、ラビスタ函館ベイ、センチュリーマリーナ函館）',
    notes: 'ラビスタ函館ベイ公式室面積：スタンダードツイン25㎡・デラックスツイン34㎡・特別室43㎡（本館）・ANNEX特別室59㎡（露天風呂付）。ラビスタ2名合計料金レンジ¥15,700〜¥79,200（じゃらん）。センチュリーマリーナ函館¥17,600〜¥235,000（2名）。函館最盛期は7〜9月（夜景・函館山）と年末年始',
  },
  // ── 福岡追加エリア（上質） ────────────────────────────────────────────────
  {
    cityKey:  'lux_tenjin',
    cityName: '天神（上質）',
    brand:    'fav_lux',
    areas:    ['観光:天神・大名・清川', '商業:天神地下街・渡辺通・薬院'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax:  42, annualAvgADR:  26000, weekdayAvg:  23000, weekendAvg:  31000, peakAvg:  45000, lowAvg:  17000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax:  60, annualAvgADR:  38000, weekdayAvg:  33000, weekendAvg:  45000, peakAvg:  65000, lowAvg:  25000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax:  90, annualAvgADR:  65000, weekdayAvg:  56000, weekendAvg:  77000, peakAvg: 110000, lowAvg:  43000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 130000, weekdayAvg: 112000, weekendAvg: 152000, peakAvg: 240000, lowAvg:  85000 },
    ],
    source: '一休.com・楽天トラベル・ホテルオークラ福岡公式実測推計 2024-2025（参照：ホテルオークラ福岡、ザ・ロイヤルパークホテル福岡天神、ANAクラウンプラザホテル福岡）',
    notes: 'ホテルオークラ福岡公式室面積：コンパクトダブル22㎡・スタンダード25〜28㎡・デラックスダブル47㎡・コーナーデラックス51㎡・和室スイート65-70㎡・コーナースイート85㎡・ロイヤルスイート202㎡。一休掲載最低：スタンダードダブル¥25,000〜（2名税込）。天神エリアはGW・年末年始の繁忙係数1.7〜2.0倍',
  },
  // ── 九州追加エリア（上質） ────────────────────────────────────────────────
  {
    cityKey:  'lux_kumamoto',
    cityName: '熊本（上質）',
    brand:    'fav_lux',
    areas:    ['観光:熊本城・水前寺', '商業:熊本駅・上通・下通アーケード'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax:  42, annualAvgADR:  21000, weekdayAvg:  18500, weekendAvg:  25000, peakAvg:  37000, lowAvg:  14000 },
      { label: 'デラックス',       sqmMin: 42, sqmMax:  60, annualAvgADR:  30000, weekdayAvg:  26000, weekendAvg:  36000, peakAvg:  52000, lowAvg:  20000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax:  90, annualAvgADR:  52000, weekdayAvg:  45000, weekendAvg:  62000, peakAvg:  90000, lowAvg:  34000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 105000, weekdayAvg:  90000, weekendAvg: 123000, peakAvg: 190000, lowAvg:  68000 },
    ],
    source: '一休.com・じゃらんnet・熊本ホテルキャッスル公式実測推計 2024-2025（参照：ANAクラウンプラザホテル熊本ニュースカイ、熊本ホテルキャッスル）',
    notes: '熊本ホテルキャッスル公式室面積：エグゼクティブジュニアスイート51㎡・エグゼクティブスイート72.64㎡・ロイヤルスイート93.46㎡確認。ANAクラウンプラザ熊本スタンダードシングル¥11,580〜・スタンダードツイン¥12,080〜（2名税込）。繁忙期：熊本城さくら祭り（3〜4月）・GW・年末年始で1.5〜1.8倍推計',
  },
  {
    cityKey:  'lux_kagoshima',
    cityName: '鹿児島（上質）',
    brand:    'fav_lux',
    areas:    ['観光:城山・磯庭園・桜島', '商業:天文館・鹿児島中央駅'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax:  42, annualAvgADR:  19000, weekdayAvg:  16500, weekendAvg:  23000, peakAvg:  34000, lowAvg:  12500 },
      { label: 'デラックス',       sqmMin: 42, sqmMax:  60, annualAvgADR:  30000, weekdayAvg:  26000, weekendAvg:  36000, peakAvg:  54000, lowAvg:  19500 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax:  90, annualAvgADR:  50000, weekdayAvg:  43000, weekendAvg:  59000, peakAvg:  87000, lowAvg:  33000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 100000, weekdayAvg:  86000, weekendAvg: 118000, peakAvg: 186000, lowAvg:  65000 },
    ],
    source: '一休.com・じゃらんnet・城山ホテル鹿児島公式実測推計 2024-2025（参照：城山ホテル鹿児島、かごしま桜島ホテル）',
    notes: '城山ホテル鹿児島（SHIROYAMA HOTEL）公式室面積：スタンダード27㎡・デラックスツイン桜島ビュー53㎡・ジュニアスイート66㎡・ジャパニーズガーデンスイート75㎡・SAKURAJIMAロイヤルスイート126㎡。じゃらん掲載：ジュニアスイート¥66,000〜（1名）・ロイヤルスイート¥126,000〜。繁忙期：桜島マラソン（2月）・GW・お盆・年末年始',
  },
  {
    cityKey:  'lux_nagasaki',
    cityName: '長崎（上質）',
    brand:    'fav_lux',
    areas:    ['観光:グラバー園・出島・稲佐山', '商業:長崎駅周辺・浜町'],
    roomTypes: [
      { label: 'スタンダード',     sqmMin: 28, sqmMax:  42, annualAvgADR:  20000, weekdayAvg:  17000, weekendAvg:  24000, peakAvg:  34000, lowAvg:  12500 },
      { label: 'デラックス',       sqmMin: 42, sqmMax:  60, annualAvgADR:  30000, weekdayAvg:  26000, weekendAvg:  36000, peakAvg:  52000, lowAvg:  19000 },
      { label: 'ジュニアスイート', sqmMin: 60, sqmMax:  90, annualAvgADR:  52000, weekdayAvg:  44000, weekendAvg:  62000, peakAvg:  90000, lowAvg:  33000 },
      { label: 'スイート',         sqmMin: 90, sqmMax: 200, annualAvgADR: 108000, weekdayAvg:  92000, weekendAvg: 126000, peakAvg: 198000, lowAvg:  68000 },
    ],
    source: '一休.com・じゃらんnet・ガーデンテラス長崎公式・ANAクラウンプラザ長崎グラバーヒル実測推計 2024-2025（参照：長崎ホテル清風、ハウステンボス内ホテル群、ANAクラウンプラザホテル長崎グラバーヒル）',
    notes: 'ANAクラウンプラザ長崎グラバーヒル室面積：スタンダードツイン20〜27㎡・スイート81㎡（6F・7F）確認。一休掲載最低：スタンダードツイン¥13,600〜（2名税込）。ガーデンテラス長崎：オーシャンスイート46〜54㎡・タワースイート51〜67㎡・ロイヤルスイート100〜152㎡確認。繁忙期：ランタンフェスティバル（旧正月）・GW・くんち（10月）・年末年始',
  },
];

// ─── ユーティリティ関数 ─────────────────────────────────────────────────

/** cityKeyでFAV競合ホテルを絞り込む */
export function getFAVCompetitorsByCity(cityKey: string): FAVCompetitorHotel[] {
  return FAV_COMPETITOR_HOTELS.filter(h => h.cityKey === cityKey);
}

/** cityKeyでFAV LUX競合ホテルを絞り込む */
export function getFAVLUXCompetitorsByCity(cityKey: string): FAVLUXCompetitorHotel[] {
  return FAV_LUX_COMPETITOR_HOTELS.filter(h => h.cityKey === cityKey);
}

/** cityKeyでSxS競合ホテルを絞り込む */
export function getSxSCompetitorsByCity(cityKey: string): SxSCompetitorHotel[] {
  return SXS_COMPETITOR_HOTELS.filter(h => h.cityKey === cityKey);
}

/** ブランドに対応する競合ホテル群の都市別サマリーを返す */
export function getCompetitorCitySummary(brand: 'fav' | 'fav_lux' | 'seven_x_seven'): {
  cityKey: string;
  cityName: string;
  hotelCount: number;
  avgCompetitorADR: number;
  minADR: number;
  maxADR: number;
}[] {
  let hotels: (FAVCompetitorHotel | FAVLUXCompetitorHotel | SxSCompetitorHotel)[];
  if (brand === 'fav')          hotels = FAV_COMPETITOR_HOTELS;
  else if (brand === 'fav_lux') hotels = FAV_LUX_COMPETITOR_HOTELS;
  else                          hotels = SXS_COMPETITOR_HOTELS;

  const cityMap = new Map<string, { cityName: string; adrs: number[] }>();
  for (const h of hotels) {
    if (!cityMap.has(h.cityKey)) {
      cityMap.set(h.cityKey, { cityName: h.cityName, adrs: [] });
    }
    cityMap.get(h.cityKey)!.adrs.push(h.annualAvgADR);
  }

  return Array.from(cityMap.entries()).map(([cityKey, { cityName, adrs }]) => ({
    cityKey,
    cityName,
    hotelCount: adrs.length,
    avgCompetitorADR: Math.round(adrs.reduce((a, b) => a + b, 0) / adrs.length / 100) * 100,
    minADR: Math.min(...adrs),
    maxADR: Math.max(...adrs),
  }));
}

/** KC ブランドADRと競合ADRの差異（プレミアム/ディスカウント率）を計算 */
export function calcADRPremium(kcADR: number, competitorAvgADR: number): number {
  return Math.round((kcADR / competitorAvgADR - 1) * 1000) / 10; // %
}
