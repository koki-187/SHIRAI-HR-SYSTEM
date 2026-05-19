import { ScrapeResponse, SurveyParams, FactorsData } from '@/types';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function scrapeHotels(params: SurveyParams): Promise<ScrapeResponse> {
  const res = await fetch(`${BACKEND_URL}/api/scrape/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: params.location,
      check_in: params.check_in,
      check_out: params.check_out,
      hotel_type: params.hotel_type,
      radius_km: params.radius_km,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getFactors(year: number): Promise<FactorsData> {
  const res = await fetch(`${BACKEND_URL}/api/factors/?year=${year}`);
  if (!res.ok) throw new Error('要因データの取得に失敗しました');
  return res.json();
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; display_name: string }> {
  const res = await fetch(`${BACKEND_URL}/api/geocode/?q=${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error('ジオコーディングに失敗しました');
  return res.json();
}
