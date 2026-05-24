import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ヘルプ・使い方ガイド | HotelScope',
  description: 'HotelScopeの使い方・機能説明・FAQ・利用事例',
};

// 目次アイテム
const tocItems = [
  { id: 'overview', label: 'システム概要' },
  { id: 'features', label: '機能説明' },
  { id: 'howto', label: '使い方ガイド' },
  { id: 'cases', label: '利用事例' },
  { id: 'ratelimit', label: 'レート制限・注意事項' },
  { id: 'glossary', label: '用語解説' },
  { id: 'faq', label: 'よくある質問' },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* ========== ヘッダー ========== */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-700 hover:text-blue-800 transition">
            HotelScope
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 transition"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>
      </header>

      {/* ========== ヒーローセクション ========== */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 text-center">
          <p className="text-5xl mb-4">🏨</p>
          <h1 className="text-3xl font-bold mb-3">HotelScope ヘルプ・使い方ガイド</h1>
          <p className="text-blue-200 text-base mb-4">
            ホテル用地仕入れ判断のための周辺ホテル料金市場調査システム
          </p>
          <span className="inline-block bg-yellow-400 text-yellow-900 text-sm font-semibold px-4 py-1.5 rounded-full">
            霞が関キャピタル 白井様 専用システム
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* ========== 目次 ========== */}
        <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📋 目次</h2>
          <ol className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tocItems.map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm hover:underline transition"
                >
                  <span className="bg-blue-100 text-blue-700 font-bold text-xs w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                    {i + 1}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ========== セクション1: システム概要 ========== */}
        <section id="overview" className="scroll-mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">🔍</span> 1. システム概要
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: '📡',
                  title: 'リアルタイムデータ収集',
                  desc: '調査エリアを入力するだけで、周辺ホテルの料金・稼働率・市場トレンドをリアルタイムで収集します。',
                },
                {
                  icon: '🔗',
                  title: '複数OTAの自動統合',
                  desc: '楽天トラベル・Booking.com など複数のOTA（旅行予約サイト）のデータを自動的に統合・比較します。',
                },
                {
                  icon: '🤖',
                  title: 'AI投資判断レポート',
                  desc: 'Gemini AIが収集データを多角的に分析し、ホテル投資判断レポートを日本語で自動生成します。',
                },
              ].map((card) => (
                <div key={card.title} className="bg-blue-50 rounded-xl p-5">
                  <p className="text-3xl mb-2">{card.icon}</p>
                  <h3 className="font-bold text-gray-800 mb-1 text-sm">{card.title}</h3>
                  <p className="text-gray-600 text-sm">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== セクション2: 機能説明 ========== */}
        <section id="features" className="scroll-mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">⚙️</span> 2. 機能説明（タブ別ガイド）
            </h2>

            <div className="space-y-6">

              {/* 市場分析タブ群 */}
              <div>
                <h3 className="font-bold text-blue-700 text-base mb-3 flex items-center gap-2">
                  <span className="bg-blue-700 text-white text-xs px-2 py-0.5 rounded-full">タブ群1</span>
                  📊 市場分析タブ群
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    {
                      tab: '概要',
                      desc: '周辺ホテルの料金分布・平均ADR・最安値〜最高値レンジを表示。ホテル一覧カードで個別ホテルの詳細を確認できます。',
                    },
                    {
                      tab: '比較表',
                      desc: '競合ホテルを価格・評価・レビュー数で一覧比較。列ヘッダーをクリックしてソート、条件でフィルタリングも可能です。',
                    },
                    {
                      tab: '価格推移',
                      desc: '月別の平日・休日・繁忙期ADRの推移グラフ。季節ごとの料金トレンドを一目で把握できます。',
                    },
                    {
                      tab: '要因分析',
                      desc: '祝日・主要イベント・天候・インバウンド動向・為替など、価格に影響する外部要因を整理して表示します。',
                    },
                    {
                      tab: '地図',
                      desc: '調査エリアの地図上に周辺ホテルをプロット。3km圏内のホテル分布・密度を視覚的に確認できます。',
                    },
                    {
                      tab: '部屋分析',
                      desc: '客室タイプ別の面積・㎡単価・RevPAR/㎡を詳細分析。面積効率の視点で投資対象を評価できます。',
                    },
                  ].map((item) => (
                    <div key={item.tab} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                      <p className="font-semibold text-gray-800 text-sm mb-1">
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded mr-2">{item.tab}</span>
                      </p>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 投資判断タブ群 */}
              <div>
                <h3 className="font-bold text-green-700 text-base mb-3 flex items-center gap-2">
                  <span className="bg-green-700 text-white text-xs px-2 py-0.5 rounded-full">タブ群2</span>
                  💰 投資判断タブ群
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    {
                      tab: '投資判断',
                      desc: '物件価格・建設費・借入条件を入力すると、ROI・NOI・返済比率・投資回収年数を自動計算。信号機（赤/黄/緑）で判断結果を直感的に表示します。',
                    },
                    {
                      tab: '開発CF',
                      desc: '10〜30年の事業キャッシュフロー予測。各年の収支・累積CF・NPVを計算し、グラフと表で確認できます。',
                    },
                  ].map((item) => (
                    <div key={item.tab} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                      <p className="font-semibold text-gray-800 text-sm mb-1">
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded mr-2">{item.tab}</span>
                      </p>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* その他タブ */}
              <div>
                <h3 className="font-bold text-purple-700 text-base mb-3 flex items-center gap-2">
                  <span className="bg-purple-700 text-white text-xs px-2 py-0.5 rounded-full">その他</span>
                  その他のタブ
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    {
                      icon: '🏷️',
                      tab: 'ブランドベンチマーク',
                      desc: '国内主要ホテルブランドのADR比較・ポジショニング分析。競合ブランドとのポジション把握に活用できます。',
                    },
                    {
                      icon: '📅',
                      tab: '年間ADR',
                      desc: '過去の調査データから年間ADR推移グラフを生成。繁忙期・閑散期のパターンを長期視点で分析します。',
                    },
                    {
                      icon: '🏆',
                      tab: 'ランキング',
                      desc: '楽天トラベルの都道府県別ホテルランキング（総合・ホテル・ビジネス・リゾート別）を表示します。',
                    },
                    {
                      icon: '🤖',
                      tab: 'Gemini AI分析',
                      desc: '収集データをAIが分析し、投資判断レポートを日本語で自動生成。需給バランス・将来見通しを要約します。',
                    },
                  ].map((item) => (
                    <div key={item.tab} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                      <p className="font-semibold text-gray-800 text-sm mb-1">
                        <span className="text-base mr-1">{item.icon}</span>
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">{item.tab}</span>
                      </p>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========== セクション3: 使い方ガイド ========== */}
        <section id="howto" className="scroll-mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">📖</span> 3. ステップバイステップ 使い方ガイド
            </h2>

            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: '調査エリアを入力',
                  detail: '住所・駅名・エリア名を入力してください。',
                  examples: ['大阪府北区梅田', '渋谷駅', '那覇市国際通り'],
                  color: 'blue',
                },
                {
                  step: 2,
                  title: 'チェックイン・チェックアウト日を設定',
                  detail: '日付を設定すると実際の空室料金（リアルタイム）が取得できます。未設定の場合は標準料金（参考値）を表示します。',
                  examples: [],
                  color: 'blue',
                },
                {
                  step: 3,
                  title: 'ホテルタイプと調査半径を選択',
                  detail: 'ホテルタイプと調査半径を選択します。デフォルトは「すべて」「3km」です。',
                  examples: ['すべて / ビジネスホテル / リゾート / 格安ホテル', '調査半径: 1〜10km（デフォルト3km）'],
                  color: 'blue',
                },
                {
                  step: 4,
                  title: 'データソースを選択（通常は「自動」推奨）',
                  detail: '',
                  examples: [
                    '自動: 楽天→Booking.comの順で最良データを自動取得',
                    '楽天トラベル: 日本国内ホテルに特化、空室料金取得',
                    'Booking.com: 外資系・インバウンド向けホテルも網羅',
                  ],
                  color: 'blue',
                },
                {
                  step: 5,
                  title: '「調査開始」ボタンをクリック',
                  detail: '10〜30秒でデータ収集が完了します。',
                  examples: [],
                  color: 'green',
                },
                {
                  step: 6,
                  title: '各タブで結果を確認',
                  detail: '',
                  examples: [
                    '仕入れ判断モードで投資シミュレーションを実行',
                    'AI分析でレポート自動生成',
                    'Excel/PDF出力で資料化',
                  ],
                  color: 'green',
                },
              ].map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className={`shrink-0 w-9 h-9 rounded-full bg-${s.color}-600 text-white font-bold flex items-center justify-center text-sm`}>
                    {s.step}
                  </div>
                  <div className="flex-1 border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <p className="font-semibold text-gray-800 text-sm mb-1">STEP {s.step}: {s.title}</p>
                    {s.detail && <p className="text-gray-600 text-sm mb-2">{s.detail}</p>}
                    {s.examples.length > 0 && (
                      <ul className="space-y-1">
                        {s.examples.map((ex) => (
                          <li key={ex} className="text-xs text-gray-500 flex items-start gap-1">
                            <span className="text-blue-400 shrink-0 mt-0.5">→</span>
                            {ex}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== セクション4: 利用事例 ========== */}
        <section id="cases" className="scroll-mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">💼</span> 4. 利用事例 4パターン
            </h2>

            <div className="space-y-6">

              {/* 事例1 */}
              <div className="border border-orange-100 rounded-xl overflow-hidden">
                <div className="bg-orange-50 px-5 py-3 border-b border-orange-100">
                  <p className="font-bold text-orange-800 text-sm">
                    事例1: 大阪・梅田エリアのホテル用地仕入れ検討
                  </p>
                  <p className="text-orange-600 text-xs mt-0.5">
                    担当者: ホテル用地仕入れ担当（30代） — 所要時間: 約5分
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-gray-600 text-sm mb-3">
                    <span className="font-semibold text-gray-700">課題:</span> 大阪・梅田エリアで取得候補地がある。周辺の競合ホテル料金や稼働率を把握したい。
                  </p>
                  <ol className="space-y-1.5 text-sm text-gray-600">
                    {[
                      '「大阪府北区梅田」を入力、チェックイン翌週の金曜〜日曜で検索',
                      '概要タブで平均ADR ¥18,000〜¥25,000を確認、週末プレミアム30%を把握',
                      '価格推移タブでGW・夏休み・年末年始の繁忙期料金を確認',
                      '投資判断タブに「物件価格2億円、建設費3億円、客室30室」を入力',
                      'ROI 8.2%、投資回収12年 → 黄色シグナル（要精査）と判断',
                      'AI分析で梅田エリアの需給・リスクレポートを取得',
                      '結果をExcelで出力し社内稟議資料に添付',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-3 bg-orange-50 rounded-lg p-3 text-xs text-orange-700">
                    ✨ 従来の市場調査と比較: <strong>2〜3日 → 約5分</strong>に短縮
                  </div>
                </div>
              </div>

              {/* 事例2 */}
              <div className="border border-blue-100 rounded-xl overflow-hidden">
                <div className="bg-blue-50 px-5 py-3 border-b border-blue-100">
                  <p className="font-bold text-blue-800 text-sm">
                    事例2: 沖縄リゾートエリアの競合調査
                  </p>
                  <p className="text-blue-600 text-xs mt-0.5">
                    担当者: 投資分析チームリーダー（40代）
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-gray-600 text-sm mb-3">
                    <span className="font-semibold text-gray-700">課題:</span> 恩納村のリゾートホテル開発を検討。高級路線が成立するか競合調査したい。
                  </p>
                  <ol className="space-y-1.5 text-sm text-gray-600">
                    {[
                      '「沖縄県恩納村」を入力、「リゾート」タイプを選択',
                      '概要タブで平均ADR ¥35,000〜¥80,000の幅広いレンジを確認',
                      '比較表タブでザ・リッツ・カールトン沖縄などの高級ブランドとの価格差を把握',
                      '部屋分析タブでリゾートの平均客室面積50〜80㎡、㎡単価¥600〜¥1,200を確認',
                      '年間ADRタブで夏休み・GWピーク時ADR ¥120,000超を確認',
                      '投資判断タブで高単価シナリオ（ADR ¥50,000・OCC 65%）を入力 → NOI利回り7.8%',
                      'Gemini AIが「富裕層インバウンド需要旺盛・高級リゾート供給不足・参入余地あり」と分析',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* 事例3 */}
              <div className="border border-purple-100 rounded-xl overflow-hidden">
                <div className="bg-purple-50 px-5 py-3 border-b border-purple-100">
                  <p className="font-bold text-purple-800 text-sm">
                    事例3: 東京・渋谷のビジネスホテル参入可否判断
                  </p>
                  <p className="text-purple-600 text-xs mt-0.5">
                    担当者: 新規事業開発担当（20代後半）
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-gray-600 text-sm mb-3">
                    <span className="font-semibold text-gray-700">課題:</span> 渋谷駅徒歩3分の土地を取得済み。ビジネスホテルとして開発すべきか検討。
                  </p>
                  <ol className="space-y-1.5 text-sm text-gray-600">
                    {[
                      '「東京都渋谷区渋谷駅」を入力、「ビジネスホテル」選択、調査半径2kmに設定',
                      '概要タブで平均ADR ¥22,000、最安値 ¥8,500、最高値 ¥45,000を確認',
                      'ランキングタブで東京都のビジネスホテル上位10社の評価・料金帯を把握',
                      '要因分析タブで渋谷の主要イベント（フェス・展示会）開催カレンダーを確認',
                      '地価APIで渋谷区の商業地価 ¥2,800,000/㎡を確認（REINFOLIBデータ）',
                      '開発CFタブで15年CFシミュレーション: 累積CF ¥3.2億（黒字転換5年目）',
                      '結論: 「渋谷は競争激化だが高ADR維持。IRR 9.2% で投資判断 △」',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="bg-purple-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* 事例4 */}
              <div className="border border-green-100 rounded-xl overflow-hidden">
                <div className="bg-green-50 px-5 py-3 border-b border-green-100">
                  <p className="font-bold text-green-800 text-sm">
                    事例4: 地方都市（金沢）への進出可否の比較検討
                  </p>
                  <p className="text-green-600 text-xs mt-0.5">
                    担当者: 経営企画部（50代）
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-gray-600 text-sm mb-3">
                    <span className="font-semibold text-gray-700">課題:</span> 北陸新幹線延伸後の金沢市の需要持続性を確認。東京・大阪と比較したい。
                  </p>
                  <ol className="space-y-1.5 text-sm text-gray-600">
                    {[
                      '「石川県金沢市片町」で検索 → 平均ADR ¥14,000、OCC推計68%',
                      '続けて「東京都千代田区」「大阪市北区梅田」でも検索し、年間ADRタブを比較',
                      '金沢の価格推移: GW・お盆・秋の紅葉シーズンで平日の2倍に上昇',
                      '要因分析タブで北陸地方のインバウンド急増トレンドを確認',
                      '3都市のADR・OCC・RevPARをExcelで出力 → 比較シートを作成',
                      '投資判断: 「金沢はADRが東京の60%だが地価は20%。RevPAR効率は金沢が優位」',
                      'Gemini分析: 「北陸新幹線延伸効果は継続中。ただし2026年以降の供給増加に注意」',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========== セクション5: レート制限・注意事項 ========== */}
        <section id="ratelimit" className="scroll-mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> 5. レート制限・注意事項
            </h2>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-6">
              本システムは<strong>白井様専用</strong>として構築されています。以下の利用制限にご注意ください。
            </p>

            {/* レート制限テーブル */}
            <h3 className="font-bold text-gray-700 text-sm mb-3">▼ APIレート制限一覧（1分あたりの上限）</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">機能</th>
                    <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">上限回数</th>
                    <th className="px-4 py-3 text-left font-semibold">制限がかかる条件</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['調査開始（市場調査）', '20回/分', 'OTA API（楽天・Booking.com）'],
                    ['AI分析（Gemini）', '10回/分', 'Gemini API 呼び出し'],
                    ['ホテルランキング', '30回/分', '楽天トラベル API'],
                    ['年間ADRレポート', '30回/分', 'データベース集計'],
                    ['地価取得', '30回/分', '国交省 REINFOLIB API'],
                    ['アカウント登録', '5回/分', 'セキュリティ（不正防止）'],
                    ['その他API', '60回/分', '一般操作'],
                  ].map(([func, limit, cond], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-gray-800">{func}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          {limit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{cond}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 制限がかかった場合 */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-red-700 text-sm mb-2">▼ 制限がかかった場合</h3>
              <ul className="space-y-1 text-sm text-red-600">
                <li>→ 「リクエスト数の上限に達しました」というメッセージが表示されます</li>
                <li>→ 1分間待機してから再試行してください</li>
                <li>→ 短時間に複数人で同時に使用すると制限がかかる場合があります</li>
              </ul>
            </div>

            {/* 外部APIクォータ */}
            <h3 className="font-bold text-gray-700 text-sm mb-3">▼ 外部APIのクォータ（月間・日間制限）</h3>
            <div className="space-y-2 mb-6">
              {[
                { service: '楽天トラベルAPI', quota: '2,000〜10,000リクエスト/月（申請プランによる）' },
                { service: 'Booking.com（RapidAPI）', quota: 'プランに応じた月間上限' },
                { service: 'Gemini API', quota: '無料枠 1,500リクエスト/日（有料プランは無制限）' },
                { service: 'e-Stat（統計局）', quota: '1,000リクエスト/日' },
                { service: '国交省地価API', quota: '制限なし（公共API）' },
              ].map((item) => (
                <div key={item.service} className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg px-4 py-2.5">
                  <span className="font-semibold text-gray-700 w-44 shrink-0">{item.service}</span>
                  <span className="text-gray-500">:</span>
                  <span className="text-gray-600">{item.quota}</span>
                </div>
              ))}
            </div>

            {/* 注意事項 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-bold text-yellow-800 text-sm mb-2">▼ その他注意事項</h3>
              <ul className="space-y-1 text-sm text-yellow-700">
                <li>・本データは市場調査目的のみ。投資判断の最終決定は専門家にご相談ください</li>
                <li>・AIの分析結果はあくまで参考情報です。精度を保証するものではありません</li>
                <li>・リアルタイムデータは取得時点の情報です。ホテル料金は随時変動します</li>
              </ul>
            </div>

          </div>
        </section>

        {/* ========== セクション6: 用語解説 ========== */}
        <section id="glossary" className="scroll-mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">📚</span> 6. 用語解説（Glossary）
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  term: 'ADR',
                  full: 'Average Daily Rate',
                  desc: '平均客室単価。1室1泊の平均売上金額。ホテル収益力の基本指標。',
                },
                {
                  term: 'OCC',
                  full: 'Occupancy Rate',
                  desc: '稼働率。全客室のうち販売された割合（%）。需要の強さを示す。',
                },
                {
                  term: 'RevPAR',
                  full: 'Revenue Per Available Room',
                  desc: '販売可能客室あたり収益。ADR × OCC ÷ 100 で計算。総合的な収益指標。',
                },
                {
                  term: 'RevPAR/㎡',
                  full: 'RevPAR per Square Meter',
                  desc: '1平方メートルあたりのRevPAR。客室面積の効率性を示す指標。',
                },
                {
                  term: 'NOI',
                  full: 'Net Operating Income',
                  desc: '純営業収益。営業収益から運営費を引いた金額。物件の収益力そのもの。',
                },
                {
                  term: 'IRR',
                  full: 'Internal Rate of Return',
                  desc: '内部収益率。投資の実質的な年利回り。NPV=0となる割引率。',
                },
                {
                  term: 'NPV',
                  full: 'Net Present Value',
                  desc: '正味現在価値。将来のCFを現在価値に換算した総額。プラスなら投資価値あり。',
                },
                {
                  term: 'OTA',
                  full: 'Online Travel Agency',
                  desc: '楽天トラベル・Booking.com などのオンライン旅行予約サイト。',
                },
                {
                  term: 'CF',
                  full: 'Cash Flow',
                  desc: 'キャッシュフロー。実際の現金収支。収益と費用の差引残高。',
                },
                {
                  term: 'GRM',
                  full: 'Gross Rent Multiplier',
                  desc: '総収益乗数。物件価格÷年間総収益。数値が低いほど投資効率が高い。',
                },
                {
                  term: 'CapRate',
                  full: 'Capitalization Rate',
                  desc: '還元利回り。NOI÷物件価格。不動産の収益性比較に使われる基本指標。',
                },
                {
                  term: 'インバウンド',
                  full: 'Inbound Tourism',
                  desc: '訪日外国人旅行者。ホテル需要の増加要因として重要な指標。',
                },
                {
                  term: 'アウトバウンド',
                  full: 'Outbound Tourism',
                  desc: '海外旅行する日本人。増加時は国内ホテル需要の減少要因になり得る。',
                },
                {
                  term: '繁忙期',
                  full: 'Peak Season',
                  desc: '稼働率・料金が特に高い時期。GW・夏休み・年末年始・紅葉シーズン等。',
                },
                {
                  term: '仕入れ',
                  full: 'Acquisition',
                  desc: 'ホテル事業用の土地・建物の取得。本システムの主用途である仕入れ判断に使用。',
                },
              ].map((item) => (
                <div key={item.term} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-blue-700 text-sm">{item.term}</span>
                    <span className="text-gray-400 text-xs">({item.full})</span>
                  </div>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== セクション7: Q&A ========== */}
        <section id="faq" className="scroll-mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">❓</span> 7. よくある質問 (Q&A)
            </h2>

            <div className="space-y-4">
              {[
                {
                  q: 'データはリアルタイムですか？',
                  a: 'はい。楽天トラベル VacantHotelSearch（空室連動料金）および Booking.com のデータはリアルタイムで取得します。ただし、APIのレスポンスや外部サービスの状況により、数秒〜数十秒かかる場合があります。',
                },
                {
                  q: 'チェックイン日を入力しないとどうなりますか？',
                  a: '日付なしの場合は「標準料金（参考値）」が表示されます。実際の空室状況に基づく料金を取得するには、チェックイン日とチェックアウト日の両方を入力してください。',
                },
                {
                  q: '「データなし」と表示された場合は？',
                  a: '対象エリアにホテルが少ない、または外部APIが応答しない場合に表示されます。①調査エリアをより具体的な駅名・住所に変更、②チェックイン日を指定、③データソースを「楽天トラベル」に限定、してみてください。',
                },
                {
                  q: 'AI分析は有料ですか？',
                  a: 'Google Gemini APIの利用には一定のクォータがあります。無料枠（1日1,500リクエスト）内であれば追加費用はかかりません。大量使用の場合は有料プランへの切り替えが必要です。',
                },
                {
                  q: 'データの精度はどの程度ですか？',
                  a: 'OTA（楽天・Booking.com）からリアルタイムで取得するため、その時点での公開料金は正確です。OCC（稼働率）はe-Stat（政府統計）の観光庁データを使用しており、月単位の実績値です。投資判断の参考情報としてお使いください。',
                },
                {
                  q: 'Excel/PDFはどこから出力できますか？',
                  a: '調査結果が表示された後、画面上部の「📊 Excel出力」「📄 PDF出力」ボタンから出力できます。全タブの分析データが含まれます。',
                },
                {
                  q: '過去に調査したデータは残りますか？',
                  a: 'はい。調査履歴は自動保存されます（最新50件）。「比較表」タブの「時系列比較」セクションで過去調査との推移を確認できます。',
                },
                {
                  q: 'スマートフォンでも使えますか？',
                  a: 'はい。レスポンシブデザインに対応しており、スマートフォン・タブレットでも利用可能です。ただし、PCブラウザでの利用が最も快適です。',
                },
                {
                  q: '同時に複数エリアを調査できますか？',
                  a: '現在は1エリアずつの調査です。複数エリアを比較したい場合は、それぞれ個別に調査し、Excelで出力してご比較ください。',
                },
                {
                  q: 'パスワードを忘れた場合は？',
                  a: '管理者（運営者）に連絡して、パスワードリセットを依頼してください。',
                },
              ].map((item, i) => (
                <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer bg-gray-50 hover:bg-gray-100 transition select-none">
                    <div className="flex items-start gap-3">
                      <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5">Q</span>
                      <span className="text-sm font-semibold text-gray-800">{item.q}</span>
                    </div>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-3">▼</span>
                  </summary>
                  <div className="px-5 py-4 bg-white border-t border-gray-100">
                    <div className="flex items-start gap-3">
                      <span className="bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5">A</span>
                      <p className="text-sm text-gray-600">{item.a}</p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ========== フッター ========== */}
        <footer className="text-center py-8">
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition shadow-sm"
          >
            ← ダッシュボードに戻る
          </Link>
          <p className="text-xs text-gray-400 mt-6">
            HotelScope — 霞が関キャピタル 白井様 専用システム
          </p>
        </footer>

      </div>
    </main>
  );
}
