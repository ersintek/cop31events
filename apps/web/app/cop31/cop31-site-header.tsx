'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Cop31Account } from './cop31-account';
import type { Cop31Locale } from './cop31-types';

export function Cop31SiteHeader({ locale }: { locale: Cop31Locale }) {
  const pathname = usePathname();
  const tr = locale === 'tr';
  const otherPath = tr ? (pathname === '/' ? '/en/cop31' : '/en' + pathname) : (pathname === '/en/cop31' ? '/' : pathname.slice(3));
  const base = tr ? 'https://cop31radar.com/tr/' : 'https://cop31radar.com/en/';
  const nav = [
    ['weekly.html', tr ? 'Bülten' : 'Weekly'],
    ['research.html', tr ? 'Araştırmalar' : 'Research'],
    ['https://cop31radar.com/depo?lang=' + locale, tr ? 'Belge Arşivi' : 'Document Archive'],
    [tr ? '/' : '/en/cop31', tr ? 'Etkinlikler' : 'Events'],
    ['services.html', tr ? 'Hizmetler' : 'Services'],
    ['about.html', tr ? 'Hakkımızda' : 'About'],
    ['contact.html', tr ? 'İletişim' : 'Contact'],
  ];
  const saveLanguage = (language: Cop31Locale) => { document.cookie = `cop31_language=${language}; Domain=.cop31radar.com; Path=/; Max-Age=31536000; SameSite=Lax; Secure`; };
  useEffect(() => { saveLanguage(locale); }, [locale]);

  return <header className="cop31-header cop31-unified-header">
    <div className="cop31-header-brand-block"><a className="cop31-brand cop31-radar-brand" href={base + 'index.html'} aria-label="COP31Radar"><b>COP31Radar</b><span aria-hidden="true">✳</span></a><span className="cop31-header-credit">events.cop31radar.com · {tr ? 'eventise.org işbirliği ile' : 'in collaboration with eventise.org'}</span></div>
    <nav className="cop31-unified-nav" aria-label={tr ? 'Ana menü' : 'Main navigation'}>{nav.map(([href, label], index) => href.startsWith('http') ? <a key={label} href={href} className={index === 6 ? 'cop31-nav-contact' : ''}>{label}</a> : href.startsWith('/') ? <Link key={label} href={href} aria-current={index === 3 ? 'page' : undefined}>{label}</Link> : <a key={label} href={base + href} className={index === 6 ? 'cop31-nav-contact' : ''}>{label}</a>)}</nav>
    <div className="cop31-header-tools"><Cop31Account locale={locale}/><div className="cop31-language-choice" role="group" aria-label={tr ? 'Site dili' : 'Site language'}><a href={tr ? pathname : otherPath} aria-current={tr ? 'true' : undefined} onClick={() => saveLanguage('tr')}>TR</a><span aria-hidden="true">/</span><a href={tr ? otherPath : pathname} aria-current={tr ? undefined : 'true'} onClick={() => saveLanguage('en')}>ENG</a></div></div>
  </header>;
}
