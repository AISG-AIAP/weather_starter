import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface WeatherSnapshot {
  condition: string | null;
  observed_at: string | null;
  source: string | null;
  area: string | null;
  valid_period_text: string | null;
}

export interface LocationRecord {
  id: number;
  latitude: number;
  longitude: number;
  created_at: string;
  weather: WeatherSnapshot;
}

interface StoreData {
  nextId: number;
  locations: LocationRecord[];
}

const defaultStore: StoreData = {
  nextId: 1,
  locations: [],
};

const dataPath = process.env.DATA_PATH ?? join(process.cwd(), 'backend', 'data', 'weather.json');

async function readStore(): Promise<StoreData> {
  try {
    const raw = await readFile(dataPath, 'utf8');
    return JSON.parse(raw) as StoreData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return structuredClone(defaultStore);
    }
    throw error;
  }
}

async function writeStore(data: StoreData): Promise<void> {
  await mkdir(dirname(dataPath), { recursive: true });
  await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`);
}

export async function listLocations(): Promise<LocationRecord[]> {
  const data = await readStore();
  return [...data.locations].sort((a, b) => {
    const created = b.created_at.localeCompare(a.created_at);
    return created === 0 ? b.id - a.id : created;
  });
}

export async function createLocation(latitude: number, longitude: number): Promise<LocationRecord> {
  const data = await readStore();
  const duplicate = data.locations.some(
    (location) => location.latitude === latitude && location.longitude === longitude,
  );
  if (duplicate) {
    const error = new Error('Location already exists');
    error.name = 'DuplicateLocationError';
    throw error;
  }

  const location: LocationRecord = {
    id: data.nextId,
    latitude,
    longitude,
    created_at: new Date().toISOString().slice(0, 19),
    weather: {
      condition: 'Not refreshed',
      observed_at: null,
      source: 'not-refreshed',
      area: null,
      valid_period_text: null,
    },
  };

  data.nextId += 1;
  data.locations.push(location);
  await writeStore(data);
  return location;
}

export async function getLocation(id: number): Promise<LocationRecord | null> {
  const data = await readStore();
  return data.locations.find((location) => location.id === id) ?? null;
}

export async function updateWeather(id: number, weather: WeatherSnapshot): Promise<LocationRecord | null> {
  const data = await readStore();
  const index = data.locations.findIndex((location) => location.id === id);
  if (index === -1) return null;

  data.locations[index] = {
    ...data.locations[index],
    weather,
  };
  await writeStore(data);
  return data.locations[index];
}

export async function resetStore(): Promise<void> {
  await writeStore(structuredClone(defaultStore));
}
