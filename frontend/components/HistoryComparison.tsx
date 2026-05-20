'use client';
// no React hooks needed for this component
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { SurveyHistory } from '@/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Props {
  history: SurveyHistory[];
  currentLocation?: string;
}

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const LINE_COLORS = [
  { border: 'rgba(59, 130, 246, 1)', bg: 'rgba(59, 130, 246, 0.1)' },
  { border: 'rgba(234, 88, 12, 1)', bg: 'rgba(234, 88, 12, 0.1)' },
  { border: 'rgba(16, 185, 129, 1)', bg: 'rgba(16, 185, 129, 0.1)' },
  { border: 'rgba(139, 92, 246, 1)', bg: 'rgba(139, 92, 246, 0.1)' },
  { border: 'rgba(245, 158, 11, 1)', bg: 'rgba(245, 158, 11, 0.1)' },
];

export default function HistoryComparison({ history, currentLocation }: Props) {
  // currentLocationに関連する履歴のみフィルタ
  const relevantHistory = currentLocation
    ? history.filter(h => {
        const loc = h.location?.toLowerCase() || '';
        const addr = h.search_address?.toLowerCase() || '';
        const cur = currentLocation.toLowerCase();
        return loc.includes(cur) || cur.includes(loc) || addr.includes(cur.split(/[区市町村]/)[0]);
      })
    : history;

  // 最大5件まで（最新順）
  const displayHistory = relevantHistory.slice(0, 5);

  if (displayHistory.length < 2) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-2">📈 時系列比較</h3>
        <p className="text-sm text-gray-400">
          同じエリアを2回以上調査すると、ADR（平均客室単価）の推移グラフが表示されます。
        </p>
      </div>
    );
  }

  const datasets = displayHistory.map((h, i) => {
    const color = LINE_COLORS[i % LINE_COLORS.length];
    const weekdayData = h.result.monthly_stats.map(s => s.weekday_avg);
    const date = new Date(h.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    return {
      label: `${h.location}（${date}）`,
      data: weekdayData,
      borderColor: color.border,
      backgroundColor: color.bg,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    };
  });

  const chartData = {
    labels: MONTH_LABELS,
    datasets,
  };

  const options = {
    responsive: true,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 11 } } },
      title: { display: true, text: '月別平日ADR 時系列比較', font: { size: 13 } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ¥${ctx.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (v: any) => `¥${v.toLocaleString()}`,
          font: { size: 11 },
        },
      },
    },
  };

  // ADR変化サマリー（最古 vs 最新）
  const oldest = displayHistory[displayHistory.length - 1];
  const newest = displayHistory[0];
  const oldAvgAdr = oldest.result.monthly_stats.reduce((s, m) => s + m.weekday_avg, 0) / 12;
  const newAvgAdr = newest.result.monthly_stats.reduce((s, m) => s + m.weekday_avg, 0) / 12;
  const change = ((newAvgAdr - oldAvgAdr) / oldAvgAdr * 100).toFixed(1);
  const isUp = newAvgAdr >= oldAvgAdr;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">📈 時系列比較（{displayHistory.length}回分）</h3>
        <div className={`text-sm font-medium px-3 py-1 rounded-full ${isUp ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          年間ADR {isUp ? '↑' : '↓'} {isUp ? '+' : ''}{change}%
        </div>
      </div>

      <Line data={chartData} options={options} />

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">初回調査（年間ADR）</p>
          <p className="font-bold text-gray-800">¥{Math.round(oldAvgAdr).toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">最新調査（年間ADR）</p>
          <p className="font-bold text-blue-700">¥{Math.round(newAvgAdr).toLocaleString()}</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${isUp ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className="text-xs text-gray-500 mb-1">変化率</p>
          <p className={`font-bold ${isUp ? 'text-red-600' : 'text-green-600'}`}>
            {isUp ? '+' : ''}{change}%
          </p>
        </div>
      </div>
    </div>
  );
}
