import Link from 'next/link';
import { Cop31Actions } from './cop31-actions';
import { copy, dayNumber, directoryHref, eventContent, eventPeriod, formatLabel, isPast, localized, monthName } from './cop31-data';
import type { Cop31Event, Cop31Locale } from './cop31-types';
import { Cop31SiteHeader } from './cop31-site-header';
import { Cop31ConnectBand } from './cop31-connect-band';
import { Cop31SaveButton, Cop31SavedEventsProvider } from './cop31-saved-events';
import { getProgrammeForEvent, programmeHref } from './cop31-programmes';
import { eventTypeLabel } from './cop31-event-types';

function DetailStatus({ event, locale }: { event: Cop31Event; locale: Cop31Locale }) {
  const words = copy[locale];
  if (event.status === 'POSTPONED') return <span className="cop31-status postponed">{words.postponed}</span>;
  if (event.status === 'CANCELLED') return <span className="cop31-status cancelled">{words.cancelled}</span>;
  if (isPast(event)) return <span className="cop31-status">{words.past}</span>;
  return null;
}

function fullEventDate(event: Cop31Event, locale: Cop31Locale) {
  const language = locale === 'tr' ? 'tr-TR' : 'en-GB';
  const date = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric', timeZone: event.timezone });
  const time = new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: event.timezone });
  const start = new Date(event.startsAt);
  if (event.timeKnown === false) {
    const endDate = event.endsAt ? date.format(new Date(event.endsAt)) : date.format(start);
    return `${date.format(start)}${endDate !== date.format(start) ? ` – ${endDate}` : ''} · ${locale === 'tr' ? 'Saat açıklanmadı' : 'Time not announced'}`;
  }
  if (!event.endsAt) return date.format(start) + ' · ' + time.format(start);
  const end = new Date(event.endsAt);
  if (date.format(start) === date.format(end)) return date.format(start) + ' · ' + time.format(start) + '–' + time.format(end);
  return date.format(start) + ' ' + time.format(start) + ' – ' + date.format(end) + ' ' + time.format(end);
}

