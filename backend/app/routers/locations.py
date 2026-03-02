import os
import sqlite3
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status

from app.services.weather_api import SingaporeWeatherClient, WeatherProviderError

router = APIRouter(prefix="/locations", tags=["locations"])

DB_PATH = os.getenv("DATABASE_PATH", "weather.db")


def get_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def row_to_dict(row):
    if row is None:
        return None
    d = dict(row)
    weather = {
        "condition": d.pop("weather_condition", None),
        "observed_at": d.pop("weather_observed_at", None),
        "source": d.pop("weather_source", None),
        "area": d.pop("weather_area", None),
        "valid_period_text": d.pop("weather_valid_period_text", None),
    }
    d.pop("weather_refreshed_at", None)
    d["weather"] = weather
    return d


@router.get("")
def list_locations():
    con = get_db()
    rows = con.execute(
        "SELECT * FROM locations ORDER BY created_at DESC, id DESC"
    ).fetchall()
    con.close()
    return {"locations": [row_to_dict(row) for row in rows]}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_location(payload: dict):
    latitude = payload.get("latitude")
    longitude = payload.get("longitude")

    if latitude is None or longitude is None:
        raise HTTPException(status_code=422, detail="latitude and longitude are required")
    if not (1.1 <= latitude <= 1.5 and 103.6 <= longitude <= 104.1):
        raise HTTPException(
            status_code=422,
            detail="Coordinates must be within Singapore (lat 1.1–1.5, lon 103.6–104.1)",
        )

    now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S")
    con = get_db()
    try:
        cursor = con.execute(
            """INSERT INTO locations (latitude, longitude, created_at, weather_condition, weather_source)
               VALUES (?, ?, ?, 'Not refreshed', 'not-refreshed')""",
            (latitude, longitude, now),
        )
        con.commit()
        row = con.execute("SELECT * FROM locations WHERE id = ?", (cursor.lastrowid,)).fetchone()
    except sqlite3.IntegrityError:
        con.close()
        raise HTTPException(status_code=409, detail="Location already exists") from None
    con.close()
    return row_to_dict(row)


@router.get("/{location_id}")
def get_location(location_id: int):
    con = get_db()
    row = con.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
    con.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return row_to_dict(row)


@router.post("/{location_id}/refresh")
def refresh_location(location_id: int):
    con = get_db()
    row = con.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
    if row is None:
        con.close()
        raise HTTPException(status_code=404, detail="Location not found")

    api_key = os.getenv("WEATHER_API_KEY")
    client = SingaporeWeatherClient(api_key=api_key)

    try:
        snapshot = client.get_current_weather(
            latitude=row["latitude"],
            longitude=row["longitude"],
        )
    except WeatherProviderError as exc:
        con.close()
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S")
    con.execute(
        """UPDATE locations
           SET weather_condition = ?, weather_observed_at = ?, weather_source = ?,
               weather_area = ?, weather_valid_period_text = ?, weather_refreshed_at = ?
           WHERE id = ?""",
        (
            snapshot["condition"],
            snapshot["observed_at"],
            snapshot["source"],
            snapshot["area"],
            snapshot["valid_period_text"],
            now,
            location_id,
        ),
    )
    con.commit()
    row = con.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
    con.close()
    return row_to_dict(row)
