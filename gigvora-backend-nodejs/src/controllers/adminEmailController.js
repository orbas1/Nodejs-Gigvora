import {
  getEmailManagementOverview,
  upsertSmtpConfig,
  sendTestEmail,
  listEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from '../services/emailManagementService.js';
import logger from '../utils/logger.js';
import { extractAdminActor, coercePositiveInteger, buildAuditMetadata } from '../utils/adminRequestContext.js';

export async function overview(req, res) {
  const summary = await getEmailManagementOverview();
  res.json(summary);
}

export async function persistSmtpConfig(req, res) {
  const actor = extractAdminActor(req);
  const result = await upsertSmtpConfig(req.body ?? {}, {
    actor: {
      id: actor.actorId ?? null,
      email: actor.actorEmail ?? null,
      name: actor.actorName ?? actor.descriptor,
      metadata: buildAuditMetadata(actor),
    },
  });
  logger.info({ actor: actor.reference }, 'Admin SMTP configuration updated');
  res.json(result);
}

export async function triggerTestEmail(req, res) {
  const actor = extractAdminActor(req);
  const result = await sendTestEmail(req.body ?? {}, {
    actor: {
      id: actor.actorId ?? null,
      email: actor.actorEmail ?? null,
      name: actor.actorName ?? actor.descriptor,
      metadata: buildAuditMetadata(actor),
    },
  });
  logger.info({ actor: actor.reference }, 'Admin SMTP test email triggered');
  res.json(result);
}

export async function templates(req, res) {
  const { search, category } = req.query ?? {};
  const templatesList = await listEmailTemplates({ search, category });
  res.json({ templates: templatesList });
}

export async function createTemplate(req, res) {
  const actor = extractAdminActor(req);
  const template = await createEmailTemplate(req.body ?? {}, {
    actor: {
      id: actor.actorId ?? null,
      email: actor.actorEmail ?? null,
      name: actor.actorName ?? actor.descriptor,
      metadata: buildAuditMetadata(actor),
    },
  });
  logger.info({ actor: actor.reference, templateId: template?.id }, 'Admin email template created');
  res.status(201).json(template);
}

export async function updateTemplate(req, res) {
  const actor = extractAdminActor(req);
  const templateId = coercePositiveInteger(req.params.templateId ?? req.params.id, 'templateId');
  const template = await updateEmailTemplate(templateId, req.body ?? {}, {
    actor: {
      id: actor.actorId ?? null,
      email: actor.actorEmail ?? null,
      name: actor.actorName ?? actor.descriptor,
      metadata: buildAuditMetadata(actor),
    },
  });
  logger.info({ actor: actor.reference, templateId }, 'Admin email template updated');
  res.json(template);
}

export async function removeTemplate(req, res) {
  const templateId = coercePositiveInteger(req.params.templateId ?? req.params.id, 'templateId');
  await deleteEmailTemplate(templateId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, templateId }, 'Admin email template deleted');
  res.status(204).send();
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
