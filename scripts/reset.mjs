import { rm } from 'node:fs/promises';

await rm(new URL('../backend/data/weather.json', import.meta.url), { force: true });
console.log('Removed backend/data/weather.json');
