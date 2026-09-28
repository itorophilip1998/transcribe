# AI Meeting Capture Platform

## Business, Product, Technical, Go-to-Market, and Scaling Plan

## 1. Executive Summary

The product is an intelligent desktop meeting-capture and knowledge-management platform.

It automatically records:

* The user's screen
* System audio
* The owner's microphone
* Meeting participants' voices
* Live transcript
* Manual screenshots
* Automatic screenshots
* Notes and bookmarks
* Speaker identities
* Meeting timestamps
* Decisions
* Action items
* Questions
* Important moments

After the meeting, the system automatically creates a structured meeting workspace containing:

* Full meeting recording
* Owner microphone recording
* Meeting audio
* Full transcript
* Screenshots
* Word document
* PDF report
* Meeting summary
* Decisions
* Action items
* Participants
* Searchable meeting knowledge

The long-term goal is not simply to create another recording application.

The product should become an **AI-powered organizational memory system**.

A user should eventually be able to ask:

> What did Michael say about our Azure migration last month?

The platform should find the meeting, transcript segment, screenshot, speaker, and video timestamp and allow the user to immediately replay that moment.

---

# 2. Vision

Build a system that remembers meetings better than humans do.

The platform should capture not only what people said, but also:

* what appeared on the screen
* who said it
* when it was said
* what decision was made
* what task was assigned
* what document or application was being viewed
* what visual evidence existed
* what happened before and after the discussion

The platform should therefore become a searchable timeline of organizational knowledge.

---

# 3. Product Positioning

The product sits between several categories:

* Meeting recording
* AI transcription
* Screen recording
* Note taking
* Knowledge management
* Enterprise search
* AI assistants
* Collaboration software

Its differentiation is that it combines all of them into a synchronized meeting timeline.

The key product idea is:

**Everything belongs to one timeline.**

Video, audio, transcript, screenshots, notes, decisions, and actions all reference the same session clock.

---

# 4. Primary Problem

Important information from meetings is usually scattered.

A typical organization may have:

* Zoom recordings
* Teams meetings
* WhatsApp conversations
* Google Docs
* screenshots
* handwritten notes
* Slack conversations
* meeting minutes
* Jira tickets
* emails

Even when recordings exist, finding a specific discussion inside a 90-minute meeting is difficult.

Transcripts help, but they often do not show what participants were looking at.

Screenshots help, but users do not know what was being discussed when the screenshot was taken.

The product solves this by combining all of these artifacts.

---

# 5. Product Promise

A user starts a meeting and clicks:

**Start Capture**

The application handles everything else.

During the meeting:

* screen recording begins
* owner's microphone is captured
* system audio is captured
* transcription begins
* speakers are identified
* screenshots can be captured
* screenshots are timestamped
* notes can be created
* bookmarks can be added

At the end:

**Stop Meeting**

The system automatically produces a complete meeting package.

---

# 6. Example Meeting Output

```text
MeetingVault/
└── Engineering-Weekly-2026-09-25/
    │
    ├── meeting.docx
    ├── meeting.pdf
    ├── meeting.json
    │
    ├── transcript/
    │   ├── transcript.json
    │   ├── transcript.txt
    │   ├── transcript.srt
    │   └── transcript.vtt
    │
    ├── video/
    │   ├── meeting.mp4
    │   └── screen.webm
    │
    ├── audio/
    │   ├── owner.wav
    │   ├── system.wav
    │   └── combined.wav
    │
    ├── screenshots/
    │   ├── screenshot_001.png
    │   ├── screenshot_002.png
    │   └── screenshot_003.png
    │
    ├── ai/
    │   ├── summary.json
    │   ├── action_items.json
    │   ├── decisions.json
    │   └── topics.json
    │
    └── metadata/
        └── session.json
```

---

# 7. Core User Journey

## Before the Meeting

The user opens the desktop application.

Dashboard:

```text
New Meeting
Recent Meetings
Search
Workspace
Settings
```

The user selects:

**New Meeting**

The system requests:

* meeting title
* microphone
* screen/window
* system audio permission
* screenshot settings
* cloud/local storage preference

The user clicks:

**Start Meeting**

---

# 8. Meeting Capture Mode

Once recording begins, the application should minimize into a floating toolbar.

Example:

```text
┌───────────────────────────────────────────────────────┐
│ ● REC  00:32:42   🎙  📸  ✎  ★  ⏸  ■             │
└───────────────────────────────────────────────────────┘
```

