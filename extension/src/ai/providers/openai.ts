import type { ChatRequest, LLMProvider } from './types';

export function createOpenAIProvider(apiKey: string, model: string): LLMProvider {
  return {
    id: 'openai',
    async chat({ system, user }: ChatRequest): Promise<string> {
      if (!apiKey) throw new Error('OpenAI API key is not configured');
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
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
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content ?? '';
    },
  };
}
