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
      <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-400">
        <p>調査履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-700">調査履歴</h3>
      </div>
      <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {history.map(h => (
          <li key={h.id} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50">
            <button onClick={() => onSelect(h)} className="flex-1 text-left">
              <p className="font-medium text-gray-800 text-sm">{h.location}</p>
              <p className="text-xs text-gray-400">
                {new Date(h.created_at).toLocaleDateString('ja-JP')}
              </p>
            </button>
            <button
              onClick={() => onDelete(h.id)}
              className="text-red-400 hover:text-red-600 text-xs px-2"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
