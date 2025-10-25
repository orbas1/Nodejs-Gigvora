export function formatTagLabelFromSlug(slug) {
  if (!slug) {
    return '';
  }

  return `${slug}`
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function ensureDirectory() {
  return new Map();
}

export function buildTaxonomyDirectory(items) {
  if (!Array.isArray(items) || !items.length) {
    return ensureDirectory();
  }

  const directory = ensureDirectory();
  items.forEach((item) => {
    if (Array.isArray(item?.taxonomies)) {
      item.taxonomies.forEach((taxonomy) => {
        if (!taxonomy?.slug) {
          return;
        }
        const key = `${taxonomy.slug}`.toLowerCase();
        if (!directory.has(key) || !directory.get(key)) {
          const label = typeof taxonomy.label === 'string' && taxonomy.label.trim().length
            ? taxonomy.label
            : formatTagLabelFromSlug(taxonomy.slug);
          directory.set(key, label);
        }
      });
    }

    if (Array.isArray(item?.taxonomySlugs)) {
      item.taxonomySlugs.forEach((slug, index) => {
        if (!slug) {
          return;
        }
        const key = `${slug}`.toLowerCase();
        if (!directory.has(key) || !directory.get(key)) {
          const labelCandidate = Array.isArray(item?.taxonomyLabels) ? item.taxonomyLabels[index] : null;
          const label = typeof labelCandidate === 'string' && labelCandidate.trim().length
            ? labelCandidate
            : formatTagLabelFromSlug(slug);
          directory.set(key, label);
        }
      });
    }
  });

  return directory;
}

export function aggregateFacetTags({ items = [], facets = null, directory = ensureDirectory() }) {
  const tagMap = new Map();

  const registerTag = (slug, label, increment = 1) => {
    if (!slug) {
      return;
    }
    const key = `${slug}`.toLowerCase();
    const current = tagMap.get(key);
    const resolvedLabel =
      (label && label.trim().length ? label : null) || current?.label || directory.get(key) || formatTagLabelFromSlug(slug);
    const currentCount = current?.count ?? 0;
    tagMap.set(key, {
      slug,
      label: resolvedLabel,
      count: currentCount + increment,
    });
  };

  if (facets && typeof facets === 'object') {
    const taxonomyFacet = facets.taxonomySlugs;
    if (taxonomyFacet && typeof taxonomyFacet === 'object') {
      Object.entries(taxonomyFacet).forEach(([slug, rawCount]) => {
        const count = Number(rawCount);
        if (!slug || Number.isNaN(count)) {
          return;
        }
        registerTag(slug, directory.get(`${slug}`.toLowerCase()) ?? null, Math.max(count, 1));
      });
    }
  }

  if (Array.isArray(items) && items.length) {
    items.forEach((item) => {
      if (Array.isArray(item?.taxonomies) && item.taxonomies.length) {
        item.taxonomies.forEach((taxonomy) => {
          if (!taxonomy?.slug) {
            return;
          }
          registerTag(taxonomy.slug, taxonomy.label ?? null, 1);
        });
      } else if (Array.isArray(item?.taxonomySlugs)) {
        item.taxonomySlugs.forEach((slug, index) => {
          if (!slug) {
            return;
          }
          const labelCandidate = Array.isArray(item?.taxonomyLabels) ? item.taxonomyLabels[index] : null;
          registerTag(slug, labelCandidate ?? null, 1);
        });
      }
    });
  }

  return Array.from(tagMap.values())
    .filter((entry) => entry.label && entry.label.trim().length)
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.label.localeCompare(b.label);
    });
}

export default {
  formatTagLabelFromSlug,
  buildTaxonomyDirectory,
  aggregateFacetTags,
};
