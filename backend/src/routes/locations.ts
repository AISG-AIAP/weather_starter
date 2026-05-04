import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { createLocation, getLocation, listLocations, updateWeather } from '../db.js';
import { SingaporeWeatherClient, WeatherProviderError } from '../weather.js';

export const locationsRouter: Router = createRouter();

locationsRouter.get('/locations', async (_request, response, next) => {
  try {
    response.json({ locations: await listLocations() });
  } catch (error) {
    next(error);
  }
});

locationsRouter.post('/locations', async (request, response, next) => {
  try {
    const latitude = Number(request.body?.latitude);
    const longitude = Number(request.body?.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      response.status(422).json({ detail: 'latitude and longitude are required' });
      return;
    }
    if (!(1.1 <= latitude && latitude <= 1.5 && 103.6 <= longitude && longitude <= 104.1)) {
      response.status(422).json({
        detail: 'Coordinates must be within Singapore (lat 1.1-1.5, lon 103.6-104.1)',
      });
      return;
    }

    const location = await createLocation(latitude, longitude);
    response.status(201).json(location);
  } catch (error) {
    if (error instanceof Error && error.name === 'DuplicateLocationError') {
      response.status(409).json({ detail: error.message });
      return;
    }
    next(error);
  }
});

locationsRouter.get('/locations/:locationId', async (request, response, next) => {
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

locationsRouter.post('/locations/:locationId/refresh', async (request, response, next) => {
  try {
    const locationId = Number(request.params.locationId);
    const location = await getLocation(locationId);
    if (!location) {
      response.status(404).json({ detail: 'Location not found' });
      return;
    }

    const client = new SingaporeWeatherClient({ apiKey: process.env.WEATHER_API_KEY });
    const snapshot = await client.getCurrentWeather(location.latitude, location.longitude);
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
