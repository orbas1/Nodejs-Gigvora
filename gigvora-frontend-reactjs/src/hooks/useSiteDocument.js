import { useMemo } from 'react';
import useSitePage from './useSitePage.js';
import {
  normaliseDocumentMetadata,
  parseDocumentSections,
  buildHeroConfig,
} from '../utils/siteDocuments.js';

export default function useSiteDocument(slug, fallback) {
  const { page, loading, error, refresh, usingFallback, lastFetchedAt, lastErrorAt } = useSitePage(slug, {
    fallback,
  });

  const sections = useMemo(() => {
    const sourceBody = page?.body ?? fallback?.body ?? '';
    return parseDocumentSections(sourceBody, fallback?.sections ?? []);
  }, [fallback?.sections, page?.body, fallback?.body]);

  const metadata = useMemo(() => normaliseDocumentMetadata(page, fallback), [fallback, page]);
  const hero = useMemo(() => buildHeroConfig(page, fallback), [fallback, page]);

  return {
    page,
    sections,
    metadata,
    hero,
    loading,
    error,
    refresh,
    usingFallback,
    lastFetchedAt,
    lastErrorAt,
  };
}
