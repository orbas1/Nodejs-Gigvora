export function formatTaxonomyLabelFromSlug(slug) {
  if (!slug) {
    return '';
  }

  return `${slug}`
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normaliseEntrySlug(slug) {
  if (!slug) {
    return null;
  }
  return `${slug}`.trim().toLowerCase();
}

export function extractTaxonomyEntries(item) {
  if (!item) {
    return [];
  }

  const entries = [];

  if (Array.isArray(item.taxonomies)) {
    item.taxonomies.forEach((taxonomy) => {
      if (!taxonomy) {
        return;
      }
      const slug = normaliseEntrySlug(taxonomy.slug);
      if (!slug) {
        return;
      }
      const label = typeof taxonomy.label === 'string' && taxonomy.label.trim().length
        ? taxonomy.label.trim()
        : null;
      entries.push({ slug, label });
    });
  }

  if (Array.isArray(item.taxonomySlugs)) {
    item.taxonomySlugs.forEach((slugValue, index) => {
      const slug = normaliseEntrySlug(slugValue);
      if (!slug) {
        return;
      }
      const labelsArray = Array.isArray(item.taxonomyLabels) ? item.taxonomyLabels : [];
      const labelCandidate = labelsArray[index];
      const label = typeof labelCandidate === 'string' && labelCandidate.trim().length
        ? labelCandidate.trim()
        : null;
      entries.push({ slug, label });
    });
  }

  return entries;
}

export function buildTaxonomyDirectory(items = []) {
  const directory = new Map();
  items.forEach((item) => {
    extractTaxonomyEntries(item).forEach(({ slug, label }) => {
      const current = directory.get(slug);
      if (!current || !current.trim().length) {
        directory.set(slug, label?.trim().length ? label.trim() : formatTaxonomyLabelFromSlug(slug));
      }
    });
  });
  return directory;
}

export function resolveTaxonomyLabel(slug, directory, fallbackLabel = null) {
  const normalised = normaliseEntrySlug(slug);
  if (!normalised) {
    return '';
  }

  if (fallbackLabel && fallbackLabel.trim().length) {
    return fallbackLabel.trim();
  }

  const fromDirectory = directory?.get(normalised);
  if (fromDirectory && fromDirectory.trim().length) {
    return fromDirectory.trim();
  }

  return formatTaxonomyLabelFromSlug(normalised);
}

export function resolveTaxonomyLabels(item, directory = null) {
  const seen = new Set();
  return extractTaxonomyEntries(item)
    .map(({ slug, label }) => resolveTaxonomyLabel(slug, directory, label))
    .filter((label) => {
      if (!label || !label.trim().length) {
        return false;
      }
      const key = label.trim().toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

export function aggregateTaxonomyCounts(items = [], facets = null, directory = null) {
  const counts = new Map();

  const register = (slugValue, labelValue, increment = 1) => {
    const slug = normaliseEntrySlug(slugValue);
    if (!slug) {
      return;
    }
    const existing = counts.get(slug);
    const label = resolveTaxonomyLabel(slug, directory, labelValue);
    const nextCount = (existing?.count ?? 0) + (Number.isFinite(increment) ? increment : 0);
    counts.set(slug, {
      slug,
      label,
      count: nextCount > 0 ? nextCount : existing?.count ?? 0,
    });
  };

  if (facets && typeof facets === 'object') {
    const taxonomyFacet = facets.taxonomySlugs;
    if (taxonomyFacet && typeof taxonomyFacet === 'object') {
      Object.entries(taxonomyFacet).forEach(([slug, rawCount]) => {
        const count = Number(rawCount);
        register(slug, directory?.get(normaliseEntrySlug(slug)) ?? null, Number.isNaN(count) ? 0 : Math.max(1, count));
      });
    }
  }

  items.forEach((item) => {
    extractTaxonomyEntries(item).forEach(({ slug, label }) => register(slug, label, 1));
  });

  return Array.from(counts.values())
    .filter((entry) => entry.label && entry.label.trim().length)
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.label.localeCompare(b.label);
    });
}

export default {
  formatTaxonomyLabelFromSlug,
  extractTaxonomyEntries,
  buildTaxonomyDirectory,
  resolveTaxonomyLabel,
  resolveTaxonomyLabels,
  aggregateTaxonomyCounts,
};