function sourceHost(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

export function Cop31Detail({ event, locale }: { event: Cop31Event; locale: Cop31Locale }) {
  const words = copy[locale];
  const content = eventContent(event, locale);
  const programme = getProgrammeForEvent(event);
  const title = localized(event, 'title', locale);
  const summary = localized(event, 'summary', locale).trim();
  const description = localized(event, 'description', locale).trim();
  const longDescription = description && description !== summary ? description : '';
  const period = eventPeriod(event);
  const periodLabel = period === 'before' ? (locale === 'tr' ? 'COP öncesi' : 'Before COP') : period === 'during' ? (locale === 'tr' ? 'COP sırasında' : 'During COP') : (locale === 'tr' ? 'COP sonrası' : 'After COP');
  const cityAndCountry = [content.city, content.country].filter(Boolean).join(', ');
  const place = event.format === 'ONLINE' ? words.online : content.venueName || cityAndCountry || words.inPerson;
  const placeDetail = event.format === 'ONLINE' ? '' : [content.venueAddress, content.venueName ? cityAndCountry : ''].filter(Boolean).join(' · ');
  const canRegister = event.status !== 'CANCELLED' && event.status !== 'POSTPONED' && !isPast(event);
  const registrationUrl = canRegister ? content.registrationUrl : null;
  const informationUrl = content.informationUrl && content.informationUrl !== registrationUrl ? content.informationUrl : null;
  const hasEventDetails = Boolean(content.eventTypeStandard || content.officialStatus || content.copStatus || content.cop31Connection || content.organizers.length || content.speakers?.length || content.topics.length);

  return <main className="cop31-page cop31-radar-page cop31-detail-page">
    <Cop31SiteHeader locale={locale}/>

    <article className="cop31-detail-shell">
      <div className="cop31-detail-topline"><Link href={directoryHref(locale)}>← {words.back}</Link><DetailStatus event={event} locale={locale}/></div>

      <header className="cop31-detail-hero">
        <div className="cop31-detail-hero-copy">
          <p className="cop31-detail-kicker">COP31 / {periodLabel}</p>
          <h1>{title}</h1>
          {summary && <p className="cop31-detail-summary">{summary}</p>}
          {(content.eventTypeStandard || content.copStatus) && <div className="cop31-detail-hero-tags">{content.eventTypeStandard && <span>{eventTypeLabel(content.eventTypeStandard, locale)}</span>}{content.copStatus && <span>{content.copStatus}</span>}</div>}
        </div>
        <div className="cop31-detail-date-art" aria-hidden="true"><span>COP31RADAR / EVENT</span><strong>{dayNumber(event, locale)}</strong><b>{monthName(event, locale)}</b><small>{new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', { year: 'numeric', timeZone: event.timezone }).format(new Date(event.startsAt))}</small><i/></div>
      </header>

      <section className="cop31-detail-facts" aria-label={locale === 'tr' ? 'Etkinlik özeti' : 'Event overview'}>
        <div className="cop31-detail-fact"><span>{words.when}</span><strong>{fullEventDate(event, locale)}</strong>{event.timeKnown !== false && <small>{event.timezone}</small>}</div>
        <div className="cop31-detail-fact"><span>{words.where}</span><strong>{place}</strong>{placeDetail && <small>{placeDetail}</small>}<small>{formatLabel(event.format, locale)}</small></div>
        {content.languages.length > 0 && <div className="cop31-detail-fact"><span>{words.eventLanguage}</span><strong>{content.languages.join(' · ')}</strong></div>}
      </section>

      <div className="cop31-detail-layout">
        <div className="cop31-detail-content">
          {content.umbrellaTitle && <section className="cop31-detail-umbrella" aria-labelledby="cop31-umbrella-title"><p className="cop31-detail-section-label">{locale === 'tr' ? 'Bağlı olduğu şemsiye programı' : 'Umbrella programme'}</p><h2 id="cop31-umbrella-title">{programme ? <Link href={programmeHref(programme, locale)}>{content.umbrellaTitle} <span aria-hidden="true">→</span></Link> : content.umbrellaUrl ? <a href={content.umbrellaUrl} target="_blank" rel="noopener noreferrer">{content.umbrellaTitle} <span aria-hidden="true">↗</span></a> : content.umbrellaTitle}</h2></section>}

          {longDescription && <section className="cop31-detail-section" aria-labelledby="cop31-about-title"><h2 id="cop31-about-title">{words.about}</h2>{longDescription.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>}

          {hasEventDetails && <section className="cop31-detail-section cop31-detail-information" aria-labelledby="cop31-information-title"><h2 id="cop31-information-title">{locale === 'tr' ? 'Etkinlik bilgileri' : 'Event details'}</h2><dl className="cop31-detail-data-list">
            {content.eventTypeStandard && <div><dt>{locale === 'tr' ? 'Etkinlik türü' : 'Event type'}</dt><dd>{eventTypeLabel(content.eventTypeStandard, locale)}</dd></div>}
            {content.officialStatus && <div><dt>{locale === 'tr' ? 'Resmî durum' : 'Official status'}</dt><dd>{content.officialStatus}</dd></div>}
            {content.copStatus && <div><dt>{locale === 'tr' ? 'COP alanı / konumu' : 'COP area / location'}</dt><dd>{content.copStatus}</dd></div>}
            {content.cop31Connection && <div><dt>{words.cop31Connection}</dt><dd>{content.cop31Connection}</dd></div>}
            {content.organizers.length > 0 && <div><dt>{words.organizers}</dt><dd>{content.organizers.join(' · ')}{content.organizerUrl && <a className="cop31-detail-text-link" href={content.organizerUrl} target="_blank" rel="noopener noreferrer">{locale === 'tr' ? 'Düzenleyenin web sitesi' : 'Organizer website'} ↗</a>}</dd></div>}
            {content.speakers && content.speakers.length > 0 && <div><dt>{locale === 'tr' ? 'Konuşmacılar' : 'Speakers'}</dt><dd><ul className="cop31-detail-people">{content.speakers.map((speaker, index) => <li key={speaker + index}>{speaker}</li>)}</ul></dd></div>}
            {content.topics.length > 0 && <div><dt>{locale === 'tr' ? 'Konular' : 'Topics'}</dt><dd><ul className="cop31-detail-topics">{content.topics.map(topic => <li key={topic}>{topic}</li>)}</ul></dd></div>}
          </dl></section>}

          {(content.sourceUrl || event.verifiedAt) && <section className="cop31-detail-section cop31-detail-source" aria-labelledby="cop31-source-title"><h2 id="cop31-source-title">{locale === 'tr' ? 'Kaynak ve kontrol' : 'Source and verification'}</h2>{content.sourceUrl && <a className="cop31-detail-text-link" href={content.sourceUrl} target="_blank" rel="noopener noreferrer">{sourceHost(content.sourceUrl)} ↗</a>}{event.verifiedAt && <p>{words.updated}: {new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(event.verifiedAt))}</p>}</section>}
        </div>

        <aside className="cop31-attend-card" aria-labelledby="cop31-attend-title"><p className="cop31-detail-section-label">{words.access}</p><h2 id="cop31-attend-title">{locale === 'tr' ? 'Katılım ve bağlantılar' : 'Attendance and links'}</h2>
          {content.access && <p className="cop31-detail-access">{content.access}</p>}
          {registrationUrl && <a className="cop31-primary-link" href={registrationUrl} target="_blank" rel="noopener noreferrer">{words.register} <span aria-hidden="true">↗</span></a>}
          {informationUrl && <a className="cop31-detail-secondary-link" href={informationUrl} target="_blank" rel="noopener noreferrer">{words.information} <span aria-hidden="true">↗</span></a>}
          {!registrationUrl && !informationUrl && canRegister && <p className="cop31-no-registration">{words.noRegistration}</p>}
          {!registrationUrl && !informationUrl && content.sourceUrl && <a className="cop31-detail-secondary-link" href={content.sourceUrl} target="_blank" rel="noopener noreferrer">{locale === 'tr' ? 'Etkinlik kaynağı' : 'Event source'} <span aria-hidden="true">↗</span></a>}
          <Cop31Actions event={event} locale={locale}/>
          <Cop31SavedEventsProvider><Cop31SaveButton slug={event.slug} locale={locale}/></Cop31SavedEventsProvider>
        </aside>
      </div>
    </article>
    <Cop31ConnectBand locale={locale}/>
    <footer className="cop31-footer"><span>Eventise işbirliği ile COP31Radar.com için geliştirilmiştir.</span></footer>
  </main>;
}
