'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrapeResponse } from '@/types';

interface Props {
  data: ScrapeResponse;
  autoRun?: boolean;  // trueで調査完了後に自動分析
}

const formatAnalysis = (text: string) => {
  return text.split('\n').map((line, i) => {
    const isHeader = /^[\d]+\./.test(line.trim()) || line.startsWith('【');
    return (
      <p key={i} className={`${isHeader ? 'font-semibold text-gray-800 mt-2' : 'text-gray-600'} leading-relaxed text-sm`}>
        {line || <br />}
      </p>
    );
  });
};

export default function AIAnalysis({ data, autoRun = false }: Props) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const retryCountRef = useRef(0);

  const run = useCallback(async () => {
    setLoading(true);
    setError('');

    if (!data.hotels || data.hotels.length === 0) {
      setError('ホテルデータが存在しないため分析できません');
      setLoading(false);
      return;
    }

    const avgPrice = data.hotels.reduce((s, h) => s + h.price_per_night, 0) / data.hotels.length;
    const minPrice = Math.min(...data.hotels.map(h => h.price_per_night));
    const maxPrice = Math.max(...data.hotels.map(h => h.price_per_night));

    // ㎡データサマリー
    const hotelsWithRooms = data.hotels.filter(h => h.avg_room_size && h.avg_price_per_sqm);
    const avgSqm = hotelsWithRooms.length > 0
      ? Math.round(hotelsWithRooms.reduce((s, h) => s + (h.avg_room_size ?? 0), 0) / hotelsWithRooms.length)
      : null;
    const avgPpSqm = hotelsWithRooms.length > 0
      ? Math.round(hotelsWithRooms.reduce((s, h) => s + (h.avg_price_per_sqm ?? 0), 0) / hotelsWithRooms.length)
      : null;
    const revparPerSqm = avgPpSqm ? Math.round(avgPpSqm * 0.8) : null;

    const roomSummary = avgSqm && avgPpSqm
      ? `【平均客室面積】${avgSqm}㎡\n【平均㎡単価】¥${avgPpSqm.toLocaleString()}/㎡\n【RevPAR/㎡推定】¥${revparPerSqm?.toLocaleString()}/㎡（稼働率80%）`
      : '';

    const prompt = `
あなたはホテル投資のプロアナリストです。以下のエリアのホテル市場データを分析し、土地仕入れ・ホテル開発の投資判断レポートを日本語で作成してください。

【調査エリア】${data.search_address}
【調査ホテル数】${data.hotels.length}件
【平均ADR（OTA公開価格）】¥${Math.round(avgPrice).toLocaleString()}
【平均ADR（推定成約価格）】¥${Math.round(avgPrice * 0.77).toLocaleString()}（OTA比-23%補正）
【最低価格】¥${minPrice.toLocaleString()} / 【最高価格】¥${maxPrice.toLocaleString()}
${roomSummary}
【月別推移サマリー】
${data.monthly_stats.map(s => `  ${s.month}: 平日¥${s.weekday_avg.toLocaleString()} 休日¥${s.weekend_avg.toLocaleString()}${s.peak_avg ? ` 繁忙期¥${s.peak_avg.toLocaleString()}` : ''}`).join('\n')}

以下の観点で分析してください：
1. 市場規模と価格帯の評価
2. 季節変動・需給バランス
3. 競合環境の評価
4. RevPAR推定・RevPAR/㎡効率（稼働率80%想定）
5. 客室面積・㎡単価から見た競争力評価
6. 投資判断（推奨度、リスク、機会）
7. 参入戦略の提案（客室グレード・面積設定含む）

※ADR分析はOTA公開価格(-23%補正後の推定成約価格)を基準に行ってください。
具体的な数字を交えて、600〜900字程度でまとめてください。
    `.trim();

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'API エラー');
      setAnalysis(result.text || '分析結果が空です');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('Gemini APIキー') || msg.includes('登録されていません')) {
        setError('Gemini APIキーが未登録です。フォームの「登録する」からAPIキーを保存してください。');
      } else if (msg.includes('401') || msg.includes('403')) {
        setError('APIキーが無効です。正しいGemini APIキーを再登録してください。');
      } else if (msg.includes('429')) {
        setError('APIレート制限に達しました。しばらく待ってから再試行してください。');
      } else if (msg.includes('timeout') || msg.includes('504')) {
        setError('分析がタイムアウトしました。再試行してください。');
      } else {
        setError(`分析失敗: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (autoRun && data.hotels?.length > 0) {
      // 3秒後に自動実行（ユーザーが結果を確認する時間を確保）
      const t = setTimeout(() => run(), 3000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]); // autoRunが変化したときだけ発火

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-purple-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-purple-900">Gemini AI 投資判断レポート</h3>
          {autoRun && !analysis && !error && !loading && (
            <p className="text-xs text-purple-500 mt-0.5">📡 調査完了後に自動分析します</p>
          )}
          {loading && (
            <p className="text-xs text-purple-400 mt-0.5 animate-pulse">🤖 Gemini が分析中です...</p>
          )}
        </div>
        <button
          onClick={() => { retryCountRef.current = 0; run(); }}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              分析中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              AI分析を実行
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0">❌</span>
            <div className="flex-1">
              <p>{error}</p>
              <button
                onClick={() => { retryCountRef.current = 0; run(); }}
                className="text-xs text-red-600 underline mt-1 hover:no-underline font-medium"
              >
                🔄 再試行
              </button>
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="relative">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(analysis);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={`absolute top-2 right-2 text-xs px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
              copied
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700'
            }`}
            title="クリップボードにコピー"
          >
            {copied ? '✅ コピー済み' : '📋 コピー'}
          </button>
          <div className="bg-white rounded-lg p-4 pt-8">
            {formatAnalysis(analysis)}
          </div>
        </div>
      )}

      {!analysis && !error && (
        <p className="text-purple-600 text-sm">
          「AI分析を実行」ボタンを押すと、Gemini AIが市場データを分析して投資判断レポートを生成します。
        </p>
      )}
    </div>
  );
}
