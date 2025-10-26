import { DataTypes, Op } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const RUNTIME_ANNOUNCEMENT_STATUSES = Object.freeze(['draft', 'scheduled', 'active', 'resolved']);
export const RUNTIME_ANNOUNCEMENT_SEVERITIES = Object.freeze(['info', 'maintenance', 'incident', 'security']);

export const RuntimeAnnouncement = sequelize.define(
  'RuntimeAnnouncement',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    slug: {
      type: DataTypes.STRING(140),
      allowNull: false,
      unique: true,
      set(value) {
        if (typeof value === 'string') {
          this.setDataValue(
            'slug',
            value
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9-_]+/g, '-'),
          );
        } else {
          this.setDataValue('slug', value);
        }
      },
    },
    title: { type: DataTypes.STRING(240), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    severity: {
      type: DataTypes.STRING(32),
      allowNull: false,
      validate: {
        isIn: [RUNTIME_ANNOUNCEMENT_SEVERITIES],
      },
      defaultValue: 'info',
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      validate: {
        isIn: [RUNTIME_ANNOUNCEMENT_STATUSES],
      },
      defaultValue: 'draft',
    },
    audiences: { type: jsonType, allowNull: false, defaultValue: [] },
    channels: { type: jsonType, allowNull: false, defaultValue: [] },
    dismissible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    startsAt: { type: DataTypes.DATE, allowNull: true },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    createdBy: { type: DataTypes.STRING(120), allowNull: true },
    updatedBy: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    lastBroadcastAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'runtime_announcements',
    indexes: [
      { fields: ['status'] },
      { fields: ['startsAt'] },
      { fields: ['endsAt'] },
      { unique: true, fields: ['slug'] },
    ],
  },
);

function normaliseSlug(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-');
}

function normaliseAudienceList(raw = []) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return Array.from(
    new Set(
      raw
        .map((value) => `${value}`.trim().toLowerCase())
        .filter((value) => value.length > 0 && value.length <= 120),
    ),
  );
}

function normaliseChannelList(raw = []) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return Array.from(
    new Set(
      raw
        .map((value) => `${value}`.trim().toLowerCase())
        .filter((value) => value.length > 0 && value.length <= 120),
    ),
  );
}

RuntimeAnnouncement.addHook('beforeValidate', (announcement) => {
  announcement.slug = normaliseSlug(announcement.slug);
  announcement.audiences = normaliseAudienceList(announcement.audiences);
  announcement.channels = normaliseChannelList(announcement.channels);

  if (!RUNTIME_ANNOUNCEMENT_STATUSES.includes(announcement.status)) {
    announcement.status = 'draft';
  }
  if (!RUNTIME_ANNOUNCEMENT_SEVERITIES.includes(announcement.severity)) {
    announcement.severity = 'info';
  }

  if (['active', 'scheduled'].includes(announcement.status) && !announcement.publishedAt) {
    announcement.publishedAt = new Date();
  }
  if (announcement.status === 'resolved' && !announcement.resolvedAt) {
    announcement.resolvedAt = new Date();
  }
  if (!announcement.metadata || typeof announcement.metadata !== 'object') {
    announcement.metadata = {};
  }
});

RuntimeAnnouncement.prototype.targetsAudience = function targetsAudience(audience) {
  const targets = normaliseAudienceList(this.audiences);
  if (!audience) {
    return true;
  }
  const normalized = `${audience}`.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  if (!targets.length) {
    return true;
  }
  if (targets.includes('public')) {
    return true;
  }
  return targets.includes(normalized);
};

RuntimeAnnouncement.prototype.isActiveAt = function isActiveAt(date = new Date()) {
  const now = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(now.getTime())) {
    return false;
  }
  const startsAt = this.startsAt ? new Date(this.startsAt) : null;
  const endsAt = this.endsAt ? new Date(this.endsAt) : null;
  if (startsAt && now < startsAt) {
    return false;
  }
  if (endsAt && now > endsAt) {
    return false;
  }
  return this.status === 'active' || this.status === 'scheduled';
};

RuntimeAnnouncement.prototype.isUpcomingWithin = function isUpcomingWithin(windowMs, date = new Date()) {
  if (typeof windowMs !== 'number' || windowMs <= 0) {
    return false;
  }
  const now = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(now.getTime())) {
    return false;
  }
  const startsAt = this.startsAt ? new Date(this.startsAt) : null;
  if (!startsAt) {
    return false;
  }
  if (this.status !== 'scheduled') {
    return false;
  }
  const delta = startsAt.getTime() - now.getTime();
  return delta >= 0 && delta <= windowMs;
};

RuntimeAnnouncement.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    slug: plain.slug,
    title: plain.title,
    message: plain.message,
    severity: plain.severity,
    status: plain.status,
    audiences: normaliseAudienceList(plain.audiences),
    channels: normaliseChannelList(plain.channels),
    dismissible: Boolean(plain.dismissible),
    startsAt: plain.startsAt ? new Date(plain.startsAt).toISOString() : null,
    endsAt: plain.endsAt ? new Date(plain.endsAt).toISOString() : null,
    createdBy: plain.createdBy ?? null,
    updatedBy: plain.updatedBy ?? null,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
    publishedAt: plain.publishedAt ? new Date(plain.publishedAt).toISOString() : null,
    resolvedAt: plain.resolvedAt ? new Date(plain.resolvedAt).toISOString() : null,
    lastBroadcastAt: plain.lastBroadcastAt ? new Date(plain.lastBroadcastAt).toISOString() : null,
  };
};

export function normaliseAnnouncementStatus(status) {
  const normalized = `${status}`.trim().toLowerCase();
  if (RUNTIME_ANNOUNCEMENT_STATUSES.includes(normalized)) {
    return normalized;
  }
  return 'draft';
}

export function normaliseAnnouncementSeverity(severity) {
  const normalized = `${severity}`.trim().toLowerCase();
  if (RUNTIME_ANNOUNCEMENT_SEVERITIES.includes(normalized)) {
    return normalized;
  }
  return 'info';
}

RuntimeAnnouncement.fetchActiveAnnouncements = async function fetchActiveAnnouncements({ audience, channel } = {}) {
  const now = new Date();
  const where = {
    status: { [Op.in]: ['active', 'scheduled'] },
    [Op.and]: [
      { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }] },
      { [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gte]: now } }] },
    ],
  };

  const candidates = await RuntimeAnnouncement.findAll({ where, order: [['severity', 'DESC'], ['startsAt', 'ASC']] });

  return candidates.filter((announcement) => {
    const matchesAudience = announcement.targetsAudience(audience);
    if (!matchesAudience) {
      return false;
    }
    if (!channel) {
      return true;
    }
    const channels = normaliseChannelList(announcement.channels);
    return channels.length === 0 || channels.includes(channel.trim().toLowerCase());
  });
};

RuntimeAnnouncement.prototype.markBroadcasted = async function markBroadcasted(at = new Date()) {
  this.lastBroadcastAt = at instanceof Date ? at : new Date(at);
  await this.save();
  return this;
};

RuntimeAnnouncement.prototype.markResolved = async function markResolved(resolution = {}) {
  this.status = 'resolved';
  this.resolvedAt = resolution.resolvedAt instanceof Date ? resolution.resolvedAt : new Date();
  this.updatedBy = resolution.updatedBy ?? this.updatedBy ?? null;
  this.metadata = {
    ...this.metadata,
    resolutionSummary: resolution.summary ?? this.metadata?.resolutionSummary ?? null,
  };
  await this.save();
  return this;
};

export default RuntimeAnnouncement;
