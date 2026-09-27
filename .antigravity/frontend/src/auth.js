const KEY = 'polarnav-captain-session';
export const API = import.meta.env.VITE_API_URL || '';
export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; }
}
export function saveSession(session) { sessionStorage.setItem(KEY, JSON.stringify(session)); }
export function clearSession() {
  try { sessionStorage.removeItem(KEY); } catch {}
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('captain-session-ended'));
}
export async function authFetch(url, options = {}) {
  const session = getSession();
  const headers = new Headers(options.headers);
  if (session?.token) headers.set('Authorization', `Bearer ${session.token}`);
  const response = await fetch(url, {...options, headers});
  if (response.status === 401 && getSession()?.token === session?.token) clearSession();
  return response;
}
export async function signOut() {
  const request = authFetch(`${API}/api/auth/logout`, {method: 'POST'});
  clearSession();
  try { await request; } catch {}
}
