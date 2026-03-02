import os
import sqlite3

from fastapi import FastAPI

from app.routers.locations import router as locations_router

DB_PATH = os.getenv("DATABASE_PATH", "weather.db")


def init_db():
    con = sqlite3.connect(DB_PATH)
    con.execute("""
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            created_at TEXT NOT NULL,
            weather_condition TEXT,
            weather_observed_at TEXT,
            weather_source TEXT,
            weather_area TEXT,
            weather_valid_period_text TEXT,
            weather_refreshed_at TEXT,
            UNIQUE(latitude, longitude)
        )
    """)
    con.commit()
    con.close()


init_db()

app = FastAPI(
    title="Weather Starter",
    description="Minimal weather API starter with data.gov.sg integration",
    version="0.1.0",
)

app.include_router(locations_router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "healthy"}
