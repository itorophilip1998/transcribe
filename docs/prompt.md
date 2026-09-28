You are a principal software architect, senior desktop engineer, backend engineer, AI/ML engineer, DevOps engineer, security engineer, and product engineer.

Your task is to design and implement a production-grade application called **Meeting Intelligence Platform**.

This must NOT be treated as a demo, a single-page prototype, or a collection of disconnected scripts.

Design it as a scalable commercial SaaS product.

The application is an AI-powered desktop meeting recorder, transcription engine, screenshot capture system, visual meeting notebook, and searchable organizational memory platform.

========================================
PRODUCT GOAL
============

The application must allow a user to start a meeting session and automatically capture:

1. Screen recording
2. System audio
3. Owner microphone
4. Full meeting audio
5. Live transcription
6. Speaker diarization
7. Owner speaker identification
8. Manual screenshots
9. Automatic screenshots
10. Intelligent screenshots
11. Notes
12. Bookmarks
13. Meeting events
14. Decisions
15. Action items
16. Questions
17. Topics
18. AI-generated meeting summary

Everything must use ONE synchronized meeting timeline.

A screenshot captured at 00:24:15 must know that it belongs to 00:24:15 in:

* video
* audio
* transcript
* notes
* meeting timeline

Clicking any transcript entry or screenshot must eventually allow the application to jump to that exact timestamp in the video.

========================================
ARCHITECTURAL PRINCIPLE
=======================

Build everything around:

SESSION
↓
TIMELINE
↓
EVENTS

Every meeting artifact must reference:

sessionId
timestamp

Do not tightly couple features together.

Use modular services and interfaces.

========================================
TECHNOLOGY STACK
================

Use a monorepo.

Package manager:

pnpm

Monorepo tooling:

Turborepo

Use this structure:

meeting-platform/

apps/
desktop/
web/
api/
ai/
worker/

packages/
ui/
types/
database/
storage/
events/
config/
transcription/

infrastructure/
docker/
kubernetes/
terraform/

docs/

========================================
DESKTOP APPLICATION
===================

Use:

Electron
React
TypeScript
Vite
Tailwind CSS

Create a clean modern interface.

The desktop app is responsible for:

screen capture
microphone capture
system audio capture
screenshots
local meeting database
local file storage
recording chunks
upload queue
meeting controls
recovery

========================================
BACKEND
=======

Use:

NestJS
TypeScript
PostgreSQL
Prisma
Redis
BullMQ
WebSocket

Do not put heavy video/audio processing directly in HTTP controllers.

Use background jobs.

========================================
AI SERVICE
==========

Create a Python service using:

FastAPI

Responsibilities:

transcription
speaker diarization
speaker identification
embeddings
meeting summarization
decision extraction
action item extraction
topic extraction
question extraction
visual screenshot analysis

Design the AI provider layer so models can be changed later.

Do not hardcode the entire platform to one AI provider.

Create interfaces such as:

TranscriptionProvider

LLMProvider

EmbeddingProvider

VisionProvider

========================================
LOCAL DATABASE
==============

Use:

SQLite
Prisma

The desktop application must continue functioning without internet.

Create models for:

Session
Participant
TranscriptSegment
Screenshot
Recording
Event
Note
Bookmark
Decision
ActionItem
Question
Topic
Upload
StorageObject

========================================
CLOUD DATABASE
==============

Use PostgreSQL.

Create entities for:

User
Organization
Workspace
WorkspaceMember
Meeting
MeetingParticipant
Transcript
TranscriptSegment
MediaAsset
Screenshot
Note
Bookmark
Decision
ActionItem
Question
Topic
AIInsight
StorageObject
Upload
Subscription
UsageRecord

Use UUIDs.

========================================
SESSION SYSTEM
==============

Create a SessionManager.

Every session must include:

id
title
startedAt
endedAt
duration
status
localFolder
recordingStatus
transcriptionStatus
uploadStatus

Implement a monotonic SessionClock.

Do not rely purely on Date.now() for media synchronization.

All meeting-related events must use the session clock.

========================================
EVENT TIMELINE
==============

Create a generic Event model.

Supported types:

SESSION_STARTED
SESSION_STOPPED
SCREENSHOT
TRANSCRIPT_SEGMENT
NOTE
BOOKMARK
SPEAKER_CHANGE
WINDOW_CHANGE
ACTION_ITEM
DECISION
QUESTION
TOPIC
RECORDING_PAUSED
RECORDING_RESUMED

