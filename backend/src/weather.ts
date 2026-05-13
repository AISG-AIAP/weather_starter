export class WeatherProviderError extends Error {}

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

export class SingaporeWeatherClient {
  constructor(
    private readonly options: {
      baseUrl?: string;
      apiKey?: string;
      timeoutMs?: number;
      userAgent?: string;
    } = {},
  ) {}

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherSnapshot> {
    const settle = async <T>(promise: Promise<T>) => {
      try {
        const value = await promise;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { status: 'fulfilled' as const, value };
      } catch (reason) {
        return { status: 'rejected' as const, reason };
      }
    };

    const forecastPayload = await settle(this.fetchLatestForecastPayload());
    const airTemp = await settle(this.fetchNearestReading('air-temperature', latitude, longitude));
    const relativeHumidity = await settle(this.fetchNearestReading('relative-humidity', latitude, longitude));
    const rainfall = await settle(this.fetchNearestReading('rainfall', latitude, longitude));
    const windSpeed = await settle(this.fetchNearestReading('wind-speed', latitude, longitude));
    const windDirection = await settle(this.fetchNearestReading('wind-direction', latitude, longitude));
    const uvIndex = await settle(this.fetchUvIndex());
    const airQuality = await settle(this.fetchAirQuality(latitude, longitude));
    const twentyFourHour = await settle(this.fetchTwentyFourHourForecast(latitude, longitude));
    const fourDay = await settle(this.fetchFourDayForecast());

    const snapshot =
      forecastPayload.status === 'fulfilled'
        ? this.snapshotFromPayload(forecastPayload.value, latitude, longitude)
        : this.emptyForecastSnapshot();

    const timestamps: (string | null)[] = [snapshot.observed_at];

    if (airTemp.status === 'fulfilled') {
      snapshot.temperature_c = airTemp.value.value;
      timestamps.push(airTemp.value.timestamp);
    }
    if (relativeHumidity.status === 'fulfilled') {
      snapshot.humidity_percent = relativeHumidity.value.value;
      timestamps.push(relativeHumidity.value.timestamp);
    }
    if (rainfall.status === 'fulfilled') {
      snapshot.rainfall_mm = rainfall.value.value;
      timestamps.push(rainfall.value.timestamp);
    }
    if (windSpeed.status === 'fulfilled') {
      snapshot.wind_speed_knots = windSpeed.value.value;
      timestamps.push(windSpeed.value.timestamp);
    }
    if (windDirection.status === 'fulfilled') {
      snapshot.wind_direction_degrees = windDirection.value.value;
      timestamps.push(windDirection.value.timestamp);
    }
    if (uvIndex.status === 'fulfilled') {
      snapshot.uv_index = uvIndex.value.value;
      timestamps.push(uvIndex.value.timestamp);
    }
    if (airQuality.status === 'fulfilled') {
      snapshot.psi_twenty_four_hourly = airQuality.value.psi;
      snapshot.pm25_one_hourly = airQuality.value.pm25;
      snapshot.air_quality_region = airQuality.value.region;
      timestamps.push(airQuality.value.timestamp);
    }
    if (twentyFourHour.status === 'fulfilled') {
      snapshot.forecast_low_c = twentyFourHour.value.low;
      snapshot.forecast_high_c = twentyFourHour.value.high;
      snapshot.forecast_periods = twentyFourHour.value.periods;
      timestamps.push(twentyFourHour.value.timestamp);
    }
    if (fourDay.status === 'fulfilled') {
      snapshot.daily_forecast = fourDay.value.days;
      timestamps.push(fourDay.value.timestamp);
    }

    const latest = latestTimestamp(timestamps);
    if (latest) {
      snapshot.observed_at = latest;
    }

    return snapshot;
  }

  async fetchLatestForecastPayload(): Promise<ForecastPayload> {
    return this.fetchJson(`${this.apiBaseUrl()}/v2/real-time/api/two-hr-forecast`);
  }

