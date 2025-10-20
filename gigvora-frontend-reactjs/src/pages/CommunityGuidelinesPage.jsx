import SiteDocumentLayout from '../components/site/SiteDocumentLayout.jsx';
import useSiteDocument from '../hooks/useSiteDocument.js';
import communityGuidelinesContent from '../content/site/communityGuidelines.js';

export default function CommunityGuidelinesPage() {
  const { page, sections, metadata, loading, error, refresh, usingFallback } = useSiteDocument(
    communityGuidelinesContent.slug,
    communityGuidelinesContent,
  );

  const hero = page?.hero ?? communityGuidelinesContent.hero;

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
