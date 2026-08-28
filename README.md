# Kleo — Document Chat

Kleo is a small document-chat application built for a take-home assignment. Upload a PDF, TXT, or Markdown file inside the conversation, ask questions, and get streamed answers grounded in the document with expandable evidence cards.

## Live demo

- **Vercel URL:** _Add after deployment_
- **GitHub:** _Add after pushing the repository_

## Features

- In-chat upload for PDF, TXT, and Markdown files
- Neon Postgres persistence for documents, chunks, embeddings, chats, and messages
- pgvector semantic retrieval with cosine similarity
- Streamed answers via Vercel AI SDK + AI Gateway
- Expandable evidence cards rendered from the `showEvidence` tool
- Loading, empty, and error states
- Conversation survives page reload via `/chat/[id]`

## Tech stack

- Next.js 16 App Router + TypeScript
- Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/gateway`)
- Neon Postgres + pgvector
- Drizzle ORM
- shadcn/ui + Tailwind CSS
- `unpdf` for PDF text extraction

## Setup

### Prerequisites

- Node.js 22+
- A Neon Postgres database with the `vector` extension enabled
- A Vercel AI Gateway API key

### 1. Install dependencies

```bash
cd kleo
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Set:

```env
DATABASE_URL=postgresql://...
AI_GATEWAY_API_KEY=...
```

### 3. Run database migrations

Enable pgvector and apply the schema:

```bash
npm run db:migrate
```

If you prefer pushing schema directly during development:

```bash
npm run db:push
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```text
Upload -> parse/chunk -> embedMany -> store chunks in Neon
Question -> embed query -> pgvector search -> streamText + showEvidence tool
Reload -> hydrate chat/messages/documents from Neon
```

### Database schema

| Table | Purpose |
|---|---|
| `chats` | One conversation per URL |
| `documents` | Uploaded file metadata and processing status |
| `chunks` | Extracted text segments + `vector(1536)` embeddings |
| `messages` | Persisted chat history as AI SDK `UIMessage` parts |

## Deployment

### Vercel

1. Push this repo to GitHub
2. Import the project in Vercel (Hobby plan)
3. Add the Neon integration or set `DATABASE_URL`
4. Add `AI_GATEWAY_API_KEY`
5. Run migrations against the production database
6. Deploy

Suggested commands:

```bash
vercel link
vercel integration add neon
vercel env pull .env.local
npm run db:migrate
vercel --prod
```

## Trade-offs

- **Single chat per URL** instead of a multi-chat sidebar to keep v1 focused
- **No raw file storage** — only extracted chunks and metadata are persisted
- **Fixed-size chunking** instead of semantic chunking or reranking
- **No authentication** — chats are accessible to anyone with the URL
- **Synchronous ingestion** in the upload request for simplicity on small files

## Time spent

| Phase | Time |
|---|---|
| Scaffold + dependencies | ~45 min |
| Database + migrations | ~30 min |
| Ingestion pipeline | ~60 min |
| RAG + chat API | ~75 min |
| UI + evidence cards | ~70 min |
| README + deploy prep | ~30 min |

## AI tools used

- Cursor Agent for scaffolding, implementation, and iteration
- Vercel AI SDK docs in `node_modules/ai/docs/` for v6/v7 API verification

## AI correction example

During implementation, the initial plan referenced AI SDK v5 patterns such as `useChat({ api: '/api/chat' })` and `handleSubmit`. After checking the installed SDK docs, those were replaced with v6/v7 patterns:

- `DefaultChatTransport` with `body: { chatId }`
- `sendMessage({ text })` for user input
- `stopWhen: stepCountIs(2)` instead of `maxSteps`
- `toUIMessageStreamResponse({ originalMessages, generateMessageId, onFinish })` for persistence

This avoided runtime errors and duplicate assistant messages.

## Scripts

```bash
npm run dev
npm run build
npm run db:generate
npm run db:migrate
npm run db:push
```
