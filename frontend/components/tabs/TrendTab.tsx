'use client';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { MonthlyStats } from '@/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PEAK_MONTHS = [3, 4, 5, 8, 12];

export default function TrendTab({ stats }: { stats: MonthlyStats[] }) {
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
        backgroundColor: stats.map((_, i) =>
          PEAK_MONTHS.includes(i + 1)
            ? 'rgba(234, 88, 12, 0.8)'
            : 'rgba(59, 130, 246, 0.8)'
        ),
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
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: '月別平均宿泊単価（ADR）推移' },
    },
    scales: {
      y: {
        ticks: {
          callback: (v: any) => `¥${v.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex gap-4 text-xs mb-4">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-orange-600 inline-block" />
          繁忙期（3,4,5,8,12月）
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
          通常月
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-emerald-400 inline-block" />
          休日
        </span>
      </div>
      <Bar data={data} options={options} />

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
            {stats.map((s, i) => (
              <tr key={s.month} className={PEAK_MONTHS.includes(i + 1) ? 'bg-orange-50' : ''}>
                <td className="px-3 py-2 font-medium">{parseInt(s.month.split('-')[1])}月</td>
                <td className="px-3 py-2 text-right">¥{s.weekday_avg.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">¥{s.weekend_avg.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  {s.peak_avg ? `¥${s.peak_avg.toLocaleString()}` : '-'}
                </td>
                <td className="px-3 py-2 text-right text-gray-500">¥{s.min_price.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-gray-500">¥{s.max_price.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