Actions:

* microphone toggle
* screenshot
* note
* bookmark
* pause
* resume
* stop

The toolbar should remain small enough not to interfere with the meeting.

---

# 9. Recording Requirements

The application should capture independent media sources.

## Track 1 — Screen

Capture:

* full screen
* application window
* selected monitor

## Track 2 — Owner microphone

The owner's microphone must remain a separate recording.

## Track 3 — System audio

Capture meeting audio separately when the operating system allows it.

## Track 4 — Combined media

The system can optionally produce:

```text
screen + system audio + owner microphone
```

as the final meeting video.

---

# 10. Why Owner Audio Must Be Separate

Separating the owner's microphone provides several benefits.

The application knows with high confidence that anything spoken through the local microphone belongs to the owner.

Therefore:

```text
microphone audio
       ↓
speaker = meeting owner
```

This dramatically improves speaker identification.

Other speakers can then be identified through system audio and diarization.

---

# 11. Optional Voice Identity

Later versions can support owner voice enrollment.

The user records a short sample.

Example:

```text
Please speak naturally for 20–30 seconds.
```

The application generates a speaker embedding.

During future meetings, speaker embeddings can be compared.

Results:

```text
Philip
Speaker 2
Speaker 3
Speaker 4
```

Voice enrollment should be optional and protected because voiceprints can be biometric information.

---

# 12. Unified Meeting Clock

This is one of the most important architectural principles.

Every artifact must reference the same meeting clock.

Example:

```text
00:00:00 Meeting starts

00:03:18 Philip begins speaking

00:03:27 screenshot captured

00:04:01 Speaker 2 responds

00:04:48 note created

00:06:12 important moment bookmarked
```

Every event gets a timestamp.

---

# 13. Event Model

Every meeting should have an event stream.

Example:

```json
{
  "id": "event_2841",
  "sessionId": "session_29391",
  "type": "SCREENSHOT",
  "timestamp": 207.43,
  "createdAt": "2026-09-25T20:16:24Z",
  "metadata": {
    "file": "screenshots/screenshot_003.png"
  }
}
```

Other event types:

```text
SESSION_STARTED
SESSION_STOPPED
SCREENSHOT
SPEECH
NOTE
BOOKMARK
SPEAKER_CHANGE
WINDOW_CHANGE
ACTION_ITEM
DECISION
QUESTION
TOPIC_CHANGE
```

---

# 14. Screenshot System

The application should support three screenshot modes.

## Manual

The user presses a button.

## Automatic Interval

Example:

```text
every 30 seconds
every minute
every 5 minutes
```

## Intelligent Capture

Capture when:

* presentation slide changes
* major screen difference is detected
* active application changes
* a new browser tab appears
* IDE view changes
* user creates a bookmark
* user says a trigger phrase
* important conversation is detected

Intelligent screenshots should become the preferred mode.

---

# 15. Screenshot Intelligence

Each screenshot should include metadata.

```json
{
  "id": "shot_33",
  "sessionId": "abc",
  "timestamp": 413.52,
  "trigger": "SCREEN_CHANGE",
  "windowTitle": "Visual Studio Code",
  "application": "VS Code",
  "file": "screenshots/00-06-53.png"
}
```

Later versions could perform visual analysis to identify:

* presentation
* spreadsheet
* dashboard
* code
* browser
* design
* terminal
* architecture diagram

---

# 16. Transcription Engine

The transcription layer should produce structured segments rather than one large block of text.

Example:

```json
{
  "id": "segment_0091",
  "sessionId": "abc",
  "speakerId": "owner",
  "speakerName": "Philip",
  "start": 255.31,
  "end": 262.19,
  "text": "We should upload directly to Azure using temporary upload credentials.",
  "confidence": 0.96
}
```

The system should support:

* timestamps
* speaker diarization
* punctuation
* language detection
* confidence
* speech cleanup
* speaker names
* multilingual transcription

---

# 17. Live Transcript

While the meeting is running, users should be able to open a transcript panel.

Example:

```text
00:16:03 Philip
I think we need to centralize file management.

00:16:11 Michael
Does that include historical uploads?

00:16:15 Philip
Yes. We can migrate old files with a background script.
```

The transcript should update continuously.

---

# 18. Meeting Document

At the end of a session, automatically produce a polished document.

Sections:

## Meeting Information

