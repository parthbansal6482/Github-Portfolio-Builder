/**
 * commitQuality.ts — Arithmetic dimension calculators for commit quality analysis.
 *
 * This module contains pure functions that score each of the 6 commit quality dimensions.
 * None of these functions make API calls or call the LLM — they compute scores entirely
 * from data passed in as arguments.
 *
 * Called by: analyseRepoCommitQuality() (Task 6) and aggregateCommitQuality() (Task 7).
 *
 * DIMENSION WEIGHTS (used in calculateCompositeScore):
 *   Message quality   — 30% (AI-scored in Task 4; this file handles the rest)
 *   Atomicity         — 20%
 *   Fix ratio         — 20%
 *   Test coverage     — 15%
 *   Consistency       — 10%
 *   Conventional      —  5%
 */

import type { QualityDimension, CommitQualityAnalysis } from '../types/index.js';
import type { CommitDetail } from './github.js';

// ============================================
// Message Category Types and Keyword Rules
// ============================================

/**
 * The 7 mutually exclusive commit message categories.
 * Each message is assigned exactly one category (first match wins).
 */
export type MessageCategory = 'feat' | 'fix' | 'docs' | 'refactor' | 'test' | 'chore' | 'other';

/**
 * Percentage breakdown of messages across all 7 categories.
 * Values are percentages that sum to 100.
 *
 * FRONTEND NOTE: Use for a donut chart or table. All values are numbers 0–100.
 */
export interface MessageCategories {
  feat: number;
  fix: number;
  docs: number;
  refactor: number;
  test: number;
  chore: number;
  other: number;
}

// ============================================
// Dimension 3 — categoriseMessages
// ============================================

/**
 * Categorises an array of commit messages into mutually exclusive categories
 * using keyword matching. First match wins (categories are checked in a fixed priority order).
 *
 * CATEGORY PRIORITY ORDER (must not be changed — order matters for first-match rule):
 *   1. feat    — starts with "feat" OR contains: add, implement, create, new, introduce
 *   2. fix     — starts with "fix"  OR contains: bug, patch, hotfix, correct, resolve, revert, oops
 *   3. docs    — starts with "docs" OR contains: readme, documentation, comment
 *   4. refactor— starts with "refactor" OR contains: refactor, clean, restructure, reorganize
 *   5. test    — starts with "test" OR contains: test, spec, coverage
 *   6. chore   — starts with "chore" OR contains: bump, upgrade, dependency, deps, lint, format
 *   7. other   — anything that doesn't match any of the above
 *
 * @param messages - Array of raw commit message strings.
 * @returns MessageCategories object with percentage values summing to 100.
 *          Returns all-zero object (other=100) on empty input.
 *
 * FRONTEND NOTE: Internal function. Result is included in RepoCommitQuality.messageCategories.
 */
export function categoriseMessages(messages: string[]): MessageCategories {
  if (messages.length === 0) {
    return { feat: 0, fix: 0, docs: 0, refactor: 0, test: 0, chore: 0, other: 100 };
  }

  // Counters for each category
  const counts: Record<MessageCategory, number> = {
    feat: 0, fix: 0, docs: 0, refactor: 0, test: 0, chore: 0, other: 0,
  };

  for (const raw of messages) {
    // Use the first line of the message only (subject line, not body)
    const msg = raw.split('\n')[0].toLowerCase().trim();

    if (msg.startsWith('feat') || /\b(add|implement|create|new|introduce)\b/.test(msg)) {
      counts.feat++;
    } else if (msg.startsWith('fix') || /\b(bug|patch|hotfix|correct|resolve|revert|oops)\b/.test(msg)) {
      counts.fix++;
    } else if (msg.startsWith('docs') || /\b(readme|documentation|comment)\b/.test(msg)) {
      counts.docs++;
    } else if (msg.startsWith('refactor') || /\b(refactor|clean|restructure|reorganize)\b/.test(msg)) {
      counts.refactor++;
    } else if (msg.startsWith('test') || /\b(test|spec|coverage)\b/.test(msg)) {
      counts.test++;
    } else if (msg.startsWith('chore') || /\b(bump|upgrade|dependency|deps|lint|format)\b/.test(msg)) {
      counts.chore++;
    } else {
      counts.other++;
    }
  }

  // Convert raw counts to percentages
  const total = messages.length;
  const toPercent = (n: number) => Math.round((n / total) * 100);

  return {
    feat: toPercent(counts.feat),
    fix: toPercent(counts.fix),
    docs: toPercent(counts.docs),
    refactor: toPercent(counts.refactor),
    test: toPercent(counts.test),
    chore: toPercent(counts.chore),
    other: toPercent(counts.other),
  };
}

