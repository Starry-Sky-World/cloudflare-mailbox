import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { generateId, nowIso } from '../utils/helpers';

const categories = new Hono<{ Bindings: Env }>();

categories.use('*', authMiddleware);

function buildTree(items: any[]) {
  const map = new Map<string, any>();
  const roots: any[] = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of items) {
    const node = map.get(item.id);
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (nodes: any[]) => {
    nodes.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    nodes.forEach((child: any) => sortTree(child.children));
  };
  sortTree(roots);

  return roots;
}

categories.get('/', async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT c.*, 
      IFNULL(e.total, 0) as email_count,
      IFNULL(e.unread, 0) as unread_count
     FROM categories c
     LEFT JOIN (
       SELECT category_id, COUNT(*) as total,
         SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread
       FROM emails
       GROUP BY category_id
     ) e ON e.category_id = c.id
     ORDER BY c.sort_order ASC`
  ).all();

  const categoriesList = result.results.map((row: any) => ({
    ...row,
    is_system: row.id === 'default',
  }));

  return c.json({ categories: buildTree(categoriesList) });
});

categories.post('/', async (c) => {
  const body = await c.req.json();
  if (!body?.name) {
    return c.json({ error: 'Name required' }, 400);
  }

  const id = generateId();
  const now = nowIso();
  const parent_id = body.parent_id || null;
  const icon = body.icon || '📁';
  const color = body.color || '#666666';

  const sortOrderResult = await c.env.DB.prepare(
    'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM categories WHERE parent_id IS ?'
  )
    .bind(parent_id)
    .first();
  const sort_order = (sortOrderResult?.max_order as number) + 1;

  await c.env.DB.prepare(
    'INSERT INTO categories (id, parent_id, name, icon, color, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(id, parent_id, body.name, icon, color, sort_order, now, now)
    .run();

  return c.json({ id, parent_id, name: body.name, icon, color, sort_order });
});

categories.patch('/:id', async (c) => {
  const id = c.req.param('id');
  if (id === 'default') {
    return c.json({ error: 'Default category cannot be edited' }, 400);
  }
  const body = await c.req.json();
  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (body.parent_id !== undefined) {
    updates.push('parent_id = ?');
    bindings.push(body.parent_id);
  }
  if (body.name) {
    updates.push('name = ?');
    bindings.push(body.name);
  }
  if (body.icon) {
    updates.push('icon = ?');
    bindings.push(body.icon);
  }
  if (body.color) {
    updates.push('color = ?');
    bindings.push(body.color);
  }

  if (!updates.length) {
    return c.json({ error: 'No updates' }, 400);
  }

  updates.push('updated_at = ?');
  bindings.push(nowIso());
  bindings.push(id);

  await c.env.DB.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...bindings)
    .run();
  return c.json({ success: true });
});

categories.delete('/:id', async (c) => {
  const id = c.req.param('id');
  if (id === 'default') {
    return c.json({ error: 'Default category cannot be deleted' }, 400);
  }

  await c.env.DB.prepare('UPDATE emails SET category_id = ? WHERE category_id = ?')
    .bind('default', id)
    .run();
  const movedEmails = await c.env.DB.prepare('SELECT changes() as moved').first();

  await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

  return c.json({ success: true, moved_emails: movedEmails?.moved || 0 });
});

categories.put('/reorder', async (c) => {
  const body = await c.req.json();
  if (!Array.isArray(body?.orders)) {
    return c.json({ error: 'Orders required' }, 400);
  }

  const stmt = c.env.DB.batch(
    body.orders.map((order: any) =>
      c.env.DB.prepare(
        'UPDATE categories SET parent_id = ?, sort_order = ?, updated_at = ? WHERE id = ?'
      ).bind(order.parent_id ?? null, order.sort_order ?? 0, nowIso(), order.id)
    )
  );

  await stmt;
  return c.json({ success: true });
});

export default categories;
