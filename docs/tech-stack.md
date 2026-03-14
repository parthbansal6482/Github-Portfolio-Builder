# Technology Stack

GitFolio is structured as a modern full-stack web application.

## Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 18)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: `lucide-react`
- **Language**: TypeScript

## Backend
- **Runtime**: Node.js
- **Server**: Express.js
- **Language**: TypeScript
- **Execution**: `tsx` for local execution and compilation

## External Services & APIs
- **Database / Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Source Data**: GitHub API (REST for profile/repos, GraphQL for contribution calendar)
- **AI / LLM**: [Anthropic Claude 3.5 Sonnet](https://www.anthropic.com/) (via `@anthropic-ai/sdk`)

## Core Libraries & Utilities
- `axios` (API requests)
- `cors` (Cross-Origin Resource Sharing)
- `dotenv` (Environment variables)
