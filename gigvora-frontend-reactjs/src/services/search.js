import apiClient from './apiClient.js';

export async function searchPeople(query, { limit = 10, signal } = {}) {
  const trimmed = query?.trim();
  if (!trimmed) {
    return [];
  }

  const response = await apiClient.get('/search', {
    params: { q: trimmed, limit },
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
