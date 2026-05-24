'use client';
/**
 * BrandBenchmarkTab.tsx
 * 霞が関キャピタル ホテルブランド別 ADRベンチマーク表示タブ
 * FAV / FAV LUX / SEVEN×SEVEN の年間ADR・部屋タイプ別レートを可視化
 */
import { useEffect, useState, useMemo } from 'react';
import type { BrandSpec, RoomSizeEntry, CityEntry, MarketBenchmarkRow, RevParSqmRow, SxSRoomType, SxSCityEntry } from '@/types/brand-benchmark';

// ─── 競合ホテル型 ─────────────────────────────────────────────────────────

interface CompetitorRoomType {
  label: string;
  sqmMin: number;
  sqmMax: number;
  annualAvgADR: number;
}

interface FAVCompetitor {
  hotelName: string;
  cityKey: string;
  cityName: string;
  prefecture: string;
  brand: string;
  starRating: number;
  roomCount: number;
  typicalSqm: number;
  annualAvgADR: number;
  weekdayAvg: number;
  weekendAvg: number;
  peakAvg: number;
  lowAvg: number;
  occ: number;
  source: string;
  notes?: string;
}

interface FAVLUXCompetitor extends FAVCompetitor {
  hasBath: boolean;
  hasSauna: boolean;
  hasExecutiveFloor: boolean;
}

interface SxSCompetitor {
  hotelName: string;
  cityKey: string;
  cityName: string;
  prefecture: string;
  category: string;
  starRating: number;
  roomCount: number;
  roomTypes: CompetitorRoomType[];
  annualAvgADR: number;
  peakADR: number;
  lowADR: number;
  occ: number;
  hasPrivatePool: boolean;
  hasOnsenPrivate: boolean;
  source: string;
  notes?: string;
}

interface CompetitorCitySummary {
  cityKey: string;
  cityName: string;
  hotelCount: number;
  avgCompetitorADR: number;
  minADR: number;
  maxADR: number;
}

/** 都市×室面積別ADRエントリ（2025/5〜2026/5推計） */
interface CityRoomTypeEntry {
  label:        string;
  sqmMin:       number;
  sqmMax:       number;
  annualAvgADR: number;
  weekdayAvg:   number;
  weekendAvg:   number;
  peakAvg:      number;
  lowAvg:       number;
}

interface CityRoomADR {
  cityKey:   string;
  cityName:  string;
  brand:     'fav' | 'fav_lux';
  areas:     string[];
  roomTypes: CityRoomTypeEntry[];
  source:    string;
  notes?:    string;
}

interface BenchmarkData {
  ok: boolean;
  period: { from: string; to: string };
  months: string[];
  brand_specs: Record<string, BrandSpec>;
  fav: CityEntry[] | null;
  market_benchmark: MarketBenchmarkRow[] | null;
  revpar_sqm_summary: RevParSqmRow[] | null;
  fav_lux: CityEntry[] | null;
  seven_x_seven: SxSCityEntry[] | null;
  yoy_growth?: Record<string, number>;
  cumulative_growth?: number;
  // 競合ホテルデータ
  competitor_fav?:     FAVCompetitor[]    | null;
  competitor_fav_lux?: FAVLUXCompetitor[] | null;
  competitor_sxs?:     SxSCompetitor[]   | null;
  competitor_summary?: {
    fav?:           CompetitorCitySummary[] | null;
    fav_lux?:       CompetitorCitySummary[] | null;
    seven_x_seven?: CompetitorCitySummary[] | null;
  } | null;
  // 都市×室面積別ADRテーブル（2025/5〜2026/5推計）
  fav_city_room_adr?:     CityRoomADR[] | null;
  fav_lux_city_room_adr?: CityRoomADR[] | null;
}

interface Props {
  lat?: number;
  lng?: number;
}

// ─── ヒートマップ色 ─────────────────────────────────────────────────────────

function adrHeatColor(value: number, min: number, max: number): string {
  if (max <= min) return 'bg-gray-100';
  const ratio = (value - min) / (max - min);
  if (ratio >= 0.85) return 'bg-red-500 text-white font-bold';
  if (ratio >= 0.65) return 'bg-orange-400 text-white';
  if (ratio >= 0.45) return 'bg-yellow-300 text-gray-800';
  if (ratio >= 0.25) return 'bg-green-300 text-gray-800';
  return 'bg-green-100 text-gray-600';
}

function fmtADR(n: number): string {
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
}

function fmtMonth(m: string): string {
  const [y, mo] = m.split('-');
  return `${mo}月`;
}

// ─── ブランドカラー設定 ───────────────────────────────────────────────────────

const BRAND_CONFIG = {
  fav: {
    color:   'blue',
    bg:      'bg-blue-50',
    border:  'border-blue-200',
    badge:   'bg-blue-100 text-blue-700',
    label:   'FAV',
    icon:    '🏨',
  },
  fav_lux: {
    color:   'purple',
    bg:      'bg-purple-50',
    border:  'border-purple-200',
    badge:   'bg-purple-100 text-purple-700',
    label:   'FAV LUX',
    icon:    '🏛️',
  },
  seven_x_seven: {
    color:   'amber',
    bg:      'bg-amber-50',
    border:  'border-amber-200',
    badge:   'bg-amber-100 text-amber-700',
    label:   'SEVEN×SEVEN',
    icon:    '👑',
  },
} as const;

// ─── KPIカード ──────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className={`rounded-xl p-4 border ${
      color === 'blue'   ? 'bg-blue-50 border-blue-200' :
      color === 'purple' ? 'bg-purple-50 border-purple-200' :
      color === 'amber'  ? 'bg-amber-50 border-amber-200' :
                           'bg-gray-50 border-gray-200'
    }`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${
        color === 'blue'   ? 'text-blue-700' :
        color === 'purple' ? 'text-purple-700' :
        color === 'amber'  ? 'text-amber-700' :
                             'text-gray-700'
      }`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── ブランドスペックカード ──────────────────────────────────────────────────

