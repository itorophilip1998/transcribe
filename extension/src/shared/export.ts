import type { MeetingMeta, MeetingSummary, TranscriptSegment } from '../shared/types';

export function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function formatSegmentTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export function transcriptToMarkdown(segments: TranscriptSegment[]): string {
  return segments
    .map((seg) => `**[${formatSegmentTime(seg.start)}] ${seg.speakerLabel}**\n${seg.text}`)
    .join('\n\n');
}

export function transcriptToText(segments: TranscriptSegment[]): string {
  return segments
    .map((seg) => `[${formatSegmentTime(seg.start)}] ${seg.speakerLabel}: ${seg.text}`)
    .join('\n');
}

export function summaryToMarkdown(summary: MeetingSummary): string {
  const lines = [
    '# Meeting Summary',
    '',
    '## Executive Summary',
    summary.executiveSummary || '_None_',
    '',
    '## Decisions',
    ...(summary.decisions.length ? summary.decisions.map((d) => `- ${d}`) : ['_None_']),
    '',
    '## Action Items',
    ...(summary.actionItems.length ? summary.actionItems.map((a) => `- ${a}`) : ['_None_']),
    '',
    '## Notes',
    ...(summary.notes.length ? summary.notes.map((n) => `- ${n}`) : ['_None_']),
    '',
  ];
  return lines.join('\n');
}

export function buildMeetingJson(
  meta: MeetingMeta,
  segments: TranscriptSegment[],
  summary: MeetingSummary | null,
  elapsedMs: number,
): string {
  return JSON.stringify(
    {
      provider: meta.provider,
      url: meta.url,
      title: meta.title ?? null,
      startTime: meta.startTime ?? null,
      endTime: meta.endTime ?? null,
      durationMs: elapsedMs,
      segments,
      summary,
    },
    null,
    2,
  );
}

export function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyText(content: string): Promise<void> {
  await navigator.clipboard.writeText(content);
}
