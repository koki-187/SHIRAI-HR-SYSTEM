'use client';
import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import '@/lib/chart-registry';
import { MonthlyStats, PriceSnapshot } from '@/types';

const PEAK_MONTHS = [3, 4, 5, 8, 12];

interface ForwardDaySource {
  ota: string;
  hotel_count: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  last_updated: string;
}

interface ForwardDay {
  date: string;
  sources: ForwardDaySource[];
  best_price: number;
  avg_price: number;
}

interface Props {
  stats: MonthlyStats[];
  lat?: number;
  lng?: number;
}

type ViewMode = 'seasonal' | 'historical' | 'forward';

export default function TrendTab({ stats, lat, lng }: Props) {
  const [mode, setMode]           = useState<ViewMode>('seasonal');
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);
  const [snapLoading, setSnapLoading] = useState(false);
  const [snapError, setSnapError]   = useState('');
  const [fetched, setFetched]       = useState(false);

  // 過去データ取得（historyタブ切替時に初回fetch）
  useEffect(() => {
    if (mode !== 'historical' || fetched || !lat || !lng) return;
    setSnapLoading(true);
    fetch(`/api/snapshots?lat=${lat}&lng=${lng}&months=13`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setSnapshots(d.snapshots ?? []);
        setFetched(true);
      })
      .catch(e => setSnapError(e.message))
      .finally(() => setSnapLoading(false));
  }, [mode, fetched, lat, lng]);

  const [calendar, setCalendar]       = useState<ForwardDay[]>([]);
  const [calLoading, setCalLoading]   = useState(false);
  const [calError, setCalError]       = useState('');
  const [calFetched, setCalFetched]   = useState(false);

  useEffect(() => {
    if (mode !== 'forward' || calFetched || !lat || !lng) return;
    setCalLoading(true);
    fetch(`/api/price-calendar?lat=${lat}&lng=${lng}&weeks=12`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setCalendar(d.calendar ?? []);
        setCalFetched(true);
      })
      .catch(e => setCalError(e.message))
      .finally(() => setCalLoading(false));
  }, [mode, calFetched, lat, lng]);

  if (!stats || stats.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center text-gray-400">
        <p className="text-3xl mb-3">📈</p>
        <p className="text-sm">月別統計データがありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* タブ切替 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <TabBtn label="📅 季節パターン" active={mode === 'seasonal'} onClick={() => setMode('seasonal')} />
        <TabBtn label="📈 過去12ヶ月ADR推移" active={mode === 'historical'} onClick={() => setMode('historical')} />
        <TabBtn label="🔮 先行価格カレンダー" active={mode === 'forward'} onClick={() => setMode('forward')} />
      </div>

      {mode === 'seasonal' && <SeasonalView stats={stats} />}
      {mode === 'historical' && (
        <HistoricalView
          snapshots={snapshots}
          loading={snapLoading}
          error={snapError}
          hasCoords={!!lat && !!lng}
        />
      )}
      {mode === 'forward' && (
        <ForwardView
          calendar={calendar}
          loading={calLoading}
          error={calError}
          hasCoords={!!lat && !!lng}
        />
      )}
    </div>
  );
}

