import { LocationsProvider } from './hooks/useLocations.jsx';
import { Dashboard } from './pages/Dashboard';

export function App() {
  return (
    <LocationsProvider>
      <Dashboard />
    </LocationsProvider>
  );
}
