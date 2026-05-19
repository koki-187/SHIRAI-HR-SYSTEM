'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import SurveyForm from '@/components/SurveyForm';
import ResultTabs from '@/components/ResultTabs';
import HistoryPanel from '@/components/HistoryPanel';
import { scrapeHotels } from '@/lib/api';
import { ScrapeResponse, SurveyParams, SurveyHistory } from '@/types';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [currentParams, setCurrentParams] = useState<SurveyParams | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<SurveyHistory[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/history');
    if (res.ok) setHistory(await res.json());
  }, []);

  useEffect(() => {
    if (session) loadHistory();
  }, [session, loadHistory]);

  const handleSurvey = async (params: SurveyParams) => {
    setLoading(true);
    setError('');
    try {
      const data = await scrapeHotels(params);
      setResult(data);
      setCurrentParams(params);

      // 履歴に保存
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          location: params.location,
          search_address: data.search_address,
          params,
          result: data,
        }),
      });
      loadHistory();
    } catch (e: any) {
      setError(`調査失敗: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = (h: SurveyHistory) => {
    setResult(h.result);
    setCurrentParams(h.params);
  };

  const handleHistoryDelete = async (id: string) => {
    await fetch('/api/history', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    loadHistory();
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-700">HotelScope</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{session?.user?.name} さん</span>
            {(session?.user as any)?.isAdmin && (
              <a href="/admin"
                className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition">
                管理者パネル
              </a>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 transition"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム: フォーム + 履歴 */}
          <div className="space-y-4">
            <SurveyForm onSubmit={handleSurvey} loading={loading} />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                {error}
              </div>
            )}

            <HistoryPanel
              history={history}
              onSelect={handleHistorySelect}
              onDelete={handleHistoryDelete}
            />
          </div>

          {/* 右カラム: 結果 */}
          <div className="lg:col-span-2">
            {result && currentParams ? (
              <ResultTabs data={result} params={currentParams} />
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
                <p className="text-4xl mb-4">🏨</p>
                <p className="text-lg font-medium">調査エリアを入力してください</p>
                <p className="text-sm mt-2">
                  住所・駅名・エリア名を入力して「調査開始」を押すと
                  <br />
                  周辺ホテルの料金データを収集・分析します
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
