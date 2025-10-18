import { apiClient } from './apiClient.js';

export async function fetchFinanceDashboard(params = {}, options = {}) {
  const config = { params, ...options };
  return apiClient.get('/admin/finance/dashboard', config);
}

export async function saveTreasuryPolicy(payload = {}) {
  return apiClient.put('/admin/finance/treasury-policy', payload);
}

export async function createFeeRule(payload = {}) {
  return apiClient.post('/admin/finance/fee-rules', payload);
}

export async function updateFeeRule(feeRuleId, payload = {}) {
  if (!feeRuleId) {
    throw new Error('feeRuleId is required');
  }
  return apiClient.put(`/admin/finance/fee-rules/${feeRuleId}`, payload);
}

export async function deleteFeeRule(feeRuleId) {
  if (!feeRuleId) {
    throw new Error('feeRuleId is required');
  }
  return apiClient.delete(`/admin/finance/fee-rules/${feeRuleId}`);
}

export async function createPayoutSchedule(payload = {}) {
  return apiClient.post('/admin/finance/payout-schedules', payload);
}

export async function updatePayoutSchedule(payoutScheduleId, payload = {}) {
  if (!payoutScheduleId) {
    throw new Error('payoutScheduleId is required');
  }
  return apiClient.put(`/admin/finance/payout-schedules/${payoutScheduleId}`, payload);
}

export async function deletePayoutSchedule(payoutScheduleId) {
  if (!payoutScheduleId) {
    throw new Error('payoutScheduleId is required');
  }
  return apiClient.delete(`/admin/finance/payout-schedules/${payoutScheduleId}`);
}

export async function createEscrowAdjustment(payload = {}) {
  return apiClient.post('/admin/finance/escrow-adjustments', payload);
}

export async function updateEscrowAdjustment(adjustmentId, payload = {}) {
  if (!adjustmentId) {
    throw new Error('adjustmentId is required');
  }
  return apiClient.put(`/admin/finance/escrow-adjustments/${adjustmentId}`, payload);
}

export async function deleteEscrowAdjustment(adjustmentId) {
  if (!adjustmentId) {
    throw new Error('adjustmentId is required');
  }
  return apiClient.delete(`/admin/finance/escrow-adjustments/${adjustmentId}`);
}

export default {
  fetchFinanceDashboard,
  saveTreasuryPolicy,
  createFeeRule,
  updateFeeRule,
  deleteFeeRule,
  createPayoutSchedule,
  updatePayoutSchedule,
  deletePayoutSchedule,
  createEscrowAdjustment,
  updateEscrowAdjustment,
  deleteEscrowAdjustment,
};
