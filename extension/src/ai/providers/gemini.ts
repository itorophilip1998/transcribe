import type { ChatRequest, LLMProvider } from './types';

export function createGeminiProvider(apiKey: string, model: string): LLMProvider {
  return {
    id: 'gemini',
    async chat({ system, user }: ChatRequest): Promise<string> {
      if (!apiKey) throw new Error('Gemini API key is not configured');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });
      if (!res.ok) throw new Error(`Gemini error: ${res.status} ${await res.text()}`);
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    },
  };
}
