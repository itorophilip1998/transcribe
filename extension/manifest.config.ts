import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from './package.json' with { type: 'json' };

const { version } = packageJson;

export default defineManifest({
  manifest_version: 3,
  name: 'AI Meeting Assistant',
  description:
    'Detect Google Meet, capture meeting audio, transcribe locally, and summarize with your AI provider.',
  version,
  action: {
    default_title: 'AI Meeting Assistant',
    default_popup: 'src/popup/index.html',
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://meet.google.com/*'],
      js: ['src/content/mma-boot.js', 'src/content/meet-detector.tsx'],
      run_at: 'document_idle',
    },
  ],
  permissions: ['tabCapture', 'offscreen', 'storage', 'activeTab', 'tabs'],
  host_permissions: [
    'https://meet.google.com/*',
    'https://api.openai.com/*',
    'https://api.anthropic.com/*',
    'https://generativelanguage.googleapis.com/*',
    'https://api.x.ai/*',
    'https://*.openai.azure.com/*',
    'https://huggingface.co/*',
    'https://*.huggingface.co/*',
    'https://cdn.jsdelivr.net/*',
    'http://localhost/*',
    'http://127.0.0.1/*',
  ],
  web_accessible_resources: [
    {
      resources: ['assets/*', 'worklets/*'],
      matches: ['<all_urls>'],
    },
  ],
  icons: {
    '16': 'icons/icon16.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
  content_security_policy: {
    extension_pages:
      "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; worker-src 'self'",
  },
});
