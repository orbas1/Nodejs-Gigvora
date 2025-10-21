import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useSession from '../hooks/useSession.js';
import useHomeExperience from '../hooks/useHomeExperience.js';
import {
  HomeHeroSection,
  CommunityPulseSection,
  PersonaJourneysSection,
  CommunitySpotlightsSection,
  TestimonialsSection,
  MarketplaceLaunchesSection,
  CreationStudioSection,
  JoinCommunitySection,
} from './home/index.js';

export default function HomePage() {
  const { isAuthenticated } = useSession();
  const navigate = useNavigate();
  const { data: homeData, loading: homeLoading, error: homeError, refresh, fromCache, lastUpdated } =
    useHomeExperience({ enabled: !isAuthenticated });

  const heroHeadline = homeData?.settings?.heroHeadline ?? 'Build momentum with people who deliver.';
  const heroSubheading =
    homeData?.settings?.heroSubheading ??
    'Gigvora unites clients, teams, and independent talent inside one calm workspace so every initiative moves forward with confidence.';

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
      <HomeHeroSection headline={heroHeadline} subheading={heroSubheading} loading={homeLoading} error={homeError} />
      <CommunityPulseSection
        loading={homeLoading}
        error={homeError}
        fromCache={fromCache}
        lastUpdated={lastUpdated}
        onRefresh={() => refresh().catch(() => {})}
        statusLabel={isAuthenticated ? 'Redirecting to live experience' : 'Live community snapshot'}
      />
      <PersonaJourneysSection loading={homeLoading} error={homeError} />
      <CommunitySpotlightsSection loading={homeLoading} error={homeError} />
      <TestimonialsSection loading={homeLoading} error={homeError} />
      <MarketplaceLaunchesSection
        loading={homeLoading}
        error={homeError}
        communityStats={communityStats}
        trendingCreations={trendingCreations}
      />
      <CreationStudioSection loading={homeLoading} error={homeError} />
      <JoinCommunitySection />
    </div>
  );
}
