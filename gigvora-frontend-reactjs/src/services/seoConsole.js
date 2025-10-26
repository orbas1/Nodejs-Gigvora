import { apiClient } from './apiClient.js';

function ensureOptions(options) {
  if (options == null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('options must be an object');
  }
  return options;
}

export async function fetchSeoConsoleSnapshot(options = {}) {
  const query = ensureOptions(options);
  return apiClient.get('/admin/seo/console/snapshot', Object.keys(query).length ? query : undefined);
}

export async function generateSeoConsoleSitemap(payload = {}, options = {}) {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('payload must be an object');
  }
  const requestOptions = ensureOptions(options);
  return apiClient.post(
    '/admin/seo/console/sitemap',
    payload,
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
}

export async function fetchSeoSitemapJobs(options = {}) {
  const query = ensureOptions(options);
  return apiClient.get(
    '/admin/seo/console/sitemap/jobs',
    Object.keys(query).length ? query : undefined,
  );
}

export async function submitSeoConsoleSitemapJob(jobId, payload = {}, options = {}) {
  if (!jobId) {
    throw new Error('jobId is required');
  }
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('payload must be an object');
  }
  const requestOptions = ensureOptions(options);
  return apiClient.post(
    `/admin/seo/console/sitemap/jobs/${jobId}/submit`,
    payload,
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
}

export async function fetchSeoSchemaTemplates(options = {}) {
  const query = ensureOptions(options);
  return apiClient.get(
    '/admin/seo/console/schema-templates',
    Object.keys(query).length ? query : undefined,
  );
}

export async function fetchSeoMetaTemplates(options = {}) {
  const query = ensureOptions(options);
  return apiClient.get(
    '/admin/seo/console/meta-templates',
    Object.keys(query).length ? query : undefined,
  );
}

export default {
  fetchSeoConsoleSnapshot,
  generateSeoConsoleSitemap,
  fetchSeoSitemapJobs,
  submitSeoConsoleSitemapJob,
  fetchSeoSchemaTemplates,
  fetchSeoMetaTemplates,
};