* meeting name
* date
* duration
* organizer
* participants

## Executive Summary

Short overview.

## Key Topics

Major discussion subjects.

## Key Decisions

Concrete decisions made.

## Action Items

Example:

```text
Philip
Create centralized storage migration script.
Due: Friday.

Michael
Verify Azure upload permissions.
```

## Questions

Unresolved questions.

## Risks

Potential problems discussed.

## Transcript

Full timestamped transcript.

## Screenshots

Screenshots should appear close to the relevant conversation.

---

# 19. Screenshot Placement in the Document

If screenshot timestamp is:

```text
00:21:17
```

The report generator should find transcript segments around:

```text
00:20:50 – 00:21:45
```

and place the screenshot between those segments.

Example:

```text
00:21:08 — Philip

This service currently sends every file through the API.

[SCREENSHOT]

00:21:31 — Michael

We should send the upload directly to Azure instead.
```

This makes the report useful as visual meeting notes.

---

# 20. Document Formats

Users should be able to export:

* DOCX
* PDF
* Markdown
* TXT
* JSON
* SRT
* VTT

Future:

* Notion
* Google Docs
* Confluence
* Slack
* Jira
* Linear
* Microsoft Teams

---

# 21. Storage Design

The system should use a provider abstraction.

```text
StorageProvider
```

Implementations:

```text
LocalStorageProvider
AzureBlobStorageProvider
S3StorageProvider
GoogleDriveStorageProvider
OneDriveStorageProvider
```

Core operations:

```text
save
read
delete
list
upload
download
getSignedUrl
```

---

# 22. Local-First Architecture

Recording must not depend on internet connectivity.

Flow:

```text
capture
   ↓
local storage
   ↓
upload queue
   ↓
internet available
   ↓
cloud synchronization
```

Meeting recording should continue even when the network disappears.

---

# 23. Video Storage

Long recordings must not live entirely in RAM.

Record in chunks.

Example:

```text
chunk_000001.webm
chunk_000002.webm
chunk_000003.webm
```

Chunks could be between:

```text
2–10 seconds
```

Then finalize them after recording.

Benefits:

* crash recovery
* lower memory usage
* resumable upload
* faster processing
* reliable long meetings

---

# 24. Crash Recovery

Every active meeting should have:

```text
session.lock
```

If the application crashes and restarts, it sees the lock.

Display:

```text
An unfinished meeting was detected.

Recover
Discard
```

Recovery should restore:

* video chunks
* audio chunks
* screenshots
* transcript
* notes
* bookmarks

---

# 25. Desktop Database

Use SQLite locally.

Core tables:

```text
users

sessions

participants

transcript_segments

screenshots

recordings

events

notes

bookmarks

action_items

decisions

questions

topics

uploads

storage_objects
```

---

# 26. Backend Database

For cloud accounts:

```text
PostgreSQL
```

Recommended major entities:

```text
User
Organization
Workspace
Member
Meeting
MeetingParticipant
Transcript
TranscriptSegment
MediaAsset
Screenshot
Note
Bookmark
ActionItem
Decision
Topic
AIInsight
StorageObject
Upload
Subscription
UsageRecord
```

---

# 27. AI Processing Pipeline

After the meeting:

```text
Transcript
    ↓
Conversation cleanup
    ↓
Topic segmentation
    ↓
Summary
    ↓
Decisions
    ↓
Action items
    ↓
Questions
    ↓
Risks
    ↓
Key moments
    ↓
Embedding
    ↓
Search index
```

AI should generate structured JSON, not just text.

---

# 28. Search

Users should search across all meetings.

Example:

```text
"Azure migration"
```

Results could show:

```text
Engineering Meeting
September 25

00:17:42

Philip:
"We should migrate historical uploads to the new Azure container."

Screenshot available
Video available
```

User clicks the result.

The video opens directly at:

```text
00:17:42
```

---

# 29. Conversational Search

Eventually allow questions such as:

> What did we decide about our mobile file architecture?

System searches meetings and responds using relevant meeting evidence.

Results should link to:

* meeting
* transcript
* speaker
* screenshot
* video timestamp

---

# 30. Workspace Intelligence

For team accounts:

```text
Workspace
   ↓
Hundreds of meetings
   ↓
AI knowledge layer
```

Questions:

```text
What are our unresolved engineering risks?

Which tasks were assigned to Philip this month?

What decisions have we made about Azure?

When was the new mobile architecture first discussed?

Which customer problems appear repeatedly?
```

