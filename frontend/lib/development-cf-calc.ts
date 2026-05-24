/**
 * development-cf-calc.ts
 * 霞が関キャピタル方式 開発型ホテルCFモデル計算ライブラリ
 *
 * CF250303v5__歌舞伎町__20251218.xlsx の計算ロジックを再現。
 * 全計算は純TypeScript（サーバー・クライアント共用可）。
 */

// ─── 入力型定義 ─────────────────────────────────────────────────

export interface RoomTypePlan {
  name: string;         // 客室タイプ名 (例: "タイプA", "タイプC")
  count: number;        // 客室数
  area_sqm: number;     // 1室面積（㎡）
  weekday_adr: number;  // 平日ADR（円）
  weekend_adr: number;  // 休日ADR（円）
}

export interface DevCFInput {
  // ─── 物件基本情報 ───
  land_area_sqm: number;        // 土地面積（㎡）
  far_pct: number;              // 容積率（%）例: 600
  bcr_pct: number;              // 建蔽率（%）例: 80
  floors: number;               // 階数
  gfa_sqm?: number;             // 延床面積（㎡）省略時: land_area × far/100
  rentable_ratio_pct: number;   // レンタブル比（%）例: 63.52

  // ─── 客室計画 ───
  room_types: RoomTypePlan[];
  weekday_occ_pct: number;       // 平日稼働率（%）例: 84
  weekend_occ_pct: number;       // 休日稼働率（%）例: 90
  weekday_nights_per_year: number; // 平日夜数/年（例: 261）
  weekend_nights_per_year: number; // 休日夜数/年（例: 104）

  // ─── 総事業費 ───
  land_price_man: number;           // 土地価格（万円）
  brokerage_pct: number;            // 仲介手数料率（%）例: 3.0（+6万）
  demo_cost_man: number;            // 解体費（万円）
  land_tax_pct: number;             // 土地取得税・登免税率（%）例: 4.5
  construction_unit_man_per_sqm: number; // 建築単価（万円/㎡）例: 90.7
  design_fee_pct: number;           // 設計費（建築費の%）例: 5.0
  design_interior_man: number;      // デザイン業務委託費（万円）
  contingency_pct: number;          // 予備費率（建築費の%）例: 10.0
  building_tax_pct: number;         // 建物取得税・登免税率（%）例: 4.4
  ffe_per_room_man: number;         // FF&E 客室1室当たり（万円）例: 330
  common_ffe_man: number;           // 共用部FF&E（万円）
  system_cost_man: number;          // システム導入費（万円）
  license_fee_man: number;          // ブランドライセンスフィー（万円）
  opening_cost_man: number;         // 開業準備金（万円）
  pm_fee_man: number;               // PMフィー（万円）
  misc_man: number;                 // その他（万円）

  // ─── 運営費 ───
  ota_commission_pct: number;    // OTA手数料率（%）例: 13.0
  utility_per_tsubo_monthly: number; // 水道光熱費（円/坪/月）例: 6000
  ad_pct: number;                // 広告宣伝費率（%）例: 3.0
  contingency_op_pct: number;   // 運営予備費率（%）例: 3.0
  staff_cost_man: number;        // 人件費（万円/年）
  cleaning_per_turnover: number; // 清掃費（円/組）例: 3600
  amenity_per_guest: number;     // アメニティ（円/宿泊者）例: 500
  linen_per_turnover: number;    // リネン（円/組）例: 2500
  fb_revenue_man: number;        // F&B収入（万円/年）

  // ─── 委託・ML ───
  management_fee_pct_of_gop: number; // 運営委託報酬率（%）例: 10.0
  ml_fee_pct: number;               // ML業務委託報酬率（%）例: 4.0

  // ─── 所有者負担 ───
  bm_monthly_man: number;        // BM費（万円/月）例: 60
  pm_monthly_man: number;        // PM費（万円/月）例: 20
  renovation_ratio_pct: number;  // 修繕費率（再調達価額×%）例: 0.3
  renovation_owner_share_pct: number; // うち所有者負担割合（%）例: 30
  insurance_pct: number;         // 損害保険率（再調達価額の%）例: 0.2
  property_tax_land_man: number; // 固都税（土地）（万円/年）
  property_tax_building_man: number; // 固都税（建物）（万円/年）
  depreciable_asset_tax_man: number; // 償却資産税（万円/年）

