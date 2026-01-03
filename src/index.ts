import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import categoryRoutes from './routes/categories';
import pipelineRoutes from './routes/pipeline';
import settingsRoutes from './routes/settings';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { ensureDb } from './utils/db';

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', cors());
app.use('/api/*', async (c, next) => {
  await ensureDb(c.env);
  await next();
});

app.route('/api', authRoutes);
app.route('/api/emails', emailRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/pipeline', pipelineRoutes);
app.route('/api/settings', settingsRoutes);

app.get('*', async (c) => {
  try {
    const response = await getAssetFromKV(
      {
        request: c.req.raw,
        waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx),
      },
      {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: c.env.__STATIC_CONTENT_MANIFEST,
      }
    );
    return response;
  } catch {
    const url = new URL(c.req.url);
    if (url.pathname.startsWith('/api')) {
      return c.json({ error: 'Not found' }, 404);
    }
    const fallback = new Request(new URL('/index.html', url).toString(), c.req.raw);
    const response = await getAssetFromKV(
      { request: fallback, waitUntil: c.executionCtx.waitUntil.bind(c.executionCtx) },
      {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: c.env.__STATIC_CONTENT_MANIFEST,
      }
    );
    return response;
  }
});

export default app;
export { default as email } from './email';
