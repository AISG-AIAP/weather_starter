import { Sidebar } from './Sidebar';
import { Hero } from './Hero';
import { ThemeSelector } from './ThemeSelector';

export function Layout() {
  return (
    <div className="relative flex min-h-screen w-full flex-col lg:h-full lg:flex-row">
      <ThemeSelector />
      <Sidebar />
      <Hero />
    </div>
  );
}
