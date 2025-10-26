import { fetchComplianceAuditLogs } from '../services/complianceAuditLogService.js';

export async function index(req, res) {
  const payload = await fetchComplianceAuditLogs(req, { limit: req.query?.limit });
  res.json(payload);
}

export default {
  index,
};
