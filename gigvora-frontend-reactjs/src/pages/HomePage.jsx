import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useSession from '../hooks/useSession.js';
import useHomeExperience from '../hooks/useHomeExperience.js';
import {
  HomeHeroSection,
  CommunityPulseSection,
  PersonaJourneysSection,
  CommunitySpotlightsSection,
  ExplorerShowcaseSection,
  TestimonialsSection,
  MarketplaceLaunchesSection,
  CreationStudioSection,
  FeesShowcaseSection,
  JoinCommunitySection,
  CollaborationToolkitSection,
} from './home/index.js';

export default function HomePage() {
  const { isAuthenticated } = useSession();
  const navigate = useNavigate();
  const { data: homeData, loading: homeLoading, error: homeError, refresh, fromCache, lastUpdated } =
    useHomeExperience({ enabled: !isAuthenticated });

  const heroHeadline = homeData?.settings?.heroHeadline?.trim() ? homeData.settings.heroHeadline : undefined;
  const heroSubheading = homeData?.settings?.heroSubheading?.trim()
    ? homeData.settings.heroSubheading
    : undefined;

  const heroKeywords = useMemo(() => {
    if (!Array.isArray(homeData?.settings?.heroKeywords)) {
      return undefined;
    }

    const items = homeData.settings.heroKeywords
      .map((keyword) => {
        if (!keyword) return null;
        if (typeof keyword === 'string') return keyword;
        if (typeof keyword === 'object') {
          return keyword.label ?? keyword.title ?? keyword.keyword ?? keyword.name ?? null;
        }
        return null;
      })
      .filter(Boolean);

    return items.length ? items : undefined;
  }, [homeData?.settings?.heroKeywords]);

  const communityStats = useMemo(() => {
    if (!Array.isArray(homeData?.settings?.communityStats) || !homeData.settings.communityStats.length) {
      return [
        { label: 'Global specialists', value: '12,400+' },
        { label: 'Average NPS', value: '68' },
        { label: 'Completion rate', value: '97%' },
      ];
    }
    return homeData.settings.communityStats.map((stat) => ({
      label: stat.label ?? stat.name ?? 'Community stat',
      value: stat.value ?? stat.metric ?? '—',
    }));
  }, [homeData?.settings?.communityStats]);

  const trendingCreations = useMemo(
    () =>
      (Array.isArray(homeData?.creations) ? homeData.creations : [])
        .filter((item) => item?.title && item?.type)
        .slice(0, 6),
    [homeData?.creations],
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="bg-white">
      <HomeHeroSection
        headline={heroHeadline}
        subheading={heroSubheading}
        keywords={heroKeywords}
        loading={homeLoading}
        error={homeError}
        onClaimWorkspace={() => navigate('/register')}
        onBrowseOpportunities={() => navigate('/gigs')}
      />
      <CommunityPulseSection
        loading={homeLoading}
        error={homeError}
        fromCache={fromCache}
        lastUpdated={lastUpdated}
        onRefresh={() => refresh().catch(() => {})}
        statusLabel={isAuthenticated ? 'Redirecting to live experience' : 'Live community snapshot'}
        homeData={homeData}
      />
      <PersonaJourneysSection loading={homeLoading} error={homeError} />
      <CommunitySpotlightsSection loading={homeLoading} error={homeError} />
      <ExplorerShowcaseSection loading={homeLoading} error={homeError} creations={homeData?.creations} />
      <TestimonialsSection loading={homeLoading} error={homeError} />
      <MarketplaceLaunchesSection
        loading={homeLoading}
        error={homeError}
        communityStats={communityStats}
        trendingCreations={trendingCreations}
      />
      <CollaborationToolkitSection />
      <CreationStudioSection loading={homeLoading} error={homeError} />
      <FeesShowcaseSection />
      <JoinCommunitySection />
    </div>
  );
}
