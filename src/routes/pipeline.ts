import { Hono } from 'hono';
import type { Env, Pipeline } from '../types';
import { authMiddleware } from '../middleware/auth';
import { Classifier } from '../services/classifier';
import { defaultPipeline, nowIso } from '../utils/helpers';

const pipeline = new Hono<{ Bindings: Env }>();

pipeline.use('*', authMiddleware);

async function getPipeline(env: Env) {
  const stored = (await env.KV.get('pipeline', 'json')) as Pipeline | null;
  return stored || defaultPipeline();
}

pipeline.get('/', async (c) => {
  const data = await getPipeline(c.env);
  return c.json(data);
});

pipeline.put('/', async (c) => {
  const body = await c.req.json();
  if (!Array.isArray(body?.nodes)) {
    return c.json({ error: 'Nodes required' }, 400);
  }

  const payload: Pipeline = {
    nodes: body.nodes,
    updated_at: nowIso(),
  };
  await c.env.KV.put('pipeline', JSON.stringify(payload));
  return c.json({ success: true });
});

pipeline.post('/test', async (c) => {
  const body = await c.req.json();
  if (!body?.from || !body?.to || !body?.subject) {
    return c.json({ error: 'Missing fields' }, 400);
  }

  const data = await getPipeline(c.env);
  const classifier = new Classifier(data, c.env);
  const result = await classifier.classify(
    {
      from_address: body.from,
      from_name: null,
      to_address: body.to,
      subject: body.subject,
      body_text: body.body || '',
    },
    true
  );

  const matchedNode = data.nodes.find((node) => node.id === result.node_id);
  const category = await c.env.DB.prepare('SELECT name FROM categories WHERE id = ?')
    .bind(result.category_id)
    .first();

  return c.json({
    category_id: result.category_id,
    category_name: category?.name || '默认',
    matched_node: result.node_id
      ? { id: result.node_id, name: result.node_name, type: matchedNode?.type || 'unknown' }
      : null,
    trace: result.trace || [],
  });
});

export default pipeline;
