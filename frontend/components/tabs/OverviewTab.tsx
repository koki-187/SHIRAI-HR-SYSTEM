'use client';
import { ScrapeResponse } from '@/types';

export default function OverviewTab({ data }: { data: ScrapeResponse }) {
  const { hotels, monthly_stats } = data;

  if (!hotels || hotels.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400">
        <p className="text-sm">ホテルデータがありません</p>
      </div>
    );
  }

  const avgPrice = hotels.reduce((s, h) => s + h.price_per_night, 0) / hotels.length;
  const minPrice = Math.min(...hotels.map(h => h.price_per_night));
  const maxPrice = Math.max(...hotels.map(h => h.price_per_night));
  const ratedHotels = hotels.filter(h => h.rating);
  const avgRating = ratedHotels.length > 0
    ? ratedHotels.reduce((s, h) => s + (h.rating || 0), 0) / ratedHotels.length
    : 0;

  // ㎡関連指標
  const hotelsWithRooms = hotels.filter(h => h.avg_room_size && h.avg_price_per_sqm);
  const avgRoomSqm = hotelsWithRooms.length > 0
    ? Math.round(hotelsWithRooms.reduce((s, h) => s + (h.avg_room_size ?? 0), 0) / hotelsWithRooms.length)
    : null;
  const avgPricePerSqm = hotelsWithRooms.length > 0
    ? Math.round(hotelsWithRooms.reduce((s, h) => s + (h.avg_price_per_sqm ?? 0), 0) / hotelsWithRooms.length)
    : null;

  const statLen = monthly_stats.length || 1;
  const weekdayAvg = monthly_stats.reduce((s, m) => s + m.weekday_avg, 0) / statLen;
  const weekendAvg = monthly_stats.reduce((s, m) => s + m.weekend_avg, 0) / statLen;
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

      {/* ㎡単価カード */}
      {avgRoomSqm !== null && avgPricePerSqm !== null && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
            <p className="text-xs text-teal-600 opacity-80 mb-1">エリア平均客室面積</p>
            <p className="text-xl font-bold text-teal-700">{avgRoomSqm}㎡</p>
            <p className="text-xs text-teal-500 mt-0.5">全部屋タイプ加重平均</p>
          </div>
          <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100">
            <p className="text-xs text-cyan-600 opacity-80 mb-1">平均㎡単価</p>
            <p className="text-xl font-bold text-cyan-700">¥{avgPricePerSqm.toLocaleString()}<span className="text-sm font-normal">/㎡</span></p>
            <p className="text-xs text-cyan-500 mt-0.5">平日料金÷客室面積</p>
          </div>
        </div>
      )}

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-600 font-medium">RevPAR推定（稼働率80%想定）</p>
            <p className="text-2xl font-bold text-indigo-800 mt-1">
              ¥{Math.round(weekdayAvg * 0.8).toLocaleString()}
            </p>
          </div>
          <div className="text-right text-xs text-indigo-500">
            <p>年間RevPAR</p>
            <p className="text-lg font-semibold">¥{Math.round(weekdayAvg * 0.8 * 365).toLocaleString()}</p>
          </div>
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
        {data.data_source && (
          <div className="text-xs text-gray-400 text-right mt-2">
            データソース: {data.data_source === 'rakuten' ? '楽天トラベル API' : data.data_source === 'seed' ? '実在データ（シード）' : 'モックデータ'}
          </div>
        )}
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
