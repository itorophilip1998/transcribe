import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  buildMeetingJson,
  copyText,
  downloadText,
  formatElapsed,
  formatSegmentTime,
  summaryToMarkdown,
  transcriptToMarkdown,
  transcriptToText,
} from '../../shared/export';
import { getPosition, savePosition } from '../../shared/storage';
import type {
  ExtensionMessage,
  FloatingPosition,
  MeetingMeta,
  MeetingSummary,
  SessionState,
  TranscriptSegment,
} from '../../shared/types';
import { DEFAULT_SESSION } from '../../shared/types';
import './floating.css';

type TabId = 'transcript' | 'summary' | 'notes';

function getMeetTitle(): string | undefined {
  const el =
    document.querySelector('[data-meeting-title]') ||
    document.querySelector('[data-call-title]') ||
    document.querySelector('div[role="heading"]');
  const text = el?.textContent?.trim();
  return text || document.title.replace(' - Google Meet', '').trim() || undefined;
}

/** Best-effort: user is in an active Meet call (not just lobby/pre-join). */
function isInActiveMeetCall(): boolean {
  const path = location.pathname;
  // Meeting codes look like /abc-defg-hij (not /landing, /new, etc.)
  const looksLikeMeetingCode = /^\/[a-z0-9]{3,}-[a-z0-9]{3,}-[a-z0-9]{3,}(\/.*)?$/i.test(path);

  const leaveBtn =
    document.querySelector('button[aria-label*="Leave call" i]') ||
    document.querySelector('button[aria-label*="Leave meeting" i]') ||
    document.querySelector('[data-call-ended]');

  const callControls =
    document.querySelector('button[aria-label*="microphone" i]') ||
    document.querySelector('button[aria-label*="Turn off microphone" i]') ||
    document.querySelector('button[aria-label*="Turn on microphone" i]');

  // Pre-join screen usually has "Ask to join" / "Join now"
  const preJoin =
    document.querySelector('button[aria-label*="Ask to join" i]') ||
    Array.from(document.querySelectorAll('button')).some((b) =>
      /^(Join now|Ask to join)$/i.test(b.textContent?.trim() || ''),
    );

  if (preJoin && !leaveBtn) return false;
  return Boolean(leaveBtn || (looksLikeMeetingCode && callControls) || looksLikeMeetingCode);
}

