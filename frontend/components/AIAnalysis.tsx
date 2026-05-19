'use client';
import { useState } from 'react';
import { ScrapeResponse } from '@/types';

interface Props {
  data: ScrapeResponse;
  apiKey: string;
}

export default function AIAnalysis({ data, apiKey }: Props) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!apiKey) {
      setError('Gemini APIキーが設定されていません。調査フォームで入力してください。');
      return;
    }
    setLoading(true);
    setError('');

    const avgPrice = data.hotels.reduce((s, h) => s + h.price_per_night, 0) / data.hotels.length;
    const minPrice = Math.min(...data.hotels.map(h => h.price_per_night));
    const maxPrice = Math.max(...data.hotels.map(h => h.price_per_night));

    const prompt = `
あなたはホテル投資のプロアナリストです。以下のエリアのホテル市場データを分析し、土地仕入れ・ホテル開発の投資判断レポートを日本語で作成してください。

【調査エリア】${data.search_address}
【調査ホテル数】${data.hotels.length}件
【平均宿泊単価（ADR）】¥${Math.round(avgPrice).toLocaleString()}
【最低価格】¥${minPrice.toLocaleString()} / 【最高価格】¥${maxPrice.toLocaleString()}
【月別推移サマリー】
${data.monthly_stats.map(s => `  ${s.month}: 平日¥${s.weekday_avg.toLocaleString()} 休日¥${s.weekend_avg.toLocaleString()}${s.peak_avg ? ` 繁忙期¥${s.peak_avg.toLocaleString()}` : ''}`).join('\n')}

以下の観点で分析してください：
1. 市場規模と価格帯の評価
2. 季節変動・需給バランス
3. 競合環境の評価
4. RevPAR推定（稼働率80%想定）
5. 投資判断（推奨度、リスク、機会）
6. 参入戦略の提案

具体的な数字を交えて、500〜800字程度でまとめてください。
    `.trim();

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'API エラー');
      }

      const result = await res.json();
      setAnalysis(result.candidates?.[0]?.content?.parts?.[0]?.text || '分析結果が空です');
    } catch (e: any) {
      setError(`分析失敗: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-purple-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-purple-900">Gemini AI 投資判断レポート</h3>
        <button
          onClick={run}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          {loading ? '分析中...' : 'AI分析を実行'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}

      {analysis && (
        <div className="bg-white rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {analysis}
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
