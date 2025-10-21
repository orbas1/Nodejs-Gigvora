import SiteDocumentLayout from '../components/site/SiteDocumentLayout.jsx';
import useSiteDocument from '../hooks/useSiteDocument.js';
import communityGuidelinesContent from '../content/site/communityGuidelines.js';

export const COMMUNITY_GUIDELINES_SLUG = communityGuidelinesContent.slug;

export default function CommunityGuidelinesPage() {
  const { page, sections, metadata, loading, error, refresh, usingFallback, hero } = useSiteDocument(
    communityGuidelinesContent.slug,
    communityGuidelinesContent,
  );

  return (
    <SiteDocumentLayout
      hero={hero}
      sections={sections}
      metadata={metadata}
      loading={loading}
      error={error}
      onRetry={refresh}
      refresh={refresh}
      usingFallback={usingFallback}
    />
  );
}
