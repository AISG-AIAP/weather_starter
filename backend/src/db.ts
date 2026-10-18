import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
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

const LOCATION_COLUMNS_SQL =
  'id, latitude, longitude, created_at, condition, observed_at, source, area, valid_period_text, ' +
  'temperature_c, humidity_percent, rainfall_mm, wind_speed_knots, wind_direction_degrees, ' +
  'forecast_low_c, forecast_high_c, uv_index, psi_twenty_four_hourly, pm25_one_hourly, ' +
  'air_quality_region, forecast_periods, daily_forecast';

interface LocationDbRow {
  id: number;
  latitude: number;
  longitude: number;
  created_at: string;
  condition: string | null;
  observed_at: string | null;
  source: string | null;
  area: string | null;
  valid_period_text: string | null;
  temperature_c: number | null;
  humidity_percent: number | null;
  rainfall_mm: number | null;
  wind_speed_knots: number | null;
  wind_direction_degrees: number | null;
  forecast_low_c: number | null;
  forecast_high_c: number | null;
  uv_index: number | null;
  psi_twenty_four_hourly: number | null;
  pm25_one_hourly: number | null;
  air_quality_region: string | null;
  forecast_periods: string;
  daily_forecast: string;
}

export async function listLocations(): Promise<LocationRecord[]> {
  const stmt = sqlite.prepare(
    `SELECT ${LOCATION_COLUMNS_SQL} FROM locations ORDER BY created_at DESC, id DESC`,
  );
  const rows = stmt.all() as unknown as LocationDbRow[];
  return rows.map(rowToRecord);
}

export async function createLocation(latitude: number, longitude: number): Promise<LocationRecord> {
  const duplicate = sqlite
    .prepare('SELECT id FROM locations WHERE latitude = ? AND longitude = ?')
    .get(latitude, longitude);

  if (duplicate !== undefined) {
    const error = new Error('Location already exists');
    error.name = 'DuplicateLocationError';
    throw error;
  }

  const createdAt = new Date().toISOString().slice(0, 19);
  const columns = weatherToColumns(defaultWeather);
  const insert = sqlite.prepare(
    `INSERT INTO locations (
      latitude, longitude, created_at, condition, observed_at, source, area, valid_period_text,
      temperature_c, humidity_percent, rainfall_mm, wind_speed_knots, wind_direction_degrees,
      forecast_low_c, forecast_high_c, uv_index, psi_twenty_four_hourly, pm25_one_hourly,
      air_quality_region, forecast_periods, daily_forecast
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const result = insert.run(
    latitude,
    longitude,
    createdAt,
    columns.condition,
    columns.observedAt,
    columns.source,
    columns.area,
    columns.validPeriodText,
    columns.temperatureC,
    columns.humidityPercent,
    columns.rainfallMm,
    columns.windSpeedKnots,
    columns.windDirectionDegrees,
    columns.forecastLowC,
    columns.forecastHighC,
    columns.uvIndex,
    columns.psiTwentyFourHourly,
    columns.pm25OneHourly,
    columns.airQualityRegion,
    columns.forecastPeriods,
    columns.dailyForecast,
  );

  const created = await getLocation(Number(result.lastInsertRowid));
  if (!created) throw new Error('Failed to read back created location');
  return created;
}

export async function getLocation(id: number): Promise<LocationRecord | null> {
  const stmt = sqlite.prepare(`SELECT ${LOCATION_COLUMNS_SQL} FROM locations WHERE id = ?`);
  const row = stmt.get(id) as unknown as LocationDbRow | undefined;
  return row ? rowToRecord(row) : null;
}

export async function updateWeather(
  id: number,
  weather: WeatherSnapshot,
): Promise<LocationRecord | null> {
  const columns = weatherToColumns(weather);
  const update = sqlite.prepare(
    `UPDATE locations SET
      condition = ?, observed_at = ?, source = ?, area = ?, valid_period_text = ?,
      temperature_c = ?, humidity_percent = ?, rainfall_mm = ?, wind_speed_knots = ?,
      wind_direction_degrees = ?, forecast_low_c = ?, forecast_high_c = ?, uv_index = ?,
      psi_twenty_four_hourly = ?, pm25_one_hourly = ?, air_quality_region = ?,
      forecast_periods = ?, daily_forecast = ?
    WHERE id = ?`,
  );
  update.run(
    columns.condition,
    columns.observedAt,
    columns.source,
    columns.area,
    columns.validPeriodText,
    columns.temperatureC,
    columns.humidityPercent,
    columns.rainfallMm,
    columns.windSpeedKnots,
    columns.windDirectionDegrees,
    columns.forecastLowC,
    columns.forecastHighC,
    columns.uvIndex,
    columns.psiTwentyFourHourly,
    columns.pm25OneHourly,
    columns.airQualityRegion,
    columns.forecastPeriods,
    columns.dailyForecast,
    id,
  );

  return getLocation(id);
}

export async function deleteLocation(id: number): Promise<void> {
  sqlite.prepare('DELETE FROM locations WHERE id = ?').run(id);
}

export function closeDatabase(): void {
  sqlite.close();
}

export async function resetStore(): Promise<void> {
  sqlite.exec('DELETE FROM locations');
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

function rowToRecord(row: LocationDbRow): LocationRecord {
  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    created_at: row.created_at,
    weather: {
      condition: row.condition,
      observed_at: row.observed_at,
      source: row.source,
      area: row.area,
      valid_period_text: row.valid_period_text,
      temperature_c: row.temperature_c,
      humidity_percent: row.humidity_percent,
      rainfall_mm: row.rainfall_mm,
      wind_speed_knots: row.wind_speed_knots,
      wind_direction_degrees: row.wind_direction_degrees,
      forecast_low_c: row.forecast_low_c,
      forecast_high_c: row.forecast_high_c,
      uv_index: row.uv_index,
      psi_twenty_four_hourly: row.psi_twenty_four_hourly,
      pm25_one_hourly: row.pm25_one_hourly,
      air_quality_region: row.air_quality_region,
      forecast_periods: JSON.parse(row.forecast_periods),
      daily_forecast: JSON.parse(row.daily_forecast),
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