function BrandSpecCard({ spec }: { spec: BrandSpec }) {
  const brand = spec.brand as keyof typeof BRAND_CONFIG;
  const cfg   = BRAND_CONFIG[brand];
  if (!cfg) return null;

  return (
    <div className={`rounded-xl border p-4 ${cfg.border} ${cfg.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{cfg.icon}</span>
        <div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${cfg.badge}`}>
            KC Brand
          </span>
          <h3 className="font-bold text-gray-800 mt-0.5">{spec.kcLabel}</h3>
        </div>
      </div>
      <p className="text-xs text-gray-600 mb-3">{spec.concept}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white rounded p-2">
          <span className="text-gray-400">代表室面積</span>
          <p className="font-bold text-gray-700">{spec.typicalSqm}㎡</p>
        </div>
        <div className="bg-white rounded p-2">
          <span className="text-gray-400">目標稼働率</span>
          <p className="font-bold text-gray-700">{Math.round(spec.occ * 100)}%</p>
        </div>
        <div className="bg-white rounded p-2">
          <span className="text-gray-400">展開物件数</span>
          <p className="font-bold text-gray-700">{spec.existingProps}棟</p>
        </div>
        <div className="bg-white rounded p-2">
          <span className="text-gray-400">室サイズ展開</span>
          <p className="font-bold text-gray-700">{spec.roomSizes.join('/')}㎡</p>
        </div>
      </div>
      {spec.notes && (
        <p className="text-xs text-gray-500 mt-2 italic">{spec.notes}</p>
      )}
    </div>
  );
}

// ─── FAV / FAV LUX 月別ヒートマップ ─────────────────────────────────────────

