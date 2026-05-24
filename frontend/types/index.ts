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
  data_source_label?: string;  // 'Booking.com（リアルタイム）' など
  is_real_data?: boolean;      // 実OTAデータかどうか
}

export interface SurveyParams {
  location: string;
  check_in: string;
  check_out: string;
  hotel_type: 'all' | 'business' | 'resort' | 'budget';
  radius_km: number;
  gemini_api_key: string;
  data_source?: 'auto' | 'seed' | 'rakuten' | 'jalan' | 'booking' | 'mock'; // データソース選択
}

export interface FactorsData {
  holidays: Array<{ date: string; name: string }>;
  events: Array<{ period: string; name: string; impact: string }>;
  weather_notes: string;
  inbound_trend: string;
  forex_note: string;
  cpi_note: string;
}

/** 過去ADRスナップショット（時系列） */
export interface PriceSnapshot {
  survey_date: string;   // 'YYYY-MM-DD'
  avg_adr:     number;
  min_adr:     number;
  max_adr:     number;
  weekday_avg: number;
  weekend_avg: number;
  peak_avg:    number | null;
  hotel_count: number;
  data_source: string;   // 'rakuten' | 'seed' | 'estimated'
}

/** 仕入れ判断モード — 投資シミュレーションパラメータ */
export interface InvestmentParams {
  property_price: number;          // 物件価格（万円）
  construction_cost: number;       // 建設・改装費（万円）
  planned_rooms: number;           // 計画客室数
  avg_room_size: number;           // 平均客室面積（㎡）
  max_occupancy_per_room: number;  // 最大定員/室
  loan_ratio: number;              // 借入比率（%）デフォルト90
  interest_rate: number;           // 借入金利（%）
  loan_term: number;               // 借入期間（年）
  target_occ: number;              // 目標OCC（%）
  operating_cost_ratio: number;    // 運営費率（%）デフォルト60
}

export interface SurveyHistory {
  id: string;
  location: string;
  search_address: string;
  created_at: string;
  params: SurveyParams;
  result: ScrapeResponse;
}

/** OCC（稼働率）データ */
export interface OccStats {
  prefName: string;
  occRate: number;     // 0-100（%）
  dataLabel: string;   // '2025年3月'
  source: 'estat' | 'estimated';
  sourceLabel: string;
}

/** データ品質ラベル */
export type DataQuality = 'realtime' | 'static' | 'synthesized' | 'none';

export interface DataSourceInfo {
  source: string;
  label: string;
  quality: DataQuality;
  isReal: boolean;
}
