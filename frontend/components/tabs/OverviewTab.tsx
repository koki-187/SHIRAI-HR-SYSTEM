'use client';
import { ScrapeResponse } from '@/types';

export default function OverviewTab({ data }: { data: ScrapeResponse }) {
  const { hotels, monthly_stats } = data;

  const avgPrice = hotels.reduce((s, h) => s + h.price_per_night, 0) / hotels.length;
  const minPrice = Math.min(...hotels.map(h => h.price_per_night));
  const maxPrice = Math.max(...hotels.map(h => h.price_per_night));
  const ratedHotels = hotels.filter(h => h.rating);
  const avgRating = ratedHotels.length > 0
    ? ratedHotels.reduce((s, h) => s + (h.rating || 0), 0) / ratedHotels.length
    : 0;

  const weekdayAvg = monthly_stats.reduce((s, m) => s + m.weekday_avg, 0) / monthly_stats.length;
  const weekendAvg = monthly_stats.reduce((s, m) => s + m.weekend_avg, 0) / monthly_stats.length;
  const peakMonths = monthly_stats.filter(m => m.peak_avg);
  const peakAvg = peakMonths.length > 0
    ? peakMonths.reduce((s, m) => s + (m.peak_avg || 0), 0) / peakMonths.length
    : null;

  const fmt = (n: number) => `¥${Math.round(n).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="調査ホテル数" value={`${hotels.length}件`} color="blue" />
        <StatCard label="平均価格/泊" value={fmt(avgPrice)} color="green" />
        <StatCard label="最低価格" value={fmt(minPrice)} color="indigo" />
        <StatCard label="最高価格" value={fmt(maxPrice)} color="purple" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">平日平均 ADR</p>
          <p className="text-2xl font-bold text-gray-800">{fmt(weekdayAvg)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">休日平均 ADR</p>
          <p className="text-2xl font-bold text-gray-800">{fmt(weekendAvg)}</p>
          <p className="text-xs text-green-600">
            平日比 +{Math.round((weekendAvg / weekdayAvg - 1) * 100)}%
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">繁忙期平均 ADR</p>
          <p className="text-2xl font-bold text-gray-800">{peakAvg ? fmt(peakAvg) : 'N/A'}</p>
          {peakAvg && (
            <p className="text-xs text-orange-600">
              平日比 +{Math.round((peakAvg / weekdayAvg - 1) * 100)}%
            </p>
          )}
        </div>
      </div>

      {avgRating > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <p className="text-sm text-gray-600">
            エリア平均評価スコア:{' '}
            <span className="font-bold text-yellow-700">★ {avgRating.toFixed(1)}</span> / 10
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3">
          調査エリア: {data.search_address}
        </h3>
        <p className="text-sm text-gray-500">
          座標: {data.geocoded_lat.toFixed(4)}, {data.geocoded_lng.toFixed(4)}
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-xs opacity-70 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
