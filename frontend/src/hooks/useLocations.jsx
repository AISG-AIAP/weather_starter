import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { listLocations, createLocation as apiCreateLocation, refreshLocation as apiRefreshLocation } from '../api/locations';

const LocationsContext = createContext(null);

export function LocationsProvider({ children }) {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const data = await listLocations();
      setLocations(data.locations);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <LocationsContext.Provider value={{ locations, isLoading, error, reload }}>
      {children}
    </LocationsContext.Provider>
  );
}

export function useLocations() {
  return useContext(LocationsContext);
}

export function useCreateLocation() {
  const { reload } = useContext(LocationsContext);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const create = async (payload) => {
    setIsPending(true);
    setError(null);
    try {
      await apiCreateLocation(payload);
      await reload();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { create, isPending, error };
}

export function useRefreshLocation() {
  const { reload } = useContext(LocationsContext);
  const [isPending, setIsPending] = useState(false);
  const [refreshingId, setRefreshingId] = useState(null);
  const [error, setError] = useState(null);

  const refresh = async (locationId) => {
    setIsPending(true);
    setRefreshingId(locationId);
    setError(null);
    try {
      await apiRefreshLocation(locationId);
      await reload();
    } catch (err) {
      setError(err);
    } finally {
      setIsPending(false);
      setRefreshingId(null);
    }
  };

  return { refresh, isPending, refreshingId, error };
}