Every event contains:

id
sessionId
timestamp
type
metadata
createdAt

========================================
MEETING FOLDER
==============

When a meeting starts automatically create:

MeetingVault/
YYYY/
Month/
MeetingName_timestamp/

Inside create:

meeting.json

transcript/
video/
audio/
screenshots/
ai/
metadata/
chunks/

At finalization generate:

meeting.docx
meeting.pdf

Example:

meeting-folder/

meeting.docx
meeting.pdf

transcript/
transcript.json
transcript.txt
transcript.srt
transcript.vtt

video/
meeting.mp4

audio/
owner.wav
system.wav
combined.wav

screenshots/

ai/
summary.json
decisions.json
action_items.json
topics.json

metadata/
session.json

========================================
RECORDING ENGINE
================

Do NOT keep an entire meeting Blob in memory.

Record using chunks.

Default chunk duration:

5 seconds

Persist every chunk immediately.

Example:

chunks/
video_000001.webm
video_000002.webm
video_000003.webm

audio_owner_000001.webm
audio_system_000001.webm

Implement:

RecordingService
ChunkWriter
RecordingFinalizer
RecordingRecoveryService

Use FFmpeg when necessary for final media processing.

========================================
SCREEN CAPTURE
==============

Allow user to choose:

entire screen
monitor
application window

Implement ScreenCaptureService.

The service must expose a stable interface rather than placing Electron calls throughout UI components.

========================================
MICROPHONE
==========

Create MicrophoneCaptureService.

Owner microphone must be captured independently.

Do not immediately merge it permanently with system audio.

Store:

owner audio

system audio

combined audio

The separate owner audio will later be used to identify the user's voice.

========================================
OWNER SPEAKER IDENTIFICATION
============================

First implementation:

speech originating from the local microphone can safely be associated with the owner.

Later provide optional voice enrollment.

Create a SpeakerIdentityService abstraction.

Future implementation should support speaker embeddings.

Do not force biometric enrollment.

========================================
SYSTEM AUDIO
============

Capture system audio when supported by the operating system.

Architect platform-specific implementations.

Create:

SystemAudioCaptureProvider

implementations:

MacOSSystemAudioProvider
WindowsSystemAudioProvider
LinuxSystemAudioProvider

The UI should clearly explain platform limitations.

========================================
SCREENSHOT SERVICE
==================

Create ScreenshotService.

Support:

MANUAL
INTERVAL
SMART

MANUAL:

user presses screenshot button.

INTERVAL:

capture every configurable interval.

SMART:

capture when significant visual change occurs.

Each screenshot must contain:

id
sessionId
timestamp
filePath
trigger
windowTitle
applicationName
createdAt

========================================
SMART SCREENSHOT
================

Initially implement simple image difference detection.

Do NOT send every video frame to an AI service.

Use local lightweight image comparison.

Detect meaningful differences between previous and current frame.

Add configurable threshold.

Later allow:

slide change detection
application change
presentation detection
bookmark-triggered screenshot

========================================
TRANSCRIPTION
=============

Build a transcription pipeline that supports both:

live transcription
post-meeting transcription

Transcript segment:

id
sessionId
speakerId
speakerName
start
end
text
confidence
language

Persist segments immediately.

Do not wait until meeting completion before saving transcript.

========================================
TRANSCRIPT FORMAT
=================

Example:

{
"id": "segment_x",
"sessionId": "session_x",
"start": 125.11,
"end": 131.55,
"speakerId": "owner",
"speakerName": "Philip",
"text": "We need to migrate this service.",
"confidence": 0.97
}

========================================
MEETING TOOLBAR
===============

When recording is active show a floating toolbar.

Example:

REC 00:42:17

buttons:

microphone
screenshot
note
bookmark
pause
stop

Toolbar should be:

small
always-on-top
movable
minimal
non-obstructive

========================================
MAIN DASHBOARD
==============

Create:

New Meeting

Recent Meetings

Search

Action Items

Workspace

Settings

Show meeting cards containing:

title
date
duration
participants
processing status

========================================
MEETING DETAIL VIEW
===================

Tabs:

Summary
Transcript
Screenshots
Notes
Decisions
Tasks
Participants

Main layout:

video player

synchronized timeline

transcript

Clicking transcript:

video.currentTime = transcript.start

Clicking screenshot:

video.currentTime = screenshot.timestamp

========================================
NOTES
=====

Users can create notes while recording.

