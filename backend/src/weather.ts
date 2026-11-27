export class WeatherProviderError extends Error {}

/**
 * Stored readings a refresh can fall back to when an endpoint fails. Every field may be
 * missing or null, matching how rows are stored before the first refresh.
 */
export type PreviousReadings = {
  [K in keyof WeatherSnapshot]?: WeatherSnapshot[K] | null;
};

interface SnapshotReadings {
  temperatureC?: number | null;
  humidityPercent?: number | null;
  rainfallMm?: number | null;
  windSpeedKnots?: number | null;
  uvIndex?: number | null;
  psiTwentyFourHourly?: number | null;
  pm25OneHourly?: number | null;
  airQualityRegion?: string | null;
  forecastLowC?: number | null;
  forecastHighC?: number | null;
  forecastPeriods?: ForecastPeriod[];
  dailyForecast?: DailyForecast[];
}

interface ForecastPayload {
  code?: number;
  errorMsg?: string;
  data?: ForecastRoot;
  area_metadata?: AreaMetadata[];
  items?: ForecastItem[];
}

interface ForecastRoot {
  area_metadata?: AreaMetadata[];
  items?: ForecastItem[];
}

interface AreaMetadata {
  name?: string;
  label_location?: {
    latitude?: number | string;
    longitude?: number | string;
  };
}

interface ForecastItem {
  update_timestamp?: string;
  timestamp?: string;
  valid_period?: {
    text?: string;
  };
  forecasts?: Array<{
    area?: string;
    forecast?: string;
  }>;
}

interface ReadingPayload {
  code?: number;
  errorMsg?: string;
  data?: {
    stations?: WeatherStation[];
    readings?: WeatherReading[];
    readingType?: string;
    readingUnit?: string;
  };
}

interface WeatherStation {
  id?: string;
  name?: string;
  location?: {
    latitude?: number | string;
    longitude?: number | string;
  };
}

interface WeatherReading {
  timestamp?: string;
  data?: Array<{
    stationId?: string;
    value?: number | string;
  }>;
}

interface RegionMetadata {
  name?: string;
  labelLocation?: {
    latitude?: number | string;
    longitude?: number | string;
  };
}

interface UvPayload {
  code?: number;
  errorMsg?: string;
  data?: {
    records?: Array<{
      timestamp?: string;
      updatedTimestamp?: string;
      index?: Array<{
        hour?: string;
        value?: number | string;
      }>;
    }>;
  };
}

interface PsiPayload {
  code?: number;
  errorMsg?: string;
  data?: {
    regionMetadata?: RegionMetadata[];
    items?: Array<{
      timestamp?: string;
      updatedTimestamp?: string;
      readings?: Record<string, Record<string, number | string>>;
    }>;
  };
}

interface TwentyFourHourPayload {
  code?: number;
  errorMsg?: string;
  data?: {
    records?: Array<{
      timestamp?: string;
      updatedTimestamp?: string;
      general?: {
        temperature?: {
          low?: number | string;
          high?: number | string;
        };
      };
      periods?: Array<{
        timePeriod?: {
          start?: string;
          text?: string;
        };
        regions?: Record<string, { text?: string; code?: string }>;
      }>;
    }>;
  };
}

interface FourDayPayload {
  items?: Array<{
    update_timestamp?: string;
    timestamp?: string;
    forecasts?: Array<{
      date?: string;
      timestamp?: string;
      forecast?: string;
      temperature?: {
        low?: number | string;
        high?: number | string;
      };
    }>;
  }>;
}

export interface ForecastPeriod {
  label: string;
  forecast: string;
}

export interface DailyForecast {
  date: string;
  forecast: string;
  temperature_low_c: number | null;
  temperature_high_c: number | null;
}

export interface WeatherSnapshot {
  condition: string;
  observed_at: string;
  source: string;
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
  forecast_periods: ForecastPeriod[];
  daily_forecast: DailyForecast[];
}

// data.gov.sg realtime API cap without an API key. Dev/prod keys raise this (12 / 30).
const REALTIME_CALLS_PER_WINDOW = 6;
// Held slightly longer than the 10 s window: the provider measured a call at exactly 10.00 s
// as still inside the window and returned 429.
const REALTIME_WINDOW_MS = 10_500;

// How long a payload is reused before re-fetching it. Payloads are island-wide, so one fetch
// serves every saved location.
const CACHE_TTL_MS = {
  station: 60_000,
  twoHourForecast: 5 * 60_000,
  uvPsiPm25: 10 * 60_000,
  twentyFourHourForecast: 30 * 60_000,
  fourDayForecast: 60 * 60_000,
} as const;

