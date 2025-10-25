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

export function buildTaxonomyDirectoryFromItems(items = []) {
  const directory = new Map();

  if (!Array.isArray(items) || !items.length) {
    return directory;
  }

  items.forEach((item) => {
    if (Array.isArray(item?.taxonomies)) {
      item.taxonomies.forEach((taxonomy) => {
        if (!taxonomy?.slug) {
          return;
        }
        const key = `${taxonomy.slug}`.toLowerCase();
        if (!directory.has(key) || !directory.get(key)) {
          const label =
            typeof taxonomy.label === 'string' && taxonomy.label.trim().length
              ? taxonomy.label
              : formatTaxonomyLabelFromSlug(taxonomy.slug);
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
        if (directory.has(key) && directory.get(key)) {
          return;
        }
        const labelCandidate = Array.isArray(item?.taxonomyLabels) ? item.taxonomyLabels[index] : null;
        const label =
          typeof labelCandidate === 'string' && labelCandidate.trim().length
            ? labelCandidate
            : formatTaxonomyLabelFromSlug(slug);
        directory.set(key, label);
      });
    }
  });

  return directory;
}

export default { formatTaxonomyLabelFromSlug, buildTaxonomyDirectoryFromItems };