export function FloatingAssistant() {
  const [position, setPosition] = useState<FloatingPosition>({
    x: 24,
    y: 24,
    width: 340,
    height: 480,
    collapsed: false,
  });
  const [session, setSession] = useState<SessionState>(DEFAULT_SESSION);
  const [tab, setTab] = useState<TabId>('transcript');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [autoStartBlocked, setAutoStartBlocked] = useState(false);
  const dragRef = useRef<{ ox: number; oy: number; px: number; py: number } | null>(null);
  const resizeRef = useRef<{ ox: number; oy: number; w: number; h: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);
  const autoStartedRef = useRef(false);
  const sessionStatusRef = useRef(session.status);
  positionRef.current = position;
  sessionStatusRef.current = session.status;

  useEffect(() => {
    void getPosition().then((saved) => {
      // Always open expanded on Meet so the user sees it immediately
      setPosition({ ...saved, collapsed: false });
    });
  }, []);

  useEffect(() => {
    const onMessage = (message: ExtensionMessage) => {
      if (message.type === 'SESSION_STATE') setSession(message.state);
      if (message.type === 'TRANSCRIPT_SEGMENT') {
        setSession((prev) => ({ ...prev, segments: [...prev.segments, message.segment] }));
      }
      if (message.type === 'ELAPSED_UPDATE') {
        setSession((prev) => ({ ...prev, elapsedMs: message.elapsedMs }));
      }
      if (message.type === 'MODEL_STATUS') {
        setSession((prev) => ({
          ...prev,
          modelLoading: message.loading,
          modelReady: message.ready,
        }));
      }
      if (message.type === 'STATUS_UPDATE') {
        setSession((prev) => ({ ...prev, status: message.status, error: message.error }));
      }
    };
    chrome.runtime.onMessage.addListener(onMessage);
    chrome.runtime.sendMessage({ type: 'GET_SESSION_STATE' }).then((state: SessionState) => {
      if (state) setSession(state);
    });
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  const persistPosition = useCallback((next: FloatingPosition) => {
    setPosition(next);
    void savePosition(next);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const onDragStart = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, textarea, .mma-resize')) return;
    dragRef.current = {
      ox: e.clientX,
      oy: e.clientY,
      px: positionRef.current.x,
      py: positionRef.current.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.ox;
      const dy = e.clientY - dragRef.current.oy;
      setPosition((p) => ({
        ...p,
        x: Math.max(0, dragRef.current!.px + dx),
        y: Math.max(0, dragRef.current!.py + dy),
      }));
    }
    if (resizeRef.current) {
      const dw = e.clientX - resizeRef.current.ox;
      const dh = e.clientY - resizeRef.current.oy;
      setPosition((p) => ({
        ...p,
        width: Math.max(280, resizeRef.current!.w + dw),
        height: Math.max(320, resizeRef.current!.h + dh),
      }));
    }
  };

  const onPointerUp = () => {
    if (dragRef.current || resizeRef.current) {
      persistPosition(positionRef.current);
    }
    dragRef.current = null;
    resizeRef.current = null;
  };

  const startAssistant = async () => {
    setBusy(true);
    try {
      const meta: MeetingMeta = {
        provider: 'Google Meet',
        url: location.href,
        title: getMeetTitle(),
      };

      const response = await chrome.runtime.sendMessage({
        type: 'START_ASSISTANT_FROM_CONTENT',
        meta,
      });

      if (response?.error || response?.ok === false) {
        throw new Error(response?.error || 'Failed to start');
      }
      if (response?.state) setSession(response.state);
      setAutoStartBlocked(false);
      setPosition((p) => {
        const next = { ...p, collapsed: false };
        void savePosition(next);
        return next;
      });
      setTab('transcript');
    } catch (err) {
      autoStartedRef.current = false;
      setAutoStartBlocked(true);
      showToast(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  // Auto-open + auto-start when the user joins an active Meet call
  useEffect(() => {
    const tryAutoStart = () => {
      if (autoStartedRef.current) return;
      if (sessionStatusRef.current === 'listening' || sessionStatusRef.current === 'starting') return;
      if (!isInActiveMeetCall()) return;

      autoStartedRef.current = true;
      setPosition((p) => ({ ...p, collapsed: false }));
      void startAssistant();
    };

    tryAutoStart();
    const id = window.setInterval(tryAutoStart, 1500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pause = async () => {
    await chrome.runtime.sendMessage({ type: 'PAUSE_ASSISTANT' });
  };
  const resume = async () => {
    await chrome.runtime.sendMessage({ type: 'RESUME_ASSISTANT' });
  };
  const stop = async () => {
    setBusy(true);
    try {
      const res = await chrome.runtime.sendMessage({ type: 'STOP_ASSISTANT' });
      if (res?.state) setSession(res.state);
      setTab('summary');
    } finally {
      setBusy(false);
    }
  };

  const summarize = async () => {
    if (!session.meta) return;
    setBusy(true);
    try {
      const res = (await chrome.runtime.sendMessage({
        type: 'SUMMARIZE_REQUEST',
        segments: session.segments,
        meta: session.meta,
      })) as { summary?: MeetingSummary | null; error?: string };
      if (res.error) throw new Error(res.error);
      if (res.summary) setSession((s) => ({ ...s, summary: res.summary! }));
      showToast('Summary ready');
    } catch (err) {
      showToast(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const exportAll = async () => {
    if (!session.meta) return;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadText(`transcript-${stamp}.txt`, transcriptToText(session.segments));
    downloadText(`transcript-${stamp}.md`, transcriptToMarkdown(session.segments), 'text/markdown');
    if (session.summary) {
      downloadText(`summary-${stamp}.md`, summaryToMarkdown(session.summary), 'text/markdown');
    }
    downloadText(
      `meeting-${stamp}.json`,
      buildMeetingJson(session.meta, session.segments, session.summary, session.elapsedMs),
      'application/json',
    );
    showToast('Downloaded');
  };

  const copyAll = async () => {
    const parts = [transcriptToMarkdown(session.segments)];
    if (session.summary) parts.push(summaryToMarkdown(session.summary));
    await copyText(parts.join('\n\n---\n\n'));
    showToast('Copied');
  };

  const listening = session.status === 'listening';
  const paused = session.status === 'paused';
  const active = listening || paused || session.status === 'starting';

  if (position.collapsed) {
    return (
      <div
        ref={rootRef}
        className="mma-root mma-collapsed"
        style={{ left: position.x, top: position.y }}
        onPointerDown={onDragStart}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <button
          type="button"
          className="mma-fab"
          onClick={() => persistPosition({ ...position, collapsed: false })}
          title="AI Meeting Assistant"
        >
          <span className="mma-fab-emoji">🤖</span>
          {active && <span className={`mma-dot ${paused ? 'paused' : 'live'}`} />}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="mma-root mma-panel"
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <header className="mma-header" onPointerDown={onDragStart}>
        <div className="mma-title">
          <span>AI Meeting Assistant</span>
          {active && <span className={`mma-dot ${paused ? 'paused' : 'live'}`} />}
        </div>
        <div className="mma-header-actions">
          <button
            type="button"
            className="mma-icon-btn"
            onClick={() => persistPosition({ ...position, collapsed: true })}
            title="Minimize"
          >
            ─
          </button>
          <button
            type="button"
            className="mma-icon-btn"
            onClick={() => persistPosition({ ...position, collapsed: true })}
            title="Close"
          >
            ×
          </button>
        </div>
      </header>

      <div className="mma-body">
        {!active && session.status !== 'error' && (
          <div className="mma-idle">
            <div className="mma-status-line">
              <span className="mma-dot live" /> Meeting detected
            </div>
            <div className="mma-provider">Google Meet</div>
            <div className="mma-url" title={location.href}>
              {location.pathname.replace(/^\//, '') || 'meet.google.com'}
            </div>
            <p className="mma-hint">
              {autoStartBlocked
                ? 'Chrome needs one click to allow microphone / tab audio. Press Start once.'
                : 'Joining a call auto-starts listening. You can also start manually.'}
            </p>
            <button type="button" className="mma-primary" disabled={busy} onClick={() => void startAssistant()}>
              {busy ? 'Starting…' : autoStartBlocked ? 'Allow & Start' : 'Start Assistant'}
            </button>
            <button
              type="button"
              className="mma-link"
              onClick={() => chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' })}
            >
              Settings
            </button>
          </div>
        )}

        {session.status === 'error' && (
          <div className="mma-idle">
            <div className="mma-error">{session.error || 'Something went wrong'}</div>
            <button type="button" className="mma-primary" onClick={() => void startAssistant()}>
              Retry
            </button>
          </div>
        )}

        {(active || session.segments.length > 0) && session.status !== 'error' && (
          <>
            <div className="mma-livebar">
              <span>
                {listening ? '● Listening' : paused ? '● Paused' : session.status === 'starting' ? '● Starting' : '● Idle'}
              </span>
              <span className="mma-timer">{formatElapsed(session.elapsedMs)}</span>
            </div>
            {session.modelLoading && <div className="mma-hint">Loading Whisper model…</div>}

            <div className="mma-tabs">
              {(['transcript', 'summary', 'notes'] as TabId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  className={tab === id ? 'active' : ''}
                  onClick={() => setTab(id)}
                >
                  {id === 'transcript' ? 'Transcript' : id === 'summary' ? 'Summary' : 'Notes'}
                </button>
              ))}
            </div>

            <div className="mma-content">
              {tab === 'transcript' && (
                <div className="mma-transcript">
                  {session.segments.length === 0 && (
                    <div className="mma-empty">Live transcript will appear here.</div>
                  )}
                  {session.segments.map((seg: TranscriptSegment) => (
                    <div key={seg.id} className="mma-seg">
                      <div className="mma-seg-meta">
                        <strong>{seg.speakerLabel}</strong>
                        <span>{formatSegmentTime(seg.start)}</span>
                      </div>
                      <div>{seg.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'summary' && (
                <div className="mma-summary">
                  {!session.summary && (
                    <div className="mma-empty">
                      Generate a summary with your configured AI provider.
                      <button type="button" className="mma-primary" disabled={busy} onClick={() => void summarize()}>
                        {busy ? 'Summarizing…' : 'Generate Summary'}
                      </button>
                    </div>
                  )}
                  {session.summary && (
                    <>
                      <h4>Executive Summary</h4>
                      <p>{session.summary.executiveSummary}</p>
                      <h4>Decisions</h4>
                      <ul>
                        {session.summary.decisions.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                      <h4>Action Items</h4>
                      <ul>
                        {session.summary.actionItems.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                      <button type="button" className="mma-secondary" disabled={busy} onClick={() => void summarize()}>
                        Regenerate
                      </button>
                    </>
                  )}
                </div>
              )}

              {tab === 'notes' && (
                <div className="mma-summary">
                  {session.summary?.notes?.length ? (
                    <ul>
                      {session.summary.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mma-empty">
                      Notes appear after you generate a summary.
                      <button type="button" className="mma-primary" disabled={busy} onClick={() => void summarize()}>
                        Generate Notes
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mma-footer">
              {listening && (
                <button type="button" className="mma-secondary" onClick={() => void pause()}>
                  Pause
                </button>
              )}
              {paused && (
                <button type="button" className="mma-secondary" onClick={() => void resume()}>
                  Resume
                </button>
              )}
              {active && (
                <button type="button" className="mma-danger" disabled={busy} onClick={() => void stop()}>
                  Stop
                </button>
              )}
              <button type="button" className="mma-secondary" onClick={() => void copyAll()}>
                Copy
              </button>
              <button type="button" className="mma-secondary" onClick={() => void exportAll()}>
                Download
              </button>
            </div>
          </>
        )}
      </div>

      <div
        className="mma-resize"
        onPointerDown={(e) => {
          e.stopPropagation();
          resizeRef.current = {
            ox: e.clientX,
            oy: e.clientY,
            w: positionRef.current.width,
            h: positionRef.current.height,
          };
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
      />
      {toast && <div className="mma-toast">{toast}</div>}
    </div>
  );
}
