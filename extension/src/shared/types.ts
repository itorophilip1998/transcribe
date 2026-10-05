export type AudioSource = 'mic' | 'tab';

export type AssistantStatus =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'paused'
  | 'stopping'
  | 'error';

export type WhisperModelSize = 'tiny' | 'base';

export type AIProviderId =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'copilot'
  | 'grok'
  | 'local';

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  source: AudioSource;
  speakerLabel: 'You' | 'Other speakers';
}

export interface MeetingMeta {
  provider: 'Google Meet';
  url: string;
  title?: string;
  startTime?: number;
  endTime?: number;
}

export interface MeetingSummary {
  executiveSummary: string;
  decisions: string[];
  actionItems: string[];
  notes: string[];
}

export interface AIProviderConfig {
  provider: AIProviderId;
  openaiApiKey: string;
  openaiModel: string;
  anthropicApiKey: string;
  anthropicModel: string;
  geminiApiKey: string;
  geminiModel: string;
  copilotApiKey: string;
  copilotEndpoint: string;
  copilotDeployment: string;
  grokApiKey: string;
  grokModel: string;
  localBaseUrl: string;
  localApiKey: string;
  localModel: string;
}

export interface ExtensionSettings extends AIProviderConfig {
  whisperModel: WhisperModelSize;
}

export interface FloatingPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
}

export interface SessionState {
  status: AssistantStatus;
  elapsedMs: number;
  error?: string;
  meta: MeetingMeta | null;
  segments: TranscriptSegment[];
  summary: MeetingSummary | null;
  modelLoading: boolean;
  modelReady: boolean;
}

export type ExtensionMessage =
  | { type: 'START_ASSISTANT'; tabId: number; meta: MeetingMeta }
  | { type: 'START_ASSISTANT_FROM_CONTENT'; meta: MeetingMeta }
  | { type: 'PAUSE_ASSISTANT' }
  | { type: 'RESUME_ASSISTANT' }
  | { type: 'STOP_ASSISTANT' }
  | { type: 'GET_SESSION_STATE' }
  | { type: 'SESSION_STATE'; state: SessionState }
  | { type: 'TRANSCRIPT_SEGMENT'; segment: TranscriptSegment }
  | { type: 'STATUS_UPDATE'; status: AssistantStatus; error?: string }
  | { type: 'MODEL_STATUS'; loading: boolean; ready: boolean }
  | { type: 'ELAPSED_UPDATE'; elapsedMs: number }
  | { type: 'OFFSCREEN_START'; streamId: string; whisperModel: WhisperModelSize }
  | { type: 'OFFSCREEN_PAUSE' }
  | { type: 'OFFSCREEN_RESUME' }
  | { type: 'OFFSCREEN_STOP' }
  | { type: 'OFFSCREEN_SEGMENT'; segment: TranscriptSegment }
  | { type: 'OFFSCREEN_MODEL_STATUS'; loading: boolean; ready: boolean }
  | { type: 'OFFSCREEN_ERROR'; error: string }
  | { type: 'SUMMARIZE_REQUEST'; segments: TranscriptSegment[]; meta: MeetingMeta }
  | { type: 'SUMMARIZE_RESULT'; summary: MeetingSummary | null; error?: string }
  | { type: 'OPEN_OPTIONS' };

export const DEFAULT_SETTINGS: ExtensionSettings = {
  whisperModel: 'tiny',
  provider: 'openai',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  anthropicApiKey: '',
  anthropicModel: 'claude-3-5-haiku-latest',
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash',
  copilotApiKey: '',
  copilotEndpoint: '',
  copilotDeployment: 'gpt-4o-mini',
  grokApiKey: '',
  grokModel: 'grok-2-latest',
  localBaseUrl: 'http://localhost:11434/v1',
  localApiKey: '',
  localModel: 'llama3.2',
};

export const DEFAULT_POSITION: FloatingPosition = {
  x: 24,
  y: 24,
  width: 340,
  height: 480,
  collapsed: true,
};

export const DEFAULT_SESSION: SessionState = {
  status: 'idle',
  elapsedMs: 0,
  meta: null,
  segments: [],
  summary: null,
  modelLoading: false,
  modelReady: false,
};