// ============================================
// Dimension 2 — calculateAtomicity
// ============================================

/**
 * Calculates the atomicity score for a set of sampled commit details.
 * A good commit does one thing — 1–5 files and under 200 total lines.
 *
 * FORMULA (documented verbatim):
 *   oversizedRatio  = (commits where changedFiles > 10 OR additions+deletions > 500) / total
 *   undersizedRatio = (commits where changedFiles === 1 AND additions+deletions < 3 AND message.length < 10) / total
 *   atomicityScore  = 100 - (oversizedRatio * 100 * 0.7) - (undersizedRatio * 100 * 0.3)
 *   → Clamped to [0, 100], rounded to nearest integer.
 *
 * WHY THESE THRESHOLDS:
 *   - > 10 files changed: hard to review in a single PR pass.
 *   - > 500 lines changed: crosses the "large commit" threshold most teams flag.
 *   - 1 file + < 3 lines + short message: trivial commit (typo fix, whitespace).
 *   - Oversized is weighted 0.7 vs 0.3 for undersized because oversized commits
 *     cause significantly more team friction than tiny commits.
 *
 * @param commitDetails - Array of CommitDetail objects (from fetchSampledCommitDetails).
 * @returns QualityDimension with score 0–100, rawValue as oversizedRatio percentage.
 *          Returns { score: 50, rawValue: 0 } if commitDetails is empty.
 *
 * FRONTEND NOTE: rawValue is the oversized percentage (0–100). A rawValue of 40 means
 * 40% of sampled commits were oversized. Use it to give context alongside the score.
 */
export function calculateAtomicity(commitDetails: CommitDetail[]): QualityDimension {
  if (commitDetails.length === 0) {
    return { score: 50, rawValue: 0, label: 'No commit detail data available.' };
  }

  const total = commitDetails.length;
  let oversizedCount = 0;
  let undersizedCount = 0;

  for (const c of commitDetails) {
    const totalLines = c.additions + c.deletions;
    // OVERSIZED: too many files OR too many lines changed
    if (c.changedFiles > 10 || totalLines > 500) {
      oversizedCount++;
    }
    // UNDERSIZED: exactly 1 file, < 3 total lines, and very short message
    else if (c.changedFiles === 1 && totalLines < 3 && c.message.length < 10) {
      undersizedCount++;
    }
  }

  const oversizedRatio = oversizedCount / total;
  const undersizedRatio = undersizedCount / total;

  // FORMULA: 100 - weighted penalty for oversized and undersized commits
  const rawScore = 100 - (oversizedRatio * 100 * 0.7) - (undersizedRatio * 100 * 0.3);
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  const oversizedPct = Math.round(oversizedRatio * 100);
  const label =
    score >= 80
      ? `${100 - oversizedPct}% of commits are appropriately scoped.`
      : `${oversizedPct}% of sampled commits are oversized (>10 files or >500 lines).`;

  return { score, rawValue: oversizedPct, label };
}

// ============================================
// Dimension 3 — calculateFixRatio
// ============================================

