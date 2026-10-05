import type { ChatRequest, LLMProvider } from './types';

/** Azure OpenAI / GitHub Copilot-compatible chat completions endpoint */
export function createCopilotProvider(
  apiKey: string,
  endpoint: string,
  deployment: string,
): LLMProvider {
  return {
    id: 'copilot',
    async chat({ system, user }: ChatRequest): Promise<string> {
      if (!apiKey) throw new Error('Copilot API key is not configured');
      if (!endpoint) throw new Error('Copilot endpoint is not configured');

      const base = endpoint.replace(/\/$/, '');
      const url = base.includes('/openai/deployments')
        ? `${base}/chat/completions?api-version=2024-02-15-preview`
        : `${base}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) throw new Error(`Copilot error: ${res.status} ${await res.text()}`);
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content ?? '';
    },
  };
}
