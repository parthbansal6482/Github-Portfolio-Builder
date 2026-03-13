# GitFolio Setup Instructions

Welcome to GitFolio! This is a monorepo containing a Next.js (Frontend) and an Express.js (Backend). Follow these instructions to set up the app locally.

## 1. Prerequisites
- Node.js (v18+)
- Postgres Database (Supabase recommended)
- GitHub OAuth App (for authentication)
- Anthropic API Key (for the LLM copy generation)

## 2. Environment Variables

You need to configure two `.env` files—one for the backend and one for the frontend.

### Backend (`backend/.env`)
Create a file at `backend/.env` with the following variables:

```env
# Required: Supabase connection (Service role required for backend tasks)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Required: Anthropic API Key for generating text
ANTHROPIC_API_KEY=your_anthropic_api_key

# Required: Must match the frontend's NEXTAUTH_SECRET to verify JWTs
NEXTAUTH_SECRET=a_secure_random_string

# Required for ISR invalidation
REVALIDATE_SECRET=another_secure_random_string

# Optional: Defaults
FRONTEND_URL=http://localhost:3000
PORT=4000
```

### Frontend (`frontend/.env.local` or `frontend/.env`)
Create a file at `frontend/.env.local` with the following variables:

```env
# Required: Supabase connection (Anon key for frontend)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Required: NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=a_secure_random_string # MUST MATCH backend/.env

# Required: GitHub OAuth App Credentials (Callback URL: http://localhost:3000/api/auth/callback/github)
GITHUB_ID=your_github_oauth_client_id
GITHUB_SECRET=your_github_oauth_client_secret

# Optional: Defaults
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

## 3. Database Schema
Ensure your Supabase project has the correct schema applied. A schema definition is provided in `schema.sql` (if available) or defined in your design. Ensure the following tables exist:
- `profiles`
- `portfolios`

## 4. Install Dependencies
From the root of the project, run:
```bash
npm install
```

## 5. Running the Application
The project uses NPM workspaces. You can run both the frontend and backend simultaneously from the root directory:

```bash
npm run dev
```

Alternatively, you can run them individually:
- **Backend only:** `npm run dev:backend`
- **Frontend only:** `npm run dev:frontend`

## 6. Usage
- Go to `http://localhost:3000`
- Click "Get Started" to authenticate with GitHub.
- Follow the wizard to choose your custom subdomain, fetch data, configure your vibe/role, and let the AI generate your portfolio.
- Review your generated copy and hit Publish!
