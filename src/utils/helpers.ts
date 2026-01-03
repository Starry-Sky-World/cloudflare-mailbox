import { Config, Pipeline } from '../types';

export function generateId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export async function getConfig(env: { KV: KVNamespace }) {
  return (await env.KV.get('config', 'json')) as Config | null;
}

export async function saveConfig(env: { KV: KVNamespace }, config: Config) {
  await env.KV.put('config', JSON.stringify(config));
}

export function defaultPipeline(): Pipeline {
  return {
    nodes: [
      {
        id: 'entry',
        type: 'entry',
        name: '邮件入口',
        enabled: true,
        locked: true,
      },
      {
        id: 'default',
        type: 'default',
        name: '默认分类',
        enabled: true,
        locked: true,
        category_id: 'default',
      },
    ],
    updated_at: nowIso(),
  };
}
