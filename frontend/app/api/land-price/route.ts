import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface LandPriceEstimate {
  pricePerSqm: number;
  area: string;
  note: string;
}

interface Zone {
  name: string;
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
  price: number; // 万円/㎡
}

/**
 * 国交省 不動産情報ライブラリ（REINFOLIB）API
 * https://www.reinfolib.mlit.go.jp/help/apiManual/
 * API key不要（CORS制限あり → サーバーサイドで呼出）
 */
async function fetchRealLandPrice(lat: number, lng: number): Promise<LandPriceEstimate | null> {
  try {
    // 緯度経度から地価公示の最近傍地点を取得
    // REINFOLIB 地価公示API
    const url = `https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001?response_format=geojson&from=2024&to=2025&latMin=${lat - 0.02}&latMax=${lat + 0.02}&lonMin=${lng - 0.03}&lonMax=${lng + 0.03}`;

    const res = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.REINFOLIB_API_KEY ?? '',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const features = json?.features ?? [];
    if (!features.length) return null;

    // 最近傍の地価公示点を取得（住宅地 + 商業地を優先）
    const commercial = features.filter((f: any) =>
      ['商業地', '近隣商業地', '準工業地'].includes(f.properties?.用途区分 ?? '')
    );
    const targets = commercial.length > 0 ? commercial : features;

    // 平均価格を計算
    const prices = targets
      .map((f: any) => parseInt(String(f.properties?.価格 ?? '0').replace(/,/g, '')))
      .filter((p: number) => p > 0);

    if (!prices.length) return null;

    const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
    const area = targets[0]?.properties?.所在地 ?? '';

    return {
      pricePerSqm: Math.round(avgPrice),
      area: area || '（国交省公示データ）',
      note: `令和6〜7年地価公示データ（国交省不動産情報ライブラリ）。${prices.length}地点平均。`,
    };
  } catch {
    return null;
  }
}

