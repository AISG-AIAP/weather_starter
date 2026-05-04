const baseUrl = process.env.WEATHER_STARTER_URL ?? 'http://127.0.0.1:3000';

async function check(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }
  return response;
}

await check('/health');
await check('/api/locations');

console.log(`Weather Starter is healthy at ${baseUrl}`);
