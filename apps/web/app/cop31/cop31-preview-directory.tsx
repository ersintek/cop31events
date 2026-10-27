'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { copy, eventContent, eventHref, eventPeriod, formatEventDate, isPast, localized } from './cop31-data';
import type { Cop31Event, Cop31Locale } from './cop31-types';
import { Cop31SiteHeader } from './cop31-site-header';
import { Cop31ConnectBand } from './cop31-connect-band';
import { Cop31SaveButton, Cop31SavedEventsProvider } from './cop31-saved-events';
import { cop31OfficialProgrammeSlugs, cop31Programmes, cop31RelatedProgrammeSlugs } from './cop31-programmes';
import { getProgrammeForEvent } from './cop31-programmes';
import { EventCard } from './cop31-directory';

type Phase = 'all' | 'before' | 'during' | 'after' | 'past';
type Category = 'home' | 'place' | 'programme' | 'topic';
type ProgrammeChoice = { type: 'all' } | { type: 'group'; group: string } | { type: 'programme'; slug: string };
const groupLabels = (locale: Cop31Locale) => locale === 'tr'
  ? ['UNFCCC Resmî Programı', 'COP31 Pavyonları ve Programları', 'Diğer İklim Etkinlikleri']
  : ['UNFCCC Official Programme', 'COP31 Pavilions and Programmes', 'Other Climate Events'];
const normalize = (value: string, locale: Cop31Locale) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US').replace(/ı/g, 'i');

