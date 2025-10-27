import apiClient from './apiClient.js';

export async function fetchCalendarStubEnvironment({ signal } = {}) {
  return apiClient.get('/admin/maintenance/integration/calendar-stub', { signal });
}

export default {
  fetchCalendarStubEnvironment,
};
