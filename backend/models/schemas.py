from typing import List, Optional
from pydantic import BaseModel


class ScrapeRequest(BaseModel):
    location: str
    check_in: str  # YYYY-MM-DD
    check_out: str  # YYYY-MM-DD
    hotel_type: str = "all"  # "all" | "business" | "resort" | "budget"
    radius_km: float = 3.0


class HotelData(BaseModel):
    name: str
    price_per_night: float
    rating: Optional[float] = None
    review_count: Optional[int] = None
    url: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    source: str


class MonthlyStats(BaseModel):
    month: str  # "2024-01"
    weekday_avg: float
    weekend_avg: float
    peak_avg: Optional[float] = None
    min_price: float
    max_price: float


class ScrapeResponse(BaseModel):
    hotels: List[HotelData]
    monthly_stats: List[MonthlyStats]
    geocoded_lat: float
    geocoded_lng: float
    search_address: str


class FactorsResponse(BaseModel):
    holidays: List[dict]
    events: List[dict]
    weather_notes: str
    inbound_trend: str
    forex_note: str
    cpi_note: str


class GeoCodeResponse(BaseModel):
    lat: float
    lng: float
    display_name: str
