'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Cop31Locale } from './cop31-types';

export type SavedContextValue = { saved: Set<string>; toggle: (slug: string) => Promise<void>; pending: Set<string>; signedIn: boolean | null };
const SavedContext = createContext<SavedContextValue | null>(null);

export function useCop31SavedEvents() {
  const context = useContext(SavedContext);
  if (!context) throw new Error('useCop31SavedEvents must be inside Cop31SavedEventsProvider.');
  return context;
}

export function Cop31SavedEventsProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/cop31/saved', { cache: 'no-store' });
      if (response.status === 401) { setSignedIn(false); setSaved(new Set()); return; }
      if (!response.ok) { setSignedIn(false); return; }
      const rows = await response.json() as Array<{ slug: string }>;
      setSaved(new Set(rows.map(row => row.slug)));
      setSignedIn(true);
    } catch { setSignedIn(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (signedIn !== true) return;
    const slug = window.sessionStorage.getItem('cop31_pending_save');
    if (!slug) return;
    window.sessionStorage.removeItem('cop31_pending_save');
    void fetch('/api/cop31/saved', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).then(response => {
      if (response.ok) setSaved(previous => new Set(previous).add(slug));
    }).catch(() => undefined);
  }, [signedIn]);

  const toggle = useCallback(async (slug: string) => {
    if (pending.has(slug)) return;
    if (signedIn !== true) {
      window.sessionStorage.setItem('cop31_pending_save', slug);
      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/api/session/sso/start?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    setPending(previous => new Set(previous).add(slug));
    const wasSaved = saved.has(slug);
    try {
      const response = await fetch(wasSaved ? `/api/cop31/saved/${encodeURIComponent(slug)}` : '/api/cop31/saved', {
        method: wasSaved ? 'DELETE' : 'POST',
        ...(wasSaved ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug }) }),
      });
      if (response.status === 401) { setSignedIn(false); return; }
      if (!response.ok) return;
      setSaved(previous => { const next = new Set(previous); wasSaved ? next.delete(slug) : next.add(slug); return next; });
    } finally { setPending(previous => { const next = new Set(previous); next.delete(slug); return next; }); }
  }, [pending, saved, signedIn]);

  const value = useMemo(() => ({ saved, toggle, pending, signedIn }), [saved, toggle, pending, signedIn]);
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function Cop31SaveButton({ slug, locale, compact = false }: { slug: string; locale: Cop31Locale; compact?: boolean }) {
  const context = useCop31SavedEvents();
  const isSaved = context.saved.has(slug);
  const busy = context.pending.has(slug);
  const label = isSaved ? (locale === 'tr' ? 'Kaydedildi' : 'Saved') : context.signedIn === false ? (locale === 'tr' ? 'Giriş yap ve kaydet' : 'Sign in to save') : (locale === 'tr' ? 'Kaydet' : 'Save');
  return <button type="button" className={`cop31-save-button${compact ? ' compact' : ''}${isSaved ? ' is-saved' : ''}`} onClick={() => void context.toggle(slug)} disabled={busy} aria-pressed={isSaved} aria-label={label} title={label}>
    <span aria-hidden="true">{isSaved ? '✓' : '＋'}</span>{busy ? (locale === 'tr' ? 'Kaydediliyor…' : 'Saving…') : label}
  </button>;
}
