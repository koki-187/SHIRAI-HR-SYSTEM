/**
 * brand-benchmarks.ts
 * 実在ホテルブランドの建築・客室仕様・投資指標ベンチマーク。
 * 霞ヶ関キャピタル（3498）IRデータ・公開情報に基づく（2026年5月時点）。
 * HotelScopeの仕入れ判断・投資シミュレーションの参照値として使用。
 */

export interface RoomSpec {
  type_name: string;      // 客室タイプ名
  size_sqm: number;       // 標準面積（㎡）
  max_occupancy: number;  // 最大定員
  ratio: number;          // 全客室に占める比率（0〜1）
}

export interface BrandBenchmark {
  id: string;
  brand: string;             // ブランド名
  operator: string;          // 運営会社
  category: string;          // ホテルカテゴリ
  target_area: string;       // 主な展開エリア
  concept: string;           // コンセプト
  room_specs: RoomSpec[];    // 客室仕様

  // 財務KPI（REIT実績・IR資料ベース）
  typical_adr_weekday: number;   // 平均ADR（平日）
  typical_adr_weekend: number;   // 平均ADR（休日）
  typical_occ: number;           // 平均稼働率（%）
  typical_revpar: number;        // RevPAR
  gop_ratio: number;             // GOP比率（%）
  breakeven_occ: number;         // 変動費回収稼働率（%）※真の損益分岐は約35〜45%

  // 投資規模（REIT取得価格ベース）
  cost_per_room_min: number;     // 1室あたり最小取得価格（万円）
  cost_per_room_max: number;     // 1室あたり最大取得価格（万円）
  noi_yield_pct: number;         // NOI利回り（%）

  // 標準スペック
  typical_rooms: number;         // 標準客室数（棟単位）
  avg_room_sqm: number;          // 平均客室面積（㎡）
  avg_occupancy_per_room: number; // 平均定員

  // データソース
  source: string;
  last_updated: string;
}

