'use client';
import { useState, useMemo, useEffect } from 'react';
import { InvestmentParams, ScrapeResponse } from '@/types';
import { BrandBenchmark, findMatchingBrands } from '@/lib/brand-benchmarks';
import { getSizeBenchmark, adjustOtaToActualAdr } from '@/lib/size-benchmarks';

interface Props {
  params: InvestmentParams;
  data: ScrapeResponse;
}

/** PMT(元利均等返済) — JS実装 */
function pmt(rate: number, nper: number, pv: number): number {
  if (rate === 0) return pv / nper;
  const r = Math.pow(1 + rate, nper);
  return (pv * rate * r) / (r - 1);
}

/** フォーマットユーティリティ */
const yen  = (n: number) => `¥${Math.round(n).toLocaleString()}`;
const man  = (n: number) => `${Math.round(n / 10000).toLocaleString()}万円`;
const pct  = (n: number) => `${n.toFixed(1)}%`;
const yr   = (n: number) => isFinite(n) && n > 0 ? `${n.toFixed(1)}年` : '—';

function calc(p: InvestmentParams, marketADR: number) {
  const totalInvest  = (p.property_price + p.construction_cost) * 10000;
  const loanAmount   = totalInvest * (p.loan_ratio / 100);
  const monthlyRate  = p.interest_rate / 100 / 12;
  const nper         = p.loan_term * 12;
  const monthlyLoan  = pmt(monthlyRate, nper, loanAmount);
  const annualLoan   = monthlyLoan * 12;

  // 必要年間売上（ローン返済 + 運営費 をまかなえる売上）
  const requiredRevenue = annualLoan / (1 - p.operating_cost_ratio / 100);
  // 必要ADR（目標OCCで客室全部を稼働させたとき）
  const requiredADR = requiredRevenue / (p.planned_rooms * 365 * (p.target_occ / 100));

  // 市場ADRでの収支
  const annualRevenue = marketADR * p.planned_rooms * 365 * (p.target_occ / 100);
  const annualOpCost  = annualRevenue * (p.operating_cost_ratio / 100);
  const annualNOI     = annualRevenue - annualOpCost;                  // NOI（純営業利益）
  const annualCF      = annualNOI - annualLoan;                        // キャッシュフロー
  const paybackYears  = annualCF > 0 ? totalInvest / annualCF : Infinity;

  // 損益分岐OCC
  const breakEvenOCC  = requiredRevenue / (marketADR * p.planned_rooms * 365) * 100;

  // 判定
  const ratio = marketADR / requiredADR;
  const verdict: 'green' | 'yellow' | 'red' =
    ratio >= 1.2 ? 'green' :
    ratio >= 0.9 ? 'yellow' : 'red';

  // OCC感度テーブル (50/60/70/80/90%)
  const occTable = [50, 60, 70, 75, 80, 85, 90].map(occ => {
    const rev = marketADR * p.planned_rooms * 365 * (occ / 100);
    const noi = rev * (1 - p.operating_cost_ratio / 100);
    const cf  = noi - annualLoan;
    return { occ, rev, noi, cf };
  });

  return {
    totalInvest, loanAmount, monthlyLoan, annualLoan,
    requiredRevenue, requiredADR, annualRevenue, annualNOI, annualCF,
    paybackYears, breakEvenOCC, verdict, ratio, occTable,
  };
}

interface LandPriceData {
  pricePerSqm: number;
  area: string;
  note: string;
}

