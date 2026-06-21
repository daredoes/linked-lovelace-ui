import { request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Playwright runs global-setup with cwd = the e2e dir (config location).

// Onboards a fresh Home Assistant via its REST API and writes a Playwright
// storageState containing the frontend auth tokens (localStorage `hassTokens`),
// so every spec starts already logged in. Idempotent: if HA is already
// onboarded it just refreshes the storageState by logging the known user in.
const HA_URL = process.env.HA_URL || 'http://localhost:8123';
const CLIENT_ID = `${HA_URL}/`;
const USER = { name: 'E2E', username: 'e2e', password: 'e2e-password' };
const STORAGE = path.resolve('storage-state.json');

async function tokensFromAuthCode(api: any, code: string) {
  const res = await api.post('/auth/token', {
    form: { grant_type: 'authorization_code', code, client_id: CLIENT_ID },
  });
  if (!res.ok()) throw new Error(`token exchange failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

function writeStorageState(tokens: any) {
  // Shape must match home-assistant-js-websocket's AuthData. Notably `hassUrl`
  // is required — without it the frontend crashes on bootstrap (undefined.substr).
  const hassTokens = {
    hassUrl: HA_URL,
    clientId: CLIENT_ID,
    access_token: tokens.access_token,
    token_type: tokens.token_type || 'Bearer',
    expires_in: tokens.expires_in,
    refresh_token: tokens.refresh_token,
    ha_auth_provider: 'homeassistant',
    expires: Date.now() + (tokens.expires_in ?? 1800) * 1000,
  };
  const state = {
    cookies: [],
    origins: [
      {
        origin: HA_URL,
        localStorage: [{ name: 'hassTokens', value: JSON.stringify(hassTokens) }],
      },
    ],
  };
  fs.writeFileSync(STORAGE, JSON.stringify(state, null, 2));
  console.log(`[global-setup] wrote auth storageState -> ${STORAGE}`);
}

export default async function globalSetup() {
  const api = await request.newContext({ baseURL: HA_URL });

  // Discover onboarding state. Once onboarding is fully complete HA returns a
  // non-JSON 404 here, so treat any non-JSON/non-OK response as "already done".
  let userDone = true;
  const onboardingRes = await api.get('/api/onboarding');
  if (onboardingRes.ok()) {
    try {
      const onboarding = await onboardingRes.json();
      userDone = onboarding.find((s: any) => s.step === 'user')?.done ?? false;
    } catch {
      userDone = true;
    }
  }

  let tokens: any;
  if (!userDone) {
    console.log('[global-setup] onboarding fresh HA instance...');
    const userRes = await api.post('/api/onboarding/users', {
      data: { client_id: CLIENT_ID, name: USER.name, username: USER.username, password: USER.password, language: 'en' },
    });
    if (!userRes.ok()) throw new Error(`user onboarding failed: ${userRes.status()} ${await userRes.text()}`);
    const { auth_code } = await userRes.json();
    tokens = await tokensFromAuthCode(api, auth_code);

    const auth = { Authorization: `Bearer ${tokens.access_token}` };
    // Finish remaining onboarding steps so the frontend doesn't redirect back.
    await api.post('/api/onboarding/core_config', { headers: auth }).catch(() => {});
    await api.post('/api/onboarding/analytics', { headers: auth, data: {} }).catch(() => {});
    await api
      .post('/api/onboarding/integration', { headers: auth, data: { client_id: CLIENT_ID, redirect_uri: CLIENT_ID } })
      .catch(() => {});
  } else {
    console.log('[global-setup] HA already onboarded; logging known user in...');
    // Drive the username/password auth flow to mint a fresh auth_code.
    const flowRes = await api.post('/auth/login_flow', {
      data: { client_id: CLIENT_ID, handler: ['homeassistant', null], redirect_uri: CLIENT_ID },
    });
    const flow = await flowRes.json();
    const stepRes = await api.post(`/auth/login_flow/${flow.flow_id}`, {
      data: { client_id: CLIENT_ID, username: USER.username, password: USER.password },
    });
    const step = await stepRes.json();
    if (step.type !== 'create_entry') throw new Error(`login failed: ${JSON.stringify(step)}`);
    tokens = await tokensFromAuthCode(api, step.result);
  }

  writeStorageState(tokens);
  await api.dispose();
}
