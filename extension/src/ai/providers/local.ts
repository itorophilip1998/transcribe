import type { ChatRequest, LLMProvider } from './types';

/** OpenAI-compatible local server (Ollama, LM Studio, vLLM, etc.) */
export function createLocalProvider(
  baseUrl: string,
  apiKey: string,
  model: string,
): LLMProvider {
  return {
    id: 'local',
    async chat({ system, user }: ChatRequest): Promise<string> {
      if (!baseUrl) throw new Error('Local model URL is not configured');
      const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      });
      if (!res.ok) throw new Error(`Local model error: ${res.status} ${await res.text()}`);
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content ?? '';
    },
  };
}
