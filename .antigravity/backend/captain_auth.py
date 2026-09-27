"""Single provisioned captain account; opaque, revocable single-worker sessions."""
import hashlib
import hmac
import json
import os
import secrets
import time
from pathlib import Path
from threading import Lock
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

router = APIRouter(prefix='/api/auth')
ACCOUNT = json.loads(Path(__file__).with_name('captain_account.json').read_text())
SESSION_SECONDS = 8 * 60 * 60
sessions = {}
attempts = {}
lock = Lock()

class Credentials(BaseModel):
    username: str = Field(max_length=100)
    password: str = Field(max_length=256)

def token_from(request):
    scheme, _, token = request.headers.get('authorization', '').partition(' ')
    return token if scheme.lower() == 'bearer' else ''

def require_captain(request: Request):
    if request.url.path == '/api/health' or request.url.path == '/api/auth/login':
        return
    with lock:
        expires = sessions.get(token_from(request), 0)
    if expires <= time.time():
        raise HTTPException(401, 'Captain sign-in required', headers={'WWW-Authenticate': 'Bearer'})

@router.post('/login')
def login(body: Credentials, request: Request):
    now = time.time()
    address = request.client.host if request.client else 'unknown'
    with lock:
        for key in list(attempts):
            if attempts[key][1] <= now: del attempts[key]
        count, reset = attempts.get(address, (0, now + 300))
        if count >= 10:
            raise HTTPException(429, 'Too many attempts. Try again in five minutes.')
        attempts[address] = (count + 1, reset)
    candidate = hashlib.pbkdf2_hmac('sha256', body.password.encode(), bytes.fromhex(ACCOUNT['salt']), 600000).hex()
    if not (hmac.compare_digest(body.username.encode(), ACCOUNT['username'].encode()) & hmac.compare_digest(candidate, ACCOUNT['password_hash'])):
        raise HTTPException(401, 'Incorrect captain ID or password.')
    token = secrets.token_urlsafe(32)
    with lock:
        attempts.pop(address, None)
        for key in list(sessions):
            if sessions[key] <= now: del sessions[key]
        # Bound memory even if the provisioned credential is used repeatedly.
        if len(sessions) >= 100: sessions.pop(next(iter(sessions)))
        sessions[token] = now + SESSION_SECONDS
    return {'token': token, 'expires_at': now + SESSION_SECONDS}

@router.get('/session')
def session():
    return {'role': 'captain'}

@router.post('/logout')
def logout(request: Request):
    with lock: sessions.pop(token_from(request), None)
    return {'signed_out': True}
