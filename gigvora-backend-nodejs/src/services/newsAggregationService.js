const GUARDIAN_ENDPOINT = 'https://content.guardianapis.com/search';
const DEFAULT_QUERY = 'gig economy OR freelance OR marketplace OR future of work';
const DEFAULT_SECTIONS = ['business', 'technology', 'world'];
const DEFAULT_FIELDS = ['thumbnail', 'trailText', 'shortUrl'];
const DEFAULT_PAGE_SIZE = 10;
const FETCH_INTERVAL_MS = 1000 * 60 * 5; // five minutes
const MAX_LOOKBACK_HOURS = 36;

let workerHandle = null;
let isRunning = false;
let latestPublishedAt = null;
let workerLogger = console;
let lastRunAt = null;
let lastSuccessfulRunAt = null;
let lastError = null;
let FeedPostModel = null;

async function loadFeedPostModel() {
  if (FeedPostModel) {
    return FeedPostModel;
  }
  const module = await import('../models/index.js');
  FeedPostModel = module.FeedPost;
  return FeedPostModel;
}

function decodeHtmlEntities(text = '') {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"')
    .replace(/&hellip;/gi, '…')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–');
}

function stripHtml(html = '') {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function normaliseGuardianArticle(article) {
  if (!article) return null;
  const fields = article.fields || {};
  const publishedAt = article.webPublicationDate ? new Date(article.webPublicationDate) : null;
  return {
    externalId: article.id,
    title: article.webTitle,
    url: fields.shortUrl || article.webUrl,
    summary: stripHtml(fields.trailText || ''),
    imageUrl: fields.thumbnail || null,
    source: 'The Guardian',
    publishedAt,
  };
}

async function fetchGuardianArticles() {
  const apiKey = process.env.GUARDIAN_API_KEY || 'test';
  const params = new URLSearchParams({
    'api-key': apiKey,
    q: DEFAULT_QUERY,
    pageSize: String(DEFAULT_PAGE_SIZE),
    'order-by': 'newest',
    section: DEFAULT_SECTIONS.join('|'),
    'show-fields': DEFAULT_FIELDS.join(','),
  });
  const response = await fetch(`${GUARDIAN_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Guardian API responded with ${response.status}`);
  }
  const payload = await response.json();
  const results = payload?.response?.results;
  if (!Array.isArray(results)) {
    return [];
  }
  return results
    .map((item) => normaliseGuardianArticle(item))
    .filter((item) => item && item.title && item.summary && item.url);
}

async function ensureLatestPublishedAt() {
  if (latestPublishedAt) {
    return;
  }
  const model = await loadFeedPostModel();
  const mostRecent = await model.findOne({
    where: { type: 'news' },
    order: [
      ['publishedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
  if (mostRecent?.publishedAt) {
    latestPublishedAt = new Date(mostRecent.publishedAt);
  }
}

async function publishArticle(article) {
  if (!article?.externalId) {
    return null;
  }

  const model = await loadFeedPostModel();
  const existing = await model.findOne({ where: { externalId: article.externalId } });
  const summary = article.summary?.slice(0, 800) || '';
  const content = summary || article.title;
  const publishedAt = article.publishedAt ?? new Date();

  if (existing) {
    const updates = {};
    if (!existing.title && article.title) updates.title = article.title;
    if (summary && existing.summary !== summary) updates.summary = summary;
    if (content && existing.content !== content) updates.content = content;
    if (article.url && existing.link !== article.url) updates.link = article.url;
    if (article.imageUrl && existing.imageUrl !== article.imageUrl) updates.imageUrl = article.imageUrl;
    if (article.source && existing.source !== article.source) updates.source = article.source;
    if (publishedAt && existing.publishedAt?.getTime?.() !== publishedAt.getTime()) {
      updates.publishedAt = publishedAt;
    }
    if (Object.keys(updates).length) {
      await existing.update(updates);
    }
    return existing;
  }

  return model.create({
    userId: null,
    content,
    summary,
    title: article.title,
    link: article.url,
    imageUrl: article.imageUrl,
    source: article.source,
    type: 'news',
    visibility: 'public',
    externalId: article.externalId,
    publishedAt,
    authorName: 'Gigvora Newsroom',
    authorHeadline: article.source,
    authorAvatarSeed: article.source || 'Gigvora Newsroom',
  });
}

async function runCycle() {
  if (isRunning) {
    return;
  }
  isRunning = true;
  lastRunAt = new Date();
  try {
    await ensureLatestPublishedAt();
    const articles = await fetchGuardianArticles();
    const cutoff = Date.now() - MAX_LOOKBACK_HOURS * 60 * 60 * 1000;
    const baseline = latestPublishedAt ? latestPublishedAt.getTime() : null;

    for (const article of articles) {
      if (!article) continue;
      const publishedAt = article.publishedAt ? article.publishedAt.getTime() : Date.now();
      if (publishedAt < cutoff) {
        continue;
      }
      if (baseline && publishedAt <= baseline) {
        continue;
      }
      const created = await publishArticle(article);
      if (created?.publishedAt) {
        const createdPublishedAt = new Date(created.publishedAt).getTime();
        if (!latestPublishedAt || createdPublishedAt > latestPublishedAt.getTime()) {
          latestPublishedAt = new Date(createdPublishedAt);
        }
      }
    }
    lastSuccessfulRunAt = new Date();
    lastError = null;
  } catch (error) {
    workerLogger?.error?.({ err: error }, 'Failed to aggregate Gigvora news');
    lastError = {
      message: error?.message || 'News aggregation failed',
      code: error?.code ?? null,
      timestamp: new Date().toISOString(),
    };
  } finally {
    isRunning = false;
  }
}

export async function startNewsAggregationWorker({ intervalMs = FETCH_INTERVAL_MS, logger = console } = {}) {
  if (workerHandle) {
    return;
  }
  workerLogger = logger ?? console;
  await runCycle();
  workerHandle = setInterval(runCycle, intervalMs);
  workerHandle.unref?.();
}

export function stopNewsAggregationWorker() {
  if (workerHandle) {
    clearInterval(workerHandle);
    workerHandle = null;
  }
  workerLogger = console;
}

export async function runNewsAggregationOnce() {
  await runCycle();
}

export function getNewsAggregationStatus() {
  return {
    isRunning,
    latestPublishedAt: latestPublishedAt ? latestPublishedAt.toISOString() : null,
    lastRunAt: lastRunAt ? lastRunAt.toISOString() : null,
    lastSuccessfulRunAt: lastSuccessfulRunAt ? lastSuccessfulRunAt.toISOString() : null,
    lastError,
    intervalMs: FETCH_INTERVAL_MS,
  };
}

export function __setNewsAggregationModels({ FeedPost: customFeedPost } = {}) {
  FeedPostModel = customFeedPost ?? null;
}

export function __resetNewsAggregationState() {
  stopNewsAggregationWorker();
  isRunning = false;
  latestPublishedAt = null;
  lastRunAt = null;
  lastSuccessfulRunAt = null;
  lastError = null;
  FeedPostModel = null;
}

export const __testing = {
  decodeHtmlEntities,
  stripHtml,
  normaliseGuardianArticle,
  fetchGuardianArticles,
  publishArticle,
  ensureLatestPublishedAt,
};

export default {
  startNewsAggregationWorker,
  stopNewsAggregationWorker,
  runNewsAggregationOnce,
  getNewsAggregationStatus,
  __setNewsAggregationModels,
  __resetNewsAggregationState,
};
