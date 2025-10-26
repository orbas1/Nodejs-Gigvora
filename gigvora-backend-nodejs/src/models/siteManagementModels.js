import { DataTypes, Op } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

const DEFAULT_ALLOWED_ROLES = ['guest'];

export const SITE_PAGE_STATUSES = ['draft', 'review', 'published', 'archived'];
export const SITE_PAGE_LAYOUTS = ['standard', 'feature', 'landing', 'legal'];
export const SITE_PAGE_FEEDBACK_RESPONSES = ['yes', 'partially', 'no'];

const SITE_PAGE_STATUS_TRANSITIONS = {
  draft: new Set(['review', 'published', 'archived']),
  review: new Set(['draft', 'published', 'archived']),
  published: new Set(['archived', 'draft']),
  archived: new Set(['draft']),
};

const sanitizeArrayOfStrings = (value, fallback = []) => {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry ?? '').trim()))
    .filter((entry, index, arr) => entry.length > 0 && arr.indexOf(entry) === index);
};

const normalizeSettingKey = (key) =>
  String(key ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

const normalizeSlug = (slug, fallbackTitle) => {
  const source = slug && slug.length > 0 ? slug : fallbackTitle;
  return String(source ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
};

const mergeMetadata = (existing, incoming) => {
  if (!incoming || typeof incoming !== 'object') {
    return existing ?? {};
  }
  return { ...(existing ?? {}), ...incoming };
};

const normalizeFeedbackResponse = (value) => {
  const response = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!SITE_PAGE_FEEDBACK_RESPONSES.includes(response)) {
    return null;
  }
  return response;
};

const clampString = (value, maxLength) => {
  if (value == null) {
    return null;
  }
  const text = String(value).trim();
  if (!text) {
    return null;
  }
  if (typeof maxLength === 'number' && maxLength > 0) {
    return text.slice(0, maxLength);
  }
  return text;
};

export const SiteSetting = sequelize.define(
  'SiteSetting',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    category: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'content' },
    description: { type: DataTypes.STRING(255), allowNull: true },
    isSensitive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    value: { type: jsonType, allowNull: false, defaultValue: {} },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    updatedBy: { type: DataTypes.STRING(255), allowNull: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  },
  {
    tableName: 'site_settings',
    indexes: [
      { unique: true, fields: ['key'] },
      { fields: ['category'] },
    ],
  },
);

SiteSetting.addHook('beforeValidate', (setting) => {
  setting.key = normalizeSettingKey(setting.key);
  setting.category = String(setting.category ?? 'content').trim().toLowerCase();
  setting.metadata = setting.metadata ?? {};
  if (!setting.value || typeof setting.value !== 'object') {
    setting.value = {};
  }
  if (!setting.version || setting.version < 1) {
    setting.version = 1;
  }
});

