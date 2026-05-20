'use client';
import { HotelData, RoomType } from '@/types';

interface Props {
  hotels: HotelData[];
}

const fmt = (n: number) => `¥${Math.round(n).toLocaleString()}`;
const fmtSqm = (n: number) => `${n}㎡`;

export default function RoomTab({ hotels }: Props) {
  const hotelsWithRooms = hotels.filter(h => h.room_types && h.room_types.length > 0);

  if (hotelsWithRooms.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400">
        <p className="text-sm">部屋データがありません</p>
      </div>
    );
  }

  // 全room_typesを集計してエリア全体の指標を計算
  const allRooms: RoomType[] = hotelsWithRooms.flatMap(h => h.room_types!);
  const avgSqm = Math.round(allRooms.reduce((s, r) => s + r.size_sqm, 0) / allRooms.length);
  const avgPpSqm = Math.round(allRooms.reduce((s, r) => s + r.price_per_sqm, 0) / allRooms.length);
  const avgRevparSqm = Math.round(allRooms.reduce((s, r) => s + r.revpar_per_sqm, 0) / allRooms.length);
  const avgPpPerson = Math.round(allRooms.reduce((s, r) => s + r.price_per_person, 0) / allRooms.length);

  // ㎡単価ランキング（ホテル別平均）
  const hotelRanking = hotelsWithRooms
    .map(h => ({
      name: h.name,
      avg_price_per_sqm: h.avg_price_per_sqm ?? 0,
      avg_room_size: h.avg_room_size ?? 0,
      price_per_night: h.price_per_night,
    }))
    .sort((a, b) => b.avg_price_per_sqm - a.avg_price_per_sqm);

  const maxPpSqm = Math.max(...hotelRanking.map(h => h.avg_price_per_sqm));

  // RevPAR/㎡ 効率トップ3・ボトム1
  const revparRanking = hotelsWithRooms
    .map(h => ({
      name: h.name,
      revpar_per_sqm: Math.round((h.room_types ?? []).reduce((s, r) => s + r.revpar_per_sqm, 0) / (h.room_types?.length ?? 1)),
    }))
    .sort((a, b) => b.revpar_per_sqm - a.revpar_per_sqm);

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="エリア平均客室面積" value={fmtSqm(avgSqm)} color="blue" sub="全部屋タイプ加重平均" />
        <StatCard label="平均㎡単価" value={`${fmt(avgPpSqm)}/㎡`} color="green" sub="平日料金÷面積" />
        <StatCard label="RevPAR/㎡" value={`${fmt(avgRevparSqm)}/㎡`} color="indigo" sub="稼働率80%想定" />
        <StatCard label="1人あたり単価" value={fmt(avgPpPerson)} color="purple" sub="平日料金÷定員" />
      </div>

      {/* ㎡単価ランキング（横棒グラフ） */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-4">㎡単価ランキング（平日料金÷客室面積）</h3>
        <div className="space-y-2.5">
          {hotelRanking.slice(0, 12).map((h, i) => {
            const pct = maxPpSqm > 0 ? (h.avg_price_per_sqm / maxPpSqm) * 100 : 0;
            const barColor = i === 0 ? 'bg-blue-500' : i < 3 ? 'bg-blue-400' : 'bg-blue-300';
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-gray-700 truncate max-w-[180px]">{h.name}</span>
                    <span className="text-xs font-semibold text-blue-700 ml-2 shrink-0">
                      {fmt(h.avg_price_per_sqm)}/㎡
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{fmtSqm(h.avg_room_size)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 詳細テーブル */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">部屋タイプ別詳細データ</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2.5 text-left text-gray-500 font-medium">ホテル名</th>
                <th className="px-3 py-2.5 text-left text-gray-500 font-medium">部屋タイプ</th>
                <th className="px-3 py-2.5 text-right text-gray-500 font-medium">面積</th>
                <th className="px-3 py-2.5 text-right text-gray-500 font-medium">定員</th>
                <th className="px-3 py-2.5 text-right text-gray-500 font-medium">平日料金</th>
                <th className="px-3 py-2.5 text-right text-gray-500 font-medium">休日料金</th>
                <th className="px-3 py-2.5 text-right text-gray-500 font-medium">㎡単価</th>
                <th className="px-3 py-2.5 text-right text-gray-500 font-medium">RevPAR/㎡</th>
                <th className="px-3 py-2.5 text-right text-gray-500 font-medium">1人単価</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hotelsWithRooms.map((hotel, hi) =>
                hotel.room_types!.map((room, ri) => (
                  <tr
                    key={`${hi}-${ri}`}
                    className={`hover:bg-blue-50/30 ${ri === 0 ? 'border-t-2 border-gray-200' : ''}`}
                  >
                    <td className="px-3 py-2 font-medium text-gray-800">
                      {ri === 0 ? (
                        <span className="truncate block max-w-[140px]" title={hotel.name}>
                          {hotel.name}
                        </span>
                      ) : (
                        <span className="text-gray-300">↳</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{room.category}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-700">{fmtSqm(room.size_sqm)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{room.max_occupancy}名</td>
                    <td className="px-3 py-2 text-right font-semibold text-green-700">{fmt(room.price_weekday)}</td>
                    <td className="px-3 py-2 text-right text-orange-600">{fmt(room.price_weekend)}</td>
                    <td className="px-3 py-2 text-right">
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                        {fmt(room.price_per_sqm)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-indigo-600 font-medium">{fmt(room.revpar_per_sqm)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{fmt(room.price_per_person)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 投資効率サマリー */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100">
        <h3 className="font-semibold text-indigo-800 mb-3">㎡効率 投資判断サマリー</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {revparRanking.slice(0, 1).map(h => (
            <div key="top" className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-green-600 font-medium mb-1">🥇 最高RevPAR/㎡効率</p>
              <p className="text-sm font-bold text-gray-800 truncate">{h.name}</p>
              <p className="text-lg font-bold text-green-700">{fmt(h.revpar_per_sqm)}<span className="text-xs text-gray-400">/㎡</span></p>
            </div>
          ))}
          {revparRanking.length >= 2 && (
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-blue-600 font-medium mb-1">📊 中央値 RevPAR/㎡</p>
              <p className="text-sm font-bold text-gray-500">エリア中央値</p>
              <p className="text-lg font-bold text-blue-700">
                {fmt(revparRanking[Math.floor(revparRanking.length / 2)]?.revpar_per_sqm ?? 0)}
                <span className="text-xs text-gray-400">/㎡</span>
              </p>
            </div>
          )}
          {revparRanking.slice(-1).map(h => (
            <div key="bottom" className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500 font-medium mb-1">⚠️ 最低RevPAR/㎡効率</p>
              <p className="text-sm font-bold text-gray-800 truncate">{h.name}</p>
              <p className="text-lg font-bold text-gray-500">{fmt(h.revpar_per_sqm)}<span className="text-xs text-gray-400">/㎡</span></p>
            </div>
          ))}
        </div>
        <p className="text-xs text-indigo-500 mt-3">
          ※ RevPAR/㎡ = (平日料金 × 稼働率80%) ÷ 客室面積。数値が高いほど面積当たりの収益効率が高い。
          土曜プレミアム 1.38倍で算出。
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
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
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}