  // ─── FFE Reserve / CAPEX ───
  ffe_reserve_pct_of_gor: number; // FFEリザーブ率（GORの%）例: 1.25
  capex_pct: number;              // CAPEX率（再調達価額×%×残割合）例: 0.3

  // ─── 出口・保有期間 ───
  exit_cap_pct: number;          // Exit Cap Rate（%）例: 3.80
  hold_months: number;           // 保有期間（ヶ月）例: 29

  // ─── ファイナンス ───
  ltc_pct: number;               // LTC（取得原価比、%）例: 65.0
  loan_base_rate_pct: number;    // ローン ベースレート（%）例: 1.00
  loan_spread_pct: number;       // ローン スプレッド（%）例: 1.40
  upfront_fee_pct: number;       // アップフロントフィー（%）例: 1.00
  loan_term_years: number;       // ローン期間（年）例: 5
  priority_tk_man: number;       // 優先TK金額（万円）
  sub_tk_man: number;            // 劣後TK金額（万円）
  hurdle_rate_pct: number;       // 優先TK ハードルレート（%）例: 8.0

  // ─── AM フィー ───
  am_setup_pct: number;          // AM Setup Fee（取得原価×%）例: 1.0
  am_ongoing_pct: number;        // AM Ongoing Fee（年率%）例: 0.5
  am_exit_pct: number;           // AM Exit Fee（売却価格×%）例: 1.0

  // ─── 賃料ストレス ───
  fr_months: number;             // フリーレント期間（ヶ月）例: 3
  stress_phase1_months: number;  // ストレス期間1（ヶ月）例: 3
  stress_phase1_pct: number;     // ストレス割引率1（%）例: 60
  stress_phase2_months: number;  // ストレス期間2（ヶ月）例: 6
  stress_phase2_pct: number;     // ストレス割引率2（%）例: 50
  stress_phase3_months: number;  // ストレス期間3（ヶ月）例: 12
  stress_phase3_pct: number;     // ストレス割引率3（%）例: 30
}

// ─── 出力型定義 ─────────────────────────────────────────────────

export interface RoomTypeResult {
  name: string;
  count: number;
  area_sqm: number;
  weekday_revenue: number;
  weekend_revenue: number;
  total_revenue: number;
  blended_adr: number;
  blended_revpar: number;
}

export interface DevCFOutput {
  // 物件基本
  total_rooms: number;
  gfa_sqm: number;
  total_room_area_sqm: number;
  gfa_per_tsubo: number;

  // 事業費
  land_acquisition_total: number;    // 土地取得原価合計
  construction_total: number;         // 建築関連原価合計
  ffe_total: number;                  // FF&E合計
  other_total: number;                // その他取得原価合計
  total_dev_cost: number;            // 総事業費（税抜）
  total_dev_cost_tax: number;        // 総事業費（税込）
  cost_per_room: number;             // 1室あたり事業費
  cost_per_sqm: number;              // 延床㎡あたり事業費
  construction_unit_actual: number;  // 建築単価（実際）

  // 運営収入
  room_type_results: RoomTypeResult[];
  room_revenue: number;              // 客室売上
  fb_revenue: number;                // F&B収入
  gor: number;                       // GOR（運営収入合計）
  blended_adr: number;               // 年間ブレンドADR
  blended_occ: number;               // 年間ブレンド稼働率
  blended_revpar: number;            // RevPAR

  // 運営費
  ota_commission: number;
  utility_cost: number;
  ad_cost: number;
  contingency_op: number;
  staff_cost: number;
  cleaning_cost: number;
  amenity_cost: number;
  linen_cost: number;
  total_op_cost: number;             // 運営費合計
  op_cost_ratio: number;             // 運営費率

  // P&Lウォーターフォール
  gop: number;                       // GOP
  gop_ratio: number;                 // GOP率
  management_fee: number;            // 運営委託報酬
  agop: number;                      // AGOP（転貸借賃料）
  ml_fee: number;                    // ML業務委託報酬
  owner_rent: number;                // オーナー受取賃料
  owner_expenses: number;            // 所有者負担費用合計
  noi: number;                       // NOI
  noi_yield_pct: number;             // NOI利回り（%）
  ffe_reserve: number;               // FFEリザーブ
  capex: number;                     // CAPEX
  ncf: number;                       // NCF
  ncf_yield_pct: number;             // NCF利回り（%）

