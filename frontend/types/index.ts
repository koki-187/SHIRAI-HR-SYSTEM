export interface HotelData {
  name: string;
  price_per_night: number;
  rating?: number;
  review_count?: number;
  url: string;
  lat?: number;
  lng?: number;
  source: string;
}

export interface MonthlyStats {
  month: string; // "2024-01"
  weekday_avg: number;
  weekend_avg: number;
  peak_avg?: number;
  min_price: number;
  max_price: number;
}

export interface ScrapeResponse {
  hotels: HotelData[];
  monthly_stats: MonthlyStats[];
  geocoded_lat: number;
  geocoded_lng: number;
  search_address: string;
  data_source?: string; // 実際に使用したデータソース
}

export interface SurveyParams {
  location: string;
  check_in: string;
  check_out: string;
  hotel_type: 'all' | 'business' | 'resort' | 'budget';
  radius_km: number;
  gemini_api_key: string;
  data_source?: 'auto' | 'seed' | 'rakuten' | 'mock'; // データソース選択
}

export interface FactorsData {
  holidays: Array<{ date: string; name: string }>;
  events: Array<{ period: string; name: string; impact: string }>;
  weather_notes: string;
  inbound_trend: string;
  forex_note: string;
  cpi_note: string;
}

export interface SurveyHistory {
  id: string;
  location: string;
  search_address: string;
  created_at: string;
  params: SurveyParams;
  result: ScrapeResponse;
}
