import SiteDocumentLayout from '../components/site/SiteDocumentLayout.jsx';
import useSiteDocument from '../hooks/useSiteDocument.js';
import termsContent from '../content/site/terms.js';

export default function TermsPage() {
  const { page, sections, metadata, loading, error, refresh, usingFallback } = useSiteDocument(
    termsContent.slug,
    termsContent,
  );

  const hero = page?.hero ?? termsContent.hero;

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
