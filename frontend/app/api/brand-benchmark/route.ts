/**
 * GET /api/brand-benchmark
 *
 * 霞が関キャピタル ホテルブランド別 ADRベンチマークデータを返す。
 *
 * Query params:
 *   brand  = 'fav' | 'fav_lux' | 'seven_x_seven' | 'all'  (default: 'all')
 *   lat    = number  (省略可: 近傍都市フィルタ)
 *   lng    = number  (省略可: 近傍都市フィルタ)
 *   city   = string  (省略可: cityKey完全一致)
 *
 * 認証: セッション必須
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  BRAND_SPECS,
  BRAND_MONTHS,
  FAV_CITIES,
  FAV_LUX_CITIES,
  SXS_CITIES,
  SXS_ROOM_TYPES_BASE,
  FAV_ROOM_SIZES,
  FAV_LUX_ROOM_SIZES,
  MARKET_BENCHMARK,
  getSxSMonthlyADR,
  getCityRoomSizeADR,
  getRevParSqmSummary,
  findNearestFAV,
  findNearestFAVLUX,
  findNearestSxS,
  annualAvgADR,
  YOY_GROWTH,
  CUMULATIVE_GROWTH_VS_2023,
  type BrandTier,
  type CityBrandEntry,
  type SxSCityEntry,
} from '@/lib/brand-adr-data';
import {
  FAV_COMPETITOR_HOTELS,
  FAV_LUX_COMPETITOR_HOTELS,
  SXS_COMPETITOR_HOTELS,
  FAV_CITY_ROOM_ADR,
  FAV_LUX_CITY_ROOM_ADR,
  getFAVCompetitorsByCity,
  getFAVLUXCompetitorsByCity,
  getSxSCompetitorsByCity,
  getCompetitorCitySummary,
} from '@/lib/competitor-adr-data';

// ─── FAV / FAV LUX レスポンス整形 ───────────────────────
function shapeCityEntry(entry: CityBrandEntry, includeRoomSizes = true) {
  const roomSizes = entry.brand === 'fav' ? FAV_ROOM_SIZES : FAV_LUX_ROOM_SIZES;
  const roomSizeADR = includeRoomSizes
    ? getCityRoomSizeADR(entry, roomSizes).map(r => ({
        label:        r.def.label,
        sqmNominal:   r.def.sqmNominal,
        sqmMin:       r.def.sqmMin,
        sqmMax:       r.def.sqmMax,
        multiplier:   r.def.multiplier,
        typeKey:      r.def.typeKey,
        maxPersons:   r.def.maxPersons,
        annualAvgADR: r.annualAvgADR,
        monthlyADR:   r.monthlyADR,
        weekendADR:   r.weekendADR,
        peakADR:      r.peakADR,
        revpar:       r.revpar,
        revparPerSqm: r.revparPerSqm,
      }))
    : [];
  return {
    cityKey:        entry.cityKey,
    cityName:       entry.cityName,
    prefecture:     entry.prefecture,
    lat:            entry.lat,
    lng:            entry.lng,
    seasonType:     entry.seasonType,
    brand:          entry.brand,
    baseADR:        entry.baseADR,
    baseADRWeekend: entry.baseADRWeekend,
    annualAvgADR:   annualAvgADR(entry.monthlyADR),
    revpar:         entry.revpar,
    occ:            entry.occ,
    months:         BRAND_MONTHS,
    monthlyADR:     entry.monthlyADR,
    weekendADR:     entry.weekendADR,
    peakADR:        entry.peakADR,
    roomSizeADR,
    notes:          entry.notes ?? null,
  };
}

// ─── SEVEN×SEVEN レスポンス整形 ─────────────────────────
function shapeSxSEntry(entry: SxSCityEntry) {
  const roomTypesWithMonthly = entry.roomTypes.map(rt => ({
    label:       rt.label,
    sqmMin:      rt.sqmMin,
    sqmMax:      rt.sqmMax,
    baseADR:     rt.baseADR,
    annualAvg:   annualAvgADR(getSxSMonthlyADR(entry, rt.label)),
    monthlyADR:  getSxSMonthlyADR(entry, rt.label),
  }));

  return {
    cityKey:     entry.cityKey,
    cityName:    entry.cityName,
    prefecture:  entry.prefecture,
    lat:         entry.lat,
    lng:         entry.lng,
    seasonType:  entry.seasonType,
    brand:       'seven_x_seven' as BrandTier,
    cityMult:    entry.cityMult,
    occ:         entry.occ,
    months:      BRAND_MONTHS,
    monthlyMult: entry.monthlyMult,
    roomTypes:   roomTypesWithMonthly,
    notes:       entry.notes ?? null,
  };
}

// ─── メインハンドラ ──────────────────────────────────────
export async function GET(req: NextRequest) {
  // 認証チェック
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const brand  = (searchParams.get('brand') ?? 'all') as BrandTier | 'all';
  const lat    = parseFloat(searchParams.get('lat') ?? '');
  const lng    = parseFloat(searchParams.get('lng') ?? '');
  const city   = searchParams.get('city') ?? '';

  const hasGeo  = !isNaN(lat) && !isNaN(lng);

  try {
    // ── FAV データ ──────────────────────────────────────
    let favData: ReturnType<typeof shapeCityEntry>[] | null = null;
    if (brand === 'fav' || brand === 'all') {
      if (city) {
        const found = FAV_CITIES.filter(c => c.cityKey === city);
        favData = found.map(e => shapeCityEntry(e));
      } else if (hasGeo) {
        const nearest = findNearestFAV(lat, lng);
        favData = nearest ? [shapeCityEntry(nearest)] : [];
      } else {
        favData = FAV_CITIES.map(e => shapeCityEntry(e));
      }
    }

    // ── FAV LUX データ ───────────────────────────────────
    let favLuxData: ReturnType<typeof shapeCityEntry>[] | null = null;
    if (brand === 'fav_lux' || brand === 'all') {
      if (city) {
        const found = FAV_LUX_CITIES.filter(c => c.cityKey === `lux_${city}` || c.cityKey === city);
        favLuxData = found.map(e => shapeCityEntry(e));
      } else if (hasGeo) {
        const nearest = findNearestFAVLUX(lat, lng);
        favLuxData = nearest ? [shapeCityEntry(nearest)] : [];
      } else {
        favLuxData = FAV_LUX_CITIES.map(e => shapeCityEntry(e));
      }
    }

    // ── SEVEN×SEVEN データ ───────────────────────────────
    let sxsData: ReturnType<typeof shapeSxSEntry>[] | null = null;
    if (brand === 'seven_x_seven' || brand === 'all') {
      if (city) {
        const found = SXS_CITIES.filter(c => c.cityKey === city);
        sxsData = found.map(e => shapeSxSEntry(e));
      } else if (hasGeo) {
        const nearest = findNearestSxS(lat, lng);
        sxsData = nearest ? [shapeSxSEntry(nearest)] : [];
      } else {
        sxsData = SXS_CITIES.map(e => shapeSxSEntry(e));
      }
    }

    // ── ブランドスペック ────────────────────────────────
    const specs = brand === 'all'
      ? BRAND_SPECS
      : { [brand]: BRAND_SPECS[brand as BrandTier] };

    // ── 競合ホテルデータ ─────────────────────────────────
    // cityフィルタありの場合はそのcityのみ、なければ全データ返却
    const favCompetitors   = (brand === 'fav' || brand === 'all')
      ? (city ? getFAVCompetitorsByCity(city.replace(/^lux_/, '')) : FAV_COMPETITOR_HOTELS)
      : null;
    const favLuxCompetitors = (brand === 'fav_lux' || brand === 'all')
      ? (city ? getFAVLUXCompetitorsByCity(city.replace(/^lux_/, '')) : FAV_LUX_COMPETITOR_HOTELS)
      : null;
    const sxsCompetitors   = (brand === 'seven_x_seven' || brand === 'all')
      ? (city ? getSxSCompetitorsByCity(city) : SXS_COMPETITOR_HOTELS)
      : null;
    // 都市別サマリー（競合タブ概要用）
    const competitorSummary = {
      fav:           brand === 'fav'     || brand === 'all' ? getCompetitorCitySummary('fav')           : null,
      fav_lux:       brand === 'fav_lux' || brand === 'all' ? getCompetitorCitySummary('fav_lux')       : null,
      seven_x_seven: brand === 'seven_x_seven' || brand === 'all' ? getCompetitorCitySummary('seven_x_seven') : null,
    };

    return NextResponse.json({
      ok:          true,
      period:      { from: BRAND_MONTHS[0], to: BRAND_MONTHS[BRAND_MONTHS.length - 1] },
      months:      BRAND_MONTHS,
      brand_specs: specs,
      fav:         favData,
      fav_lux:     favLuxData,
      seven_x_seven: sxsData,
      sxs_room_types_base: (brand === 'seven_x_seven' || brand === 'all') ? SXS_ROOM_TYPES_BASE : null,
      // 室面積定義（バッファ込み）
      fav_room_sizes:     (brand === 'fav' || brand === 'all') ? FAV_ROOM_SIZES : null,
      fav_lux_room_sizes: (brand === 'fav_lux' || brand === 'all') ? FAV_LUX_ROOM_SIZES : null,
      // 市場ベンチマーク検証データ
      market_benchmark:   (brand === 'all') ? MARKET_BENCHMARK : MARKET_BENCHMARK.filter(r => r.segment === brand),
      revpar_sqm_summary: getRevParSqmSummary().filter(r => brand === 'all' || r.brand === brand),
      yoy_growth:         YOY_GROWTH,
      cumulative_growth:  CUMULATIVE_GROWTH_VS_2023,
      // 競合ホテルADRデータ（全ホテルリスト）
      competitor_fav:           favCompetitors,
      competitor_fav_lux:       favLuxCompetitors,
      competitor_sxs:           sxsCompetitors,
      // 競合都市別サマリー
      competitor_summary:       competitorSummary,
      // 都市×室面積別ADRテーブル（2025/5〜2026/5推計）
      fav_city_room_adr:     (brand === 'fav' || brand === 'all')
        ? (city ? FAV_CITY_ROOM_ADR.filter(r => r.cityKey === city) : FAV_CITY_ROOM_ADR)
        : null,
      fav_lux_city_room_adr: (brand === 'fav_lux' || brand === 'all')
        ? (city ? FAV_LUX_CITY_ROOM_ADR.filter(r => r.cityKey === `lux_${city}` || r.cityKey === city) : FAV_LUX_CITY_ROOM_ADR)
        : null,
      generated_at: new Date().toISOString(),
    });
  } catch (e: unknown) {
    console.error('[brand-benchmark] error:', e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
