import httpx
from fastapi import HTTPException


async def geocode(address: str) -> dict:
    """
    Nominatim APIを使って住所をジオコーディングする。

    Args:
        address: 検索する住所文字列

    Returns:
        lat, lng, display_name を含む辞書

    Raises:
        HTTPException: ジオコーディング失敗時
    """
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": address,
        "format": "json",
        "limit": 1,
    }
    headers = {
        "User-Agent": "HotelScope/1.0",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            results = response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Nominatim APIエラー: {e.response.status_code}",
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Nominatim APIへの接続エラー: {str(e)}",
            )

    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"住所が見つかりませんでした: {address}",
        )

    hit = results[0]
    return {
        "lat": hit["lat"],
        "lng": hit["lon"],
        "display_name": hit.get("display_name", address),
    }
