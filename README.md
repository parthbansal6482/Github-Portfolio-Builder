# 🚀 GitFolio

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e)](https://supabase.com/)
[![Anthropic Claude](https://img.shields.io/badge/AI-Claude_3.5_Sonnet-d6a17b)](https://anthropic.com/)

**GitFolio** is an automated, AI-powered application designed to transform a developer's GitHub profile into a fully structured, multi-themed, professional portfolio website in seconds.

By leveraging the GitHub REST and GraphQL APIs, along with Large Language Models (LLMs) like Anthropic Claude, GitFolio takes away the manual effort of maintaining a personal website. It automatically ingests your open-source contributions, pinned repositories, and language statistics, enriches them with qualitative metrics, and generates professional copywriting to showcase your best work.

---

## ✨ Features

- **Instant Portfolio Generation:** Sign in with GitHub and get a fully built portfolio in seconds.
- **Multiple Thematic Templates:** Choose from beautifully crafted frontend templates including **Default**, **Glassmorphism**, **Neo Brutalism**, and **Retro RPG** to match your personal brand.
- **AI-Powered Copywriting:** Uses Anthropic Claude 3.5 Sonnet to automatically write professional "About Me" sections, catchy taglines, and engaging, non-technical summaries of your pinned projects.
- **Commit Quality Analysis:** Analyzes your top repositories to compute detailed metrics:
  - AI-Driven Message Quality
  - Commit Atomicity (files changed per commit)
  - Feature-to-Fix Ratio
  - Contribution Consistency (standard deviations over 365 days)
  - Conventional Commits Adherence
- **365-Day Contribution Heatmap:** A native, responsive GitHub-style activity graph seamlessly integrated into every theme.
- **Real-Time Data Sync:** Keeps your portfolio up-to-date with your latest GitHub activity via an automated robust backend pipeline.

---

## 🛠 Tech Stack

GitFolio uses a modern, full-stack architecture separated into a frontend client and a backend API.

### Frontend
- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 18)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** `lucide-react`
- **Language:** TypeScript

### Backend
- **Server:** Node.js with Express.js
- **Execution:** `tsx` for fast TypeScript execution
- **API integrations:** GitHub REST API, GitHub GraphQL API, Anthropic SDK
- **Language:** TypeScript

### Database & Auth
- **BaaS:** [Supabase](https://supabase.com/) (PostgreSQL Database & GitHub OAuth Providers)

---

## 🏗 Architecture & Application Flow

1. **Authentication:** User signs in via Supabase GitHub OAuth.
2. **Onboarding:** User selects a visual template and an accent color.
3. **Synchronization (`/api/github/sync`):** The backend fetches standard profile data, pinned repos, and the daily contribution calendar via GraphQL.
4. **Enrichment:** The backend analyzes commit history for the top 3 most active repositories to generate the Commit Quality Analysis score.
5. **AI Generation (`/api/generate`):** Anthropic Claude 3.5 Sonnet consumes the raw user data + enriched metrics to write personalized headlines, bios, and project summaries.
6. **Rendering:** The user is redirected to `/portfolio/[username]`, where Next.js server-renders the matching React template dynamically injected with the stored Supabase data.

*(For a deeper dive into the architecture, check out the `/docs` folder!)*

---

## 🚀 Getting Started

Follow these steps to set up and run GitFolio on your local machine.

### Prerequisites
- Node.js (v18 or higher)
- A [Supabase](https://supabase.com/) project (with GitHub OAuth configured)
- A [GitHub Personal Access Token](https://github.com/settings/tokens) (classic, with `repo` and `read:user` scopes)
- An [Anthropic API Key](https://console.anthropic.com/)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/GitFolio.git
cd GitFolio
```

### 2. Install dependencies
Install the packages for the root workspace, frontend, and backend.
```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

### 3. Environment Variables
You need to map your API keys to the `.env` files. We use a split development environment.

**Create `backend/.env`:**
```shell
PORT=4000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GITHUB_TOKEN=your_github_personal_access_token
ANTHROPIC_API_KEY=your_anthropic_api_key
```

**Create `frontend/.env.local`:**
```shell
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

### 4. Running the Application
GitFolio requires both the frontend and backend servers to be running concurrently.

**Start the Backend API:**
```bash
npm run dev:backend
```
*The backend API will run on `http://localhost:4000`*

**Start the Frontend App:**
```bash
npm run dev:frontend
```
*The Next.js frontend will run on `http://localhost:3000`*

---

## 📖 Usage

1. Open `http://localhost:3000` in your browser.
2. Click **Sign in with GitHub**.
3. Complete the onboarding wizard (select a theme and color).
4. Wait for the pipeline to finish syncing your data and generating your AI copy (this usually takes 10-15 seconds depending on repository size).
5. Share your beautiful, auto-generated `/portfolio/[username]` link with the world!

---

## 🤝 Contributing

Contributions are always welcome! Whether it's adding a new frontend template, optimizing the LLM prompts, or fixing a bug.
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
