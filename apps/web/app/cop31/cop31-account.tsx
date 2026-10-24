'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type AccountUser = { email: string } | null;

export function Cop31Account({ locale }: { locale: 'tr' | 'en' }) {
  const [user, setUser] = useState<AccountUser>(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/session/me', { cache: 'no-store' }).then(response => response.json()).then(data => {
      if (active) { setUser(data.user ?? null); setChecked(true); }
    }).catch(() => { if (active) setChecked(true); });
    return () => { active = false; };
  }, []);

  async function logout() {
    window.location.assign('/api/session/logout');
  }

  if (!checked) return null;
  if (!user) return <a className="cop31-account-link" href={`/api/session/sso/start?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`}>{locale === 'tr' ? 'Giriş' : 'Sign in'}</a>;
  return <span className="cop31-account"><Link className="cop31-my-events-link" href={locale === 'tr' ? '/cop31/my-events' : '/en/cop31/my-events'}>{locale === 'tr' ? 'Etkinliklerim' : 'My events'}</Link><span className="cop31-account-email" title={user.email}>{user.email}</span><button type="button" onClick={logout}>{locale === 'tr' ? 'Çıkış' : 'Sign out'}</button></span>;
}
