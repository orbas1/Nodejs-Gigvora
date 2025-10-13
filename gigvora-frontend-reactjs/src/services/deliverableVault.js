import { apiClient } from './apiClient.js';

export async function fetchVaultOverview({ freelancerId, signal } = {}) {
  if (!freelancerId) {
    throw new Error('freelancerId is required to fetch deliverable vault overview.');
  }
  return apiClient.get('/deliverable-vault/overview', {
    params: { freelancerId },
    signal,
  });
}

export async function fetchVaultItem(itemId, { freelancerId, signal } = {}) {
  if (!itemId) {
    throw new Error('itemId is required to fetch a deliverable.');
  }
  return apiClient.get(`/deliverable-vault/items/${itemId}`, {
    params: freelancerId ? { freelancerId } : undefined,
    signal,
  });
}

export async function createDeliverable(payload) {
  if (!payload?.freelancerId) {
    throw new Error('freelancerId is required when creating a deliverable.');
  }
  return apiClient.post('/deliverable-vault/items', payload);
}

export async function updateDeliverable(itemId, payload) {
  if (!itemId) {
    throw new Error('itemId is required when updating a deliverable.');
  }
  return apiClient.patch(`/deliverable-vault/items/${itemId}`, payload);
}

export async function addDeliverableVersion(itemId, payload) {
  if (!itemId) {
    throw new Error('itemId is required when uploading a deliverable version.');
  }
  return apiClient.post(`/deliverable-vault/items/${itemId}/versions`, payload);
}

export async function generateDeliveryPackage(itemId, payload) {
  if (!itemId) {
    throw new Error('itemId is required when generating a delivery package.');
  }
  return apiClient.post(`/deliverable-vault/items/${itemId}/delivery-packages`, payload);
}

export default {
  fetchVaultOverview,
  fetchVaultItem,
  createDeliverable,
  updateDeliverable,
  addDeliverableVersion,
  generateDeliveryPackage,
};