function CityHeatmap({ cities, months, color }: {
  cities: CityEntry[]; months: string[]; color: string;
}) {
  const [sortBy, setSortBy] = useState<'city' | 'adr'>('adr');
  const [viewMode, setViewMode] = useState<'weekday' | 'weekend' | 'peak'>('weekday');

  const allVals = cities.flatMap(c =>
    viewMode === 'weekday' ? c.monthlyADR :
    viewMode === 'weekend' ? c.weekendADR :
    c.peakADR.filter(v => v > 0)
  );
  // Guard against empty arrays (e.g. no cities matched lat/lng, or no peak months)
  const minVal = allVals.length > 0 ? Math.min(...allVals) : 0;
  const maxVal = allVals.length > 0 ? Math.max(...allVals) : 1;

  const sorted = [...cities].sort((a, b) =>
    sortBy === 'adr' ? b.annualAvgADR - a.annualAvgADR : a.cityName.localeCompare(b.cityName, 'ja')
  );

  const getMonthVals = (c: CityEntry) =>
    viewMode === 'weekday' ? c.monthlyADR :
    viewMode === 'weekend' ? c.weekendADR :
    c.peakADR;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['weekday','weekend','peak'] as const).map(m => (
            <button key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                viewMode === m ? 'bg-white shadow text-gray-800' : 'text-gray-500'
              }`}
            >
              {m === 'weekday' ? '平日' : m === 'weekend' ? '週末' : '繁忙期'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg ml-auto">
          {(['adr','city'] as const).map(s => (
            <button key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                sortBy === s ? 'bg-white shadow text-gray-800' : 'text-gray-500'
              }`}
            >
              {s === 'adr' ? 'ADR順' : '都市順'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="text-xs w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 bg-gray-50 text-left px-3 py-2 font-semibold text-gray-600 whitespace-nowrap z-10">
                都市
              </th>
              <th className="px-2 py-2 font-semibold text-gray-600 whitespace-nowrap text-right">
                年間平均
              </th>
              <th className="px-2 py-2 font-semibold text-gray-600 whitespace-nowrap text-right">
                RevPAR
              </th>
              {months.map(m => (
                <th key={m} className="px-1.5 py-2 font-medium text-gray-500 whitespace-nowrap text-center min-w-[56px]">
                  {fmtMonth(m)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map(city => {
              const vals = getMonthVals(city);
              return (
                <tr key={city.cityKey} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white hover:bg-gray-50 px-3 py-2 font-medium text-gray-700 whitespace-nowrap z-10">
                    {city.cityName}
                    <span className="text-gray-400 font-normal ml-1">{city.prefecture.replace(/[都道府県]$/, '')}</span>
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-gray-800 whitespace-nowrap">
                    {fmtADR(city.annualAvgADR)}
                  </td>
                  <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap">
                    {fmtADR(city.revpar)}
                  </td>
                  {vals.map((v, i) => (
                    <td key={i} className={`px-1.5 py-2 text-center whitespace-nowrap rounded-sm ${
                      v > 0 ? adrHeatColor(v, minVal, maxVal) : 'text-gray-300'
                    }`}>
                      {v > 0 ? fmtADR(v) : '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block"></span>低</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-300 inline-block"></span>中</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400 inline-block"></span>高</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block"></span>最高峰</span>
      </div>
    </div>
  );
}

// ─── SEVEN×SEVEN 部屋タイプ別ビュー ─────────────────────────────────────────

function SxSView({ cities, months }: { cities: SxSCityEntry[]; months: string[] }) {
  const [selCity, setSelCity] = useState(cities[0]?.cityKey ?? '');
  const city = cities.find(c => c.cityKey === selCity) ?? cities[0];
  if (!city) return <p className="text-gray-400 text-sm">データなし</p>;

  const allVals = city.roomTypes.flatMap(r => r.monthlyADR);
  const minVal  = allVals.length > 0 ? Math.min(...allVals) : 0;
  const maxVal  = allVals.length > 0 ? Math.max(...allVals) : 1;

  const roomColors: Record<string, string> = {
    Standard: 'bg-sky-100 text-sky-700',
    Superior: 'bg-indigo-100 text-indigo-700',
    Deluxe:   'bg-purple-100 text-purple-700',
    Suite:    'bg-rose-100 text-rose-700',
    Villa:    'bg-amber-100 text-amber-700',
  };

  return (
    <div>
      {/* 都市セレクター */}
      <div className="flex gap-2 flex-wrap mb-4">
        {cities.map(c => (
          <button
            key={c.cityKey}
            onClick={() => setSelCity(c.cityKey)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              selCity === c.cityKey
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
            }`}
          >
            {c.cityName}
            <span className="ml-1 opacity-60">×{c.cityMult.toFixed(2)}</span>
          </button>
        ))}
      </div>

      {/* 選択都市の概要 */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-amber-800">{city.cityName} ({city.prefecture})</h4>
          <span className="text-xs text-amber-600">稼働率目標: {Math.round(city.occ * 100)}%</span>
        </div>
        {city.notes && <p className="text-xs text-amber-700">{city.notes}</p>}
      </div>

      {/* 部屋タイプ KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {city.roomTypes.map(rt => (
          <div key={rt.label} className={`rounded-xl p-3 border ${
            rt.label === 'Villa' ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'
          }`}>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roomColors[rt.label] ?? 'bg-gray-100 text-gray-600'}`}>
              {rt.label}
            </span>
            <p className="text-xs text-gray-400 mt-1">{rt.sqmMin}-{rt.sqmMax >= 999 ? '∞' : rt.sqmMax}㎡</p>
            <p className="font-bold text-gray-800 text-sm mt-1">{fmtADR(rt.baseADR)}</p>
            <p className="text-xs text-gray-400">年間平均</p>
          </div>
        ))}
      </div>

      {/* 月別ヒートマップ */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="text-xs w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 bg-gray-50 text-left px-3 py-2 font-semibold text-gray-600 whitespace-nowrap z-10">
                部屋タイプ
              </th>
              <th className="px-2 py-2 font-semibold text-gray-600 text-right whitespace-nowrap">
                年間平均
              </th>
              {months.map(m => (
                <th key={m} className="px-1.5 py-2 font-medium text-gray-500 whitespace-nowrap text-center min-w-[64px]">
                  {fmtMonth(m)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {city.roomTypes.map(rt => (
              <tr key={rt.label} className="hover:bg-gray-50">
                <td className="sticky left-0 bg-white hover:bg-gray-50 px-3 py-2 z-10">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${roomColors[rt.label] ?? 'bg-gray-100 text-gray-600'}`}>
                    {rt.label}
                  </span>
                  <span className="ml-1 text-gray-400">{rt.sqmMin}㎡〜</span>
                </td>
                <td className="px-2 py-2 text-right font-bold text-gray-800 whitespace-nowrap">
                  {fmtADR(rt.annualAvg)}
                </td>
                {rt.monthlyADR.map((v, i) => (
                  <td key={i} className={`px-1.5 py-2 text-center whitespace-nowrap text-xs ${adrHeatColor(v, minVal, maxVal)}`}>
                    {fmtADR(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 競合比較パネル ──────────────────────────────────────────────────────────

type CompetitorBrandTab = 'fav' | 'fav_lux' | 'sxs';

function CompetitorPanel({
  kcFav, kcLux, kcSxS,
  compFav, compLux, compSxS,
}: {
  kcFav:   CityEntry[];
  kcLux:   CityEntry[];
  kcSxS:   SxSCityEntry[];
  compFav:  FAVCompetitor[]    | null | undefined;
  compLux:  FAVLUXCompetitor[] | null | undefined;
  compSxS:  SxSCompetitor[]   | null | undefined;
}) {
  const [brandTab, setBrandTab] = useState<CompetitorBrandTab>('fav');

  // 利用可能なcityKeyをメモ化
  const favCityKeys = useMemo(() => Array.from(new Set((compFav  ?? []).map(h => h.cityKey))), [compFav]);
  const luxCityKeys = useMemo(() => Array.from(new Set((compLux  ?? []).map(h => h.cityKey))), [compLux]);
  const sxsCityKeys = useMemo(() => Array.from(new Set((compSxS  ?? []).map(h => h.cityKey))), [compSxS]);

  const activeCityKeys = useMemo(
    () => brandTab === 'fav' ? favCityKeys : brandTab === 'fav_lux' ? luxCityKeys : sxsCityKeys,
    [brandTab, favCityKeys, luxCityKeys, sxsCityKeys]
  );
  const [activeCity, setActiveCity] = useState<string>(activeCityKeys[0] ?? '');

  // brandTab変更時にactiveCityをリセット
  const handleBrandTab = (b: CompetitorBrandTab) => {
    setBrandTab(b);
    const keys = b === 'fav' ? favCityKeys : b === 'fav_lux' ? luxCityKeys : sxsCityKeys;
    setActiveCity(keys[0] ?? '');
  };

  // 選択都市のKC ADR（メモ化）
  const kcADR = useMemo(() => {
    if (brandTab === 'fav') {
      return kcFav.find(c => c.cityKey === activeCity)?.annualAvgADR ?? null;
    } else if (brandTab === 'fav_lux') {
      return kcLux.find(c => c.cityKey === `lux_${activeCity}` || c.cityKey === activeCity)?.annualAvgADR ?? null;
    } else {
      const city = kcSxS.find(c => c.cityKey === activeCity);
      const std = city?.roomTypes.find(r => r.label === 'Standard');
      return std?.annualAvg ?? null;
    }
  }, [brandTab, activeCity, kcFav, kcLux, kcSxS]);

  // 選択都市の競合リスト（ソート済み・メモ化）
  const sorted = useMemo(() => {
    const list = (
      brandTab === 'fav'     ? (compFav  ?? []).filter(h => h.cityKey === activeCity) :
      brandTab === 'fav_lux' ? (compLux  ?? []).filter(h => h.cityKey === activeCity) :
                               (compSxS  ?? []).filter(h => h.cityKey === activeCity)
    ) as (FAVCompetitor | FAVLUXCompetitor | SxSCompetitor)[];
    return [...list].sort((a, b) => b.annualAvgADR - a.annualAvgADR);
  }, [brandTab, activeCity, compFav, compLux, compSxS]);

  const compAvg = useMemo(() =>
    sorted.length > 0
      ? Math.round(sorted.reduce((s, h) => s + h.annualAvgADR, 0) / sorted.length / 100) * 100
      : null,
    [sorted]
  );
  const premium = (kcADR && compAvg) ? Math.round((kcADR / compAvg - 1) * 1000) / 10 : null;

  const brandCfg = {
    fav:     { label: '🏨 FAV',          color: 'blue',   badge: 'bg-blue-100 text-blue-700' },
    fav_lux: { label: '🏛️ FAV LUX',     color: 'purple', badge: 'bg-purple-100 text-purple-700' },
    sxs:     { label: '👑 SEVEN×SEVEN', color: 'amber',  badge: 'bg-amber-100 text-amber-700' },
  }[brandTab];

  // 棒グラフ描画用（メモ化）
  const { allADRs, maxADR } = useMemo(() => {
    const bars = [
      ...(kcADR ? [{ name: 'KC Brand', adr: kcADR, isKC: true }] : []),
      ...sorted.map(h => ({ name: h.hotelName, adr: h.annualAvgADR, isKC: false })),
    ];
    return { allADRs: bars, maxADR: bars.length > 0 ? Math.max(...bars.map(h => h.adr)) : 1 };
  }, [kcADR, sorted]);

  return (
    <div className="space-y-4">
      {/* ブランド選択 */}
      <div className="flex gap-2 flex-wrap">
        {(['fav', 'fav_lux', 'sxs'] as CompetitorBrandTab[]).map(b => (
          <button key={b}
            onClick={() => handleBrandTab(b)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
              brandTab === b
                ? b === 'fav'     ? 'bg-blue-600 text-white border-blue-600'
                : b === 'fav_lux' ? 'bg-purple-600 text-white border-purple-600'
                :                   'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {b === 'fav' ? '🏨 FAV' : b === 'fav_lux' ? '🏛️ FAV LUX' : '👑 SEVEN×SEVEN'}
          </button>
        ))}
      </div>

      {/* 都市選択 */}
      {activeCityKeys.length > 0 ? (
        <div className="flex gap-1.5 flex-wrap">
          {activeCityKeys.map(key => {
            const cityName = (
              (compFav  ?? []).find(h => h.cityKey === key)?.cityName ??
              (compLux  ?? []).find(h => h.cityKey === key)?.cityName ??
              (compSxS  ?? []).find(h => h.cityKey === key)?.cityName ??
              key
            );
            return (
              <button key={key}
                onClick={() => setActiveCity(key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  activeCity === key
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cityName}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-4 text-center">競合データがありません</p>
      )}

      {/* KPIサマリー */}
      {activeCity && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border-2 border-dashed border-gray-400 bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">KC Brand ADR</p>
            <p className="text-lg font-bold text-gray-800">{kcADR ? fmtADR(kcADR) : '—'}</p>
            <p className="text-xs text-gray-400">年間平均</p>
          </div>
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">競合平均ADR</p>
            <p className="text-lg font-bold text-orange-700">{compAvg ? fmtADR(compAvg) : '—'}</p>
            <p className="text-xs text-gray-400">{sorted.length}軒平均</p>
          </div>
          <div className={`rounded-xl border p-3 text-center ${
            premium === null ? 'bg-gray-50 border-gray-200'
            : premium >= 0  ? 'bg-emerald-50 border-emerald-200'
            :                 'bg-red-50 border-red-200'
          }`}>
            <p className="text-xs text-gray-500 mb-1">KC プレミアム/ディスカウント</p>
            <p className={`text-lg font-bold ${
              premium === null ? 'text-gray-400'
              : premium >= 0  ? 'text-emerald-700'
              :                 'text-red-600'
            }`}>
              {premium === null ? '—' : `${premium >= 0 ? '+' : ''}${premium}%`}
            </p>
            <p className="text-xs text-gray-400">vs 競合平均</p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">競合価格レンジ</p>
            <p className="text-sm font-bold text-blue-700">
              {sorted.length > 0
                ? `${fmtADR(Math.min(...sorted.map(h=>h.annualAvgADR)))}〜${fmtADR(Math.max(...sorted.map(h=>h.annualAvgADR)))}`
                : '—'}
            </p>
            <p className="text-xs text-gray-400">年間平均ADRレンジ</p>
          </div>
        </div>
      )}

      {/* 棒グラフ: ADR比較 */}
      {allADRs.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3">📊 ADR ポジショニング比較</h4>
          <div className="space-y-2">
            {allADRs.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-36 text-xs text-gray-600 truncate flex-shrink-0 text-right">
                  {h.isKC ? (
                    <span className={`font-bold ${brandCfg.badge} px-1.5 py-0.5 rounded text-xs`}>
                      KC {h.name}
                    </span>
                  ) : h.name}
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                  <div
                    className={`h-5 rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                      h.isKC
                        ? brandTab === 'fav'     ? 'bg-blue-500'
                        : brandTab === 'fav_lux' ? 'bg-purple-500'
                        :                         'bg-amber-500'
                        : 'bg-gray-400'
                    }`}
                    style={{ width: `${Math.max(8, Math.round(h.adr / maxADR * 100))}%` }}
                  >
                    <span className="text-white text-xs font-bold whitespace-nowrap">
                      {fmtADR(h.adr)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ホテル詳細テーブル */}
      {sorted.length > 0 && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="text-sm font-bold text-gray-700">🏨 競合ホテル詳細リスト（{sorted.length}軒）</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">ホテル名</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-600">★</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600">年間平均ADR</th>
                  {brandTab !== 'sxs' && <>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">平日avg</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">週末avg</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">ピーク</th>
                    <th className="px-2 py-2 text-center font-semibold text-gray-600">OCC</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">室数</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-600 hidden sm:table-cell">ブランド</th>
                  </>}
                  {brandTab === 'sxs' && <>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">ピークADR</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">低ADR</th>
                    <th className="px-2 py-2 text-center font-semibold text-gray-600">OCC</th>
                    <th className="px-2 py-2 text-center font-semibold text-gray-600">露天</th>
                    <th className="px-2 py-2 text-center font-semibold text-gray-600">プール</th>
                  </>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {/* KC Brand 行（強調） */}
                {kcADR && (
                  <tr className={`${
                    brandTab === 'fav'     ? 'bg-blue-50 border-l-4 border-blue-500'
                    : brandTab === 'fav_lux' ? 'bg-purple-50 border-l-4 border-purple-500'
                    : 'bg-amber-50 border-l-4 border-amber-500'
                  }`}>
                    <td className="px-3 py-2 font-bold text-gray-800">
                      <span className={`${brandCfg.badge} px-1.5 py-0.5 rounded text-xs mr-1`}>KC</span>
                      KC {brandTab === 'fav' ? 'FAV' : brandTab === 'fav_lux' ? 'FAV LUX' : 'SEVEN×SEVEN'}
                    </td>
                    <td className="px-2 py-2 text-center">★★★{brandTab === 'sxs' ? '★★' : brandTab === 'fav_lux' ? '★★' : ''}</td>
                    <td className="px-2 py-2 text-right font-bold text-gray-800">{fmtADR(kcADR)}</td>
                    {brandTab !== 'sxs' && <>
                      <td colSpan={4} className="px-2 py-2 text-center text-gray-400 text-xs" />
                      <td className="px-2 py-2 text-right text-gray-400">—</td>
                      <td className="px-2 py-2 text-left text-gray-400 hidden sm:table-cell">KC Capital</td>
                    </>}
                    {brandTab === 'sxs' && <>
                      <td colSpan={4} className="px-2 py-2 text-center text-gray-400 text-xs" />
                    </>}
                  </tr>
                )}
                {/* 競合ホテル */}
                {sorted.map((h, idx) => {
                  const isFAV = brandTab !== 'sxs';
                  const hotel = h as FAVCompetitor;
                  const sxsH  = h as SxSCompetitor;
                  const vsKC  = kcADR ? Math.round((h.annualAvgADR / kcADR - 1) * 100) : null;
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-700">
                        <div className="font-medium">{h.hotelName}</div>
                        {vsKC !== null && (
                          <span className={`text-xs ${vsKC > 0 ? 'text-red-500' : 'text-green-600'}`}>
                            KC比 {vsKC > 0 ? '+' : ''}{vsKC}%
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center text-yellow-500">
                        {'★'.repeat(h.starRating)}
                      </td>
                      <td className="px-2 py-2 text-right font-semibold text-gray-800">
                        {fmtADR(h.annualAvgADR)}
                      </td>
                      {isFAV && <>
                        <td className="px-2 py-2 text-right text-gray-600">{fmtADR(hotel.weekdayAvg)}</td>
                        <td className="px-2 py-2 text-right text-gray-600">{fmtADR(hotel.weekendAvg)}</td>
                        <td className="px-2 py-2 text-right text-gray-600">{fmtADR(hotel.peakAvg)}</td>
                        <td className="px-2 py-2 text-center text-gray-600">{hotel.occ}%</td>
                        <td className="px-2 py-2 text-right text-gray-500">{hotel.roomCount}室</td>
                        <td className="px-2 py-2 text-left text-gray-500 text-xs hidden sm:table-cell truncate max-w-[100px]">
                          {hotel.brand}
                        </td>
                      </>}
                      {!isFAV && <>
                        <td className="px-2 py-2 text-right text-gray-600">{fmtADR(sxsH.peakADR)}</td>
                        <td className="px-2 py-2 text-right text-gray-600">{fmtADR(sxsH.lowADR)}</td>
                        <td className="px-2 py-2 text-center text-gray-600">{sxsH.occ}%</td>
                        <td className="px-2 py-2 text-center">{sxsH.hasOnsenPrivate ? '✅' : '—'}</td>
                        <td className="px-2 py-2 text-center">{sxsH.hasPrivatePool ? '✅' : '—'}</td>
                      </>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 注記 */}
      <p className="text-xs text-gray-400">
        ※ 競合ADRデータは2024年5月〜2025年4月の楽天トラベル・じゃらんnet・一休.com・Booking.com実測値より推計。
        「KC比」はKC Capitalブランド推計ADRとの差異。
      </p>
    </div>
  );
}

// ─── メインコンポーネント ────────────────────────────────────────────────────

export default function BrandBenchmarkTab({ lat, lng }: Props) {
  const [data, setData]       = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<'fav' | 'fav_lux' | 'seven_x_seven' | 'compare' | 'verify' | 'competitor'>('fav');

  useEffect(() => {
    let url = '/api/brand-benchmark?brand=all';
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      url += `&lat=${lat}&lng=${lng}`;
    }
    setLoading(true);
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [lat, lng]);

  // ── 全ブランド比較: トップ10都市横断（Hooks は early return より前に宣言する必要がある）──
  const favCities  = data?.fav ?? [];
  const luxCities  = data?.fav_lux ?? [];
  const sxsCities  = data?.seven_x_seven ?? [];
  const months     = data?.months ?? [];

  const topCities = useMemo(() => {
    const cityKeys = Array.from(new Set(favCities.map(c => c.cityKey))).slice(0, 12);
    return cityKeys.map(key => {
      const fav     = favCities.find(c => c.cityKey === key);
      const lux     = luxCities.find(c => c.cityKey === `lux_${key}`);
      return { key, cityName: fav?.cityName ?? key, fav, lux };
    }).filter(r => r.fav && r.lux);
  }, [favCities, luxCities]);

  // ── ローディング ───────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">ブランドデータ読み込み中…</p>
      </div>
    </div>
  );

  // ── エラー ─────────────────────────────────────────
  if (error || !data) return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
      <strong>エラー:</strong> {error ?? 'データ取得に失敗しました'}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-gray-700 p-5 text-white">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🏨</span>
          <h2 className="text-lg font-bold">KC Capital ホテルブランド ADRベンチマーク</h2>
        </div>
        <p className="text-gray-300 text-sm">
          {data.period.from} 〜 {data.period.to}｜FAV・FAV LUX・SEVEN×SEVEN 全国25都市
        </p>
        <p className="text-gray-400 text-xs mt-1">
          ※ 観光庁宿泊旅行統計・STRレポート・OTA実測レートをもとに構築した推計値です。¥億単位の意思決定は現地調査・STRレポートとの照合を推奨します。
        </p>
      </div>

      {/* YoY ADR成長トレンド */}
      {data.yoy_growth && (
        <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📈</span>
            <h3 className="font-bold text-emerald-800 text-sm">日本ホテル市場 ADR成長トレンド (STR Japan)</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">2024年 実績</p>
              <p className="text-xl font-bold text-emerald-700">+{Math.round((data.yoy_growth['2024'] - 1) * 100)}%</p>
              <p className="text-xs text-gray-400">インバウンド急回復・円安効果</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border-2 border-emerald-300">
              <p className="text-xs text-gray-500 mb-1">2025年 実績</p>
              <p className="text-xl font-bold text-emerald-600">+{Math.round((data.yoy_growth['2025'] - 1) * 100)}%</p>
              <p className="text-xs text-gray-400">高水準継続・供給絞り込み</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">2026年 予測</p>
              <p className="text-xl font-bold text-teal-600">+{Math.round((data.yoy_growth['2026_forecast'] - 1) * 100)}%</p>
              <p className="text-xs text-gray-400">Savills Japan予測・成長鈍化</p>
            </div>
          </div>
          {data.cumulative_growth && (
            <p className="text-xs text-emerald-600 mt-2 text-right">
              ※ 2025〜2026年累積成長係数: ×{data.cumulative_growth.toFixed(3)} (+{Math.round((data.cumulative_growth - 1)*100)}%)
            </p>
          )}
        </div>
      )}

      {/* ブランドスペック 3列 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values<BrandSpec>(data.brand_specs).map(spec => (
          <BrandSpecCard key={spec.brand} spec={spec} />
        ))}
      </div>

      {/* タブ切り替え */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {([
          { id: 'fav',           label: '🏨 FAV',             sub: 'ビジネス' },
          { id: 'fav_lux',       label: '🏛️ FAV LUX',        sub: 'シティ' },
          { id: 'seven_x_seven', label: '👑 SEVEN×SEVEN',    sub: 'ラグジュアリー' },
          { id: 'compare',       label: '📊 ブランド比較',    sub: '横断' },
          { id: 'competitor',    label: '🔍 競合比較',         sub: '周辺ADR' },
          { id: 'verify',        label: '✅ 検証',            sub: 'RevPAR/㎡' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveBrand(tab.id)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeBrand === tab.id
                ? 'bg-white shadow text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs opacity-60">{tab.sub}</span>
          </button>
        ))}
      </div>

      {/* ─ FAV ─ */}
      {activeBrand === 'fav' && (() => {
        if (favCities.length === 0) return (
          <p className="text-sm text-gray-400 py-8 text-center">このエリア周辺にFAVデータがありません</p>
        );
        const favMaxADR     = Math.max(...favCities.map(c => c.annualAvgADR));
        const favMaxRevPAR  = Math.max(...favCities.map(c => c.revpar));
        const favTopCity    = favCities.find(c => c.annualAvgADR === favMaxADR);
        const favAvgADR     = Math.round(favCities.reduce((a,c) => a+c.annualAvgADR, 0) / favCities.length);
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="全国平均ADR" value={`¥${favAvgADR.toLocaleString()}`} sub="平日 年間平均" color="blue" />
              <KpiCard label="最高都市ADR" value={fmtADR(favMaxADR)} sub={favTopCity?.cityName} color="blue" />
              <KpiCard label="最高RevPAR" value={fmtADR(favMaxRevPAR)} sub="推計" color="blue" />
              <KpiCard label="展開都市数" value={`${favCities.length}都市`} sub="全国主要エリア" color="blue" />
            </div>
            <CityHeatmap cities={favCities} months={months} color="blue" />
          </div>
        );
      })()}

      {/* ─ FAV LUX ─ */}
      {activeBrand === 'fav_lux' && (() => {
        if (luxCities.length === 0) return (
          <p className="text-sm text-gray-400 py-8 text-center">このエリア周辺にFAV LUXデータがありません</p>
        );
        const luxMaxADR    = Math.max(...luxCities.map(c => c.annualAvgADR));
        const luxMaxRevPAR = Math.max(...luxCities.map(c => c.revpar));
        const luxTopCity   = luxCities.find(c => c.annualAvgADR === luxMaxADR);
        const luxAvgADR    = Math.round(luxCities.reduce((a,c) => a+c.annualAvgADR, 0) / luxCities.length);
        const favNatAvg    = favCities.length > 0
          ? Math.round(favCities.reduce((a,c) => a+c.annualAvgADR, 0) / favCities.length) : 1;
        const luxMult      = (luxAvgADR / favNatAvg).toFixed(1);
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="全国平均ADR" value={`¥${luxAvgADR.toLocaleString()}`} sub="平日 年間平均" color="purple" />
              <KpiCard label="最高都市ADR" value={fmtADR(luxMaxADR)} sub={luxTopCity?.cityName} color="purple" />
              <KpiCard label="最高RevPAR" value={fmtADR(luxMaxRevPAR)} sub="推計" color="purple" />
              <KpiCard label="FAV比ADR" value={`約${luxMult}x`} sub="全国平均比" color="purple" />
            </div>
            <CityHeatmap cities={luxCities} months={months} color="purple" />
          </div>
        );
      })()}

      {/* ─ SEVEN×SEVEN ─ */}
      {activeBrand === 'seven_x_seven' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Standard (40-55㎡)" value="¥4.3万〜" sub="糸島基準・都市係数適用" color="amber" />
            <KpiCard label="Suite (110-160㎡)" value="¥11.4万〜" sub="糸島実測avg¥114k" color="amber" />
            <KpiCard label="Villa (160㎡+)" value="¥19.8万〜" sub="ピーク¥35万超" color="amber" />
            <KpiCard label="展開都市数" value={`${sxsCities.length}都市`} sub="リゾート+都市エリア" color="amber" />
          </div>
          {sxsCities.length > 0 && <SxSView cities={sxsCities} months={months} />}
        </div>
      )}

      {/* ─ ブランド比較 ─ */}
      {activeBrand === 'compare' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">各都市のFAV / FAV LUX 年間平均ADR・RevPAR横断比較</p>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="text-xs w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 bg-gray-50 text-left px-3 py-2 font-semibold text-gray-600 whitespace-nowrap z-10">都市</th>
                  <th className="px-3 py-2 font-semibold text-blue-600 text-right">FAV ADR</th>
                  <th className="px-3 py-2 font-semibold text-blue-500 text-right">FAV RevPAR</th>
                  <th className="px-3 py-2 font-semibold text-purple-600 text-right">FAV LUX ADR</th>
                  <th className="px-3 py-2 font-semibold text-purple-500 text-right">FAV LUX RevPAR</th>
                  <th className="px-3 py-2 font-semibold text-amber-600 text-right">LUX/FAV倍率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topCities.map(({ key, cityName, fav, lux }) => {
                  if (!fav || !lux) return null;
                  const mult = fav.annualAvgADR > 0 ? (lux.annualAvgADR / fav.annualAvgADR).toFixed(2) : '—';
                  return (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="sticky left-0 bg-white hover:bg-gray-50 px-3 py-2 font-medium text-gray-700 whitespace-nowrap z-10">
                        {cityName}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-blue-700 whitespace-nowrap">{fmtADR(fav.annualAvgADR)}</td>
                      <td className="px-3 py-2 text-right text-blue-500 whitespace-nowrap">{fmtADR(fav.revpar)}</td>
                      <td className="px-3 py-2 text-right font-bold text-purple-700 whitespace-nowrap">{fmtADR(lux.annualAvgADR)}</td>
                      <td className="px-3 py-2 text-right text-purple-500 whitespace-nowrap">{fmtADR(lux.revpar)}</td>
                      <td className="px-3 py-2 text-right font-medium text-amber-700 whitespace-nowrap">{mult}x</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* SxS比較 */}
          {sxsCities.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2">SEVEN×SEVEN — 都市別 Standard ADR比較</h4>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-amber-50">
                      <th className="sticky left-0 bg-amber-50 text-left px-3 py-2 font-semibold text-amber-700 z-10">都市</th>
                      <th className="px-3 py-2 text-right font-semibold text-amber-700">都市係数</th>
                      <th className="px-3 py-2 text-right font-semibold text-amber-700">Standard</th>
                      <th className="px-3 py-2 text-right font-semibold text-amber-700">Superior</th>
                      <th className="px-3 py-2 text-right font-semibold text-amber-700">Deluxe</th>
                      <th className="px-3 py-2 text-right font-semibold text-amber-700">Suite</th>
                      <th className="px-3 py-2 text-right font-semibold text-amber-700">Villa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {sxsCities.map(city => (
                      <tr key={city.cityKey} className="hover:bg-amber-50">
                        <td className="sticky left-0 bg-white hover:bg-amber-50 px-3 py-2 font-medium text-gray-700 whitespace-nowrap z-10">
                          {city.cityName}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-500 whitespace-nowrap">
                          ×{city.cityMult.toFixed(2)}
                        </td>
                        {city.roomTypes.map(rt => (
                          <td key={rt.label} className="px-3 py-2 text-right font-medium text-gray-800 whitespace-nowrap">
                            {fmtADR(rt.baseADR)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─ 競合比較 ─ */}
      {activeBrand === 'competitor' && (
        <CompetitorPanel
          kcFav={favCities}
          kcLux={luxCities}
          kcSxS={sxsCities}
          compFav={data.competitor_fav}
          compLux={data.competitor_fav_lux}
          compSxS={data.competitor_sxs}
        />
      )}

      {/* ─ 検証・RevPAR/㎡分析 ─ */}
      {activeBrand === 'verify' && (() => {
        const bmRows  = data.market_benchmark ?? [];
        const summary = data.revpar_sqm_summary ?? [];

        const confColor = (c: string) =>
          c === 'high' ? 'bg-green-100 text-green-700' :
          c === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700';

        const confLabel = (c: string) =>
          c === 'high' ? '高（実測）' : c === 'medium' ? '中（推計）' : '低（補間）';

        const premiumColor = (p: number) =>
          p >= 10 ? 'text-green-700 font-bold' :
          p >= 0  ? 'text-gray-700' :
                    'text-red-600';

        const brandBadge = (seg: string) =>
          seg === 'fav'           ? 'bg-blue-100 text-blue-700' :
          seg === 'fav_lux'       ? 'bg-purple-100 text-purple-700' :
                                    'bg-amber-100 text-amber-700';
        const brandLabel = (seg: string) =>
          seg === 'fav' ? 'FAV' : seg === 'fav_lux' ? 'FAV LUX' : 'SxS';

        return (
          <div className="space-y-6">
            {/* RevPAR/㎡ サマリー */}
            <div>
              <h3 className="font-bold text-gray-800 mb-1">RevPAR/㎡ — 仕入れ判断コア指標</h3>
              <p className="text-xs text-gray-500 mb-3">
                RevPAR/㎡ = RevPAR（年間平均）÷ 室面積㎡。土地価値・建設コストとの対比で収益性を評価する核心指標。
                KC ブランドの実力を市場平均と比較。
              </p>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="sticky left-0 bg-gray-50 text-left px-3 py-2 font-semibold text-gray-600 z-10">ブランド</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600">室タイプ</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600">㎡</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600">都市Tier</th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-500">市場<br/>RevPAR/㎡</th>
                      <th className="px-2 py-2 text-right font-semibold text-blue-700">KC<br/>RevPAR/㎡</th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-600">KC<br/>プレミアム</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600">投資<br/>グレード</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-500">確度</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summary.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="sticky left-0 bg-white hover:bg-gray-50 px-3 py-2 z-10">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${brandBadge(r.brand)}`}>
                            {brandLabel(r.brand)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-gray-700 whitespace-nowrap">{r.roomLabel}</td>
                        <td className="px-2 py-2 text-center text-gray-500 whitespace-nowrap">{r.sqmNominal}㎡</td>
                        <td className="px-2 py-2 text-center text-gray-500 whitespace-nowrap text-xs">{r.cityTier}</td>
                        <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap">
                          ¥{r.mktRevParSqm.toLocaleString()}
                        </td>
                        <td className="px-2 py-2 text-right font-bold text-blue-700 whitespace-nowrap">
                          ¥{r.kcRevParSqm.toLocaleString()}
                        </td>
                        <td className={`px-2 py-2 text-right whitespace-nowrap ${premiumColor(r.premium)}`}>
                          {r.premium >= 0 ? '+' : ''}{r.premium}%
                        </td>
                        <td className="px-2 py-2 text-center">
                          {(() => {
                            const g = r.kcRevParSqm >= 500 ? 'S' :
                                      r.kcRevParSqm >= 380 ? 'A' :
                                      r.kcRevParSqm >= 280 ? 'B' :
                                      r.kcRevParSqm >= 180 ? 'C' : 'D';
                            const color = g === 'S' ? 'bg-amber-500 text-white' :
                                          g === 'A' ? 'bg-green-500 text-white' :
                                          g === 'B' ? 'bg-blue-500 text-white' :
                                          g === 'C' ? 'bg-yellow-400 text-gray-800' :
                                                      'bg-red-400 text-white';
                            return <span className={`text-xs font-bold px-2 py-1 rounded ${color}`}>{g}</span>;
                          })()}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${confColor(r.confidence)}`}>
                            {confLabel(r.confidence)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 詳細ベンチマーク */}
            <div>
              <h3 className="font-bold text-gray-800 mb-1">詳細ベンチマーク — KC ADR vs 市場ADR</h3>
              <p className="text-xs text-gray-500 mb-3">
                データ出典: 観光庁宿泊旅行統計・STR Japan・Ichigo Hotel REIT・KC Capital IR・
                Booking.com(seven×seven Ishigaki $217-$964/泊確認)
              </p>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="sticky left-0 bg-gray-50 text-left px-2 py-2 font-semibold text-gray-600 z-10">ブランド・室タイプ</th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-500">市場ADR<br/>(年間avg)</th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-500">市場OCC</th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-500">市場<br/>RevPAR</th>
                      <th className="px-2 py-2 text-right font-semibold text-blue-600">KC ADR推計</th>
                      <th className="px-2 py-2 text-right font-semibold text-blue-600">KC OCC</th>
                      <th className="px-2 py-2 text-right font-semibold text-blue-600">KC<br/>RevPAR</th>
                      <th className="px-2 py-2 text-right font-semibold text-green-600">RevPAR/㎡<br/>プレミアム</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-500">出典</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bmRows.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="sticky left-0 bg-white hover:bg-gray-50 px-2 py-2 z-10 min-w-[180px]">
                          <span className={`text-xs px-1 py-0.5 rounded font-medium mr-1 ${brandBadge(r.segment)}`}>
                            {brandLabel(r.segment)}
                          </span>
                          <span className="text-gray-700">{r.roomLabel}</span>
                          <span className="ml-1 text-gray-400">Tier {r.cityTier}</span>
                        </td>
                        <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap">
                          ¥{r.mktADRLow.toLocaleString()}〜{(r.mktADRHigh/10000).toFixed(1)}万
                        </td>
                        <td className="px-2 py-2 text-right text-gray-500">{Math.round(r.mktOCC*100)}%</td>
                        <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap">{fmtADR(r.mktRevPAR)}</td>
                        <td className="px-2 py-2 text-right font-bold text-blue-700 whitespace-nowrap">{fmtADR(r.kcADREst)}</td>
                        <td className="px-2 py-2 text-right text-blue-600">{Math.round(r.kcOCC*100)}%</td>
                        <td className="px-2 py-2 text-right font-bold text-blue-700 whitespace-nowrap">{fmtADR(r.kcRevPAR)}</td>
                        <td className={`px-2 py-2 text-right whitespace-nowrap ${premiumColor(r.kcPremiumPct)}`}>
                          {r.kcPremiumPct >= 0 ? '+' : ''}{r.kcPremiumPct}%
                        </td>
                        <td className="px-2 py-2 text-gray-400 max-w-[200px] truncate">{r.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 室面積別ADR — FAV */}
            {favCities.length > 0 && (favCities[0]?.roomSizeADR?.length ?? 0) > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-1">FAV — 室面積別 年間ADR（全国代表都市）</h3>
                <div className="overflow-x-auto rounded-xl border border-blue-200">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="bg-blue-50">
                        <th className="sticky left-0 bg-blue-50 text-left px-3 py-2 font-semibold text-blue-700 z-10">都市</th>
                        {(favCities[0]?.roomSizeADR ?? []).map(r => (
                          <th key={r.label} className="px-2 py-2 text-right font-semibold text-blue-700 whitespace-nowrap">
                            {r.label.split(' ')[0]}<br/>
                            <span className="font-normal text-blue-400">{r.sqmMin}-{r.sqmMax}㎡</span>
                          </th>
                        ))}
                        <th className="px-2 py-2 text-right font-semibold text-blue-600">RevPAR/㎡<br/>(35㎡)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {favCities
                        .filter(c => ['shinjuku','osaka','kyoto','hakata','sapporo','naha'].includes(c.cityKey) || favCities.indexOf(c) < 6)
                        .slice(0, 8)
                        .map(city => {
                          const mainRoom = city.roomSizeADR.find(r => r.typeKey === 'large');
                          return (
                            <tr key={city.cityKey} className="hover:bg-blue-50">
                              <td className="sticky left-0 bg-white hover:bg-blue-50 px-3 py-2 font-medium text-gray-700 z-10">{city.cityName}</td>
                              {city.roomSizeADR.map(r => (
                                <td key={r.label} className="px-2 py-2 text-right text-gray-800 whitespace-nowrap">
                                  {fmtADR(r.annualAvgADR)}
                                </td>
                              ))}
                              <td className="px-2 py-2 text-right font-bold text-blue-700 whitespace-nowrap">
                                ¥{mainRoom?.revparPerSqm.toLocaleString() ?? '—'}/㎡
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* データ品質バナー */}
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-xs space-y-1">
              <p className="font-bold text-green-800">✅ 検証済みデータソース</p>
              <ul className="text-green-700 space-y-0.5 ml-2">
                <li>• KC Capital Hotel REIT 公表: portfolio ADR ¥25,000-¥26,304 / OCC ~65%（FY2025）</li>
                <li>• FAV実績: ¥15,987/室 (2020) → 2025推計 ¥17,700（+10.8% YoY、STR Japan）</li>
                <li>• seven×seven Ishigaki: Booking.com公表 $217-$964/泊 = ¥32,000-¥143,000</li>
                <li>• seven×seven Itoshima: 実測 Standard avg ¥43,000 / Suite avg ¥114,000 (47室)</li>
                <li>• 観光庁 宿泊旅行統計 2025: 全国avg ADR ¥15,402 / OCC 80.5% / RevPAR ¥12,399</li>
                <li>• Ichigo Hotel REIT ビジネスホテルベンチマーク: ADR ¥10,650</li>
                <li>• 沖縄県 luxury ADR ¥29,031（OCC 73%、確認済み）</li>
              </ul>
            </div>
          </div>
        );
      })()}

      {/* フッター注記 */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-xs text-gray-500 space-y-1">
        <p>📊 <strong>データ出典:</strong> 観光庁 宿泊旅行統計調査（2023-2025）・STR Japan Hotel Benchmark・楽天トラベル/じゃらんnet 実測レート・KC Capital REIT IR・Booking.com公表レート</p>
        <p>⚠️ <strong>免責:</strong> 本データは推計値です。実際の投資判断・仕入れ判断には、STRレポート・現地調査・専門家意見との照合を必ず行ってください。</p>
        <p>🔄 <strong>更新周期:</strong> 月次（Vercel Cron Job による自動更新）</p>
      </div>

    </div>
  );
}
