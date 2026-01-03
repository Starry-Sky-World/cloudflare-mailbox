import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { email as emailHandler } from './email';
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';
import categoryRoutes from './routes/categories';
import pipelineRoutes from './routes/pipeline';
import settingsRoutes from './routes/settings';
import { ensureDb } from './utils/db';

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', cors());
app.use('/api/*', async (c, next) => {
  try {
    await ensureDb(c.env);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database init failed';
    return c.json({ error: message }, 500);
  }
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

  if (!c.env.ASSETS) {
    return c.text('Static assets binding missing. Check wrangler assets config.', 500);
  }

  const response = await c.env.ASSETS.fetch(c.req.raw);
  if (response.status !== 404) {
    return response;
  }

  const fallback = new Request(new URL('/index.html', url).toString(), c.req.raw);
  return c.env.ASSETS.fetch(fallback);
});

const fetch = app.fetch;

export { emailHandler as email };
export default { fetch, email: emailHandler };
