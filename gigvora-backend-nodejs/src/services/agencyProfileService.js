import {
  sequelize,
  AgencyProfile,
  AgencyProfileMedia,
  AgencyProfileSkill,
  AgencyProfileCredential,
  AgencyProfileExperience,
  AgencyProfileWorkforceSegment,
  AGENCY_PROFILE_MEDIA_ALLOWED_TYPES,
  AGENCY_PROFILE_CREDENTIAL_TYPES,
} from '../models/index.js';
import { AuthenticationError, NotFoundError, ValidationError } from '../utils/errors.js';

const MEDIA_TYPES = new Set(AGENCY_PROFILE_MEDIA_ALLOWED_TYPES.map((type) => type.toLowerCase()));
const CREDENTIAL_TYPES = new Set(AGENCY_PROFILE_CREDENTIAL_TYPES.map((type) => type.toLowerCase()));

function normalizeNumber(value) {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric;
}

function normalizeString(value) {
  if (value == null) {
    return null;
  }
  const text = `${value}`.trim();
  return text.length ? text : null;
}

function serializeMedia(record) {
  if (!record) {
    return null;
  }
  const plain = record.get ? record.get({ plain: true }) : record;
  return {
    id: plain.id,
    agencyProfileId: plain.agencyProfileId,
    type: plain.type,
    title: plain.title ?? null,
    url: plain.url,
    altText: plain.altText ?? null,
    description: plain.description ?? null,
    position: plain.position ?? 0,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

function serializeSkill(record) {
  if (!record) {
    return null;
  }
  const plain = record.get ? record.get({ plain: true }) : record;
  return {
    id: plain.id,
    agencyProfileId: plain.agencyProfileId,
    name: plain.name,
    category: plain.category ?? null,
    proficiency: plain.proficiency == null ? null : Number(plain.proficiency),
    experienceYears: plain.experienceYears == null ? null : Number(plain.experienceYears),
    isFeatured: Boolean(plain.isFeatured),
    position: plain.position ?? 0,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

function serializeCredential(record) {
  if (!record) {
    return null;
  }
  const plain = record.get ? record.get({ plain: true }) : record;
  return {
    id: plain.id,
    agencyProfileId: plain.agencyProfileId,
    type: plain.type,
    title: plain.title,
    issuer: plain.issuer ?? null,
    issuedAt: plain.issuedAt ?? null,
    expiresAt: plain.expiresAt ?? null,
    credentialUrl: plain.credentialUrl ?? null,
    description: plain.description ?? null,
    referenceId: plain.referenceId ?? null,
    verificationStatus: plain.verificationStatus ?? null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

function serializeExperience(record) {
  if (!record) {
    return null;
  }
  const plain = record.get ? record.get({ plain: true }) : record;
  return {
    id: plain.id,
    agencyProfileId: plain.agencyProfileId,
    title: plain.title,
    client: plain.client ?? null,
    summary: plain.summary ?? null,
    startDate: plain.startDate ?? null,
    endDate: plain.endDate ?? null,
    isCurrent: Boolean(plain.isCurrent),
    impact: plain.impact ?? null,
    tags: Array.isArray(plain.tags) ? plain.tags : plain.tags ?? null,
    heroImageUrl: plain.heroImageUrl ?? null,
    position: plain.position ?? 0,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

function serializeWorkforceSegment(record) {
  if (!record) {
    return null;
  }
  const plain = record.get ? record.get({ plain: true }) : record;
  return {
    id: plain.id,
    agencyProfileId: plain.agencyProfileId,
    segmentName: plain.segmentName,
    specialization: plain.specialization ?? null,
    availableCount: plain.availableCount == null ? null : Number(plain.availableCount),
    totalCount: plain.totalCount == null ? null : Number(plain.totalCount),
    deliveryModel: plain.deliveryModel ?? null,
    location: plain.location ?? null,
    availabilityNotes: plain.availabilityNotes ?? null,
    averageBillRate: plain.averageBillRate == null ? null : Number(plain.averageBillRate),
    currency: plain.currency ?? null,
    leadTimeDays: plain.leadTimeDays == null ? null : Number(plain.leadTimeDays),
    metadata: plain.metadata ?? null,
    position: plain.position ?? 0,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

async function requireAgencyActor(actorId) {
  if (!actorId) {
    throw new AuthenticationError('Authentication required.');
  }
  const profile = await AgencyProfile.findOne({ where: { userId: actorId } });
  if (!profile) {
    throw new NotFoundError('No agency profile is linked to this account yet.');
  }
  return profile;
}

function applyProfileUpdates(profile, payload) {
  const updates = {};
  if (Object.prototype.hasOwnProperty.call(payload, 'tagline')) {
    updates.tagline = normalizeString(payload.tagline);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
    updates.description = payload.description == null ? null : `${payload.description}`;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'introVideoUrl')) {
    updates.introVideoUrl = normalizeString(payload.introVideoUrl);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'bannerImageUrl')) {
    updates.bannerImageUrl = normalizeString(payload.bannerImageUrl);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'profileImageUrl')) {
    updates.profileImageUrl = normalizeString(payload.profileImageUrl);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'workforceAvailable')) {
    updates.workforceAvailable = payload.workforceAvailable == null ? null : Number(payload.workforceAvailable);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'workforceNotes')) {
    updates.workforceNotes = normalizeString(payload.workforceNotes);
  }
  return Object.keys(updates).length ? updates : null;
}

function sanitizeMediaPayload(payload = {}) {
  const type = normalizeString(payload.type)?.toLowerCase() ?? 'image';
  if (!MEDIA_TYPES.has(type)) {
    throw new ValidationError('Unsupported media type.', { field: 'type' });
  }
  return {
    type,
    title: normalizeString(payload.title),
    url: normalizeString(payload.url),
    altText: normalizeString(payload.altText),
    description: normalizeString(payload.description),
    position: payload.position == null ? null : Number(payload.position),
    metadata: payload.metadata ?? null,
  };
}

function sanitizeSkillPayload(payload = {}) {
  return {
    name: normalizeString(payload.name),
    category: normalizeString(payload.category),
    proficiency: payload.proficiency == null ? null : Number(payload.proficiency),
    experienceYears: payload.experienceYears == null ? null : Number(payload.experienceYears),
    isFeatured: payload.isFeatured != null ? Boolean(payload.isFeatured) : undefined,
    position: payload.position == null ? null : Number(payload.position),
  };
}

function sanitizeCredentialPayload(payload = {}) {
  const type = normalizeString(payload.type)?.toLowerCase();
  if (type && !CREDENTIAL_TYPES.has(type)) {
    throw new ValidationError('Unsupported credential type.', { field: 'type' });
  }
  return {
    type,
    title: normalizeString(payload.title),
    issuer: normalizeString(payload.issuer),
    issuedAt: normalizeString(payload.issuedAt),
    expiresAt: normalizeString(payload.expiresAt),
    credentialUrl: normalizeString(payload.credentialUrl),
    description: normalizeString(payload.description),
    referenceId: normalizeString(payload.referenceId),
    verificationStatus: normalizeString(payload.verificationStatus),
  };
}

function sanitizeExperiencePayload(payload = {}) {
  return {
    title: normalizeString(payload.title),
    client: normalizeString(payload.client),
    summary: payload.summary == null ? null : `${payload.summary}`.trim() || null,
    startDate: normalizeString(payload.startDate),
    endDate: normalizeString(payload.endDate),
    isCurrent: payload.isCurrent != null ? Boolean(payload.isCurrent) : undefined,
    impact: payload.impact == null ? null : `${payload.impact}`.trim() || null,
    heroImageUrl: normalizeString(payload.heroImageUrl),
    tags: Array.isArray(payload.tags) ? payload.tags : undefined,
    position: payload.position == null ? null : Number(payload.position),
  };
}

function sanitizeWorkforcePayload(payload = {}) {
  return {
    segmentName: normalizeString(payload.segmentName),
    specialization: normalizeString(payload.specialization),
    availableCount: payload.availableCount == null ? null : Number(payload.availableCount),
    totalCount: payload.totalCount == null ? null : Number(payload.totalCount),
    deliveryModel: normalizeString(payload.deliveryModel),
    location: normalizeString(payload.location),
    availabilityNotes: payload.availabilityNotes == null ? null : `${payload.availabilityNotes}`.trim() || null,
    averageBillRate: payload.averageBillRate == null ? null : Number(payload.averageBillRate),
    currency: normalizeString(payload.currency),
    leadTimeDays: payload.leadTimeDays == null ? null : Number(payload.leadTimeDays),
    metadata: payload.metadata ?? null,
    position: payload.position == null ? null : Number(payload.position),
  };
}

function serializeProfile(profile) {
  const plain = profile.get ? profile.get({ plain: true }) : profile;
  return {
    id: plain.id,
    agencyName: plain.agencyName,
    focusArea: plain.focusArea ?? null,
    website: plain.website ?? null,
    location: plain.location ?? null,
    geoLocation: plain.geoLocation ?? null,
    tagline: plain.tagline ?? null,
    description: plain.description ?? null,
    introVideoUrl: plain.introVideoUrl ?? null,
    bannerImageUrl: plain.bannerImageUrl ?? null,
    profileImageUrl: plain.profileImageUrl ?? null,
    workforceAvailable: plain.workforceAvailable == null ? null : Number(plain.workforceAvailable),
    workforceNotes: plain.workforceNotes ?? null,
  };
}

export async function getAgencyProfileManagement(payload = {}, { actorId, actorRoles } = {}) {
  const profile = await requireAgencyActor(actorId ?? payload.actorId);

  const detailed = await AgencyProfile.findOne({
    where: { id: profile.id },
    include: [
      { model: AgencyProfileMedia, as: 'media', separate: true, order: [
        ['position', 'ASC'],
        ['createdAt', 'ASC'],
      ] },
      { model: AgencyProfileSkill, as: 'skills', separate: true, order: [
        ['position', 'ASC'],
        ['createdAt', 'ASC'],
      ] },
      { model: AgencyProfileCredential, as: 'credentials', separate: true, order: [
        ['issuedAt', 'DESC'],
        ['createdAt', 'DESC'],
      ] },
      { model: AgencyProfileExperience, as: 'experiences', separate: true, order: [
        ['position', 'ASC'],
        ['startDate', 'DESC'],
        ['createdAt', 'DESC'],
      ] },
      { model: AgencyProfileWorkforceSegment, as: 'workforceSegments', separate: true, order: [
        ['position', 'ASC'],
        ['createdAt', 'ASC'],
      ] },
    ],
  });

  if (!detailed) {
    throw new NotFoundError('Unable to load agency profile details.');
  }

  const plain = detailed.get({ plain: true });
  const media = Array.isArray(plain.media) ? plain.media.map(serializeMedia).filter(Boolean) : [];
  const skills = Array.isArray(plain.skills) ? plain.skills.map(serializeSkill).filter(Boolean) : [];
  const credentials = Array.isArray(plain.credentials)
    ? plain.credentials.map(serializeCredential).filter(Boolean)
    : [];
  const experiences = Array.isArray(plain.experiences)
    ? plain.experiences.map(serializeExperience).filter(Boolean)
    : [];
  const workforce = Array.isArray(plain.workforceSegments)
    ? plain.workforceSegments.map(serializeWorkforceSegment).filter(Boolean)
    : [];

  return {
    profile: serializeProfile(plain),
    gallery: media.filter((item) => item && item.type !== 'banner'),
    media,
    skills,
    qualifications: credentials.filter((credential) => credential.type === 'qualification'),
    certificates: credentials.filter((credential) => credential.type === 'certificate'),
    experiences,
    workforce,
  };
}

export async function updateAgencyProfileBasics(actorId, payload) {
  const profile = await requireAgencyActor(actorId);

  const updates = applyProfileUpdates(profile, payload ?? {});
  if (!updates) {
    return serializeProfile(profile);
  }

  return sequelize.transaction(async (transaction) => {
    await profile.update(updates, { transaction });
    await profile.reload({ transaction });
    return serializeProfile(profile);
  });
}

async function resolveMediaForActor(actorId, mediaId, { transaction } = {}) {
  const profile = await requireAgencyActor(actorId);
  const record = await AgencyProfileMedia.findOne({
    where: { id: mediaId, agencyProfileId: profile.id },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!record) {
    throw new NotFoundError('Media asset not found.');
  }
  return { profile, record };
}

export async function createAgencyProfileMedia(actorId, payload) {
  const profile = await requireAgencyActor(actorId);
  const { type, title, url, altText, description, position, metadata } = sanitizeMediaPayload(payload);
  if (!url) {
    throw new ValidationError('A media URL is required.', { field: 'url' });
  }

  return sequelize.transaction(async (transaction) => {
    const resolvedPosition =
      position != null
        ? Number(position)
        : (await AgencyProfileMedia.max('position', {
            where: { agencyProfileId: profile.id },
            transaction,
          })) + 1 || 0;

    const record = await AgencyProfileMedia.create(
      {
        agencyProfileId: profile.id,
        type,
        title,
        url,
        altText,
        description,
        position: Number.isFinite(resolvedPosition) ? resolvedPosition : 0,
        metadata,
      },
      { transaction },
    );
    return serializeMedia(record);
  });
}

export async function updateAgencyProfileMedia(actorId, mediaId, payload) {
  return sequelize.transaction(async (transaction) => {
    const { record } = await resolveMediaForActor(actorId, mediaId, { transaction });
    const updates = sanitizeMediaPayload(payload);
    if (updates.url == null) {
      delete updates.url;
    }
    await record.update(
      {
        ...updates,
        position: updates.position != null ? Number(updates.position) : record.position,
      },
      { transaction },
    );
    await record.reload({ transaction });
    return serializeMedia(record);
  });
}

export async function deleteAgencyProfileMedia(actorId, mediaId) {
  return sequelize.transaction(async (transaction) => {
    const { record } = await resolveMediaForActor(actorId, mediaId, { transaction });
    await record.destroy({ transaction });
    return { success: true };
  });
}

async function resolveSkillForActor(actorId, skillId, { transaction } = {}) {
  const profile = await requireAgencyActor(actorId);
  const record = await AgencyProfileSkill.findOne({
    where: { id: skillId, agencyProfileId: profile.id },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!record) {
    throw new NotFoundError('Skill not found.');
  }
  return { profile, record };
}

export async function createAgencyProfileSkill(actorId, payload) {
  const profile = await requireAgencyActor(actorId);
  const { name, category, proficiency, experienceYears, isFeatured, position } = sanitizeSkillPayload(payload);
  if (!name) {
    throw new ValidationError('Skill name is required.', { field: 'name' });
  }

  return sequelize.transaction(async (transaction) => {
    const resolvedPosition =
      position != null
        ? Number(position)
        : (await AgencyProfileSkill.max('position', { where: { agencyProfileId: profile.id }, transaction })) + 1 || 0;

    const record = await AgencyProfileSkill.create(
      {
        agencyProfileId: profile.id,
        name,
        category,
        proficiency,
        experienceYears,
        isFeatured: Boolean(isFeatured),
        position: Number.isFinite(resolvedPosition) ? resolvedPosition : 0,
      },
      { transaction },
    );
    return serializeSkill(record);
  });
}

export async function updateAgencyProfileSkill(actorId, skillId, payload) {
  return sequelize.transaction(async (transaction) => {
    const { record } = await resolveSkillForActor(actorId, skillId, { transaction });
    const updates = sanitizeSkillPayload(payload);
    if (updates.name) {
      record.name = updates.name;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'category')) {
      record.category = updates.category;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'proficiency')) {
      record.proficiency = updates.proficiency;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'experienceYears')) {
      record.experienceYears = updates.experienceYears;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'isFeatured')) {
      record.isFeatured = Boolean(updates.isFeatured);
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'position') && updates.position != null) {
      record.position = Number(updates.position);
    }
    await record.save({ transaction });
    await record.reload({ transaction });
    return serializeSkill(record);
  });
}

export async function deleteAgencyProfileSkill(actorId, skillId) {
  return sequelize.transaction(async (transaction) => {
    const { record } = await resolveSkillForActor(actorId, skillId, { transaction });
    await record.destroy({ transaction });
    return { success: true };
  });
}

async function resolveCredentialForActor(actorId, credentialId, { transaction } = {}) {
  const profile = await requireAgencyActor(actorId);
  const record = await AgencyProfileCredential.findOne({
    where: { id: credentialId, agencyProfileId: profile.id },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!record) {
    throw new NotFoundError('Credential not found.');
  }
  return { profile, record };
}

export async function createAgencyProfileCredential(actorId, payload) {
  const profile = await requireAgencyActor(actorId);
  const sanitized = sanitizeCredentialPayload(payload);
  if (!sanitized.title) {
    throw new ValidationError('A credential title is required.', { field: 'title' });
  }
  const type = sanitized.type ?? 'qualification';
  if (!CREDENTIAL_TYPES.has(type)) {
    throw new ValidationError('Unsupported credential type.', { field: 'type' });
  }

  return sequelize.transaction(async (transaction) => {
    const record = await AgencyProfileCredential.create(
      {
        agencyProfileId: profile.id,
        ...sanitized,
        type,
      },
      { transaction },
    );
    return serializeCredential(record);
  });
}

export async function updateAgencyProfileCredential(actorId, credentialId, payload) {
  return sequelize.transaction(async (transaction) => {
    const { record } = await resolveCredentialForActor(actorId, credentialId, { transaction });
    const updates = sanitizeCredentialPayload(payload);
    if (updates.type && CREDENTIAL_TYPES.has(updates.type)) {
      record.type = updates.type;
    }
    if (updates.title) {
      record.title = updates.title;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'issuer')) {
      record.issuer = updates.issuer;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'issuedAt')) {
      record.issuedAt = updates.issuedAt;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'expiresAt')) {
      record.expiresAt = updates.expiresAt;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'credentialUrl')) {
      record.credentialUrl = updates.credentialUrl;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'description')) {
      record.description = updates.description;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'referenceId')) {
      record.referenceId = updates.referenceId;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'verificationStatus')) {
      record.verificationStatus = updates.verificationStatus;
    }
    await record.save({ transaction });
    await record.reload({ transaction });
    return serializeCredential(record);
  });
}

