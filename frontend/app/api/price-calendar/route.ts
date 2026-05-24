/**
 * GET /api/price-calendar?lat=35.69&lng=139.70&weeks=12
 * 指定エリアの今後N週分のチェックイン別平均価格カレンダーを返す。
 * hotel_prices テーブルから集計。データがない場合は空配列を返す。
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getHotelPriceCalendar, toAreaKey, initSchema } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lat   = parseFloat(searchParams.get('lat')   ?? '');
  const lng   = parseFloat(searchParams.get('lng')   ?? '');
  const weeks = parseInt(searchParams.get('weeks')   ?? '12', 10);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  try {
    await initSchema();
    const areaKey = toAreaKey(lat, lng);
    const rows    = await getHotelPriceCalendar(areaKey, Math.min(weeks, 24));

    // 日付ごとにOTAソースをマージして返す
    type CalendarDay = {
      date:         string;
      sources:      { ota: string; hotel_count: number; avg_price: number; min_price: number; max_price: number; last_updated: string }[];
      best_price:   number;
      avg_price:    number;
    };

    const dayMap = new Map<string, CalendarDay>();
    for (const row of rows as Record<string, unknown>[]) {
      const dateStr = typeof row.checkin_date === 'string'
        ? row.checkin_date.split('T')[0]
        : new Date(row.checkin_date as any).toISOString().split('T')[0];

      if (!dayMap.has(dateStr)) {
        dayMap.set(dateStr, { date: dateStr, sources: [], best_price: Infinity, avg_price: 0 });
      }
      const day = dayMap.get(dateStr)!;
      day.sources.push({
        ota:          row.ota_source as string,
        hotel_count:  Number(row.hotel_count),
        avg_price:    Number(row.avg_price),
        min_price:    Number(row.min_price),
        max_price:    Number(row.max_price),
        last_updated: typeof row.last_updated === 'string'
          ? row.last_updated.split('T')[0]
          : new Date(row.last_updated as any).toISOString().split('T')[0],
      });
      if (Number(row.min_price) < day.best_price) day.best_price = Number(row.min_price);
    }

    // avg_price = 全OTAの加重平均
    const calendar: CalendarDay[] = Array.from(dayMap.values()).map(day => {
      const totalCount = day.sources.reduce((s, src) => s + src.hotel_count, 0);
      const weightedAvg = totalCount > 0
        ? day.sources.reduce((s, src) => s + src.avg_price * src.hotel_count, 0) / totalCount
        : day.sources.reduce((s, src) => s + src.avg_price, 0) / day.sources.length;
      return { ...day, avg_price: Math.round(weightedAvg), best_price: day.best_price === Infinity ? 0 : day.best_price };
    }).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      areaKey,
      weeks,
      total: calendar.length,
      calendar,
      hasData: calendar.length > 0,
    });
  } catch (e: any) {
    console.error('[price-calendar]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