SiteSetting.prototype.toPublicObject = function toPublicObject({ revealSensitive = false } = {}) {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.key,
    category: plain.category,
    description: plain.description ?? null,
    isSensitive: Boolean(plain.isSensitive),
    value: plain.isSensitive && !revealSensitive ? null : plain.value ?? {},
    metadata: plain.metadata ?? {},
    updatedBy: plain.updatedBy ?? null,
    version: plain.version ?? 1,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

SiteSetting.prototype.updateValue = async function updateValue(value, { updatedBy, metadata, description } = {}) {
  const nextVersion = (this.version ?? 1) + 1;
  this.value = value && typeof value === 'object' ? value : {};
  this.metadata = mergeMetadata(this.metadata, metadata);
  if (description !== undefined) {
    this.description = description;
  }
  if (updatedBy !== undefined) {
    this.updatedBy = updatedBy;
  }
  this.version = nextVersion;
  await this.save();
  return this;
};

SiteSetting.ensureSetting = async function ensureSetting(key, { value, category = 'content', description, isSensitive = false, metadata, updatedBy } = {}) {
  const normalisedKey = normalizeSettingKey(key);
  const [record, created] = await SiteSetting.findOrCreate({
    where: { key: normalisedKey },
    defaults: {
      key: normalisedKey,
      category,
      description,
      value: value && typeof value === 'object' ? value : {},
      metadata: metadata ?? {},
      isSensitive,
      updatedBy,
    },
  });

  if (!created && value !== undefined) {
    record.category = category ?? record.category;
    record.isSensitive = Boolean(isSensitive);
    await record.updateValue(value, { updatedBy, metadata, description });
  }

  return record;
};

SiteSetting.getValue = async function getValue(key, { defaultValue = {}, revealSensitive = false } = {}) {
  const record = await SiteSetting.findOne({ where: { key: normalizeSettingKey(key) } });
  if (!record) {
    return defaultValue;
  }
  const publicShape = record.toPublicObject({ revealSensitive });
  return publicShape.value ?? defaultValue;
};

export const SitePage = sequelize.define(
  'SitePage',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    summary: { type: DataTypes.STRING(500), allowNull: true },
    heroTitle: { type: DataTypes.STRING(200), allowNull: true },
    heroSubtitle: { type: DataTypes.STRING(400), allowNull: true },
    heroEyebrow: { type: DataTypes.STRING(160), allowNull: true },
    heroMeta: { type: DataTypes.STRING(255), allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(2048), allowNull: true },
    heroImageAlt: { type: DataTypes.STRING(255), allowNull: true },
    ctaLabel: { type: DataTypes.STRING(120), allowNull: true },
    ctaUrl: { type: DataTypes.STRING(2048), allowNull: true },
    layout: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'standard', validate: { isIn: [SITE_PAGE_LAYOUTS] } },
    body: { type: DataTypes.TEXT('long'), allowNull: true },
    featureHighlights: { type: jsonType, allowNull: true, defaultValue: [] },
    seoTitle: { type: DataTypes.STRING(200), allowNull: true },
    seoDescription: { type: DataTypes.STRING(500), allowNull: true },
    seoKeywords: { type: jsonType, allowNull: true, defaultValue: [] },
    thumbnailUrl: { type: DataTypes.STRING(2048), allowNull: true },
    contactEmail: { type: DataTypes.STRING(255), allowNull: true },
    contactPhone: { type: DataTypes.STRING(80), allowNull: true },
    jurisdiction: { type: DataTypes.STRING(160), allowNull: true },
    version: { type: DataTypes.STRING(40), allowNull: true },
    lastReviewedAt: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM(...SITE_PAGE_STATUSES), allowNull: false, defaultValue: 'draft' },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    allowedRoles: { type: jsonType, allowNull: true, defaultValue: DEFAULT_ALLOWED_ROLES },
  },
  {
    tableName: 'site_pages',
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['status'] },
      { fields: ['jurisdiction'] },
    ],
  },
);

SitePage.addHook('beforeValidate', (page) => {
  page.slug = normalizeSlug(page.slug, page.title);
  page.allowedRoles = sanitizeArrayOfStrings(page.allowedRoles, DEFAULT_ALLOWED_ROLES);
  page.featureHighlights = Array.isArray(page.featureHighlights) ? page.featureHighlights : [];
  page.seoKeywords = sanitizeArrayOfStrings(page.seoKeywords);
  if (!SITE_PAGE_STATUSES.includes(page.status)) {
    page.status = 'draft';
  }
});

SitePage.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    slug: plain.slug,
    title: plain.title,
    summary: plain.summary,
    heroTitle: plain.heroTitle,
    heroSubtitle: plain.heroSubtitle,
    heroEyebrow: plain.heroEyebrow,
    heroMeta: plain.heroMeta,
    heroImageUrl: plain.heroImageUrl,
    heroImageAlt: plain.heroImageAlt,
    ctaLabel: plain.ctaLabel,
    ctaUrl: plain.ctaUrl,
    layout: plain.layout,
    body: plain.body,
    featureHighlights: Array.isArray(plain.featureHighlights) ? plain.featureHighlights : [],
    seoTitle: plain.seoTitle,
    seoDescription: plain.seoDescription,
    seoKeywords: Array.isArray(plain.seoKeywords) ? plain.seoKeywords : [],
    thumbnailUrl: plain.thumbnailUrl,
    contactEmail: plain.contactEmail,
    contactPhone: plain.contactPhone,
    jurisdiction: plain.jurisdiction,
    version: plain.version,
    lastReviewedAt: plain.lastReviewedAt,
    status: plain.status,
    publishedAt: plain.publishedAt,
    allowedRoles: Array.isArray(plain.allowedRoles) ? plain.allowedRoles : [],
    requiresAuthentication: Array.isArray(plain.allowedRoles) && plain.allowedRoles.length > 0 && !plain.allowedRoles.includes('guest'),
    isPublished: plain.status === 'published',
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

