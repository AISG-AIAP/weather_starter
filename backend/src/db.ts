import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { and, desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { migrate } from 'drizzle-orm/sqlite-proxy/migrator';
import { locations, type WeatherSnapshot } from './schema.js';

export interface LocationRecord {
  id: number;
  latitude: number;
  longitude: number;
  created_at: string;
  weather: WeatherSnapshot;
}

type LocationRow = typeof locations.$inferSelect;

const defaultWeather: WeatherSnapshot = {
  condition: 'Not refreshed',
  observed_at: null,
  source: 'not-refreshed',
  area: null,
  valid_period_text: null,
  temperature_c: null,
  humidity_percent: null,
  rainfall_mm: null,
  wind_speed_knots: null,
  wind_direction_degrees: null,
  forecast_low_c: null,
  forecast_high_c: null,
  uv_index: null,
  psi_twenty_four_hourly: null,
  pm25_one_hourly: null,
  air_quality_region: null,
  forecast_periods: [],
  daily_forecast: [],
};

const databasePath = process.env.DATABASE_PATH ?? join(process.cwd(), 'backend', 'weather.db');
mkdirSync(dirname(databasePath), { recursive: true });

const sqlite = new DatabaseSync(databasePath);
sqlite.exec('PRAGMA journal_mode = WAL');
const db = drizzle(sqliteCallback, { schema: { locations } });
await migrate(
  db,
  async (migrationQueries) => {
    for (const query of migrationQueries) {
      const trimmed = query.trim();
      if (trimmed) sqlite.exec(trimmed);
    }
  },
  { migrationsFolder: join(process.cwd(), 'backend', 'drizzle') },
);

export async function listLocations(): Promise<LocationRecord[]> {
  const stmt = sqlite.prepare(
    'SELECT id, latitude, longitude, created_at, condition, observed_at, source, area, valid_period_text, temperature_c, humidity_percent, rainfall_mm, wind_speed_knots, wind_direction_degrees, forecast_low_c, forecast_high_c, uv_index, psi_twenty_four_hourly, pm25_one_hourly, air_quality_region, forecast_periods, daily_forecast FROM locations ORDER BY created_at DESC, id DESC'
  );
  const rows = stmt.all() as unknown as LocationRow[];
  return rows.map(rowToRecord);
}

export async function createLocation(latitude: number, longitude: number): Promise<LocationRecord> {
  const duplicate = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.latitude, latitude), eq(locations.longitude, longitude)))
    .get();

  if (duplicate?.id !== undefined) {
    const error = new Error('Location already exists');
    error.name = 'DuplicateLocationError';
    throw error;
  }

  const createdAt = new Date().toISOString().slice(0, 19);
  const weather = weatherToColumns(defaultWeather);
  const row = await db
    .insert(locations)
    .values({
      latitude,
      longitude,
      createdAt,
      ...weather,
    } as any)
    .returning()
    .get();

  return rowToRecord(row as LocationRow);
}

export async function getLocation(id: number): Promise<LocationRecord | null> {
  const stmt = sqlite.prepare(
    'SELECT id, latitude, longitude, created_at, condition, observed_at, source, area, valid_period_text, temperature_c, humidity_percent, rainfall_mm, wind_speed_knots, wind_direction_degrees, forecast_low_c, forecast_high_c, uv_index, psi_twenty_four_hourly, pm25_one_hourly, air_quality_region, forecast_periods, daily_forecast FROM locations WHERE id = ?'
  );
  const row = stmt.get(id) as unknown as LocationRow | undefined;
  return row ? rowToRecord(row) : null;
}

export async function updateWeather(
  id: number,
  weather: WeatherSnapshot,
): Promise<LocationRecord | null> {
  const columns = weatherToColumns(weather);
  const row = await db.update(locations).set(columns as any).where(eq(locations.id, id)).returning().get();

  return row ? rowToRecord(row) : null;
}

export async function deleteLocation(id: number): Promise<void> {
  await db.delete(locations).where(eq(locations.id, id)).run();
}

export function closeDatabase(): void {
  sqlite.close();
}

export async function resetStore(): Promise<void> {
  await db.delete(locations).run();
  sqlite.prepare("DELETE FROM sqlite_sequence WHERE name = 'locations'").run();
}

function weatherToColumns(weather: WeatherSnapshot) {
  return {
    condition: weather.condition,
    observedAt: weather.observed_at,
    source: weather.source,
    area: weather.area,
    validPeriodText: weather.valid_period_text,
    temperatureC: weather.temperature_c,
    humidityPercent: weather.humidity_percent,
    rainfallMm: weather.rainfall_mm,
    windSpeedKnots: weather.wind_speed_knots,
    windDirectionDegrees: weather.wind_direction_degrees,
    forecastLowC: weather.forecast_low_c,
    forecastHighC: weather.forecast_high_c,
    uvIndex: weather.uv_index,
    psiTwentyFourHourly: weather.psi_twenty_four_hourly,
    pm25OneHourly: weather.pm25_one_hourly,
    airQualityRegion: weather.air_quality_region,
    forecastPeriods: JSON.stringify(weather.forecast_periods),
    dailyForecast: JSON.stringify(weather.daily_forecast),
  };
}

function rowToRecord(row: LocationRow): LocationRecord {
  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    created_at: row.createdAt,
    weather: {
      condition: row.condition,
      observed_at: row.observedAt,
      source: row.source,
      area: row.area,
      valid_period_text: row.validPeriodText,
      temperature_c: row.temperatureC,
      humidity_percent: row.humidityPercent,
      rainfall_mm: row.rainfallMm,
      wind_speed_knots: row.windSpeedKnots,
      wind_direction_degrees: row.windDirectionDegrees,
      forecast_low_c: row.forecastLowC,
      forecast_high_c: row.forecastHighC,
      uv_index: row.uvIndex,
      psi_twenty_four_hourly: row.psiTwentyFourHourly,
      pm25_one_hourly: row.pm25OneHourly,
      air_quality_region: row.airQualityRegion,
      forecast_periods: typeof row.forecastPeriods === 'string' ? JSON.parse(row.forecastPeriods) : row.forecastPeriods,
      daily_forecast: typeof row.dailyForecast === 'string' ? JSON.parse(row.dailyForecast) : row.dailyForecast,
    },
  };
}

async function sqliteCallback(
  sql: string,
  params: unknown[],
  method: 'run' | 'all' | 'values' | 'get',
): Promise<{ rows: unknown[] }> {
  const statement = sqlite.prepare(sql);
  const bindings = params as never[];
  if (method === 'run') {
    statement.run(...bindings);
    return Promise.resolve({ rows: [] });
  }
  if (method === 'get') {
    const row = statement.get(...bindings) as Record<string, unknown> | undefined;
    return Promise.resolve({ rows: row ? [row] : [] });
  }
  const rows = statement.all(...bindings) as Record<string, unknown>[];
  if (method === 'values') {
    return Promise.resolve({ rows: rows.map((row) => Object.values(row)) });
  }
  return Promise.resolve({ rows });
}
