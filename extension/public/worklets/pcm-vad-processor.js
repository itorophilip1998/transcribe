/**
 * AudioWorklet processor: downmix to mono, resample to 16kHz, simple energy VAD.
 * Posts Float32Array PCM frames when speech is detected.
 */
class PcmVadProcessor extends AudioWorkletProcessor {
  private targetRate = 16000;
  private ratio: number;
  private leftover = 0;
  private buffer: number[] = [];
  private speechActive = false;
  private silenceFrames = 0;
  private readonly energyThreshold = 0.012;
  private readonly silenceHangover = 12; // ~frames of silence before flush
  private readonly maxBufferSamples = 16000 * 8; // 8s max
  private frameCount = 0;
  private source: string;

  constructor(options?: { processorOptions?: { source?: string } }) {
    super();
    this.ratio = sampleRate / this.targetRate;
    this.source = options?.processorOptions?.source ?? 'tab';
  }

  private resampleChunk(input: Float32Array): Float32Array {
    const outLength = Math.floor((input.length - this.leftover) / this.ratio);
    if (outLength <= 0) return new Float32Array(0);
    const output = new Float32Array(outLength);
    let offset = this.leftover;
    for (let i = 0; i < outLength; i++) {
      const idx = offset;
      const i0 = Math.floor(idx);
      const i1 = Math.min(i0 + 1, input.length - 1);
      const frac = idx - i0;
      output[i] = input[i0] * (1 - frac) + input[i1] * frac;
      offset += this.ratio;
    }
    this.leftover = offset - input.length;
    if (this.leftover < 0) this.leftover = 0;
    return output;
  }

  private rms(frame: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    return Math.sqrt(sum / Math.max(frame.length, 1));
  }

  private flushSpeech(): void {
    if (this.buffer.length < this.targetRate * 0.4) {
      this.buffer = [];
      return;
    }
    const pcm = new Float32Array(this.buffer);
    this.buffer = [];
    this.port.postMessage(
      {
        type: 'speech',
        source: this.source,
        sampleRate: this.targetRate,
        pcm,
      },
      [pcm.buffer],
    );
  }

  process(inputs: Float32Array[][]): boolean {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;

    // downmix already mono from channel splitter upstream; use first channel
    const resampled = this.resampleChunk(input);
    if (resampled.length === 0) return true;

    const energy = this.rms(resampled);
    this.frameCount++;

    if (energy >= this.energyThreshold) {
      this.speechActive = true;
      this.silenceFrames = 0;
      for (let i = 0; i < resampled.length; i++) this.buffer.push(resampled[i]);
    } else if (this.speechActive) {
      this.silenceFrames++;
      for (let i = 0; i < resampled.length; i++) this.buffer.push(resampled[i]);
      if (this.silenceFrames >= this.silenceHangover) {
        this.speechActive = false;
        this.silenceFrames = 0;
        this.flushSpeech();
      }
    }

    if (this.buffer.length >= this.maxBufferSamples) {
      this.speechActive = false;
      this.silenceFrames = 0;
      this.flushSpeech();
    }

    // periodic heartbeat every ~2s of audio frames
    if (this.frameCount % 200 === 0) {
      this.port.postMessage({ type: 'vad', energy, source: this.source });
    }

    return true;
  }
}

registerProcessor('pcm-vad-processor', PcmVadProcessor);