SitePage.prototype.canActorView = function canActorView(actorRoles = []) {
  if (!Array.isArray(this.allowedRoles) || this.allowedRoles.length === 0) {
    return true;
  }
  const allowedRoles = new Set(this.allowedRoles);
  if (allowedRoles.has('guest')) {
    return true;
  }
  return actorRoles.some((role) => allowedRoles.has(role));
};

SitePage.prototype.getSeoKeywords = function getSeoKeywords() {
  return sanitizeArrayOfStrings(this.seoKeywords);
};

SitePage.prototype.transitionToStatus = async function transitionToStatus(nextStatus, { actor, publishedAt = new Date() } = {}) {
  const currentStatus = this.status ?? 'draft';
  if (!SITE_PAGE_STATUSES.includes(nextStatus)) {
    throw new Error(`Unsupported site page status: ${nextStatus}`);
  }
  const allowedTransitions = SITE_PAGE_STATUS_TRANSITIONS[currentStatus] ?? new Set();
  if (!allowedTransitions.has(nextStatus) && nextStatus !== currentStatus) {
    throw new Error(`Invalid site page status transition from ${currentStatus} to ${nextStatus}`);
  }

  if (nextStatus === 'published') {
    this.publishedAt = publishedAt;
  } else if (nextStatus !== 'published') {
    this.publishedAt = nextStatus === 'archived' ? this.publishedAt : null;
  }

  if (nextStatus === 'review') {
    this.lastReviewedAt = new Date();
  }

  this.status = nextStatus;
  
  await this.save();
  return this;
};

SitePage.prototype.publish = function publish(options = {}) {
  return this.transitionToStatus('published', options);
};

SitePage.prototype.archive = function archive(options = {}) {
  return this.transitionToStatus('archived', options);
};

SitePage.filterVisibleToRoles = async function filterVisibleToRoles(roles = [], { statuses = ['published'] } = {}) {
  const sanitizedRoles = sanitizeArrayOfStrings(roles);
  const includeGuest = sanitizedRoles.length === 0 || sanitizedRoles.includes('guest');
  const pages = await SitePage.findAll({
    where: { status: { [Op.in]: statuses } },
    order: [['publishedAt', 'DESC'], ['updatedAt', 'DESC']],
  });

  if (includeGuest) {
    return pages;
  }

  return pages.filter((page) => page.canActorView(sanitizedRoles));
};

export const SiteNavigationLink = sequelize.define(
  'SiteNavigationLink',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    menuKey: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'primary' },
    label: { type: DataTypes.STRING(160), allowNull: false },
    url: { type: DataTypes.STRING(2048), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    icon: { type: DataTypes.STRING(120), allowNull: true },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isExternal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    openInNewTab: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    allowedRoles: { type: jsonType, allowNull: true, defaultValue: DEFAULT_ALLOWED_ROLES },
    parentId: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'site_navigation_links',
    indexes: [
      { fields: ['menuKey', 'orderIndex'] },
    ],
  },
);

SiteNavigationLink.addHook('beforeValidate', (link) => {
  link.menuKey = normalizeSettingKey(link.menuKey || 'primary').replace(/\./g, '-');
  link.allowedRoles = sanitizeArrayOfStrings(link.allowedRoles, DEFAULT_ALLOWED_ROLES);
  if (!Number.isFinite(link.orderIndex)) {
    link.orderIndex = 0;
  }
});

SiteNavigationLink.belongsTo(SiteNavigationLink, { as: 'parent', foreignKey: 'parentId' });

SiteNavigationLink.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    menuKey: plain.menuKey,
    label: plain.label,
    url: plain.url,
    description: plain.description,
    icon: plain.icon,
    orderIndex: plain.orderIndex,
    isExternal: Boolean(plain.isExternal),
    openInNewTab: Boolean(plain.openInNewTab),
    allowedRoles: Array.isArray(plain.allowedRoles) ? plain.allowedRoles : [],
    parentId: plain.parentId ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