Note includes:

sessionId
timestamp
content

Also capture nearby transcript context.

========================================
BOOKMARKS
=========

Implement a Bookmark button.

Bookmarked moments should later be prioritized by the AI analysis pipeline.

========================================
DOCUMENT GENERATION
===================

Do NOT continuously modify the DOCX while recording.

Persist raw meeting data.

Generate documents after the meeting.

Create DocumentGenerationService.

Input:

Session
Transcript
Screenshots
Summary
Decisions
ActionItems
Questions
Topics

Output:

DOCX
PDF

========================================
DOCUMENT STRUCTURE
==================

Meeting title

Date

Duration

Participants

Executive summary

Key topics

Key decisions

Action items

Questions

Risks

Transcript

Screenshots

Place screenshots close to corresponding transcript timestamps.

For screenshot at timestamp X:

find transcript approximately:

X - 20 seconds
to
X + 40 seconds

Use this transcript context when placing the screenshot.

========================================
EXPORTS
=======

Support:

DOCX
PDF
TXT
JSON
Markdown
SRT
VTT

========================================
LOCAL-FIRST
===========

Recording must NOT require internet.

The following must work offline:

meeting creation
recording
screenshots
notes
bookmarks
local persistence

Cloud-dependent functionality should enter a queue.

========================================
UPLOAD SYSTEM
=============

Create UploadManager.

States:

PENDING
UPLOADING
UPLOADED
FAILED
RETRYING

Support:

retry
resume
checksum validation
exponential backoff

========================================
STORAGE ABSTRACTION
===================

Create:

StorageProvider

Methods:

save
read
delete
exists
list
upload
download
getUrl

Implement initially:

LocalStorageProvider
AzureBlobStorageProvider

Design so we can later add:

S3StorageProvider
GoogleDriveStorageProvider
OneDriveStorageProvider

========================================
DIRECT CLOUD UPLOAD
===================

Do not proxy huge video files through the NestJS API.

Architecture:

Desktop
->
API requests temporary upload permission
->
API generates temporary signed upload URL
->
Desktop uploads directly to object storage

For Azure use temporary SAS access.

========================================
AI MEETING PROCESSING
=====================

After transcript is ready enqueue AI analysis.

Generate structured JSON for:

summary
decisions
actionItems
questions
topics
risks
keyMoments

Do not only save natural-language paragraphs.

========================================
SEARCH
======

Implement ordinary text search first.

Search:

meeting title
transcript
notes
participants
decisions
action items

Later implement semantic search.

========================================
VECTOR SEARCH
=============

Prepare architecture for embeddings.

Create semantic chunks from transcript.

Each chunk should contain:

meetingId
startTimestamp
endTimestamp
speakerIds
text

Embeddings must point back to original timestamps.

Eventually a semantic result must be able to open the meeting at the right moment.

========================================
AI Q&A
======

Future architecture must support questions such as:

"What did we decide about Azure uploads?"

Response evidence must reference:

meeting
speaker
timestamp
transcript
optional screenshot

Do not build a hallucination-heavy chatbot.

Answers must be grounded in indexed meeting data.

========================================
CRASH RECOVERY
==============

When recording starts create:

session.lock

Delete it only after safe finalization.

When application starts, detect unfinished sessions.

Display:

Unfinished meeting detected.

Recover
Discard

Recovery should reconstruct from:

chunks
transcript
screenshots
events
SQLite

========================================
MEDIA RECOVERY
==============

Never assume final video exists.

The system should be able to rebuild final media from persisted chunks.

========================================
DISK MANAGEMENT
===============

Before recording:

check free disk space.

During recording:

periodically monitor disk space.

Warn user when space becomes low.

Do not abruptly lose a recording because the drive is full.

========================================
STATE MACHINE
=============

Meeting status:

CREATED
STARTING
RECORDING
PAUSED
STOPPING
PROCESSING
COMPLETED
FAILED
RECOVERING

Implement explicit state transitions.

Do not rely on scattered boolean flags.

========================================
SECURITY
========

Implement:

secure IPC
contextIsolation
no unrestricted nodeIntegration
strict preload bridge
input validation
signed URLs
short-lived cloud credentials
secure token storage
authorization
RBAC

Never expose storage credentials directly.

========================================
PRIVACY
=======

Provide settings:

local-only meetings
cloud sync
screenshots on/off
microphone on/off
transcription on/off
smart capture on/off
voice profile on/off

Always show visible recording status.

