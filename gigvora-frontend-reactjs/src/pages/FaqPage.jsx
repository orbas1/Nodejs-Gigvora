import SiteDocumentLayout from '../components/site/SiteDocumentLayout.jsx';
import useSiteDocument from '../hooks/useSiteDocument.js';
import faqContent from '../content/site/faq.js';

export default function FaqPage() {
  const { page, sections, metadata, loading, error, refresh, usingFallback } = useSiteDocument(
    faqContent.slug,
    faqContent,
  );

  const hero = page?.hero ?? faqContent.hero;

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
