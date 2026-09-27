import React, {useEffect, useState} from 'react';
import {Anchor, LockKeyhole} from 'lucide-react';
import {API, authFetch, clearSession, getSession, saveSession} from '../auth';

export default function CaptainLogin({children}) {
  const [status, setStatus] = useState(() => getSession() ? 'checking' : 'signed-out');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const ended = () => {setStatus('signed-out'); setPassword('');};
    window.addEventListener('captain-session-ended', ended);
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort(); setStatus('signed-out');
      setError('The server took too long to respond. Please sign in again.');
    }, 180000);
    if (getSession()) {
      authFetch(`${API}/api/auth/session`, {signal: controller.signal})
        .then(r => {if (!controller.signal.aborted) {if (r.ok) setStatus('authenticated'); else clearSession();}})
        .catch(() => {if (!controller.signal.aborted) {setStatus('signed-out'); setError('Unable to verify the session. Please sign in again.');}})
        .finally(() => clearTimeout(timeout));
    } else {
      clearTimeout(timeout);
    }
    return () => {clearTimeout(timeout); controller.abort(); window.removeEventListener('captain-session-ended', ended);};
  }, []);
  useEffect(() => {
    if (status !== 'authenticated') return;
    const delay = Math.max(0, (getSession()?.expires_at || 0) * 1000 - Date.now());
    const timer = setTimeout(clearSession, delay);
    return () => clearTimeout(timer);
  }, [status]);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: username.trim(), password}),
        signal: AbortSignal.timeout(180000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Sign-in failed. Check your credentials.');
      saveSession(data); setPassword(''); setStatus('authenticated');
    } catch (error) {setError(error.message === 'Failed to fetch' ? 'Unable to reach the server. Please try again.' : error.message);}
    finally {setBusy(false);}
  }
  if (status === 'authenticated') return children;
  return <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
    <section className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl" aria-labelledby="captain-title">
      <Anchor className="text-cyan-400 mb-6" size={36} aria-hidden="true" />
      <p className="text-cyan-300 text-sm tracking-widest mb-2">POLARNAV</p>
      <h1 id="captain-title" className="text-3xl font-bold mb-3">Captain sign-in</h1>
      <p className="text-slate-400 text-sm mb-8">Authorized ship captains only. Use your assigned credentials to access the passage planner.</p>
      {status === 'checking' ? <p role="status">Verifying your session…</p> : <form onSubmit={submit} className="space-y-5">
        <div><label htmlFor="captain-id" className="block text-sm mb-2">Captain ID</label>
          <input id="captain-id" autoComplete="username" required maxLength={100} value={username} onChange={e=>setUsername(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-950 p-3 focus:outline-none focus:ring-2 focus:ring-cyan-400" /></div>
        <div><label htmlFor="captain-password" className="block text-sm mb-2">Password</label>
          <input id="captain-password" type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-950 p-3 focus:outline-none focus:ring-2 focus:ring-cyan-400" /></div>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-cyan-400 text-slate-950 font-semibold p-3 flex items-center justify-center gap-2 disabled:opacity-60"><LockKeyhole size={16} />{busy ? 'Signing in…' : 'Sign in'}</button>
        {busy && <p role="status" className="text-xs text-slate-400">The demo server may take a few minutes to wake after inactivity.</p>}
      </form>}
      <p className="border-t border-slate-700 pt-5 mt-7 text-xs text-slate-400">For access assistance, contact your credential administrator.</p>
    </section>
  </main>;
}
