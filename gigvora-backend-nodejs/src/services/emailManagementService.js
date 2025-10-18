import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import { EmailSmtpConfig, EmailTemplate } from '../models/emailModels.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

function normaliseString(value, { fallback = '', maxLength } = {}) {
  if (value == null) {
    return fallback;
  }
  const stringValue = `${value}`.trim();
  if (!stringValue) {
    return fallback;
  }
  if (maxLength && stringValue.length > maxLength) {
    return stringValue.slice(0, maxLength);
  }
  return stringValue;
}

function normaliseBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(lowered)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(lowered)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return value !== 0;
  }
  return fallback;
}

function normaliseInteger(value, { fallback = 0, min, max } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  let result = Math.trunc(numeric);
  if (typeof min === 'number' && result < min) {
    result = min;
  }
  if (typeof max === 'number' && result > max) {
    result = max;
  }
  return result;
}

function normaliseEmail(value) {
  const email = normaliseString(value, { fallback: '' });
  if (!email) {
    return '';
  }
  const emailRegex = /^(?=.{3,254}$)[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError(`Invalid email address: ${email}`);
  }
  return email.toLowerCase();
}

function normaliseEmailList(value = []) {
  if (typeof value === 'string') {
    value = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => normaliseEmail(entry)).filter(Boolean);
}

function normaliseSlug(value) {
  const base = normaliseString(value, { fallback: '' }).toLowerCase();
  if (!base) {
    return '';
  }
  return base
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 160);
}

function normaliseTagList(value = []) {
  if (typeof value === 'string') {
    value = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(value)) {
    return [];
  }
  const tags = value
    .map((item) => normaliseSlug(item))
    .filter(Boolean);
  return Array.from(new Set(tags));
}

function normaliseVariables(variables = []) {
  if (!Array.isArray(variables)) {
    return [];
  }
  return variables
    .map((variable) => {
      if (!variable) {
        return null;
      }
      const key = normaliseSlug(variable.key || variable.name);
      if (!key) {
        return null;
      }
      return {
        key,
        label: normaliseString(variable.label || variable.name || key, { maxLength: 120 }) || key,
        description: normaliseString(variable.description, { maxLength: 400 }),
        required: normaliseBoolean(variable.required, false),
        sampleValue: normaliseString(variable.sampleValue, { maxLength: 200 }),
      };
    })
    .filter(Boolean);
}

function redactPassword(value) {
  if (!value) {
    return '';
  }
  if (value.length <= 4) {
    return '•'.repeat(value.length);
  }
  return `${'•'.repeat(value.length - 4)}${value.slice(-4)}`;
}
async function loadActiveSmtpConfig() {
  const config = await EmailSmtpConfig.findOne({
    where: { active: true },
    order: [['updatedAt', 'DESC']],
  });
  return config;
}

function ensureSmtpPayload(payload = {}) {
  const host = normaliseString(payload.host, { fallback: '' });
  if (!host) {
    throw new ValidationError('SMTP host is required.');
  }
  const fromAddress = normaliseEmail(payload.fromAddress);
  if (!fromAddress) {
    throw new ValidationError('Sender address is required.');
  }

  return {
    label: normaliseString(payload.label, { fallback: 'Primary SMTP', maxLength: 120 }) || 'Primary SMTP',
    host,
    port: normaliseInteger(payload.port, { fallback: 587, min: 1, max: 65535 }),
    secure: normaliseBoolean(payload.secure, false),
    username: normaliseString(payload.username, { maxLength: 255 }),
    password: payload.password == null ? undefined : normaliseString(payload.password, { maxLength: 255 }),
    fromName: normaliseString(payload.fromName, { maxLength: 120 }),
    fromAddress,
    replyToAddress: normaliseEmail(payload.replyToAddress || '') || null,
    bccAuditRecipients: normaliseEmailList(payload.bccAuditRecipients).join(', '),
    rateLimitPerMinute: normaliseInteger(payload.rateLimitPerMinute, {
      fallback: 120,
      min: 1,
      max: 10000,
    }),
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
  };
}

