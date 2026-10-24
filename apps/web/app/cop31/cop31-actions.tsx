'use client';

import { useState } from 'react';
import type { Cop31Event, Cop31Locale } from './cop31-types';
import { copy, eventContent, localized } from './cop31-data';

function icsDate(value: string) { return new Date(value).toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}/, ''); }
function icsLocalDate(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone }).formatToParts(new Date(value));
  const field = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  return `${field('year')}${field('month')}${field('day')}`;
}
function nextIcsDate(value: string) {
  const day = new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8)) + 1));
  return day.toISOString().slice(0, 10).replaceAll('-', '');
}
function escapeIcsText(value: string) { return value.replaceAll('\\', '\\\\').replaceAll('\r\n', '\\n').replaceAll('\n', '\\n').replaceAll('\r', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;'); }
function foldIcsLine(line: string) {
  const segments: string[] = [];
  let segment = '';
  let bytes = 0;
  for (const character of line) {
    const size = new TextEncoder().encode(character).length;
    if (bytes + size > 75) { segments.push(segment); segment = ' '; bytes = 1; }
    segment += character;
    bytes += size;
  }
  segments.push(segment);
  return segments.join('\r\n');
}
function addHour(value: string) { return new Date(new Date(value).getTime() + 60 * 60 * 1000).toISOString(); }

export function Cop31Actions({ event, locale }: { event: Cop31Event; locale: Cop31Locale }) {
  const [message, setMessage] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const words = copy[locale];
  const content = eventContent(event, locale);
  const title = localized(event, 'title', locale);
  const url = typeof window === 'undefined' ? '' : window.location.href;

  async function share() {
    const text = locale === 'tr' ? `${title} etkinliğini inceleyin` : `Explore ${title}`;
    try {
      if (navigator.share) await navigator.share({ title, text, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      setMessage(locale === 'tr' ? 'Bağlantı kopyalandı.' : 'Link copied.');
    } catch { /* A closed share sheet is not an error state. */ }
  }

  const location = event.format === 'ONLINE' ? (content.registrationUrl || content.informationUrl || '') : [content.venueName, content.venueAddress, content.city, content.country].filter(Boolean).join(', ');
  const allDay = event.timeKnown === false;
  const startDate = allDay ? icsLocalDate(event.startsAt, event.timezone) : icsDate(event.startsAt);
  const endDate = allDay
    ? nextIcsDate(icsLocalDate(event.endsAt ?? event.startsAt, event.timezone))
    : icsDate(event.endsAt ?? addHour(event.startsAt));
  const googleDates = allDay
    ? `${startDate}/${endDate}`
    : `${startDate}/${endDate}`;
  const google = new URL('https://calendar.google.com/calendar/r/eventedit');
  google.searchParams.set('action', 'TEMPLATE');
  google.searchParams.set('text', title);
  google.searchParams.set('dates', googleDates);
  google.searchParams.set('details', `${localized(event, 'summary', locale)}${url ? `\n\n${url}` : ''}`);
  if (location) google.searchParams.set('location', location);
  if (!allDay) {
    google.searchParams.set('stz', event.timezone);
    google.searchParams.set('etz', event.timezone);
  }
  const outlook = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  outlook.searchParams.set('path', '/calendar/action/compose');
  outlook.searchParams.set('rru', 'addevent');
  outlook.searchParams.set('subject', title);
  outlook.searchParams.set('body', `${localized(event, 'summary', locale)}${url ? `\n\n${url}` : ''}`);
  outlook.searchParams.set('startdt', allDay ? `${startDate.slice(0, 4)}-${startDate.slice(4, 6)}-${startDate.slice(6, 8)}T00:00:00` : event.startsAt);
  outlook.searchParams.set('enddt', allDay ? `${endDate.slice(0, 4)}-${endDate.slice(4, 6)}-${endDate.slice(6, 8)}T00:00:00` : (event.endsAt ?? addHour(event.startsAt)));
  outlook.searchParams.set('allday', String(allDay));
  if (location) outlook.searchParams.set('location', location);

  function downloadIcs() {
    const body = [`BEGIN:VCALENDAR`, `VERSION:2.0`, `CALSCALE:GREGORIAN`, `PRODID:-//Eventise//COP31 Directory//EN`, `BEGIN:VEVENT`, `UID:cop31-${event.id}@eventise`, `DTSTAMP:${icsDate(new Date().toISOString())}`, ...(allDay ? [`DTSTART;VALUE=DATE:${startDate}`, `DTEND;VALUE=DATE:${endDate}`] : [`DTSTART:${startDate}`, `DTEND:${endDate}`]), `SUMMARY:${escapeIcsText(title)}`, `DESCRIPTION:${escapeIcsText(`${localized(event, 'summary', locale)}${url ? `\n\n${url}` : ''}`)}`, ...(location ? [`LOCATION:${escapeIcsText(location)}`] : []), ...(url ? [`URL:${url}`] : []), `END:VEVENT`, `END:VCALENDAR`].map(foldIcsLine).join('\r\n');
    const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = href; anchor.download = `${event.slug}.ics`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    setCalendarOpen(false);
    setMessage(locale === 'tr' ? 'Takvim uygulamanızı seçerek etkinliği ekleyin.' : 'Open the file with your calendar app to add this event.');
  }

  return <div className="cop31-actions">
    <button type="button" className="cop31-action-button" onClick={share}><span aria-hidden="true">↗</span>{words.share}</button>
    <div className="cop31-calendar-picker">
      <button type="button" className="cop31-action-button" onClick={() => setCalendarOpen(open => !open)} aria-expanded={calendarOpen} aria-controls="cop31-calendar-options"><span aria-hidden="true">＋</span>{words.calendar}</button>
      {calendarOpen && <div className="cop31-calendar-options" id="cop31-calendar-options" role="group" aria-label={locale === 'tr' ? 'Takvim uygulaması seç' : 'Choose a calendar app'}>
        <a href={google.toString()} target="_blank" rel="noopener noreferrer" onClick={() => setCalendarOpen(false)}>Google Calendar ↗</a>
        <a href={outlook.toString()} target="_blank" rel="noopener noreferrer" onClick={() => setCalendarOpen(false)}>Outlook ↗</a>
        <button type="button" onClick={downloadIcs}>{locale === 'tr' ? 'Apple / diğer (.ics)' : 'Apple / other (.ics)'}</button>
      </div>}
    </div>
    {message && <p role="status" className="cop31-action-feedback">{message}</p>}
  </div>;
}
