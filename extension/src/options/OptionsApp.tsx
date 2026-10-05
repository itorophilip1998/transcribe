import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../shared/storage';
import type { AIProviderId, ExtensionSettings, WhisperModelSize } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';

const PROVIDERS: { id: AIProviderId; label: string }[] = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'copilot', label: 'Copilot (Azure OpenAI)' },
  { id: 'grok', label: 'Grok (xAI)' },
  { id: 'local', label: 'Local Model' },
];

export function OptionsApp() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  const update = <K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const onSave = async () => {
    try {
      setError(null);
      if (settings.provider === 'local' && settings.localBaseUrl) {
        try {
          const origin = new URL(settings.localBaseUrl).origin + '/*';
          await chrome.permissions.request({ origins: [origin] });
        } catch {
          /* optional permission may be denied; still save */
        }
      }
      await saveSettings(settings);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="opts">
      <header>
        <h1>AI Meeting Assistant</h1>
        <p>Configure local Whisper transcription and your AI summary provider.</p>
      </header>

      <section>
        <h2>Transcription</h2>
        <label>
          Whisper model
          <select
            value={settings.whisperModel}
            onChange={(e) => update('whisperModel', e.target.value as WhisperModelSize)}
          >
            <option value="tiny">Tiny (faster, English)</option>
            <option value="base">Base (better quality, English)</option>
          </select>
        </label>
        <p className="hint">Models download on first use and run locally in a Web Worker.</p>
      </section>

      <section>
        <h2>AI Summary Provider</h2>
        <label>
          Provider
          <select
            value={settings.provider}
            onChange={(e) => update('provider', e.target.value as AIProviderId)}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {settings.provider === 'openai' && (
          <>
            <label>
              OpenAI API key
              <input
                type="password"
                value={settings.openaiApiKey}
                onChange={(e) => update('openaiApiKey', e.target.value)}
                placeholder="sk-..."
              />
            </label>
            <label>
              Model
              <input
                value={settings.openaiModel}
                onChange={(e) => update('openaiModel', e.target.value)}
              />
            </label>
          </>
        )}

        {settings.provider === 'anthropic' && (
          <>
            <label>
              Anthropic API key
              <input
                type="password"
                value={settings.anthropicApiKey}
                onChange={(e) => update('anthropicApiKey', e.target.value)}
                placeholder="sk-ant-..."
              />
            </label>
            <label>
              Model
              <input
                value={settings.anthropicModel}
                onChange={(e) => update('anthropicModel', e.target.value)}
              />
            </label>
          </>
        )}

        {settings.provider === 'gemini' && (
          <>
            <label>
              Gemini API key
              <input
                type="password"
                value={settings.geminiApiKey}
                onChange={(e) => update('geminiApiKey', e.target.value)}
              />
            </label>
            <label>
              Model
              <input
                value={settings.geminiModel}
                onChange={(e) => update('geminiModel', e.target.value)}
              />
            </label>
          </>
        )}

        {settings.provider === 'copilot' && (
          <>
            <label>
              API key
              <input
                type="password"
                value={settings.copilotApiKey}
                onChange={(e) => update('copilotApiKey', e.target.value)}
              />
            </label>
            <label>
              Endpoint
              <input
                value={settings.copilotEndpoint}
                onChange={(e) => update('copilotEndpoint', e.target.value)}
                placeholder="https://YOUR_RESOURCE.openai.azure.com"
              />
            </label>
            <label>
              Deployment
              <input
                value={settings.copilotDeployment}
                onChange={(e) => update('copilotDeployment', e.target.value)}
              />
            </label>
          </>
        )}

        {settings.provider === 'grok' && (
          <>
            <label>
              Grok API key
              <input
                type="password"
                value={settings.grokApiKey}
                onChange={(e) => update('grokApiKey', e.target.value)}
              />
            </label>
            <label>
              Model
              <input
                value={settings.grokModel}
                onChange={(e) => update('grokModel', e.target.value)}
              />
            </label>
          </>
        )}

        {settings.provider === 'local' && (
          <>
            <label>
              Base URL
              <input
                value={settings.localBaseUrl}
                onChange={(e) => update('localBaseUrl', e.target.value)}
                placeholder="http://localhost:11434/v1"
              />
            </label>
            <label>
              API key (optional)
              <input
                type="password"
                value={settings.localApiKey}
                onChange={(e) => update('localApiKey', e.target.value)}
              />
            </label>
            <label>
              Model
              <input
                value={settings.localModel}
                onChange={(e) => update('localModel', e.target.value)}
              />
            </label>
            <p className="hint">OpenAI-compatible Chat Completions endpoint required.</p>
          </>
        )}
      </section>

      <footer>
        <button type="button" onClick={() => void onSave()}>
          Save settings
        </button>
        {saved && <span className="ok">Saved</span>}
        {error && <span className="err">{error}</span>}
      </footer>
    </div>
  );
}