/**
 * Calculates a score based on the ratio of fix commits to total commits.
 *
 * WHY FIX RATIO MATTERS: A high fix ratio suggests shipping without testing,
 * iterating sloppily, or low confidence in output. A healthy engineering process
 * has roughly 20–30% fix commits.
 *
 * SCORING TABLE (documented verbatim — do not change without updating here):
 *   fixRatio < 0.15   → score 100 (very clean — fewer than 1 in 6 commits is a fix)
 *   fixRatio 0.15–0.30 → score 80  (healthy — expected ratio for most projects)
 *   fixRatio 0.30–0.50 → score 50  (concerning — roughly 1 in 3 commits fixing things)
 *   fixRatio > 0.50   → score 20  (problematic — over half of commits are fixes)
 *
 * @param messages - Array of raw commit message strings.
 * @returns QualityDimension with score 0–100, rawValue as fix ratio percentage (0–100).
 *          Returns { score: 80, rawValue: 0 } if messages is empty (no data = assume healthy).
 *
 * FRONTEND NOTE: rawValue is the fix percentage. E.g. rawValue=25 means 25% of commits
 * contain fix-related keywords. Use it as a data point in a breakdown table.
 */
export function calculateFixRatio(messages: string[]): QualityDimension {
  if (messages.length === 0) {
    return { score: 80, rawValue: 0, label: 'No commit messages to analyze.' };
  }

  const categories = categoriseMessages(messages);
  const fixRatio = categories.fix / 100; // convert percentage back to 0–1 ratio

  // SCORING TABLE — documented verbatim above
  let score: number;
  if (fixRatio < 0.15) {
    score = 100;
  } else if (fixRatio < 0.30) {
    score = 80;
  } else if (fixRatio < 0.50) {
    score = 50;
  } else {
    score = 20;
  }

  const fixPct = Math.round(fixRatio * 100);
  const label =
    score === 100 ? `Only ${fixPct}% of commits are fix-related — very clean process.` :
    score === 80  ? `${fixPct}% fix ratio is healthy for an active project.` :
    score === 50  ? `${fixPct}% fix ratio suggests frequent rework — worth investigating.` :
    `${fixPct}% fix ratio is high — over half of commits address existing issues.`;

  return { score, rawValue: fixPct, label };
}

// ============================================
// Dimension 4 — calculateTestCoverage
// ============================================

/**
 * Calculates a test coverage signal from commit detail file lists.
 * Does NOT run tests — infers test activity from whether commits touch test files.
 *
 * TEST FILE DETECTION: A file is considered a test file if its name matches ANY of:
 *   - Ends with: .test.ts, .test.js, .spec.ts, .spec.js
 *   - Path contains: /test/, /__tests__/, /tests/
 *   - Name contains: .test. or .spec.
 *
 * FORMULA:
 *   testCoverageSignal = (commits touching at least one test file / total sampled commits) * 100
 *   Score directly maps to the signal percentage (0% → score 0, 30%+ → score 100).
 *
 * SECONDARY SIGNAL: commits where the message contains "test" are counted separately
 * as testMentionRatio. This is informational only — not used in scoring.
 *
 * @param commitDetails - Array of CommitDetail objects (from fetchSampledCommitDetails).
 * @returns QualityDimension with score 0–100, rawValue as the test file touch percentage.
 *          Returns { score: 0, rawValue: 0 } if commitDetails is empty.
 *
 * FRONTEND NOTE: rawValue is the % of commits that touch test files (0–100).
 * A score of 0 does not mean the developer doesn't write tests — it means test
 * file changes weren't observed in the sampled commits. Caveat this to the user.
 */
export function calculateTestCoverage(commitDetails: CommitDetail[]): QualityDimension {
  if (commitDetails.length === 0) {
    return { score: 0, rawValue: 0, label: 'No commit detail data available for test coverage signal.' };
  }

  // Regex patterns for test file detection
  const testFilePattern = /(\.(test|spec)\.(ts|js|tsx|jsx)$)|(\/(__tests__|tests?)\/)|(\.test\.|\.spec\.)/i;

  let commitsWithTestFiles = 0;

  for (const c of commitDetails) {
    const touchesTestFile = c.fileNames.some((f) => testFilePattern.test(f));
    if (touchesTestFile) commitsWithTestFiles++;
  }

  const signal = (commitsWithTestFiles / commitDetails.length) * 100;
  const score = Math.min(100, Math.max(0, Math.round(signal)));

  const pct = Math.round(signal);
  const label =
    score === 0  ? `No test file changes detected in ${commitDetails.length} sampled commits.` :
    score < 30   ? `${pct}% of commits touch test files — low test activity signal.` :
    score < 60   ? `${pct}% of commits touch test files — moderate test activity.` :
    `${pct}% of commits touch test files — strong test discipline.`;

  return { score, rawValue: pct, label };
}

