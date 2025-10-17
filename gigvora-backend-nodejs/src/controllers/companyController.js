import { getCompanyDashboard } from '../services/companyDashboardService.js';
import * as workspaceAutoReplyService from '../services/workspaceAutoReplyService.js';

function parseNumber(value) {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function dashboard(req, res) {
  const { workspaceId, workspaceSlug, lookbackDays } = req.query ?? {};

  const payload = {
    workspaceId: parseNumber(workspaceId),
    workspaceSlug: workspaceSlug ?? undefined,
    lookbackDays: parseNumber(lookbackDays),
  };

  const result = await getCompanyDashboard(payload);
  res.json(result);
}

export async function byokAutoReplyOverview(req, res) {
  const overview = await workspaceAutoReplyService.getWorkspaceAutoReplyOverview({
    userId: req.user?.id ?? req.auth?.userId,
    workspaceId: req.query?.workspaceId,
  });
  res.json(overview);
}

export async function updateByokAutoReplySettings(req, res) {
  const settings = await workspaceAutoReplyService.updateWorkspaceProviderSettings({
    userId: req.user?.id ?? req.auth?.userId,
    payload: req.body ?? {},
  });
  res.json(settings);
}

export async function listByokAutoReplyTemplates(req, res) {
  const templates = await workspaceAutoReplyService.listWorkspaceTemplates({
    userId: req.user?.id ?? req.auth?.userId,
    workspaceId: req.query?.workspaceId,
  });
  res.json({ templates });
}

export async function createByokAutoReplyTemplate(req, res) {
  const template = await workspaceAutoReplyService.createWorkspaceTemplate({
    userId: req.user?.id ?? req.auth?.userId,
    workspaceId: req.body?.workspaceId ?? req.query?.workspaceId,
    payload: req.body ?? {},
  });
  res.status(201).json(template);
}

export async function updateByokAutoReplyTemplate(req, res) {
  const template = await workspaceAutoReplyService.updateWorkspaceTemplate({
    userId: req.user?.id ?? req.auth?.userId,
    workspaceId: req.body?.workspaceId ?? req.query?.workspaceId,
    templateId: req.params?.templateId,
    payload: req.body ?? {},
  });
  res.json(template);
}

export async function deleteByokAutoReplyTemplate(req, res) {
  await workspaceAutoReplyService.deleteWorkspaceTemplate({
    userId: req.user?.id ?? req.auth?.userId,
    workspaceId: req.query?.workspaceId,
    templateId: req.params?.templateId,
  });
  res.status(204).send();
}

export async function previewByokAutoReply(req, res) {
  const preview = await workspaceAutoReplyService.generateWorkspaceAutoReplyPreview({
    userId: req.user?.id ?? req.auth?.userId,
    payload: req.body ?? {},
  });
  res.json(preview);
}

export default {
  dashboard,
  byokAutoReplyOverview,
  updateByokAutoReplySettings,
  listByokAutoReplyTemplates,
  createByokAutoReplyTemplate,
  updateByokAutoReplyTemplate,
  deleteByokAutoReplyTemplate,
  previewByokAutoReply,
};