========================================
AUTHENTICATION
==============

Prepare backend for:

email/password
Google
Microsoft
GitHub

Create proper session/token architecture.

Do not implement insecure local token storage.

========================================
ORGANIZATIONS
=============

Cloud version should support:

Organization
Workspace
Member

Roles:

OWNER
ADMIN
MEMBER
VIEWER

Meetings belong to workspaces.

========================================
FUTURE ENTERPRISE SUPPORT
=========================

Architecture must not prevent later support for:

SSO
SAML
SCIM
audit logs
data retention policies
regional storage
custom object storage
private deployments

Do not implement all enterprise features immediately.

Keep architecture extensible.

========================================
BACKGROUND JOBS
===============

Use BullMQ.

Initial queues:

transcription
media-processing
ai-analysis
document-generation
upload
indexing

Jobs must be idempotent.

========================================
OBSERVABILITY
=============

Implement structured logging.

Each log should include where relevant:

sessionId
userId
meetingId
jobId

Prepare hooks for:

Sentry
OpenTelemetry
metrics

========================================
DOCKER
======

Create Docker configuration for:

PostgreSQL
Redis
API
AI service
Worker
Web

Provide one root command that starts the development environment.

Example:

pnpm dev

or:

docker compose up

========================================
ENVIRONMENT
===========

Create:

.env.example

Never commit secrets.

Validate environment configuration on startup.

========================================
TESTING
=======

Create:

unit tests
integration tests
end-to-end tests

Critical areas requiring tests:

SessionClock
Recording state machine
ChunkWriter
CrashRecovery
Screenshot timestamping
Transcript timestamp mapping
Storage providers
Upload retry
Document generation

========================================
ERROR HANDLING
==============

Never silently swallow errors.

Create typed errors.

User-facing errors must be understandable.

System errors should contain technical context in logs.

========================================
CODE QUALITY
============

Use:

strict TypeScript
ESLint
Prettier
shared types
DTO validation
dependency injection
small modules
interfaces

Avoid god classes.

Avoid files containing thousands of lines.

Avoid placing business logic directly in UI components.

========================================
INITIAL DEVELOPMENT PHASES
==========================

BUILD PHASE 1 FIRST.

PHASE 1:

monorepo
desktop shell
meeting creation
SessionManager
SessionClock
local folder generation
SQLite
screen capture
microphone capture
recording chunks
manual screenshots
event timeline
pause
resume
stop
recovery

PHASE 2:

system audio
combined recording
FFmpeg finalization
meeting player
timeline navigation

PHASE 3:

transcription
live transcript
speaker diarization
owner identification

PHASE 4:

DOCX
PDF
screenshot placement
summary
decisions
action items

PHASE 5:

NestJS cloud backend
authentication
PostgreSQL
workspaces

PHASE 6:

Azure Blob
upload queue
direct cloud upload

PHASE 7:

semantic search
AI Q&A
organization memory

========================================
IMPORTANT IMPLEMENTATION RULE
=============================

DO NOT try to implement every future feature before the core recorder works.

The first milestone is:

START MEETING
↓
record screen
↓
record owner microphone
↓
capture screenshots
↓
timestamp everything
↓
persist continuously
↓
STOP
↓
recoverable meeting folder

This must be highly reliable before proceeding.

========================================
FIRST DELIVERABLE
=================

Start by producing:

1. Full repository architecture
2. Domain model
3. SQLite schema
4. PostgreSQL schema
5. Session state machine
6. IPC design
7. Storage interfaces
8. Recording architecture
9. Event architecture
10. Development milestones

Then scaffold the monorepo.

Then implement Phase 1.

Do not jump ahead.

========================================
DOCUMENTATION
=============

Create documentation for:

architecture
setup
desktop permissions
media architecture
data model
recording lifecycle
recovery
storage system
transcription pipeline
security
deployment

Include architecture diagrams using Mermaid.

========================================
FINAL ENGINEERING PRINCIPLE
===========================

Build this as a product that may eventually serve:

100 users
10,000 users
1,000,000 users

But do not prematurely create unnecessary microservices.

Start as a modular monolith with clean boundaries.

The system must be:

local-first
crash-resistant
memory-efficient
secure
modular
observable
testable
scalable

The most important data relationship in the entire system is:

MEETING
+
TIMESTAMP

Every transcript, screenshot, note, bookmark, video segment, audio segment, decision, and action item must always be traceable back to the exact meeting and time where it occurred.
