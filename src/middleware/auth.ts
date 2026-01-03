import type { Context, Next } from 'hono';
import * as jose from 'jose';
import type { Env } from '../types';

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const config = await c.env.KV.get('config', 'json');

  if (!config?.jwt_secret) {
    return c.json({ error: 'System not initialized' }, 500);
  }

  try {
    const secret = new TextEncoder().encode(config.jwt_secret);
    const { payload } = await jose.jwtVerify(token, secret);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
}

export async function generateToken(env: Env) {
  const config = await env.KV.get('config', 'json');
  if (!config?.jwt_secret) {
    throw new Error('System not initialized');
  }
  const secret = new TextEncoder().encode(config.jwt_secret);
  return await new jose.SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(secret);
}
