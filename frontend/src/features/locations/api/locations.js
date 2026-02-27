import { request } from '../../../lib/api';

export async function listLocations() {
  return request('/locations');
}

export async function createLocation(payload) {
  return request('/locations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function refreshLocation(locationId) {
  return request(`/locations/${locationId}/refresh`, {
    method: 'POST',
  });
}
