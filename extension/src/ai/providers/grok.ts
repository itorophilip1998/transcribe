import type { ChatRequest, LLMProvider } from './types';

export function createGrokProvider(apiKey: string, model: string): LLMProvider {
  return {
    id: 'grok',
    async chat({ system, user }: ChatRequest): Promise<string> {
      if (!apiKey) throw new Error('Grok API key is not configured');
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      });
      if (!res.ok) throw new Error(`Grok error: ${res.status} ${await res.text()}`);
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content ?? '';
    },
  };
}