/** 霞ヶ関キャピタル（3498）ブランド一覧 */
export const KASUMIGASEKI_BRANDS: BrandBenchmark[] = [
  {
    id: 'fav',
    brand: 'fav（ファブ）',
    operator: 'fav hospitality group株式会社（霞ヶ関キャピタル子会社）',
    category: 'アパートメントホテル（グループ向け）',
    target_area: '地方主要観光都市（高山・伊勢・熊本・函館・広島・鹿児島）・東京',
    concept: 'グループ旅行特化。キッチン・洗濯機を全室標準装備。セルフホスピタリティ（IoT・非接触）',
    room_specs: [
      { type_name: 'スタジオ（キング）',   size_sqm: 35, max_occupancy: 4, ratio: 0.60 },
      { type_name: 'スタジオ（クイーン）', size_sqm: 38, max_occupancy: 6, ratio: 0.30 },
      { type_name: 'デラックス',          size_sqm: 42, max_occupancy: 6, ratio: 0.10 },
    ],
    typical_adr_weekday: 23000,
    typical_adr_weekend: 31000,
    typical_occ: 82,
    typical_revpar: 20500,
    gop_ratio: 60,
    breakeven_occ: 22,
    cost_per_room_min: 2700,
    cost_per_room_max: 4600,
    noi_yield_pct: 7.5,
    typical_rooms: 40,
    avg_room_sqm: 37,
    avg_occupancy_per_room: 4.5,
    source: '霞ヶ関ホテルリート 月次レポート・取得価格一覧（2026年1月末）',
    last_updated: '2026-05',
  },
  {
    id: 'fav_tokyo',
    brand: 'fav（東京・都市部）',
    operator: 'fav hospitality group株式会社',
    category: 'アパートメントホテル（グループ向け）都市型',
    target_area: '東京23区（荒川・墨田など）',
    concept: '都市型グループステイ。インバウンド対応強化。プレミアム価格帯',
    room_specs: [
      { type_name: 'スタジオ（キング）',   size_sqm: 35, max_occupancy: 4, ratio: 0.70 },
      { type_name: 'デラックスダブル',    size_sqm: 40, max_occupancy: 6, ratio: 0.30 },
    ],
    typical_adr_weekday: 27000,
    typical_adr_weekend: 38000,
    typical_occ: 88,
    typical_revpar: 24000,
    gop_ratio: 60,
    breakeven_occ: 22,
    cost_per_room_min: 7000,
    cost_per_room_max: 8200,
    noi_yield_pct: 5.8,
    typical_rooms: 22,
    avg_room_sqm: 37,
    avg_occupancy_per_room: 4.5,
    source: 'fav東京両国・西日暮里 取得価格データ（霞ヶ関ホテルリート）',
    last_updated: '2026-05',
  },
  {
    id: 'fav_lux',
    brand: 'FAV LUX（ファブラックス）',
    operator: 'fav hospitality group株式会社',
    category: 'アッパーミドル アパートメントホテル',
    target_area: '地方主要観光地（高山・長崎・鹿児島・札幌）',
    concept: 'favの上位版。大浴場・サウナ付き客室。より上質な内装・アメニティ',
    room_specs: [
      { type_name: 'スタジオ（スタンダード）', size_sqm: 38, max_occupancy: 4, ratio: 0.40 },
      { type_name: 'スタジオ（デラックス）',  size_sqm: 45, max_occupancy: 6, ratio: 0.40 },
      { type_name: 'サウナスイート',          size_sqm: 52, max_occupancy: 4, ratio: 0.20 },
    ],
    typical_adr_weekday: 30000,
    typical_adr_weekend: 42000,
    typical_occ: 83,
    typical_revpar: 26000,
    gop_ratio: 60,
    breakeven_occ: 22,
    cost_per_room_min: 4300,
    cost_per_room_max: 6400,
    noi_yield_pct: 6.5,
    typical_rooms: 55,
    avg_room_sqm: 44,
    avg_occupancy_per_room: 4.5,
    source: 'FAV LUX飛騨高山・長崎・鹿児島天文館 取得価格データ（霞ヶ関ホテルリート）',
    last_updated: '2026-05',
  },
  {
    id: 'seven_x_seven',
    brand: 'seven×seven（セブンバイセブン）',
    operator: 'fav hospitality group株式会社',
    category: 'ラグジュアリーリゾート',
    target_area: '国内リゾートエリア（石垣・糸島・由布院）',
    concept: 'ラグジュアリーを遊べ。全室テラス・バルコニー付き。プライベートプール・サウナ。21タイプの多様客室',
    room_specs: [
      { type_name: 'オーシャンビュー（スタンダード）', size_sqm: 60,  max_occupancy: 2, ratio: 0.30 },
      { type_name: 'バルコニースイート',              size_sqm: 90,  max_occupancy: 4, ratio: 0.40 },
      { type_name: 'プールスイート',                  size_sqm: 180, max_occupancy: 6, ratio: 0.20 },
      { type_name: 'ペントハウス',                    size_sqm: 450, max_occupancy: 8, ratio: 0.10 },
    ],
    typical_adr_weekday: 75000,
    typical_adr_weekend: 110000,
    typical_occ: 70,
    typical_revpar: 56000,
    gop_ratio: 55,
    breakeven_occ: 25,
    cost_per_room_min: 11000,
    cost_per_room_max: 15500,
    noi_yield_pct: 5.6,
    typical_rooms: 80,
    avg_room_sqm: 120,
    avg_occupancy_per_room: 3.5,
    source: 'seven×seven石垣（187億円÷121室）・糸島（52.3億円÷47室）取得価格データ',
    last_updated: '2026-05',
  },
  {
    id: 'base_layer',
    brand: 'BASE LAYER HOTEL',
    operator: 'GREENING株式会社（共同運営）',
    category: 'カルチャービジネスホテル（リブランド型）',
    target_area: '都市型（名古屋・福岡）。既存ホテルのリブランド中心',
    concept: '地域文化との融合。カフェ・ランドリー・サウナ付き客室。ビジネス+観光客に対応',
    room_specs: [
      { type_name: 'ダブル（コンパクト）', size_sqm: 12, max_occupancy: 2, ratio: 0.25 },
      { type_name: 'ツイン（スタンダード）', size_sqm: 26, max_occupancy: 2, ratio: 0.40 },
      { type_name: 'キングサウナ',         size_sqm: 20, max_occupancy: 2, ratio: 0.20 },
      { type_name: 'ファミリー',           size_sqm: 38, max_occupancy: 4, ratio: 0.15 },
    ],
    typical_adr_weekday: 15000,
    typical_adr_weekend: 22000,
    typical_occ: 75,
    typical_revpar: 12500,
    gop_ratio: 62,
    breakeven_occ: 25,
    cost_per_room_min: 1500,  // リブランドのため低め
    cost_per_room_max: 3000,
    noi_yield_pct: 8.0,
    typical_rooms: 160,
    avg_room_sqm: 24,
    avg_occupancy_per_room: 2.2,
    source: 'BASE LAYER HOTEL名古屋錦（186室）取材データ・PRTimes',
    last_updated: '2026-05',
  },
];

/** 全ブランド一覧（霞ヶ関キャピタル以外のメジャーブランドも将来追加予定） */
export const ALL_BRAND_BENCHMARKS: BrandBenchmark[] = [
  ...KASUMIGASEKI_BRANDS,
];

/** IDでブランドを検索 */
export function getBrandById(id: string): BrandBenchmark | null {
  return ALL_BRAND_BENCHMARKS.find(b => b.id === id) ?? null;
}

/** カテゴリでブランドを絞り込む */
export function getBrandsByCategory(category: string): BrandBenchmark[] {
  return ALL_BRAND_BENCHMARKS.filter(b =>
    b.category.toLowerCase().includes(category.toLowerCase()),
  );
}

/** ADR帯でブランドを絞り込む（±30%のマッチング） */
export function findMatchingBrands(marketADR: number): BrandBenchmark[] {
  return ALL_BRAND_BENCHMARKS.filter(b => {
    const ratio = marketADR / b.typical_adr_weekday;
    return ratio >= 0.5 && ratio <= 2.0;
  });
}
