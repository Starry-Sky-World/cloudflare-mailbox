export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  RECOVERY_KEY?: string;
  ASSETS: Fetcher;
}

export interface Config {
  initialized: boolean;
  password_hash: string;
  recovery_key_hash?: string;
  jwt_secret: string;
  ai: {
    enabled: boolean;
    endpoint: string;
    api_key: string;
    model: string;
    timeout: number;
    max_tokens: number;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Pipeline {
  nodes: PipelineNode[];
  updated_at: string;
}

export interface BaseNode {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
}

export interface EntryNode extends BaseNode {
  type: 'entry';
  locked: true;
}

export interface RecipientNode extends BaseNode {
  type: 'recipient';
  config: {
    rules: {
      pattern: string;
      category_id: string | null;
    }[];
    fallback: 'continue' | 'default';
  };
}

export interface RegexNode extends BaseNode {
  type: 'regex';
  config: {
    field: 'subject' | 'from' | 'to' | 'body';
    pattern: string;
    flags: string;
    category_id: string;
  };
}

export interface KeywordNode extends BaseNode {
  type: 'keyword';
  config: {
    field: 'subject' | 'from' | 'to' | 'body';
    mode: 'any' | 'all';
    keywords: string[];
    category_id: string;
  };
}

export interface AINode extends BaseNode {
  type: 'ai';
  config: {
    candidate_categories: string[];
    custom_prompt: string;
  };
}

export interface DefaultNode extends BaseNode {
  type: 'default';
  locked: true;
  category_id: 'default';
}

export type PipelineNode =
  | EntryNode
  | RecipientNode
  | RegexNode
  | KeywordNode
  | AINode
  | DefaultNode;

export interface EmailInput {
  from_address: string;
  from_name: string | null;
  to_address: string;
  subject: string;
  body_text: string;
}

export interface ClassifyResult {
  category_id: string;
  node_id: string | null;
  node_name: string | null;
  trace?: {
    node_id: string;
    node_name: string;
    result: 'matched' | 'not_matched' | 'skipped' | 'error';
    details?: string;
  }[];
}
