# Enriched Insights — Frontend Component Structure

> **Data source:** `GET /api/github/enriched/:username` → [EnrichedGitHubData](file:///Users/parthbansal/Projects/GitFolio/backend/src/types/index.ts#216-228)
> **Trigger:** `POST /api/github/fetch-enriched` (authenticated, slow — 5–11s)

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  InsightsPage                                                    │
│  ├── InsightsHeader          (title + refresh button + timestamp)│
│  ├── Section: Developer Profile                                  │
│  │   ├── LanguageBreakdownCard                                   │
│  │   ├── WorkingStyleCard                                        │
│  │   └── CommitPatternsCard                                      │
│  ├── Section: Activity + Contributions                           │
│  │   ├── MostActiveReposCard                                     │
│  │   └── ExternalContributionsCard                              │
│  ├── Section: Skills + Interests                                 │
│  │   ├── SkillClustersSection                                    │
│  │   └── ForkInterestsSection                                   │
│  └── Section: Commit Quality                                     │
│      ├── CommitQualityOverview         (headline score + label)  │
│      ├── DimensionRadarOrBars          (6 dimension scores)      │
│      ├── RepoQualityList               (1–3 repos, expandable)   │
│      └── CommitCategoryBreakdown       (feat/fix/etc %)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### `InsightsHeader`
| Element | Data | Notes |
|---|---|---|
| Page title | Static: "Developer Insights" | |
| "Refresh Insights" button | Triggers `POST /fetch-enriched` | Show spinner during 5–11s wait |
| Last updated text | `generatedAt` | Format: "Updated Mar 13, 2026" |
| Status badge | 200 = show data, 202 = "Pending" state | See 202 handling below |

**202 Pending state:** Show a full-page `InsightsPendingState` with a CTA to click "Generate Insights" (triggers the POST endpoint). Do not render any data sections.

---

### `LanguageBreakdownCard`
**Data:** `languageBreakdown: { [lang: string]: number }` — percentages summing to 100.

| Element | Data |
|---|---|
| Card title | "Languages Used" |
| Horizontal bar chart or pill list | Each entry: `lang → percentage%` |
| Sort order | Highest % first |
| Empty state | `{}` → "No language data available" |

**Implementation note:** Values are already percentages. Use bar widths directly (e.g. `width: ${pct}%`). Show max 8 languages.

---

### `WorkingStyleCard`
**Data:** `workingStyle: { explorationScore, breadthScore, summary }`

| Element | Data |
|---|---|
| Card title | "Working Style" |
| AI summary | `summary` (always present — has guaranteed fallback) |
| Exploration gauge | `explorationScore` 0–100. Label: "Execution ←→ Exploration" |
| Breadth gauge | `breadthScore` 0–100. Label: "Focused ←→ Broad" |

**Gauge rendering:** Simple horizontal slider / progress bar is fine. 0 = left label, 100 = right label.

---

### `CommitPatternsCard`
**Data:** `commitPatterns: { byDayOfWeek, byHourOfDay, peakDay, peakHour, summary }`

| Element | Data |
|---|---|
| Card title | "Commit Patterns" |
| Summary sentence | `summary` — render directly (e.g. "Primarily commits Wednesday afternoons (UTC)") |
| Day heatmap | `byDayOfWeek` — keys: Sun/Mon/Tue/Wed/Thu/Fri/Sat |
| Hour heatmap | `byHourOfDay` — keys "0"–"23" (UTC). Group into AM/PM buckets if needed |
| Peak day badge | `peakDay` |
| Peak hour badge | `${peakHour}:00 UTC` |

---

### `MostActiveReposCard`
**Data:** `mostActiveRepos: ActiveRepo[]` — pre-sorted by `commitCount` desc.

| Element | Data | Notes |
|---|---|---|
| Card title | "Most Active Repos" | |
| Repo row (×6 max) | `name`, `commitCount`, `url` | Link `name` → `url` |
| Quality badge | `qualityScore` + `qualityLabel` | Only on top 3 repos. Guard: `if (repo.qualityScore !== undefined)` |
| Quality badge color | Excellent=green, Good=teal, Average=yellow, Needs improvement=orange, Poor=red | |
| Empty state | `[]` → "No recent commit activity found" | |

---

### `ExternalContributionsCard`
**Data:** `externalPRsMerged: number`, `externalReposContributed: string[]`

| Element | Data |
|---|---|
| Card title | "Open Source Contributions" |
| Headline stat | `${externalPRsMerged} PRs merged in external repos` |
| Repo list | `externalReposContributed` — each is `"owner/repo"`. Link to `https://github.com/{owner/repo}` |
| Empty state | `externalPRsMerged === 0` → "No external contributions found" |

---

### `SkillClustersSection`
**Data:** `skillClusters: SkillCluster[]` — may be `[]`.

Each [SkillCluster](file:///Users/parthbansal/Projects/GitFolio/backend/src/types/index.ts#165-171): `{ skillName, technologies[], indicators[], evidenceRepos[] }`

| Element | Data |
|---|---|
| Section title | "Skill Clusters" |
| Cluster card (×4–6) | `skillName` as heading |
| Tech pills | `technologies[]` — render as tag pills |
| Indicators | `indicators[]` — 2–3 bullet points |
| Evidence | `evidenceRepos[]` — small chip links |
| Empty state | `[]` → "Skill analysis unavailable" (AI failed — do not show an error, just hide the section or show a subtle note) |

---

### `ForkInterestsSection`
**Data:** `forkInterests: ForkInterest[]` — may be `[]`.

Each: `{ category, repos[], description }`

| Element | Data |
|---|---|
| Section title | "Interests & Explorations" |
| Interest card (×2–4) | `category` as heading, `description` as subtitle |
| Repo list | `repos[]` — "owner/repo" format, link to GitHub |
| Empty state | `[]` → hide section entirely (no forks = nothing to show) |

---

### `CommitQualityOverview`
**Data:** `commitQuality.overall`, `commitQuality.overallSummary`

> **Null guard:** If `commitQuality === null`, render `CommitQualityUnavailable` instead of this section.

| Element | Data | Notes |
|---|---|---|
| Section title | "Commit Quality" | |
| Headline score | `overall.compositeScore` | Large number: "72" |
| Headline label | `overall.compositeLabel` | Badge: "Good" |
| AI summary | `overallSummary` | May be `null` — hide block if null, do not show placeholder |
| Repos analyzed | `reposAnalyzed[]` | Small footer: "Based on analysis of: repo-a, repo-b" |
| Commits sampled | `totalCommitsSampled` | Footer: "75 commits analyzed" |

**Label → Color mapping:**
- Excellent → `#22c55e` (green)
- Good → `#0ea5e9` (sky blue)
- Average → `#eab308` (yellow)
- Needs improvement → `#f97316` (orange)
- Poor → `#ef4444` (red)

---

### `DimensionRadarOrBars`
**Data:** `commitQuality.overall` dimension scores

| Dimension | Field | Weight shown to user |
|---|---|---|
| Message Quality | `messageQualityScore` | 30% |
| Atomicity | `atomicityScore` | 20% |
| Fix Ratio | `fixRatioScore` | 20% |
| Test Coverage | `testCoverageScore` | 15% |
| Consistency | `consistencyScore` | 10% |
| Conventional Commits | `conventionalCommitsScore` | 5% |

**Recommended rendering:** Horizontal bar per dimension, with the score (e.g. `72/100`) on the right. Weight shown as a small label.

**Consistency note:** If `consistencyScoreNote` is non-null, render a tooltip or footnote on the consistency bar explaining why it may show `0` (e.g. "Calendar data unavailable").

---

### `RepoQualityList`
**Data:** `commitQuality.qualityByRepo[]` — max 3, sorted by `compositeScore` desc.

Each [RepoCommitQuality](file:///Users/parthbansal/Projects/GitFolio/backend/src/types/index.ts#264-306): `repoName, sampleSize, compositeScore, compositeLabel, aiObservation, messageCategories, messageQuality, atomicity, fixRatio, testCoverage, conventionalCommits`

| Element | Data | Notes |
|---|---|---|
| List title | "Per-Repo Breakdown" | |
| Repo row header | `repoName` + `compositeScore` + `compositeLabel` badge | |
| Expand/collapse | Click row → reveals dimension detail | Use accordion |
| Sample size | `sampleSize` commits analyzed | Small label: "Based on 25 commits" |
| AI observation | `aiObservation` | May be `null` — hide if null |
| Dimension detail row | `messageQuality.label`, `atomicity.label`, etc. | Each `QualityDimension.label` is a human-readable string |

---

### `CommitCategoryBreakdown`
**Data:** `commitQuality.qualityByRepo[0].messageCategories` (use the best-scoring repo, or aggregate)

| Category | Color |
|---|---|
| feat | blue |
| fix | red |
| docs | purple |
| refactor | cyan |
| test | green |
| chore | gray |
| other | slate |

**Recommended rendering:** Donut chart or horizontal stacked bar. Values are percentages summing to 100.

---

## State Handling Cheat Sheet

| State | Trigger | What to render |
|---|---|---|
| Loading | POST in flight | Full-section skeleton loaders |
| 202 Pending | GET returns 202 | `InsightsPendingState` with "Generate Insights" CTA |
| 404 | No portfolio | Redirect or empty page message |
| `commitQuality === null` | Quality analysis failed | Hide Section 4 entirely or show "Commit quality unavailable" |
| `skillClusters === []` | AI failed | Hide `SkillClustersSection` subtly |
| `forkInterests === []` | No forks | Hide `ForkInterestsSection` entirely |
| `aiObservation === null` | AI scorer failed | Hide observation row, show dimension scores only |
| `overallSummary === null` | AI summarizer failed | Hide summary block, show scores only |
| `consistencyScoreNote !== null` | No calendar data | Tooltip/footnote on consistency bar |
