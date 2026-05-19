import { ScrapeResponse, SurveyParams, FactorsData } from '@/types';

// すべてのバックエンド呼び出しはNext.js APIプロキシ経由（CORS回避・セキュリティ向上）
export async function scrapeHotels(params: SurveyParams): Promise<ScrapeResponse> {
  const res = await fetch('/api/survey', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: params.location,
      check_in: params.check_in,
      check_out: params.check_out,
      hotel_type: params.hotel_type,
      radius_km: params.radius_km,
      gemini_api_key: params.gemini_api_key,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'スクレイピングに失敗しました');
  return data;
}

export async function getFactors(year: number): Promise<FactorsData> {
  const res = await fetch(`/api/factors?year=${year}`);
  if (!res.ok) throw new Error('要因データの取得に失敗しました');
  return res.json();
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; display_name: string }> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error('ジオコーディングに失敗しました');
  return res.json();
}
