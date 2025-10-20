function slugify(value, index = 0) {
  if (!value) {
    return `section-${index}`;
  }
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function coerceDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function parseBlocksFromLines(lines = []) {
  const blocks = [];
  let paragraph = '';
  let list = null;

  const flushParagraph = () => {
    if (paragraph.trim().length) {
      blocks.push({ type: 'paragraph', text: paragraph.trim() });
      paragraph = '';
    }
  };

  const flushList = () => {
    if (list && list.items.length) {
      blocks.push(list);
    }
    list = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (paragraph) {
        flushParagraph();
      }
      if (!list) {
        list = { type: 'list', items: [] };
      }
      list.items.push(trimmed.replace(/^[-*]\s+/, '').trim());
      return;
    }

    if (list) {
      flushList();
    }
    paragraph = paragraph ? `${paragraph} ${trimmed}` : trimmed;
  });

  flushParagraph();
  flushList();
  return blocks;
}

export function parseDocumentSections(raw = '', fallbackSections = []) {
  const source = typeof raw === 'string' ? raw : '';
  const normalised = source.replace(/\r\n/g, '\n').trim();

  if (!normalised) {
    return fallbackSections.map((section, index) => ({
      id: section.id ?? slugify(section.title, index),
      title: section.title ?? `Section ${index + 1}`,
      blocks: Array.isArray(section.blocks)
        ? section.blocks
        : parseBlocksFromLines((section.content || []).join('\n').split('\n')),
    }));
  }

  const segments = normalised.split(/\n(?=##\s+)/g).filter(Boolean);
  if (!segments.length) {
    return [
      {
        id: 'overview',
        title: 'Overview',
        blocks: parseBlocksFromLines(normalised.split('\n')),
      },
    ];
  }

  return segments.map((segment, index) => {
    const lines = segment.split('\n');
    const heading = lines.shift() ?? '';
    const title = heading.replace(/^##\s+/, '').trim() || `Section ${index + 1}`;
    const blocks = parseBlocksFromLines(lines);
    return {
      id: slugify(title, index) || `section-${index + 1}`,
      title,
      blocks,
    };
  });
}

export function normaliseDocumentMetadata(page = {}, fallback = {}) {
  const publishedAt = coerceDate(page.publishedAt || page.updatedAt || fallback.lastUpdated);
  const updatedAt = coerceDate(page.updatedAt || fallback.lastUpdated);
  const lastReviewed = coerceDate(page.lastReviewedAt || fallback.lastReviewedAt);

  return {
    lastUpdated: updatedAt || publishedAt || new Date(),
    publishedAt: publishedAt || null,
    lastReviewed: lastReviewed || null,
    version: page.version || fallback.version || '1.0.0',
    documentCode: page.slug || fallback.slug || 'document',
    contactEmail: page.contactEmail || fallback.contactEmail || 'support@gigvora.com',
    contactPhone: page.contactPhone || fallback.contactPhone || null,
    jurisdiction: page.jurisdiction || fallback.jurisdiction || 'United Kingdom',
    summary: page.summary || fallback.summary || '',
    heroTitle: page.heroTitle || fallback.hero?.title || '',
    heroSubtitle: page.heroSubtitle || fallback.hero?.subtitle || '',
  };
}

export default {
  parseDocumentSections,
  normaliseDocumentMetadata,
};