export async function deleteAgencyProfileCredential(actorId, credentialId) {
  return sequelize.transaction(async (transaction) => {
    const { record } = await resolveCredentialForActor(actorId, credentialId, { transaction });
    await record.destroy({ transaction });
    return { success: true };
  });
}

async function resolveExperienceForActor(actorId, experienceId, { transaction } = {}) {
  const profile = await requireAgencyActor(actorId);
  const record = await AgencyProfileExperience.findOne({
    where: { id: experienceId, agencyProfileId: profile.id },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!record) {
    throw new NotFoundError('Experience entry not found.');
  }
  return { profile, record };
}

export async function createAgencyProfileExperience(actorId, payload) {
  const profile = await requireAgencyActor(actorId);
  const sanitized = sanitizeExperiencePayload(payload);
  if (!sanitized.title) {
    throw new ValidationError('An experience title is required.', { field: 'title' });
  }

  if (sanitized.startDate && sanitized.endDate && sanitized.startDate > sanitized.endDate) {
    throw new ValidationError('End date must be on or after the start date.', { field: 'endDate' });
  }

  return sequelize.transaction(async (transaction) => {
    const resolvedPosition =
      sanitized.position != null
        ? Number(sanitized.position)
        : (await AgencyProfileExperience.max('position', {
            where: { agencyProfileId: profile.id },
            transaction,
          })) + 1 || 0;

    const record = await AgencyProfileExperience.create(
      {
        agencyProfileId: profile.id,
        ...sanitized,
        position: Number.isFinite(resolvedPosition) ? resolvedPosition : 0,
      },
      { transaction },
    );
    return serializeExperience(record);
  });
}

export async function updateAgencyProfileExperience(actorId, experienceId, payload) {
  return sequelize.transaction(async (transaction) => {
    const { record } = await resolveExperienceForActor(actorId, experienceId, { transaction });
    const updates = sanitizeExperiencePayload(payload);
    if (updates.title) {
      record.title = updates.title;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'client')) {
      record.client = updates.client;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'summary')) {
      record.summary = updates.summary;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'startDate')) {
      record.startDate = updates.startDate;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'endDate')) {
      record.endDate = updates.endDate;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'isCurrent')) {
      record.isCurrent = Boolean(updates.isCurrent);
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'impact')) {
      record.impact = updates.impact;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'heroImageUrl')) {
      record.heroImageUrl = updates.heroImageUrl;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'tags')) {
      record.tags = Array.isArray(updates.tags) ? updates.tags : null;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'position') && updates.position != null) {
      record.position = Number(updates.position);
    }

    if (record.startDate && record.endDate && record.startDate > record.endDate) {
      throw new ValidationError('End date must be on or after the start date.', { field: 'endDate' });
    }

    await record.save({ transaction });
    await record.reload({ transaction });
    return serializeExperience(record);
  });
}