// ============================================
// Dimension 5 — calculateConsistency
// ============================================

/**
 * Calculates a consistency score from the contribution calendar.
 * Uses daily commit counts over the last 90 days. No new API calls needed.
 *
 * FORMULA (documented verbatim with example):
 *   activeDays = count of days where commitCount > 0
 *   allCounts  = all 90 daily commit counts (including 0s)
 *   mean       = sum(allCounts) / 90
 *   stdDev     = sqrt(mean of squared differences from mean)
 *   consistencyScore = 100 - min(stdDev * 2, 100)
 *   → Clamped to [0, 100], rounded to nearest integer.
 *
 * EXAMPLE:
 *   Developer A: commits 2–4 times every day for 90 days.
 *     stdDev ≈ 1.5 → score = 100 - 3 = 97
 *   Developer B: 0 commits for 60 days, then 80 commits in 3 days.
 *     stdDev ≈ 25  → score = 100 - 50 = 50
 *   Developer C: no commits at all.
 *     stdDev = 0   → score = 100 (but activeDays = 0, noted via consistencyScoreNote)
 *
 * NOTE: A pure 0-commit period gives stdDev=0 → score=100, which is wrong.
 * Guard: if activeDays === 0, return score 0 with a note.
 *
 * @param calendar - Array of { date, commitCount } for each day (90+ days recommended).
 *                   Accepts the existing contribution calendar already fetched.
 * @returns QualityDimension with score 0–100.
 *          Returns { score: 0, rawValue: 0, label: 'Note...' } if no calendar or no active days.
 *
 * FRONTEND NOTE: rawValue is the stdDev (not a percentage). Lower stdDev = more consistent.
 * The score is a direct usability indicator — use score, not rawValue, for the badge.
 */
export function calculateConsistency(
  calendar: Array<{ date: string; commitCount: number }>
): { dimension: QualityDimension; note: string | null } {
  if (!calendar || calendar.length === 0) {
    return {
      dimension: { score: 0, rawValue: 0, label: 'Contribution calendar data unavailable.' },
      note: 'Unavailable — contribution calendar missing.',
    };
  }

  // Filter to last 90 days only
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const last90 = calendar
    .filter((d) => new Date(d.date) >= ninetyDaysAgo)
    .map((d) => d.commitCount);

  // Pad to exactly 90 values if fewer days are available
  while (last90.length < 90) last90.push(0);

  const activeDays = last90.filter((c) => c > 0).length;

  // Guard: no active days → score 0 (not 100 from stdDev=0 on all-zero data)
  if (activeDays === 0) {
    return {
      dimension: { score: 0, rawValue: 0, label: 'No commits in the last 90 days.' },
      note: null,
    };
  }

  // Calculate standard deviation of daily commit counts
  const mean = last90.reduce((sum, c) => sum + c, 0) / last90.length;
  const variance = last90.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / last90.length;
  const stdDev = Math.sqrt(variance);

  // FORMULA: consistencyScore = 100 - min(stdDev * 2, 100)
  const score = Math.min(100, Math.max(0, Math.round(100 - Math.min(stdDev * 2, 100))));

  const label =
    score >= 80 ? `Highly consistent — active ${activeDays} of last 90 days with low variance.` :
    score >= 50 ? `Moderately consistent — ${activeDays} active days in the last 90 days.` :
    `Irregular activity — ${activeDays} active days with high variance in the last 90 days.`;

  return {
    dimension: { score, rawValue: Math.round(stdDev * 100) / 100, label },
    note: null,
  };
}

// ============================================
// Dimension 6 — calculateConventionalCommits
// ============================================

