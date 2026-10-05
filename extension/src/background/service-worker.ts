import { getSettings } from '../shared/storage';
import { onMessage } from '../shared/messaging';
import {
  DEFAULT_SESSION,
  type ExtensionMessage,
  type MeetingMeta,
  type SessionState,
  type TranscriptSegment,
} from '../shared/types';
import { summarizeMeeting } from '../ai/summarize';

const OFFSCREEN_URL = 'offscreen.html';
const OFFSCREEN_REASONS = [
  'USER_MEDIA',
  'AUDIO_PLAYBACK',
  'WORKERS',
] as chrome.offscreen.Reason[];
const OFFSCREEN_JUSTIFICATION =
  'Capture Google Meet tab audio and microphone for local transcription';

let session: SessionState = { ...DEFAULT_SESSION, segments: [] };
let timerInterval: ReturnType<typeof setInterval> | null = null;
let sessionStartMs = 0;
let pausedAccumulatedMs = 0;
let wasPausedOnStop = false;
let activeTabId: number | null = null;

function broadcast(message: ExtensionMessage): void {
  chrome.runtime.sendMessage(message).catch(() => {
    /* no receivers */
  });
}

function pushState(): void {
  broadcast({ type: 'SESSION_STATE', state: { ...session, segments: [...session.segments] } });
}

function clearTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer(): void {
  clearTimer();
  timerInterval = setInterval(() => {
    if (session.status !== 'listening') return;
    session.elapsedMs = pausedAccumulatedMs + (Date.now() - sessionStartMs);
    broadcast({ type: 'ELAPSED_UPDATE', elapsedMs: session.elapsedMs });
  }, 250);
}

async function hasOffscreenDocument(): Promise<boolean> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
  });
  return contexts.some((ctx) => ctx.documentUrl?.endsWith(OFFSCREEN_URL));
}

async function setupOffscreenDocument(): Promise<void> {
  if (await hasOffscreenDocument()) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: OFFSCREEN_REASONS,
    justification: OFFSCREEN_JUSTIFICATION,
  });
}

async function closeOffscreenDocument(): Promise<void> {
  if (await hasOffscreenDocument()) {
    await chrome.offscreen.closeDocument();
  }
}

async function startAssistant(tabId: number, meta: MeetingMeta): Promise<SessionState> {
  if (session.status === 'listening' || session.status === 'starting') {
    return session;
  }

  session = {
    ...DEFAULT_SESSION,
    status: 'starting',
    meta: { ...meta, startTime: Date.now() },
    segments: [],
    modelLoading: true,
  };
  activeTabId = tabId;
  pausedAccumulatedMs = 0;
  pushState();

  try {
    const settings = await getSettings();
    await setupOffscreenDocument();

    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId,
    });

    await chrome.runtime.sendMessage({
      type: 'OFFSCREEN_START',
      streamId,
      whisperModel: settings.whisperModel,
    } satisfies ExtensionMessage);

    session.status = 'listening';
    sessionStartMs = Date.now();
    startTimer();
    pushState();
    return session;
  } catch (err) {
    session.status = 'error';
    session.error = err instanceof Error ? err.message : String(err);
    session.modelLoading = false;
    pushState();
    await closeOffscreenDocument();
    throw err;
  }
}

async function pauseAssistant(): Promise<void> {
  if (session.status !== 'listening') return;
  await chrome.runtime.sendMessage({ type: 'OFFSCREEN_PAUSE' } satisfies ExtensionMessage);
  pausedAccumulatedMs += Date.now() - sessionStartMs;
  session.status = 'paused';
  clearTimer();
  pushState();
}

async function resumeAssistant(): Promise<void> {
  if (session.status !== 'paused') return;
  await chrome.runtime.sendMessage({ type: 'OFFSCREEN_RESUME' } satisfies ExtensionMessage);
  sessionStartMs = Date.now();
  session.status = 'listening';
  startTimer();
  pushState();
}

