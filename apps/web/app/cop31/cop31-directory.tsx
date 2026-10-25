'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { copy, dayNumber, eventContent, eventHref, eventPeriod, formatEventDate, formatLabel, isPast, localized, monthName } from './cop31-data';
import type { Cop31Event, Cop31Locale } from './cop31-types';
import { Cop31SiteHeader } from './cop31-site-header';
import { Cop31ConnectBand } from './cop31-connect-band';
import { Cop31SaveButton, Cop31SavedEventsProvider } from './cop31-saved-events';

type Phase = 'all' | 'before' | 'during' | 'after' | 'past';
const PAGE_SIZE = 24;

const dateInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)].filter(Boolean).join('-');
};

const dateFilterValue = (value: string) => {
  const match = /^(\d{2})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return '';
  const day = Number(match[1]), month = Number(match[2]), year = 2000 + Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return '';
  return `${year}-${match[2]}-${match[1]}`;
};

const readableDate = (value: string, locale: Cop31Locale) => new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));

function eventStatus(event: Cop31Event, locale: Cop31Locale) {
  const words = copy[locale];
  if (event.status === 'POSTPONED') return words.postponed;
  if (event.status === 'CANCELLED') return words.cancelled;
  if (isPast(event)) return words.past;
  return null;
}

export function EventCard({ event, locale, showUmbrella = true }: { event: Cop31Event; locale: Cop31Locale; showUmbrella?: boolean }) {
  const words = copy[locale];
  const status = eventStatus(event, locale);
  const content = eventContent(event, locale);
  const place = event.format === 'ONLINE' ? words.online : [content.city, content.country].filter(Boolean).join(', ') || content.venueName || words.inPerson;
  return <article className={`cop31-event-card${event.status === 'CANCELLED' ? ' is-cancelled' : ''}`}>
    <time className="cop31-date-badge" dateTime={event.startsAt}><strong>{dayNumber(event, locale)}</strong><span>{monthName(event, locale)}</span></time>
    <div className="cop31-card-main">
      <div className="cop31-card-meta"><span>{formatEventDate(event, locale)}</span><span aria-hidden="true">·</span><span>{formatLabel(event.format, locale)}</span><span aria-hidden="true">·</span><span>{place}</span></div>
      <h2><Link href={eventHref(event, locale)}>{localized(event, 'title', locale)}</Link></h2>
      <p>{localized(event, 'summary', locale)}</p>
      {(content.eventTypeStandard || content.officialStatus || content.copStatus || (showUmbrella && content.umbrellaTitle) || content.speakers?.length) && <div className="cop31-card-hierarchy">
        {content.eventTypeStandard && <span className="cop31-program-type">{content.eventTypeStandard}</span>}
        {(content.officialStatus || content.copStatus) && <span className="cop31-status-line">{[content.officialStatus, content.copStatus].filter(Boolean).join(' · ')}</span>}
        {showUmbrella && content.umbrellaTitle && <span className="cop31-umbrella-line">{locale === 'tr' ? 'Şemsiye' : 'Programme'}: {content.umbrellaUrl ? <a href={content.umbrellaUrl} target="_blank" rel="noopener noreferrer">{content.umbrellaTitle} ↗</a> : <b>{content.umbrellaTitle}</b>}</span>}
        {content.speakers && content.speakers.length > 0 && <span className="cop31-speaker-line"><b>{locale === 'tr' ? 'Konuşmacılar' : 'Speakers'}:</b> {content.speakers.join(' · ')}</span>}
      </div>}
      <div className="cop31-card-tags"><span className="cop31-connection-tag">{content.cop31Connection}</span>{content.topics.map(topic => <span key={topic}>{topic}</span>)}</div>
      {content.organizers.length > 0 && <p className="cop31-organizer-line"><span>{words.organizers}</span>{content.organizers.join(' · ')}</p>}
    </div>
    <div className="cop31-card-action">
      <Cop31SaveButton slug={event.slug} locale={locale} compact />
      {status && <span className={`cop31-status ${event.status.toLowerCase()}`}>{status}</span>}
      <Link href={eventHref(event, locale)}>{words.details}<span aria-hidden="true">→</span></Link>
    </div>
  </article>;
}