  // 出口
  exit_price: number;                // 売却価格
  exit_profit: number;               // 売却益
  exit_profit_ratio_pct: number;     // 売却益率（売価比）
  exit_price_per_room: number;       // 1室あたり売却価格
  exit_price_per_gfa_sqm: number;    // 延床㎡あたり売却価格

  // ファイナンス
  senior_loan: number;               // Senior Loan金額
  loan_rate_pct: number;            // ローン金利（%）
  total_equity: number;              // 総エクイティ
  equity_gap: number;                // 資金不足（正なら追加調達必要）

  // IRR
  irr_unlevered_pct: number | null;  // レバ前IRR（%）
  irr_levered_pct: number | null;    // 優先TK IRR（%）
  equity_multiple: number | null;    // エクイティ倍率

  // KC AMフィー
  am_setup_fee: number;
  am_ongoing_fee: number;
  am_exit_fee: number;
  am_total_fee: number;

  // ストレス後 保有期間中キャッシュフロー合計
  hold_noi_stressed: number;

  // Cap感応度テーブル
  cap_sensitivity: CapSensitivityRow[];
}

export interface CapSensitivityRow {
  cap_pct: number;
  exit_price: number;
  exit_profit: number;
  profit_ratio_pct: number;
  irr_unlevered_pct: number | null;
  irr_levered_pct: number | null;
}

// ─── IRR計算（Newton-Raphson法） ────────────────────────────────

function npv(rate: number, cashflows: number[]): number {
  return cashflows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + rate, i), 0);
}

function irr(cashflows: number[], guess = 0.1): number | null {
  // 符号変換が必要（最初のCFが負）
  if (cashflows[0] >= 0) return null;
  let r = guess;
  for (let i = 0; i < 1000; i++) {
    const f = npv(r, cashflows);
    const df = cashflows.reduce((acc, cf, t) => acc - (t * cf) / Math.pow(1 + r, t + 1), 0);
    if (Math.abs(df) < 1e-10) break;
    const r2 = r - f / df;
    if (Math.abs(r2 - r) < 1e-8) { r = r2; break; }
    r = r2;
    if (r < -0.9999) return null; // 発散
  }
  const residual = Math.abs(npv(r, cashflows));
  const scale = Math.abs(cashflows[0]) || 1;
  if (!isFinite(r) || residual / scale > 1e-4) return null;
  return r * 100; // パーセント表示
}

// ─── 年次IRRを月次から変換 ─────────────────────────────────────
function irrAnnualized(monthlyIRR: number): number {
  return (Math.pow(1 + monthlyIRR / 100, 12) - 1) * 100;
}

// ─── メイン計算関数 ─────────────────────────────────────────────

