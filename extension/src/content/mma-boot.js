/**
 * Vanilla bootstrap — always injects a visible panel even if the React bundle fails.
 */
(function () {
  if (!location.hostname.includes('meet.google.com')) return;
  if (document.getElementById('mma-boot-fab') || document.getElementById('mma-boot-panel')) return;

  function looksLikeCall() {
    const path = location.pathname;
    return /^\/[a-z0-9]{3,}-[a-z0-9]{3,}-[a-z0-9]{3,}/i.test(path);
  }

  const fab = document.createElement('button');
  fab.id = 'mma-boot-fab';
  fab.type = 'button';
  fab.textContent = '🤖';
  fab.title = 'AI Meeting Assistant';
  Object.assign(fab.style, {
    position: 'fixed',
    top: '24px',
    left: '24px',
    zIndex: '2147483647',
    width: '52px',
    height: '52px',
    borderRadius: '999px',
    border: 'none',
    background: '#0f172a',
    color: '#fff',
    fontSize: '22px',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(15,23,42,0.4)',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
  });

  const panel = document.createElement('div');
  panel.id = 'mma-boot-panel';
  Object.assign(panel.style, {
    position: 'fixed',
    top: '24px',
    left: '24px',
    zIndex: '2147483647',
    width: '300px',
    background: '#f8fafc',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '14px',
    boxShadow: '0 16px 40px rgba(15,23,42,0.28)',
    padding: '14px',
    fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif',
    fontSize: '13px',
  });
  panel.innerHTML = [
    '<div style="font-weight:700;margin-bottom:8px">AI Meeting Assistant</div>',
    '<div style="margin-bottom:8px;color:#64748b">Google Meet detected</div>',
    '<div id="mma-boot-status" style="margin-bottom:10px;color:#334155;font-size:12px">Waiting for call…</div>',
    '<button id="mma-boot-start" style="width:100%;border:none;background:#2563eb;color:#fff;border-radius:8px;padding:10px;font-weight:600;cursor:pointer">Start Assistant</button>',
  ].join('');

  async function startAssistant() {
    const status = panel.querySelector('#mma-boot-status');
    if (status) status.textContent = 'Starting…';
    try {
      const meta = {
        provider: 'Google Meet',
        url: location.href,
        title: document.title.replace(' - Google Meet', '').trim() || undefined,
      };
      const res = await chrome.runtime.sendMessage({
        type: 'START_ASSISTANT_FROM_CONTENT',
        meta,
      });
      if (res?.ok === false || res?.error) {
        throw new Error(res?.error || 'Failed to start');
      }
      if (status) status.textContent = 'Listening';
    } catch (err) {
      if (status) {
        status.textContent =
          (err instanceof Error ? err.message : String(err)) +
          ' — click Start (Chrome may require one click for mic).';
      }
    }
  }

  panel.querySelector('#mma-boot-start')?.addEventListener('click', () => {
    void startAssistant();
  });

  fab.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  const attach = () => {
    const root = document.documentElement || document.body;
    if (!root) return;
    if (!document.getElementById('mma-boot-panel')) root.appendChild(panel);
    if (!document.getElementById('mma-boot-fab')) root.appendChild(fab);
  };

  if (document.documentElement) attach();
  else document.addEventListener('DOMContentLoaded', attach);

  let autoTried = false;
  setInterval(() => {
    attach();
    if (autoTried) return;
    if (!looksLikeCall()) return;
    autoTried = true;
    const status = panel.querySelector('#mma-boot-status');
    if (status) status.textContent = 'Call detected — auto-starting…';
    void startAssistant();
  }, 1500);

  console.log('[mma] boot panel injected');
})();