function Cop31DirectoryContent({ events, locale }: { events: Cop31Event[]; locale: Cop31Locale }) {
  const words = copy[locale];
  const [phase, setPhase] = useState<Phase>('all');
  const [query, setQuery] = useState('');
  const [umbrella, setUmbrella] = useState('');
  const [eventType, setEventType] = useState('');
  const [copArea, setCopArea] = useState('');
  const [date, setDate] = useState('');
  const [dateEntry, setDateEntry] = useState('');
  const [format, setFormat] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pagination, setPagination] = useState({ key: '', count: PAGE_SIZE });
  const umbrellas = useMemo(() => [...new Set(events.map(event => eventContent(event, locale).umbrellaTitle?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, locale === 'tr' ? 'tr' : 'en')), [events, locale]);
  const eventTypes = useMemo(() => [...new Set(events.map(event => eventContent(event, locale).eventTypeStandard?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, locale === 'tr' ? 'tr' : 'en')), [events, locale]);
  const copAreas = useMemo(() => [...new Set(events.map(event => eventContent(event, locale).copStatus?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, locale === 'tr' ? 'tr' : 'en')), [events, locale]);
  const formats = useMemo(() => [...new Set(events.map(event => event.format))], [events]);
  const shown = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US');
    return events.filter(event => {
      const content = eventContent(event, locale);
      if (event.status === 'CANCELLED') return false;
      if (phase === 'past' ? !isPast(event) : isPast(event) || (phase !== 'all' && eventPeriod(event) !== phase)) return false;
      if (umbrella && content.umbrellaTitle !== umbrella) return false;
      if (eventType && content.eventTypeStandard !== eventType) return false;
      if (copArea && content.copStatus !== copArea) return false;
      if (date) {
        const eventDate = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: event.timezone }).formatToParts(new Date(event.startsAt)).reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {});
        if (`${eventDate.year}-${eventDate.month}-${eventDate.day}` !== date) return false;
      }
      if (format && event.format !== format) return false;
      if (!needle) return true;
      const searchable = [localized(event, 'title', locale), localized(event, 'summary', locale), content.organizers.join(' '), content.city, content.country, content.topics.join(' '), content.umbrellaTitle, content.speakers?.join(' ')].filter(Boolean).join(' ').toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US');
      return searchable.includes(needle);
    }).sort((a, b) => phase === 'past' ? new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime() : new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [copArea, date, eventType, events, format, locale, phase, query, umbrella]);
  const filterKey = JSON.stringify([phase, query, umbrella, eventType, copArea, date, format]);
  const visibleCount = pagination.key === filterKey ? pagination.count : PAGE_SIZE;
  const featured = shown.filter(event => event.featured && !isPast(event)).slice(0, 6);
  const featuredIds = new Set(featured.map(event => event.id));
  const regular = shown.filter(event => !featuredIds.has(event.id));
  const visibleRegular = regular.slice(0, visibleCount);
  const displayedCount = featured.length + visibleRegular.length;
  const umbrellaTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const event of shown) {
      const title = eventContent(event, locale).umbrellaTitle;
      if (title) totals.set(title, (totals.get(title) ?? 0) + 1);
    }
    return totals;
  }, [locale, shown]);
  const eventGroups = useMemo(() => {
    const groups: Array<{ key: string; title?: string; url?: string | null; events: Cop31Event[] }> = [];
    for (let pageStart = 0; pageStart < visibleRegular.length; pageStart += PAGE_SIZE) {
      const grouped = new Map<string, { title: string; url?: string | null; events: Cop31Event[] }>();
      for (const event of visibleRegular.slice(pageStart, pageStart + PAGE_SIZE)) {
        const content = eventContent(event, locale);
        if (!content.umbrellaTitle) { groups.push({ key: event.id, events: [event] }); continue; }
        const key = content.umbrellaTitle;
        let group = grouped.get(key);
        if (!group) {
          group = { title: content.umbrellaTitle, url: content.umbrellaUrl, events: [] };
          grouped.set(key, group);
          groups.push({ key: `${pageStart}-${key}`, ...group });
        }
        group.events.push(event);
      }
    }
    return groups;
  }, [locale, visibleRegular]);
  const clearFilters = () => { setUmbrella(''); setEventType(''); setCopArea(''); setDate(''); setDateEntry(''); setFormat(''); };
  const showAll = () => { clearFilters(); setQuery(''); setPhase('all'); setFiltersOpen(false); };
  const activeFilterCount = [umbrella, eventType, copArea, date, format].filter(Boolean).length;
  const updateDate = (value: string) => { const formatted = dateInput(value); setDateEntry(formatted); setDate(dateFilterValue(formatted)); };

  return <main className="cop31-page cop31-radar-page">
    <Cop31SiteHeader locale={locale}/>

    <section className="cop31-hero cop31-radar-hero" aria-labelledby="cop31-title">
      <div className="cop31-hero-inner">
        <div className="cop31-hero-copy"><p className="cop31-eyebrow">COP31 / {locale === 'tr' ? 'ETKİNLİKLER' : 'EVENTS'}</p><h1 id="cop31-title">COP31<br/><em>{locale === 'tr' ? 'etkinlikleri.' : 'events.'}</em></h1>
        <div className="cop31-search"><span aria-hidden="true">⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder={words.search} aria-label={words.search}/>{query && <button type="button" onClick={() => setQuery('')} aria-label={locale === 'tr' ? 'Aramayı temizle' : 'Clear search'}>×</button>}</div>
        </div>
        <div className="cop31-radar-graphic" aria-hidden="true">
          <div className="cop31-radar-orbit"/>
          <div className="cop31-radar-poster"><span>ANTALYA / 2026</span><strong>COP<br/>31</strong><i/></div>
          <div className="cop31-radar-signal"><span>EVENTISE × COP31RADAR</span><b>EVENT<br/>RADAR</b><i/><small>9—20 NOV</small></div>
        </div>
      </div>
    </section>

    <nav className="cop31-phase-tabs" aria-label={locale === 'tr' ? 'Etkinlik dönemi' : 'Event period'}>
      {(['all', 'before', 'during', 'after', 'past'] as Phase[]).map(item => <button key={item} type="button" className={phase === item ? 'active' : ''} aria-pressed={phase === item} onClick={() => setPhase(item)}>
        {item === 'all' ? (locale === 'tr' ? 'Yaklaşanlar' : 'Upcoming') : item === 'before' ? (locale === 'tr' ? 'COP öncesi' : 'Before COP') : item === 'during' ? (locale === 'tr' ? 'COP sırasında' : 'During COP') : item === 'after' ? (locale === 'tr' ? 'COP sonrası' : 'After COP') : (locale === 'tr' ? 'Geçmiş' : 'Past')}
      </button>)}
    </nav>
    <section className="cop31-directory" aria-label="COP31 event directory">
      <button type="button" className="cop31-mobile-filter-toggle" onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen} aria-controls="cop31-filters"><span>{words.filters}</span>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}<i aria-hidden="true">⌄</i></button>
      <aside className={`cop31-filters${filtersOpen ? ' is-open' : ''}`} id="cop31-filters">
        <div className="cop31-filter-title"><h2>{words.filters}</h2>{activeFilterCount > 0 && <button type="button" onClick={clearFilters}>{words.clearFilters}</button>}</div>
        {umbrellas.length > 0 && <label>{locale === 'tr' ? 'Şemsiye programı' : 'Umbrella programme'}<select value={umbrella} onChange={event => setUmbrella(event.target.value)}><option value="">{locale === 'tr' ? 'Tüm programlar' : 'All programmes'}</option>{umbrellas.map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
        {eventTypes.length > 0 && <label>{locale === 'tr' ? 'Etkinlik türü' : 'Event type'}<select value={eventType} onChange={event => setEventType(event.target.value)}><option value="">{locale === 'tr' ? 'Tüm etkinlik türleri' : 'All event types'}</option>{eventTypes.map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
        {copAreas.length > 0 && <label>{locale === 'tr' ? 'COP alanı / konumu' : 'COP area / location'}<select value={copArea} onChange={event => setCopArea(event.target.value)}><option value="">{locale === 'tr' ? 'Tüm COP alanları' : 'All COP areas'}</option>{copAreas.map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
        <label>{locale === 'tr' ? 'Tarih (GG-AA-YY)' : 'Date (DD-MM-YY)'}<input value={dateEntry} inputMode="numeric" maxLength={8} placeholder={locale === 'tr' ? 'GG-AA-YY' : 'DD-MM-YY'} onChange={event => updateDate(event.target.value)} />{date && <small className="cop31-filter-date-label">{readableDate(date, locale)}</small>}</label>
        {formats.length > 0 && <label>{words.format}<select value={format} onChange={event => setFormat(event.target.value)}><option value="">{words.allFormats}</option>{formats.map(value => <option key={value} value={value}>{formatLabel(value, locale)}</option>)}</select></label>}
        <div className="cop31-filter-note"><span aria-hidden="true">i</span><p>{locale === 'tr' ? 'Etkinlik bilgileri açık kaynaklardan ve doğrudan paylaşılan duyurulardan derlenir.' : 'Event information is curated from public sources and directly shared announcements.'}</p></div>
      </aside>
      <div className="cop31-results">
        <div className="cop31-results-heading"><p>{shown.length} {words.results}{shown.length > displayedCount ? ` · ${displayedCount} ${locale === 'tr' ? 'gösteriliyor' : 'shown'}` : ''}</p></div>
        {featured.length > 0 && <section className="cop31-featured"><div className="cop31-section-label"><span>{words.featured}</span><i /></div>{featured.map(event => <EventCard event={event} locale={locale} key={event.id}/>)}</section>}
        {shown.length > 0 ? <div className="cop31-event-list">{eventGroups.map(group => group.title ? <section className="cop31-umbrella-group" key={group.key}>
          <header><div><p>{locale === 'tr' ? 'ŞEMSİYE PROGRAM' : 'UMBRELLA PROGRAMME'} · {umbrellaTotals.get(group.title) ?? group.events.length} {locale === 'tr' ? 'alt etkinlik' : 'sessions'}</p><h2>{group.url ? <a href={group.url} target="_blank" rel="noopener noreferrer">{group.title} ↗</a> : group.title}</h2></div></header>
          <div className="cop31-umbrella-sessions">{group.events.map(event => <EventCard event={event} locale={locale} showUmbrella={false} key={event.id}/>)}</div>
        </section> : <EventCard event={group.events[0]} locale={locale} key={group.key}/>)}</div> : <div className="cop31-empty"><span aria-hidden="true">⌁</span><h2>{words.emptyTitle}</h2><p>{words.emptyBody}</p><button type="button" onClick={showAll}>{locale === 'tr' ? 'Tüm etkinlikleri göster' : 'Show all events'} →</button></div>}
        {shown.length > displayedCount && <div className="cop31-load-more"><button type="button" onClick={() => setPagination({ key: filterKey, count: visibleCount + PAGE_SIZE })}>{locale === 'tr' ? 'Daha fazla göster' : 'Show more'} <span aria-hidden="true">↓</span></button></div>}
      </div>
    </section>
    <Cop31ConnectBand locale={locale}/>
    <footer className="cop31-footer"><span>Eventise işbirliği ile COP31Radar.com için geliştirilmiştir.</span></footer>
  </main>;
}

export function Cop31Directory({ events, locale }: { events: Cop31Event[]; locale: Cop31Locale }) {
  return <Cop31SavedEventsProvider><Cop31DirectoryContent events={events} locale={locale}/></Cop31SavedEventsProvider>;
}
