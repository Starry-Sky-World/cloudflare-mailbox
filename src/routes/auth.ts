import { Hono } from 'hono';
import type { Env, Config } from '../types';
import { generateToken } from '../middleware/auth';
import { hashPassword, packPasswordHash, verifyPassword } from '../utils/crypto';
import { defaultPipeline, getConfig, nowIso, saveConfig } from '../utils/helpers';

const auth = new Hono<{ Bindings: Env }>();

function randomSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let out = '';
  bytes.forEach((b) => (out += String.fromCharCode(b)));
  return btoa(out);
}

async function ensureDefaultCategory(env: Env) {
  await env.DB.prepare(
    "INSERT OR IGNORE INTO categories (id, parent_id, name, icon, sort_order) VALUES ('default', NULL, '默认', '📥', 999999)"
  ).run();
}

async function ensurePipeline(env: Env) {
  const pipeline = await env.KV.get('pipeline');
  if (!pipeline) {
    await env.KV.put('pipeline', JSON.stringify(defaultPipeline()));
  }
}

auth.get('/status', async (c) => {
  const config = await getConfig(c.env);
  return c.json({
    initialized: Boolean(config?.initialized),
    has_recovery_key: Boolean(config?.recovery_key_hash || c.env.RECOVERY_KEY),
  });
});

auth.post('/setup', async (c) => {
  const existing = await getConfig(c.env);
  if (existing?.initialized) {
    return c.json({ error: 'Already initialized' }, 400);
  }

  const body = await c.req.json();
  if (!body?.password) {
    return c.json({ error: 'Password required' }, 400);
  }

  const { hash, salt } = await hashPassword(body.password);
  const password_hash = packPasswordHash(salt, hash);

  let recovery_key_hash: string | undefined;
  if (c.env.RECOVERY_KEY) {
    const recovery = await hashPassword(c.env.RECOVERY_KEY);
    recovery_key_hash = packPasswordHash(recovery.salt, recovery.hash);
  }

  const now = nowIso();
  const config: Config = {
    initialized: true,
    password_hash,
    recovery_key_hash,
    jwt_secret: randomSecret(),
    ai: body.ai
      ? {
          enabled: true,
          endpoint: body.ai.endpoint,
          api_key: body.ai.api_key,
          model: body.ai.model,
          timeout: 15000,
          max_tokens: 80,
        }
      : {
          enabled: false,
          endpoint: '',
          api_key: '',
          model: '',
          timeout: 15000,
          max_tokens: 80,
        },
    created_at: now,
    updated_at: now,
  };

  await saveConfig(c.env, config);
  await ensureDefaultCategory(c.env);
  await ensurePipeline(c.env);

  const token = await generateToken(c.env);
  return c.json({ success: true, token });
});

auth.post('/login', async (c) => {
  const config = await getConfig(c.env);
  if (!config?.initialized) {
    return c.json({ error: 'System not initialized' }, 400);
  }
  const body = await c.req.json();
  if (!body?.password) {
    return c.json({ error: 'Password required' }, 400);
  }

  const ok = await verifyPassword(body.password, config.password_hash);
  if (!ok) {
    return c.json({ error: 'Invalid password' }, 401);
  }

  const token = await generateToken(c.env);
  return c.json({ success: true, token });
});

auth.post('/recover', async (c) => {
  const config = await getConfig(c.env);
  if (!config?.initialized) {
    return c.json({ error: 'System not initialized' }, 400);
  }
  if (!config.recovery_key_hash && !c.env.RECOVERY_KEY) {
    return c.json({ error: 'Recovery not enabled' }, 400);
  }

  const body = await c.req.json();
  if (!body?.recovery_key || !body?.new_password) {
    return c.json({ error: 'Missing fields' }, 400);
  }

  if (config.recovery_key_hash) {
    const ok = await verifyPassword(body.recovery_key, config.recovery_key_hash);
    if (!ok) return c.json({ error: 'Invalid recovery key' }, 401);
  } else if (c.env.RECOVERY_KEY !== body.recovery_key) {
    return c.json({ error: 'Invalid recovery key' }, 401);
  }

  const { hash, salt } = await hashPassword(body.new_password);
  config.password_hash = packPasswordHash(salt, hash);
  config.updated_at = nowIso();
  await saveConfig(c.env, config);

  const token = await generateToken(c.env);
  return c.json({ success: true, token });
});

export default auth;
