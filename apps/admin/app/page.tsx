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
  status: string;
  created_at: string;
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
      .select('id,asset_class,subtype,title,city,state,asking_price_cents,status,created_at')
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
          </div>
          <div className="actions">
            {item.status === 'submitted' ? <button disabled={busyId === item.id} onClick={() => updateStatus(item.id, 'under_review')}>Start review</button> : null}
            {item.status === 'under_review' ? <>
              <button className="outline" disabled={busyId === item.id} onClick={() => updateStatus(item.id, 'changes_required')}>Request changes</button>
              <button disabled={busyId === item.id} onClick={() => updateStatus(item.id, 'approved')}>Approve</button>
            </> : null}
            {item.status === 'approved' ? <button disabled={busyId === item.id} onClick={() => updateStatus(item.id, 'published')}>Publish</button> : null}
            {item.status === 'changes_required' ? <button disabled={busyId === item.id} onClick={() => updateStatus(item.id, 'under_review')}>Review again</button> : null}
          </div>
        </article>)}
      </section>
    </main>
  );
}