function PreviewContent({ events, locale }: { events: Cop31Event[]; locale: Cop31Locale }) {
  const tr = locale === 'tr';
  const words = copy[locale];
  const [phase, setPhase] = useState<Phase>('all');
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [programme, setProgramme] = useState<ProgrammeChoice>({ type: 'all' });
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>('home');
  const [programmeQuery, setProgrammeQuery] = useState('');
  const [expandedGroup, setExpandedGroup] = useState('');
  const [draftPlaces, setDraftPlaces] = useState<string[]>([]);
  const [draftTopics, setDraftTopics] = useState<string[]>([]);
  const [draftProgramme, setDraftProgramme] = useState<ProgrammeChoice>({ type: 'all' });

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const official = cop31OfficialProgrammeSlugs.map(slug => cop31Programmes.find(p => p.slug === slug)).filter((p): p is (typeof cop31Programmes)[number] => Boolean(p));
  const pavilionSlugs = new Set<string>(cop31RelatedProgrammeSlugs);
  const officialSlugs = new Set<string>(cop31OfficialProgrammeSlugs);
  const knownOther = cop31Programmes.filter(p => !pavilionSlugs.has(p.slug) && !officialSlugs.has(p.slug));
  const knownTitles = new Set(cop31Programmes.flatMap(p => [normalize(p.title.tr, locale), normalize(p.title.en, locale)]));
  const discoveredOther = [...new Set(events.map(event => eventContent(event, locale).umbrellaTitle?.trim()).filter((title): title is string => Boolean(title)))].filter(title => !knownTitles.has(normalize(title, locale))).map((title, index) => ({ slug: `other-umbrella-${index}`, title: { tr: title, en: title }, organiser: { tr: '', en: '' }, area: { tr: '', en: '' }, sourceUrl: '', sourcePrefix: '' }));
  const other = [...knownOther, ...discoveredOther].sort((a, b) => a.title[locale].localeCompare(b.title[locale], locale === 'tr' ? 'tr' : 'en'));
  const allTopics = useMemo(() => [...new Set(events.flatMap(event => eventContent(event, locale).topics))].sort((a, b) => a.localeCompare(b, locale === 'tr' ? 'tr' : 'en')), [events, locale]);
  const groups = [official, cop31RelatedProgrammeSlugs.map(slug => cop31Programmes.find(p => p.slug === slug)).filter((p): p is (typeof cop31Programmes)[number] => Boolean(p)), other];
  const groupNames = groupLabels(locale);
  const allProgrammes = groups.flat();
  const displayedGroupIndex = (slug: string) => officialSlugs.has(slug) ? 0 : pavilionSlugs.has(slug) ? 1 : 2;
  const choiceLabel = (choice: ProgrammeChoice) => choice.type === 'all' ? (tr ? 'Tüm programlar' : 'All programmes') : choice.type === 'group' ? choice.group : allProgrammes.find(p => p.slug === choice.slug)?.title[locale] ?? choice.slug;
  const selectedPlaces = open ? draftPlaces : places;
  const selectedTopics = open ? draftTopics : topics;
  const selectedProgramme = open ? draftProgramme : programme;
  const toggle = (array: string[], value: string, setter: (value: string[]) => void) => setter(array.includes(value) ? array.filter(item => item !== value) : [...array, value]);
  const beginOpen = () => { setDraftPlaces(places); setDraftTopics(topics); setDraftProgramme(programme); setCategory('home'); setProgrammeQuery(''); setOpen(true); };
  const clearDraft = () => { setDraftPlaces([]); setDraftTopics([]); setDraftProgramme({ type: 'all' }); };
  const activeCount = places.length + topics.length + (programme.type === 'all' ? 0 : 1);
  const results = useMemo(() => events.filter(event => {
    if (event.status !== 'PUBLISHED' && event.status !== 'POSTPONED') return false;
    if (phase === 'past' ? !isPast(event) : isPast(event) || (phase !== 'all' && eventPeriod(event) !== phase)) return false;
    const content = eventContent(event, locale);
    const needle = normalize(query.trim(), locale);
    if (needle && !normalize([localized(event, 'title', locale), localized(event, 'summary', locale), content.organizers.join(' '), content.city ?? '', content.country ?? '', content.topics.join(' '), content.umbrellaTitle ?? '', content.speakers?.join(' ') ?? ''].join(' '), locale).includes(needle)) return false;
    const eventProgrammeSlug = content.programmeSlug ?? event.contentTr.programmeSlug ?? event.contentEn.programmeSlug ?? getProgrammeForEvent(event)?.slug;
    if (programme.type === 'programme') {
      if (programme.slug.startsWith('other-umbrella-')) {
        const selectedTitle = allProgrammes.find(item => item.slug === programme.slug)?.title[locale];
        if (content.umbrellaTitle !== selectedTitle) return false;
      } else if (eventProgrammeSlug !== programme.slug) return false;
    }
    if (programme.type === 'group') {
      const slug = eventProgrammeSlug;
      const p = slug ? cop31Programmes.find(item => item.slug === slug) : undefined;
      if (p ? groupNames[displayedGroupIndex(p.slug)] !== programme.group : !(programme.group === groupNames[2] && content.umbrellaTitle && !knownTitles.has(normalize(content.umbrellaTitle, locale)))) return false;
    }
    if (topics.length && !topics.some(topic => content.topics.includes(topic))) return false;
    if (places.length && !places.some(place => {
      const placeText = normalize([content.copStatus ?? '', content.venueName ?? '', content.venueAddress ?? '', content.city ?? '', content.country ?? ''].join(' '), locale);
      if (place === 'online') return event.format === 'ONLINE' || event.format === 'HYBRID';
      if (place === 'blue') return /blue zone|mavi bolge/.test(placeText);
      if (place === 'green') return /green zone|yesil bolge/.test(placeText);
      return /antalya/.test(placeText) || (!/blue zone|mavi bolge|green zone|yesil bolge/.test(placeText) && event.format !== 'ONLINE');
    })) return false;
    return true;
  }).sort((a, b) => phase === 'past' ? +new Date(b.startsAt) - +new Date(a.startsAt) : +new Date(a.startsAt) - +new Date(b.startsAt)), [allProgrammes, events, knownTitles, locale, phase, query, programme, topics, places]);

  const filterCount = () => <>{activeCount > 0 && <b>{activeCount}</b>}</>;
  const categoryTitle: Record<Exclude<Category, 'home'>, string> = { place: tr ? 'Yer / Katılım' : 'Location / Attendance', programme: tr ? 'Program / Pavyon' : 'Programme / Pavilion', topic: tr ? 'Konu' : 'Topic' };
  const placeOptions = [
    ['blue', tr ? 'Blue Zone' : 'Blue Zone'], ['green', tr ? 'Green Zone' : 'Green Zone'], ['antalya', tr ? 'Antalya / diğer alanlar' : 'Antalya / other areas'], ['online', tr ? 'Çevrim içi' : 'Online'],
  ];
  const programmeMatches = programmeQuery.trim() ? allProgrammes.filter(p => normalize(p.title[locale], locale).includes(normalize(programmeQuery, locale))) : [];

  return <main className="cop31-page cop31-radar-page cop31-preview-page">
    <Cop31SiteHeader locale={locale}/>
    <section className="cop31-hero cop31-radar-hero" aria-labelledby="cop31-title"><div className="cop31-hero-inner"><div className="cop31-hero-copy"><p className="cop31-eyebrow">COP31 / {tr ? 'ETKİNLİKLER' : 'EVENTS'}</p><h1 id="cop31-title">COP31<br/><em>{tr ? 'etkinlikleri.' : 'events.'}</em></h1><div className="cop31-search"><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={words.search} aria-label={words.search}/>{query && <button type="button" onClick={() => setQuery('')} aria-label={tr ? 'Aramayı temizle' : 'Clear search'}>×</button>}</div></div><div className="cop31-radar-graphic" aria-hidden="true"><div className="cop31-radar-orbit"/><div className="cop31-radar-poster"><span>ANTALYA / 2026</span><strong>COP<br/>31</strong><i/></div><div className="cop31-radar-signal"><span>EVENTISE × COP31RADAR</span><b>EVENT<br/>RADAR</b><i/><small>9—20 NOV</small></div></div></div></section>
    <nav className="cop31-phase-tabs" aria-label={tr ? 'Etkinlik dönemi' : 'Event period'}>{(['all','before','during','after','past'] as Phase[]).map(item => <button key={item} type="button" className={phase === item ? 'active' : ''} aria-pressed={phase === item} onClick={() => setPhase(item)}>{item === 'all' ? (tr ? 'Yaklaşanlar' : 'Upcoming') : item === 'before' ? (tr ? 'COP öncesi' : 'Before COP') : item === 'during' ? (tr ? 'COP sırasında' : 'During COP') : item === 'after' ? (tr ? 'COP sonrası' : 'After COP') : (tr ? 'Geçmiş' : 'Past')}</button>)}</nav>
    <section className="cop31-directory cop31-preview-directory" aria-label={tr ? 'COP31 etkinlik dizini' : 'COP31 event directory'}>
      <aside className="cop31-preview-sidebar">{events.filter(event => event.featured && !isPast(event) && event.status !== 'CANCELLED').slice(0, 4).length > 0 && <section><h2>{tr ? 'Öne çıkan etkinlikler' : 'Featured events'}</h2>{events.filter(event => event.featured && !isPast(event) && event.status !== 'CANCELLED').slice(0, 4).map(event => <article key={event.id}><Link href={eventHref(event, locale)}>{localized(event, 'title', locale)}</Link><time dateTime={event.startsAt}>{formatEventDate(event, locale, false)}</time></article>)}</section>}</aside>
      <div className="cop31-results"><div className="cop31-results-heading"><p>{results.length} {words.results}</p><button className="cop31-preview-filter-button" type="button" onClick={beginOpen}>{tr ? 'Filtrele' : 'Filter'}{filterCount()} <span aria-hidden="true">☷</span></button></div>
        {(places.length || topics.length || programme.type !== 'all') ? <div className="cop31-preview-chips">{programme.type !== 'all' && <button onClick={() => setProgramme({ type: 'all' })}>{choiceLabel(programme)} ×</button>}{places.map(value => <button key={value} onClick={() => setPlaces(places.filter(item => item !== value))}>{placeOptions.find(item => item[0] === value)?.[1]} ×</button>)}{topics.map(value => <button key={value} onClick={() => setTopics(topics.filter(item => item !== value))}>{value} ×</button>)}<button className="clear" onClick={() => { setPlaces([]); setTopics([]); setProgramme({ type: 'all' }); }}>{tr ? 'Temizle' : 'Clear'}</button></div> : null}
        {results.length ? <div className="cop31-event-list">{results.map(event => <EventCard event={event} locale={locale} key={event.id}/>)}</div> : <div className="cop31-empty"><h2>{tr ? 'Bu filtrelerle etkinlik bulunamadı' : 'No events found with these filters'}</h2><p>{words.emptyBody}</p><button type="button" onClick={() => { setPlaces([]); setTopics([]); setProgramme({ type: 'all' }); setQuery(''); }}>{tr ? 'Filtreleri temizle' : 'Clear filters'}</button></div>}
      </div>
    </section>
    <Cop31ConnectBand locale={locale}/><footer className="cop31-footer"><span>Eventise işbirliği ile COP31Radar.com için geliştirilmiştir.</span></footer>
    {open && <div className="cop31-preview-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}><section className="cop31-preview-drawer" role="dialog" aria-modal="true" aria-labelledby="preview-drawer-title"><header><button type="button" onClick={() => category === 'home' ? setOpen(false) : setCategory('home')} aria-label={tr ? 'Geri' : 'Back'}>{category === 'home' ? '×' : '←'}</button><h2 id="preview-drawer-title">{category === 'home' ? (tr ? 'Filtrele' : 'Filter') : categoryTitle[category]}</h2><button className="text" type="button" onClick={clearDraft}>{tr ? 'Temizle' : 'Clear'}</button></header>
      <div className="cop31-preview-drawer-body">{category === 'home' ? <div className="cop31-preview-categories">{(['place','programme','topic'] as const).map(key => <button key={key} onClick={() => setCategory(key)}><span><b>{categoryTitle[key]}</b><small>{key === 'place' ? (draftPlaces.length ? placeOptions.filter(item => draftPlaces.includes(item[0])).map(item => item[1]).join(', ') : tr ? 'Tümü' : 'All') : key === 'topic' ? (draftTopics.length ? draftTopics.join(', ') : tr ? 'Tümü' : 'All') : choiceLabel(draftProgramme)}</small></span><i>›</i></button>)}</div> : category === 'place' ? <fieldset><legend>{categoryTitle.place}</legend>{placeOptions.map(([value, label]) => <label key={value}><input type="checkbox" checked={draftPlaces.includes(value)} onChange={() => toggle(draftPlaces, value, setDraftPlaces)}/>{label}</label>)}</fieldset> : category === 'topic' ? <fieldset><legend>{categoryTitle.topic}</legend>{allTopics.map(topic => <label key={topic}><input type="checkbox" checked={draftTopics.includes(topic)} onChange={() => toggle(draftTopics, topic, setDraftTopics)}/>{topic}</label>)}</fieldset> : <div className="cop31-preview-programmes"><input className="search" value={programmeQuery} onChange={e => setProgrammeQuery(e.target.value)} placeholder={tr ? 'Program veya pavyon ara...' : 'Search programmes or pavilions...'} aria-label={tr ? 'Program ara' : 'Search programmes'}/>{programmeQuery ? <div className="matches">{programmeMatches.map(item => <button key={item.slug} className={draftProgramme.type === 'programme' && draftProgramme.slug === item.slug ? 'selected' : ''} onClick={() => setDraftProgramme({ type: 'programme', slug: item.slug })}>{item.title[locale]}<span>◯</span></button>)}{programmeMatches.length === 0 && <p>{tr ? 'Bu adla program bulunamadı.' : 'No programmes found.'}</p>}</div> : <><button className="all-programmes" onClick={() => setDraftProgramme({ type: 'all' })}>{tr ? 'Tüm programlar' : 'All programmes'} <span>◯</span></button>{groups.map((group, index) => <section key={groupNames[index]}><button className="group-heading" onClick={() => setExpandedGroup(expandedGroup === groupNames[index] ? '' : groupNames[index])}>{groupNames[index]}<span>{expandedGroup === groupNames[index] ? '⌃' : '⌄'}</span></button>{expandedGroup === groupNames[index] && <div className="programme-items"><button onClick={() => setDraftProgramme({ type: 'group', group: groupNames[index] })}>{tr ? 'Bu gruptaki tüm etkinlikler' : 'All events in this group'} <span>◯</span></button>{group.map(item => <button key={item.slug} onClick={() => setDraftProgramme({ type: 'programme', slug: item.slug })}>{item.title[locale]} <span>◯</span></button>)}</div>}</section>)}</>}</div> }</div>
      <footer><button type="button" onClick={() => { setPlaces(draftPlaces); setTopics(draftTopics); setProgramme(draftProgramme); setOpen(false); }}>{tr ? 'Etkinlikleri göster' : 'Show events'}</button></footer></section></div>}
  </main>;
}

export function Cop31PreviewDirectory({ events, locale }: { events: Cop31Event[]; locale: Cop31Locale }) {
  return <Cop31SavedEventsProvider><PreviewContent events={events} locale={locale}/></Cop31SavedEventsProvider>;
}

