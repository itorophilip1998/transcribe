# AI Meeting Assistant (Chrome Extension)

Minimal Manifest V3 Chrome extension that:

1. Detects Google Meet pages
2. Shows a floating AI assistant
3. Captures tab audio + microphone separately
4. Transcribes locally with Transformers.js Whisper
5. Summarizes via configurable AI providers
6. Lets you copy/download transcript + summary

## Setup

```bash
cd extension
npm install
npm run build
```

Load unpacked in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `extension/dist`

For development with HMR:

```bash
npm run dev
```

Then load `extension/dist` (CRXJS writes there during dev).

## Usage

1. Open **Settings** from the extension popup and add an AI provider API key
2. Join a Google Meet call (`https://meet.google.com/...`)
3. Click the floating 🤖 button
4. Press **Start Assistant** and allow microphone access
5. Watch the live transcript; use **Summary** / **Notes** when ready
6. **Copy** or **Download** transcript, summary, and `meeting.json`

## AI providers

- OpenAI — API key
- Anthropic — API key
- Gemini — API key
- Copilot — Azure OpenAI endpoint + key + deployment
- Grok — xAI API key
- Local model — OpenAI-compatible base URL + optional API key

API keys are stored only in `chrome.storage.local`.

## Notes

- The assistant only injects on `meet.google.com`
- Tab audio and mic stay separate (`You` vs `Other speakers`)
- Whisper Tiny/Base downloads on first use and runs in a Web Worker
- No login, backend, or cloud storage in this MVP
