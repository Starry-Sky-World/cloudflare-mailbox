import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { hashPassword, packPasswordHash, verifyPassword } from '../utils/crypto';
import { getConfig, nowIso, saveConfig } from '../utils/helpers';

const settings = new Hono<{ Bindings: Env }>();

settings.post('/ai/test', async (c) => {
  const body = await c.req.json();
  if (!body?.endpoint || !body?.api_key || !body?.model) {
    return c.json({ success: false, message: 'Missing fields' }, 400);
  }

  const started = Date.now();
  try {
    const response = await fetch(body.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${body.api_key}`,
      },
      body: JSON.stringify({
        model: body.model,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return c.json({
        success: false,
        message: `API error: ${response.status} ${text}`,
        latency_ms: Date.now() - started,
      });
    }

    return c.json({
      success: true,
      message: 'Connection OK',
      latency_ms: Date.now() - started,
    });
  } catch (error) {
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      latency_ms: Date.now() - started,
    });
  }
});

settings.use('*', authMiddleware);

settings.get('/', async (c) => {
  const config = await getConfig(c.env);
  if (!config) return c.json({ error: 'Not initialized' }, 400);

  return c.json({
    ai: {
      enabled: Boolean(config.ai?.enabled),
      endpoint: config.ai?.endpoint || '',
      model: config.ai?.model || '',
      has_api_key: Boolean(config.ai?.api_key),
    },
  });
});

settings.put('/password', async (c) => {
  const body = await c.req.json();
  if (!body?.current_password || !body?.new_password) {
    return c.json({ error: 'Missing fields' }, 400);
  }

  const config = await getConfig(c.env);
  if (!config) return c.json({ error: 'Not initialized' }, 400);

  const ok = await verifyPassword(body.current_password, config.password_hash);
  if (!ok) return c.json({ error: 'Invalid password' }, 401);

  const { hash, salt } = await hashPassword(body.new_password);
  config.password_hash = packPasswordHash(salt, hash);
  config.updated_at = nowIso();
  await saveConfig(c.env, config);

  return c.json({ success: true });
});

settings.put('/ai', async (c) => {
  const body = await c.req.json();
  const config = await getConfig(c.env);
  if (!config) return c.json({ error: 'Not initialized' }, 400);

  config.ai = {
    enabled: Boolean(body.enabled),
    endpoint: body.endpoint ?? config.ai?.endpoint ?? '',
    api_key: body.api_key ?? config.ai?.api_key ?? '',
    model: body.model ?? config.ai?.model ?? '',
    timeout: config.ai?.timeout ?? 15000,
    max_tokens: config.ai?.max_tokens ?? 80,
  };
  config.updated_at = nowIso();

  await saveConfig(c.env, config);
  return c.json({ success: true });
});

export default settings;