async function stopAssistant(): Promise<SessionState> {
  if (session.status === 'idle') return session;

  wasPausedOnStop = session.status === 'paused';
  session.status = 'stopping';
  pushState();

  try {
    await chrome.runtime.sendMessage({ type: 'OFFSCREEN_STOP' } satisfies ExtensionMessage);
  } catch {
    /* offscreen may already be gone */
  }

  clearTimer();
  if (!wasPausedOnStop && sessionStartMs) {
    session.elapsedMs = pausedAccumulatedMs + (Date.now() - sessionStartMs);
  } else {
    session.elapsedMs = pausedAccumulatedMs;
  }

  if (session.meta) {
    session.meta = { ...session.meta, endTime: Date.now() };
  }

  await closeOffscreenDocument();
  session.status = 'idle';
  session.modelLoading = false;
  activeTabId = null;
  pushState();
  return session;
}

onMessage((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'GET_SESSION_STATE':
      sendResponse(session);
      return false;

    case 'START_ASSISTANT':
      startAssistant(message.tabId, message.meta)
        .then((state) => sendResponse({ ok: true, state }))
        .catch((err) =>
          sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) }),
        );
      return true;

    case 'START_ASSISTANT_FROM_CONTENT': {
      const tabId = _sender.tab?.id;
      if (!tabId) {
        sendResponse({ ok: false, error: 'Could not resolve Meet tab id' });
        return false;
      }
      startAssistant(tabId, message.meta)
        .then((state) => sendResponse({ ok: true, state }))
        .catch((err) =>
          sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) }),
        );
      return true;
    }

    case 'PAUSE_ASSISTANT':
      pauseAssistant()
        .then(() => sendResponse({ ok: true }))
        .catch((err) => sendResponse({ ok: false, error: String(err) }));
      return true;

    case 'RESUME_ASSISTANT':
      resumeAssistant()
        .then(() => sendResponse({ ok: true }))
        .catch((err) => sendResponse({ ok: false, error: String(err) }));
      return true;

    case 'STOP_ASSISTANT':
      stopAssistant()
        .then((state) => sendResponse({ ok: true, state }))
        .catch((err) => sendResponse({ ok: false, error: String(err) }));
      return true;

    case 'OFFSCREEN_SEGMENT': {
      const segment: TranscriptSegment = message.segment;
      session.segments = [...session.segments, segment];
      broadcast({ type: 'TRANSCRIPT_SEGMENT', segment });
      return false;
    }

    case 'OFFSCREEN_MODEL_STATUS':
      session.modelLoading = message.loading;
      session.modelReady = message.ready;
      broadcast({ type: 'MODEL_STATUS', loading: message.loading, ready: message.ready });
      pushState();
      return false;

    case 'OFFSCREEN_ERROR':
      session.status = 'error';
      session.error = message.error;
      broadcast({ type: 'STATUS_UPDATE', status: 'error', error: message.error });
      pushState();
      return false;

    case 'SUMMARIZE_REQUEST':
      summarizeMeeting(message.segments, message.meta)
        .then((summary) => {
          session.summary = summary;
          sendResponse({ type: 'SUMMARIZE_RESULT', summary });
          pushState();
        })
        .catch((err) => {
          sendResponse({
            type: 'SUMMARIZE_RESULT',
            summary: null,
            error: err instanceof Error ? err.message : String(err),
          });
        });
      return true;

    case 'OPEN_OPTIONS':
      chrome.runtime.openOptionsPage();
      sendResponse({ ok: true });
      return false;

    default:
      return false;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[mma] AI Meeting Assistant installed');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url?.startsWith('https://meet.google.com/')) return;
  chrome.tabs.sendMessage(tabId, { type: 'GET_SESSION_STATE' }).catch(() => {
    console.log(
      '[mma] Meet tab loaded but content script is not responding — refresh the Meet page after loading the extension.',
      tab.url,
    );
  });
});
