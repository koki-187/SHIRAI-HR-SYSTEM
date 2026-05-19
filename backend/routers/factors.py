from typing import Optional

from fastapi import APIRouter

from models.schemas import FactorsResponse
from services import factors as factors_service

router = APIRouter(prefix="/api/factors", tags=["factors"])


@router.get("/", response_model=FactorsResponse)
async def get_factors(year: int = 2024, month: Optional[int] = None):
    """
    指定年（・月）の日本の祝日・イベント・市場要因データを返す。

    Args:
        year: 対象年（2024または2025）
        month: 対象月（1-12）。省略時は全月分を返す。
    """
    data = factors_service.get_factors(year, month)
    return FactorsResponse(**data)
