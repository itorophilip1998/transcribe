# Transcribe / AI Meeting Assistant

This repo contains:

- [`extension/`](extension/) — **Chrome Meeting Assistant MVP** (active)
- [`note.html`](note.html) — earlier single-page browser prototype
- [`docs/`](docs/) — longer-term product/architecture notes

## Quick start (Chrome extension)

```bash
cd extension
npm install
npm run build
```

Then in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `extension/dist`
4. Open settings and add an AI provider API key
5. Join a Google Meet call and use the floating 🤖 assistant

See [`extension/README.md`](extension/README.md) for details.