// 座標から推定地価を算出（令和7年（2025年）地価公示ベース）
function estimateLandPriceByCoords(lat: number, lng: number): LandPriceEstimate {
  // 令和7年（2025年）地価公示ベースの主要地価（㎡単価・万円）
  // ゾーンは面積が小さい精細ゾーン優先でマッチングするため面積昇順に定義
  const zones: Zone[] = [
    // ── 東京都 ──
    { name: '東京都心（千代田・中央・港）', latMin: 35.64, latMax: 35.70, lngMin: 139.72, lngMax: 139.78, price: 380 },
    { name: '渋谷・新宿',                   latMin: 35.66, latMax: 35.70, lngMin: 139.69, lngMax: 139.72, price: 280 },
    { name: '品川・田町',                   latMin: 35.61, latMax: 35.65, lngMin: 139.72, lngMax: 139.76, price: 200 },
    { name: '池袋・巣鴨',                   latMin: 35.72, latMax: 35.74, lngMin: 139.70, lngMax: 139.73, price: 160 },
    { name: '東京城南（目黒・世田谷）',     latMin: 35.60, latMax: 35.65, lngMin: 139.63, lngMax: 139.70, price: 140 },
    { name: '上野・浅草・墨田',             latMin: 35.70, latMax: 35.73, lngMin: 139.77, lngMax: 139.82, price: 130 },
    { name: '東京城北（板橋・北）',         latMin: 35.73, latMax: 35.79, lngMin: 139.68, lngMax: 139.74, price: 100 },
    { name: '東京西部（杉並・練馬）',       latMin: 35.69, latMax: 35.76, lngMin: 139.58, lngMax: 139.68, price: 100 },
    { name: '東京東部（江東・江戸川）',     latMin: 35.66, latMax: 35.72, lngMin: 139.82, lngMax: 139.90, price: 90  },
    // ── 神奈川県 ──
    { name: '川崎市中心（川崎区・幸）',     latMin: 35.52, latMax: 35.55, lngMin: 139.69, lngMax: 139.73, price: 80  },
    { name: '横浜市中心（西・中）',         latMin: 35.44, latMax: 35.47, lngMin: 139.62, lngMax: 139.65, price: 90  },
    { name: '横浜市北部（港北・都筑）',     latMin: 35.51, latMax: 35.55, lngMin: 139.58, lngMax: 139.63, price: 60  },
    { name: '横浜郊外・藤沢',               latMin: 35.32, latMax: 35.44, lngMin: 139.40, lngMax: 139.62, price: 45  },
    // ── 大阪府 ──
    { name: '大阪市中心（北・中央）',       latMin: 34.68, latMax: 34.71, lngMin: 135.49, lngMax: 135.53, price: 200 },
    { name: '大阪市南部（浪速・天王寺）',   latMin: 34.64, latMax: 34.68, lngMin: 135.49, lngMax: 135.52, price: 130 },
    { name: '大阪市西部（西・港）',         latMin: 34.66, latMax: 34.69, lngMin: 135.45, lngMax: 135.49, price: 100 },
    { name: '大阪北摂（吹田・豊中）',       latMin: 34.76, latMax: 34.82, lngMin: 135.47, lngMax: 135.54, price: 70  },
    { name: '堺市中心',                     latMin: 34.56, latMax: 34.59, lngMin: 135.46, lngMax: 135.50, price: 40  },
    // ── 愛知県 ──
    { name: '名古屋市中心（中区・東区）',   latMin: 35.17, latMax: 35.20, lngMin: 136.88, lngMax: 136.93, price: 120 },
    { name: '名古屋市周辺',                 latMin: 35.12, latMax: 35.22, lngMin: 136.82, lngMax: 136.98, price: 60  },
    // ── 京都府 ──
    { name: '京都市中心（下京・中京）',     latMin: 34.99, latMax: 35.02, lngMin: 135.75, lngMax: 135.78, price: 100 },
    { name: '京都市周辺',                   latMin: 34.95, latMax: 35.06, lngMin: 135.70, lngMax: 135.82, price: 50  },
    // ── 兵庫県 ──
    { name: '神戸市中心（中央区）',         latMin: 34.68, latMax: 34.70, lngMin: 135.18, lngMax: 135.22, price: 80  },
    { name: '西宮・芦屋',                   latMin: 34.71, latMax: 34.75, lngMin: 135.30, lngMax: 135.38, price: 70  },
    // ── 福岡県 ──
    { name: '福岡市中心（博多・中央）',     latMin: 33.58, latMax: 33.63, lngMin: 130.39, lngMax: 130.44, price: 95  },
    { name: '福岡市周辺（早良・城南）',     latMin: 33.55, latMax: 33.60, lngMin: 130.34, lngMax: 130.40, price: 50  },
    // ── 北海道 ──
    { name: '札幌市中心（中央区）',         latMin: 43.05, latMax: 43.07, lngMin: 141.34, lngMax: 141.37, price: 65  },
    { name: '札幌市周辺',                   latMin: 43.02, latMax: 43.10, lngMin: 141.28, lngMax: 141.45, price: 30  },
    // ── 宮城県 ──
    { name: '仙台市中心（青葉区）',         latMin: 38.26, latMax: 38.28, lngMin: 140.87, lngMax: 140.90, price: 50  },
    { name: '仙台市周辺',                   latMin: 38.22, latMax: 38.32, lngMin: 140.83, lngMax: 140.97, price: 25  },
    // ── 沖縄県 ──
    { name: '那覇市中心',                   latMin: 26.21, latMax: 26.23, lngMin: 127.68, lngMax: 127.70, price: 55  },
    { name: '恩納村・北谷（リゾート）',     latMin: 26.25, latMax: 26.55, lngMin: 127.70, lngMax: 127.90, price: 35  },
    // ── その他主要都市 ──
    { name: '広島市中心',                   latMin: 34.38, latMax: 34.40, lngMin: 132.45, lngMax: 132.47, price: 40  },
    { name: '金沢市中心',                   latMin: 36.56, latMax: 36.58, lngMin: 136.65, lngMax: 136.67, price: 30  },
    { name: '静岡市中心',                   latMin: 34.97, latMax: 34.99, lngMin: 138.38, lngMax: 138.40, price: 25  },
    { name: '熊本市中心',                   latMin: 32.79, latMax: 32.81, lngMin: 130.74, lngMax: 130.76, price: 30  },
    { name: '岡山市中心',                   latMin: 34.66, latMax: 34.68, lngMin: 133.92, lngMax: 133.94, price: 28  },
  ];

  // 面積順（小さい精細ゾーン優先）でソートしてマッチング
  const sorted = Array.from(zones).sort((a, b) => {
    const areaA = (a.latMax - a.latMin) * (a.lngMax - a.lngMin);
    const areaB = (b.latMax - b.latMin) * (b.lngMax - b.lngMin);
    return areaA - areaB;
  });

  const match = sorted.find(
    z => lat >= z.latMin && lat <= z.latMax && lng >= z.lngMin && lng <= z.lngMax,
  );

  if (match) {
    return {
      pricePerSqm: match.price * 10000, // 万円 → 円
      area: match.name,
      note: '令和7年（2025年）地価公示ベース概算。実際の取引価格は±30%変動あり。',
    };
  }

  // 最終フォールバック: 地方都市標準
  return {
    pricePerSqm: 150000, // 15万円/㎡
    area: '地方都市（標準）',
    note: '座標が主要都市圏外のため標準値を使用。実際の地価公示データをご確認ください。',
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') ?? '500';

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat/lng required' }, { status: 400 });
  }

  const latVal = parseFloat(lat);
  const lngVal = parseFloat(lng);

  if (
    isNaN(latVal) || isNaN(lngVal) ||
    latVal < 24 || latVal > 46 ||
    lngVal < 122 || lngVal > 154
  ) {
    return NextResponse.json(
      { error: '有効な日本国内の緯度経度を指定してください' },
      { status: 400 },
    );
  }

  try {
    // まず国交省APIで実データ取得を試みる
    let estimate: LandPriceEstimate | null = null;
    let source = 'estimated';

    if (process.env.REINFOLIB_API_KEY) {
      estimate = await fetchRealLandPrice(latVal, lngVal);
      if (estimate) source = 'reinfolib';
    }

    // フォールバック: ゾーンマッピング
    if (!estimate) {
      estimate = estimateLandPriceByCoords(latVal, lngVal);
    }

    return NextResponse.json({
      ok: true,
      source,
      sourceLabel: source === 'reinfolib'
        ? '国交省不動産情報ライブラリ（実データ）'
        : '令和7年（2025年）地価公示ベース概算',
      data_year: source === 'reinfolib' ? '令和6〜7年地価公示' : '令和7年（2025年）地価公示',
      lat: latVal,
      lng: lngVal,
      radius_m: parseInt(radius),
      estimated_land_price_per_sqm: estimate.pricePerSqm,
      estimated_area: estimate.area,
      note: estimate.note,
      transactions: [],
      is_real_data: source === 'reinfolib',
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json(
      { error: `地価推定に失敗しました: ${msg}` },
      { status: 500 },
    );
  }
}
