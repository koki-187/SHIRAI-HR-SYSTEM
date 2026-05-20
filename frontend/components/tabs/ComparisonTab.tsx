'use client';
import { useState, useEffect } from 'react';
import { HotelData } from '@/types';

type SortKey = 'price_per_night' | 'rating' | 'name' | 'avg_room_size' | 'avg_price_per_sqm';

const safeUrl = (url: string) => {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol) ? url : '#';
  } catch { return '#'; }
};

export default function ComparisonTab({ hotels }: { hotels: HotelData[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('price_per_night');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    setSortKey('price_per_night');
    setSortAsc(true);
  }, [hotels]);

  if (!hotels || hotels.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center text-gray-400">
        <p className="text-3xl mb-3">🏨</p>
        <p className="text-sm">ホテルデータがありません</p>
      </div>
    );
  }

  const getSortVal = (h: HotelData): string | number => {
    if (sortKey === 'name') return h.name;
    if (sortKey === 'price_per_night') return h.price_per_night;
    if (sortKey === 'rating') return h.rating ?? 0;
    if (sortKey === 'avg_room_size') return h.avg_room_size ?? 0;
    if (sortKey === 'avg_price_per_sqm') return h.avg_price_per_sqm ?? 0;
    return 0;
  };
  const sorted = [...hotels].sort((a, b) => {
    const av = getSortVal(a);
    const bv = getSortVal(b);
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      onClick={() => handleSort(k)}
      aria-sort={sortKey === k ? (sortAsc ? 'ascending' : 'descending') : 'none'}
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
    >
      {label} {sortKey === k ? (sortAsc ? '↑' : '↓') : <span className="text-gray-300">↕</span>}
    </th>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto relative">
        {/* スクロールヒント */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 sm:hidden" />
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <Th k="name" label="ホテル名" />
              <Th k="price_per_night" label="料金/泊" />
              <Th k="avg_room_size" label="平均面積" />
              <Th k="avg_price_per_sqm" label="㎡単価" />
              <Th k="rating" label="評価" />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ソース</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">リンク</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((hotel, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{hotel.name}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-green-700">
                    ¥{hotel.price_per_night.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {hotel.avg_room_size ? `${hotel.avg_room_size}㎡` : '-'}
                </td>
                <td className="px-4 py-3">
                  {hotel.avg_price_per_sqm ? (
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                      ¥{hotel.avg_price_per_sqm.toLocaleString()}/㎡
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3">
                  {hotel.rating ? (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium">
                      ★ {hotel.rating.toFixed(1)}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-400">{hotel.source}</span>
                </td>
                <td className="px-4 py-3">
                  {hotel.url && (
                    <a href={safeUrl(hotel.url)} target="_blank" rel="noopener" className="text-blue-500 hover:underline text-xs">
                      詳細 →
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
