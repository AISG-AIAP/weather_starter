import type { ReactElement } from 'react';
import type { ConditionCategory } from '../conditionCategory';
import { CloudCheckIcon, CloudIcon, CloudLightningIcon, CloudRainCheckIcon, CloudSnowIcon } from '../icons';

export function conditionIcon(category: ConditionCategory, className: string): ReactElement {
  switch (category) {
    case 'thunderstorm':
      return <CloudLightningIcon className={`${className} text-yellow-300`} />;
    case 'rain':
      return <CloudRainCheckIcon className={`${className} text-blue-300`} />;
    case 'snow':
      return <CloudSnowIcon className={`${className} text-cyan-200`} />;
    case 'clear':
      return <CloudCheckIcon className={`${className} text-yellow-400`} />;
    default:
      return <CloudIcon className={`${className} text-white/80`} />;
  }
}
