import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import categoryRoutes from './routes/categories';
import pipelineRoutes from './routes/pipeline';
import settingsRoutes from './routes/settings';
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
  const url = new URL(c.req.url);
  if (url.pathname.startsWith('/api')) {
    return c.json({ error: 'Not found' }, 404);
  }

  const response = await c.env.ASSETS.fetch(c.req.raw);
  if (response.status !== 404) {
    return response;
  }

  const fallback = new Request(new URL('/index.html', url).toString(), c.req.raw);
  return c.env.ASSETS.fetch(fallback);
});

export default app;
export { default as email } from './email';