export function calcDevCF(input: DevCFInput): DevCFOutput {
  const M = 10000; // 万円→円変換

  // ── 1. 物件基本 ──────────────────────────────────────────────
  const total_rooms = input.room_types.reduce((s, r) => s + r.count, 0);
  const gfa_sqm = (input.gfa_sqm != null && input.gfa_sqm > 0) ? input.gfa_sqm : (input.land_area_sqm * input.far_pct / 100);
  const total_room_area_sqm = gfa_sqm * input.rentable_ratio_pct / 100;
  const gfa_per_tsubo = gfa_sqm / 3.3058; // 1坪 = 3.3058㎡

  // ── 2. 総事業費 ──────────────────────────────────────────────
  const land_price = input.land_price_man * M;
  const brokerage = land_price * input.brokerage_pct / 100 + 60000; // 3%+6万
  const demo_cost = input.demo_cost_man * M;
  const land_tax = land_price * input.land_tax_pct / 100;
  const land_acquisition_total = land_price + brokerage + demo_cost + land_tax;

  const construction_cost = input.construction_unit_man_per_sqm * M * gfa_sqm;
  const design_fee = construction_cost * input.design_fee_pct / 100;
  const design_interior = input.design_interior_man * M;
  const contingency = construction_cost * input.contingency_pct / 100;
  const building_tax = construction_cost * input.building_tax_pct / 100;
  const construction_total = construction_cost + design_fee + design_interior + contingency + building_tax;

  const ffe_rooms = input.ffe_per_room_man * M * total_rooms;
  const ffe_common = input.common_ffe_man * M;
  const system_cost = input.system_cost_man * M;
  const ffe_total = ffe_rooms + ffe_common + system_cost;

  const license_fee = input.license_fee_man * M;
  const opening_cost = input.opening_cost_man * M;
  const pm_fee = input.pm_fee_man * M;
  const misc = input.misc_man * M;
  const other_total = license_fee + opening_cost + pm_fee + misc;

  const total_dev_cost = land_acquisition_total + construction_total + ffe_total + other_total;
  const total_dev_cost_tax = total_dev_cost * 1.10; // 消費税10%（概算）
  const cost_per_room = total_rooms > 0 ? total_dev_cost / total_rooms : 0;
  const cost_per_sqm = gfa_sqm > 0 ? total_dev_cost / gfa_sqm : 0;
  const construction_unit_actual = gfa_sqm > 0 ? construction_cost / gfa_sqm : 0;

  // ── 3. 運営収入 ───────────────────────────────────────────────
  const wd_nights = input.weekday_nights_per_year;
  const we_nights = input.weekend_nights_per_year;
  const wd_occ = input.weekday_occ_pct / 100;
  const we_occ = input.weekend_occ_pct / 100;

  const room_type_results: RoomTypeResult[] = input.room_types.map(rt => {
    const wd_rev = rt.count * rt.weekday_adr * wd_occ * wd_nights;
    const we_rev = rt.count * rt.weekend_adr * we_occ * we_nights;
    const total = wd_rev + we_rev;
    const total_nights = wd_nights + we_nights;
    const total_occ_nights = wd_nights * wd_occ + we_nights * we_occ;
    const blended_adr = total_occ_nights > 0
      ? (wd_rev + we_rev) / (rt.count * total_occ_nights)
      : 0;
    return {
      name: rt.name,
      count: rt.count,
      area_sqm: rt.area_sqm,
      weekday_revenue: wd_rev,
      weekend_revenue: we_rev,
      total_revenue: total,
      blended_adr,
      blended_revpar: total_nights > 0 ? total / (rt.count * total_nights) : 0,
    };
  });

  const room_revenue = room_type_results.reduce((s, r) => s + r.total_revenue, 0);
  const fb_revenue = input.fb_revenue_man * M;
  const gor = room_revenue + fb_revenue;

  // ブレンドADR・OCC・RevPAR
  const total_nights_year = wd_nights + we_nights;
  const total_occ_room_nights = total_rooms * (wd_nights * wd_occ + we_nights * we_occ);
  const blended_occ = total_nights_year > 0
    ? (wd_nights * wd_occ + we_nights * we_occ) / total_nights_year
    : 0;
  const blended_adr = total_occ_room_nights > 0 ? room_revenue / total_occ_room_nights : 0;
  const blended_revpar = total_nights_year > 0 ? room_revenue / (total_rooms * total_nights_year) : 0;

  // ── 4. 運営費 ─────────────────────────────────────────────────
  const ota_commission = gor * input.ota_commission_pct / 100;
  const utility_cost = (gfa_per_tsubo * input.utility_per_tsubo_monthly * 12);
  const ad_cost = gor * input.ad_pct / 100;
  const contingency_op = gor * input.contingency_op_pct / 100;
  const staff_cost = input.staff_cost_man * M;

  // 清掃費：1室×稼働率×年間日数×清掃単価
  const annual_turnovers = total_rooms * blended_occ * total_nights_year;
  const cleaning_cost = annual_turnovers * input.cleaning_per_turnover;
  const amenity_cost = annual_turnovers * input.amenity_per_guest * 1.5; // 平均1.5人/室
  const linen_cost = annual_turnovers * input.linen_per_turnover;

  const total_op_cost = ota_commission + utility_cost + ad_cost + contingency_op
    + staff_cost + cleaning_cost + amenity_cost + linen_cost;
  const op_cost_ratio = gor > 0 ? (total_op_cost / gor) * 100 : 0;

  // ── 5. P&Lウォーターフォール ─────────────────────────────────
  const gop = gor - total_op_cost;
  const gop_ratio = gor > 0 ? (gop / gor) * 100 : 0;
  const management_fee = gop * input.management_fee_pct_of_gop / 100;
  const agop = gop - management_fee;
  const ml_fee = agop * input.ml_fee_pct / 100;
  const owner_rent = agop - ml_fee;

  // 所有者負担費用
  const bm_cost = input.bm_monthly_man * M * 12;
  const pm_cost_annual = input.pm_monthly_man * M * 12;
  const renovation_cost = construction_cost * input.renovation_ratio_pct / 100 * input.renovation_owner_share_pct / 100;
  const insurance_cost = construction_cost * input.insurance_pct / 100;
  const land_tax_annual = input.property_tax_land_man * M;
  const building_tax_annual = input.property_tax_building_man * M;
  const depreciable_tax = input.depreciable_asset_tax_man * M;
  const owner_expenses = bm_cost + pm_cost_annual + renovation_cost + insurance_cost
    + land_tax_annual + building_tax_annual + depreciable_tax;

  const noi = owner_rent - owner_expenses;
  const noi_yield_pct = total_dev_cost > 0 ? (noi / total_dev_cost) * 100 : 0;

  const ffe_reserve = gor * input.ffe_reserve_pct_of_gor / 100;
  const capex = construction_cost * input.capex_pct / 100 * 0.7; // 再調達×0.3%×70%
  const ncf = noi - ffe_reserve - capex;
  const ncf_yield_pct = total_dev_cost > 0 ? (ncf / total_dev_cost) * 100 : 0;

  // ── 6. 出口価格算定 ──────────────────────────────────────────
  const exit_price = input.exit_cap_pct > 0 ? noi / (input.exit_cap_pct / 100) : 0;
  const exit_profit = exit_price - total_dev_cost;
  const exit_profit_ratio_pct = exit_price > 0 ? (exit_profit / exit_price) * 100 : 0;
  const exit_price_per_room = total_rooms > 0 ? exit_price / total_rooms : 0;
  const exit_price_per_gfa_sqm = gfa_sqm > 0 ? exit_price / gfa_sqm : 0;

  // ── 7. ファイナンス ──────────────────────────────────────────
  const senior_loan = total_dev_cost * input.ltc_pct / 100;
  const loan_rate_pct = input.loan_base_rate_pct + input.loan_spread_pct;
  const total_equity = input.priority_tk_man * M + input.sub_tk_man * M;
  const equity_gap = total_dev_cost - senior_loan - total_equity; // 0が理想

  // ── 8. AMフィー ─────────────────────────────────────────────
  const am_setup_fee = total_dev_cost * input.am_setup_pct / 100;
  const hold_years = input.hold_months / 12;
  const am_ongoing_fee = total_dev_cost * input.am_ongoing_pct / 100 * hold_years;
  const am_exit_fee = exit_price * input.am_exit_pct / 100;
  const am_total_fee = am_setup_fee + am_ongoing_fee + am_exit_fee;

  // ── 9. ストレス後 保有期間NCF ────────────────────────────────
  // フリーレント → 段階的回復 → フル
  const monthly_noi = noi / 12;
  const fr = input.fr_months;
  const p1 = input.stress_phase1_months;
  const p2 = input.stress_phase2_months;
  const p3 = input.stress_phase3_months;
  const r1 = 1 - input.stress_phase1_pct / 100;
  const r2 = 1 - input.stress_phase2_pct / 100;
  const r3 = 1 - input.stress_phase3_pct / 100;

  let hold_noi_stressed = 0;
  for (let m = 1; m <= input.hold_months; m++) {
    let factor = 1.0;
    if (m <= fr) factor = 0;
    else if (m <= fr + p1) factor = r1;
    else if (m <= fr + p1 + p2) factor = r2;
    else if (m <= fr + p1 + p2 + p3) factor = r3;
    hold_noi_stressed += monthly_noi * factor;
  }

  // ── 10. IRR計算 ─────────────────────────────────────────────
  // レバ前IRR：-総事業費 → 毎月NCF（ストレス）→ 最終月に売却価格
  const unlevered_cfs: number[] = [-total_dev_cost];
  const monthly_ncf = ncf / 12;
  for (let m = 1; m <= input.hold_months; m++) {
    let factor = 1.0;
    if (m <= fr) factor = 0;
    else if (m <= fr + p1) factor = r1;
    else if (m <= fr + p1 + p2) factor = r2;
    else if (m <= fr + p1 + p2 + p3) factor = r3;
    const cf = monthly_ncf * factor;
    unlevered_cfs.push(m === input.hold_months ? cf + exit_price : cf);
  }
  const irr_unlevered_monthly = irr(unlevered_cfs, 0.01);
  const irr_unlevered_pct = irr_unlevered_monthly !== null
    ? irrAnnualized(irr_unlevered_monthly)
    : null;

  // レバ後IRR（優先TK）：-priority_tk → 優先リターン → 最終に残余
  const priority_tk = input.priority_tk_man * M;
  const sub_tk = input.sub_tk_man * M;
  const loan_interest_annual = senior_loan * loan_rate_pct / 100;
  const monthly_loan_interest = loan_interest_annual / 12;
  const upfront_fee = senior_loan * input.upfront_fee_pct / 100;

  const levered_cfs: number[] = [-(priority_tk + upfront_fee)];
  for (let m = 1; m <= input.hold_months; m++) {
    let factor = 1.0;
    if (m <= fr) factor = 0;
    else if (m <= fr + p1) factor = r1;
    else if (m <= fr + p1 + p2) factor = r2;
    else if (m <= fr + p1 + p2 + p3) factor = r3;
    const gross = (monthly_ncf * factor) - monthly_loan_interest;
    const hurdle_monthly = priority_tk * (input.hurdle_rate_pct / 100 / 12);
    const cf = gross - hurdle_monthly;
    levered_cfs.push(m === input.hold_months
      ? cf + (exit_price - senior_loan - sub_tk) - am_exit_fee
      : cf);
  }
  const irr_levered_monthly = irr(levered_cfs, 0.01);
  const irr_levered_pct = irr_levered_monthly !== null
    ? irrAnnualized(irr_levered_monthly)
    : null;

  const hold_pnl = exit_price - senior_loan - sub_tk - priority_tk - am_exit_fee;
  const equity_multiple = priority_tk > 0 ? (priority_tk + hold_pnl) / priority_tk : null;

  // ── 11. Cap感応度テーブル ─────────────────────────────────────
  const cap_rates = [3.2, 3.4, 3.6, 3.8, 4.0, 4.2, 4.4, 4.6, 5.0];
  const cap_sensitivity: CapSensitivityRow[] = cap_rates.map(cap => {
    const ep = noi / (cap / 100);
    const profit = ep - total_dev_cost;
    const profit_ratio = ep > 0 ? (profit / ep) * 100 : 0;

    // レバ前IRR（簡略版：終端価値のみ変更）
    const u_cfs = [...unlevered_cfs];
    const lastM = input.hold_months;
    const lastFactor = lastM <= fr ? 0
      : lastM <= fr + p1 ? r1
      : lastM <= fr + p1 + p2 ? r2
      : lastM <= fr + p1 + p2 + p3 ? r3 : 1.0;
    u_cfs[u_cfs.length - 1] = (monthly_ncf * lastFactor) + ep;
    const u_irr_m = irr(u_cfs, 0.01);
    const u_irr = u_irr_m !== null ? irrAnnualized(u_irr_m) : null;

    // レバ後IRR（簡略版）
    const l_cfs = [...levered_cfs];
    l_cfs[l_cfs.length - 1] = l_cfs[l_cfs.length - 1] + (ep - exit_price);
    const l_irr_m = irr(l_cfs, 0.01);
    const l_irr = l_irr_m !== null ? irrAnnualized(l_irr_m) : null;

    return {
      cap_pct: cap,
      exit_price: ep,
      exit_profit: profit,
      profit_ratio_pct: profit_ratio,
      irr_unlevered_pct: u_irr,
      irr_levered_pct: l_irr,
    };
  });

  return {
    total_rooms,
    gfa_sqm,
    total_room_area_sqm,
    gfa_per_tsubo,
    land_acquisition_total,
    construction_total,
    ffe_total,
    other_total,
    total_dev_cost,
    total_dev_cost_tax,
    cost_per_room,
    cost_per_sqm,
    construction_unit_actual,
    room_type_results,
    room_revenue,
    fb_revenue,
    gor,
    blended_adr,
    blended_occ: blended_occ * 100,
    blended_revpar,
    ota_commission,
    utility_cost,
    ad_cost,
    contingency_op,
    staff_cost,
    cleaning_cost,
    amenity_cost,
    linen_cost,
    total_op_cost,
    op_cost_ratio,
    gop,
    gop_ratio,
    management_fee,
    agop,
    ml_fee,
    owner_rent,
    owner_expenses,
    noi,
    noi_yield_pct,
    ffe_reserve,
    capex,
    ncf,
    ncf_yield_pct,
    exit_price,
    exit_profit,
    exit_profit_ratio_pct,
    exit_price_per_room,
    exit_price_per_gfa_sqm,
    senior_loan,
    loan_rate_pct,
    total_equity,
    equity_gap,
    irr_unlevered_pct,
    irr_levered_pct,
    equity_multiple,
    am_setup_fee,
    am_ongoing_fee,
    am_exit_fee,
    am_total_fee,
    hold_noi_stressed,
    cap_sensitivity,
  };
}

