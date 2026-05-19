'use client';
import { useState } from 'react';
import { SurveyParams } from '@/types';

interface Props {
  onSubmit: (params: SurveyParams) => void;
  loading: boolean;
}

export default function SurveyForm({ onSubmit, loading }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [params, setParams] = useState<SurveyParams>({
    location: '',
    check_in: today,
    check_out: tomorrow,
    hotel_type: 'all',
    radius_km: 3,
    gemini_api_key: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(params);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">エリア調査</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            調査エリア（住所・駅名・エリア名）
          </label>
          <input
            type="text"
            value={params.location}
            onChange={e => setParams({...params, location: e.target.value})}
            placeholder="例: 渋谷区、新宿駅、大阪市北区"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">チェックイン</label>
            <input
              type="date"
              value={params.check_in}
              onChange={e => setParams({...params, check_in: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">チェックアウト</label>
            <input
              type="date"
              value={params.check_out}
              onChange={e => setParams({...params, check_out: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ホテルタイプ</label>
            <select
              value={params.hotel_type}
              onChange={e => setParams({...params, hotel_type: e.target.value as any})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべて</option>
              <option value="business">ビジネスホテル</option>
              <option value="resort">リゾートホテル</option>
              <option value="budget">格安ホテル</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              調査半径: {params.radius_km}km
            </label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={params.radius_km}
              onChange={e => setParams({...params, radius_km: parseFloat(e.target.value)})}
              className="w-full mt-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gemini APIキー <span className="text-gray-400 font-normal">（AI分析に必要）</span>
          </label>
          <input
            type="password"
            value={params.gemini_api_key}
            onChange={e => setParams({...params, gemini_api_key: e.target.value})}
            placeholder="AIzaSy..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className="text-blue-500 hover:underline">
              Google AI Studioで無料取得
            </a>
            （サーバーには保存されません）
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              調査中... (30〜60秒)
            </>
          ) : '調査開始'}
        </button>
      </form>
    </div>
  );
}
