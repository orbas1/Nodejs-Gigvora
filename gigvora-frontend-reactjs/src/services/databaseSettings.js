import { apiClient } from './apiClient.js';

export function listDatabaseConnections(params = {}) {
  return apiClient.get('/admin/database-settings', { params });
}

export function getDatabaseConnection(connectionId, params = {}) {
  return apiClient.get(`/admin/database-settings/${connectionId}`, { params });
}

export function createDatabaseConnection(payload) {
  return apiClient.post('/admin/database-settings', payload);
}

export function updateDatabaseConnection(connectionId, payload) {
  return apiClient.put(`/admin/database-settings/${connectionId}`, payload);
}

export function deleteDatabaseConnection(connectionId) {
  return apiClient.delete(`/admin/database-settings/${connectionId}`);
}

export function testDatabaseConnection(payload) {
  return apiClient.post('/admin/database-settings/test-connection', payload);
}

export default {
  listDatabaseConnections,
  getDatabaseConnection,
  createDatabaseConnection,
  updateDatabaseConnection,
  deleteDatabaseConnection,
  testDatabaseConnection,
};
