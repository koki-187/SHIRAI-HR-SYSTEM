'use client';
import { useState, useEffect } from 'react';
import { SurveyParams } from '@/types';

interface Props {
  onSubmit: (params: SurveyParams) => void;
  loading: boolean;
}

export default function SurveyForm({ onSubmit, loading }: Props) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const toLocalDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const today = toLocalDateStr(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = toLocalDateStr(tomorrowDate);

  const [params, setParams] = useState<SurveyParams>({
    location: '',
    check_in: today,
    check_out: tomorrow,
    hotel_type: 'all',
    radius_km: 3,
    gemini_api_key: '',
    data_source: 'auto',
  });

  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [keyMsg, setKeyMsg] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/user/profile').then(r => {
      if (cancelled) return;
      if (r.status === 401) { setHasApiKey(null); return null; }
      return r.json();
    }).then(d => {
      if (!cancelled && d) setHasApiKey(d.hasKey ?? false);
    }).catch(() => {
      if (!cancelled) setHasApiKey(false);
    });
    return () => { cancelled = true; };
  }, []);

  const saveApiKey = async () => {
    if (!newKey.trim()) return;
    // 基本フォーマットチェック（Gemini APIキーは AIza で始まる39文字）
    if (!newKey.trim().startsWith('AIza') || newKey.trim().length < 35) {
      setKeyMsg('無効なAPIキー形式です（AIzaSy...から始まる文字列を入力してください）');
      return;
    }
    setSavingKey(true);
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: newKey.trim() }),
    });
    const data = await res.json();
    setSavingKey(false);
    if (res.ok) {
      setHasApiKey(true);
      setShowKeyInput(false);
      setNewKey('');
      setKeyMsg('APIキーを保存しました');
      setTimeout(() => setKeyMsg(''), 3000);
    } else {
      setKeyMsg(data.error || '保存に失敗しました');
    }
  };

  const deleteApiKey = async () => {
    if (!confirm('保存済みのAPIキーを削除しますか？')) return;
    await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: '' }),
    });
    setHasApiKey(false);
    setKeyMsg('APIキーを削除しました');
    setTimeout(() => setKeyMsg(''), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...params, gemini_api_key: '' }); // サーバー側でDB取得
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
              onChange={e => setParams({...params, hotel_type: e.target.value as SurveyParams['hotel_type']})}
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

        {/* データソース選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">データソース</label>
          <div className="flex gap-3 flex-wrap">
            {[
              { value: 'auto', label: '🤖 自動', desc: '最適ソースを自動選択' },
              { value: 'seed', label: '📊 実在データ', desc: '主要都市の実在ホテル' },
              { value: 'rakuten', label: '🔴 楽天トラベル', desc: 'リアルタイム取得' },
              { value: 'mock', label: '🧪 モック', desc: 'テスト用データ' },
            ].map(opt => (
              <label key={opt.value} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition text-sm ${
                params.data_source === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="data_source"
                  value={opt.value}
                  checked={params.data_source === opt.value}
                  onChange={e => setParams({...params, data_source: e.target.value as SurveyParams['data_source']})}
                  className="sr-only"
                />
                <span>{opt.label}</span>
                <span className="text-xs opacity-60">{opt.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Gemini APIキー管理（管理者はhasApiKey=nullのため非表示） */}
        {hasApiKey !== null && <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Gemini APIキー</span>
              {hasApiKey === true && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  登録済み
                </span>
              )}
              {hasApiKey === false && (
                <span className="text-xs text-red-500">未登録</span>
              )}
            </div>
            <div className="flex gap-2">
              {hasApiKey && (
                <button type="button" onClick={deleteApiKey}
                  className="text-xs text-red-500 hover:text-red-700 underline">
                  削除
                </button>
              )}
              <button type="button" onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-xs text-blue-600 hover:text-blue-800 underline">
                {hasApiKey ? '更新' : '登録する'}
              </button>
            </div>
          </div>

          {showKeyInput && (
            <div className="mt-2 flex gap-2">
              <input
                type="password"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={saveApiKey} disabled={savingKey}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition">
                {savingKey ? '保存中...' : '保存'}
              </button>
            </div>
          )}

          {keyMsg && (
            <p className={`text-xs mt-1 ${keyMsg.includes('失敗') ? 'text-red-500' : 'text-green-600'}`}>
              {keyMsg}
            </p>
          )}

          <p className="text-xs text-gray-400 mt-1">
            キーはサーバー側で暗号化保存されます。
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
              className="text-blue-500 hover:underline ml-1">
              Google AI Studioで無料取得
            </a>
          </p>
        </div>}

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
