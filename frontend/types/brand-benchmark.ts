/**
 * types/brand-benchmark.ts
 * ブランドベンチマークタブで使用する型定義
 */

export interface BrandSpec {
  brand: string;
  brandName: string;
  kcLabel: string;
  target: string;
  typicalSqm: number;
  roomSizes: number[];
  concept: string;
  occ: number;
  existingProps: number;
  notes: string;
}

export interface RoomSizeEntry {
  label: string;
  sqmNominal: number;
  sqmMin: number;
  sqmMax: number;
  multiplier: number;
  typeKey: string;
  maxPersons: number;
  annualAvgADR: number;
  monthlyADR: number[];
  weekendADR: number[];
  peakADR: number[];
  revpar: number;
  revparPerSqm: number;
}

export interface CityEntry {
  cityKey: string;
  cityName: string;
  prefecture: string;
  brand: string;
  baseADR: number;
  annualAvgADR: number;
  revpar: number;
  occ: number;
  months: string[];
  monthlyADR: number[];
  weekendADR: number[];
  peakADR: number[];
  roomSizeADR: RoomSizeEntry[];
  notes?: string;
}

export interface MarketBenchmarkRow {
  segment: string;
  roomLabel: string;
  sqmNominal: number;
  sqmMin: number;
  sqmMax: number;
  cityTier: string;
  mktADRLow: number;
  mktADRHigh: number;
  mktADRAvg: number;
  mktOCC: number;
  mktRevPAR: number;
  mktRevParSqm: number;
  kcADREst: number;
  kcOCC: number;
  kcRevPAR: number;
  kcRevParSqm: number;
  kcPremiumPct: number;
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

export interface RevParSqmRow {
  brand: string;
  brandName: string;
  roomLabel: string;
  sqmNominal: number;
  sqmRange: string;
  cityTier: string;
  mktRevParSqm: number;
  kcRevParSqm: number;
  premium: number;
  confidence: string;
}

export interface SxSRoomType {
  label: string;
  sqmMin: number;
  sqmMax: number;
  baseADR: number;
  annualAvg: number;
  monthlyADR: number[];
}

export interface SxSCityEntry {
  cityKey: string;
  cityName: string;
  prefecture: string;
  cityMult: number;
  occ: number;
  months: string[];
  roomTypes: SxSRoomType[];
  notes?: string;
}
