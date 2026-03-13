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

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  contributionCount: number;
}

export interface ContributionCalendar {
  total: number;
  weeks: {
    contributionDays: ContributionDay[];
  }[];
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
    calendar?: ContributionCalendar;
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
  templateId: 'default' | 'neo-brutalism' | 'glassmorphism' | 'retro-rpg';
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
  enrichedData?: EnrichedGitHubData | null;
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

// ============================================
// Enriched GitHub Data Interfaces
// ============================================

export interface LanguageBreakdown {
  [language: string]: number;
}

export interface ActiveRepo {
  name: string;
  commitCount: number;
  url: string;
  qualityScore?: number;
  qualityLabel?: string;
}

export interface CommitPatterns {
  byDayOfWeek: {
    Sun: number;
    Mon: number;
    Tue: number;
    Wed: number;
    Thu: number;
    Fri: number;
    Sat: number;
  };
  byHourOfDay: Record<string, number>;
  peakDay: string;
  peakHour: number;
  summary: string;
}

export interface SkillCluster {
  skillName: string;
  technologies: string[];
  indicators: string[];
  evidenceRepos: string[];
}

export interface ForkInterest {
  category: string;
  repos: string[];
  description: string;
}

export interface WorkingStyle {
  explorationScore: number;
  breadthScore: number;
  summary: string;
}

export interface QualityDimension {
  score: number;
  rawValue: number;
  label: string;
}

export interface RepoCommitQuality {
  repoName: string;
  sampleSize: number;
  messageQuality: QualityDimension;
  atomicity: QualityDimension;
  fixRatio: QualityDimension;
  testCoverage: QualityDimension;
  conventionalCommits: QualityDimension;
  compositeScore: number;
  compositeLabel: string;
  messageCategories: {
    feat: number;
    fix: number;
    docs: number;
    refactor: number;
    test: number;
    chore: number;
    other: number;
  };
  aiObservation: string | null;
}

export interface CommitQualityAnalysis {
  qualityByRepo: RepoCommitQuality[];
  overall: {
    compositeScore: number;
    compositeLabel: string;
    messageQualityScore: number;
    atomicityScore: number;
    fixRatioScore: number;
    testCoverageScore: number;
    consistencyScore: number;
    conventionalCommitsScore: number;
  };
  overallSummary: string | null;
  consistencyScoreNote: string | null;
  reposAnalyzed: string[];
  totalCommitsSampled: number;
  generatedAt: string;
}

export interface EnrichedGitHubData {
  languageBreakdown: LanguageBreakdown;
  mostActiveRepos: ActiveRepo[];
  externalPRsMerged: number;
  externalReposContributed: string[];
  commitPatterns: CommitPatterns;
  skillClusters: SkillCluster[];
  forkInterests: ForkInterest[];
  workingStyle: WorkingStyle;
  commitQuality: CommitQualityAnalysis | null;
  generatedAt: string;
}
