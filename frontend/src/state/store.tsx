import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  listLocations,
  createLocation,
  deleteLocation,
  refreshLocation,
  resolveNearestArea,
  logInteraction,
} from '../api';
import { GeolocationFailure } from '../types';
import type { CreateLocationPayload, Location, ProviderProps, StoreValue } from '../types';

const StoreContext = createContext<StoreValue | null>(null);

// Mirrors the backend bounds in routes/locations.ts. This is a UX affordance so the user gets
// purpose-written copy instead of a raw 422 — the server still validates independently.
function isWithinSingapore(latitude: number, longitude: number): boolean {
  return 1.1 <= latitude && latitude <= 1.5 && 103.6 <= longitude && longitude <= 104.1;
}

function currentPosition(): Promise<GeolocationPosition> {
  // No secure context (e.g. served over a LAN IP rather than localhost) means no geolocation.
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(
      new GeolocationFailure(
        'Location is unavailable on this connection. Add coordinates manually below.',
        'unavailable',
      ),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        reject(
          error.code === error.PERMISSION_DENIED
            ? new GeolocationFailure(
                'Location access is blocked. Re-enable it for this site in your browser settings, or add coordinates manually below.',
                'denied',
              )
            : new GeolocationFailure(
                'Could not get your location. Add coordinates manually below.',
                'unavailable',
              ),
        );
      },
      // An explicit timeout matters: if the user ignores the permission prompt entirely,
      // neither callback ever fires and the button would spin forever.
      // High accuracy is pointless when the fix is snapped to a km-scale forecast area.
      { timeout: 10_000, maximumAge: 60_000, enableHighAccuracy: false },
    );
  });
}

export function StoreProvider({ children }: ProviderProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async (): Promise<Location[]> => {
    try {
      const data = await listLocations();
      setLocations(data.locations);
      setError(null);
      return data.locations;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load-on-mount syncs API → React state
    load().then((next) => {
      if (next.length > 0) setSelectedId((current) => current ?? next[0].id);
    });
  }, [load]);

  const effectiveSelectedId = (() => {
    if (locations.length === 0) return null;
    return locations.some((l) => l.id === selectedId) ? selectedId : locations[0].id;
  })();

  const create = useCallback(
    async (payload: CreateLocationPayload) => {
      setError(null);
      logInteraction('location_create_submitted', payload);
      try {
        const created = await createLocation(payload);
        const next = await load();
        const targetId = created?.id ?? next[next.length - 1]?.id;
        if (targetId) setSelectedId(targetId);
        setIsAdding(false);
        logInteraction('location_created', {
          locationId: targetId,
          latitude: created.latitude,
          longitude: created.longitude,
        });
      } catch (err) {
        setError(err);
        logInteraction('location_create_failed', {
          latitude: payload.latitude,
          longitude: payload.longitude,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
      }
    },
    [load],
  );

  const locate = useCallback(async () => {
    setIsLocating(true);
    logInteraction('location_locate_clicked');
    try {
      // Outcomes only — a raw fix never goes to the log endpoint.
      const position = await currentPosition();
      const { latitude, longitude } = position.coords;
      if (!isWithinSingapore(latitude, longitude)) {
        logInteraction('location_locate_failed', { reason: 'out-of-bounds' });
        throw new GeolocationFailure(
          'You appear to be outside Singapore — this app only covers Singapore forecast areas.',
          'out-of-bounds',
        );
      }

      // Snap to the forecast area's label point so repeat presses land on an identical
      // coordinate, which is what makes the existing duplicate check work.
      const area = await resolveNearestArea(latitude, longitude);
      logInteraction('location_locate_resolved', { area: area.area });

      const existing = locations.find(
        (l) => l.latitude === area.latitude && l.longitude === area.longitude,
      );
      if (existing) {
        setSelectedId(existing.id);
        return;
      }

      await create({ latitude: area.latitude, longitude: area.longitude });
    } catch (err) {
      if (err instanceof GeolocationFailure) {
        if (err.reason !== 'out-of-bounds') {
          logInteraction('location_locate_failed', { reason: err.reason });
        }
      } else {
        logInteraction('location_locate_failed', { reason: 'resolve-failed' });
      }
      throw err;
    } finally {
      setIsLocating(false);
    }
  }, [create, locations]);

  const refresh = useCallback(
    async (id: number) => {
      setRefreshingId(id);
      setError(null);
      logInteraction('location_refresh_clicked', { locationId: id });
      try {
        await refreshLocation(id);
        await load();
        logInteraction('location_refreshed', { locationId: id });
      } catch (err) {
        setError(err);
        logInteraction('location_refresh_failed', {
          locationId: id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        setRefreshingId(null);
      }
    },
    [load],
  );

  const remove = useCallback(
    async (id: number) => {
      setDeletingId(id);
      setError(null);
      logInteraction('location_delete_clicked', { locationId: id });
      try {
        await deleteLocation(id);
        const next = await load();
        setSelectedId((current) => (current === id ? (next[0]?.id ?? null) : current));
        logInteraction('location_deleted', { locationId: id });
      } catch (err) {
        setError(err);
        logInteraction('location_delete_failed', {
          locationId: id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
      } finally {
        setDeletingId(null);
      }
    },
    [load],
  );

  const value: StoreValue = {
    locations,
    selectedId: effectiveSelectedId,
    isAdding,
    isLoading,
    isLocating,
    refreshingId,
    deletingId,
    error,
    select: setSelectedId,
    setAdding: (nextIsAdding) => {
      setIsAdding(nextIsAdding);
      if (nextIsAdding) logInteraction('location_form_opened');
    },
    create,
    locate,
    remove,
    refresh,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export function useSelectedLocation(): Location | null {
  const { locations, selectedId } = useStore();
  return locations.find((l) => l.id === selectedId) ?? null;
}
