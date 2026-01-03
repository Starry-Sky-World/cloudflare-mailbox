import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const emails = new Hono<{ Bindings: Env }>();

emails.use('*', authMiddleware);

emails.get('/', async (c) => {
  const categoryId = c.req.query('category_id');
  const isRead = c.req.query('is_read');
  const isStarred = c.req.query('is_starred');
  const search = c.req.query('search');
  const page = Number.parseInt(c.req.query('page') || '1', 10);
  const limit = Math.min(Number.parseInt(c.req.query('limit') || '20', 10), 100);
  const offset = (page - 1) * limit;

  const filters: string[] = [];
  const bindings: unknown[] = [];

  if (categoryId) {
    filters.push('emails.category_id = ?');
    bindings.push(categoryId);
  }
  if (isRead === '0' || isRead === '1') {
    filters.push('emails.is_read = ?');
    bindings.push(Number.parseInt(isRead, 10));
  }
  if (isStarred === '0' || isStarred === '1') {
    filters.push('emails.is_starred = ?');
    bindings.push(Number.parseInt(isStarred, 10));
  }

  let whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  let searchJoin = '';

  if (search) {
    searchJoin = 'JOIN emails_fts ON emails_fts.rowid = emails.rowid';
    const searchCondition = 'emails_fts MATCH ?';
    whereClause = whereClause ? `${whereClause} AND ${searchCondition}` : `WHERE ${searchCondition}`;
    bindings.push(search);
  }

  const totalQuery = `SELECT COUNT(*) as total FROM emails ${searchJoin} ${whereClause}`;
  const totalResult = await c.env.DB.prepare(totalQuery).bind(...bindings).first();
  const total = (totalResult?.total as number) || 0;

  const listQuery = `
    SELECT id, from_address, from_name, to_address, subject,
      substr(body_text, 1, 100) as preview,
      category_id, is_read, is_starred, received_at
    FROM emails
    ${searchJoin}
    ${whereClause}
    ORDER BY received_at DESC
    LIMIT ? OFFSET ?
  `;

  const listBindings = bindings.concat([limit, offset]);
  const result = await c.env.DB.prepare(listQuery).bind(...listBindings).all();

  return c.json({
    emails: result.results,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

emails.get('/stats', async (c) => {
  const totalResult = await c.env.DB.prepare('SELECT COUNT(*) as total FROM emails').first();
  const unreadResult = await c.env.DB.prepare('SELECT COUNT(*) as unread FROM emails WHERE is_read = 0').first();
  const categoryResult = await c.env.DB.prepare(
    `SELECT category_id,
      COUNT(*) as total,
      SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread
     FROM emails
     GROUP BY category_id`
  ).all();

  const byCategory: Record<string, { total: number; unread: number }> = {};
  for (const row of categoryResult.results) {
    byCategory[row.category_id as string] = {
      total: row.total as number,
      unread: (row.unread as number) || 0,
    };
  }

  return c.json({
    total: (totalResult?.total as number) || 0,
    unread: (unreadResult?.unread as number) || 0,
    by_category: byCategory,
  });
});

emails.get('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await c.env.DB.prepare('SELECT * FROM emails WHERE id = ?').bind(id).first();
  if (!result) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json(result);
});

emails.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (typeof body.is_read === 'boolean') {
    updates.push('is_read = ?');
    bindings.push(body.is_read ? 1 : 0);
  }
  if (typeof body.is_starred === 'boolean') {
    updates.push('is_starred = ?');
    bindings.push(body.is_starred ? 1 : 0);
  }
  if (typeof body.category_id === 'string') {
    updates.push('category_id = ?');
    bindings.push(body.category_id);
  }

  if (!updates.length) {
    return c.json({ error: 'No updates' }, 400);
  }

  bindings.push(id);
  await c.env.DB.prepare(`UPDATE emails SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
  return c.json({ success: true });
});

emails.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM emails WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

export default emails;
