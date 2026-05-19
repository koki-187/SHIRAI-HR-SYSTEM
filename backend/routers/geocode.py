from fastapi import APIRouter

from models.schemas import GeoCodeResponse
from services import geocoder

router = APIRouter(prefix="/api/geocode", tags=["geocode"])


@router.get("/", response_model=GeoCodeResponse)
async def geocode_address(q: str):
    """
    住所文字列をジオコーディングして緯度・経度を返す。

    Args:
        q: 検索する住所（例: "東京都渋谷区"）
    """
    result = await geocoder.geocode(q)
    return GeoCodeResponse(
        lat=float(result["lat"]),
        lng=float(result["lng"]),
        display_name=result.get("display_name", q),
    )
