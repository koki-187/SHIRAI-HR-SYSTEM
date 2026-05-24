/**
 * lib/holidays.ts
 * 内閣府公開 祝日CSV から動的に祝日リストを取得
 * URL: https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv
 * フォールバック: 埋め込み静的データ
 */

export interface HolidayEntry {
  date: string;   // 'YYYY-MM-DD'
  name: string;
  impact: 'high' | 'medium' | 'low';
  month: number;
  day: number;
}

// 内閣府CSVのURL
const CAO_CSV_URL = 'https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv';

// 高影響祝日キーワード
const HIGH_IMPACT = ['正月', '元日', '年始', 'ゴールデンウィーク', 'お盆', '山の日', 'こどもの日', '憲法記念日', 'みどりの日', '昭和の日', '大晦日', '年末'];
const LOW_IMPACT = ['振替'];

function detectImpact(name: string): 'high' | 'medium' | 'low' {
  if (HIGH_IMPACT.some(k => name.includes(k))) return 'high';
  if (LOW_IMPACT.some(k => name.includes(k))) return 'low';
  return 'medium';
}

// インメモリキャッシュ（当日有効）
let cachedHolidays: HolidayEntry[] | null = null;
let cacheDate: string | null = null;

/**
 * 内閣府CSVから祝日を取得（キャッシュ付き）
 */
export async function fetchHolidays(
  yearFrom = new Date().getFullYear() - 1,
  yearTo = new Date().getFullYear() + 1,
): Promise<HolidayEntry[]> {
  const today = new Date().toISOString().split('T')[0];
  if (cachedHolidays && cacheDate === today) return cachedHolidays;

  try {
    const res = await fetch(CAO_CSV_URL, {
      signal: AbortSignal.timeout(8_000),
      headers: { 'User-Agent': 'HotelScope/1.0 (navigator.koki@gmail.com)' },
      next: { revalidate: 86400 }, // 24時間キャッシュ（Next.js）
    });

    if (!res.ok) return getFallbackHolidays(yearFrom, yearTo);

    // CSV解析（UTF-8/Shift-JIS 自動検出）
    const buffer = await res.arrayBuffer();
    let text: string;

    // まず UTF-8 として試みる
    try {
      const utf8Text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      // UTF-8 で有効なら使用、ただし日本語文字が含まれているか確認
      if (utf8Text.includes('元日') || utf8Text.includes('成人') || utf8Text.includes('祝日')) {
        text = utf8Text;
      } else {
        throw new Error('UTF-8 decoded but no Japanese found');
      }
    } catch {
      // Shift-JIS として再試行
      try {
        const sjisDecoder = new TextDecoder('shift_jis');
        text = sjisDecoder.decode(buffer);
        // Shift-JIS でも日本語がなければフォールバック
        if (!text.includes('元日') && !text.includes('成人') && !text.includes('国民')) {
          return getFallbackHolidays(yearFrom, yearTo);
        }
      } catch {
        // どちらも失敗したらフォールバック
        return getFallbackHolidays(yearFrom, yearTo);
      }
    }

    const lines = text.split('\n').filter(l => l.trim());

    const holidays: HolidayEntry[] = [];
    for (const line of lines) {
      const cols = line.split(',');
      if (cols.length < 2) continue;
      const rawDate = cols[0].trim().replace(/"/g, '');
      const rawName = cols[1].trim().replace(/"/g, '');
      if (!rawDate.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/) && !rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) continue;

      const parts = rawDate.includes('/') ? rawDate.split('/') : rawDate.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);

      if (year < yearFrom || year > yearTo) continue;
      if (!rawName || rawName === '国民の祝日') continue;

      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      holidays.push({
        date: dateStr,
        name: rawName,
        month,
        day,
        impact: detectImpact(rawName),
      });
    }

    if (holidays.length > 0) {
      cachedHolidays = holidays;
      cacheDate = today;
      return holidays;
    }
  } catch (e) {
    console.warn('[holidays] CSV fetch failed, using fallback:', e);
  }

  return getFallbackHolidays(yearFrom, yearTo);
}

