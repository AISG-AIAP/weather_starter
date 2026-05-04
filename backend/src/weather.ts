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

export interface WeatherSnapshot {
  condition: string;
  observed_at: string;
  source: string;
  area: string | null;
  valid_period_text: string | null;
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
    const payload = await this.fetchLatestForecastPayload();
    return this.snapshotFromPayload(payload, latitude, longitude);
  }

  async fetchLatestForecastPayload(): Promise<ForecastPayload> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 8000);
    const url = `${this.options.baseUrl ?? 'https://api-open.data.gov.sg'}/v2/real-time/api/two-hr-forecast`;

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

      return (await response.json()) as ForecastPayload;
    } catch (error) {
      if (error instanceof WeatherProviderError) throw error;
      throw new WeatherProviderError('Unable to reach weather provider');
    } finally {
      clearTimeout(timeout);
    }
  }

  snapshotFromPayload(payload: ForecastPayload, latitude: number, longitude: number): WeatherSnapshot {
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
      };
    }

    const fallback = forecasts[0];
    return {
      condition: fallback.forecast ?? 'Unknown',
      observed_at: latestItem.update_timestamp ?? latestItem.timestamp ?? '',
      source: 'api-open.data.gov.sg',
      area: fallback.area ?? null,
      valid_period_text: latestItem.valid_period?.text ?? null,
    };
  }
}

function nearestAreaName(areaMetadata: AreaMetadata[], latitude: number, longitude: number): string | null {
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