function ensureTemplatePayload(payload = {}, { existing } = {}) {
  const slug = normaliseSlug(payload.slug || payload.name || existing?.slug);
  if (!slug) {
    throw new ValidationError('Template slug is required.');
  }
  const name = normaliseString(payload.name, { fallback: existing?.name, maxLength: 160 });
  if (!name) {
    throw new ValidationError('Template name is required.');
  }
  const subject = normaliseString(payload.subject, { fallback: existing?.subject, maxLength: 255 });
  if (!subject) {
    throw new ValidationError('Template subject is required.');
  }
  const htmlBody = normaliseString(payload.htmlBody ?? payload.html, {
    fallback: existing?.htmlBody,
  });
  if (!htmlBody) {
    throw new ValidationError('Template HTML body is required.');
  }

  return {
    slug,
    name,
    description: normaliseString(payload.description, { maxLength: 1000 }),
    category: normaliseSlug(payload.category || existing?.category || ''),
    subject,
    preheader: normaliseString(payload.preheader, { maxLength: 255 }),
    fromName: normaliseString(payload.fromName, { maxLength: 120 }),
    fromAddress: normaliseEmail(payload.fromAddress || existing?.fromAddress || ''),
    replyToAddress: normaliseEmail(payload.replyToAddress || existing?.replyToAddress || ''),
    heroImageUrl: normaliseString(payload.heroImageUrl, { maxLength: 500 }),
    htmlBody,
    textBody: normaliseString(payload.textBody ?? payload.text ?? existing?.textBody, {
      maxLength: 10000,
    }),
    layout: normaliseSlug(payload.layout || existing?.layout || ''),
    tags: normaliseTagList(payload.tags ?? existing?.tags ?? []),
    variables: normaliseVariables(payload.variables ?? existing?.variables ?? []),
    enabled: normaliseBoolean(payload.enabled, existing?.enabled ?? true),
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : existing?.metadata ?? {},
  };
}

export async function getEmailManagementOverview() {
  const [smtpConfig, templates] = await Promise.all([
    loadActiveSmtpConfig(),
    EmailTemplate.findAll({ order: [['updatedAt', 'DESC']] }),
  ]);

  const templateSummaries = templates.reduce(
    (accumulator, template) => {
      if (template.enabled) {
        accumulator.enabled += 1;
      }
      accumulator.total += 1;
      if (template.category) {
        accumulator.categories[template.category] = (accumulator.categories[template.category] || 0) + 1;
      }
      return accumulator;
    },
    { total: 0, enabled: 0, categories: {} },
  );

  return {
    smtpConfig: smtpConfig ? smtpConfig.toPublicObject() : null,
    templateSummary: {
      total: templateSummaries.total,
      enabled: templateSummaries.enabled,
      categories: templateSummaries.categories,
    },
    templates: templates.map((template) => template.toPublicObject()),
  };
}
export async function upsertSmtpConfig(payload = {}, { actor } = {}) {
  const normalized = ensureSmtpPayload(payload);
  let config = await loadActiveSmtpConfig();
  const updates = { ...normalized };

  if (config) {
    if (updates.password === undefined) {
      delete updates.password;
    }
    await config.update(updates);
  } else {
    if (updates.password === undefined) {
      updates.password = '';
    }
    config = await EmailSmtpConfig.create(updates);
  }

  if (actor?.email) {
    config.metadata = {
      ...config.metadata,
      lastUpdatedBy: actor.email,
      lastUpdatedAt: new Date().toISOString(),
    };
    await config.save();
  }

  logger.info({ host: config.host, user: actor?.email }, 'SMTP configuration updated');
  return config.toPublicObject();
}

function buildTransporter(config) {
  const auth = config.username
    ? {
        user: config.username,
        pass: config.password,
      }
    : undefined;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: Boolean(config.secure),
    auth,
  });
}

