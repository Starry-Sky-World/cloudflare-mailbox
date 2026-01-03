import type { EmailMessage } from '@cloudflare/workers-types';
import type { Env } from './types';
import { parseRawEmail } from './services/mail-parser';
import { Classifier } from './services/classifier';
import { defaultPipeline, generateId } from './utils/helpers';
import { ensureDb } from './utils/db';

export async function email(message: EmailMessage, env: Env, ctx: ExecutionContext) {
  try {
    await ensureDb(env);
  } catch (error) {
    console.error('DB init failed:', error);
    return;
  }
  const parsed = await parseRawEmail(message.raw);

  const mail = {
    message_id: parsed.messageId || message.headers?.get('message-id') || generateId(),
    from_address: message.from,
    from_name: parsed.from?.name || null,
    to_address: message.to,
    reply_to: parsed.replyTo?.[0]?.address || null,
    subject: parsed.subject || '(无主题)',
    body_text: parsed.text || '',
    body_html: parsed.html || null,
    received_at: new Date().toISOString(),
  };

  const pipeline = (await env.KV.get('pipeline', 'json')) || defaultPipeline();
  const classifier = new Classifier(pipeline, env);

  const classifyPromise = classifier.classify({
    from_address: mail.from_address,
    from_name: mail.from_name,
    to_address: mail.to_address,
    subject: mail.subject,
    body_text: mail.body_text,
  });

  ctx.waitUntil(
    classifyPromise.then(async (result) => {
      const id = generateId();
      await env.DB.prepare(
        `INSERT INTO emails (
          id, message_id, from_address, from_name, to_address,
          reply_to, subject, body_text, body_html,
          category_id, matched_node_id, matched_node_name, received_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          mail.message_id,
          mail.from_address,
          mail.from_name,
          mail.to_address,
          mail.reply_to,
          mail.subject,
          mail.body_text,
          mail.body_html,
          result.category_id,
          result.node_id,
          result.node_name,
          mail.received_at
        )
        .run();
    })
  );
}
