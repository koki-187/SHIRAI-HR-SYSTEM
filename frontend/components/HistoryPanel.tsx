'use client';
import { SurveyHistory } from '@/types';

interface Props {
  history: SurveyHistory[];
  onSelect: (h: SurveyHistory) => void;
  onDelete: (id: string) => void;
}

export default function HistoryPanel({ history, onSelect, onDelete }: Props) {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm text-center">
        <p className="text-gray-400 text-sm">調査履歴がありません</p>
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
                  onClick={() => onDelete(h.id)}
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
