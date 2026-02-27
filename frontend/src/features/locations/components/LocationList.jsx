import { useLocations, useRefreshLocation } from '../hooks/useLocations';

export function LocationList() {
  const { data, isLoading, error } = useLocations();
  const refreshLocation = useRefreshLocation();

  if (isLoading) return <p>Loading locations...</p>;
  if (error) return <p className="text-red-600">{error.message}</p>;

  const locations = data?.locations ?? [];

  if (locations.length === 0) {
    return <p className="rounded-lg bg-white p-4 text-slate-600 shadow-sm">No locations yet.</p>;
  }

  return (
    <div className="grid gap-3">
      {locations.map((location) => (
        <article key={location.id} className="rounded-lg bg-white p-4 shadow-sm">
          <header className="mb-3 flex items-baseline justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{location.name}</h3>
              <p className="text-xs text-slate-500">
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </p>
            </div>
            <p className="text-sm text-slate-500">
              Updated{' '}
              {location.weather.observed_at
                ? new Date(location.weather.observed_at).toLocaleTimeString()
                : 'Not refreshed'}
            </p>
          </header>

          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-slate-500">Condition</dt>
              <dd className="font-medium">{location.weather.condition}</dd>
            </div>
            {location.weather.area && (
              <div>
                <dt className="text-slate-500">Forecast Area</dt>
                <dd className="font-medium">{location.weather.area}</dd>
              </div>
            )}
            {location.weather.valid_period_text && (
              <div>
                <dt className="text-slate-500">Valid Period</dt>
                <dd className="font-medium">{location.weather.valid_period_text}</dd>
              </div>
            )}
          </dl>

          <p className="mt-2 text-xs text-slate-500">Source: {location.weather.source}</p>
          <div className="mt-3">
            <button
              onClick={() => refreshLocation.mutate(location.id)}
              disabled={refreshLocation.isPending}
              className="rounded bg-sky-500 px-3 py-1 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {refreshLocation.isPending && refreshLocation.variables === location.id
                ? 'Refreshing...'
                : 'Refresh'}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
