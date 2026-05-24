'use client';
import { SurveyHistory } from '@/types';

interface Props {
  history: SurveyHistory[];
  onSelect: (h: SurveyHistory) => void;
  onDelete: (id: string) => Promise<void> | void;
  isLoading?: boolean;
}

export default function HistoryPanel({ history, onSelect, onDelete, isLoading }: Props) {
  const handleDelete = async (id: string) => {
    if (!confirm('この履歴を削除しますか？')) return;
    try {
      await onDelete(id);
    } catch {
      alert('削除に失敗しました。再試行してください。');
    }
  };
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
        {[1,2].map(i => (
          <div key={i} className="py-3 border-b border-gray-50 last:border-0">
            <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
            <div className="h-2.5 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm text-center">
        <p className="text-3xl mb-2">📋</p>
        <p className="text-gray-500 text-sm font-medium">調査履歴がありません</p>
        <p className="text-gray-300 text-xs mt-1">調査を実行すると自動保存されます</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-700 text-sm">調査履歴</h3>
        <span className="text-xs text-gray-400">{history.length}件</span>
      </div>
      <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {history.map(h => {
          const avg = h.result?.hotels?.length > 0
            ? Math.round(h.result.hotels.reduce((s, hotel) => s + hotel.price_per_night, 0) / h.result.hotels.length)
            : null;
          return (
            <li key={h.id} className="hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-2 px-4 py-3">
                <button onClick={() => onSelect(h)} className="flex-1 text-left min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{h.location}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">
                      {new Date(h.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {avg && (
                      <span className="text-xs text-blue-600 font-medium">
                        平均¥{avg.toLocaleString()}
                      </span>
                    )}
                    {h.result?.hotels?.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {h.result.hotels.length}件
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(h.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors mt-1 shrink-0"
                  title="削除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
