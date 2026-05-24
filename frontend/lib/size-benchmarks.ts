/**
 * size-benchmarks.ts
 * 客室規模別ADR・OCC・RevPARベンチマーク。
 *
 * 出典: HotelBank「2026年開業582軒で読み解く最適規模戦略」
 *       (メトロエンジンリサーチ&コンサルティング, 2026年4〜6月, N=529)
 *
 * ⚠️ ADRはOTA公開価格の平均値（2名1室・税込・全プラン平均）。
 *    実際の成約価格はこれより約25〜30%低い傾向があります。
 *
 * 建設費トレンド（2024〜2026年）：坪単価が約41%上昇。
 * 国内新規供給率はアジア太平洋平均の約1/4（供給絞り込み局面）。
 */

export interface SizeBenchmark {
  label:   string;
  min:     number;
  max:     number;
  adr:     number | null;   // OTA公開価格ベースのADR（円）
  occ:     number | null;   // 推定OCC（%）
  revpar:  number | null;   // ADR × OCC ÷ 100（円）
  verdict: 'best' | 'good' | 'caution' | 'avoid' | 'na';
  note:    string;
}

export const SIZE_BENCHMARKS: SizeBenchmark[] = [
  {
    label: '9室以下',
    min: 1, max: 9,
    adr: null, occ: null, revpar: null,
    verdict: 'na',
    note: '民泊・ゲストハウス混在。ADRは高いが規模が小さく投資判断対象外になりやすい',
  },
  {
    label: '10〜29室',
    min: 10, max: 29,
    adr: 49000, occ: 68, revpar: Math.round(49000 * 0.68),
    verdict: 'good',
    note: '小型ラグジュアリー候補。高ADRだが総客室収益は小さく、ランニングコスト効率に注意',
  },
  {
    label: '30〜79室',
    min: 30, max: 79,
    adr: 51400, occ: 72, revpar: Math.round(51400 * 0.72),
    verdict: 'best',
    note: '🏆 最適帯。ADR・RevPAR共に全規模帯で最高水準。コンパクトラグジュアリーが集中',
  },
  {
    label: '80〜149室',
    min: 80, max: 149,
    adr: 39300, occ: 59.7, revpar: Math.round(39300 * 0.597),
    verdict: 'avoid',
    note: '⚠️ デッドゾーン。ADR¥39,300・OCC59.7%と全帯域で最低水準。スケールメリットも高ADRも両立できない中間帯',
  },
  {
    label: '150〜199室',
    min: 150, max: 199,
    adr: 40500, occ: 63, revpar: Math.round(40500 * 0.63),
    verdict: 'caution',
    note: 'デッドゾーン脱出途中。スケールメリットが出始めるが、まだ最適水準に届いていない',
  },
  {
    label: '200〜299室',
    min: 200, max: 299,
    adr: 41800, occ: 68, revpar: Math.round(41800 * 0.68),
    verdict: 'good',
    note: 'スケール効率帯の入口。都市型で固定費分散が機能し始める。RevPARはコンパクト帯には届かない',
  },
  {
    label: '300室以上',
    min: 300, max: 9999,
    adr: 44500, occ: 72, revpar: Math.round(44500 * 0.72),
    verdict: 'good',
    note: '大型都市型ホテル。スケールメリット最大化。初期投資・運営コスト共に大きく、立地・ブランド力が必須',
  },
];

/** 客室数から該当ベンチマークを返す */
export function getSizeBenchmark(rooms: number): SizeBenchmark | null {
  return SIZE_BENCHMARKS.find(b => rooms >= b.min && rooms <= b.max) ?? null;
}

/** 客室数から推奨OCCを返す（仕入れ判断の初期値として使用） */
export function getBenchmarkOCC(rooms: number): number {
  const b = getSizeBenchmark(rooms);
  return b?.occ ?? 70;
}

/** 客室数から推奨ADRを返す（参照値） */
export function getBenchmarkADR(rooms: number): number | null {
  return getSizeBenchmark(rooms)?.adr ?? null;
}

/**
 * OTA公開価格から推定成約価格への補正係数
 * 業界実態: OTA公開価格は実成約ADRより10〜15%高い（チャネルミックス・割引プラン考慮）
 * ⚠️ 旧値0.775（-23%）は過大補正。更新値0.875（-12.5%中間値）を採用
 * 出典: JTB総合研究所・STR Japan ホテル収益調査（2024）
 */
export const OTA_TO_ACTUAL_ADR_RATIO = 0.875; // = 1 / 1.143（10〜15%割引の中間値）

export function adjustOtaToActualAdr(otaAdr: number): number {
  return Math.round(otaAdr * OTA_TO_ACTUAL_ADR_RATIO / 100) * 100;
}

/**
 * 建設費トレンド注記
 * 出典: HotelBank 2026年582軒分析（メトロエンジンリサーチ）
 */
export const CONSTRUCTION_COST_NOTE = {
  trend: '建設費（坪単価）は2024〜2026年の2年間で約41%上昇',
  supply: '日本の新規ホテル供給率はアジア太平洋平均の約1/4（供給絞り込み局面）',
  avg_rooms: '2026年開業予定の平均客室数は39室（小型化加速）',
  source: 'HotelBank「2026年開業582軒で読み解く最適規模戦略」（メトロエンジン）',
};
