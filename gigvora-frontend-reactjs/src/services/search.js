import apiClient from './apiClient.js';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function normaliseQuery(query) {
  return typeof query === 'string' ? query.trim() : `${query ?? ''}`.trim();
}

function clampLimit(limit) {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(parsed, MAX_LIMIT);
}

export async function searchPeople(query, options = {}) {
  const term = normaliseQuery(query);
  if (!term) {
    return [];
  }

  if (options !== null && typeof options !== 'object') {
    throw new Error('Search options must be an object when provided.');
  }
  const { limit = DEFAULT_LIMIT, signal } = options ?? {};

  const response = await apiClient.get('/search', {
    params: { q: term, limit: clampLimit(limit) },
    signal,
  });

  if (!response) {
    return [];
  }

  return Array.isArray(response.people)
    ? response.people.map((person) => ({
        id: person.id,
        firstName: person.firstName ?? '',
        lastName: person.lastName ?? '',
        email: person.email ?? '',
        userType: person.userType ?? '',
      }))
    : [];
}

export default {
  searchPeople,
};