type CacheKind = keyof typeof CACHE_TTL_MS;

interface CacheEntry {
  payload: unknown;
  fetchedAt: number;
}

export interface WeatherClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  userAgent?: string;
  realtimeCallsPerWindow?: number;
  realtimeWindowMs?: number;
  now?: () => number;
}

export class SingaporeWeatherClient {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly callTimes: number[] = [];

  constructor(private readonly options: WeatherClientOptions = {}) {}

  private now(): number {
    return this.options.now ? this.options.now() : Date.now();
  }

  /**
   * Builds a snapshot for a point. The two-hour forecast (condition) is required; every other
   * field is best-effort. A field whose endpoint fails keeps its value from `previous`
   * (the stored weather) instead of blanking the card.
   */
  async getCurrentWeather(
    latitude: number,
    longitude: number,
    previous?: PreviousReadings | null,
  ): Promise<WeatherSnapshot> {
    const forecastPayload = await this.fetchLatestForecastPayload();

    // Each endpoint is independent: a failure leaves that field to the stored value.
    const [
      temperature,
      humidity,
      rainfall,
      windSpeed,
      uv,
      airQuality,
      twentyFour,
      fourDay,
    ] = await Promise.all([
      this.settle(
        this.fetchNearestReading('air-temperature', latitude, longitude),
      ),
      this.settle(
        this.fetchNearestReading('relative-humidity', latitude, longitude),
      ),
      this.settle(this.fetchNearestReading('rainfall', latitude, longitude)),
      this.settle(this.fetchNearestReading('wind-speed', latitude, longitude)),
      this.settle(this.fetchUvIndex()),
      this.settle(this.fetchAirQuality(latitude, longitude)),
      this.settle(this.fetchTwentyFourHourForecast(latitude, longitude)),
      this.settle(this.fetchFourDayForecast()),
    ]);

    const pick = <T>(
      fresh: T | null | undefined,
      stored: T | null | undefined,
    ) => fresh ?? stored ?? null;

    return this.snapshotFromPayload(forecastPayload, latitude, longitude, {
      temperatureC: pick(temperature?.value, previous?.temperature_c),
      humidityPercent: pick(humidity?.value, previous?.humidity_percent),
      rainfallMm: pick(rainfall?.value, previous?.rainfall_mm),
      windSpeedKnots: pick(windSpeed?.value, previous?.wind_speed_knots),
      uvIndex: pick(uv?.value, previous?.uv_index),
      psiTwentyFourHourly: pick(
        airQuality?.psi,
        previous?.psi_twenty_four_hourly,
      ),
      pm25OneHourly: pick(airQuality?.pm25, previous?.pm25_one_hourly),
      airQualityRegion: pick(airQuality?.region, previous?.air_quality_region),
      forecastLowC: pick(twentyFour?.low, previous?.forecast_low_c),
      forecastHighC: pick(twentyFour?.high, previous?.forecast_high_c),
      forecastPeriods: twentyFour?.periods ?? previous?.forecast_periods ?? [],
      dailyForecast: fourDay?.days ?? previous?.daily_forecast ?? [],
    });
  }

  /** Resolves a field's fetch to its value, or null if that endpoint failed. */
  private async settle<T>(request: Promise<T>): Promise<T | null> {
    try {
      return await request;
    } catch {
      return null;
    }
  }

  async fetchLatestForecastPayload(): Promise<ForecastPayload> {
    return this.fetchJson(
      `${this.apiBaseUrl()}/v2/real-time/api/two-hr-forecast`,
      'twoHourForecast',
    );
  }

  async fetchNearestReading(
    endpoint:
      | 'air-temperature'
      | 'relative-humidity'
      | 'rainfall'
      | 'wind-speed',
    latitude: number,
    longitude: number,
  ): Promise<{ value: number | null; timestamp: string | null }> {
    const payload = await this.fetchReadingPayload(endpoint);
    if (payload.code !== undefined && payload.code !== 0) {
      throw new WeatherProviderError(
        payload.errorMsg ??
          `Weather provider returned an error for ${endpoint}`,
      );
    }

    const stations = payload.data?.stations ?? [];
    const latestReading = payload.data?.readings?.[0];
    const values = latestReading?.data ?? [];
    if (stations.length === 0 || values.length === 0) {
      return { value: null, timestamp: latestReading?.timestamp ?? null };
    }

    const valueByStation = new Map(
      values
        .map((entry) => [entry.stationId, Number(entry.value)] as const)
        .filter(
          (entry): entry is [string, number] =>
            Boolean(entry[0]) && !Number.isNaN(entry[1]),
        ),
    );
    const station = nearestStation(
      stations,
      latitude,
      longitude,
      valueByStation,
    );
    return {
      value: station ? (valueByStation.get(station.id) ?? null) : null,
      timestamp: latestReading?.timestamp ?? null,
    };
  }

