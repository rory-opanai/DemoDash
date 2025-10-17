# OpenAI Demo Dashboard

A fully functional Next.js demo that exercises the latest OpenAI APIs across image, video, voice, embeddings, structured output, and support workflows. Users provide their own API key (BYOK) in the Settings page; all requests are proxied through Next.js route handlers for security and observability.

## Features

- **Image generation** using `gpt-image-1`/`dall-e-3` with multiple variations, quality and size controls, live download, and Remix support.
- **Video generation** with `sora-2`/`sora-2-pro`. Jobs are polled until completion, thumbnails/videos are downloaded and cached client-side, and history cards surface progress, retry, and Remix.
- **Realtime voice + multimodal** assistant: record audio, transcribe with Whisper, receive streamed text plus synthesized speech (`gpt-4o-mini-tts`). Manual text input is also supported.
- **Knowledge assistant** with optional file guardrails, tone presets, file upload via the Files API, inline error handling, and surfaced source citations.
- **Embeddings search** with live indexing (`text-embedding-3`), semantic retrieval, inspector with top‑K results, and conversational summaries.
- **Structured output / function calling** that constrains responses to JSON schemas and optionally enables tool-calling hints.
- **Support bot** leveraging streaming Responses API with tone and escalation toggles.
- **Sales forecasting agent** that pulls Salesforce opportunities via MCP, generates OpenAI-backed narratives, and renders live charts.
- **Connectors (MCP)** overview for managing Salesforce, Zendesk, and Google Drive integrations with health-check API routes.
- Shared history with Remix, download, share, delete, clear-all controls, and persistent storage via Zustand.

## Tech Stack

- Next.js (App Router) + React 18 + TypeScript
- Tailwind CSS + lightweight component primitives
- Zustand for persisted client state
- OpenAI Node SDK (`openai@^6`)

## Prerequisites

- Node.js 18+
- An OpenAI API key with access to the models you plan to demo (image, video, responses, audio, embeddings, files).

## Quick Start

```bash
# install dependencies
npm install

# start the local dev server
npm run dev
```

Open <http://localhost:3000>, navigate to **Settings**, and paste your OpenAI API key. The key is stored locally (Zustand + localStorage) and is forwarded to API routes via an `X-OPENAI-KEY` header.

## Configuration & Environment

| Setting | Description |
| --- | --- |
| `OpenAI API Key` (Settings page) | Required. Stored locally, never persisted server-side. |
| `Default Model` (Settings page) | Prefills the model selector for features that support text models. |
| `SALESFORCE_MCP_ENDPOINT` | Optional. URL for the Salesforce MCP connector used by the forecasting agent. |
| `SALESFORCE_MCP_TOKEN` | Optional bearer token forwarded to the Salesforce MCP endpoint. |
| `SALESFORCE_MCP_ENABLE_DEMO` | When `true`, seeds the forecasting agent with sample opportunities for local testing. |

All requests flow through App Router API routes (under `app/api/**/*`) which validate the presence of the `X-OPENAI-KEY` header via a shared BYOK guard.

## Supported Models & Parameters

Feature | Default Model(s) | Key Parameters
--- | --- | ---
Image Generation | `gpt-image-1`, `dall-e-3` | size, quality, output format, versions
Video Generation | `sora-2`, `sora-2-pro` | resolution, duration (4/8/12s)
Realtime Voice | `gpt-4o-mini` (responses), `gpt-4o-mini-tts` (speech) | voice preset, prompt history
Knowledge Assistant | `gpt-4.1-mini` | tone, guardrails, file corpus
Embeddings Search | `text-embedding-3-small` | corpus id, topK
Structured Output | `gpt-4.1-mini` | schema selection, tool-calling hint
Support Bot | `gpt-4.1-mini` (streaming responses) | tone, escalation toggle

## Implementation Notes

- **API Routes** live under `app/api`. Each route validates the BYOK header, calls the OpenAI SDK, and returns normalized JSON for the UI.
- **History UX** (`src/components/feature/*`) now includes actionable download/share/remix controls, progress indicators, failure messaging, and JSON/session previews.
- **Realtime** endpoints:
  - `POST /api/realtime/transcribe` → Whisper transcription of microphone audio.
  - `POST /api/realtime/respond` → Responses API for text + Text-to-Speech (TTS) audio payloads.
- **Video** endpoints:
  - `POST /api/video/generate` → create Sora jobs.
  - `GET /api/video/jobs/:id` → poll status, surface poster/video URLs.
  - `GET /api/video/jobs/:id/content` → download binary content (used client-side to create blob URLs).

## Development

- **Type Checking**: `npm run type-check`
- **Linting**: `npm run lint`

History state is persisted locally (`localStorage`) so clearing site data resets demo runs.

## Testing the Demo

1. Add your OpenAI API key in **Settings**.
2. Exercise each feature under **Start Demoing**:
   - Generate images/videos and download results from history cards.
   - Record audio in the realtime assistant, confirm transcription, text response, and playable MP3.
   - Upload documents, run embeddings search, inspect semantic matches.
   - Toggle guardrails/tones on the knowledge assistant and support bot to confirm behavioural changes.
   - Validate failure paths by temporarily clearing the API key or forcing invalid parameters—the UI should surface friendly error messages.
   - Visit **Forecasting** and **Connectors** to confirm MCP-enabled flows render helpful guidance when Salesforce credentials are missing.

## License

MIT