export async function sendTestEmail(payload = {}, { actor } = {}) {
  const config = await loadActiveSmtpConfig();
  if (!config) {
    throw new ValidationError('Configure SMTP before sending test email.');
  }

  const recipients = normaliseEmailList(payload.recipients ?? payload.to);
  if (recipients.length === 0) {
    throw new ValidationError('At least one recipient email is required.');
  }

  const templateId = payload.templateId ? Number(payload.templateId) : null;
  let template = null;
  if (templateId) {
    template = await EmailTemplate.findByPk(templateId);
    if (!template) {
      throw new NotFoundError('Template not found');
    }
  }

  const subject = normaliseString(payload.subject, {
    fallback: template?.subject || 'Gigvora test email',
    maxLength: 255,
  });
  const htmlBody = normaliseString(payload.htmlBody ?? payload.html, {
    fallback: template?.htmlBody || '<p>This is a Gigvora SMTP test email.</p>',
  });
  const textBody = normaliseString(payload.textBody ?? payload.text, {
    fallback: template?.textBody || 'This is a Gigvora SMTP test email.',
  });

  const transporter = buildTransporter(config);
  const fromName = normaliseString(config.fromName, { fallback: 'Gigvora' });
  const fromAddress = normaliseEmail(config.fromAddress);

  const mailOptions = {
    from: fromName ? `${fromName} <${fromAddress}>` : fromAddress,
    to: recipients.join(', '),
    subject,
    html: htmlBody,
    text: textBody,
  };

  if (config.replyToAddress) {
    mailOptions.replyTo = config.replyToAddress;
  }
  if (config.bccAuditRecipients) {
    mailOptions.bcc = config.bccAuditRecipients;
  }

  await transporter.sendMail(mailOptions);

  config.lastVerifiedAt = new Date();
  if (actor?.email) {
    config.metadata = {
      ...config.metadata,
      lastTestedBy: actor.email,
      lastTestedAt: config.lastVerifiedAt.toISOString(),
    };
  }
  await config.save();

  logger.info({ recipients, template: template?.slug, actor: actor?.email }, 'SMTP test email delivered');
  return {
    delivered: true,
    deliveredAt: config.lastVerifiedAt.toISOString(),
    recipients,
    subject,
    usingTemplate: template ? template.slug : null,
  };
}

export async function listEmailTemplates({ search, category } = {}) {
  const where = {};
  if (category) {
    where.category = category;
  }
  if (search) {
    const term = `%${search.trim().toLowerCase()}%`;
    where[Op.or] = [
      { slug: { [Op.like]: term } },
      { name: { [Op.like]: term } },
      { subject: { [Op.like]: term } },
    ];
  }
  const templates = await EmailTemplate.findAll({ where, order: [['updatedAt', 'DESC']] });
  return templates.map((template) => template.toPublicObject());
}

export async function createEmailTemplate(payload = {}, { actor } = {}) {
  const normalized = ensureTemplatePayload(payload);
  const existing = await EmailTemplate.findOne({ where: { slug: normalized.slug } });
  if (existing) {
    throw new ValidationError(`Template with slug ${normalized.slug} already exists.`);
  }

  const template = await EmailTemplate.create({
    ...normalized,
    createdBy: actor?.email || actor?.id || 'system',
    updatedBy: actor?.email || actor?.id || 'system',
  });

  logger.info({ slug: template.slug, actor: actor?.email }, 'Email template created');
  return template.toPublicObject();
}

export async function updateEmailTemplate(templateId, payload = {}, { actor } = {}) {
  if (!templateId) {
    throw new ValidationError('Template ID is required.');
  }
  const template = await EmailTemplate.findByPk(templateId);
  if (!template) {
    throw new NotFoundError('Template not found');
  }

  const normalized = ensureTemplatePayload(payload, { existing: template });

  if (normalized.slug !== template.slug) {
    const duplicate = await EmailTemplate.findOne({ where: { slug: normalized.slug } });
    if (duplicate && duplicate.id !== template.id) {
      throw new ValidationError(`Another template with slug ${normalized.slug} already exists.`);
    }
  }

  const nextVersion = (template.version ?? 1) + 1;
  await template.update({
    ...normalized,
    version: nextVersion,
    updatedBy: actor?.email || actor?.id || 'system',
  });

  logger.info({ slug: template.slug, actor: actor?.email }, 'Email template updated');
  return template.toPublicObject();
}

export async function deleteEmailTemplate(templateId) {
  if (!templateId) {
    throw new ValidationError('Template ID is required.');
  }
  const template = await EmailTemplate.findByPk(templateId);
  if (!template) {
    throw new NotFoundError('Template not found');
  }

  await template.destroy();
  logger.info({ slug: template.slug }, 'Email template deleted');
  return { success: true };
}

export function serializeSmtpConfigForAudit(config) {
  if (!config) {
    return null;
  }
  return {
    label: config.label,
    host: config.host,
    port: config.port,
    secure: Boolean(config.secure),
    username: config.username,
    password: redactPassword(config.password || ''),
    fromName: config.fromName,
    fromAddress: config.fromAddress,
    replyToAddress: config.replyToAddress,
    bccAuditRecipients: config.bccAuditRecipients,
    rateLimitPerMinute: config.rateLimitPerMinute,
    lastVerifiedAt: config.lastVerifiedAt,
  };
}