  async fetchReadingPayload(endpoint: string): Promise<ReadingPayload> {
    return this.fetchJson(
      `${this.apiBaseUrl()}/v2/real-time/api/${endpoint}`,
      'station',
    );
  }

  async fetchUvIndex(): Promise<{
    value: number | null;
    timestamp: string | null;
  }> {
    const payload = await this.fetchJson<UvPayload>(
      `${this.apiBaseUrl()}/v2/real-time/api/uv`,
      'uvPsiPm25',
    );
    if (payload.code !== undefined && payload.code !== 0) {
      throw new WeatherProviderError(
        payload.errorMsg ?? 'Weather provider returned an error for uv',
      );
    }

    const record = payload.data?.records?.[0];
    const latest = record?.index?.[0];
    return {
      value: numberOrNull(latest?.value),
      timestamp:
        record?.updatedTimestamp ?? latest?.hour ?? record?.timestamp ?? null,
    };
  }

  async fetchAirQuality(
    latitude: number,
    longitude: number,
  ): Promise<{
    psi: number | null;
    pm25: number | null;
    region: string | null;
    timestamp: string | null;
  }> {
    const [psiPayload, pm25Payload] = await Promise.all([
      this.fetchJson<PsiPayload>(
        `${this.apiBaseUrl()}/v2/real-time/api/psi`,
        'uvPsiPm25',
      ),
      this.fetchJson<PsiPayload>(
        `${this.apiBaseUrl()}/v2/real-time/api/pm25`,
        'uvPsiPm25',
      ),
    ]);
    for (const payload of [psiPayload, pm25Payload]) {
      if (payload.code !== undefined && payload.code !== 0) {
        throw new WeatherProviderError(
          payload.errorMsg ?? 'Weather provider returned an air quality error',
        );
      }
    }

    const region = nearestRegionName(
      psiPayload.data?.regionMetadata ?? [],
      latitude,
      longitude,
    );
    const psiItem = psiPayload.data?.items?.[0];
    const pm25Item = pm25Payload.data?.items?.[0];
    return {
      psi: valueForRegion(psiItem?.readings?.psi_twenty_four_hourly, region),
      pm25: valueForRegion(pm25Item?.readings?.pm25_one_hourly, region),
      region,
      timestamp: latestTimestamp([
        psiItem?.updatedTimestamp ?? psiItem?.timestamp ?? null,
        pm25Item?.updatedTimestamp ?? pm25Item?.timestamp ?? null,
      ]),
    };
  }

  async fetchTwentyFourHourForecast(
    latitude: number,
    longitude: number,
  ): Promise<{
    low: number | null;
    high: number | null;
    periods: ForecastPeriod[];
    timestamp: string | null;
  }> {
    const payload = await this.fetchJson<TwentyFourHourPayload>(
      `${this.apiBaseUrl()}/v2/real-time/api/twenty-four-hr-forecast`,
      'twentyFourHourForecast',
    );
    if (payload.code !== undefined && payload.code !== 0) {
      throw new WeatherProviderError(
        payload.errorMsg ??
          'Weather provider returned a 24-hour forecast error',
      );
    }

    const record = payload.data?.records?.[0];
    const region =
      nearestRegionName(defaultRegions(), latitude, longitude) ?? 'central';
    return {
      low: numberOrNull(record?.general?.temperature?.low),
      high: numberOrNull(record?.general?.temperature?.high),
      periods: (record?.periods ?? [])
        .map((period) => ({
          label: period.timePeriod?.text ?? '',
          forecast:
            period.regions?.[region]?.text ??
            period.regions?.central?.text ??
            '',
        }))
        .filter((period) => period.label && period.forecast),
      timestamp: record?.updatedTimestamp ?? record?.timestamp ?? null,
    };
  }

  async fetchFourDayForecast(): Promise<{
    days: DailyForecast[];
    timestamp: string | null;
  }> {
    const payload = await this.fetchJson<FourDayPayload>(
      `${this.legacyApiBaseUrl()}/v1/environment/4-day-weather-forecast`,
      'fourDayForecast',
    );
    const item = payload.items?.[0];
    return {
      days: (item?.forecasts ?? [])
        .map((forecast) => ({
          date: forecast.date ?? forecast.timestamp ?? '',
          forecast: forecast.forecast ?? '',
          temperature_low_c: numberOrNull(forecast.temperature?.low),
          temperature_high_c: numberOrNull(forecast.temperature?.high),
        }))
        .filter((forecast) => forecast.date && forecast.forecast),
      timestamp: item?.update_timestamp ?? item?.timestamp ?? null,
    };
  }