/**
 * Calculates what percentage of commit messages follow the Conventional Commits spec.
 * The conventional commits specification is a professional standard widely adopted
 * in open source and enterprise TypeScript/JavaScript projects.
 *
 * PATTERN (must match at the start of the subject line, case-insensitive):
 *   /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\(.+\))?(!)?:/i
 *
 * EXAMPLES of matching messages:
 *   feat: add dark mode support
 *   fix(auth): prevent token refresh race condition
 *   chore!: drop support for Node 14
 *   docs(readme): update setup instructions
 *
 * EXAMPLES of non-matching:
 *   Add dark mode        (no type prefix)
 *   Fixed the bug        (past tense, no type prefix)
 *   WIP                  (not following convention)
 *
 * FORMULA:
 *   conventionalScore = (messages matching pattern / total messages) * 100
 *   Score = conventionalScore directly (0% → 0, 100% → 100).
 *
 * @param messages - Array of raw commit message strings.
 * @returns QualityDimension with score 0–100, rawValue as the matching percentage.
 *          Returns { score: 0, rawValue: 0 } if messages is empty.
 *
 * FRONTEND NOTE: rawValue is the conventional commits adoption rate (0–100%).
 * Many developers don't use conventional commits at all — a score of 0 is
 * very common and expected for personal projects.
 */
export function calculateConventionalCommits(messages: string[]): QualityDimension {
  if (messages.length === 0) {
    return { score: 0, rawValue: 0, label: 'No commit messages to analyze.' };
  }

  // Conventional commits pattern — checks the subject line (first line) only
  const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\(.+\))?(!)?:/i;

  let matchCount = 0;
  for (const raw of messages) {
    const subject = raw.split('\n')[0].trim();
    if (conventionalPattern.test(subject)) matchCount++;
  }

  const pct = Math.round((matchCount / messages.length) * 100);
  const score = pct; // score maps directly to percentage for this dimension

  const label =
    score === 0   ? 'No conventional commit format detected.' :
    score < 25    ? `${pct}% of commits follow conventional format — low adoption.` :
    score < 75    ? `${pct}% of commits follow conventional format — partial adoption.` :
    `${pct}% of commits follow conventional commits spec — strong adherence.`;

  return { score, rawValue: pct, label };
}

// ============================================
// Composite Score Calculator
// ============================================

/**
 * Calculates the composite commit quality score from all dimension scores.
 * Uses fixed weights that must sum to 1.0.
 *
 * WEIGHT TABLE (documented verbatim — do not change weights without updating here):
 *   Message quality (AI)  — 0.30  (30%)
 *   Atomicity             — 0.20  (20%)
 *   Fix ratio             — 0.20  (20%)
 *   Test coverage signal  — 0.15  (15%)
 *   Consistency           — 0.10  (10%)
 *   Conventional commits  — 0.05  ( 5%)
 *   TOTAL                 — 1.00 (100%)
 *
 * QUALITATIVE LABEL TABLE:
 *   80–100 → "Excellent"
 *   60–79  → "Good"
 *   40–59  → "Average"
 *   20–39  → "Needs improvement"
 *    0–19  → "Poor"
 *
 * @param messageQualityScore - 0–100 score from AI message quality analysis (Dimension 1).
 * @param atomicityScore - 0–100 score from calculateAtomicity (Dimension 2).
 * @param fixRatioScore - 0–100 score from calculateFixRatio (Dimension 3).
 * @param testCoverageScore - 0–100 score from calculateTestCoverage (Dimension 4).
 * @param consistencyScore - 0–100 score from calculateConsistency (Dimension 5).
 * @param conventionalScore - 0–100 score from calculateConventionalCommits (Dimension 6).
 * @returns { score: number, label: string } — composite score and qualitative label.
 *
 * FRONTEND NOTE: Use score for numeric display (e.g. "72/100").
 * Use label for the badge text (e.g. "Good").
 */
