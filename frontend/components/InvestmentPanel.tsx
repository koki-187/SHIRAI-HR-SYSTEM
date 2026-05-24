'use client';
import { useState } from 'react';
import { InvestmentParams } from '@/types';
import { getSizeBenchmark, getBenchmarkOCC, CONSTRUCTION_COST_NOTE } from '@/lib/size-benchmarks';

interface Props {
  onUpdate: (params: InvestmentParams | null) => void;
}

const DEFAULT: InvestmentParams = {
  property_price: 5000,
  construction_cost: 3000,
  planned_rooms: 30,
  avg_room_size: 20,
  max_occupancy_per_room: 2,
  loan_ratio: 90,
  interest_rate: 2.5,
  loan_term: 20,
  target_occ: 75,
  operating_cost_ratio: 60,
};

export default function InvestmentPanel({ onUpdate }: Props) {
  const [open, setOpen] = useState(true);
  const [params, setParams] = useState<InvestmentParams>(DEFAULT);
  const [active, setActive] = useState(false);

  const set = (key: keyof InvestmentParams, val: string) => {
    setParams(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
  };

  const apply = () => {
    setActive(true);
    onUpdate(params);
  };

  const clear = () => {
    setActive(false);
    onUpdate(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* ヘッダー（トグル） */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🏗️</span>
          <span className="font-semibold text-gray-800 text-sm">仕入れ判断モード</span>
          {active && (
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">ON</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-3">
          <p className="text-xs text-gray-500">物件情報を入力すると「投資判断」タブに結果が表示されます。</p>

          {/* 物件価格・建設費 */}
          <div className="grid grid-cols-2 gap-2">
            <Field label="物件価格（万円）" value={params.property_price}
              onChange={v => set('property_price', v)} />
            <Field label="建設・改装費（万円）" value={params.construction_cost}
              onChange={v => set('construction_cost', v)} />
          </div>

          {/* 建設費トレンド注記 */}
          <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
            ⚠️ {CONSTRUCTION_COST_NOTE.trend}（{CONSTRUCTION_COST_NOTE.avg_rooms}）
          </p>

          {/* 客室 */}
          <div className="grid grid-cols-3 gap-2">
            <Field label="計画客室数" value={params.planned_rooms}
              onChange={v => {
                const n = parseFloat(v) || 0;
                // 客室数変更時にベンチマークOCCを自動設定
                const benchOcc = getBenchmarkOCC(n);
                setParams(prev => ({ ...prev, planned_rooms: n, target_occ: benchOcc }));
              }} min={1} step={1} />
            <Field label="平均面積（㎡）" value={params.avg_room_size}
              onChange={v => set('avg_room_size', v)} />
            <Field label="定員/室" value={params.max_occupancy_per_room}
              onChange={v => set('max_occupancy_per_room', v)} min={1} step={1} />
          </div>

          {/* 規模帯ベンチマーク表示 */}
          {(() => {
            const bench = getSizeBenchmark(params.planned_rooms);
            if (!bench) return null;
            const colors: Record<string, string> = {
              best:    'bg-green-50 border-green-200 text-green-800',
              good:    'bg-blue-50 border-blue-200 text-blue-800',
              caution: 'bg-yellow-50 border-yellow-200 text-yellow-800',
              avoid:   'bg-red-50 border-red-200 text-red-800',
              na:      'bg-gray-50 border-gray-200 text-gray-600',
            };
            return (
              <div className={`text-xs rounded px-3 py-2 border ${colors[bench.verdict]}`}>
                <div className="font-semibold mb-0.5">
                  [{bench.label}] {bench.adr ? `業界ADR ¥${bench.adr.toLocaleString()}` : ''}{bench.occ ? ` / OCC ${bench.occ}%` : ''}
                </div>
                <div className="opacity-80">{bench.note}</div>
                <div className="opacity-60 mt-0.5">出典: HotelBank 2026年582軒分析</div>
              </div>
            );
          })()}

          {/* ローン */}
          <div className="grid grid-cols-3 gap-2">
            <Field label="借入比率（%）" value={params.loan_ratio}
              onChange={v => set('loan_ratio', v)} min={0} max={100} />
            <Field label="金利（%）" value={params.interest_rate}
              onChange={v => set('interest_rate', v)} step={0.1} />
            <Field label="期間（年）" value={params.loan_term}
              onChange={v => set('loan_term', v)} min={1} step={1} />
          </div>

          {/* 運営 */}
          <div className="grid grid-cols-2 gap-2">
            <Field label="目標OCC（%）" value={params.target_occ}
              onChange={v => set('target_occ', v)} min={1} max={100} />
            <Field label="運営費率（%）" value={params.operating_cost_ratio}
              onChange={v => set('operating_cost_ratio', v)} min={0} max={100} />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={apply}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg font-medium transition"
            >
              試算する
            </button>
            {active && (
              <button
                onClick={clear}
                className="px-3 border border-gray-300 text-gray-500 hover:text-gray-700 text-sm py-2 rounded-lg transition"
              >
                クリア
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, min = 0, max, step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-0.5 leading-tight">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
    </div>
  );
}
