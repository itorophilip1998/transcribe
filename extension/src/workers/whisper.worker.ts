/// <reference lib="webworker" />
import { pipeline, env } from '@xenova/transformers';
import type { AudioSource, WhisperModelSize } from '../shared/types';

env.allowLocalModels = false;
env.useBrowserCache = true;

type Transcriber = (audio: Float32Array | { array: Float32Array; sampling_rate: number }, options?: object) => Promise<{ text: string }>;

let transcriber: Transcriber | null = null;
let currentModel: WhisperModelSize | null = null;
let queue: Array<{
  id: string;
  source: AudioSource;
  sampleRate: number;
  pcm: Float32Array;
  start: number;
  end: number;
}> = [];
let processing = false;

const MODEL_MAP: Record<WhisperModelSize, string> = {
  tiny: 'Xenova/whisper-tiny.en',
  base: 'Xenova/whisper-base.en',
};

async function ensureModel(model: WhisperModelSize): Promise<void> {
  if (transcriber && currentModel === model) return;
  self.postMessage({ type: 'loading', loading: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transcriber = (await pipeline('automatic-speech-recognition', MODEL_MAP[model], {
    quantized: true,
  })) as unknown as Transcriber;
  currentModel = model;
  self.postMessage({ type: 'ready' });
  self.postMessage({ type: 'loading', loading: false });
}

async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const job = queue.shift()!;
    try {
      if (!transcriber) throw new Error('Whisper model not ready');
      const result = await transcriber(
        { array: job.pcm, sampling_rate: job.sampleRate },
        {
          chunk_length_s: 20,
          stride_length_s: 3,
          return_timestamps: false,
        },
      );
      const text = (result?.text ?? '').trim();
      if (text) {
        self.postMessage({
          type: 'result',
          id: job.id,
          text,
          source: job.source,
          start: job.start,
          end: job.end,
        });
      }
    } catch (err) {
      self.postMessage({
        type: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  processing = false;
}

self.onmessage = (event: MessageEvent) => {
  const data = event.data as
    | { type: 'init'; model: WhisperModelSize }
    | {
        type: 'transcribe';
        id: string;
        source: AudioSource;
        sampleRate: number;
        pcm: Float32Array;
        start: number;
        end: number;
      };

  if (data.type === 'init') {
    ensureModel(data.model).catch((err) => {
      self.postMessage({
        type: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    });
    return;
  }

  if (data.type === 'transcribe') {
    queue.push({
      id: data.id,
      source: data.source,
      sampleRate: data.sampleRate,
      pcm: data.pcm,
      start: data.start,
      end: data.end,
    });
    void processQueue();
  }
};

export {};
