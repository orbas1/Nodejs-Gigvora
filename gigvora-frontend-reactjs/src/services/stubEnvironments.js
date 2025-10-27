import { apiClient } from './apiClient.js';

export function fetchStubEnvironmentCatalog(options = {}) {
  return apiClient.get('/integration/stub-environments', options);
}

export default {
  fetchStubEnvironmentCatalog,
};
