'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Cop31ConnectBand } from './cop31-connect-band';
import { directoryHref, isPast } from './cop31-data';
import { EventCard } from './cop31-directory';
import { Cop31SavedEventsProvider } from './cop31-saved-events';
import { Cop31SiteHeader } from './cop31-site-header';
import type { Cop31Programme } from './cop31-programmes';
import type { Cop31Event, Cop31Locale } from './cop31-types';

export function Cop31ProgrammeView({ programme, events, locale }: { programme: Cop31Programme; events: Cop31Event[]; locale: Cop31Locale }) {
  const [upcomingLimit, setUpcomingLimit] = useState(24);
  const [pastLimit, setPastLimit] = useState(24);
  const upcoming = events.filter(event => !isPast(event)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = events.filter(isPast).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const first = events[0];
  const last = events[events.length - 1];
  const date = (event: Cop31Event) => new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: event.timezone }).format(new Date(event.startsAt));
  const dateRange = first ? `${date(first)}${last && last.id !== first.id ? ` – ${date(last)}` : ''}` : '';

  return <main className="cop31-page cop31-radar-page cop31-programme-page">
    <Cop31SiteHeader locale={locale}/>
    <div className="cop31-programme-shell">
      <Link className="cop31-programme-back" href={directoryHref(locale)}>← {locale === 'tr' ? 'Etkinliklere dön' : 'Back to events'}</Link>
      <header className="cop31-programme-hero">
        <p>{locale === 'tr' ? 'COP31 / ŞEMSİYE PROGRAM' : 'COP31 / UMBRELLA PROGRAMME'}</p>
        <h1>{programme.title[locale]}</h1>
        <span>{locale === 'tr' ? `${events.length} bağlı etkinlik` : `${events.length} linked events`}</span>
      </header>
      <section className="cop31-programme-facts" aria-label={locale === 'tr' ? 'Program bilgileri' : 'Programme information'}>
        <div><small>{locale === 'tr' ? 'Düzenleyen' : 'Organiser'}</small><strong>{programme.organiser[locale]}</strong></div>
        <div><small>{locale === 'tr' ? 'Alan' : 'Area'}</small><strong>{programme.area[locale]}</strong></div>
        <div><small>{locale === 'tr' ? 'Tarih aralığı' : 'Date range'}</small><strong>{dateRange}</strong></div>
      </section>
      <section className="cop31-programme-source-card">
        <p>{locale === 'tr' ? 'Bu üst programla ilişkili COP31 etkinlikleri tek yerde. Saat, erişim ve kayıt koşulları değişebileceğinden düzenleyicinin güncel programını da kontrol edin.' : 'COP31 events associated with this programme are gathered here. Check the organiser’s current programme for the latest times, access and registration details.'}</p>
        <a href={programme.sourceUrl} target="_blank" rel="noopener noreferrer">{locale === 'tr' ? 'Düzenleyicinin programına git' : 'Visit the organiser’s programme'} <span aria-hidden="true">↗</span></a>
      </section>
      <Cop31SavedEventsProvider>
        {events.length === 0 && <section className="cop31-programme-empty"><span aria-hidden="true">↗</span><div><h2>{locale === 'tr' ? 'Etkinlikler hazırlanıyor' : 'Events are being prepared'}</h2><p>{locale === 'tr' ? 'Bu programın doğrulanmış etkinlikleri Eventise listesine bağlandığında burada görünecek.' : 'Verified events from this programme will appear here when they are added to the Eventise directory.'}</p></div></section>}
        {upcoming.length > 0 && <section className="cop31-programme-events"><h2>{locale === 'tr' ? 'Yaklaşan etkinlikler' : 'Upcoming events'} <span>{upcoming.length}</span></h2><div className="cop31-event-list">{upcoming.slice(0, upcomingLimit).map(event => <EventCard key={event.id} event={event} locale={locale} showUmbrella={false}/>)}</div>{upcomingLimit < upcoming.length && <button className="cop31-programme-more" type="button" onClick={() => setUpcomingLimit(limit => limit + 24)}>{locale === 'tr' ? 'Daha fazla göster' : 'Show more'} ↓</button>}</section>}
        {past.length > 0 && <section className="cop31-programme-events"><h2>{locale === 'tr' ? 'Geçmiş etkinlikler' : 'Past events'} <span>{past.length}</span></h2><div className="cop31-event-list">{past.slice(0, pastLimit).map(event => <EventCard key={event.id} event={event} locale={locale} showUmbrella={false}/>)}</div>{pastLimit < past.length && <button className="cop31-programme-more" type="button" onClick={() => setPastLimit(limit => limit + 24)}>{locale === 'tr' ? 'Daha fazla göster' : 'Show more'} ↓</button>}</section>}
      </Cop31SavedEventsProvider>
    </div>
    <Cop31ConnectBand locale={locale}/>
    <footer className="cop31-footer"><span>Eventise işbirliği ile COP31Radar.com için geliştirilmiştir.</span></footer>
  </main>;
}
