import {
  getEmailManagementOverview,
  upsertSmtpConfig,
  sendTestEmail,
  listEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from '../services/emailManagementService.js';

function resolveActor(req) {
  const actorEmail = req.user?.email || req.headers?.['x-user-email'] || req.headers?.['x-user'] || null;
  return {
    id: req.user?.id ?? null,
    email: actorEmail ? String(actorEmail).toLowerCase() : null,
  };
}

export async function overview(req, res) {
  const summary = await getEmailManagementOverview();
  res.json(summary);
}

export async function persistSmtpConfig(req, res) {
  const actor = resolveActor(req);
  const result = await upsertSmtpConfig(req.body ?? {}, { actor });
  res.json(result);
}

export async function triggerTestEmail(req, res) {
  const actor = resolveActor(req);
  const result = await sendTestEmail(req.body ?? {}, { actor });
  res.json(result);
}

export async function templates(req, res) {
  const { search, category } = req.query ?? {};
  const templatesList = await listEmailTemplates({ search, category });
  res.json({ templates: templatesList });
}

export async function createTemplate(req, res) {
  const actor = resolveActor(req);
  const template = await createEmailTemplate(req.body ?? {}, { actor });
  res.status(201).json(template);
}

export async function updateTemplate(req, res) {
  const actor = resolveActor(req);
  const templateId = Number(req.params.templateId ?? req.params.id);
  const template = await updateEmailTemplate(templateId, req.body ?? {}, { actor });
  res.json(template);
}

export async function removeTemplate(req, res) {
  const templateId = Number(req.params.templateId ?? req.params.id);
  const result = await deleteEmailTemplate(templateId);
  res.json(result);
}

export default {
  overview,
  persistSmtpConfig,
  triggerTestEmail,
  templates,
  createTemplate,
  updateTemplate,
  removeTemplate,
};
