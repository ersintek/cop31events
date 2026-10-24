'use client';

import Link from 'next/link';
import { Cop31Account } from './cop31-account';
import { EventCard } from './cop31-directory';
import { Cop31SavedEventsProvider, useCop31SavedEvents } from './cop31-saved-events';
import type { Cop31Event, Cop31Locale } from './cop31-types';

function MyEventsContent({ events, locale }: { events: Cop31Event[]; locale: Cop31Locale }) {
  const { saved, signedIn } = useCop31SavedEvents();
  const directory = locale === 'tr' ? '/cop31' : '/en/cop31';
  const returnTo = locale === 'tr' ? '/cop31/my-events' : '/en/cop31/my-events';
  const ownEvents = events.filter(event => saved.has(event.slug)).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  return <main className="cop31-page cop31-radar-page cop31-my-events-page">
    <header className="cop31-header">
      <Link className="cop31-brand cop31-radar-brand" href="https://cop31radar.com" aria-label="COP31Radar.com"><b>COP31Radar</b><span aria-hidden="true">✳</span></Link>
      <div className="cop31-header-actions"><span className="cop31-radar-domain">events.cop31radar.com</span><Cop31Account locale={locale}/></div>
    </header>
    <section className="cop31-my-events-hero">
      <p className="cop31-eyebrow">COP31 / {locale === 'tr' ? 'KİŞİSEL LİSTEN' : 'YOUR SAVED EVENTS'}</p>
      <h1>{locale === 'tr' ? 'Etkinliklerim' : 'My events'}</h1>
      <p>{locale === 'tr' ? 'Kaydettiğin etkinlikler bu hesapla giriş yaptığın cihazlarda görünür.' : 'Your saved events are available on any device where you sign in to this account.'}</p>
    </section>
    <section className="cop31-my-events-results" aria-live="polite">
      {signedIn === null && <p className="cop31-my-events-message">{locale === 'tr' ? 'Kayıtların yükleniyor…' : 'Loading your saved events…'}</p>}
      {signedIn === false && <div className="cop31-my-events-empty"><h2>{locale === 'tr' ? 'Kayıtlarını görmek için giriş yap' : 'Sign in to see your saved events'}</h2><p>{locale === 'tr' ? 'Etkinlikleri hesabına kaydet ve sonra buradan aç.' : 'Save events to your account and find them here later.'}</p><a className="cop31-my-events-primary" href={`/api/session/sso/start?returnTo=${encodeURIComponent(returnTo)}`}>{locale === 'tr' ? 'Giriş yap' : 'Sign in'}</a></div>}
      {signedIn === true && ownEvents.length === 0 && <div className="cop31-my-events-empty"><h2>{locale === 'tr' ? 'Henüz etkinlik kaydetmedin' : 'You have not saved any events yet'}</h2><p>{locale === 'tr' ? 'Etkinlik listesindeki Kaydet düğmesiyle ilgini çekenleri buraya ekle.' : 'Use the Save button in the event directory to add events here.'}</p><Link className="cop31-my-events-primary" href={directory}>{locale === 'tr' ? 'Etkinlikleri keşfet' : 'Explore events'}</Link></div>}
      {signedIn === true && ownEvents.length > 0 && <><p className="cop31-my-events-count">{ownEvents.length} {locale === 'tr' ? 'kayıtlı etkinlik' : 'saved events'}</p><div className="cop31-event-list">{ownEvents.map(event => <EventCard key={event.id} event={event} locale={locale}/>)}</div></>}
    </section>
    <footer className="cop31-footer"><Link href={directory}>← {locale === 'tr' ? 'Tüm etkinliklere dön' : 'Back to all events'}</Link><span>Eventise işbirliği ile COP31Radar.com için geliştirilmiştir.</span></footer>
  </main>;
}

export function Cop31MyEvents({ events, locale }: { events: Cop31Event[]; locale: Cop31Locale }) {
  return <Cop31SavedEventsProvider><MyEventsContent events={events} locale={locale}/></Cop31SavedEventsProvider>;
}
