'use client';
import { useState, useMemo } from 'react';
import { ScrapeResponse } from '@/types';

interface HistoryEntry {
  id: string;
  location: string;
  search_address: string;
  result: ScrapeResponse;
}

interface Props {
  histories: HistoryEntry[];
}

interface RowData {
  id: string;
  searchAddress: string;
  avgAdr: number;
  actualAdr: number;
  revpar: number;
  hotelCount: number;
  seasonalVariation: number;
  reliability: 'high' | 'medium' | 'low';
  score: number;
}

type SortKey = keyof RowData;

function calcWeightedAdr(result: ScrapeResponse): number {
  const stats = result.monthly_stats;
  if (!stats || stats.length === 0) return 0;
  const total = stats.reduce((s, m) => {
    const wd = (m.weekday_avg ?? 0) * 5;
    const we = (m.weekend_avg ?? m.weekday_avg ?? 0) * 2;
    return s + (wd + we) / 7;
  }, 0);
  return total / stats.length;
}

function calcSeasonalVariation(result: ScrapeResponse, avgAdr: number): number {
  const stats = result.monthly_stats;
  if (!stats || stats.length < 2 || avgAdr === 0) return 0;
  const monthlyAdrs = stats.map(m => {
    const wd = (m.weekday_avg ?? 0) * 5;
    const we = (m.weekend_avg ?? m.weekday_avg ?? 0) * 2;
    return (wd + we) / 7;
  });
  const maxAdr = Math.max(...monthlyAdrs);
  const minAdr = Math.min(...monthlyAdrs);
  return ((maxAdr - minAdr) / avgAdr) * 100;
}

function calcReliability(result: ScrapeResponse): 'high' | 'medium' | 'low' {
  const monthCount = result.monthly_stats?.length ?? 0;
  if (monthCount >= 10) return 'high';
  if (monthCount >= 6) return 'medium';
  return 'low';
}

function calcScore(
  actualAdr: number,
  monthCount: number,
  seasonalVariation: number,
  hotelCount: number,
): number {
  // ADR達成率スコア (40点)
  const adrScore = Math.min(actualAdr / 15000, 1) * 40;
  // データ信頼度スコア (25点)
  const reliabilityScore = (monthCount / 12) * 25;
  // 需要安定性スコア (20点)
  const stabilityScore = (1 - seasonalVariation / 100) * 20;
  // 競合希少性スコア (15点)
  const rarityScore = Math.max(0, 15 - hotelCount * 0.5);

  return Math.round(adrScore + reliabilityScore + stabilityScore + rarityScore);
}

function buildRowData(entry: HistoryEntry): RowData {
  const result = entry.result;
  const avgAdr = calcWeightedAdr(result);
  const actualAdr = avgAdr * 0.77;
  const revpar = actualAdr * 0.73;
  const hotelCount = result.hotels?.length ?? 0;
  const seasonalVariation = calcSeasonalVariation(result, avgAdr);
  const reliability = calcReliability(result);
  const monthCount = result.monthly_stats?.length ?? 0;
  const score = calcScore(actualAdr, monthCount, seasonalVariation, hotelCount);

  return {
    id: entry.id,
    searchAddress: entry.search_address,
    avgAdr,
    actualAdr,
    revpar,
    hotelCount,
    seasonalVariation,
    reliability,
    score,
  };
}

