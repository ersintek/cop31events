import type { Cop31Locale } from './cop31-types';

export const standardEventType = (value?: string | null): string => {
  if (!value) return '';
  if (['Brazil Pavilion session', 'Pavilion session', 'UN Climate Change Pavilion session', 'Virtual Pavilion session', 'Pavilion event'].includes(value)) return 'Pavilion event';
  if (value === 'Global Climate Action session') return 'COP programme session';
  if (value === 'Leaders Summit') return 'Summit';
  return value;
};

const labels: Record<string, Record<Cop31Locale, string>> = {
  'Official Side Event': { tr: 'Resmî yan etkinlik', en: 'Official side event' },
  'Pavilion event': { tr: 'Pavyon etkinliği', en: 'Pavilion event' },
  'COP programme session': { tr: 'COP program oturumu', en: 'COP programme session' },
  Summit: { tr: 'Zirve', en: 'Summit' },
  Webinar: { tr: 'Webinar', en: 'Webinar' },
};

export const eventTypeLabel = (value: string, locale: Cop31Locale) => labels[standardEventType(value)]?.[locale] ?? value;
