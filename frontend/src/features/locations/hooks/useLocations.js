import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLocation, listLocations, refreshLocation } from '../api/locations';

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: listLocations,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useRefreshLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