function ReliabilityBadge({ value }: { value: 'high' | 'medium' | 'low' }) {
  const config = {
    high:   { label: '高', cls: 'bg-green-100 text-green-700' },
    medium: { label: '中', cls: 'bg-yellow-100 text-yellow-700' },
    low:    { label: '低', cls: 'bg-red-100 text-red-600' },
  }[value];
  const ariaLabel =
    value === 'high' ? '高' : value === 'medium' ? '中' : '低';
  return (
    <span
      aria-label={`データ信頼度: ${ariaLabel}`}
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.cls}`}
    >
      {config.label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const config =
    score >= 75 ? { label: '優良', cls: 'bg-green-100 text-green-700 font-bold' } :
    score >= 50 ? { label: '良好', cls: 'bg-blue-100 text-blue-700 font-bold' } :
    score >= 30 ? { label: '要検討', cls: 'bg-yellow-100 text-yellow-700 font-bold' } :
                  { label: '非推奨', cls: 'bg-red-100 text-red-600 font-bold' };
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        aria-label={`仕入れスコア: ${score}点 ${config.label}`}
        className="text-base font-bold text-gray-800"
      >
        {score}点
      </span>
      <span aria-hidden="true" className={`text-xs px-1.5 py-0.5 rounded-full ${config.cls}`}>
        {config.label}
      </span>
    </div>
  );
}

function SortIcon({ active, asc }: { active: boolean; asc: boolean }) {
  return (
    <span className="ml-1 text-xs">
      {active ? (asc ? '▲' : '▼') : '⇅'}
    </span>
  );
}

const yen = (n: number) => `¥${Math.round(n).toLocaleString()}`;

export default function MultiAreaCompare({ histories }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortAsc, setSortAsc] = useState(false);

  const rows = useMemo<RowData[]>(() => {
    return histories.map(buildRowData);
  }, [histories]);

  const sorted = useMemo<RowData[]>(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortAsc ? av - bv : bv - av;
      }
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return 0;
    });
  }, [rows, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev: boolean) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const thClass = (key: SortKey) =>
    `px-3 py-2 text-left text-xs font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700 whitespace-nowrap`;

  if (histories.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
        <p className="text-3xl mb-3">📊</p>
        <p className="text-sm">履歴に調査データがありません</p>
        <p className="text-xs mt-1">エリア調査を実行すると、ここで複数エリアを比較できます。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 text-sm">📊 多エリア横断比較</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          列ヘッダーをクリックでソート切替 / 仕入れスコア降順がデフォルト
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className={thClass('searchAddress')} onClick={() => handleSort('searchAddress')}>
                エリア名<SortIcon active={sortKey === 'searchAddress'} asc={sortAsc} />
              </th>
              <th className={thClass('avgAdr')} onClick={() => handleSort('avgAdr')}>
                平均ADR<SortIcon active={sortKey === 'avgAdr'} asc={sortAsc} />
              </th>
              <th className={thClass('actualAdr')} onClick={() => handleSort('actualAdr')}>
                成約推定ADR<SortIcon active={sortKey === 'actualAdr'} asc={sortAsc} />
              </th>
              <th className={thClass('revpar')} onClick={() => handleSort('revpar')}>
                RevPAR推定<SortIcon active={sortKey === 'revpar'} asc={sortAsc} />
              </th>
              <th className={thClass('hotelCount')} onClick={() => handleSort('hotelCount')}>
                競合ホテル数<SortIcon active={sortKey === 'hotelCount'} asc={sortAsc} />
              </th>
              <th className={thClass('seasonalVariation')} onClick={() => handleSort('seasonalVariation')}>
                季節変動係数<SortIcon active={sortKey === 'seasonalVariation'} asc={sortAsc} />
              </th>
              <th className={thClass('reliability')} onClick={() => handleSort('reliability')}>
                データ信頼度<SortIcon active={sortKey === 'reliability'} asc={sortAsc} />
              </th>
              <th className={thClass('score')} onClick={() => handleSort('score')}>
                仕入れスコア<SortIcon active={sortKey === 'score'} asc={sortAsc} />
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap">
                アクション
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((row: RowData) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-3 text-gray-800 font-medium max-w-[180px] truncate">
                  {row.searchAddress}
                </td>
                <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                  {yen(row.avgAdr)}
                </td>
                <td className="px-3 py-3 text-blue-700 font-medium whitespace-nowrap">
                  {yen(row.actualAdr)}
                  <span className="text-gray-400 text-xs ml-1">(-23%)</span>
                </td>
                <td className="px-3 py-3 text-teal-700 font-medium whitespace-nowrap">
                  {yen(row.revpar)}
                </td>
                <td className="px-3 py-3 text-gray-700 text-center">
                  {row.hotelCount}
                </td>
                <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                  {row.seasonalVariation.toFixed(1)}%
                </td>
                <td className="px-3 py-3">
                  <ReliabilityBadge value={row.reliability} />
                </td>
                <td className="px-3 py-3">
                  <ScoreBadge score={row.score} />
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => {
                      const entry = histories.find(h => h.id === row.id);
                      if (entry) {
                        window.dispatchEvent(
                          new CustomEvent('hotelscope:select-history', { detail: entry })
                        );
                      }
                    }}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                  >
                    詳細表示
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
