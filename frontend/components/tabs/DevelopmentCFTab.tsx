'use client';
import { useState, useMemo } from 'react';
import { calcDevCF, DevCFInput, DevCFOutput, KABUKICHO_DEFAULTS, RoomTypePlan } from '@/lib/development-cf-calc';

const fmt = (n: number, digits = 0) =>
  n.toLocaleString('ja-JP', { maximumFractionDigits: digits });
const fmtMan = (n: number) => `¥${fmt(Math.round(n / 10000))}万`;
const fmtOku = (n: number) => `${(n / 100000000).toFixed(2)}億円`;
const pct = (n: number | null, digits = 1) =>
  n === null ? 'N/A' : `${n.toFixed(digits)}%`;

function KpiCard({
  label, value, sub, color = 'red',
}: { label: string; value: string; sub?: string; color?: 'red' | 'gold' | 'green' | 'default' }) {
  const border = color === 'red' ? 'border-l-red-700' :
    color === 'gold' ? 'border-l-amber-500' :
    color === 'green' ? 'border-l-emerald-600' : 'border-l-gray-700';
  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${border} p-4 rounded-r-xl`}>
      <div className="text-xs text-gray-500 font-mono tracking-wider uppercase mb-1">{label}</div>
      <div className="text-2xl font-black text-gray-900 leading-tight">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1 font-mono">{sub}</div>}
    </div>
  );
}

function SectionTitle({ num, title }: { num: string; title: string }) {
  return (
    <div className="mt-8 mb-3">
      <span className="text-xs text-red-700 font-mono tracking-widest">{num} ─</span>
      <h3 className="text-lg font-black border-b-2 border-gray-900 pb-2 mt-1">{title}</h3>
    </div>
  );
}

function WaterfallRow({
  label, value, highlight, indent = false,
}: { label: string; value: number; highlight?: 'pos' | 'neg' | 'gold'; indent?: boolean }) {
  const bg = highlight === 'pos' ? 'bg-emerald-50 font-bold' :
    highlight === 'neg' ? 'bg-red-50 font-bold' :
    highlight === 'gold' ? 'bg-amber-50 font-semibold' : '';
  return (
    <div className={`flex items-center justify-between py-2 px-3 border-b border-gray-100 text-sm ${bg}`}>
      <span className={`text-gray-700 ${indent ? 'pl-4' : ''}`}>{label}</span>
      <span className="font-mono tabular-nums">{fmtOku(value)}</span>
    </div>
  );
}

// ──────── メインコンポーネント ────────────────────────────────────

export default function DevelopmentCFTab() {
  const [input, setInput] = useState<DevCFInput>(KABUKICHO_DEFAULTS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const result: DevCFOutput = useMemo(() => calcDevCF(input), [input]);

  // 入力ヘルパー
  const setNum = (key: keyof DevCFInput, val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n)) setInput(prev => ({ ...prev, [key]: n }));
  };

  const setRoomType = (idx: number, key: keyof RoomTypePlan, val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n)) {
      setInput(prev => {
        const rt = [...prev.room_types];
        rt[idx] = { ...rt[idx], [key]: n };
        return { ...prev, room_types: rt };
      });
    }
  };

  const addRoomType = () => {
    setInput(prev => ({
      ...prev,
      room_types: [...prev.room_types, { name: `タイプ${String.fromCharCode(65 + prev.room_types.length)}`, count: 10, area_sqm: 25, weekday_adr: 30000, weekend_adr: 40000 }],
    }));
  };

  const removeRoomType = (idx: number) => {
    setInput(prev => ({ ...prev, room_types: prev.room_types.filter((_, i) => i !== idx) }));
  };

  const NF = ({ label, k, step = 1, min = 0 }: { label: string; k: keyof DevCFInput; step?: number; min?: number }) => (
    <div>
      <label className="text-xs text-gray-500 block mb-0.5">{label}</label>
      <input
        type="number"
        value={typeof input[k] === 'number' ? input[k] as number : 0}
        min={min}
        step={step}
        onChange={e => setNum(k, e.target.value)}
        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
      />
    </div>
  );

  const verdict = result.irr_levered_pct === null ? 'na' :
    result.irr_levered_pct >= 12 ? 'good' :
    result.irr_levered_pct >= 8  ? 'caution' : 'bad';

  const verdictConfig = {
    good:    { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', label: '🟢 投資適格', sub: 'IRR 12%超 — 優先TK ハードル超過' },
    caution: { bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-800',   label: '🟡 要検討',  sub: 'IRR 8〜12% — ハードル達成もバッファ薄い' },
    bad:     { bg: 'bg-red-50 border-red-200',         text: 'text-red-800',     label: '🔴 非推奨',  sub: 'IRR 8%未満 — ハードルレート未達' },
    na:      { bg: 'bg-gray-50 border-gray-200',       text: 'text-gray-600',    label: '─ 計算不能', sub: 'パラメータを確認してください' },
  }[verdict];

  return (
    <div className="space-y-4 text-gray-900">
      {/* ─── ヘッダー ─── */}
      <div className="bg-gray-900 text-white p-4 rounded-xl">
        <p className="text-xs font-mono tracking-widest text-amber-400 mb-1">DEVELOPMENT CF MODEL — KC方式</p>
        <h2 className="text-xl font-black">開発型ホテルCFシミュレーター</h2>
        <p className="text-xs text-gray-400 mt-1">霞が関キャピタル CF250303v5 歌舞伎町モデルのロジックを再現</p>
      </div>

      {/* ─── 判定バナー ─── */}
      <div className={`border rounded-xl p-4 ${verdictConfig.bg}`}>
        <div className={`text-lg font-black ${verdictConfig.text}`}>{verdictConfig.label}</div>
        <div className={`text-sm ${verdictConfig.text} opacity-80`}>{verdictConfig.sub}</div>
        <div className={`mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm ${verdictConfig.text}`}>
          <div><span className="font-mono text-lg font-black">{pct(result.irr_levered_pct)}</span><br />優先TK IRR</div>
          <div><span className="font-mono text-lg font-black">{result.equity_multiple ? result.equity_multiple.toFixed(2) + 'x' : 'N/A'}</span><br />エクイティ倍率</div>
          <div><span className="font-mono text-lg font-black">{pct(result.noi_yield_pct)}</span><br />NOI利回り</div>
          <div><span className="font-mono text-lg font-black">{fmtOku(result.exit_profit)}</span><br />売却益</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ─── 左：入力パネル ─── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h3 className="font-bold text-sm border-b pb-2">📐 物件・建築計画</h3>

            <div className="grid grid-cols-2 gap-3">
              <NF label="土地面積（㎡）" k="land_area_sqm" step={0.01} />
              <NF label="容積率（%）" k="far_pct" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NF label="建蔽率（%）" k="bcr_pct" />
              <NF label="階数" k="floors" min={1} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NF label="レンタブル比（%）" k="rentable_ratio_pct" step={0.1} />
              <div className="bg-gray-50 rounded p-2 text-xs">
                <div className="text-gray-500">延床面積（自動）</div>
                <div className="font-bold text-base">{fmt(result.gfa_sqm, 1)} ㎡</div>
                <div className="text-gray-400">{fmt(result.gfa_per_tsubo, 1)} 坪</div>
              </div>
            </div>
          </div>

          {/* 客室計画 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="font-bold text-sm border-b pb-2">🛏 客室計画</h3>
            {input.room_types.map((rt, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    value={rt.name}
                    onChange={e => {
                      const newRt = [...input.room_types];
                      newRt[i] = { ...newRt[i], name: e.target.value };
                      setInput(prev => ({ ...prev, room_types: newRt }));
                    }}
                    className="text-sm font-bold border-none bg-transparent focus:outline-none"
                  />
                  {input.room_types.length > 1 && (
                    <button onClick={() => removeRoomType(i)} className="text-red-400 text-xs hover:text-red-600">削除</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">客室数</label>
                    <input type="number" value={rt.count} min={1} step={1}
                      onChange={e => setRoomType(i, 'count', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">面積（㎡/室）</label>
                    <input type="number" value={rt.area_sqm} min={1} step={0.1}
                      onChange={e => setRoomType(i, 'area_sqm', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">平日ADR（円）</label>
                    <input type="number" value={rt.weekday_adr} min={0} step={1000}
                      onChange={e => setRoomType(i, 'weekday_adr', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">休日ADR（円）</label>
                    <input type="number" value={rt.weekend_adr} min={0} step={1000}
                      onChange={e => setRoomType(i, 'weekend_adr', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addRoomType}
              className="w-full border border-dashed border-gray-300 text-gray-500 text-sm py-2 rounded-lg hover:border-gray-400 hover:text-gray-700 transition">
              ＋ 客室タイプ追加
            </button>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <NF label="平日OCC（%）" k="weekday_occ_pct" step={0.5} />
              <NF label="休日OCC（%）" k="weekend_occ_pct" step={0.5} />
            </div>
          </div>

          {/* 総事業費 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="font-bold text-sm border-b pb-2">💰 総事業費</h3>
            <div className="grid grid-cols-2 gap-3">
              <NF label="土地価格（万円）" k="land_price_man" step={100} />
              <NF label="解体費（万円）" k="demo_cost_man" step={10} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NF label="建築単価（万円/㎡）" k="construction_unit_man_per_sqm" step={1} />
              <NF label="予備費率（建築費の%）" k="contingency_pct" step={0.5} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NF label="FF&E（万円/室）" k="ffe_per_room_man" step={10} />
              <NF label="ライセンスフィー（万円）" k="license_fee_man" step={10} />
            </div>
          </div>

          {/* 出口・ファイナンス */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="font-bold text-sm border-b pb-2">📤 出口・ファイナンス</h3>
            <div className="grid grid-cols-2 gap-3">
              <NF label="Exit Cap Rate（%）" k="exit_cap_pct" step={0.1} />
              <NF label="保有期間（ヶ月）" k="hold_months" min={1} step={1} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NF label="LTC（%）" k="ltc_pct" step={1} />
              <NF label="優先TK（万円）" k="priority_tk_man" step={100} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NF label="Hurdle Rate（%）" k="hurdle_rate_pct" step={0.5} />
              <NF label="劣後TK（万円）" k="sub_tk_man" step={10} />
            </div>
          </div>

          {/* 詳細設定トグル */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full text-xs text-gray-500 border border-gray-200 rounded-xl py-2 hover:bg-gray-50 transition"
          >
            {showAdvanced ? '▲ 詳細設定を閉じる' : '▼ 運営費・ストレス・AMフィー 詳細設定'}
          </button>

          {showAdvanced && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="font-bold text-sm border-b pb-2">📊 運営費</h3>
                <div className="grid grid-cols-2 gap-3">
                  <NF label="OTA手数料率（%）" k="ota_commission_pct" step={0.5} />
                  <NF label="広告費率（%）" k="ad_pct" step={0.5} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NF label="人件費（万円/年）" k="staff_cost_man" step={50} />
                  <NF label="清掃費（円/組）" k="cleaning_per_turnover" step={100} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NF label="運営委託料率（%GOP）" k="management_fee_pct_of_gop" step={0.5} />
                  <NF label="ML委託料率（%AGOP）" k="ml_fee_pct" step={0.5} />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="font-bold text-sm border-b pb-2">📅 賃料ストレス（ランプアップ）</h3>
                <p className="text-xs text-gray-500">KC v5設定：FR3ヶ月→-60%×3ヶ月→-50%×6ヶ月→-30%×12ヶ月</p>
                <div className="grid grid-cols-2 gap-3">
                  <NF label="フリーレント（ヶ月）" k="fr_months" min={0} step={1} />
                  <div />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <NF label="期間1（ヶ月）" k="stress_phase1_months" min={0} step={1} />
                  <NF label="期間2（ヶ月）" k="stress_phase2_months" min={0} step={1} />
                  <NF label="期間3（ヶ月）" k="stress_phase3_months" min={0} step={1} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <NF label="割引率1（%）" k="stress_phase1_pct" step={5} />
                  <NF label="割引率2（%）" k="stress_phase2_pct" step={5} />
                  <NF label="割引率3（%）" k="stress_phase3_pct" step={5} />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="font-bold text-sm border-b pb-2">🏛 AMフィー（KC方式）</h3>
                <div className="grid grid-cols-3 gap-2">
                  <NF label="Setup（%）" k="am_setup_pct" step={0.1} />
                  <NF label="Ongoing（%/年）" k="am_ongoing_pct" step={0.1} />
                  <NF label="Exit（%売却価格）" k="am_exit_pct" step={0.1} />
                </div>
                <div className="bg-amber-50 rounded p-3 text-xs space-y-1">
                  <div className="flex justify-between"><span>AM Setup Fee</span><span className="font-mono">{fmtMan(result.am_setup_fee)}</span></div>
                  <div className="flex justify-between"><span>AM Ongoing Fee</span><span className="font-mono">{fmtMan(result.am_ongoing_fee)}</span></div>
                  <div className="flex justify-between"><span>AM Exit Fee</span><span className="font-mono">{fmtMan(result.am_exit_fee)}</span></div>
                  <div className="flex justify-between font-bold border-t border-amber-200 pt-1"><span>KC直接フィー計</span><span className="font-mono">{fmtMan(result.am_total_fee)}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── 右：結果パネル ─── */}
        <div className="space-y-4">
          {/* KPIカード */}
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="総事業費" value={fmtOku(result.total_dev_cost)} sub={`税込 ${fmtOku(result.total_dev_cost_tax)}`} color="default" />
            <KpiCard label="想定売却価格" value={fmtOku(result.exit_price)} sub={`Exit Cap ${input.exit_cap_pct}%`} color="gold" />
            <KpiCard label="NOI" value={fmtOku(result.noi)} sub={`NOI利回り ${pct(result.noi_yield_pct)}`} color="red" />
            <KpiCard label="優先TK IRR" value={pct(result.irr_levered_pct)} sub={`エクイティ ${result.equity_multiple?.toFixed(2) ?? 'N/A'}x`} color="green" />
          </div>

          {/* 総事業費内訳 */}
          <SectionTitle num="01" title="総事業費内訳" />
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {[
              { label: '土地取得原価', val: result.land_acquisition_total, pct: result.land_acquisition_total / result.total_dev_cost * 100 },
              { label: '建築関連原価', val: result.construction_total, pct: result.construction_total / result.total_dev_cost * 100 },
              { label: 'FF&E', val: result.ffe_total, pct: result.ffe_total / result.total_dev_cost * 100 },
              { label: 'その他', val: result.other_total, pct: result.other_total / result.total_dev_cost * 100 },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-red-700 h-1.5 rounded-full" style={{ width: `${Math.min(row.pct, 100)}%` }} />
                  </div>
                  <span className="text-gray-600">{row.label}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-semibold">{fmtOku(row.val)}</span>
                  <span className="text-xs text-gray-400 ml-2">{row.pct.toFixed(1)}%</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-3 bg-gray-900 text-white">
              <span className="font-bold text-sm">総事業費合計（税抜）</span>
              <span className="font-mono font-black text-lg">{fmtOku(result.total_dev_cost)}</span>
            </div>
          </div>

          {/* 客室売上内訳 */}
          <SectionTitle num="02" title="客室売上内訳" />
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-5 gap-0 bg-gray-900 text-white px-3 py-2 font-mono text-xs tracking-wider">
              <span>タイプ</span><span className="text-right">室数</span><span className="text-right">平日ADR</span><span className="text-right">休日ADR</span><span className="text-right">年間売上</span>
            </div>
            {result.room_type_results.map((rt, i) => (
              <div key={i} className="grid grid-cols-5 px-3 py-2 border-b border-gray-100 text-sm">
                <span className="font-medium">{rt.name}</span>
                <span className="text-right text-gray-600">{rt.count}室</span>
                <span className="text-right font-mono">¥{fmt(input.room_types[i]?.weekday_adr ?? 0)}</span>
                <span className="text-right font-mono">¥{fmt(input.room_types[i]?.weekend_adr ?? 0)}</span>
                <span className="text-right font-mono font-semibold">{fmtOku(rt.total_revenue)}</span>
              </div>
            ))}
            <div className="flex justify-between px-3 py-2.5 bg-gray-50 font-bold text-sm">
              <span>年間ブレンド (ADR ¥{fmt(result.blended_adr)} / OCC {result.blended_occ.toFixed(1)}%)</span>
              <span className="font-mono">{fmtOku(result.gor)}</span>
            </div>
          </div>

          {/* P&Lウォーターフォール */}
          <SectionTitle num="03" title="P&L ウォーターフォール" />
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <WaterfallRow label="GOR（運営収入）" value={result.gor} />
            <WaterfallRow label="　－ 運営費合計" value={result.total_op_cost} indent />
            <WaterfallRow label="＝ GOP" value={result.gop} highlight="gold" />
            <div className="text-right text-xs text-gray-400 pr-3 pb-1 font-mono">GOP率 {result.gop_ratio.toFixed(1)}%</div>
            <WaterfallRow label="　－ 運営委託報酬" value={result.management_fee} indent />
            <WaterfallRow label="＝ AGOP（転貸借賃料）" value={result.agop} highlight="gold" />
            <WaterfallRow label="　－ ML業務委託報酬" value={result.ml_fee} indent />
            <WaterfallRow label="＝ オーナー受取賃料" value={result.owner_rent} highlight="gold" />
            <WaterfallRow label="　－ 所有者負担費用" value={result.owner_expenses} indent />
            <WaterfallRow label="＝ NOI" value={result.noi} highlight="pos" />
            <div className="text-right text-xs text-amber-700 pr-3 pb-1 font-mono bg-amber-50">NOI利回り {result.noi_yield_pct.toFixed(2)}%</div>
            <WaterfallRow label="　－ FFEリザーブ＋CAPEX" value={result.ffe_reserve + result.capex} indent />
            <WaterfallRow label="＝ NCF" value={result.ncf} highlight="pos" />
            <div className="text-right text-xs text-amber-700 pr-3 py-1 font-mono bg-amber-50">NCF利回り {result.ncf_yield_pct.toFixed(2)}%</div>
          </div>

          {/* Cap Rate感応度 */}
          <SectionTitle num="04" title="Exit Cap Rate 感応度テーブル" />
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-5 bg-gray-900 text-white px-3 py-2 text-xs font-mono tracking-wider">
              <span>Cap率</span><span className="text-right">売却価格</span><span className="text-right">売却益</span><span className="text-right">レバ前IRR</span><span className="text-right">レバ後IRR</span>
            </div>
            {result.cap_sensitivity.map((row, i) => {
              const isActive = Math.abs(row.cap_pct - input.exit_cap_pct) < 0.05;
              return (
                <div key={i}
                  className={`grid grid-cols-5 px-3 py-2 border-b border-gray-100 text-xs ${isActive ? 'bg-amber-50 font-bold' : 'hover:bg-gray-50'}`}
                >
                  <span className="font-mono">{row.cap_pct.toFixed(1)}%{isActive ? ' ★' : ''}</span>
                  <span className="text-right font-mono">{fmtOku(row.exit_price)}</span>
                  <span className={`text-right font-mono ${row.exit_profit < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {fmtOku(row.exit_profit)}
                  </span>
                  <span className={`text-right font-mono ${(row.irr_unlevered_pct ?? 0) < 0 ? 'text-red-600' : ''}`}>
                    {pct(row.irr_unlevered_pct)}
                  </span>
                  <span className={`text-right font-mono ${(row.irr_levered_pct ?? 0) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {pct(row.irr_levered_pct)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 資本構造 */}
          <SectionTitle num="05" title="資本構造" />
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm space-y-2">
              <div className="font-bold text-xs text-gray-500 font-mono">SENIOR LOAN</div>
              <div className="flex justify-between"><span className="text-gray-600">金額</span><span className="font-mono">{fmtOku(result.senior_loan)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">LTC（取得原価比）</span><span className="font-mono">{input.ltc_pct}%</span></div>
              <div className="flex justify-between"><span className="text-gray-600">金利</span><span className="font-mono">{result.loan_rate_pct.toFixed(2)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-600">内訳</span><span className="font-mono text-xs">{input.loan_base_rate_pct}%+{input.loan_spread_pct}%</span></div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm space-y-2">
              <div className="font-bold text-xs text-gray-500 font-mono">EQUITY</div>
              <div className="flex justify-between"><span className="text-gray-600">優先TK</span><span className="font-mono">{fmtOku(input.priority_tk_man * 10000)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">劣後TK</span><span className="font-mono">{fmtOku(input.sub_tk_man * 10000)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">エクイティ計</span><span className="font-mono">{fmtOku(result.total_equity)}</span></div>
              <div className={`flex justify-between font-bold ${Math.abs(result.equity_gap) > 1000000 ? 'text-red-600' : 'text-emerald-700'}`}>
                <span>差額</span>
                <span className="font-mono">{result.equity_gap > 0 ? '不足 ' : '余剰 '}{fmtOku(Math.abs(result.equity_gap))}</span>
              </div>
            </div>
          </div>

          {/* 資金調達バー */}
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-2">資本構成（総事業費比）</div>
            <div className="flex h-8 rounded overflow-hidden border border-gray-200">
              {[
                { label: `Senior ${(result.senior_loan / result.total_dev_cost * 100).toFixed(0)}%`, pct: result.senior_loan / result.total_dev_cost * 100, color: 'bg-gray-700' },
                { label: `優先TK ${(input.priority_tk_man * 10000 / result.total_dev_cost * 100).toFixed(0)}%`, pct: input.priority_tk_man * 10000 / result.total_dev_cost * 100, color: 'bg-red-700' },
                { label: `劣後TK`, pct: input.sub_tk_man * 10000 / result.total_dev_cost * 100, color: 'bg-amber-500' },
              ].map((seg, i) => (
                <div key={i} className={`${seg.color} flex items-center justify-center text-white text-xs font-mono`} style={{ width: `${seg.pct}%` }}>
                  {seg.pct > 5 ? seg.label : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 注記 */}
      <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 border border-gray-100">
        <b className="text-gray-600">【計算の前提】</b>
        IRR計算はNewton-Raphson法による月次CF収束。レバ後IRRは優先TK視点（Senior Loanの金利を差し引いた後の残余キャッシュフロー＋売却残余を試算）。
        各数値は参考値であり、実際の投資判断にあたっては専門家（不動産鑑定士・公認会計士・弁護士）にご相談ください。
        出典: 霞が関キャピタルCF250303v5__歌舞伎町__20251218.xlsx の分析ロジックに基づく。
      </div>
    </div>
  );
}