  private apiBaseUrl(): string {
    return this.options.baseUrl ?? 'https://api-open.data.gov.sg';
  }

  private legacyApiBaseUrl(): string {
    return 'https://api.data.gov.sg';
  }

  /**
   * Fetches a payload through the shared cache. Within the TTL the cached payload is returned
   * with no upstream call. Concurrent callers for the same URL share one request. If the
   * upstream call fails and an older payload exists, that stale payload is returned instead.
   */
  private async fetchJson<T>(url: string, kind: CacheKind): Promise<T> {
    const ttl = CACHE_TTL_MS[kind];
    const cached = this.cache.get(url);
    if (cached && this.now() - cached.fetchedAt < ttl) {
      return cached.payload as T;
    }

    const pending = this.inFlight.get(url);
    if (pending) return pending as Promise<T>;

    const request = this.requestJson<T>(url)
      .then((payload) => {
        this.cache.set(url, { payload, fetchedAt: this.now() });
        return payload;
      })
      .catch((error: unknown) => {
        if (cached) return cached.payload as T;
        throw error;
      })
      .finally(() => {
        this.inFlight.delete(url);
      });

    this.inFlight.set(url, request);
    return request;
  }

  /** Waits until fewer than the realtime cap of calls were made in the last window. */
  private async acquireRealtimeSlot(): Promise<void> {
    const limit =
      this.options.realtimeCallsPerWindow ?? REALTIME_CALLS_PER_WINDOW;
    const windowMs = this.options.realtimeWindowMs ?? REALTIME_WINDOW_MS;
    for (;;) {
      const now = this.now();
      while (this.callTimes.length > 0 && now - this.callTimes[0] >= windowMs) {
        this.callTimes.shift();
      }
      if (this.callTimes.length < limit) {
        this.callTimes.push(now);
        return;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, windowMs - (now - this.callTimes[0])),
      );
    }
  }

  private async requestJson<T>(url: string): Promise<T> {
    if (url.startsWith(this.apiBaseUrl())) await this.acquireRealtimeSlot();

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.options.timeoutMs ?? 8000,
    );

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent':
            this.options.userAgent ??
            'weather-starter/0.1 (educational project)',
          ...(this.options.apiKey ? { 'x-api-key': this.options.apiKey } : {}),
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new WeatherProviderError(
            'Weather provider rate limit reached (HTTP 429)',
          );
        }
        if (response.status === 401 || response.status === 403) {
          throw new WeatherProviderError(
            'Weather provider rejected request (check API key)',
          );
        }
        throw new WeatherProviderError(
          `Weather provider returned HTTP ${response.status}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof WeatherProviderError) throw error;
      throw new WeatherProviderError('Unable to reach weather provider');
    } finally {
      clearTimeout(timeout);
    }
  }

  snapshotFromPayload(
    payload: ForecastPayload,
    latitude: number,
    longitude: number,
    readings: SnapshotReadings = {},
  ): WeatherSnapshot {
    if (payload.code !== undefined && payload.code !== 0) {
      throw new WeatherProviderError(
        payload.errorMsg ?? 'Weather provider returned an error',
      );
    }

    const root = payload.data ?? payload;
    const areaMetadata = root.area_metadata ?? [];
    const items = root.items ?? [];
    if (items.length === 0) {
      throw new WeatherProviderError('Forecast response has no items');
    }

    const latestItem = items[0];
    const forecasts = latestItem.forecasts ?? [];
    if (forecasts.length === 0) {
      throw new WeatherProviderError('Forecast item has no area forecasts');
    }

    const forecastByArea = new Map(
      forecasts
        .filter((entry) => entry.area && entry.forecast)
        .map((entry) => [entry.area as string, entry.forecast as string]),
    );

    const nearestArea = nearestAreaName(areaMetadata, latitude, longitude);
    if (nearestArea && forecastByArea.has(nearestArea)) {
      return {
        condition: forecastByArea.get(nearestArea) as string,
        observed_at: latestItem.update_timestamp ?? latestItem.timestamp ?? '',
        source: 'api-open.data.gov.sg',
        area: nearestArea,
        valid_period_text: latestItem.valid_period?.text ?? null,
        temperature_c: readings.temperatureC ?? null,
        humidity_percent: readings.humidityPercent ?? null,
        rainfall_mm: readings.rainfallMm ?? null,
        wind_speed_knots: readings.windSpeedKnots ?? null,
        wind_direction_degrees: null,
        forecast_low_c: readings.forecastLowC ?? null,
        forecast_high_c: readings.forecastHighC ?? null,
        uv_index: readings.uvIndex ?? null,
        psi_twenty_four_hourly: readings.psiTwentyFourHourly ?? null,
        pm25_one_hourly: readings.pm25OneHourly ?? null,
        air_quality_region: readings.airQualityRegion ?? null,
        forecast_periods: readings.forecastPeriods ?? [],
        daily_forecast: readings.dailyForecast ?? [],
      };
    }

    const fallback = forecasts[0];
    return {
      condition: fallback.forecast ?? 'Unknown',
      observed_at: latestItem.update_timestamp ?? latestItem.timestamp ?? '',
      source: 'api-open.data.gov.sg',
      area: fallback.area ?? null,
      valid_period_text: latestItem.valid_period?.text ?? null,
      temperature_c: readings.temperatureC ?? null,
      humidity_percent: readings.humidityPercent ?? null,
      rainfall_mm: readings.rainfallMm ?? null,
      wind_speed_knots: readings.windSpeedKnots ?? null,
      wind_direction_degrees: null,
      forecast_low_c: readings.forecastLowC ?? null,
      forecast_high_c: readings.forecastHighC ?? null,
      uv_index: readings.uvIndex ?? null,
      psi_twenty_four_hourly: readings.psiTwentyFourHourly ?? null,
      pm25_one_hourly: readings.pm25OneHourly ?? null,
      air_quality_region: readings.airQualityRegion ?? null,
      forecast_periods: readings.forecastPeriods ?? [],
      daily_forecast: readings.dailyForecast ?? [],
    };
  }
}

function nearestAreaName(
  areaMetadata: AreaMetadata[],
  latitude: number,
  longitude: number,
): string | null {
  let nearest: { name: string; distance: number } | null = null;

  for (const area of areaMetadata) {
    const lat = Number(area.label_location?.latitude);
    const lon = Number(area.label_location?.longitude);
    if (!area.name || Number.isNaN(lat) || Number.isNaN(lon)) continue;

    const distance = (lat - latitude) ** 2 + (lon - longitude) ** 2;
    if (!nearest || distance < nearest.distance) {
      nearest = { name: area.name, distance };
    }
  }

  return nearest?.name ?? null;
}

function nearestRegionName(
  regions: RegionMetadata[],
  latitude: number,
  longitude: number,
): string | null {
  let nearest: { name: string; distance: number } | null = null;

  for (const region of regions) {
    const lat = Number(region.labelLocation?.latitude);
    const lon = Number(region.labelLocation?.longitude);
    if (!region.name || Number.isNaN(lat) || Number.isNaN(lon)) continue;

    const distance = (lat - latitude) ** 2 + (lon - longitude) ** 2;
    if (!nearest || distance < nearest.distance) {
      nearest = { name: region.name, distance };
    }
  }

  return nearest?.name ?? null;
}

function nearestStation(
  stations: WeatherStation[],
  latitude: number,
  longitude: number,
  valueByStation: Map<string, number>,
): { id: string; distance: number } | null {
  let nearest: { id: string; distance: number } | null = null;

  for (const station of stations) {
    const lat = Number(station.location?.latitude);
    const lon = Number(station.location?.longitude);
    if (
      !station.id ||
      Number.isNaN(lat) ||
      Number.isNaN(lon) ||
      !valueByStation.has(station.id)
    )
      continue;

    const distance = (lat - latitude) ** 2 + (lon - longitude) ** 2;
    if (!nearest || distance < nearest.distance) {
      nearest = { id: station.id, distance };
    }
  }

  return nearest;
}

function latestTimestamp(timestamps: Array<string | null>): string | null {
  return (
    timestamps
      .filter((timestamp): timestamp is string => Boolean(timestamp))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null
  );
}

function numberOrNull(value: number | string | undefined): number | null {
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function valueForRegion(
  values: Record<string, number | string> | undefined,
  region: string | null,
): number | null {
  if (!values || !region) return null;
  return numberOrNull(values[region]);
}

function defaultRegions(): RegionMetadata[] {
  return [
    { name: 'west', labelLocation: { latitude: 1.35735, longitude: 103.7 } },
    { name: 'north', labelLocation: { latitude: 1.41803, longitude: 103.82 } },
    {
      name: 'central',
      labelLocation: { latitude: 1.35735, longitude: 103.82 },
    },
    { name: 'south', labelLocation: { latitude: 1.29587, longitude: 103.82 } },
    { name: 'east', labelLocation: { latitude: 1.35735, longitude: 103.94 } },
  ];
}
