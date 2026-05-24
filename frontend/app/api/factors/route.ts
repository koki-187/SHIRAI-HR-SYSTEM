import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchHolidays } from '@/lib/holidays';

const EVENTS = [
  { name: '年末年始', months: [12, 1], period: '12月28日〜1月4日', impact: 'very_high', description: '帰省・旅行需要で宿泊費が年間最高水準。都市部・観光地ともに満室続出。' },
  { name: '桜シーズン（花見）', months: [3, 4], period: '3月下旬〜4月中旬', impact: 'very_high', description: '全国の観光地で需要急増。京都・東京・大阪は特に顕著。インバウンド客も集中。' },
  { name: 'ゴールデンウィーク（GW）', months: [4, 5], period: '4月29日〜5月6日', impact: 'very_high', description: '国内最大の連休。宿泊施設の価格が平均の2〜3倍に上昇するエリアも。早期予約必須。' },
  { name: '夏休み・お盆', months: [7, 8], period: '7月下旬〜8月中旬（特に8月10日〜16日）', impact: 'very_high', description: '帰省・海水浴・テーマパーク需要が重なる。リゾート地・ビーチエリアは最繁忙期。' },
  { name: '紅葉シーズン', months: [10, 11], period: '10月中旬〜11月下旬', impact: 'high', description: '京都・日光・東北エリアで需要急増。インバウンド客にも人気の高い時期。' },
  { name: 'クリスマス・年末', months: [12], period: '12月23日〜12月31日', impact: 'high', description: 'カップル・ファミリー需要で都市部ホテルが高騰。イルミネーション観光も集客要因。' },
  { name: 'シルバーウィーク', months: [9], period: '9月中旬〜下旬（年により変動）', impact: 'high', description: '敬老の日・秋分の日前後。5連休以上になる年は特に需要が高まる。' },
  { name: 'インバウンドピーク（春）', months: [3, 4, 5], period: '3月〜5月', impact: 'high', description: '外国人旅行者の春の来日ピーク。桜・GWと重なり、都市部の高単価ホテルが恩恵を受ける。' },
  { name: 'インバウンドピーク（秋）', months: [10, 11], period: '10月〜11月', impact: 'high', description: '外国人旅行者の秋の来日ピーク。紅葉観光・文化体験で京都・奈良・金沢等が人気。' },
  { name: '連休需要（ハッピーマンデー）', months: [1, 2, 7, 9, 10], period: '各月の第2・第3月曜日前後', impact: 'medium', description: '成人の日・海の日・敬老の日・スポーツの日等の3連休。近距離旅行需要が発生。' },
  { name: '学会・MICE需要', months: [3, 6, 9, 11], period: '年4回の学会・展示会シーズン', impact: 'medium', description: '大型国際会議・展示会開催時は周辺ホテルが数週間前から満室に。' },
  { name: '受験シーズン', months: [1, 2], period: '1月中旬〜2月下旬', impact: 'medium', description: 'センター試験・大学入試期間。試験会場周辺ホテルが受験生・保護者で混雑。' },
];

const WEATHER_NOTES: Record<number, string> = {
  1: '冬季（1月）: 全国的に寒波・降雪リスク。スキーリゾートは最繁忙期。太平洋側は乾燥・晴天が多い。',
  2: '冬季（2月）: 最寒期。積雪地域では交通障害も。梅の開花が始まり、一部の観光地で客足回復。',
  3: '春先（3月）: 気候が改善し旅行需要が急増。桜前線が南から北上開始。花粉シーズンも重なる。',
  4: '春（4月）: 桜満開・GW前半で年間最高の需要期。好天に恵まれる日が多く観光に最適。',
  5: '春〜初夏（5月）: GW後半から初夏へ。新緑が美しく旅行者が多い。天候は安定。',
  6: '梅雨（6月）: 本州は梅雨入りで旅行需要がやや低下。北海道は梅雨なし・ラベンダーシーズン開始で人気。',
  7: '夏（7月）: 梅雨明け後は猛暑。海水浴・夏祭り・花火大会で需要急増。',
  8: '夏〜お盆（8月）: 年間最高気温。お盆を中心に国内最大の移動需要。早期予約・高価格が常態化。',
  9: '初秋（9月）: 台風シーズン（9月が最多）。被害を受けたエリアは需要が急低下することも。',
  10: '秋（10月）: 気候が安定し行楽シーズン本格化。インバウンド需要も旺盛。',
  11: '晩秋（11月）: 紅葉ピーク。京都・日光・東北の需要が特に高まる。',
  12: '冬〜年末（12月）: 前半は比較的閑散だが、クリスマス・年末年始に向け急上昇。',
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const monthParam = searchParams.get('month');
  const month = monthParam ? parseInt(monthParam) : null;

  const allHolidays = await fetchHolidays(year - 1, year + 1);
  const yearHolidays = allHolidays.filter(h => parseInt(h.date.slice(0, 4)) === year);
  const holidays = month !== null ? yearHolidays.filter(h => h.month === month) : yearHolidays;
  const events = month !== null ? EVENTS.filter(e => e.months.includes(month)) : EVENTS;
  const weather_notes = month !== null
    ? (WEATHER_NOTES[month] ?? '天候データなし')
    : '春（3〜5月）: 桜・GW需要で最繁忙。夏（7〜8月）: お盆ピーク・海水浴需要。秋（10〜11月）: 紅葉シーズン・インバウンド活発。冬（12〜2月）: 年末年始ピーク・スキーリゾート需要。';

  const inbound_trend = `${year}年のインバウンド動向: 2024年は訪日外国人数が3,600万人を超え過去最高を記録（推計）。円安（1ドル=150〜160円水準）が外国人旅行者の購買力を押し上げ、高単価ホテル・旅館の稼働率が向上。特に欧米・東南アジアからの旅行者が急増し、地方都市への分散も進展。2025年も引き続き高水準が見込まれる。`;
  const forex_note = '為替動向（円安の影響）: 2024年は歴史的な円安水準（年間平均1ドル=約151円）が継続。外国人旅行者にとっての日本の宿泊コストが相対的に低下し、インバウンド需要を強力に下支え。ADR（平均客室単価）の上昇に寄与している。';
  const cpi_note = '宿泊費・CPI動向: 2024年の旅行・宿泊サービスのCPIは前年比+8〜12%上昇。人件費・光熱費の高騰が宿泊単価を押し上げ。ビジネスホテルの一人泊単価は2019年比で20〜30%高い水準に達するエリアも。';

  return NextResponse.json({ holidays, events, weather_notes, inbound_trend, forex_note, cpi_note });
}