This is where the platform becomes organizational memory.

---

# 31. Dashboard

Suggested dashboard:

```text
---------------------------------------------------------
Meeting Intelligence

[ + New Meeting ]

Recent Meetings

Engineering Weekly              1h 14m
Product Review                  48m
Customer Call                   36m

Your Action Items
12

Important Decisions
7

Meeting Hours This Week
8.4

Search Everything...
---------------------------------------------------------
```

---

# 32. Meeting Detail Screen

```text
Meeting Title
September 25 • 1h 14m

[Play Recording]

Summary
Transcript
Screenshots
Notes
Decisions
Tasks
Participants

---------------------------------------------------------

Video Player

00:00 ─────────────────────────────────── 01:14:22

Transcript

00:14:32 Philip
We should centralize our storage architecture.

00:14:39 Michael
Does this also apply to the ML service?

Screenshot

[IMAGE]

---------------------------------------------------------
```

---

# 33. Transcript Interaction

Clicking transcript text should:

```text
seek video(timestamp)
```

Clicking screenshots should:

```text
seek video(screenshot.timestamp)
```

This synchronization is a major product differentiator.

---

# 34. Bookmarking

During a meeting, users can press:

```text
★ Important
```

The platform creates:

```json
{
  "timestamp": 1622.34,
  "type": "bookmark"
}
```

Later AI can examine ±60 seconds around the bookmark.

---

# 35. Notes

Allow manual notes during recording.

Example:

```text
"Follow up about API migration."
```

Automatically attach:

```text
timestamp
meeting
screen
current transcript context
```

---

# 36. AI Commands During Meetings

Future feature:

```text
@assistant summarize last 5 minutes

@assistant remember this decision

@assistant create a task for me

@assistant screenshot this

@assistant mark this important
```

---

# 37. Integrations

Future integrations:

* Zoom
* Microsoft Teams
* Google Meet
* Slack
* Notion
* Jira
* Linear
* GitHub
* Google Calendar
* Outlook Calendar
* Google Drive
* OneDrive
* Dropbox

---

# 38. Suggested Technology Stack

## Desktop

```text
Electron
React
TypeScript
Vite
Tailwind CSS
shadcn/ui
```

Alternative later:

```text
Tauri
```

if application size/resource usage becomes important.

---

# 39. Desktop Capture

Use:

```text
Electron desktopCapturer
getDisplayMedia
MediaRecorder
Web Audio API
FFmpeg
```

Native operating-system capture can later replace browser capture for greater reliability.

---

# 40. Local Database

```text
SQLite
Prisma
```

---

# 41. Backend

```text
NestJS
TypeScript
PostgreSQL
Prisma
Redis
BullMQ
WebSockets
```

---

# 42. AI Services

Create an independent Python service:

```text
FastAPI
Python
```

Responsibilities:

* transcription
* diarization
* embeddings
* meeting analysis
* summarization
* image understanding

---

# 43. Worker Infrastructure

```text
Redis
BullMQ
```

Workers:

```text
transcription-worker
video-worker
document-worker
ai-worker
indexing-worker
upload-worker
```

Do not start with all of them as independent microservices.

Initially use:

```text
desktop
api
worker
ai
```

Split when scaling requires it.

---

# 44. Cloud Storage

Azure Blob Storage is a strong match if the wider infrastructure already uses Azure.

Recommended structure:

```text
organization/
workspace/
meeting/
video/
audio/
screenshots/
documents/
```

Example:

```text
org_38/
workspace_10/
meeting_300/
video/meeting.mp4
```

---

# 45. Direct-to-Cloud Upload

Large media should not flow through the application API.

Instead:

```text
Desktop
   ↓
API requests authorization
   ↓
API generates temporary signed upload permission
   ↓
Desktop → Blob Storage
```

The backend handles authorization while object storage handles file transfer.

---

# 46. Upload Queue

Every media object should have a state:

```text
PENDING
UPLOADING
UPLOADED
FAILED
RETRYING
```

Upload jobs need:

* retry
* exponential backoff
* resume
* checksum verification

---

# 47. Authentication

Support:

* email/password
* Google
* Microsoft
* GitHub

Enterprise later:

* SAML
* SSO
* SCIM

---

# 48. Security

Important security principles:

