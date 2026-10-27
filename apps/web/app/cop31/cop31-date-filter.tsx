'use client';

import type { Cop31Locale } from './cop31-types';

export const dateLabel = (date: string, locale: Cop31Locale, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', { ...options, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));

export function Cop31DateFilter({ dates, onChange, locale }: { dates: string[]; onChange: (dates: string[]) => void; locale: Cop31Locale }) {
  return <div className="cop31-date-filter">
    <label>{locale === 'tr' ? 'Tarih seç' : 'Choose dates'}<input type="date" lang={locale} value="" onInput={event => { const value = event.currentTarget.value; if (value && !dates.includes(value)) onChange([...dates, value].sort()); }} onChange={() => {}} /></label>
    <small>{locale === 'tr' ? 'Birden fazla gün seçebilirsiniz.' : 'You can choose more than one date.'}</small>
    {dates.length > 0 && <div className="cop31-selected-dates" aria-label={locale === 'tr' ? 'Seçilen tarihler' : 'Selected dates'}>{dates.map(date => <button type="button" key={date} onClick={() => onChange(dates.filter(item => item !== date))} aria-label={`${dateLabel(date, locale)} ${locale === 'tr' ? 'seçimini kaldır' : 'remove selection'}`}>{dateLabel(date, locale, { day: 'numeric', month: 'short', year: 'numeric' })} <span aria-hidden="true">×</span></button>)}</div>}
  </div>;
}