  async fetchNearestReading(
    endpoint:
      | 'air-temperature'
      | 'relative-humidity'
      | 'rainfall'
      | 'wind-speed'
      | 'wind-direction',
    latitude: number,
    longitude: number,
  ): Promise<{ value: number | null; timestamp: string | null }> {
    const payload = await this.fetchReadingPayload(endpoint);
    if (payload.code !== undefined && payload.code !== 0) {
      throw new WeatherProviderError(
        payload.errorMsg ?? `Weather provider returned an error for ${endpoint}`,
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
        .filter((entry): entry is [string, number] => Boolean(entry[0]) && !Number.isNaN(entry[1])),
    );
    const station = nearestStation(stations, latitude, longitude, valueByStation);
    return {
      value: station ? (valueByStation.get(station.id) ?? null) : null,
      timestamp: latestReading?.timestamp ?? null,
    };
  }

  async fetchReadingPayload(endpoint: string): Promise<ReadingPayload> {
    return this.fetchJson(`${this.apiBaseUrl()}/v2/real-time/api/${endpoint}`);
  }

  async fetchUvIndex(): Promise<{ value: number | null; timestamp: string | null }> {
    const payload = await this.fetchJson<UvPayload>(`${this.apiBaseUrl()}/v2/real-time/api/uv`);
    if (payload.code !== undefined && payload.code !== 0) {
      throw new WeatherProviderError(
        payload.errorMsg ?? 'Weather provider returned an error for uv',
      );
    }

    const record = payload.data?.records?.[0];
    const latest = record?.index?.[0];
    return {
      value: numberOrNull(latest?.value),
      timestamp: record?.updatedTimestamp ?? latest?.hour ?? record?.timestamp ?? null,
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
    try {
      const psiPayload = await this.fetchJson<PsiPayload>(`${this.apiBaseUrl()}/v2/real-time/api/psi`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const pm25Payload = await this.fetchJson<PsiPayload>(`${this.apiBaseUrl()}/v2/real-time/api/pm25`);
      for (const payload of [psiPayload, pm25Payload]) {
        if (payload.code !== undefined && payload.code !== 0) {
          throw new WeatherProviderError(
            payload.errorMsg ?? 'Weather provider returned an air quality error',
          );
        }
      }

      const region = nearestRegionName(psiPayload.data?.regionMetadata ?? [], latitude, longitude);
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
    } catch (err) {
      throw err;
    }
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
    );
    if (payload.code !== undefined && payload.code !== 0) {
      throw new WeatherProviderError(
        payload.errorMsg ?? 'Weather provider returned a 24-hour forecast error',
      );
    }

    const record = payload.data?.records?.[0];
    const region = nearestRegionName(defaultRegions(), latitude, longitude) ?? 'central';
    return {
      low: numberOrNull(record?.general?.temperature?.low),
      high: numberOrNull(record?.general?.temperature?.high),
      periods: (record?.periods ?? [])
        .map((period) => ({
          label: period.timePeriod?.text ?? '',
          forecast: period.regions?.[region]?.text ?? period.regions?.central?.text ?? '',
        }))
        .filter((period) => period.label && period.forecast),
      timestamp: record?.updatedTimestamp ?? record?.timestamp ?? null,
    };
  }

  async fetchFourDayForecast(): Promise<{ days: DailyForecast[]; timestamp: string | null }> {
    const payload = await this.fetchJson<FourDayPayload>(
      `${this.legacyApiBaseUrl()}/v1/environment/4-day-weather-forecast`,
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

  private async fetchJson<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 8000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': this.options.userAgent ?? 'weather-starter/0.1 (educational project)',
          ...(this.options.apiKey ? { 'x-api-key': this.options.apiKey } : {}),
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new WeatherProviderError('Weather provider rate limit reached (HTTP 429)');
        }
        if (response.status === 401 || response.status === 403) {
          throw new WeatherProviderError('Weather provider rejected request (check API key)');
        }
        throw new WeatherProviderError(`Weather provider returned HTTP ${response.status}`);
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
  ): WeatherSnapshot {
    if (payload.code !== undefined && payload.code !== 0) {
      throw new WeatherProviderError(payload.errorMsg ?? 'Weather provider returned an error');
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
    }

    const fallback = forecasts[0];
    return {
      condition: fallback.forecast ?? 'Unknown',
      observed_at: latestItem.update_timestamp ?? latestItem.timestamp ?? '',
      source: 'api-open.data.gov.sg',
      area: fallback.area ?? null,
      valid_period_text: latestItem.valid_period?.text ?? null,
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
  }

  private emptyForecastSnapshot(): WeatherSnapshot {
    return {
      condition: 'Unavailable',
      observed_at: '',
      source: 'api-open.data.gov.sg',
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
    if (!station.id || Number.isNaN(lat) || Number.isNaN(lon) || !valueByStation.has(station.id))
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
    { name: 'central', labelLocation: { latitude: 1.35735, longitude: 103.82 } },
    { name: 'south', labelLocation: { latitude: 1.29587, longitude: 103.82 } },
    { name: 'east', labelLocation: { latitude: 1.35735, longitude: 103.94 } },
  ];
}
