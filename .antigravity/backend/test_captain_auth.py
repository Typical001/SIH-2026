import hashlib
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
import main
import captain_auth as auth

class CaptainAuthTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(main.app)
        auth.sessions.clear()
        auth.attempts.clear()
        account = {'username': 'test-captain', 'salt': '01' * 16,
                   'password_hash': hashlib.pbkdf2_hmac('sha256', b'test-password', bytes.fromhex('01'*16), 600000).hex()}
        self.config = patch.object(auth, 'ACCOUNT', account)
        self.config.start()
        self.addCleanup(self.config.stop)

    def login(self):
        return self.client.post('/api/auth/login', json={'username':'test-captain','password':'test-password'})

    def test_anonymous_and_forged_access_denied(self):
        for path in ['/api/v1/icebergs','/api/v1/map-base','/api/auth/session']:
            self.assertEqual(self.client.get(path).status_code, 401)
            self.assertEqual(self.client.get(path, headers={'Authorization':'Bearer fabricated'}).status_code, 401)
        self.assertEqual(self.client.post('/api/v1/calculate-route', json={}).status_code, 401)
        self.assertEqual(self.client.get('/api/health').status_code, 200)

    def test_login_logout_and_expiration(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        token = response.json()['token']
        self.client.headers['Authorization'] = 'Bearer ' + token
        self.assertEqual(self.client.get('/api/v1/icebergs').status_code, 200)
        self.assertEqual(self.client.post('/api/auth/logout').status_code, 200)
        self.assertEqual(self.client.get('/api/auth/session').status_code, 401)
        token = self.login().json()['token']
        self.client.headers['Authorization'] = 'Bearer ' + token
        auth.sessions[token] = 0
        self.assertEqual(self.client.get('/api/auth/session').status_code, 401)

    def test_invalid_credentials_and_rate_limit(self):
        for _ in range(10):
            response = self.client.post('/api/auth/login', json={'username':'test-captain','password':'wrong'})
            self.assertEqual(response.status_code, 401)
        self.assertEqual(self.login().status_code, 429)

if __name__ == '__main__': unittest.main()