/** 静的フォールバック（2024〜2026年）*/
function getFallbackHolidays(yearFrom: number, yearTo: number): HolidayEntry[] {
  const all: HolidayEntry[] = [
    // 2025年
    { date: '2025-01-01', name: '元日', month: 1, day: 1, impact: 'high' },
    { date: '2025-01-13', name: '成人の日', month: 1, day: 13, impact: 'medium' },
    { date: '2025-02-11', name: '建国記念の日', month: 2, day: 11, impact: 'medium' },
    { date: '2025-02-23', name: '天皇誕生日', month: 2, day: 23, impact: 'medium' },
    { date: '2025-02-24', name: '天皇誕生日 振替休日', month: 2, day: 24, impact: 'low' },
    { date: '2025-03-20', name: '春分の日', month: 3, day: 20, impact: 'medium' },
    { date: '2025-04-29', name: '昭和の日', month: 4, day: 29, impact: 'high' },
    { date: '2025-05-03', name: '憲法記念日', month: 5, day: 3, impact: 'high' },
    { date: '2025-05-04', name: 'みどりの日', month: 5, day: 4, impact: 'high' },
    { date: '2025-05-05', name: 'こどもの日', month: 5, day: 5, impact: 'high' },
    { date: '2025-05-06', name: 'みどりの日 振替休日', month: 5, day: 6, impact: 'high' },
    { date: '2025-07-21', name: '海の日', month: 7, day: 21, impact: 'medium' },
    { date: '2025-08-11', name: '山の日', month: 8, day: 11, impact: 'high' },
    { date: '2025-09-15', name: '敬老の日', month: 9, day: 15, impact: 'medium' },
    { date: '2025-09-23', name: '秋分の日', month: 9, day: 23, impact: 'medium' },
    { date: '2025-10-13', name: 'スポーツの日', month: 10, day: 13, impact: 'medium' },
    { date: '2025-11-03', name: '文化の日', month: 11, day: 3, impact: 'medium' },
    { date: '2025-11-23', name: '勤労感謝の日', month: 11, day: 23, impact: 'medium' },
    { date: '2025-11-24', name: '勤労感謝の日 振替休日', month: 11, day: 24, impact: 'low' },
    { date: '2025-12-31', name: '大晦日', month: 12, day: 31, impact: 'high' },
    // 2026年
    { date: '2026-01-01', name: '元日', month: 1, day: 1, impact: 'high' },
    { date: '2026-01-12', name: '成人の日', month: 1, day: 12, impact: 'medium' },
    { date: '2026-02-11', name: '建国記念の日', month: 2, day: 11, impact: 'medium' },
    { date: '2026-02-23', name: '天皇誕生日', month: 2, day: 23, impact: 'medium' },
    { date: '2026-03-20', name: '春分の日', month: 3, day: 20, impact: 'medium' },
    { date: '2026-04-29', name: '昭和の日', month: 4, day: 29, impact: 'high' },
    { date: '2026-05-03', name: '憲法記念日', month: 5, day: 3, impact: 'high' },
    { date: '2026-05-04', name: 'みどりの日', month: 5, day: 4, impact: 'high' },
    { date: '2026-05-05', name: 'こどもの日', month: 5, day: 5, impact: 'high' },
    { date: '2026-05-06', name: 'こどもの日 振替休日', month: 5, day: 6, impact: 'high' },
    { date: '2026-07-20', name: '海の日', month: 7, day: 20, impact: 'medium' },
    { date: '2026-08-11', name: '山の日', month: 8, day: 11, impact: 'high' },
    { date: '2026-09-21', name: '敬老の日', month: 9, day: 21, impact: 'medium' },
    { date: '2026-09-23', name: '秋分の日', month: 9, day: 23, impact: 'medium' },
    { date: '2026-10-12', name: 'スポーツの日', month: 10, day: 12, impact: 'medium' },
    { date: '2026-11-03', name: '文化の日', month: 11, day: 3, impact: 'medium' },
    { date: '2026-11-23', name: '勤労感謝の日', month: 11, day: 23, impact: 'medium' },
    { date: '2026-12-31', name: '大晦日', month: 12, day: 31, impact: 'high' },
  ];
  return all.filter(h => {
    const y = parseInt(h.date.slice(0, 4));
    return y >= yearFrom && y <= yearTo;
  });
}
