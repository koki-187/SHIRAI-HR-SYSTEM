'use client';
import { useEffect, useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import '@/lib/chart-registry';

interface MonthlyRow {
  month:       number;
  weekday_adr: number | null;
  weekend_adr: number | null;
  peak_adr:    number | null;
  min_adr:     number | null;
  max_adr:     number | null;
  avg_adr:     number | null;
  hotel_count: number | null;
  data_source: string | null;
  real_avg:    number | null;
  real_sample: number | null;
}

interface AnnualData {
  avg_adr:     number;
  weekday_adr: number;
  weekend_adr: number;
  min_adr:     number;
  max_adr:     number;
  revpar_est:  number;
  occ_weekday: number;
  occ_weekend: number;
}

interface DataQuality {
  total_months:    number;
  observed_months: number;
  has_real_data:   boolean;
  confidence:      'high' | 'medium' | 'low';
}

interface ADRReport {
  area_key:    string;
  annual:      AnnualData;
  data_quality: DataQuality;
  monthly_calendar: MonthlyRow[];
  seasonal_concentration_pct: number;
}

interface Props {
  lat?: number;
  lng?: number;
}

const MONTH_LABELS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export default function AnnualADRTab({ lat, lng }: Props) {
  const [report, setReport]   = useState<ADRReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (fetched || !lat || !lng) return;
    setLoading(true);
    fetch(`/api/adr-report?lat=${lat}&lng=${lng}&months=13`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setReport(d);
        setFetched(true);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [fetched, lat, lng]);

  if (!lat || !lng) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm">
        座標情報がないため年間ADRデータを取得できません
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-400 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm">年間ADRデータを集計中...</p>
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

  if (!report) return null;

  const { annual, data_quality, monthly_calendar, seasonal_concentration_pct } = report;

  const confidenceColor = data_quality.confidence === 'high'   ? 'bg-emerald-100 text-emerald-700' :
                          data_quality.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                 'bg-gray-100 text-gray-600';
  const confidenceLabel = data_quality.confidence === 'high'   ? '高精度（実測データあり）' :
                          data_quality.confidence === 'medium' ? '中精度（部分実測）' :
                                                                 '推計値（季節係数ベース）';

  // 棒グラフデータ
  const chartData = {
    labels: MONTH_LABELS,
    datasets: [
      {
        label: '平日ADR',
        data: monthly_calendar.map(m => m.weekday_adr ?? 0),
        backgroundColor: monthly_calendar.map(m =>
          m.real_avg ? 'rgba(79, 70, 229, 0.85)' : 'rgba(99, 102, 241, 0.55)'
        ),
      },
      {
        label: '休日ADR',
        data: monthly_calendar.map(m => m.weekend_adr ?? 0),
        backgroundColor: monthly_calendar.map(m =>
          m.real_avg ? 'rgba(16, 185, 129, 0.85)' : 'rgba(16, 185, 129, 0.45)'
        ),
      },
    ],
  };

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: '月別ADR（平日・休日）' },
      tooltip: {
        callbacks: {
          afterLabel: (ctx: any) => {
            const row = monthly_calendar[ctx.dataIndex];
            const src = row?.data_source;
            const real = row?.real_avg;
            if (real) return `実測平均: ¥${real.toLocaleString()} (${row.real_sample}件)`;
            return src === 'estimated' ? '（推計値）' : `（${src ?? '—'}）`;
          },
        },
      },
    },
    scales: {
      y: { ticks: { callback: (v: any) => `¥${(v/1000).toFixed(0)}k` } },
    },
  }), [monthly_calendar]);

  // ADRヒートマップ用カラー
  const maxADR = Math.max(...monthly_calendar.map(m => m.avg_adr ?? 0));
  const minADRVal = Math.min(...monthly_calendar.filter(m => (m.avg_adr ?? 0) > 0).map(m => m.avg_adr ?? 0));
  function heatColor(val: number | null): string {
    if (!val || maxADR === minADRVal) return 'bg-gray-50';
    const pct = (val - minADRVal) / (maxADR - minADRVal);
    if (pct < 0.2) return 'bg-blue-50 text-blue-800';
    if (pct < 0.4) return 'bg-emerald-50 text-emerald-800';
    if (pct < 0.6) return 'bg-yellow-50 text-yellow-800';
    if (pct < 0.8) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  }

  return (
    <div className="space-y-4">

      {/* ── 信頼性バナー ── */}
      {data_quality.confidence !== 'high' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
          <span className="text-base">⚠️</span>
          <div>
            <p className="font-semibold">本データは推計値を含みます</p>
            <p className="mt-0.5">観光庁宿泊旅行統計調査・楽天トラベル将来価格データに基づく季節係数推計です。¥億単位の意思決定では現地確認・STRレポート等との照合を推奨します。</p>
          </div>
        </div>
      )}

      {/* ── 年間KPIカード ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="年間平均ADR"
          value={`¥${annual.avg_adr.toLocaleString()}`}
          sub="全月平均"
          color="indigo"
        />
        <KpiCard
          label="平日ADR"
          value={`¥${annual.weekday_adr.toLocaleString()}`}
          sub={`OCC ${Math.round(annual.occ_weekday*100)}%想定`}
          color="blue"
        />
        <KpiCard
          label="推計RevPAR"
          value={`¥${annual.revpar_est.toLocaleString()}`}
          sub="ADR×加重OCC"
          color="emerald"
        />
        <KpiCard
          label="市場最高ADR"
          value={`¥${annual.max_adr.toLocaleString()}`}
          sub={`最安 ¥${annual.min_adr.toLocaleString()}`}
          color="orange"
        />
      </div>

      {/* ── データ品質 + 季節リスク ── */}
      <div className="bg-white rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <span className={`px-2 py-1 rounded-full font-medium text-xs ${confidenceColor}`}>
          {confidenceLabel}
        </span>
        <span className="text-gray-500">
          実測 {data_quality.observed_months}ヶ月 / 推計 {data_quality.total_months - data_quality.observed_months}ヶ月
        </span>
        {data_quality.has_real_data && (
          <span className="text-indigo-600 font-medium">✓ 楽天実価格データあり</span>
        )}
        <span className="ml-auto text-gray-600">
          繁忙期集中度: <strong className={seasonal_concentration_pct >= 40 ? 'text-orange-600' : 'text-gray-800'}>
            {seasonal_concentration_pct}%
          </strong>
          <span className="text-gray-400 ml-1">（上位月の収益比率）</span>
        </span>
      </div>

      {/* ── 月別棒グラフ ── */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="h-60">
          <Bar data={chartData} options={chartOptions} />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          濃色 = 楽天実価格あり　淡色 = 季節係数推計
        </p>
      </div>

      {/* ── 月別ヒートマップ表 ── */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">月別ADRヒートマップ（仕入れ判断用）</h3>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {monthly_calendar.map(row => (
            <div key={row.month} className={`rounded-lg p-2.5 text-center ${heatColor(row.avg_adr)}`}>
              <p className="text-xs font-medium opacity-70">{row.month}月</p>
              <p className="text-sm font-bold mt-0.5">
                {row.avg_adr ? `¥${(row.avg_adr/1000).toFixed(1)}k` : '—'}
              </p>
              <p className="text-[10px] opacity-60">
                {row.real_avg ? `実¥${(row.real_avg/1000).toFixed(1)}k` :
                 row.data_source === 'estimated' ? '推計' : row.data_source ?? '—'}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-100 inline-block"/>低</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-100 inline-block"/>標準</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-100 inline-block"/>高め</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-orange-100 inline-block"/>繁忙</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-100 inline-block"/>最繁忙</span>
        </div>
      </div>

      {/* ── 詳細テーブル ── */}
      <div className="bg-white rounded-xl p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500">
              <th className="px-3 py-2 text-left">月</th>
              <th className="px-3 py-2 text-right">平日ADR</th>
              <th className="px-3 py-2 text-right">休日ADR</th>
              <th className="px-3 py-2 text-right">繁忙期</th>
              <th className="px-3 py-2 text-right">最安〜最高</th>
              <th className="px-3 py-2 text-right">RevPAR推計</th>
              <th className="px-3 py-2 text-left">ソース</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {monthly_calendar.map(row => {
              const revpar = row.weekday_adr
                ? Math.round(row.weekday_adr * annual.occ_weekday * 5/7 +
                             (row.weekend_adr ?? row.weekday_adr) * annual.occ_weekend * 2/7)
                : null;
              const isReal = row.data_source && row.data_source !== 'estimated';
              return (
                <tr key={row.month} className={isReal ? 'bg-indigo-50/30' : ''}>
                  <td className="px-3 py-2 font-medium">{row.month}月</td>
                  <td className="px-3 py-2 text-right">
                    {row.weekday_adr ? `¥${row.weekday_adr.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.weekend_adr ? `¥${row.weekend_adr.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-orange-700">
                    {row.peak_adr ? `¥${row.peak_adr.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500 text-xs">
                    {row.min_adr && row.max_adr
                      ? `¥${row.min_adr.toLocaleString()} 〜 ¥${row.max_adr.toLocaleString()}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-indigo-700 font-medium">
                    {revpar ? `¥${revpar.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {row.real_avg ? (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                        実測 {row.real_sample}件
                      </span>
                    ) : row.data_source === 'rakuten' ? (
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">楽天</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">推計</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-indigo-50 font-semibold text-indigo-900">
              <td className="px-3 py-2">年間平均</td>
              <td className="px-3 py-2 text-right">¥{annual.weekday_adr.toLocaleString()}</td>
              <td className="px-3 py-2 text-right">¥{annual.weekend_adr.toLocaleString()}</td>
              <td className="px-3 py-2 text-right">—</td>
              <td className="px-3 py-2 text-right text-xs text-indigo-700">
                ¥{annual.min_adr.toLocaleString()} 〜 ¥{annual.max_adr.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right">¥{annual.revpar_est.toLocaleString()}</td>
              <td className="px-3 py-2 text-xs text-indigo-600">12ヶ月加重</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── 仕入れ判断サマリー ── */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-indigo-900 mb-2">📋 仕入れ判断サマリー</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-gray-500">年間ADR（税別推計）</p>
            <p className="text-lg font-bold text-indigo-800">¥{annual.avg_adr.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">推計RevPAR（年間）</p>
            <p className="text-lg font-bold text-indigo-800">¥{annual.revpar_est.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">RevPAR/ADR比</p>
            <p className="text-lg font-bold text-indigo-800">
              {annual.avg_adr > 0 ? (annual.revpar_est / annual.avg_adr * 100).toFixed(1) : '—'}%
            </p>
          </div>
          <div>
            <p className="text-gray-500">市場ADRレンジ</p>
            <p className="font-semibold">¥{annual.min_adr.toLocaleString()} 〜 ¥{annual.max_adr.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">繁忙期集中リスク</p>
            <p className={`font-semibold ${seasonal_concentration_pct >= 40 ? 'text-orange-700' : 'text-gray-700'}`}>
              {seasonal_concentration_pct}%
              {seasonal_concentration_pct >= 40 ? '（高）' : seasonal_concentration_pct >= 25 ? '（中）' : '（低）'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">データ信頼性</p>
            <p className="font-semibold">
              {data_quality.confidence === 'high' ? '🟢 高' :
               data_quality.confidence === 'medium' ? '🟡 中' : '🔴 低（推計）'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

function KpiCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: 'indigo'|'blue'|'emerald'|'orange';
}) {
  const cls = {
    indigo:  'bg-indigo-50  border-indigo-100  text-indigo-800',
    blue:    'bg-blue-50    border-blue-100    text-blue-800',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    orange:  'bg-orange-50  border-orange-100  text-orange-800',
  }[color];
  return (
    <div className={`rounded-xl p-3 border ${cls}`}>
      <p className="text-xs opacity-60 mb-0.5">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs opacity-50 mt-0.5">{sub}</p>
    </div>
  );
}
