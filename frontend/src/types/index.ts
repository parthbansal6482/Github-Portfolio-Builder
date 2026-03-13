// GitFolio — Shared TypeScript Interfaces
// These types are shared between frontend and backend.

export interface PinnedRepo {
  name: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: string | null;
  topics: string[];
}

export interface Repo {
  name: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: string | null;
  topics: string[];
  pushedAt: string;
  isArchived: boolean;
  isFork: boolean;
}

export interface GitHubData {
  profile: {
    name: string;
    bio: string;
    avatar: string;
    location: string | null;
    company: string | null;
    blog: string | null;
    followers: number;
    publicRepos: number;
  };
  pinnedRepos: PinnedRepo[];
  allRepos: Repo[];
  topLanguages: string[]; // recency-weighted, max 6
  contributions: {
    totalLastYear: number;
  };
}

export interface UserPreferences {
  role: 'frontend' | 'backend' | 'fullstack' | 'ml' | 'devops' | 'student';
  vibe: 'minimal' | 'dark' | 'warm' | 'corporate' | 'hacker';
  accentColor: string;
  layout: 'grid' | 'list' | 'casestudy' | 'timeline';
  highlights: string[];
  lookingForJob: boolean;
  customTagline: string | null;
}

export interface GeneratedCopy {
  headline: string;
  about: string;
  projectDescriptions: Record<string, string>;
  isFallback: false;
}

export interface FallbackCopy {
  headline: string;
  about: string;
  projectDescriptions: Record<string, string>;
  isFallback: true;
  fallbackReason: string;
}

export interface Portfolio {
  id: string;
  userId: string;
  githubData: GitHubData;
  preferences: UserPreferences;
  generatedCopy: GeneratedCopy | FallbackCopy | null;
  templateId: string;
  isPublished: boolean;
  viewCount: number;
  updatedAt: string;
}

// API error type for typed error handling
export interface ApiError {
  message: string;
  code: string;
  status: number;
}
