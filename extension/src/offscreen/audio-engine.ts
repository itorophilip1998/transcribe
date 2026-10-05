import type { AudioSource, ExtensionMessage, TranscriptSegment, WhisperModelSize } from '../shared/types';
import WhisperWorker from '../workers/whisper.worker?worker';

type SpeechMessage = {
  type: 'speech';
  source: AudioSource;
  sampleRate: number;
  pcm: Float32Array;
};

let tabStream: MediaStream | null = null;
let micStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let tabNode: AudioWorkletNode | null = null;
let micNode: AudioWorkletNode | null = null;
let whisperWorker: Worker | null = null;
let paused = false;
let sessionClockStart = 0;
let segmentCounter = 0;

function postToBackground(message: ExtensionMessage): void {
  chrome.runtime.sendMessage(message).catch(() => undefined);
}

function ensureWorker(model: WhisperModelSize): Worker {
  if (whisperWorker) return whisperWorker;
  whisperWorker = new WhisperWorker();
  whisperWorker.onmessage = (event: MessageEvent) => {
    const data = event.data as
      | { type: 'ready' }
      | { type: 'loading'; loading: boolean }
      | { type: 'result'; id: string; text: string; source: AudioSource; start: number; end: number }
      | { type: 'error'; error: string };

    if (data.type === 'loading') {
      postToBackground({ type: 'OFFSCREEN_MODEL_STATUS', loading: data.loading, ready: false });
    } else if (data.type === 'ready') {
      postToBackground({ type: 'OFFSCREEN_MODEL_STATUS', loading: false, ready: true });
    } else if (data.type === 'result' && data.text.trim()) {
      const segment: TranscriptSegment = {
        id: data.id,
        start: data.start,
        end: data.end,
        text: data.text.trim(),
        source: data.source,
        speakerLabel: data.source === 'mic' ? 'You' : 'Other speakers',
      };
      postToBackground({ type: 'OFFSCREEN_SEGMENT', segment });
    } else if (data.type === 'error') {
      postToBackground({ type: 'OFFSCREEN_ERROR', error: data.error });
    }
  };
  whisperWorker.postMessage({ type: 'init', model });
  return whisperWorker;
}

async function attachWorklet(
  ctx: AudioContext,
  stream: MediaStream,
  source: AudioSource,
): Promise<AudioWorkletNode> {
  const mediaSource = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, 'pcm-vad-processor', {
    processorOptions: { source },
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 1,
  });

  node.port.onmessage = (event: MessageEvent) => {
    if (paused) return;
    const data = event.data as SpeechMessage | { type: 'vad' };
    if (data.type !== 'speech') return;

    const now = (performance.now() - sessionClockStart) / 1000;
    const duration = data.pcm.length / data.sampleRate;
    const id = `${source}-${++segmentCounter}`;

    whisperWorker?.postMessage(
      {
        type: 'transcribe',
        id,
        source,
        sampleRate: data.sampleRate,
        pcm: data.pcm,
        start: Math.max(0, now - duration),
        end: now,
      },
      [data.pcm.buffer],
    );
  };

  mediaSource.connect(node);
  // Keep graph alive without audible output
  const gain = ctx.createGain();
  gain.gain.value = 0;
  node.connect(gain);
  gain.connect(ctx.destination);
  return node;
}

async function startCapture(streamId: string, whisperModel: WhisperModelSize): Promise<void> {
  await stopCapture(false);
  paused = false;
  sessionClockStart = performance.now();
  segmentCounter = 0;

  ensureWorker(whisperModel);
  postToBackground({ type: 'OFFSCREEN_MODEL_STATUS', loading: true, ready: false });

  audioContext = new AudioContext({ sampleRate: 48000 });
  await audioContext.audioWorklet.addModule(chrome.runtime.getURL('worklets/pcm-vad-processor.js'));

  // Tab audio via tabCapture stream id
  tabStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
      },
    },
    video: false,
  } as unknown as MediaStreamConstraints);

  micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  });

  tabNode = await attachWorklet(audioContext, tabStream, 'tab');
  micNode = await attachWorklet(audioContext, micStream, 'mic');

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
}

async function stopCapture(notify = true): Promise<void> {
  paused = true;
  tabNode?.disconnect();
  micNode?.disconnect();
  tabNode = null;
  micNode = null;

  tabStream?.getTracks().forEach((t) => t.stop());
  micStream?.getTracks().forEach((t) => t.stop());
  tabStream = null;
  micStream = null;

  if (audioContext) {
    await audioContext.close().catch(() => undefined);
    audioContext = null;
  }

  if (whisperWorker) {
    whisperWorker.terminate();
    whisperWorker = null;
  }

  if (notify) {
    postToBackground({ type: 'OFFSCREEN_MODEL_STATUS', loading: false, ready: false });
  }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'OFFSCREEN_START':
        await startCapture(message.streamId, message.whisperModel);
        sendResponse({ ok: true });
        break;
      case 'OFFSCREEN_PAUSE':
        paused = true;
        if (audioContext?.state === 'running') await audioContext.suspend();
        sendResponse({ ok: true });
        break;
      case 'OFFSCREEN_RESUME':
        paused = false;
        if (audioContext?.state === 'suspended') await audioContext.resume();
        sendResponse({ ok: true });
        break;
      case 'OFFSCREEN_STOP':
        await stopCapture(true);
        sendResponse({ ok: true });
        break;
      default:
        break;
    }
  })().catch((err) => {
    const error = err instanceof Error ? err.message : String(err);
    postToBackground({ type: 'OFFSCREEN_ERROR', error });
    sendResponse({ ok: false, error });
  });
  return true;
});

console.log('[mma] offscreen audio engine ready');