// ─── デフォルト値（歌舞伎町78室案件ベース） ─────────────────────

export const KABUKICHO_DEFAULTS: DevCFInput = {
  land_area_sqm: 550.01,
  far_pct: 600,
  bcr_pct: 80,
  floors: 7,
  rentable_ratio_pct: 63.52,
  room_types: [
    { name: 'タイプA', count: 48, area_sqm: 33.17, weekday_adr: 46438, weekend_adr: 60369 },
    { name: 'タイプC', count: 30, area_sqm: 16.80, weekday_adr: 23520, weekend_adr: 30576 },
  ],
  weekday_occ_pct: 84.0,
  weekend_occ_pct: 90.0,
  weekday_nights_per_year: 261,
  weekend_nights_per_year: 104,
  land_price_man: 60000,
  brokerage_pct: 3.0,
  demo_cost_man: 2178,
  land_tax_pct: 4.5,
  construction_unit_man_per_sqm: 90.7,
  design_fee_pct: 5.0,
  design_interior_man: 300,
  contingency_pct: 10.0,
  building_tax_pct: 4.4,
  ffe_per_room_man: 330,
  common_ffe_man: 270,
  system_cost_man: 315,
  license_fee_man: 500,
  opening_cost_man: 250,
  pm_fee_man: 250,
  misc_man: 60,
  ota_commission_pct: 13.0,
  utility_per_tsubo_monthly: 6000,
  ad_pct: 3.0,
  contingency_op_pct: 3.0,
  staff_cost_man: 200,
  cleaning_per_turnover: 3600,
  amenity_per_guest: 500,
  linen_per_turnover: 2500,
  fb_revenue_man: 0,
  management_fee_pct_of_gop: 10.0,
  ml_fee_pct: 4.0,
  bm_monthly_man: 60,
  pm_monthly_man: 20,
  renovation_ratio_pct: 0.3,
  renovation_owner_share_pct: 30,
  insurance_pct: 0.2,
  property_tax_land_man: 377,
  property_tax_building_man: 954,
  depreciable_asset_tax_man: 253,
  ffe_reserve_pct_of_gor: 1.25,
  capex_pct: 0.3,
  exit_cap_pct: 3.80,
  hold_months: 29,
  ltc_pct: 65.0,
  loan_base_rate_pct: 1.00,
  loan_spread_pct: 1.40,
  upfront_fee_pct: 1.00,
  loan_term_years: 5,
  priority_tk_man: 58270,
  sub_tk_man: 860,
  hurdle_rate_pct: 8.0,
  am_setup_pct: 1.0,
  am_ongoing_pct: 0.5,
  am_exit_pct: 1.0,
  fr_months: 3,
  stress_phase1_months: 3,
  stress_phase1_pct: 60,
  stress_phase2_months: 6,
  stress_phase2_pct: 50,
  stress_phase3_months: 12,
  stress_phase3_pct: 30,
};
