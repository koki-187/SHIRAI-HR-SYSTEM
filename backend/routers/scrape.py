from fastapi import APIRouter, HTTPException

from models.schemas import ScrapeRequest, ScrapeResponse
from services import geocoder, scraper

router = APIRouter(prefix="/api/scrape", tags=["scrape"])


@router.post("/", response_model=ScrapeResponse)
async def scrape_hotels(req: ScrapeRequest):
    """
    指定された住所周辺のホテル料金をスクレイプして返す。
    スクレイプ失敗時はモックデータにフォールバックする。
    """
    # ジオコーディング
    try:
        geo = await geocoder.geocode(req.location)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"ジオコーディング失敗: {str(e)}"
        )

    lat, lng = float(geo["lat"]), float(geo["lng"])

    # スクレイピング試行、失敗時はモックにフォールバック
    try:
        hotels = await scraper.scrape_booking_com(
            lat=lat,
            lng=lng,
            check_in=req.check_in,
            check_out=req.check_out,
            hotel_type=req.hotel_type,
            radius_km=req.radius_km,
        )
        if len(hotels) < 3:
            raise ValueError("取得件数が不足しています")
    except Exception:
        hotels = await scraper.generate_mock_hotels(lat, lng, req.check_in)

    monthly_stats = scraper.aggregate_monthly_stats(hotels)

    return ScrapeResponse(
        hotels=hotels,
        monthly_stats=monthly_stats,
        geocoded_lat=lat,
        geocoded_lng=lng,
        search_address=geo.get("display_name", req.location),
    )
