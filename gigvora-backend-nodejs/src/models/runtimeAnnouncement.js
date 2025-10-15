import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

const STATUSES = new Set(['draft', 'scheduled', 'active', 'resolved']);
const SEVERITIES = new Set(['info', 'maintenance', 'incident', 'security']);

export const RuntimeAnnouncement = sequelize.define(
  'RuntimeAnnouncement',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING(140), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(240), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    severity: {
      type: DataTypes.STRING(32),
      allowNull: false,
      validate: {
        isIn: [Array.from(SEVERITIES)],
      },
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      validate: {
        isIn: [Array.from(STATUSES)],
      },
    },
    audiences: { type: jsonType, allowNull: false, defaultValue: [] },
    channels: { type: jsonType, allowNull: false, defaultValue: [] },
    dismissible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    startsAt: { type: DataTypes.DATE, allowNull: true },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    createdBy: { type: DataTypes.STRING(120), allowNull: true },
    updatedBy: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
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
  };
};

export function normaliseAnnouncementStatus(status) {
  const normalized = `${status}`.trim().toLowerCase();
  if (STATUSES.has(normalized)) {
    return normalized;
  }
  return 'draft';
}

export function normaliseAnnouncementSeverity(severity) {
  const normalized = `${severity}`.trim().toLowerCase();
  if (SEVERITIES.has(normalized)) {
    return normalized;
  }
  return 'info';
}

export default RuntimeAnnouncement;
