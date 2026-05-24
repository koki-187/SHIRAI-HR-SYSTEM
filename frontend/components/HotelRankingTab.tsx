'use client';
import { useState, useEffect, useCallback } from 'react';

interface RankedHotel {
  rank: number;
  hotelNo: number;
  hotelName: string;
  hotelSpecial: string;
  hotelMinCharge: number | null;
  reviewAverage: number | null;
  reviewCount: number | null;
  hotelImageUrl: string;
  hotelInformationUrl: string;
  prefecture: string;
}

interface Props {
  lat: number;
  lng: number;
}

const GENRES = [
  { value: 'all',      label: '総合' },
  { value: 'hotel',    label: 'ホテル' },
  { value: 'business', label: 'ビジネス' },
  { value: 'resort',   label: 'リゾート' },
  { value: 'pension',  label: 'ペンション' },
] as const;

export default function HotelRankingTab({ lat, lng }: Props) {
  const [hotels, setHotels] = useState<RankedHotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [genre, setGenre] = useState<'all' | 'hotel' | 'business' | 'resort' | 'pension'>('all');
  const [prefecture, setPrefecture] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');

  const fetchRanking = useCallback(async (g: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ lat: String(lat), lng: String(lng), genre: g });
      const res = await fetch(`/api/hotel-ranking?${params}`);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '取得失敗');
      setHotels(data.hotels ?? []);
      setPrefecture(data.prefecture ?? '');
      setSourceLabel(data.sourceLabel ?? '');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '取得中にエラーが発生しました');
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => { fetchRanking(genre); }, [fetchRanking, genre]);

  const rankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900';
    if (rank === 2) return 'bg-gray-300 text-gray-700';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-blue-50 text-blue-700';
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-800">🏆 エリアホテルランキング</h3>
          {sourceLabel && (
            <p className="text-xs text-gray-400 mt-0.5">{sourceLabel}</p>
          )}
        </div>
        {/* ジャンル切り替え */}
        <div className="flex gap-1 flex-wrap">
          {GENRES.map(g => (
            <button
              key={g.value}
              onClick={() => setGenre(g.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                genre === g.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* ローディング */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="ml-2 text-sm text-gray-500">ランキング取得中...</span>
        </div>
      )}

      {/* エラー */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* ランキングリスト */}
      {!loading && !error && hotels.length > 0 && (
        <div className="space-y-2">
          {hotels.map(hotel => (
            <a
              key={hotel.hotelNo}
              href={hotel.hotelInformationUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition group"
            >
              {/* ランクバッジ */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${rankBadge(hotel.rank)}`}>
                {hotel.rank}
              </div>

              {/* ホテル画像 */}
              {hotel.hotelImageUrl && (
                <img
                  src={hotel.hotelImageUrl}
                  alt={hotel.hotelName}
                  className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}

              {/* ホテル情報 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 truncate">
                  {hotel.hotelName}
                </p>
                {hotel.hotelSpecial && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{hotel.hotelSpecial}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  {hotel.reviewAverage && (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      ⭐ {hotel.reviewAverage.toFixed(1)}
                      {hotel.reviewCount && (
                        <span className="text-gray-400">({hotel.reviewCount.toLocaleString()}件)</span>
                      )}
                    </span>
                  )}
                  {hotel.hotelMinCharge && (
                    <span className="text-xs text-blue-700 font-medium">
                      ¥{hotel.hotelMinCharge.toLocaleString()}〜/泊
                    </span>
                  )}
                </div>
              </div>

              {/* 矢印 */}
              <span className="text-gray-300 group-hover:text-blue-400 text-sm flex-shrink-0 mt-1">→</span>
            </a>
          ))}
        </div>
      )}

      {/* データなし */}
      {!loading && !error && hotels.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-2xl mb-2">🏨</p>
          <p className="text-sm">ランキングデータを取得できませんでした</p>
          <p className="text-xs mt-1">RAKUTEN_APP_ID が設定されているか確認してください</p>
        </div>
      )}

      {/* 注釈 */}
      {!loading && hotels.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          出典: 楽天トラベル ホテルランキング API
        </p>
      )}
    </div>
  );
}
