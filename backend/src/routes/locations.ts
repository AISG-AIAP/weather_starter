import type { Router } from 'express';
import { Router as createRouter } from 'express';
import {
  createLocation,
  deleteLocation,
  getLocation,
  listLocations,
  updateWeather,
} from '../db.js';
import {
  SingaporeWeatherClient,
  WeatherProviderError,
  type NearestArea,
  type WeatherSnapshot,
} from '../weather.js';
import { logger } from '../logger.js';

export interface WeatherClient {
  getCurrentWeather(latitude: number, longitude: number): Promise<WeatherSnapshot>;
  findNearestArea(latitude: number, longitude: number): Promise<NearestArea | null>;
}

const SINGAPORE_BOUNDS_DETAIL =
  'Coordinates must be within Singapore (lat 1.1-1.5, lon 103.6-104.1)';

function isWithinSingapore(latitude: number, longitude: number): boolean {
  return 1.1 <= latitude && latitude <= 1.5 && 103.6 <= longitude && longitude <= 104.1;
}

interface LocationsRouterOptions {
  weatherClient?: WeatherClient;
}

export function createLocationsRouter(options: LocationsRouterOptions = {}): Router {
  const router: Router = createRouter();
  const weatherClient =
    options.weatherClient ?? new SingaporeWeatherClient({ apiKey: process.env.WEATHER_API_KEY });

  router.get('/areas/nearest', async (request, response, next) => {
    try {
      const latitude = Number(request.query.lat);
      const longitude = Number(request.query.lon);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        response.status(422).json({ detail: 'lat and lon are required' });
        return;
      }
      if (!isWithinSingapore(latitude, longitude)) {
        response.status(422).json({ detail: SINGAPORE_BOUNDS_DETAIL });
        return;
      }

      const area = await weatherClient.findNearestArea(latitude, longitude);
      if (!area) {
        response.status(502).json({ detail: 'No forecast areas available' });
        return;
      }

      response.json(area);
    } catch (error) {
      if (error instanceof WeatherProviderError) {
        response.status(502).json({ detail: error.message });
        return;
      }
      next(error);
    }
  });

  router.get('/locations', async (_request, response, next) => {
    try {
      response.json({ locations: await listLocations() });
    } catch (error) {
      next(error);
    }
  });

  router.post('/locations', async (request, response, next) => {
    try {
      const latitude = Number(request.body?.latitude);
      const longitude = Number(request.body?.longitude);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        response.status(422).json({ detail: 'latitude and longitude are required' });
        return;
      }
      if (!isWithinSingapore(latitude, longitude)) {
        response.status(422).json({ detail: SINGAPORE_BOUNDS_DETAIL });
        return;
      }

      const location = await createLocation(latitude, longitude);

      try {
        const snapshot = await weatherClient.getCurrentWeather(
          location.latitude,
          location.longitude,
        );
        const updated = await updateWeather(location.id, snapshot);
        response.status(201).json(updated ?? location);
      } catch (error) {
        if (!(error instanceof WeatherProviderError)) throw error;
        logger.warn(
          { err: error, locationId: location.id },
          'weather refresh failed after location create',
        );
        response.status(201).json(location);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'DuplicateLocationError') {
        logger.warn({ err: error }, 'duplicate location rejected');
        response.status(409).json({ detail: error.message });
        return;
      }
      next(error);
    }
  });

  router.get('/locations/:locationId', async (request, response, next) => {
    try {
      const location = await getLocation(Number(request.params.locationId));
      if (!location) {
        response.status(404).json({ detail: 'Location not found' });
        return;
      }
      response.json(location);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/locations/:locationId', async (request, response, next) => {
    try {
      const deleted = await deleteLocation(Number(request.params.locationId));
      if (!deleted) {
        response.status(404).json({ detail: 'Location not found' });
        return;
      }
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.post('/locations/:locationId/refresh', async (request, response, next) => {
    try {
      const locationId = Number(request.params.locationId);
      const location = await getLocation(locationId);
      if (!location) {
        response.status(404).json({ detail: 'Location not found' });
        return;
      }

      const snapshot = await weatherClient.getCurrentWeather(location.latitude, location.longitude);
      const updated = await updateWeather(locationId, snapshot);
      response.json(updated);
    } catch (error) {
      if (error instanceof WeatherProviderError) {
        response.status(502).json({ detail: error.message });
        return;
      }
      next(error);
    }
  });

  return router;
}
