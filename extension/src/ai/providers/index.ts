import type { ExtensionSettings } from '../../shared/types';
import { createAnthropicProvider } from './anthropic';
import { createCopilotProvider } from './copilot';
import { createGeminiProvider } from './gemini';
import { createGrokProvider } from './grok';
import { createLocalProvider } from './local';
import { createOpenAIProvider } from './openai';
import type { LLMProvider } from './types';

export function createProviderFromSettings(settings: ExtensionSettings): LLMProvider {
  switch (settings.provider) {
    case 'openai':
      return createOpenAIProvider(settings.openaiApiKey, settings.openaiModel);
    case 'anthropic':
      return createAnthropicProvider(settings.anthropicApiKey, settings.anthropicModel);
    case 'gemini':
      return createGeminiProvider(settings.geminiApiKey, settings.geminiModel);
    case 'copilot':
      return createCopilotProvider(
        settings.copilotApiKey,
        settings.copilotEndpoint,
        settings.copilotDeployment,
      );
    case 'grok':
      return createGrokProvider(settings.grokApiKey, settings.grokModel);
    case 'local':
      return createLocalProvider(settings.localBaseUrl, settings.localApiKey, settings.localModel);
    default:
      throw new Error(`Unknown provider: ${settings.provider as string}`);
  }
}
