'use client';
import { useState } from 'react';
import { ScrapeResponse } from '@/types';

interface Props {
  data: ScrapeResponse;
}

export default function AIAnalysis({ data }: Props) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
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
【平均宿泊単価（ADR）】¥${Math.round(avgPrice).toLocaleString()}
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
