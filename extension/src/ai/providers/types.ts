export interface ChatRequest {
  system: string;
  user: string;
}

export interface LLMProvider {
  id: string;
  chat(request: ChatRequest): Promise<string>;
}