* encrypt local secrets
* TLS everywhere
* signed cloud URLs
* short-lived credentials
* encrypted cloud storage
* organization-level access controls
* role-based permissions
* audit logs
* secure token storage
* explicit recording notification
* explicit microphone permission
* explicit screen permission

Users should be responsible for complying with applicable recording-consent laws and company policies.

---

# 49. Roles

Initial:

```text
OWNER
ADMIN
MEMBER
VIEWER
```

Enterprise later:

```text
SECURITY_ADMIN
BILLING_ADMIN
AUDITOR
```

---

# 50. Business Model

Use SaaS subscriptions.

## Free

Designed for discovery.

Possible limits:

* limited meeting hours
* local storage
* limited AI summaries
* basic transcription

## Pro

For individual professionals.

Features:

* larger transcription allowance
* cloud backup
* advanced AI
* exports
* speaker identification
* meeting search

## Team

For companies.

Features:

* shared workspace
* team search
* centralized meetings
* task management
* integrations
* admin controls

## Enterprise

Features:

* SSO
* audit logs
* retention policies
* custom storage
* private deployment
* advanced compliance
* custom AI infrastructure
* priority support

---

# 51. Additional Revenue

Potential revenue channels:

* transcription overages
* storage overages
* enterprise onboarding
* white labeling
* private deployment
* custom integrations
* API usage
* AI analysis credits
* team knowledge search
* compliance packages

---

# 52. Usage Metering

Track:

```text
recording_minutes
transcription_minutes
AI_tokens
storage_bytes
video_processing_minutes
exports
```

This enables flexible pricing.

---

# 53. Target Customers

Strong initial markets:

### Software Teams

Meetings involving:

* architecture
* debugging
* demos
* sprint planning
* project reviews

Screenshots are especially valuable here.

### Designers

Capture:

* Figma
* prototypes
* product reviews
* UI critiques

### Consultants

Store client meetings.

### Agencies

Create client reports automatically.

### Researchers

Capture interviews and screen evidence.

### Remote Teams

Search distributed conversations.

### Students

Lecture capture and visual notes.

### Educators

Teaching and lesson archives.

### Customer Support Teams

Record customer troubleshooting sessions.

---

# 54. Strong Initial Niche

A particularly good first target is:

**technical teams and software companies.**

They regularly discuss things that cannot be represented by transcript alone:

* source code
* architecture diagrams
* dashboards
* logs
* terminals
* Figma designs
* APIs
* infrastructure

The synchronized screenshot capability becomes much more valuable for them.

---

# 55. Competitive Advantage

The primary moat should be the unified event timeline.

Instead of:

```text
recording
transcript
screenshots
notes
```

being separate features, everything is connected through time.

This produces a meeting graph.

```text
Meeting
 |
 +-- video
 |
 +-- transcript
 |
 +-- screenshot
 |
 +-- speaker
 |
 +-- decision
 |
 +-- task
 |
 +-- note
```

That dataset becomes increasingly valuable as users capture more meetings.

---

# 56. Phase 1 — Working Desktop MVP

Build:

* Electron shell
* authentication optional
* meeting creation
* screen capture
* microphone capture
* system audio
* recording
* screenshots
* timestamps
* local folders
* SQLite
* stop/recovery
* transcript generation
* DOCX export

Goal:

Create a reliable local application.

---

# 57. Phase 2 — Intelligent Meeting

Add:

* real-time transcription
* speaker diarization
* owner identification
* smart screenshots
* summary
* decisions
* action items
* topics
* meeting viewer

---

# 58. Phase 3 — Cloud

Add:

* user accounts
* cloud storage
* upload queue
* PostgreSQL
* workspace
* synchronization
* web dashboard

---

# 59. Phase 4 — Search

Add:

* transcript search
* semantic search
* meeting search
* timestamp playback
* screenshot search
* AI question answering

---

# 60. Phase 5 — Teams

Add:

* organizations
* workspaces
* roles
* invites
* team meeting library
* shared tasks
* shared knowledge

---

# 61. Phase 6 — Integrations

Add:

* Google Meet
* Zoom
* Teams
* Slack
* Jira
* Linear
* GitHub
* Google Calendar
* Notion

---

# 62. Phase 7 — Enterprise

Add:

* SSO
* SCIM
* encryption controls
* data retention
* audit trails
* region selection
* bring-your-own-storage
* private cloud
* self-hosting

---

# 63. Suggested Repository

