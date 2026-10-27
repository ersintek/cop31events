"use client";

import { useState, type FormEvent } from 'react';
import type { Cop31Locale } from './cop31-types';

export function Cop31ConnectBand({ locale }: { locale: Cop31Locale }) {
  const tr = locale === 'tr';
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);
  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setPending(true); setError(false); setStatus(tr ? 'Kaydediliyor…' : 'Saving…');
    try {
      const response = await fetch('/api/newsletter/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ firstName: fields.get('firstName'), lastName: fields.get('lastName'), email: fields.get('email'), organisation: fields.get('organisation'), consent: fields.get('consent') === 'on', language: locale, website: fields.get('website') }) });
      if (!response.ok) throw new Error();
      form.reset(); setStatus(tr ? 'Aboneliğiniz kaydedildi. Teşekkürler!' : "You're subscribed. Thank you!");
    } catch { setError(true); setStatus(tr ? 'Kayıt yapılamadı. Lütfen tekrar deneyin.' : "We couldn't save your subscription. Please try again."); }
    finally { setPending(false); }
  }
  return <section className="cop31-connect-band" id="newsletter" aria-labelledby="newsletter-title">
    <div className="cop31-newsletter-intro"><span>COP31RADAR / {tr ? 'E-BÜLTEN' : 'NEWSLETTER'}</span><h2 id="newsletter-title">{tr ? 'COP31 gündemini e-postanızda takip edin.' : 'Follow COP31 in your inbox.'}</h2><p>{tr ? 'Bağımsız analizler ve pratik rehberler için e-bültene abone olun.' : 'Subscribe for independent analysis and practical guides.'}</p></div>
    <form className="cop31-newsletter-form" onSubmit={subscribe}>
      <label>{tr ? 'Ad' : 'First name'}<input name="firstName" required maxLength={80} autoComplete="given-name" /></label>
      <label>{tr ? 'Soyad' : 'Last name'}<input name="lastName" required maxLength={80} autoComplete="family-name" /></label>
      <label>{tr ? 'E-posta' : 'Email'}<input name="email" type="email" required maxLength={320} autoComplete="email" /></label>
      <label>{tr ? 'Kurum (isteğe bağlı)' : 'Organisation (optional)'}<input name="organisation" maxLength={160} autoComplete="organization" /></label>
      <label className="cop31-newsletter-honeypot" aria-hidden="true">Leave blank<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="cop31-newsletter-consent"><input name="consent" type="checkbox" required /><span>{tr ? 'COP31Radar e-bültenini e-posta ile almak istiyorum.' : 'I agree to receive the COP31Radar email newsletter.'} <a href={`https://cop31radar.com/${locale}/newsletter-privacy.html`} target="_blank" rel="noopener noreferrer">{tr ? 'Aydınlatma metni' : 'Privacy notice'} ↗</a></span></label>
      <button type="submit" disabled={pending}>{tr ? 'Abone ol' : 'Subscribe'} ↗</button><span className={error ? 'cop31-newsletter-status is-error' : 'cop31-newsletter-status'} role="status" aria-live="polite">{status}</span>
    </form>
  </section>;
}