/* ─── 季節パターン（既存ビュー拡張） ─── */
function SeasonalView({ stats }: { stats: MonthlyStats[] }) {
  const labels = stats.map(s => {
    const [, m] = s.month.split('-');
    return `${parseInt(m)}月`;
  });

  const data = {
    labels,
    datasets: [
      {
        label: '平日平均',
        data: stats.map(s => s.weekday_avg),
        backgroundColor: stats.map(s => {
          const month = parseInt(s.month.split('-')[1]);
          return PEAK_MONTHS.includes(month)
            ? 'rgba(234, 88, 12, 0.8)'
            : 'rgba(59, 130, 246, 0.8)';
        }),
      },
      {
        label: '休日平均',
        data: stats.map(s => s.weekend_avg),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: '月別平均宿泊単価（ADR）季節パターン' },
    },
    scales: {
      y: { ticks: { callback: (v: any) => `¥${v.toLocaleString()}` } },
    },
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex gap-4 text-xs mb-4">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-orange-600 inline-block" />繁忙期（3,4,5,8,12月）
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-500 inline-block" />通常月
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-emerald-400 inline-block" />休日
        </span>
      </div>
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left text-xs text-gray-500">月</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500">平日</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500">休日</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500">繁忙期</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500">最低</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500">最高</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.map(s => {
              const month = parseInt(s.month.split('-')[1]);
              return (
                <tr key={s.month} className={PEAK_MONTHS.includes(month) ? 'bg-orange-50' : ''}>
                  <td className="px-3 py-2 font-medium">{month}月</td>
                  <td className="px-3 py-2 text-right">¥{s.weekday_avg.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">¥{s.weekend_avg.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">
                    {s.peak_avg ? `¥${s.peak_avg.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500">¥{s.min_price.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-500">¥{s.max_price.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── 過去12ヶ月ADR推移 ─── */
function HistoricalView({
  snapshots, loading, error, hasCoords,
}: {
  snapshots: PriceSnapshot[];
  loading: boolean;
  error: string;
  hasCoords: boolean;
}) {
  if (!hasCoords) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm">
        座標情報がないため履歴データを取得できません
      </div>
    );
  }
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400">
        <div className="animate-spin h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm">過去データを読み込み中...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
        データ取得エラー: {error}
      </div>
    );
  }
  if (snapshots.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm">
        過去データがまだありません。調査を続けることでデータが蓄積されます。
      </div>
    );
  }

  const hasReal     = snapshots.some(s => s.data_source !== 'estimated');
  const realCount   = snapshots.filter(s => s.data_source !== 'estimated').length;
  const estCount    = snapshots.filter(s => s.data_source === 'estimated').length;

  const labels = snapshots.map(s => {
    const d = new Date(s.survey_date);
    return `${d.getFullYear()}/${d.getMonth() + 1}月`;
  });

  const lineData = {
    labels,
    datasets: [
      {
        label: '平均ADR（平日）',
        data: snapshots.map(s => s.weekday_avg),
        borderColor: 'rgba(59, 130, 246, 0.9)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: snapshots.map(s => s.data_source !== 'estimated' ? 5 : 3),
        pointBackgroundColor: snapshots.map(s =>
          s.data_source !== 'estimated' ? 'rgba(59, 130, 246, 1)' : 'rgba(156, 163, 175, 0.8)',
        ),
      },
      {
        label: '休日ADR',
        data: snapshots.map(s => s.weekend_avg),
        borderColor: 'rgba(16, 185, 129, 0.8)',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        borderDash: [4, 4],
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: '過去12ヶ月 ADR推移（月次）' },
      tooltip: {
        callbacks: {
          afterLabel: (ctx: any) => {
            const snap = snapshots[ctx.dataIndex];
            const src = snap?.data_source;
            return src === 'estimated' ? '（推計値）' : src === 'rakuten' ? '（楽天実測）' : '（実測）';
          },
        },
      },
    },
    scales: {
      y: { ticks: { callback: (v: any) => `¥${v.toLocaleString()}` } },
    },
  };

  // ADR変化率（最古→最新）
  const first = snapshots[0]?.weekday_avg ?? 0;
  const last  = snapshots[snapshots.length - 1]?.weekday_avg ?? 0;
  const change = first > 0 ? ((last - first) / first * 100).toFixed(1) : null;

  return (
    <div className="space-y-4">
      {/* データソース凡例 */}
      <div className="bg-white rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <span className="font-medium text-gray-700">データ構成:</span>
        {realCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            実測値 {realCount}ヶ月
          </span>
        )}
        {estCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />
            推計値 {estCount}ヶ月
            <span className="text-gray-400">（実データ蓄積中）</span>
          </span>
        )}
        {change !== null && (
          <span className={`ml-auto font-semibold ${parseFloat(change) >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
            12ヶ月変化率: {parseFloat(change) >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>

      {/* 折れ線グラフ */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="h-64">
          <Line data={lineData} options={options} />
        </div>
      </div>

      {/* KPIサマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="現在ADR（平日）"  value={`¥${last.toLocaleString()}`} />
        <KpiCard label="12ヶ月前ADR"      value={`¥${first.toLocaleString()}`} />
        <KpiCard
          label="ADR変化"
          value={change !== null ? `${parseFloat(change) >= 0 ? '+' : ''}${change}%` : '—'}
          highlight={change !== null && parseFloat(change) > 5 ? 'up' : change !== null && parseFloat(change) < -5 ? 'down' : 'neutral'}
        />
        <KpiCard
          label="最高ADR（期間内）"
          value={`¥${Math.max(...snapshots.map(s => s.max_adr ?? 0)).toLocaleString()}`}
        />
      </div>

      {/* 詳細テーブル */}
      <div className="bg-white rounded-xl p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left text-xs text-gray-500">年月</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500">平日ADR</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500">休日ADR</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500">最低</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500">最高</th>
              <th className="px-3 py-2 text-left text-xs text-gray-500">ソース</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {snapshots.map(s => {
              const d = new Date(s.survey_date);
              const isReal = s.data_source !== 'estimated';
              return (
                <tr key={s.survey_date} className={isReal ? 'bg-blue-50/40' : ''}>
                  <td className="px-3 py-2 font-medium text-gray-700">
                    {d.getFullYear()}/{d.getMonth() + 1}月
                  </td>
                  <td className="px-3 py-2 text-right">¥{s.weekday_avg.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">¥{s.weekend_avg.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-500">¥{(s.min_adr ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-500">¥{(s.max_adr ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    {isReal
                      ? <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">実測</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">推計</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!hasReal && (
        <p className="text-xs text-gray-400 text-center">
          ※ 現在の値は日本の宿泊市場季節性に基づく推計値です。調査を重ねることで実測データに置き換わります。
        </p>
      )}
    </div>
  );
}

/* ─── 先行価格カレンダー（フォワード価格） ─── */
function ForwardView({
  calendar, loading, error, hasCoords,
}: {
  calendar: ForwardDay[];
  loading: boolean;
  error: string;
  hasCoords: boolean;
}) {
  if (!hasCoords) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm">
        座標情報がないため先行価格データを取得できません
      </div>
    );
  }
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400">
        <div className="animate-spin h-6 w-6 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm">先行価格を読み込み中...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
        データ取得エラー: {error}
      </div>
    );
  }
  if (calendar.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center space-y-3">
        <p className="text-3xl">🔮</p>
        <p className="text-sm text-gray-600 font-medium">先行価格データがまだありません</p>
        <p className="text-xs text-gray-400">
          Cron Jobが楽天トラベルAPIで今後12週分の土曜チェックイン価格を収集します。<br />
          RAKUTEN_APP_IDが設定されていると翌朝（JST 06:00）から収集が開始されます。
        </p>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left text-xs text-blue-800 space-y-1">
          <p className="font-semibold">📋 セットアップ方法</p>
          <p>1. 楽天デベロッパーアカウントでアプリIDを取得</p>
          <p>2. .env.local に <code className="bg-blue-100 px-1 rounded">RAKUTEN_APP_ID=あなたのID</code> を追加</p>
          <p>3. Vercelにデプロイしてcron jobを有効化</p>
        </div>
      </div>
    );
  }

  // 価格範囲で色分け
  const prices = calendar.map(d => d.avg_price).filter(p => p > 0);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const getColor = (price: number) => {
    if (prices.length === 0 || maxP === minP) return 'bg-gray-100 text-gray-700';
    const pct = (price - minP) / (maxP - minP);
    if (pct < 0.25) return 'bg-emerald-100 text-emerald-800';
    if (pct < 0.50) return 'bg-yellow-100 text-yellow-800';
    if (pct < 0.75) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const otaSources = Array.from(new Set(calendar.flatMap(d => d.sources.map(s => s.ota))));

  return (
    <div className="space-y-4">
      {/* 凡例 */}
      <div className="bg-white rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <span className="font-medium text-gray-700">価格帯:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200 inline-block" />低価格（下位25%）</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200 inline-block" />標準</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-200 inline-block" />高め</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 inline-block" />繁忙期</span>
        <span className="ml-auto text-gray-400">OTA: {otaSources.join(' / ')}</span>
      </div>

      {/* カレンダーグリッド */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">今後12週の土曜日チェックイン価格</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {calendar.map(day => {
            const d = new Date(day.date);
            const label = `${d.getMonth()+1}/${d.getDate()}（土）`;
            const colorCls = day.avg_price > 0 ? getColor(day.avg_price) : 'bg-gray-100 text-gray-400';
            return (
              <div key={day.date} className={`rounded-lg p-3 ${colorCls}`}>
                <p className="text-xs font-medium mb-1">{label}</p>
                <p className="text-base font-bold">
                  {day.avg_price > 0 ? `¥${day.avg_price.toLocaleString()}` : 'N/A'}
                </p>
                <p className="text-xs opacity-70">
                  最安 ¥{day.best_price > 0 ? day.best_price.toLocaleString() : '—'}
                </p>
                <div className="mt-1 flex gap-1 flex-wrap">
                  {day.sources.map(s => (
                    <span key={s.ota} className="text-[10px] bg-white/60 rounded px-1">
                      {s.ota === 'rakuten' ? '楽天' : s.ota === 'jalan' ? 'じゃらん' : s.ota}
                      {s.hotel_count}件
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* テーブル詳細 */}
      <div className="bg-white rounded-xl p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left text-xs text-gray-500">チェックイン</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500">平均ADR</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500">最安値</th>
              <th className="px-3 py-2 text-right text-xs text-gray-500">ホテル数</th>
              <th className="px-3 py-2 text-left text-xs text-gray-500">OTA</th>
              <th className="px-3 py-2 text-left text-xs text-gray-500">取得日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {calendar.map(day => {
              const d = new Date(day.date);
              const src = day.sources[0];
              return (
                <tr key={day.date} className={day.avg_price > 0 ? getColor(day.avg_price).replace('bg-', 'bg-').replace('text-', '') : ''}>
                  <td className="px-3 py-2 font-medium">{d.getMonth()+1}月{d.getDate()}日（土）</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {day.avg_price > 0 ? `¥${day.avg_price.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">
                    {day.best_price > 0 ? `¥${day.best_price.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">
                    {day.sources.reduce((s, r) => s + r.hotel_count, 0)}件
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {day.sources.map(s => (
                        <span key={s.ota} className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          s.ota === 'rakuten' ? 'bg-red-100 text-red-700' :
                          s.ota === 'jalan'   ? 'bg-orange-100 text-orange-700' :
                                               'bg-gray-100 text-gray-600'
                        }`}>
                          {s.ota === 'rakuten' ? '🔴 楽天' : s.ota === 'jalan' ? '🟠 じゃらん' : s.ota}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-400">
                    {src?.last_updated ?? '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── 小コンポーネント ─── */
function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
        active ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
      }`}
    >
      {label}
    </button>
  );
}

function KpiCard({ label, value, highlight }: {
  label: string; value: string; highlight?: 'up' | 'down' | 'neutral';
}) {
  const color = highlight === 'up'   ? 'text-red-700 bg-red-50 border-red-100'
              : highlight === 'down' ? 'text-blue-700 bg-blue-50 border-blue-100'
              : 'text-gray-800 bg-gray-50 border-gray-100';
  return (
    <div className={`rounded-xl p-3 border ${color}`}>
      <p className="text-xs opacity-60 mb-0.5">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
