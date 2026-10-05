import { createRoot, type Root } from 'react-dom/client';
import { FloatingAssistant } from './floating-app/FloatingAssistant';
import floatingCss from './floating-app/floating.css?inline';

const ROOT_ID = 'mma-meeting-assistant-root';

let reactRoot: Root | null = null;

function hideBootUi(): void {
  document.getElementById('mma-boot-fab')?.remove();
  document.getElementById('mma-boot-panel')?.remove();
}

function mount(): void {
  if (!location.hostname.includes('meet.google.com')) return;

  let host = document.getElementById(ROOT_ID);
  if (host?.shadowRoot?.querySelector('[data-mma-mounted="1"]') && reactRoot) {
    hideBootUi();
    return;
  }

  if (!host) {
    host = document.createElement('div');
    host.id = ROOT_ID;
    document.documentElement.appendChild(host);
  }

  Object.assign(host.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '2147483646',
    pointerEvents: 'none',
    overflow: 'visible',
    margin: '0',
    padding: '0',
    border: 'none',
    background: 'transparent',
  });

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });

  if (!shadow.querySelector('style[data-mma-css]')) {
    const style = document.createElement('style');
    style.setAttribute('data-mma-css', '1');
    style.textContent = `
      :host { all: initial; }
      ${floatingCss}
      .mma-root { pointer-events: auto; }
    `;
    shadow.appendChild(style);
  }

  let mountPoint = shadow.querySelector<HTMLElement>('[data-mma-mounted="1"]');
  if (!mountPoint) {
    mountPoint = document.createElement('div');
    mountPoint.setAttribute('data-mma-mounted', '1');
    shadow.appendChild(mountPoint);
  }

  if (!reactRoot) {
    reactRoot = createRoot(mountPoint);
    reactRoot.render(<FloatingAssistant />);
    console.log('[mma] Google Meet detected — floating assistant mounted');
  }

  hideBootUi();
}

function ensureMounted(): void {
  try {
    mount();
  } catch (err) {
    console.error('[mma] failed to mount assistant', err);
  }
}

/** CRXJS content-script entry */
export function onExecute(): void {
  ensureMounted();
}

ensureMounted();

const observer = new MutationObserver(() => {
  if (!document.getElementById(ROOT_ID)) ensureMounted();
});
observer.observe(document.documentElement, { childList: true, subtree: false });

window.addEventListener('popstate', ensureMounted);
const pushState = history.pushState.bind(history);
history.pushState = (...args) => {
  pushState(...args);
  queueMicrotask(ensureMounted);
};
const replaceState = history.replaceState.bind(history);
history.replaceState = (...args) => {
  replaceState(...args);
  queueMicrotask(ensureMounted);
};

let tries = 0;
const retry = window.setInterval(() => {
  ensureMounted();
  tries += 1;
  if (tries >= 10) window.clearInterval(retry);
}, 1000);
