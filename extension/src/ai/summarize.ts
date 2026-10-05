import { getSettings } from '../shared/storage';
import type { MeetingMeta, MeetingSummary, TranscriptSegment } from '../shared/types';
import { createProviderFromSettings } from './providers';

const SYSTEM_PROMPT = `You are a meeting assistant. Given a transcript, return ONLY valid JSON with this shape:
{
  "executiveSummary": "string",
  "decisions": ["string"],
  "actionItems": ["string"],
  "notes": ["string"]
}
Be concise and factual. If something is missing, use an empty array or short note.`;

function formatTranscript(segments: TranscriptSegment[]): string {
  return segments
    .map((s) => {
      const mm = Math.floor(s.start / 60);
      const ss = Math.floor(s.start % 60)
        .toString()
        .padStart(2, '0');
      return `[${mm}:${ss}] ${s.speakerLabel}: ${s.text}`;
    })
    .join('\n');
}

function parseSummary(raw: string): MeetingSummary {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(cleaned) as Partial<MeetingSummary>;
  return {
    executiveSummary: parsed.executiveSummary ?? '',
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions.map(String) : [],
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.map(String) : [],
    notes: Array.isArray(parsed.notes) ? parsed.notes.map(String) : [],
  };
}

export async function summarizeMeeting(
  segments: TranscriptSegment[],
  meta: MeetingMeta,
): Promise<MeetingSummary> {
  if (segments.length === 0) {
    return {
      executiveSummary: 'No transcript available yet.',
      decisions: [],
      actionItems: [],
      notes: [],
    };
  }

  const settings = await getSettings();
  const provider = createProviderFromSettings(settings);
  const user = `Meeting provider: ${meta.provider}
Meeting URL: ${meta.url}
Title: ${meta.title ?? 'Untitled'}

Transcript:
${formatTranscript(segments)}`;

  const raw = await provider.chat({ system: SYSTEM_PROMPT, user });
  return parseSummary(raw);
}
