import SiteDocumentLayout from '../components/site/SiteDocumentLayout.jsx';
import useSiteDocument from '../hooks/useSiteDocument.js';
import refundContent from '../content/site/refund.js';

export default function RefundPolicyPage() {
  const { page, sections, metadata, loading, error, refresh, usingFallback } = useSiteDocument(
    refundContent.slug,
    refundContent,
  );

  const hero = page?.hero ?? refundContent.hero;

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