export async function deleteAgencyProfileExperience(actorId, experienceId) {
  return sequelize.transaction(async (transaction) => {
    const { record } = await resolveExperienceForActor(actorId, experienceId, { transaction });
    await record.destroy({ transaction });
    return { success: true };
  });
}

async function resolveWorkforceSegment(actorId, segmentId, { transaction } = {}) {
  const profile = await requireAgencyActor(actorId);
  const record = await AgencyProfileWorkforceSegment.findOne({
    where: { id: segmentId, agencyProfileId: profile.id },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!record) {
    throw new NotFoundError('Workforce segment not found.');
  }
  return { profile, record };
}

export async function createAgencyProfileWorkforceSegment(actorId, payload) {
  const profile = await requireAgencyActor(actorId);
  const sanitized = sanitizeWorkforcePayload(payload);
  if (!sanitized.segmentName) {
    throw new ValidationError('Segment name is required.', { field: 'segmentName' });
  }

  return sequelize.transaction(async (transaction) => {
    const resolvedPosition =
      sanitized.position != null
        ? Number(sanitized.position)
        : (await AgencyProfileWorkforceSegment.max('position', {
            where: { agencyProfileId: profile.id },
            transaction,
          })) + 1 || 0;

    const record = await AgencyProfileWorkforceSegment.create(
      {
        agencyProfileId: profile.id,
        ...sanitized,
        position: Number.isFinite(resolvedPosition) ? resolvedPosition : 0,
      },
      { transaction },
    );
    return serializeWorkforceSegment(record);
  });
}

export async function updateAgencyProfileWorkforceSegment(actorId, segmentId, payload) {
  return sequelize.transaction(async (transaction) => {
    const { record } = await resolveWorkforceSegment(actorId, segmentId, { transaction });
    const updates = sanitizeWorkforcePayload(payload);
    if (updates.segmentName) {
      record.segmentName = updates.segmentName;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'specialization')) {
      record.specialization = updates.specialization;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'availableCount')) {
      record.availableCount = updates.availableCount;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'totalCount')) {
      record.totalCount = updates.totalCount;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'deliveryModel')) {
      record.deliveryModel = updates.deliveryModel;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'location')) {
      record.location = updates.location;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'availabilityNotes')) {
      record.availabilityNotes = updates.availabilityNotes;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'averageBillRate')) {
      record.averageBillRate = updates.averageBillRate;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'currency')) {
      record.currency = updates.currency;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'leadTimeDays')) {
      record.leadTimeDays = updates.leadTimeDays;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'metadata')) {
      record.metadata = updates.metadata;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'position') && updates.position != null) {
      record.position = Number(updates.position);
    }
    await record.save({ transaction });
    await record.reload({ transaction });
    return serializeWorkforceSegment(record);
  });
}

export async function deleteAgencyProfileWorkforceSegment(actorId, segmentId) {
  return sequelize.transaction(async (transaction) => {
    const { record } = await resolveWorkforceSegment(actorId, segmentId, { transaction });
    await record.destroy({ transaction });
    return { success: true };
  });
}

export default {
  getAgencyProfileManagement,
  updateAgencyProfileBasics,
  createAgencyProfileMedia,
  updateAgencyProfileMedia,
  deleteAgencyProfileMedia,
  createAgencyProfileSkill,
  updateAgencyProfileSkill,
  deleteAgencyProfileSkill,
  createAgencyProfileCredential,
  updateAgencyProfileCredential,
  deleteAgencyProfileCredential,
  createAgencyProfileExperience,
  updateAgencyProfileExperience,
  deleteAgencyProfileExperience,
  createAgencyProfileWorkforceSegment,
  updateAgencyProfileWorkforceSegment,
  deleteAgencyProfileWorkforceSegment,
};
