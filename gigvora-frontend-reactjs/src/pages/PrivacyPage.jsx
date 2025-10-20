import SiteDocumentLayout from '../components/site/SiteDocumentLayout.jsx';
import useSiteDocument from '../hooks/useSiteDocument.js';
import privacyContent from '../content/site/privacy.js';

export default function PrivacyPage() {
  const { page, sections, metadata, loading, error, refresh, usingFallback, hero } = useSiteDocument(
    privacyContent.slug,
    privacyContent,
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
