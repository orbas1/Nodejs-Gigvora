import apiClient from './apiClient.js';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function ensureOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Options must be an object.');
  }
  return options;
}

function normaliseLimit(limit) {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(parsed, MAX_LIMIT);
}

export async function searchPeople(query, options = {}) {
  const trimmedQuery = typeof query === 'string' ? query.trim() : '';
  if (!trimmedQuery) {
    return [];
  }

  const { signal, limit = DEFAULT_LIMIT, ...rest } = options ?? {};
  const safeOptions = ensureOptions(rest);
  const requestOptions = {
    ...safeOptions,
    params: { q: trimmedQuery, limit: normaliseLimit(limit) },
    signal,
  };

  const response = await apiClient.get('/search', requestOptions);

  if (!response || !Array.isArray(response.people)) {
    return [];
  }

  return response.people.map((person) => ({
    id: person.id,
    firstName: person.firstName ?? '',
    lastName: person.lastName ?? '',
    email: person.email ?? '',
    userType: person.userType ?? '',
  }));
}

export default {
  searchPeople,
};
