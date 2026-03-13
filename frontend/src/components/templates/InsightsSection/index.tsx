'use client';

import React from 'react';
import type { EnrichedGitHubData } from '@/types';
import type { InsightTheme } from './theme';
import LanguageBreakdownCard from './LanguageBreakdownCard';
import WorkingStyleCard from './WorkingStyleCard';
import CommitPatternsCard from './CommitPatternsCard';
import MostActiveReposCard from './MostActiveReposCard';
import ExternalContributionsCard from './ExternalContributionsCard';
import SkillClustersSection from './SkillClustersSection';
import ForkInterestsSection from './ForkInterestsSection';
import CommitQualityOverview from './CommitQualityOverview';
import DimensionRadarOrBars from './DimensionRadarOrBars';
import RepoQualityList from './RepoQualityList';
import CommitCategoryBreakdown from './CommitCategoryBreakdown';

interface Props {
    data: EnrichedGitHubData | null | undefined;
    theme: InsightTheme;
    sectionTitle?: string;
}

export default function InsightsSection({ data, theme, sectionTitle = 'Developer Insights' }: Props) {
    if (!data) return null;

    return (
        <section>
            <h3 style={{
                fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em',
                fontWeight: 600, color: theme.secondaryTextColor, marginBottom: '24px',
                fontFamily: theme.fontFamily,
            }}>
                {sectionTitle}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Section: Developer Profile */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    {data.languageBreakdown && <LanguageBreakdownCard data={data.languageBreakdown} theme={theme} />}
                    {data.workingStyle && <WorkingStyleCard data={data.workingStyle} theme={theme} />}
                    {data.commitPatterns && <CommitPatternsCard data={data.commitPatterns} theme={theme} />}
                </div>

                {/* Section: Activity + Contributions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    <MostActiveReposCard data={data.mostActiveRepos} theme={theme} />
                    <ExternalContributionsCard
                        prsMerged={data.externalPRsMerged}
                        reposContributed={data.externalReposContributed}
                        theme={theme}
                    />
                </div>

                {/* Section: Skills + Interests */}
                <SkillClustersSection data={data.skillClusters} theme={theme} />
                <ForkInterestsSection data={data.forkInterests} theme={theme} />

                {/* Section: Commit Quality */}
                {data.commitQuality && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <CommitQualityOverview data={data.commitQuality} theme={theme} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                            <DimensionRadarOrBars data={data.commitQuality} theme={theme} />
                            <CommitCategoryBreakdown data={data.commitQuality.qualityByRepo} theme={theme} />
                        </div>
                        <RepoQualityList data={data.commitQuality.qualityByRepo} theme={theme} />
                    </div>
                )}
            </div>
        </section>
    );
}
