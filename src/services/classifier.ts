import type {
  AINode,
  ClassifyResult,
  EmailInput,
  KeywordNode,
  Pipeline,
  PipelineNode,
  RecipientNode,
  RegexNode,
} from '../types';
import type { Env } from '../types';

export class Classifier {
  constructor(private pipeline: Pipeline, private env: Env) {}

  async classify(email: EmailInput, withTrace = false): Promise<ClassifyResult> {
    const nodes = this.pipeline.nodes.filter((node) => node.enabled);
    const trace: ClassifyResult['trace'] = [];

    for (const node of nodes) {
      if (node.type === 'entry' || node.type === 'default') {
        if (withTrace) {
          trace?.push({
            node_id: node.id,
            node_name: node.name,
            result: 'skipped',
          });
        }
        continue;
      }

      try {
        const result = await this.processNode(node as PipelineNode, email);
        if (result) {
          if (withTrace) {
            trace?.push({
              node_id: node.id,
              node_name: node.name,
              result: 'matched',
            });
          }
          return {
            category_id: result,
            node_id: node.id,
            node_name: node.name,
            trace: withTrace ? trace : undefined,
          };
        }
        if (withTrace) {
          trace?.push({
            node_id: node.id,
            node_name: node.name,
            result: 'not_matched',
          });
        }
      } catch (error) {
        console.error(`Node ${node.id} error:`, error);
        if (withTrace) {
          trace?.push({
            node_id: node.id,
            node_name: node.name,
            result: 'error',
            details: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return {
      category_id: 'default',
      node_id: null,
      node_name: null,
      trace: withTrace ? trace : undefined,
    };
  }

  private async processNode(node: PipelineNode, email: EmailInput) {
    switch (node.type) {
      case 'recipient':
        return this.processRecipient(node, email);
      case 'regex':
        return this.processRegex(node, email);
      case 'keyword':
        return this.processKeyword(node, email);
      case 'ai':
        return this.processAI(node, email);
      default:
        return null;
    }
  }

  private processRecipient(node: RecipientNode, email: EmailInput) {
    for (const rule of node.config.rules) {
      if (this.matchPattern(rule.pattern, email.to_address)) {
        return rule.category_id;
      }
    }
    return node.config.fallback === 'default' ? 'default' : null;
  }

  private processRegex(node: RegexNode, email: EmailInput) {
    const field = this.getField(node.config.field, email);
    const regex = new RegExp(node.config.pattern, node.config.flags || '');
    return regex.test(field) ? node.config.category_id : null;
  }

  private processKeyword(node: KeywordNode, email: EmailInput) {
    const field = this.getField(node.config.field, email).toLowerCase();
    const keywords = node.config.keywords.map((keyword) => keyword.toLowerCase());
    const matches = keywords.filter((keyword) => field.includes(keyword));

    if (node.config.mode === 'any' && matches.length > 0) {
      return node.config.category_id;
    }
    if (node.config.mode === 'all' && matches.length === keywords.length) {
      return node.config.category_id;
    }
    return null;
  }

  private async processAI(node: AINode, email: EmailInput) {
    const config = (await this.env.KV.get('config', 'json')) as
      | { ai?: { enabled: boolean; endpoint: string; api_key: string; model: string; timeout: number; max_tokens: number } }
      | null;
    if (!config?.ai?.enabled) return null;

    const categories = await this.getCategoryNames(node.config.candidate_categories);
    if (!categories.length) return null;

    const prompt = this.buildAIPrompt(email, categories, node.config.custom_prompt);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.ai.timeout || 15000);

    try {
      const response = await fetch(config.ai.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.ai.api_key}`,
        },
        body: JSON.stringify({
          model: config.ai.model,
          messages: [
            {
              role: 'system',
              content: 'You are an email classifier. Respond with only the category name, nothing else.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: config.ai.max_tokens || 50,
          temperature: 0,
        }),
        signal: controller.signal,
      });

      const data = (await response.json()) as any;
      const answer = data?.choices?.[0]?.message?.content?.trim();
      const matched = categories.find(
        (category) => category.name.toLowerCase() === (answer || '').toLowerCase()
      );
      return matched?.id || null;
    } catch (error) {
      console.error('AI classification error:', error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildAIPrompt(
    email: EmailInput,
    categories: { id: string; name: string }[],
    customPrompt: string
  ) {
    const categoryList = categories.map((category) => category.name).join(', ');
    let prompt = customPrompt || '';
    prompt += `\n\nClassify the following email into one of these categories: ${categoryList}\n\n`;
    prompt += `From: ${email.from_name || email.from_address}\n`;
    prompt += `To: ${email.to_address}\n`;
    prompt += `Subject: ${email.subject}\n`;
    prompt += `Body:\n${email.body_text.slice(0, 1000)}`;
    return prompt;
  }

  private matchPattern(pattern: string, value: string) {
    const escaped = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${escaped}$`, 'i');
    return regex.test(value);
  }

  private getField(field: string, email: EmailInput) {
    switch (field) {
      case 'subject':
        return email.subject || '';
      case 'from':
        return `${email.from_name || ''} ${email.from_address}`;
      case 'to':
        return email.to_address;
      case 'body':
        return email.body_text || '';
      default:
        return '';
    }
  }

  private async getCategoryNames(ids: string[]) {
    if (!ids.length) return [];
    const placeholders = ids.map(() => '?').join(',');
    const result = await this.env.DB.prepare(
      `SELECT id, name FROM categories WHERE id IN (${placeholders})`
    )
      .bind(...ids)
      .all();
    return result.results as { id: string; name: string }[];
  }
}
