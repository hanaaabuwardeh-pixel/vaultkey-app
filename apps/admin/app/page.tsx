'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Listing = {
  id: string;
  asset_class: string;
  subtype: string;
  title: string;
  city: string;
  state: string;
  asking_price_cents: number;
  market_value_cents: number | null;
  discount_percent: number | null;
  pricing_tier: string | null;
  status: string;
  valuation_method: string | null;
  valuation_status: string;
  proof_status: string;
  proof_documents: Array<{ category: string; name: string; path: string }>;
  asset_details: Record<string, unknown>;
  created_at: string;
};

// Server-computed only (see the property-data edge function's `submit`
// action) -- kept in sync with apps/mobile/lib/pricing.ts's TIER_LABELS.
const TIER_LABELS: Record<string, string> = {
  '5_percent': '5% Below — Marketplace Entry',
  '10_percent': '10% Below — VaultKey Deal',
  '15_percent': '15% Below — Strong Deal',
  '20_percent': '20% Below — Hot Deal',
  custom: 'More than 20% Below — Exceptional Deal',
  pending_valuation: 'Pending independent valuation',
};

const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    .format(Number(cents) / 100);

export default function AdminHome() {
  const [session, setSession] = useState<Session | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loadQueue = useCallback(async (nextSession: Session | null) => {
    const client = supabase;
    if (!client || !nextSession) {
      setListings([]);
      setRole('');
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('role')
      .eq('id', nextSession.user.id)
      .single();

    if (profileError || !['admin', 'analyst'].includes(profile?.role)) {
      setRole(profile?.role ?? 'unauthorized');
      setListings([]);
      setLoading(false);
      return;
    }

    setRole(profile.role);
    const { data, error } = await client
      .from('listings')
      .select('id,asset_class,subtype,title,city,state,asking_price_cents,market_value_cents,discount_percent,pricing_tier,status,valuation_method,valuation_status,proof_status,proof_documents,asset_details,created_at')
      .in('status', ['submitted', 'under_review', 'changes_required', 'approved', 'rejected'])
      .order('created_at', { ascending: true });

    setListings((data ?? []) as Listing[]);
    setMessage(error ? error.message : '');
    setLoading(false);
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setMessage('Supabase environment variables are missing.');
      setLoading(false);
      return;
    }

    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadQueue(data.session);
    });

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadQueue(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, [loadQueue]);

  const stats = useMemo<Array<[string, number]>>(() => [
    ['Submitted', listings.filter((item) => item.status === 'submitted').length],
    ['Under review', listings.filter((item) => item.status === 'under_review').length],
    ['Changes required', listings.filter((item) => item.status === 'changes_required').length],
    ['Approved', listings.filter((item) => item.status === 'approved').length],
  ], [listings]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    const client = supabase;
    if (!client) return;
    setMessage('');
    setLoading(true);
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const client = supabase;
    if (!client) return;
    setBusyId(id);
    setMessage('');
    const { error } = await client.from('listings').update({
      status,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) setMessage(error.message);
    await loadQueue(session);
    setBusyId('');
  };

  const openProof = async (path: string) => {
    const client = supabase;
    if (!client) return;
    const { data, error } = await client.storage.from('listing-proofs').createSignedUrl(path, 300);
    if (error || !data?.signedUrl) {
      setMessage(error?.message ?? 'Could not open this proof document.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const verifyDocumentsAndValuation = async (id: string) => {
    const client = supabase;
    if (!client) return;
    setBusyId(id);
    setMessage('');
    const { error } = await client.from('listings').update({
      proof_status: 'verified',
      valuation_status: 'verified',
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) setMessage(error.message);
    await loadQueue(session);
    setBusyId('');
  };

  if (!session) {
    return <main className="authPage">
      <section className="loginCard">
        <div className="mark">VK</div>
        <h1>VaultKey Operations</h1>
        <p>Authorized reviewers only.</p>
        <form onSubmit={signIn}>
          <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required /></label>
          <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required /></label>
          {message ? <div className="error">{message}</div> : null}
          <button disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>;
  }

  if (!loading && !['admin', 'analyst'].includes(role)) {
    return <main className="authPage"><section className="loginCard">
      <div className="mark">VK</div>
      <h1>Access restricted</h1>
      <p>This account is not assigned to the VaultKey review team.</p>
      <button onClick={() => supabase?.auth.signOut()}>Sign out</button>
    </section></main>;
  }

  return (
    <main>
      <header>
        <div className="mark">VK</div>
        <div><h1>Review Operations</h1><p>Live listing moderation and publishing</p></div>
        <button className="signOut" onClick={() => supabase?.auth.signOut()}>Sign out</button>
      </header>

      <section className="stats">{stats.map(([label, value]) =>
        <article key={String(label)}><strong>{value}</strong><span>{label}</span></article>
      )}</section>

      <section className="panel">
        <div className="panelHeading">
          <div><h2>Priority review queue</h2><p>Oldest submissions appear first.</p></div>
          <button onClick={() => loadQueue(session)}>Refresh</button>
        </div>

        {message ? <div className="error">{message}</div> : null}
        {loading ? <div className="empty">Loading live submissions…</div> : null}
        {!loading && listings.length === 0 ? <div className="empty">No listings are waiting for review.</div> : null}

        {listings.map((item) => <article className="queueRow" key={item.id}>
          <div className="listingCopy">
            <div className="eyebrow">{item.asset_class} · {item.subtype}</div>
            <h3>{item.title}</h3>
            <p>{item.city}, {item.state} · {money(item.asking_price_cents)} · <b>{item.status.replaceAll('_', ' ')}</b></p>
            <p className="pricing">
              {item.asset_class === 'residential'
                ? (item.pricing_tier === 'pending_valuation' || item.market_value_cents == null
                    ? 'ATTOM AVM unavailable — pending manual valuation'
                    : `${money(item.market_value_cents)} ATTOM value · ${Number(item.discount_percent).toFixed(1)}% below market · ${TIER_LABELS[item.pricing_tier ?? ''] ?? item.pricing_tier}`)
                : `${item.market_value_cents == null ? 'No provisional value' : money(item.market_value_cents)} · ${String(item.valuation_method ?? 'manual').replaceAll('_', ' ')} · valuation ${item.valuation_status}`}
            </p>
            <p className="pricing">Proof: <b>{item.proof_status}</b></p>
            {item.proof_documents?.length ? <div className="actions">
              {item.proof_documents.map((document) => <button className="outline" key={document.path} onClick={() => openProof(document.path)}>
                Open {document.category.replaceAll('_', ' ')}
              </button>)}
            </div> : item.asset_class !== 'residential' ? <p className="error">Required proof documents are missing.</p> : null}
          </div>
          <div className="actions">
            {item.status === 'submitted' ? <button disabled={busyId === item.id} onClick={() => updateStatus(item.id, 'under_review')}>Start review</button> : null}
            {item.status === 'under_review' ? <>
              <button className="outline" disabled={busyId === item.id} onClick={() => updateStatus(item.id, 'changes_required')}>Request changes</button>
              {(item.valuation_status !== 'verified' || item.proof_status !== 'verified') ? <button className="outline" disabled={busyId === item.id || (item.asset_class !== 'residential' && !item.proof_documents?.length)} onClick={() => verifyDocumentsAndValuation(item.id)}>Verify documents & value</button> : null}
              <button disabled={busyId === item.id || item.valuation_status !== 'verified' || item.proof_status !== 'verified'} onClick={() => updateStatus(item.id, 'approved')}>Approve</button>
            </> : null}
            {item.status === 'approved' ? <button disabled={busyId === item.id} onClick={() => updateStatus(item.id, 'published')}>Publish</button> : null}
            {item.status === 'changes_required' ? <button disabled={busyId === item.id} onClick={() => updateStatus(item.id, 'under_review')}>Review again</button> : null}
          </div>
        </article>)}
      </section>
    </main>
  );
}
