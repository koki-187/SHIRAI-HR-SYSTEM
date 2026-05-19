import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import factors, geocode, scrape

app = FastAPI(
    title="HotelScope API",
    version="1.0.0",
    description="ホテル土地仕入れ判断のための周辺料金市場調査API",
)

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scrape.router)
app.include_router(geocode.router)
app.include_router(factors.router)


@app.get("/health", tags=["health"])
async def health():
    """ヘルスチェックエンドポイント"""
    return {"status": "ok"}
