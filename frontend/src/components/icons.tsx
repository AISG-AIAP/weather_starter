import type { SVGProps } from 'react';

interface IconProps {
  className?: string;
}

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} satisfies SVGProps<SVGSVGElement>;

export function CloudIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 18h10a4 4 0 0 0 .8-7.92A6 6 0 0 0 6.1 11.4 3.5 3.5 0 0 0 7 18Z" />
    </svg>
  );
}

export function SunIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  );
}

export function HomeIcon({ className = 'h-3 w-3' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

export function LocationIcon({ className = 'h-3 w-3' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 2 4 6l4 4 4 12 4-12 4-4Z" />
    </svg>
  );
}

export function PlusIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SearchIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function RefreshIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 4v4h-4M21 12a9 9 0 0 1-15.5 6.3L3 16M3 20v-4h4" />
    </svg>
  );
}

export function MoonIcon({ className = 'h-12 w-12' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="12" cy="12" r="10" opacity="0.85" />
      <circle cx="9" cy="9" r="1.2" fill="rgba(0,0,0,0.18)" />
      <circle cx="14" cy="11" r="1.6" fill="rgba(0,0,0,0.18)" />
      <circle cx="11" cy="15" r="1" fill="rgba(0,0,0,0.18)" />
      <circle cx="16" cy="15" r="0.8" fill="rgba(0,0,0,0.18)" />
    </svg>
  );
}

export function CalendarIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </svg>
  );
}

export function WindIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h9" />
    </svg>
  );
}

export function DropletIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z" />
    </svg>
  );
}

export function EyeIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function GaugeIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 16a8 8 0 1 1 16 0" />
      <path d="M12 16l4-5" />
    </svg>
  );
}

export function ThermometerIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M14 14V5a2 2 0 1 0-4 0v9a4 4 0 1 0 4 0Z" />
    </svg>
  );
}

export function TrendIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 17 9 11l4 4 8-8M14 7h7v7" />
    </svg>
  );
}

export function CloseIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function CloudRainIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 18h10a4 4 0 0 0 .8-7.92A6 6 0 0 0 6.1 11.4 3.5 3.5 0 0 0 7 18Z" />
      <path d="M9 22v-5m3 5v-5m3 5v-5" />
    </svg>
  );
}

export function CloudWindIcon({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 18h10a4 4 0 0 0 .8-7.92A6 6 0 0 0 6.1 11.4 3.5 3.5 0 0 0 7 18Z" />
      <path d="M4 10h10m-5 4h8" />
    </svg>
  );
}

export function TrashIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0l-1.5 14a2 2 0 0 1-2 1.5H7.5a2 2 0 0 1-2-1.5L4 6M10 11v4M14 11v4" />
    </svg>
  );
}

export function CloudCheckIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M8 13l3 3 5-5M7 18h10a4 4 0 0 0 .8-7.92A6 6 0 0 0 6.1 11.4 3.5 3.5 0 0 0 7 18Z" />
    </svg>
  );
}

export function CloudLightningIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M13 10V3L8 12h4v7l5-9h-4ZM7 18h10a4 4 0 0 0 .8-7.92A6 6 0 0 0 6.1 11.4 3.5 3.5 0 0 0 7 18Z" />
    </svg>
  );
}

export function CloudRainCheckIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 18h10a4 4 0 0 0 .8-7.92A6 6 0 0 0 6.1 11.4 3.5 3.5 0 0 0 7 18Z" />
      <path d="M9 22v-5m3 5v-5" />
    </svg>
  );
}

export function CloudSnowIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M9 11l2-2m0 4l-2-2m2 2l2 2m-2-2l-2-2" />
      <path d="M15 11l2-2m0 4l-2-2m2 2l2 2m-2-2l-2-2" />
      <path d="M7 18h10a4 4 0 0 0 .8-7.92A6 6 0 0 0 6.1 11.4 3.5 3.5 0 0 0 7 18Z" />
    </svg>
  );
}
