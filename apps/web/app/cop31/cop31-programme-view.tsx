'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Cop31ConnectBand } from './cop31-connect-band';
import { directoryHref, eventContent, eventHref, eventLocalDate, formatLabel, isPast } from './cop31-data';
import { dateLabel } from './cop31-date-filter';
import { Cop31SaveButton, Cop31SavedEventsProvider } from './cop31-saved-events';
import { Cop31SiteHeader } from './cop31-site-header';
import type { Cop31Programme } from './cop31-programmes';
import type { Cop31Event, Cop31Locale } from './cop31-types';

function programmeGroups(events: Cop31Event[], descendingDays = false) {
  const groups = new Map<string, Cop31Event[]>();
  for (const event of events) {
    const day = eventLocalDate(event);
    const group = groups.get(day) ?? [];
    group.push(event);
    groups.set(day, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => descendingDays ? b.localeCompare(a) : a.localeCompare(b))
    .map(([day, dayEvents]) => ({ day, events: dayEvents.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()) }));
}

function takeWholeDays(events: Cop31Event[], limit: number, descendingDays = false) {
  const visible: Cop31Event[] = [];
  for (const group of programmeGroups(events, descendingDays)) {
    if (visible.length >= limit) break;
    visible.push(...group.events);
  }
  return visible;
}

