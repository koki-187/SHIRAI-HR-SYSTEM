import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HotelData } from '@/types';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) return NextResponse.json({ error: 'RAKUTEN_APP_ID not configured', hotels: [] }, { status: 200 });

  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const checkin = searchParams.get('checkin');
  const checkout = searchParams.get('checkout');
  const hotelType = searchParams.get('hotel_type') || 'all';

  if (!lat || !lng) return NextResponse.json({ error: 'lat/lng required' }, { status: 400 });

  try {
    // Rakuten Travel Simple Hotel Search API
    // Docs: https://webservice.rakuten.co.jp/documentation/simple-hotel-search
    const params = new URLSearchParams({
      applicationId: appId,
      format: 'json',
      latitude: lat,
      longitude: lng,
      searchRadius: '3',        // km
      datumType: '1',           // 1=WGS84
      hits: '30',
      sort: 'standard',
      ...(checkin && checkout ? {
        checkinDate: checkin.replace(/-/g, ''),    // YYYYMMDD
        checkoutDate: checkout.replace(/-/g, ''),
      } : {}),
    });

    // Hotel type filter
    if (hotelType === 'business') params.set('hotelType', 'BusinessHotel');
    else if (hotelType === 'resort') params.set('hotelType', 'Resort');
    else if (hotelType === 'budget') params.set('hotelType', 'GuestHouse');

    const url = `https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20170426?${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });

    if (!res.ok) {
      return NextResponse.json({ error: `Rakuten API error: ${res.status}`, hotels: [] }, { status: 200 });
    }

    const json = await res.json();

    // Rakuten response: { hotels: [ [{hotelBasicInfo:{...}}, {hotelRatingInfo:{...}}], ... ] }
    if (!json.hotels || !Array.isArray(json.hotels)) {
      return NextResponse.json({ hotels: [] });
    }

    const hotels: HotelData[] = json.hotels.map((entry: any[]) => {
      const basic = entry.find((e: any) => e.hotelBasicInfo)?.hotelBasicInfo;
      if (!basic) return null;
      return {
        name: basic.hotelName || '不明',
        price_per_night: basic.hotelMinCharge || 0,
        rating: basic.reviewAverage ? parseFloat(basic.reviewAverage) : undefined,
        review_count: basic.reviewCount || undefined,
        url: basic.hotelInformationUrl || '',
        lat: basic.latitude ? parseFloat(basic.latitude) : undefined,
        lng: basic.longitude ? parseFloat(basic.longitude) : undefined,
        source: 'rakuten',
      } as HotelData;
    }).filter((h: HotelData | null) => h !== null && h.price_per_night > 0) as HotelData[];

    return NextResponse.json({ hotels });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, hotels: [] }, { status: 200 });
  }
}