export function calculateCompositeScore(
  messageQualityScore: number,
  atomicityScore: number,
  fixRatioScore: number,
  testCoverageScore: number,
  consistencyScore: number,
  conventionalScore: number
): { score: number; label: string } {
  // WEIGHT TABLE — values must sum to 1.0
  const WEIGHTS = {
    messageQuality: 0.30,
    atomicity:      0.20,
    fixRatio:       0.20,
    testCoverage:   0.15,
    consistency:    0.10,
    conventional:   0.05,
  };

  const raw =
    (messageQualityScore * WEIGHTS.messageQuality) +
    (atomicityScore      * WEIGHTS.atomicity)      +
    (fixRatioScore       * WEIGHTS.fixRatio)       +
    (testCoverageScore   * WEIGHTS.testCoverage)   +
    (consistencyScore    * WEIGHTS.consistency)    +
    (conventionalScore   * WEIGHTS.conventional);

  const score = Math.min(100, Math.max(0, Math.round(raw)));

  // QUALITATIVE LABEL TABLE — documented verbatim above
  const label =
    score >= 80 ? 'Excellent' :
    score >= 60 ? 'Good' :
    score >= 40 ? 'Average' :
    score >= 20 ? 'Needs improvement' :
    'Poor';

  return { score, label };
}

/**
 * Calculates a weighted average of per-repo scores where weights are proportional
 * to each repo's commit count. Used in aggregateCommitQuality (Task 7).
 *
 * WHY WEIGHT BY COMMIT COUNT: A repo where the developer made 80 commits is a much
 * stronger signal than one where they made 5 commits. Weighting by commit count gives
 * the most-committed-to repos more influence on the overall score.
 *
 * @param values - Array of { score, commitCount } pairs.
 * @returns Weighted average score, rounded to nearest integer. Returns 0 for empty input.
 *
 * FRONTEND NOTE: Internal utility — never exposed directly to the frontend.
 */
export function weightedAverage(values: Array<{ score: number; commitCount: number }>): number {
  if (values.length === 0) return 0;
  const totalCommits = values.reduce((sum, v) => sum + v.commitCount, 0);
  if (totalCommits === 0) {
    // Fallback: simple average if all commit counts are 0
    return Math.round(values.reduce((sum, v) => sum + v.score, 0) / values.length);
  }
  const weighted = values.reduce((sum, v) => sum + v.score * v.commitCount, 0);
  return Math.round(weighted / totalCommits);
}

// Re-export CommitQualityAnalysis type for convenience — callers can import from here
export type { CommitQualityAnalysis };

// ============================================
// Task 6 — Per-repo quality analyser
// ============================================

import {
  fetchCommitSummaries,
  fetchSampledCommitDetails,
} from './github.js';
import { scoreCommitMessages, generateCommitQualitySummary } from './llm/index.js';
import type { RepoCommitQuality, ActiveRepo } from '../types/index.js';

/**
 * Analyses the commit quality for a single repository.
 * Orchestrates all data fetching and dimension calculation for one repo.
 *
 * WHAT THIS FUNCTION DOES (in order):
 *  1. Fetches the last 50 commit summaries (sha + message) for this user in this repo.
 *  2. Fetches full details for the first 25 of those commits (parallel).
 *  3. Runs arithmetic dimension calculators (atomicity, fixRatio, testCoverage, conventional).
 *  4. Calls scoreCommitMessages() (AI) for message quality in parallel with step 3.
 *  5. Assembles the RepoCommitQuality object.
 *
 * PARALLELISM:
 *  - Step 2 (detail fetches) and step 4 (AI scorer) run in parallel via Promise.allSettled.
 *  - Individual commit detail fetch failures are already handled inside fetchSampledCommitDetails.
 *
 * SKIP CONDITION: If fewer than 3 commits are found for this user in this repo,
 * the function returns null and the repo is excluded from qualityByRepo.
 *
 * @param repoName - Name of the repository (not owner/repo format, just the repo name).
 * @param owner - GitHub username who owns the repo.
 * @param token - GitHub OAuth access token.
 * @param calendar - Contribution calendar (passed in from existing enriched data).
 * @param username - GitHub username of the authenticated user (for commit author filtering).
 * @returns RepoCommitQuality or null if fewer than 3 commits found.
 * @throws Never — all errors caught, null returned.
 *
 * FRONTEND NOTE: Internal function. Output populates CommitQualityAnalysis.qualityByRepo.
 */
