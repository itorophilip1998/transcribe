import type { ChatRequest, LLMProvider } from './types';

export function createAnthropicProvider(apiKey: string, model: string): LLMProvider {
  return {
    id: 'anthropic',
    async chat({ system, user }: ChatRequest): Promise<string> {
      if (!apiKey) throw new Error('Anthropic API key is not configured');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          system,
          messages: [{ role: 'user', content: user }],
        }),
      });
      if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
      const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
      return data.content?.find((c) => c.type === 'text')?.text ?? '';
    },
  };
}