function ProgrammeRows({ events, locale, past = false }: { events: Cop31Event[]; locale: Cop31Locale; past?: boolean }) {
  const time = (event: Cop31Event) => {
    if (event.timeKnown === false) return locale === 'tr' ? 'Saat açıklanmadı' : 'Time not announced';
    const formatter = new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: event.timezone, hourCycle: 'h23' });
    return `${formatter.format(new Date(event.startsAt))}${event.endsAt ? `–${formatter.format(new Date(event.endsAt))}` : ''}`;
  };
  return <div className="cop31-programme-days">{programmeGroups(events, past).map(group => <section className="cop31-programme-day" key={group.day}>
    <h3><time dateTime={group.day}>{dateLabel(group.day, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</time></h3>
    <div className="cop31-programme-rows">{group.events.map(event => {
      const content = eventContent(event, locale);
      return <article className="cop31-programme-row" key={event.id}>
        <time className="cop31-programme-row-time" dateTime={event.startsAt}>{time(event)}</time>
        <div className="cop31-programme-row-content"><h4><Link href={eventHref(event, locale)}>{content.title}</Link></h4><p>{[content.venueName || [content.city, content.country].filter(Boolean).join(', '), formatLabel(event.format, locale)].filter(Boolean).join(' · ')}</p></div>
        <Cop31SaveButton slug={event.slug} locale={locale} compact />
      </article>;
    })}</div>
  </section>)}</div>;
}

export function Cop31ProgrammeView({ programme, events, locale }: { programme: Cop31Programme; events: Cop31Event[]; locale: Cop31Locale }) {
  const [upcomingLimit, setUpcomingLimit] = useState(24);
  const [pastLimit, setPastLimit] = useState(24);
  const [dayFilterOpen, setDayFilterOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const sorted = useMemo(() => [...events].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()), [events]);
  const upcoming = sorted.filter(event => !isPast(event));
  const past = sorted.filter(isPast).reverse();
  const availableDays = [...new Set(upcoming.map(eventLocalDate))].sort();
  const filteredUpcoming = selectedDays.length ? upcoming.filter(event => selectedDays.includes(eventLocalDate(event))) : upcoming;
  const visibleUpcoming = takeWholeDays(filteredUpcoming, upcomingLimit);
  const visiblePast = takeWholeDays(past, pastLimit, true);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const dateRange = first ? `${dateLabel(eventLocalDate(first), locale)}${last && eventLocalDate(last) !== eventLocalDate(first) ? ` – ${dateLabel(eventLocalDate(last), locale)}` : ''}` : '';
  const selectDay = (day: string) => { setUpcomingLimit(24); setSelectedDays(current => current.includes(day) ? current.filter(value => value !== day) : [...current, day].sort()); };

  return <main className="cop31-page cop31-radar-page cop31-programme-page">
    <Cop31SiteHeader locale={locale}/>
    <div className="cop31-programme-shell">
      <Link className="cop31-programme-back" href={directoryHref(locale)}>← {locale === 'tr' ? 'Etkinliklere dön' : 'Back to events'}</Link>
      <header className="cop31-programme-hero"><p>{locale === 'tr' ? 'COP31 / ŞEMSİYE PROGRAM' : 'COP31 / UMBRELLA PROGRAMME'}</p><h1>{programme.title[locale]}</h1><span>{locale === 'tr' ? `${events.length} bağlı etkinlik` : `${events.length} linked events`}</span></header>
      <section className="cop31-programme-facts" aria-label={locale === 'tr' ? 'Program bilgileri' : 'Programme information'}>
        <div><small>{locale === 'tr' ? 'Düzenleyen' : 'Organiser'}</small><strong>{programme.organiser[locale]}</strong></div><div><small>{locale === 'tr' ? 'Alan' : 'Area'}</small><strong>{programme.area[locale]}</strong></div><div><small>{locale === 'tr' ? 'Tarih aralığı' : 'Date range'}</small><strong>{dateRange || '—'}</strong></div>
      </section>
      <section className="cop31-programme-source-card"><p>{locale === 'tr' ? 'Güncel saat ve katılım bilgilerini düzenleyicinin programından kontrol edin.' : 'Check the organiser’s programme for current times and participation details.'}</p><a href={programme.sourceUrl} target="_blank" rel="noopener noreferrer">{locale === 'tr' ? 'Düzenleyicinin programına git' : 'Visit the organiser’s programme'} <span aria-hidden="true">↗</span></a></section>
      <Cop31SavedEventsProvider>
        {events.length === 0 && <section className="cop31-programme-empty"><span aria-hidden="true">↗</span><div><h2>{locale === 'tr' ? 'Etkinlikler hazırlanıyor' : 'Events are being prepared'}</h2><p>{locale === 'tr' ? 'Bu programın doğrulanmış etkinlikleri Eventise listesine bağlandığında burada görünecek.' : 'Verified events from this programme will appear here when they are added to the Eventise directory.'}</p></div></section>}
        {upcoming.length > 0 && <section className="cop31-programme-events">
          <button type="button" className="cop31-programme-day-toggle" aria-expanded={dayFilterOpen} aria-controls="cop31-programme-day-options" onClick={() => setDayFilterOpen(open => !open)}><span>{locale === 'tr' ? 'Yaklaşan etkinlikler' : 'Upcoming events'} <b>{filteredUpcoming.length}</b></span><span className="cop31-programme-day-toggle-hint">{selectedDays.length ? (locale === 'tr' ? `${selectedDays.length} gün seçildi` : `${selectedDays.length} dates selected`) : (locale === 'tr' ? 'Günleri seç' : 'Choose dates')} <i aria-hidden="true">{dayFilterOpen ? '−' : '+'}</i></span></button>
          <div id="cop31-programme-day-options" className="cop31-programme-day-options" hidden={!dayFilterOpen} role="group" aria-label={locale === 'tr' ? 'Etkinlik günleri' : 'Event dates'}>
            <button type="button" className={!selectedDays.length ? 'active' : ''} aria-pressed={!selectedDays.length} onClick={() => { setSelectedDays([]); setUpcomingLimit(24); }}>{!selectedDays.length && <span aria-hidden="true">✓ </span>}{locale === 'tr' ? 'Hepsi' : 'All'}</button>
            {availableDays.map(day => <button type="button" key={day} className={selectedDays.includes(day) ? 'active' : ''} aria-pressed={selectedDays.includes(day)} onClick={() => selectDay(day)}>{selectedDays.includes(day) && <span aria-hidden="true">✓ </span>}{dateLabel(day, locale, { day: 'numeric', month: 'short', year: 'numeric' })}</button>)}
          </div>
          <ProgrammeRows events={visibleUpcoming} locale={locale}/>
          {visibleUpcoming.length < filteredUpcoming.length && <button className="cop31-programme-more" type="button" onClick={() => setUpcomingLimit(visibleUpcoming.length + 24)}>{locale === 'tr' ? 'Daha fazla göster' : 'Show more'} ↓</button>}
        </section>}
        {past.length > 0 && <section className="cop31-programme-events"><h2>{locale === 'tr' ? 'Geçmiş etkinlikler' : 'Past events'} <span>{past.length}</span></h2><ProgrammeRows events={visiblePast} locale={locale} past/>{visiblePast.length < past.length && <button className="cop31-programme-more" type="button" onClick={() => setPastLimit(visiblePast.length + 24)}>{locale === 'tr' ? 'Daha fazla göster' : 'Show more'} ↓</button>}</section>}
      </Cop31SavedEventsProvider>
    </div>
    <Cop31ConnectBand locale={locale}/>
    <footer className="cop31-footer"><span>Eventise işbirliği ile COP31Radar.com için geliştirilmiştir.</span></footer>
  </main>;
}
