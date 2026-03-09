# Sourcy Supplier Intelligence Chatbot

Standalone Next.js chatbot prototype for supplier search and evaluation. The app uses Gemini (via Vercel AI SDK) plus one server-side tool that queries Sourcy Supplier Intelligence API.

## Stack

- Next.js App Router (TypeScript)
- Tailwind CSS v4
- `ai` + `@ai-sdk/react` + `@ai-sdk/google`
- Single tool: `search_suppliers`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

3. Start dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Features

- Streaming chat with visible Gemini reasoning
- Tool call progress UI while Sourcy API is executing
- Fast vs Deep query mode (`RAG_COMPLETION` / `GRAPH_COMPLETION_CONTEXT_EXTENSION`)
- Supplier card rendering from assistant output
- Dummy local auth (in-memory users + localStorage auth state)
- Chat limit gates (anonymous: 2, authenticated: 5/day)

## Project Structure

- `app/api/chat/route.ts`: streaming chat route + Gemini/tool orchestration
- `lib/tools.ts`: `search_suppliers` tool definition
- `lib/prompts.ts`: Sourcy system prompt
- `components/chat/*`: chat UI, thinking/tool blocks, supplier cards
- `components/auth/*`: auth provider + login modal
- `lib/chat-limits.ts`, `hooks/use-chat-limit.ts`: client-side usage limits
