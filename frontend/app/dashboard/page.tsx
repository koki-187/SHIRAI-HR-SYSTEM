'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import SurveyForm from '@/components/SurveyForm';
import ResultTabs from '@/components/ResultTabs';
import HistoryPanel from '@/components/HistoryPanel';
import HistoryComparison from '@/components/HistoryComparison';
import ErrorBoundary from '@/components/ErrorBoundary';
import InvestmentPanel from '@/components/InvestmentPanel';
import MultiAreaCompare from '@/components/MultiAreaCompare';
import { scrapeHotels } from '@/lib/api';
import { ScrapeResponse, SurveyParams, SurveyHistory, InvestmentParams } from '@/types';
import { useToast } from '@/components/Toast';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [currentParams, setCurrentParams] = useState<SurveyParams | null>(null);
  const [investmentParams, setInvestmentParams] = useState<InvestmentParams | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<SurveyHistory[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) setHistory(await res.json());
    } catch (e: unknown) {
      console.error('[loadHistory] failed:', e instanceof Error ? e.message : e);
    }
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
      toast('調査が完了しました！', 'success');

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
    } catch (e: unknown) {
      setError(`調査失敗: ${e instanceof Error ? e.message : String(e)}`);
      toast('調査に失敗しました。再試行してください。', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = useCallback((h: SurveyHistory) => {
    setResult(h.result);
    setCurrentParams(h.params);
  }, []);

  // MultiAreaCompare の「詳細表示」ボタンからのカスタムイベントを受信
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const entry = e.detail as SurveyHistory;
      if (entry?.result && entry?.params) handleHistorySelect(entry);
    };
    window.addEventListener('hotelscope:select-history', handler as EventListener);
    return () => window.removeEventListener('hotelscope:select-history', handler as EventListener);
  }, [handleHistorySelect]);

  const handleHistoryDelete = async (id: string) => {
    try {
      await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      loadHistory();
      toast('履歴を削除しました', 'info');
    } catch {
      toast('削除に失敗しました', 'error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)]">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-700">HotelScope</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{session?.user?.name} さん</span>
            <a href="/help" target="_blank" rel="noopener noreferrer"
              className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg transition">
              ❓ ヘルプ
            </a>
            {session?.user?.isAdmin && (
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

            <InvestmentPanel onUpdate={setInvestmentParams} />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">❌</span>
                  <div className="flex-1">
                    <p className="font-medium">{error}</p>
                    <button
                      onClick={() => setError('')}
                      className="text-xs text-red-500 underline mt-1 hover:no-underline"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              </div>
            )}

            <HistoryPanel
              history={history}
              onSelect={handleHistorySelect}
              onDelete={handleHistoryDelete}
              isLoading={loading && history.length === 0}
            />
          </div>

          {/* 右カラム: 結果 */}
          <div className="lg:col-span-2">
            {loading && !result ? (
              /* 調査中ローディング表示 */
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
                  <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
                <p className="text-lg font-semibold text-gray-700 mb-2">周辺ホテルを調査中...</p>
                <p className="text-sm text-gray-400 mb-6">楽天トラベル・Booking.com からリアルタイムデータを取得しています</p>
                <div className="flex flex-col gap-2 max-w-xs mx-auto text-left">
                  {[
                    { step: '1', label: '住所・座標を解析中', done: true },
                    { step: '2', label: '周辺ホテルを検索中', done: false },
                    { step: '3', label: '料金・評価データを収集中', done: false },
                    { step: '4', label: '統計レポートを生成中', done: false },
                  ].map((s, i) => (
                    <div key={s.step} className={`flex items-center gap-3 text-sm ${i === 1 ? 'text-blue-600' : i > 1 ? 'text-gray-300' : 'text-green-600'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i === 0 ? 'bg-green-100 text-green-600' :
                        i === 1 ? 'bg-blue-100 text-blue-600 animate-pulse' :
                        'bg-gray-100 text-gray-300'
                      }`}>
                        {i === 0 ? '✓' : s.step}
                      </div>
                      {s.label}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-300 mt-6">通常 30〜60 秒かかります</p>
              </div>
            ) : result && currentParams ? (
              <div className="space-y-6">
                <ErrorBoundary label="調査結果">
                  <ResultTabs data={result} params={currentParams} investmentParams={investmentParams} />
                </ErrorBoundary>
                <ErrorBoundary label="エリア比較">
                  <HistoryComparison history={history} currentLocation={currentParams.location} />
                </ErrorBoundary>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
                <p className="text-5xl mb-4">🏨</p>
                <p className="text-lg font-semibold text-gray-600 mb-2">エリア調査を開始しましょう</p>
                <div className="text-sm text-gray-400 space-y-1 mt-4">
                  <p>① 左のフォームで調査エリアを入力</p>
                  <p>② 「調査開始」ボタンを押す</p>
                  <p>③ 周辺ホテルのADR分析結果が表示されます</p>
                </div>
                <p className="text-xs text-gray-300 mt-6">対応エリア：渋谷・新宿・梅田・京都・名古屋・博多・札幌・横浜 ほか全国</p>
              </div>
            )}

            {/* 多エリア横断比較 */}
            {history.length > 0 && (
              <div className="mt-6">
                <ErrorBoundary>
                  <MultiAreaCompare
                    histories={history.map(h => ({
                      id: h.id,
                      location: h.location,
                      search_address: h.search_address,
                      result: typeof h.result === 'string'
                        ? (JSON.parse(h.result) as ScrapeResponse)
                        : h.result,
                    }))}
                  />
                </ErrorBoundary>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
