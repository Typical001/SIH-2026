# Captain access — 27 September 2026

The application now opens on a captain-only sign-in page, with no signup or displayed credentials. The dashboard mounts only after successful authentication. Every application API except health and login requires an opaque bearer session. Sign out revokes that session; sessions expire after eight hours and also end when the single-worker backend restarts or sleeps. Browser session storage retains the token across refreshes, not the password.

The provisioned demonstration captain account is verified on the backend using a salted PBKDF2-SHA256 password hash (600,000 iterations), with constant-time comparison and a ten-attempt/five-minute per-client limit. `backend/captain_account.json` contains only its ID, salt and hash, never the plaintext password. Credentials were supplied privately in chat; a local recovery copy is ignored at `.antigravity/.env.captain`. Do not commit or publish that file. There is no government identity integration or signup service.

Continue using one backend worker: sessions and login throttling are in memory. A multi-worker deployment would need shared session/rate-limit storage. Browser API requests include Authorization; CORS permits cross-origin bearer requests, but does not grant access without a valid session. Health remains public for Render. API documentation endpoints are disabled.

Validation: frontend login gate/rejection/expiry tests and backend anonymous-access, invalid-login, rate-limit, expiration and logout tests. Existing planning tests now use an authenticated test session.