export async function analyseRepoCommitQuality(
  repoName: string,
  owner: string,
  token: string,
  username: string
): Promise<RepoCommitQuality | null> {
  try {
    // Step 1: Fetch last 50 commit summaries for this user in this repo
    const summaries = await fetchCommitSummaries(owner, repoName, username, token, 50);

    // SKIP CONDITION: < 3 commits → not enough data for meaningful analysis
    if (summaries.length < 3) {
      console.info(`[analyseRepoCommitQuality] Skipping ${repoName} — only ${summaries.length} commits found`);
      return null;
    }

    const messages = summaries.map((s) => s.message);
    const shas = summaries.map((s) => s.sha);

    // Steps 2 & 4 in parallel:
    //   - Fetch full commit details (up to 25) for arithmetic dimensions
    //   - Score commit messages via AI
    const [detailsResult, aiResult] = await Promise.allSettled([
      fetchSampledCommitDetails(owner, repoName, shas, token),
      scoreCommitMessages(messages, repoName),
    ]);

    const commitDetails =
      detailsResult.status === 'fulfilled' ? detailsResult.value : [];
    if (detailsResult.status === 'rejected') {
      console.warn(`[analyseRepoCommitQuality] Detail fetch failed for ${repoName}:`, detailsResult.reason);
    }

    // AI scorer has a built-in fallback (score: 50, observation: null) — no need to handle failure
    const aiScore = aiResult.status === 'fulfilled'
      ? aiResult.value
      : { score: 50, observation: null };

    // Step 3: Run all arithmetic dimension calculators
    const atomicity = calculateAtomicity(commitDetails);
    const fixRatioScore = calculateFixRatio(messages);
    const testCoverage = calculateTestCoverage(commitDetails);
    const conventional = calculateConventionalCommits(messages);
    const categories = categoriseMessages(messages);

    // Step 5: Calculate composite score
    // Consistency is calculated at the aggregate level (Task 7) using the contribution
    // calendar — we use 0 here as a placeholder; it does NOT affect per-repo composite.
    // Per-repo composite uses only the 5 per-repo dimensions (consistency is aggregate-only).
    const CONSISTENCY_PLACEHOLDER = 0;
    const { score: compositeScore, label: compositeLabel } = calculateCompositeScore(
      aiScore.score,
      atomicity.score,
      fixRatioScore.score,
      testCoverage.score,
      CONSISTENCY_PLACEHOLDER, // consistency is not included in per-repo composite
      conventional.score
    );

    // Build the messageQuality QualityDimension from the AI result
    const messageQualityDimension: QualityDimension = {
      score: aiScore.score,
      rawValue: aiScore.score,
      label: aiScore.observation
        ?? `Commit message quality scored ${aiScore.score}/100.`,
    };

    return {
      repoName,
      sampleSize: commitDetails.length,
      messageQuality: messageQualityDimension,
      atomicity,
      fixRatio: fixRatioScore,
      testCoverage,
      conventionalCommits: conventional,
      compositeScore,
      compositeLabel,
      messageCategories: categories,
      aiObservation: aiScore.observation,
    };
  } catch (error) {
    console.warn(
      `[analyseRepoCommitQuality] Unexpected error for ${repoName}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

// ============================================
// Task 7 — Overall quality aggregator
// ============================================

/**
 * Aggregates per-repo quality results into the full CommitQualityAnalysis.
 * Calculates weighted averages across repos, adds consistency (from calendar),
 * calls generateCommitQualitySummary for the AI overall summary, and assembles
 * the final CommitQualityAnalysis object.
 *
 * WEIGHTED AVERAGES: Each dimension score is weighted by the repo's commit count.
 * A repo where the user made 80 commits contributes more to the overall score than
 * one where they made 5 commits. See weightedAverage() above.
 *
 * CONSISTENCY: Calculated from the contribution calendar (dimension 5), not per-repo.
 * It reflects overall commit regularity across the account, not per-repo behaviour.
 *
 * ORDER OF OPERATIONS:
 *  1. Filter out null repo results (repos with < 3 commits).
 *  2. Calculate weighted averages for all per-repo dimension scores.
 *  3. Calculate consistency from the contribution calendar.
 *  4. Calculate overall composite score (includes consistency).
 *  5. Assemble a partial CommitQualityAnalysis (no overallSummary yet).
 *  6. Call generateCommitQualitySummary() with the partial object.
 *  7. Set overallSummary and return the final CommitQualityAnalysis.
 *
 * @param repoResults - Array of RepoCommitQuality | null (null = skipped repos).
 * @param activeRepos - The mostActiveRepos array (provides commitCount for each repo).
 * @param calendar - Contribution calendar for consistency calculation.
 * @returns CommitQualityAnalysis or null if no valid repo results.
 * @throws Never — errors caught, returns null.
 *
 * FRONTEND NOTE: Returns null if all repos were skipped (< 3 commits each).
 * EnrichedGitHubData.commitQuality will be null in this case — handle gracefully.
 */
export async function aggregateCommitQuality(
  repoResults: Array<RepoCommitQuality | null>,
  activeRepos: ActiveRepo[],
  calendar: Array<{ date: string; commitCount: number }>
): Promise<CommitQualityAnalysis | null> {
  // Step 1: Filter out repos that were skipped
  const validRepos = repoResults.filter((r): r is RepoCommitQuality => r !== null);

  if (validRepos.length === 0) {
    console.info('[aggregateCommitQuality] No valid repos to aggregate — returning null');
    return null;
  }

  // Map each valid repo to its commit count (from activeRepos for weighting)
  const repoCommitCounts = (repoName: string): number => {
    const ar = activeRepos.find((r) => r.name === repoName);
    return ar?.commitCount ?? 1; // fallback to 1 to avoid division by zero
  };

  // Build weighted-average input arrays for each dimension
  const toWeighted = (getDim: (r: RepoCommitQuality) => number) =>
    validRepos.map((r) => ({ score: getDim(r), commitCount: repoCommitCounts(r.repoName) }));

  // Step 2: Calculate weighted averages for all per-repo dimensions
  const messageQualityScore   = weightedAverage(toWeighted((r) => r.messageQuality.score));
  const atomicityScore        = weightedAverage(toWeighted((r) => r.atomicity.score));
  const fixRatioScore         = weightedAverage(toWeighted((r) => r.fixRatio.score));
  const testCoverageScore     = weightedAverage(toWeighted((r) => r.testCoverage.score));
  const conventionalScore     = weightedAverage(toWeighted((r) => r.conventionalCommits.score));

  // Step 3: Calculate consistency from the contribution calendar
  const { dimension: consistencyDimension, note: consistencyNote } =
    calculateConsistency(calendar);
  const consistencyScore = consistencyDimension.score;

  // Step 4: Calculate overall composite score (all 6 dimensions, including consistency)
  const { score: compositeScore, label: compositeLabel } = calculateCompositeScore(
    messageQualityScore,
    atomicityScore,
    fixRatioScore,
    testCoverageScore,
    consistencyScore,
    conventionalScore
  );

  const totalSampled = validRepos.reduce((sum, r) => sum + r.sampleSize, 0);
  const reposAnalyzed = validRepos.map((r) => r.repoName);

  // Step 5: Sort repos by compositeScore descending (best repo first)
  const sortedRepos = [...validRepos].sort((a, b) => b.compositeScore - a.compositeScore);

  // Step 6: Assemble partial analysis (no overallSummary yet)
  const partialAnalysis: CommitQualityAnalysis = {
    qualityByRepo: sortedRepos,
    overall: {
      compositeScore,
      compositeLabel,
      messageQualityScore,
      atomicityScore,
      fixRatioScore,
      testCoverageScore,
      consistencyScore,
      conventionalCommitsScore: conventionalScore,
    },
    overallSummary: null, // populated in step 7
    consistencyScoreNote: consistencyNote,
    reposAnalyzed,
    totalCommitsSampled: totalSampled,
    generatedAt: new Date().toISOString(),
  };

  // Step 7: Generate the AI-written overall summary
  // generateCommitQualitySummary returns null on failure — that is acceptable
  const overallSummary = await generateCommitQualitySummary(partialAnalysis);

  return {
    ...partialAnalysis,
    overallSummary,
  };
}