SiteNavigationLink.prototype.canActorView = function canActorView(actorRoles = []) {
  if (!Array.isArray(this.allowedRoles) || this.allowedRoles.length === 0) {
    return true;
  }
  const allowedRoles = new Set(this.allowedRoles);
  if (allowedRoles.has('guest')) {
    return true;
  }
  return actorRoles.some((role) => allowedRoles.has(role));
};

SiteNavigationLink.reorderMenu = async function reorderMenu(menuKey, orderedIds, { transaction } = {}) {
  const normalisedMenuKey = normalizeSettingKey(menuKey).replace(/\./g, '-');
  const ids = Array.isArray(orderedIds) ? orderedIds.filter((id) => Number.isInteger(id)) : [];
  if (ids.length === 0) {
    return [];
  }

  const updates = await Promise.all(
    ids.map((id, index) =>
      SiteNavigationLink.update(
        { orderIndex: index },
        {
          where: { id, menuKey: normalisedMenuKey },
          transaction,
        },
      ),
    ),
  );

  return updates;
};

SiteNavigationLink.loadMenuTree = async function loadMenuTree(menuKey, { actorRoles = [] } = {}) {
  const normalisedMenuKey = normalizeSettingKey(menuKey).replace(/\./g, '-');
  const links = await SiteNavigationLink.findAll({
    where: { menuKey: normalisedMenuKey },
    order: [['orderIndex', 'ASC'], ['id', 'ASC']],
  });

  const linkMap = new Map();
  links.forEach((link) => {
    if (!link.canActorView(actorRoles)) {
      return;
    }
    linkMap.set(link.id, { ...link.toPublicObject(), children: [] });
  });

  const tree = [];
  linkMap.forEach((link) => {
    if (link.parentId && linkMap.has(link.parentId)) {
      linkMap.get(link.parentId).children.push(link);
    } else {
      tree.push(link);
    }
  });

  return tree;
};

export const SitePageFeedback = sequelize.define(
  'SitePageFeedback',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    pageId: { type: DataTypes.INTEGER, allowNull: false },
    response: {
      type: DataTypes.ENUM(...SITE_PAGE_FEEDBACK_RESPONSES),
      allowNull: false,
      validate: { isIn: [SITE_PAGE_FEEDBACK_RESPONSES] },
    },
    message: { type: DataTypes.TEXT('long'), allowNull: true },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    actorRoles: { type: jsonType, allowNull: true, defaultValue: [] },
    ipHash: { type: DataTypes.STRING(128), allowNull: true },
    userAgent: { type: DataTypes.STRING(512), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'site_page_feedback',
    indexes: [
      { fields: ['pageId'] },
      { fields: ['response'] },
      { fields: ['submittedAt'] },
    ],
  },
);

SitePageFeedback.addHook('beforeValidate', (feedback) => {
  feedback.response = normalizeFeedbackResponse(feedback.response) ?? 'yes';
  feedback.message = clampString(feedback.message, 2000);
  feedback.actorRoles = sanitizeArrayOfStrings(feedback.actorRoles, []);
  feedback.ipHash = clampString(feedback.ipHash, 128);
  feedback.userAgent = clampString(feedback.userAgent, 512);
  if (!feedback.metadata || typeof feedback.metadata !== 'object') {
    feedback.metadata = {};
  }
  if (!feedback.submittedAt) {
    feedback.submittedAt = new Date();
  }
});

SitePage.hasMany(SitePageFeedback, { as: 'feedbackEntries', foreignKey: 'pageId', onDelete: 'CASCADE' });
SitePageFeedback.belongsTo(SitePage, { as: 'page', foreignKey: 'pageId' });

SitePageFeedback.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    pageId: plain.pageId,
    response: plain.response,
    message: plain.message ?? null,
    actorId: plain.actorId ?? null,
    actorRoles: Array.isArray(plain.actorRoles) ? plain.actorRoles : [],
    submittedAt: plain.submittedAt,
    metadata: plain.metadata ?? {},
  };
};

export default {
  SiteSetting,
  SitePage,
  SiteNavigationLink,
  SitePageFeedback,
  SITE_PAGE_STATUSES,
  SITE_PAGE_LAYOUTS,
  SITE_PAGE_FEEDBACK_RESPONSES,
};