```text
meeting-platform/
│
├── apps/
│   ├── desktop/
│   ├── web/
│   ├── api/
│   ├── ai/
│   └── worker/
│
├── packages/
│   ├── database/
│   ├── types/
│   ├── ui/
│   ├── storage/
│   ├── events/
│   ├── transcription/
│   └── config/
│
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
│
└── docs/
```

Use a monorepo.

Recommended:

```text
pnpm
Turborepo
```

---

# 64. Core Desktop Modules

```text
src/
├── capture/
│   ├── ScreenCaptureService
│   ├── AudioCaptureService
│   ├── MicrophoneService
│   └── ScreenshotService
│
├── recording/
│   ├── RecorderService
│   ├── ChunkWriter
│   └── RecordingRecovery
│
├── session/
│   ├── SessionManager
│   ├── SessionClock
│   └── EventTimeline
│
├── transcript/
│   ├── TranscriptionManager
│   └── TranscriptStore
│
├── storage/
│   ├── StorageProvider
│   └── LocalStorageProvider
│
├── database/
├── export/
├── IPC/
└── UI/
```

---

# 65. Reliability Requirements

A production version must support:

* 8+ hour meetings
* low memory consumption
* no data loss on crash
* storage monitoring
* disk-full warnings
* microphone disconnection
* screen-source termination
* sleep/wake
* network loss
* duplicate upload protection
* idempotent jobs
* retry logic
* partial recovery

---

# 66. Performance Targets

Initial targets:

```text
Idle memory:
< 300 MB preferred

Recording CPU:
reasonable on modern laptops

Memory should not grow with meeting duration.

Video should continuously flush to disk.

Transcript should be persisted incrementally.

Screenshots should be compressed.

Uploads should be resumable.
```

---

# 67. Privacy Features

Users should be able to:

* pause recording
* disable screenshots
* disable transcript
* disable owner voice profile
* delete meetings
* choose local-only mode
* select retention duration

Teams should have visible recording indicators.

---

# 68. Future AI Capabilities

Potential features:

### Meeting Copilot

Answer questions during meetings.

### Live Decision Detection

Display:

```text
Possible decision detected.
Save?
```

### Automatic Follow-Up

Generate:

* meeting recap
* Slack update
* email
* Jira tickets
* Linear issues

### Meeting Comparison

Ask:

> What changed between last week's architecture discussion and today's?

### Organization Memory

Ask:

> Why did we choose Azure instead of AWS?

AI retrieves the meetings where that decision was made.

---

# 69. Future Multimodal Intelligence

Because screenshots and transcript share timestamps, AI can understand:

```text
what people said
+
what was visible
```

For example:

> Why did the developer say the API was failing?

The system retrieves:

```text
transcript
+
terminal screenshot
+
error message
+
video
```

This provides much richer context than transcript-only tools.

---

# 70. Product Name Ideas

Possible directions:

* RecallFlow
* MeetVault
* CaptureMind
* Timeline AI
* MomentAI
* MeetingMemory
* RecallDesk
* TraceMeet
* SyncNote
* MindTrace
* MemoryDesk
* SessionAI

Branding can be decided after validating the MVP.

---

# 71. Primary Business Goal

The first business goal should not be:

> replace Zoom.

It should be:

> Become the best way to remember what happened during technical meetings.

That is smaller, easier to explain, and gives the product a strong initial niche.

---

# 72. Long-Term Business Goal

Eventually the application becomes:

**the searchable memory layer for companies.**

Employees stop asking:

> Does anyone remember why we made that decision?

They ask the system.

It responds with:

```text
The decision was made during the
Architecture Review on June 12.

Philip proposed using direct Azure Blob uploads.

Michael raised concerns about authorization.

The team agreed to use short-lived SAS tokens.

[View transcript]
[View screenshot]
[Play 21:42]
```

That is the long-term value of the platform.

---

# 73. Key Principle

The architecture should revolve around:

```text
SESSION
   ↓
TIMELINE
   ↓
EVENTS
```

Everything else attaches to that structure.

```text
Session
 ├── Video
 ├── Audio
 ├── Transcript
 ├── Screenshot
 ├── Note
 ├── Bookmark
 ├── Decision
 ├── Task
 ├── Speaker
 └── AI Insight
```

If this data model is built correctly from the beginning, the product can grow from a simple desktop recorder into a full enterprise knowledge platform without needing to redesign its foundation.
