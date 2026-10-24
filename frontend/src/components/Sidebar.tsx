import { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { SearchIcon } from './icons';
import { SidebarCard } from './SidebarCard';
import { AddLocationForm } from './AddLocationForm';

export function Sidebar() {
  const { locations, isLoading } = useStore();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((location) => {
      const area = location.weather.area?.toLowerCase() ?? '';
      const condition = location.weather.condition?.toLowerCase() ?? '';
      return area.includes(q) || condition.includes(q);
    });
  }, [locations, query]);

  return (
    <aside className="flex w-full shrink-0 flex-col gap-3 border-b border-white/5 bg-black/20 p-4 pt-[4.5rem] backdrop-blur-2xl lg:w-[22rem] lg:border-b-0 lg:border-r lg:pt-4">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="w-full rounded-lg border border-white/10 bg-white/[0.08] py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/50"
        />
      </div>

      <AddLocationForm />

      <div className="flex flex-col gap-2 overflow-y-auto pr-1">
        {isLoading && locations.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-white/70">
            Loading locations…
          </p>
        ) : filtered.length === 0 && locations.length > 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center text-sm text-white/60">
            No matches
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-6 text-center text-sm text-white/60">
            No locations yet. Add one above.
          </p>
        ) : (
          filtered.map((location) => (
            <SidebarCard
              key={location.id}
              location={location}
              isHome={location.id === locations[0].id}
            />
          ))
        )}
      </div>
    </aside>
  );
}