export default function InvestmentTab({ params, data }: Props) {
  const [showBrands, setShowBrands] = useState(false);
  const [landPrice, setLandPrice] = useState<LandPriceData | null>(null);
  const { hotels, monthly_stats } = data;

  useEffect(() => {
    if (data.geocoded_lat && data.geocoded_lng && !landPrice) {
      fetch(`/api/land-price?lat=${data.geocoded_lat}&lng=${data.geocoded_lng}`)
        .then(r => r.json())
        .then((d: { ok?: boolean; estimated_land_price_per_sqm?: number; estimated_area?: string; note?: string }) => {
          if (d.ok && d.estimated_land_price_per_sqm !== undefined && d.estimated_area && d.note) {
            setLandPrice({
              pricePerSqm: d.estimated_land_price_per_sqm,
              area: d.estimated_area,
              note: d.note,
            });
          }
        })
        .catch(() => {}); // silent fail
    }
  // landPrice は依存配列から除外（無限ループ防止）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.geocoded_lat, data.geocoded_lng]);

  // エリア平均ADR（加重平均: 平日5/7 + 週末2/7）
  const marketADR = useMemo(() => {
    const statLen = monthly_stats.length || 1;
    return monthly_stats.reduce((s, m) => {
      const weekdayW = (m.weekday_avg ?? 0) * 5;
      const weekendW = (m.weekend_avg ?? m.weekday_avg ?? 0) * 2;
      return s + (weekdayW + weekendW) / 7;
    }, 0) / statLen;
  }, [monthly_stats]);

  // OTA公開価格 → 推定成約価格（-23%補正）で投資試算
  const actualADR = useMemo(() => adjustOtaToActualAdr(marketADR), [marketADR]);

  const r = useMemo(() => calc(params, actualADR), [params, actualADR]);

  const sortedHotels = useMemo(
    () => [...hotels].sort((a, b) => b.price_per_night - a.price_per_night).slice(0, 8),
    [hotels]
  );

  const verdictConfig = {
    green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  badge: 'bg-green-600',  label: '🟢 参入推奨',   sub: '市場ADRが必要ADRを十分に上回っています' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-500', label: '🟡 要検討',     sub: '収支は成立しますが余裕が少ない状態です' },
    red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    badge: 'bg-red-600',    label: '🔴 参入困難',   sub: '現在の市場ADRでは収支が合いません' },
  }[r.verdict];

  return (
    <div className="space-y-5">

      {/* ===== 判定バナー ===== */}
      <div className={`rounded-xl p-5 border-2 ${verdictConfig.bg} ${verdictConfig.border}`}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className={`text-2xl font-bold ${verdictConfig.text}`}>{verdictConfig.label}</p>
            <p className={`text-sm mt-1 ${verdictConfig.text} opacity-80`}>{verdictConfig.sub}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">市場ADR / 必要ADR</p>
            <p className={`text-3xl font-bold ${verdictConfig.text}`}>{(r.ratio * 100).toFixed(0)}%</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniCard label="エリア平均ADR（成約推定）" value={yen(actualADR)} sub={`OTA: ${yen(marketADR)} → -23%`} />
          <MiniCard label="必要ADR" value={yen(r.requiredADR)} sub="損益分岐点" highlight />
          <MiniCard label="損益分岐OCC" value={pct(r.breakEvenOCC)} sub="最低稼働率" />
          <MiniCard label="投資回収年数" value={yr(r.paybackYears)} sub={`CF: ${yen(r.annualCF)}/年`} />
        </div>
      </div>

      {/* ===== 規模帯ベンチマーク（HotelBank 582軒分析） ===== */}
      {(() => {
        const bench = getSizeBenchmark(params.planned_rooms);
        if (!bench) return null;
        // actualADR は外スコープの useMemo 値を直接参照
        const benchColors: Record<string, string> = {
          best:    'bg-green-50 border-green-200',
          good:    'bg-blue-50 border-blue-200',
          caution: 'bg-yellow-50 border-yellow-200',
          avoid:   'bg-red-50 border-red-200',
          na:      'bg-gray-50 border-gray-100',
        };
        const badgeColors: Record<string, string> = {
          best:    'bg-green-600',
          good:    'bg-blue-600',
          caution: 'bg-yellow-500',
          avoid:   'bg-red-600',
          na:      'bg-gray-400',
        };
        const verdictLabels: Record<string, string> = {
          best: '🏆 最適規模帯', good: '✅ 良好', caution: '⚡ 注意', avoid: '⛔ デッドゾーン', na: '—',
        };
        return (
          <div className={`rounded-xl p-4 border ${benchColors[bench.verdict]}`}>
            <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs text-white px-2 py-0.5 rounded-full font-medium ${badgeColors[bench.verdict]}`}>
                    {verdictLabels[bench.verdict]}
                  </span>
                  <span className="text-xs text-gray-600 font-medium">{bench.label}</span>
                </div>
                <p className="text-xs text-gray-700">{bench.note}</p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>出典: HotelBank 2026年582軒分析</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-white/70 rounded-lg p-2">
                <p className="text-gray-500">業界標準ADR（OTA）</p>
                <p className="font-bold text-gray-800">{bench.adr ? `¥${bench.adr.toLocaleString()}` : '—'}</p>
              </div>
              <div className="bg-white/70 rounded-lg p-2">
                <p className="text-gray-500">業界標準ADR（推定成約）</p>
                <p className="font-bold text-gray-800">{bench.adr ? `¥${adjustOtaToActualAdr(bench.adr).toLocaleString()}` : '—'}</p>
                <p className="text-gray-400">OTA比-23%補正</p>
              </div>
              <div className="bg-white/70 rounded-lg p-2">
                <p className="text-gray-500">業界標準OCC</p>
                <p className="font-bold text-gray-800">{bench.occ ? `${bench.occ}%` : '—'}</p>
              </div>
              <div className="bg-white/70 rounded-lg p-2">
                <p className="text-gray-500">業界RevPAR目安</p>
                <p className="font-bold text-gray-800">{bench.revpar ? `¥${bench.revpar.toLocaleString()}` : '—'}</p>
              </div>
            </div>
            {/* OTA補正後ADRとの比較 */}
            <div className="mt-3 text-xs text-gray-600 bg-white/60 rounded-lg px-3 py-2">
              OTA公開価格（加重平均）: <strong>¥{Math.round(marketADR).toLocaleString()}</strong> →
              推定成約価格（試算値）: <strong>¥{Math.round(actualADR).toLocaleString()}</strong>
              {bench.adr && (
                <span className={`ml-2 font-semibold ${actualADR >= bench.adr * 0.9 ? 'text-green-700' : 'text-red-600'}`}>
                  （業界比 {Math.round(actualADR / bench.adr * 100)}%）
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* ===== 投資構造サマリー ===== */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">📐 投資構造</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <Row label="物件価格"      value={man((params.property_price) * 10000)} />
          <Row label="建設・改装費"  value={man((params.construction_cost) * 10000)} />
          <Row label="総投資額"      value={man(r.totalInvest)} bold />
          <Row label="借入額"        value={man(r.loanAmount)} />
          <Row label="月額ローン"    value={yen(r.monthlyLoan)} />
          <Row label="年間ローン"    value={man(r.annualLoan)} bold />
          <Row label="計画客室数"    value={`${params.planned_rooms}室`} />
          <Row label="平均客室面積"  value={`${params.avg_room_size}㎡`} />
          <Row label="目標OCC"       value={pct(params.target_occ)} />
          <Row label="借入金利"      value={pct(params.interest_rate)} />
          <Row label="借入期間"      value={`${params.loan_term}年`} />
          <Row label="運営費率"      value={pct(params.operating_cost_ratio)} />
        </div>
      </div>

      {/* ===== 収支シミュレーション（市場ADR想定） ===== */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">💰 収支シミュレーション（成約ADR {yen(actualADR)} / OTA {yen(marketADR)}・OCC {params.target_occ}%）</h3>
        <div className="space-y-2 text-sm">
          <BarRow label="年間売上（RevPAR × 客室数 × 365）" value={r.annualRevenue}
            max={r.totalInvest} color="bg-blue-400" />
          <BarRow label="年間運営費" value={r.annualRevenue * (params.operating_cost_ratio / 100)}
            max={r.totalInvest} color="bg-orange-300" />
          <BarRow label="NOI（純営業利益）" value={r.annualNOI}
            max={r.totalInvest} color="bg-teal-400" />
          <BarRow label="年間ローン返済" value={r.annualLoan}
            max={r.totalInvest} color="bg-red-300" />
          <div className={`flex items-center justify-between px-3 py-2 rounded-lg font-semibold ${r.annualCF >= 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <span>年間キャッシュフロー</span>
            <span>{yen(r.annualCF)}</span>
          </div>
        </div>
      </div>

      {/* ===== OCC感度テーブル ===== */}
      <div className="bg-white rounded-xl p-4 shadow-sm overflow-x-auto">
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">📊 OCC感度分析（成約ADR固定: {yen(actualADR)}）</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">OCC</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500 font-medium">年間売上</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500 font-medium">NOI</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500 font-medium">CF/年</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500 font-medium">回収年数</th>
              <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">判定</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {r.occTable.map(row => {
              const payback = row.cf > 0 ? r.totalInvest / row.cf : Infinity;
              const isTarget = row.occ === params.target_occ;
              return (
                <tr key={row.occ} className={isTarget ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className={`px-3 py-2 font-medium ${isTarget ? 'text-blue-700' : 'text-gray-700'}`}>
                    {row.occ}%{isTarget && <span className="ml-1 text-xs text-blue-500">◀目標</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">{man(row.rev)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{man(row.noi)}</td>
                  <td className={`px-3 py-2 text-right font-medium ${row.cf >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {row.cf >= 0 ? '+' : ''}{man(row.cf)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">{yr(payback)}</td>
                  <td className="px-3 py-2">
                    {row.cf > 0
                      ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">黒字</span>
                      : <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">赤字</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===== 競合比較（市場ホテル上位5件） ===== */}
      {hotels.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">🏨 エリア競合ホテルとの比較</h3>
          <p className="text-xs text-gray-500 mb-3">
            必要ADR <span className="font-bold text-red-600">{yen(r.requiredADR)}</span> を超えるホテルが参入の目安です
          </p>
          <div className="space-y-2">
            {sortedHotels.map((h, i) => {
              const ratio = h.price_per_night / r.requiredADR;
              const color = ratio >= 1.2 ? 'bg-green-500' : ratio >= 0.9 ? 'bg-yellow-400' : 'bg-red-400';
              const barW  = Math.min(100, Math.round(ratio * 60));
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-4 text-right">{i + 1}</span>
                  <span className="text-xs text-gray-700 truncate w-40">{h.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: `${barW}%` }} />
                  </div>
                  <span className={`text-xs font-medium w-20 text-right ${ratio >= 1.0 ? 'text-green-700' : 'text-red-600'}`}>
                    {yen(h.price_per_night)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-1.5 rounded bg-green-500" /> ADR ≥ 必要ADR×1.2</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-1.5 rounded bg-yellow-400" /> ADR ≥ 必要ADR×0.9</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-1.5 rounded bg-red-400" /> ADR &lt; 必要ADR×0.9</span>
          </div>
        </div>
      )}

      {/* ===== 拡張KPI（HotelBank 9KPI準拠） ===== */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">📊 拡張KPI（HotelBank 9KPI基準）</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {/* ADR */}
          <KpiCard2 label="ADR（OTA公開価格）" value={yen(marketADR)} sub="加重平均（平日5/7+週末2/7）" />
          <KpiCard2 label="ADR（推定成約価格）" value={yen(actualADR)} sub="OTA比-23%補正・試算に使用" highlight />
          {/* RevPAR */}
          <KpiCard2 label="RevPAR（目標OCC）" value={yen(actualADR * (params.target_occ / 100))} sub={`OCC${params.target_occ}%想定`} />
          {/* GOPPAR = GOP ÷ 販売可能客室数 */}
          <KpiCard2 label="GOPPAR" value={yen(r.annualNOI / (params.planned_rooms * 365))} sub="GOP÷販売可能室数÷日数" />
          {/* NRevPAR = (客室売上 - OTA手数料) ÷ 販売可能客室 */}
          <KpiCard2 label="NRevPAR" value={yen(actualADR * (params.target_occ / 100) * 0.85)} sub="OTA手数料15%控除後" />
          {/* TRevPAR (客室以外含まず・簡易) */}
          <KpiCard2 label="ADR/㎡" value={yen(actualADR / params.avg_room_size)} sub={`¥/㎡（${params.avg_room_size}㎡想定）`} />
        </div>
      </div>

      {/* ===== 1人あたり効率・㎡効率 ===== */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          label="1泊1人あたり単価（成約）"
          value={yen(actualADR / params.max_occupancy_per_room)}
          sub={`成約ADR ÷ ${params.max_occupancy_per_room}名`}
          color="text-indigo-700 bg-indigo-50 border-indigo-100"
        />
        <MetricCard
          label="必要㎡単価"
          value={yen(r.requiredADR / params.avg_room_size)}
          sub={`必要ADR ÷ ${params.avg_room_size}㎡`}
          color="text-rose-700 bg-rose-50 border-rose-100"
        />
        <MetricCard
          label="市場㎡単価（成約）"
          value={yen(actualADR / params.avg_room_size)}
          sub={`成約ADR ÷ ${params.avg_room_size}㎡`}
          color="text-teal-700 bg-teal-50 border-teal-100"
        />
      </div>

      {/* ===== 推定地価参照 ===== */}
      {landPrice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h4 className="font-semibold text-amber-800 mb-2">🏗️ 推定地価参照</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-500">エリア区分</span>
              <p className="font-medium text-gray-800">{landPrice.area}</p>
            </div>
            <div>
              <span className="text-gray-500">推定地価単価</span>
              <p className="font-bold text-amber-700">
                ¥{(landPrice.pricePerSqm / 10000).toFixed(0)}万円/㎡
              </p>
            </div>
            <div>
              <span className="text-gray-500">想定土地代 (300㎡)</span>
              <p className="font-bold text-amber-700">
                ¥{((landPrice.pricePerSqm * 300) / 100000000).toFixed(1)}億円
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{landPrice.note}</p>
        </div>
      )}

      {/* ===== ブランドベンチマーク（霞ヶ関キャピタル参照値） ===== */}
      <BrandBenchmarkPanel marketADR={marketADR} actualADR={actualADR} showBrands={showBrands} onToggle={() => setShowBrands(!showBrands)} />

      {/* 注記 */}
      <p className="text-xs text-gray-400 text-right">
        ※本試算は概算です。税務・法務・詳細設計は専門家にご相談ください。
        ブランドベンチマーク値はIR資料・公開情報に基づく参考値です。
      </p>
    </div>
  );
}

/* --- Sub-components --- */

function MiniCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-2.5 ${highlight ? 'bg-white/70' : 'bg-white/50'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-red-700' : 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-50">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`text-gray-800 text-xs ${bold ? 'font-bold' : ''}`}>{value}</span>
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const w = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span className="font-medium text-gray-700">{Math.round(value / 10000).toLocaleString()}万円</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 border ${color}`}>
      <p className="text-xs opacity-70 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs opacity-60 mt-0.5">{sub}</p>
    </div>
  );
}

/* ─── ブランドベンチマークパネル（霞ヶ関キャピタル参照値） ─── */
function BrandBenchmarkPanel({
  marketADR, actualADR, showBrands, onToggle,
}: {
  marketADR: number;
  actualADR: number;
  showBrands: boolean;
  onToggle: () => void;
}) {
  // ブランドマッチングは成約ADRで行う（より実態に近い）
  const brands = findMatchingBrands(actualADR);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🏗️</span>
          <span className="font-semibold text-gray-800 text-sm">
            類似ブランド参照値（霞ヶ関キャピタル IRデータ）
          </span>
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
            {brands.length}ブランド該当
          </span>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${showBrands ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showBrands && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          <p className="text-xs text-gray-500">
            成約推定ADR（{yen(actualADR)} / OTA: {yen(marketADR)}）に近い実在ブランドの実績KPIと1室投資額参考値です。
          </p>
          {brands.length === 0 ? (
            <p className="text-xs text-gray-400">該当するブランドが見つかりませんでした。</p>
          ) : (
            brands.map(b => <BrandCard key={b.id} brand={b} marketADR={actualADR} />)
          )}
        </div>
      )}
    </div>
  );
}

function BrandCard({ brand: b, marketADR }: { brand: BrandBenchmark; marketADR: number }) {
  const adrMatch = Math.round(marketADR / b.typical_adr_weekday * 100);
  const matchColor = adrMatch >= 80 && adrMatch <= 130
    ? 'text-green-700' : 'text-yellow-700';

  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
      <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{b.brand}</p>
          <p className="text-xs text-gray-500">{b.category}</p>
          <p className="text-xs text-gray-400 mt-0.5">{b.concept}</p>
        </div>
        <span className={`text-sm font-bold ${matchColor}`}>
          ADR適合度: {adrMatch}%
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <KpiBox label="標準ADR（平日）"   value={`¥${b.typical_adr_weekday.toLocaleString()}`} />
        <KpiBox label="平均OCC"          value={`${b.typical_occ}%`} />
        <KpiBox label="RevPAR"           value={`¥${b.typical_revpar.toLocaleString()}`} />
        <KpiBox label="GOP率"            value={`${b.gop_ratio}%`} />
        <KpiBox label="損益分岐OCC"      value={`${b.breakeven_occ}%`} />
        <KpiBox label="NOI利回り"        value={`${b.noi_yield_pct}%`} />
        <KpiBox label="1室投資額（地方）" value={`${b.cost_per_room_min.toLocaleString()}〜${b.cost_per_room_max.toLocaleString()}万円`} />
        <KpiBox label="平均客室面積"     value={`${b.avg_room_sqm}㎡`} />
      </div>

      {/* 客室タイプ */}
      <div className="mt-3">
        <p className="text-xs text-gray-500 mb-1.5">客室タイプ構成:</p>
        <div className="flex flex-wrap gap-1.5">
          {b.room_specs.map(r => (
            <span key={r.type_name}
              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {r.type_name} {r.size_sqm}㎡/{r.max_occupancy}名
              （{Math.round(r.ratio * 100)}%）
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-2 text-right">出典: {b.source}</p>
    </div>
  );
}

function KpiBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg p-2 border border-gray-100">
      <p className="text-gray-400 text-xs leading-tight">{label}</p>
      <p className="text-gray-800 font-semibold text-xs mt-0.5">{value}</p>
    </div>
  );
}

function KpiCard2({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg p-2.5 border ${highlight ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
      <p className={`text-xs mb-0.5 ${highlight ? 'text-blue-600' : 'text-gray-500'}`}>{label}</p>
      <p className={`font-bold text-sm ${highlight ? 'text-blue-800' : 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
