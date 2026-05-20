/** 部屋タイプ別㎡・単価データ（白井氏調査システム互換） */
export interface RoomType {
  category: string;         // 例: "スタンダードシングル"
  size_sqm: number;         // 客室面積（㎡）
  max_occupancy: number;    // 最大定員
  price_weekday: number;    // 平日料金
  price_weekend: number;    // 休日料金（土曜）
  price_per_sqm: number;    // ㎡単価（平日料金÷面積）
  price_per_person: number; // 1人あたり単価（平日÷定員）
  revpar: number;           // RevPAR（平日料金×稼働率80%）
  revpar_per_sqm: number;   // RevPAR/㎡
}

export interface HotelData {
  name: string;
  price_per_night: number;
  rating?: number;
  review_count?: number;
  url: string;
  lat?: number;
  lng?: number;
  source: string;
  /** 部屋タイプ別データ（自動生成） */
  room_types?: RoomType[];
  /** 平均客室面積（㎡） */
  avg_room_size?: number;
  /** 平均㎡単価（円/㎡） */
  avg_price_per_sqm?: number;
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
