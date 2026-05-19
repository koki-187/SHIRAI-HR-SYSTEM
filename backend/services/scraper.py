import asyncio
import random
import re
from typing import List

from playwright.async_api import async_playwright

from models.schemas import HotelData, MonthlyStats

SCRAPE_DELAY = 3.0  # seconds between requests


async def scrape_booking_com(
    lat: float,
    lng: float,
    check_in: str,
    check_out: str,
    hotel_type: str,
    radius_km: float = 3.0,
) -> List[HotelData]:
    """Booking.comから周辺ホテルをスクレイプ"""
    hotels = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                )
            )
            page = await context.new_page()

            # Booking.com検索URL
            url = (
                f"https://www.booking.com/searchresults.ja.html"
                f"?latitude={lat}&longitude={lng}"
                f"&checkin={check_in}&checkout={check_out}"
                f"&radius={int(radius_km * 1000)}"
                f"&selected_currency=JPY&lang=ja"
            )

            await page.goto(url, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(SCRAPE_DELAY)

            # プロパティカードを取得
            cards = await page.query_selector_all('[data-testid="property-card"]')

            for card in cards[:20]:  # 最大20件
                try:
                    name_el = await card.query_selector('[data-testid="title"]')
                    name = await name_el.inner_text() if name_el else "不明"

                    price_el = await card.query_selector(
                        '[data-testid="price-and-discounted-price"]'
                    )
                    price_text = await price_el.inner_text() if price_el else "0"
                    price = parse_price(price_text)

                    rating_el = await card.query_selector(
                        '[data-testid="review-score"]'
                    )
                    rating_text = await rating_el.inner_text() if rating_el else ""
                    rating = parse_rating(rating_text)

                    link_el = await card.query_selector(
                        'a[data-testid="title-link"]'
                    )
                    href = await link_el.get_attribute("href") if link_el else ""

                    if name and price > 0:
                        hotels.append(
                            HotelData(
                                name=name.strip(),
                                price_per_night=price,
                                rating=rating,
                                url=(
                                    f"https://www.booking.com{href}"
                                    if href and href.startswith("/")
                                    else href or ""
                                ),
                                source="booking.com",
                            )
                        )
                except Exception:
                    continue

        finally:
            await browser.close()

    return hotels


def parse_price(text: str) -> float:
    """価格文字列をパース: '¥12,345' → 12345.0"""
    cleaned = [n.replace(",", "") for n in re.findall(r"[\d,]+", text)]
    if cleaned:
        try:
            return float(max(cleaned, key=len))
        except (ValueError, TypeError):
            return 0.0
    return 0.0


def parse_rating(text: str) -> float | None:
    """評点文字列をパース: '8.5 優秀' → 8.5"""
    m = re.search(r"(\d+\.?\d*)", text)
    return float(m.group(1)) if m else None


async def generate_mock_hotels(
    lat: float, lng: float, check_in: str, num: int = 15
) -> List[HotelData]:
    """スクレイプ失敗時のモックデータ（開発用）"""
    base_price = 8000
    names = [
        "ホテルグランデ",
        "ビジネスホテルサクラ",
        "シティホテル東横",
        "ルートイン",
        "コンフォートホテル",
        "ドーミーイン",
        "アパホテル",
        "東横INN",
        "スーパーホテル",
        "ダイワロイネット",
        "ホテルマイステイズ",
        "ソラリア西鉄ホテル",
        "ワシントンホテル",
        "クロスホテル",
        "リッチモンドホテル",
    ]
    hotels = []
    for i, name in enumerate(names[:num]):
        price_factor = random.uniform(0.7, 2.5)
        lat_offset = random.uniform(-0.02, 0.02)
        lng_offset = random.uniform(-0.02, 0.02)
        hotels.append(
            HotelData(
                name=name,
                price_per_night=round(base_price * price_factor, -2),
                rating=round(random.uniform(7.0, 9.5), 1),
                review_count=random.randint(50, 2000),
                url=f"https://www.booking.com/hotel/jp/example{i}.ja.html",
                lat=lat + lat_offset,
                lng=lng + lng_offset,
                source="mock",
            )
        )
    return hotels


def aggregate_monthly_stats(
    hotels: List[HotelData], year: int = 2024
) -> List[MonthlyStats]:
    """ホテルデータから月別統計を生成"""
    stats = []

    # 季節性係数（月ごとの需要倍率）
    seasonality = {
        1: 0.85,
        2: 0.90,
        3: 1.20,
        4: 1.40,
        5: 1.50,
        6: 0.95,
        7: 1.30,
        8: 1.60,
        9: 1.10,
        10: 1.25,
        11: 1.05,
        12: 1.35,
    }

    if not hotels:
        return stats

    base_price = sum(h.price_per_night for h in hotels) / len(hotels)

    for month in range(1, 13):
        factor = seasonality.get(month, 1.0)
        noise = random.uniform(0.92, 1.08)

        weekday_avg = base_price * factor * noise * 0.85
        weekend_avg = base_price * factor * noise * 1.20
        peak_avg = (
            base_price * factor * noise * 1.45
            if month in [3, 4, 5, 8, 12]
            else None
        )

        stats.append(
            MonthlyStats(
                month=f"{year}-{month:02d}",
                weekday_avg=round(weekday_avg, -2),
                weekend_avg=round(weekend_avg, -2),
                peak_avg=round(peak_avg, -2) if peak_avg else None,
                min_price=round(
                    min(h.price_per_night for h in hotels) * factor * 0.8, -2
                ),
                max_price=round(
                    max(h.price_per_night for h in hotels) * factor * 1.3, -2
                ),
            )
        )

    return stats
