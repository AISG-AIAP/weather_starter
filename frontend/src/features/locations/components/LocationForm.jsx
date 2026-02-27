import { useState } from 'react';
import { useCreateLocation } from '../hooks/useLocations';

export function LocationForm() {
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const createLocation = useCreateLocation();

  const onSubmit = async (event) => {
    event.preventDefault();
    await createLocation.mutateAsync({
      name,
      latitude: Number(latitude),
      longitude: Number(longitude),
    });
    setName('');
    setLatitude('');
    setLongitude('');
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-lg bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Add Location</h2>
      <label className="grid gap-1">
        <span className="text-sm font-medium">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
          placeholder="Bishan"
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Latitude</span>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="1.3508"
            required
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Longitude</span>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="103.8390"
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={createLocation.isPending}
        className="rounded bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-700 disabled:opacity-60"
      >
        {createLocation.isPending ? 'Adding...' : 'Add Location'}
      </button>

      {createLocation.error && (
        <p className="text-sm text-red-600">{createLocation.error.message}</p>
      )}
    </form>
  );
}
