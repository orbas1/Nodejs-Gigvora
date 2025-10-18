import crypto from 'crypto';
import { Op } from 'sequelize';
import {
  sequelize,
  User,
  Profile,
  ProfileReference,
  ProfileAdminNote,
} from '../models/index.js';
import { getAuthDomainService } from '../domains/serviceCatalog.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { normalizeLocationPayload } from '../utils/location.js';

const authDomainService = getAuthDomainService();

function toPlain(instance) {
  return instance?.get?.({ plain: true }) ?? instance ?? null;
}

function normalizeString(value) {
  if (value == null) return null;
  return `${value}`.trim();
}

function normalizeSlug(value) {
  const trimmed = normalizeString(value);
  if (!trimmed) return null;
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function normalizeMemberships(memberships) {
  if (!Array.isArray(memberships)) {
    return undefined;
  }
  const normalized = memberships
    .map((entry) => normalizeSlug(entry))
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

function sanitizeUser(userInstance) {
  if (!userInstance) {
    return null;
  }
  return authDomainService.sanitizeUser(userInstance);
}

function sanitizeProfile(profileInstance) {
  if (!profileInstance) {
    return null;
  }
  const plain = toPlain(profileInstance);
  return {
    id: plain.id,
    userId: plain.userId,
    headline: plain.headline ?? null,
    bio: plain.bio ?? null,
    missionStatement: plain.missionStatement ?? null,
    skills: plain.skills ?? null,
    experience: plain.experience ?? null,
    education: plain.education ?? null,
    location: plain.location ?? null,
    timezone: plain.timezone ?? null,
    availabilityStatus: plain.availabilityStatus ?? 'limited',
    availableHoursPerWeek: plain.availableHoursPerWeek ?? null,
    openToRemote: plain.openToRemote !== false,
    availabilityNotes: plain.availabilityNotes ?? null,
    availabilityUpdatedAt: plain.availabilityUpdatedAt
      ? new Date(plain.availabilityUpdatedAt).toISOString()
      : null,
    trustScore: plain.trustScore != null ? Number(plain.trustScore) : null,
    likesCount: Number(plain.likesCount ?? 0),
    followersCount: Number(plain.followersCount ?? 0),
    profileCompletion: plain.profileCompletion != null ? Number(plain.profileCompletion) : null,
    profileVisibility: plain.profileVisibility ?? 'members',
    networkVisibility: plain.networkVisibility ?? 'connections',
    followersVisibility: plain.followersVisibility ?? 'connections',
    socialLinks: plain.socialLinks ?? null,
    portfolioLinks: plain.portfolioLinks ?? null,
    areasOfFocus: plain.areasOfFocus ?? null,
    qualifications: plain.qualifications ?? null,
    impactHighlights: plain.impactHighlights ?? null,
    collaborationRoster: plain.collaborationRoster ?? null,
    preferredEngagements: plain.preferredEngagements ?? null,
    avatarUrl: plain.avatarUrl ?? null,
    avatarSeed: plain.avatarSeed ?? null,
    avatarUpdatedAt: plain.avatarUpdatedAt ? new Date(plain.avatarUpdatedAt).toISOString() : null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

function sanitizeReference(referenceInstance) {
  if (!referenceInstance) {
    return null;
  }
  const plain = toPlain(referenceInstance);
  return {
    id: plain.id,
    profileId: plain.profileId,
    referenceName: plain.referenceName,
    relationship: plain.relationship ?? null,
    company: plain.company ?? null,
    email: plain.email ?? null,
    phone: plain.phone ?? null,
    endorsement: plain.endorsement ?? null,
    isVerified: Boolean(plain.isVerified),
    weight: plain.weight != null ? Number(plain.weight) : null,
    lastInteractedAt: plain.lastInteractedAt ? new Date(plain.lastInteractedAt).toISOString() : null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

function sanitizeNote(noteInstance) {
  if (!noteInstance) {
    return null;
  }
  const plain = toPlain(noteInstance);
  return {
    id: plain.id,
    profileId: plain.profileId,
    authorId: plain.authorId ?? null,
    visibility: plain.visibility ?? 'internal',
    pinned: Boolean(plain.pinned),
    body: plain.body,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
    author: plain.author
      ? {
          id: plain.author.id,
          firstName: plain.author.firstName ?? null,
          lastName: plain.author.lastName ?? null,
          email: plain.author.email ?? null,
          userType: plain.author.userType ?? null,
        }
      : null,
  };
}

function buildListOrder(sortBy = 'recent', sortDirection = 'desc') {
  const direction = `${sortDirection}`.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  switch (sortBy) {
    case 'name':
      return [
        [User, 'lastName', 'ASC'],
        [User, 'firstName', 'ASC'],
      ];
    case 'trust':
      return [
        ['trustScore', direction],
        ['updatedAt', 'DESC'],
      ];
    case 'completion':
      return [
        ['profileCompletion', direction],
        ['updatedAt', 'DESC'],
      ];
    case 'recent':
    default:
      return [['updatedAt', 'DESC']];
  }
}

function normalizeRangeFilter(value, { min = 0, max = 100 } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.min(max, Math.max(min, numeric));
}

function applyRange(where, key, minValue, maxValue) {
  const range = {};
  if (minValue != null) {
    range[Op.gte] = minValue;
  }
  if (maxValue != null) {
    range[Op.lte] = maxValue;
  }
  if (Object.keys(range).length > 0) {
    if (!where[key]) {
      where[key] = range;
    } else {
      where[key] = { ...where[key], ...range };
    }
  }
}

async function ensureUniqueEmail(email, { transaction, excludeUserId } = {}) {
  const normalizedEmail = normalizeString(email)?.toLowerCase();
  if (!normalizedEmail) {
    throw new ValidationError('A valid email address is required.');
  }
  const existing = await User.findOne({
    where: {
      email: { [Op.eq]: normalizedEmail },
      ...(excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {}),
    },
    transaction,
  });
  if (existing) {
    throw new ValidationError('Another account already uses this email address.');
  }
  return normalizedEmail;
}

function buildLocationUpdates(payload = {}) {
  const locationPayload = normalizeLocationPayload({
    location: payload.location ?? payload.address,
    geoLocation: payload.geoLocation,
  });
  const updates = {};
  if (locationPayload.location !== undefined) {
    updates.location = locationPayload.location;
  }
  if (locationPayload.geoLocation !== undefined) {
    updates.geoLocation = locationPayload.geoLocation;
  }
  return updates;
}

function sanitizeListProfile(row) {
  const plain = toPlain(row);
  const user = sanitizeUser(plain.User ?? plain.user);
  const profile = sanitizeProfile(plain);
  return {
    id: plain.id,
    user,
    headline: profile?.headline ?? null,
    location: profile?.location ?? user?.location ?? null,
    availabilityStatus: profile?.availabilityStatus ?? 'limited',
    trustScore: profile?.trustScore,
    profileCompletion: profile?.profileCompletion,
    avatarUrl: profile?.avatarUrl ?? null,
    createdAt: profile?.createdAt,
    updatedAt: profile?.updatedAt,
    referencesCount: Array.isArray(plain.references) ? plain.references.length : 0,
    pinnedNotes: Array.isArray(plain.adminNotes)
      ? plain.adminNotes.filter((note) => note?.pinned).length
      : 0,
    lastNoteAt: Array.isArray(plain.adminNotes) && plain.adminNotes.length
      ? new Date(plain.adminNotes[0].createdAt).toISOString()
      : null,
  };
}

function sanitizeDetailedProfile(profileInstance) {
  const plain = profileInstance.get({ plain: true });
  const profile = sanitizeProfile(plain);
  const user = sanitizeUser(plain.User ?? plain.user);
  const references = Array.isArray(plain.references)
    ? plain.references.map((reference) => sanitizeReference(reference)).filter(Boolean)
    : [];
  const notes = Array.isArray(plain.adminNotes)
    ? plain.adminNotes.map((note) => sanitizeNote(note)).filter(Boolean)
    : [];
  return {
    id: plain.id,
    user,
    profile,
    references,
    notes,
    metrics: {
      trustScore: profile?.trustScore,
      profileCompletion: profile?.profileCompletion,
      likesCount: profile?.likesCount,
      followersCount: profile?.followersCount,
      references: references.length,
      notes: notes.length,
    },
  };
}

export async function listProfiles(
  {
    page = 1,
    pageSize = 20,
    search,
    availability,
    visibility,
    networkVisibility,
    followersVisibility,
    userType,
    membership,
    memberships,
    trustMin,
    trustMax,
    completionMin,
    completionMax,
    hasAvatar,
    sortBy = 'recent',
    sortDirection = 'desc',
  } = {},
) {
  const parsedPageSize = Math.min(100, Math.max(1, Number.parseInt(pageSize, 10) || 20));
  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const offset = (parsedPage - 1) * parsedPageSize;

  const where = {};
  if (availability) {
    where.availabilityStatus = availability;
  }
  if (visibility) {
    where.profileVisibility = visibility;
  }
  if (networkVisibility) {
    where.networkVisibility = networkVisibility;
  }
  if (followersVisibility) {
    where.followersVisibility = followersVisibility;
  }
  if (hasAvatar === true) {
    where.avatarUrl = { [Op.ne]: null };
  } else if (hasAvatar === false) {
    where.avatarUrl = { [Op.is]: null };
  }

  const trustMinValue = normalizeRangeFilter(trustMin, { min: 0, max: 100 });
  const trustMaxValue = normalizeRangeFilter(trustMax, { min: 0, max: 100 });
  applyRange(where, 'trustScore', trustMinValue, trustMaxValue);

  const completionMinValue = normalizeRangeFilter(completionMin, { min: 0, max: 100 });
  const completionMaxValue = normalizeRangeFilter(completionMax, { min: 0, max: 100 });
  applyRange(where, 'profileCompletion', completionMinValue, completionMaxValue);

  const userWhere = {};
  const trimmedSearch = normalizeString(search);
  if (trimmedSearch) {
    const like = `%${trimmedSearch}%`;
    userWhere[Op.or] = [
      { firstName: { [Op.iLike ?? Op.like]: like } },
      { lastName: { [Op.iLike ?? Op.like]: like } },
      { email: { [Op.iLike ?? Op.like]: like } },
    ];
    where[Op.or] = [
      { headline: { [Op.iLike ?? Op.like]: like } },
      { bio: { [Op.iLike ?? Op.like]: like } },
      { missionStatement: { [Op.iLike ?? Op.like]: like } },
    ];
  }
  if (userType) {
    userWhere.userType = userType;
  }

  const include = [
    {
      model: User,
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email',
        'userType',
        'memberships',
        'primaryDashboard',
        'location',
        'geoLocation',
        'twoFactorEnabled',
        'twoFactorMethod',
      ],
      where: Object.keys(userWhere).length ? userWhere : undefined,
    },
    {
      model: ProfileReference,
      as: 'references',
      attributes: ['id'],
      required: false,
    },
    {
      model: ProfileAdminNote,
      as: 'adminNotes',
      attributes: ['id', 'pinned', 'createdAt'],
      required: false,
      separate: false,
    },
  ];

  const order = buildListOrder(sortBy, sortDirection);

  const result = await Profile.findAndCountAll({
    where,
    include,
    order,
    offset,
    limit: parsedPageSize,
    distinct: true,
  });

  const membershipFilters = normalizeMemberships(
    memberships ?? (membership ? [membership] : undefined),
  );

  const filteredRows = membershipFilters && membershipFilters.length
    ? result.rows.filter((row) => {
        const userMemberships = new Set(
          Array.isArray(row?.User?.memberships) ? row.User.memberships.map(normalizeSlug).filter(Boolean) : [],
        );
        return membershipFilters.every((item) => userMemberships.has(item));
      })
    : result.rows;

  const total = membershipFilters && membershipFilters.length ? filteredRows.length : result.count;
  const paginatedRows = membershipFilters && membershipFilters.length
    ? filteredRows.slice(0, parsedPageSize)
    : filteredRows;

  return {
    results: paginatedRows.map((row) => sanitizeListProfile(row)),
    pagination: {
      page: parsedPage,
      pageSize: parsedPageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / parsedPageSize)),
    },
  };
}

export async function getProfile(profileId) {
  const id = Number.parseInt(profileId, 10);
  if (!Number.isInteger(id)) {
    throw new ValidationError('A valid profile identifier is required.');
  }

  const profile = await Profile.findByPk(id, {
    include: [
      {
        model: User,
        attributes: [
          'id',
          'firstName',
          'lastName',
          'email',
          'userType',
          'memberships',
          'primaryDashboard',
          'location',
          'geoLocation',
          'twoFactorEnabled',
          'twoFactorMethod',
          'lastLoginAt',
        ],
      },
      {
        model: ProfileReference,
        as: 'references',
      },
      {
        model: ProfileAdminNote,
        as: 'adminNotes',
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
          },
        ],
        order: [
          ['pinned', 'DESC'],
          ['createdAt', 'DESC'],
        ],
      },
    ],
  });

  if (!profile) {
    throw new NotFoundError('Profile not found.');
  }

  return sanitizeDetailedProfile(profile);
}

export async function createProfile(payload = {}, actor = {}) {
  const userPayload = payload.user ?? {};
  const profilePayload = payload.profile ?? {};

  const firstName = normalizeString(userPayload.firstName);
  const lastName = normalizeString(userPayload.lastName);
  const email = normalizeString(userPayload.email)?.toLowerCase();

  if (!firstName || !lastName) {
    throw new ValidationError('First and last name are required.');
  }
  if (!email) {
    throw new ValidationError('Email is required.');
  }

  const memberships = normalizeMemberships(userPayload.memberships) ?? [];
  const userType = normalizeString(userPayload.userType) ?? 'user';
  const primaryDashboard = normalizeString(userPayload.primaryDashboard) ?? null;
  const twoFactorEnabled = userPayload.twoFactorEnabled !== false;
  const twoFactorMethod = normalizeString(userPayload.twoFactorMethod) ?? 'email';

  const password = normalizeString(userPayload.password) || crypto.randomBytes(12).toString('hex');

  return sequelize.transaction(async (transaction) => {
    const sanitizedEmail = await ensureUniqueEmail(email, { transaction });
    const registered = await authDomainService.registerUser(
      {
        email: sanitizedEmail,
        password,
        firstName,
        lastName,
        location: userPayload.location,
        geoLocation: userPayload.geoLocation,
        userType,
        twoFactorEnabled,
        twoFactorMethod,
      },
      { transaction },
    );

    await User.update(
      {
        memberships: memberships && memberships.length ? memberships : [userType],
        primaryDashboard: primaryDashboard ?? userType,
      },
      { where: { id: registered.id }, transaction },
    );

    const profile = await Profile.create(
      {
        userId: registered.id,
        headline: profilePayload.headline ?? null,
        bio: profilePayload.bio ?? null,
        missionStatement: profilePayload.missionStatement ?? null,
        location: profilePayload.location ?? userPayload.location ?? null,
        timezone: profilePayload.timezone ?? null,
        availabilityStatus: profilePayload.availabilityStatus ?? 'limited',
        availableHoursPerWeek: profilePayload.availableHoursPerWeek ?? null,
        openToRemote: profilePayload.openToRemote !== false,
        availabilityNotes: profilePayload.availabilityNotes ?? null,
        profileVisibility: profilePayload.profileVisibility ?? 'members',
        networkVisibility: profilePayload.networkVisibility ?? 'connections',
        followersVisibility: profilePayload.followersVisibility ?? 'connections',
        avatarUrl: profilePayload.avatarUrl ?? null,
        areasOfFocus: profilePayload.areasOfFocus ?? null,
        socialLinks: profilePayload.socialLinks ?? null,
        profileCompletion: profilePayload.profileCompletion ?? null,
        trustScore: profilePayload.trustScore ?? null,
      },
      { transaction },
    );

    if (payload.notes && payload.notes.body) {
      await ProfileAdminNote.create(
        {
          profileId: profile.id,
          authorId: actor?.id ?? null,
          body: payload.notes.body,
          visibility: payload.notes.visibility ?? 'internal',
          pinned: Boolean(payload.notes.pinned),
        },
        { transaction },
      );
    }

    const reloaded = await Profile.findByPk(profile.id, {
      include: [
        { model: User },
        { model: ProfileReference, as: 'references' },
        {
          model: ProfileAdminNote,
          as: 'adminNotes',
          include: [{ model: User, as: 'author' }],
        },
      ],
      transaction,
    });

    return sanitizeDetailedProfile(reloaded);
  });
}

export async function updateProfile(profileId, payload = {}, actor = {}) {
  const id = Number.parseInt(profileId, 10);
  if (!Number.isInteger(id)) {
    throw new ValidationError('A valid profile identifier is required.');
  }

  const profile = await Profile.findByPk(id, {
    include: [{ model: User }],
  });

  if (!profile) {
    throw new NotFoundError('Profile not found.');
  }

  return sequelize.transaction(async (transaction) => {
    const user = profile.User;
    const userUpdates = {};
    const profileUpdates = {};

    if (payload.user) {
      const firstName = normalizeString(payload.user.firstName);
      const lastName = normalizeString(payload.user.lastName);
      if (firstName) userUpdates.firstName = firstName;
      if (lastName) userUpdates.lastName = lastName;

      if (payload.user.email) {
        const normalizedEmail = await ensureUniqueEmail(payload.user.email, {
          transaction,
          excludeUserId: user.id,
        });
        userUpdates.email = normalizedEmail;
      }

      if (payload.user.userType) {
        userUpdates.userType = normalizeString(payload.user.userType);
      }

      if (payload.user.twoFactorEnabled !== undefined) {
        userUpdates.twoFactorEnabled = Boolean(payload.user.twoFactorEnabled);
      }

      if (payload.user.twoFactorMethod) {
        const allowedMethods = new Set(['email', 'app', 'sms']);
        const normalizedMethod = normalizeString(payload.user.twoFactorMethod)?.toLowerCase();
        if (normalizedMethod && allowedMethods.has(normalizedMethod)) {
          userUpdates.twoFactorMethod = normalizedMethod;
        }
      }

      const memberships = normalizeMemberships(payload.user.memberships);
      if (memberships) {
        userUpdates.memberships = memberships;
      }

      if (payload.user.primaryDashboard !== undefined) {
        userUpdates.primaryDashboard = normalizeString(payload.user.primaryDashboard);
      }

      Object.assign(userUpdates, buildLocationUpdates(payload.user));
    }

    if (payload.profile) {
      const fields = [
        'headline',
        'bio',
        'missionStatement',
        'skills',
        'experience',
        'education',
        'location',
        'timezone',
        'availabilityStatus',
        'availableHoursPerWeek',
        'openToRemote',
        'availabilityNotes',
        'profileVisibility',
        'networkVisibility',
        'followersVisibility',
        'avatarUrl',
        'avatarSeed',
        'areasOfFocus',
        'socialLinks',
        'portfolioLinks',
        'qualifications',
        'preferredEngagements',
        'collaborationRoster',
        'impactHighlights',
      ];
      fields.forEach((field) => {
        if (payload.profile[field] !== undefined) {
          profileUpdates[field] = payload.profile[field];
        }
      });

      if (payload.profile.trustScore !== undefined) {
        const score = Number(payload.profile.trustScore);
        if (Number.isFinite(score)) {
          profileUpdates.trustScore = score;
        }
      }

      if (payload.profile.profileCompletion !== undefined) {
        const completion = Number(payload.profile.profileCompletion);
        if (Number.isFinite(completion)) {
          profileUpdates.profileCompletion = completion;
        }
      }

      if (payload.profile.likesCount !== undefined) {
        const likes = Number(payload.profile.likesCount);
        if (Number.isFinite(likes)) {
          profileUpdates.likesCount = likes;
        }
      }

      if (payload.profile.followersCount !== undefined) {
        const followers = Number(payload.profile.followersCount);
        if (Number.isFinite(followers)) {
          profileUpdates.followersCount = followers;
        }
      }

      if (
        payload.profile.availabilityStatus &&
        payload.profile.availabilityStatus !== profile.availabilityStatus
      ) {
        profileUpdates.availabilityUpdatedAt = new Date();
      }

      Object.assign(profileUpdates, buildLocationUpdates(payload.profile));
    }

    if (Object.keys(userUpdates).length) {
      if (userUpdates.memberships && userUpdates.userType && !userUpdates.memberships.includes(userUpdates.userType)) {
        userUpdates.memberships.push(userUpdates.userType);
      }
      await user.update(userUpdates, { transaction });
    }

    if (Object.keys(profileUpdates).length) {
      await profile.update(profileUpdates, { transaction });
    }

    const reloaded = await Profile.findByPk(profile.id, {
      include: [
        { model: User },
        { model: ProfileReference, as: 'references' },
        {
          model: ProfileAdminNote,
          as: 'adminNotes',
          include: [{ model: User, as: 'author' }],
        },
      ],
      transaction,
    });

    return sanitizeDetailedProfile(reloaded);
  });
}

export async function createReference(profileId, payload = {}, actor = {}) {
  const id = Number.parseInt(profileId, 10);
  if (!Number.isInteger(id)) {
    throw new ValidationError('A valid profile identifier is required.');
  }
  const profile = await Profile.findByPk(id);
  if (!profile) {
    throw new NotFoundError('Profile not found.');
  }
  if (!payload.referenceName) {
    throw new ValidationError('Reference name is required.');
  }
  const reference = await ProfileReference.create({
    profileId: id,
    referenceName: payload.referenceName,
    relationship: payload.relationship ?? null,
    company: payload.company ?? null,
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    endorsement: payload.endorsement ?? null,
    isVerified: Boolean(payload.isVerified),
    weight: payload.weight != null ? Number(payload.weight) : null,
    lastInteractedAt: payload.lastInteractedAt ? new Date(payload.lastInteractedAt) : null,
  });
  return sanitizeReference(reference);
}

export async function updateReference(profileId, referenceId, payload = {}) {
  const profileNumericId = Number.parseInt(profileId, 10);
  const referenceNumericId = Number.parseInt(referenceId, 10);
  if (!Number.isInteger(profileNumericId) || !Number.isInteger(referenceNumericId)) {
    throw new ValidationError('A valid profile and reference identifier are required.');
  }

  const reference = await ProfileReference.findOne({
    where: { id: referenceNumericId, profileId: profileNumericId },
  });

  if (!reference) {
    throw new NotFoundError('Reference not found.');
  }

  const updates = {};
  const fields = [
    'referenceName',
    'relationship',
    'company',
    'email',
    'phone',
    'endorsement',
  ];
  fields.forEach((field) => {
    if (payload[field] !== undefined) {
      updates[field] = payload[field];
    }
  });
  if (payload.isVerified !== undefined) {
    updates.isVerified = Boolean(payload.isVerified);
  }
  if (payload.weight !== undefined) {
    const weight = Number(payload.weight);
    if (Number.isFinite(weight)) {
      updates.weight = weight;
    }
  }
  if (payload.lastInteractedAt !== undefined) {
    updates.lastInteractedAt = payload.lastInteractedAt ? new Date(payload.lastInteractedAt) : null;
  }

  await reference.update(updates);
  return sanitizeReference(reference);
}

export async function deleteReference(profileId, referenceId) {
  const profileNumericId = Number.parseInt(profileId, 10);
  const referenceNumericId = Number.parseInt(referenceId, 10);
  if (!Number.isInteger(profileNumericId) || !Number.isInteger(referenceNumericId)) {
    throw new ValidationError('A valid profile and reference identifier are required.');
  }
  const deleted = await ProfileReference.destroy({
    where: { id: referenceNumericId, profileId: profileNumericId },
  });
  if (!deleted) {
    throw new NotFoundError('Reference not found.');
  }
  return { success: true };
}

export async function createNote(profileId, payload = {}, actor = {}) {
  const id = Number.parseInt(profileId, 10);
  if (!Number.isInteger(id)) {
    throw new ValidationError('A valid profile identifier is required.');
  }
  const profile = await Profile.findByPk(id);
  if (!profile) {
    throw new NotFoundError('Profile not found.');
  }
  const body = normalizeString(payload.body);
  if (!body) {
    throw new ValidationError('Note body is required.');
  }
  const note = await ProfileAdminNote.create({
    profileId: id,
    authorId: actor?.id ?? null,
    body,
    pinned: Boolean(payload.pinned),
    visibility: payload.visibility ?? 'internal',
    metadata: payload.metadata ?? null,
  });
  const withAuthor = await ProfileAdminNote.findByPk(note.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] }],
  });
  return sanitizeNote(withAuthor ?? note);
}

export async function updateNote(profileId, noteId, payload = {}, actor = {}) {
  const profileNumericId = Number.parseInt(profileId, 10);
  const noteNumericId = Number.parseInt(noteId, 10);
  if (!Number.isInteger(profileNumericId) || !Number.isInteger(noteNumericId)) {
    throw new ValidationError('A valid profile and note identifier are required.');
  }
  const note = await ProfileAdminNote.findOne({
    where: { id: noteNumericId, profileId: profileNumericId },
  });
  if (!note) {
    throw new NotFoundError('Note not found.');
  }
  const updates = {};
  if (payload.body !== undefined) {
    const body = normalizeString(payload.body);
    if (!body) {
      throw new ValidationError('Note body cannot be empty.');
    }
    updates.body = body;
  }
  if (payload.visibility !== undefined) {
    updates.visibility = payload.visibility;
  }
  if (payload.pinned !== undefined) {
    updates.pinned = Boolean(payload.pinned);
  }
  if (payload.metadata !== undefined) {
    updates.metadata = payload.metadata;
  }
  if (Object.keys(updates).length === 0) {
    return sanitizeNote(note);
  }
  await note.update(updates);
  const withAuthor = await ProfileAdminNote.findByPk(note.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] }],
  });
  return sanitizeNote(withAuthor ?? note);
}

export async function deleteNote(profileId, noteId) {
  const profileNumericId = Number.parseInt(profileId, 10);
  const noteNumericId = Number.parseInt(noteId, 10);
  if (!Number.isInteger(profileNumericId) || !Number.isInteger(noteNumericId)) {
    throw new ValidationError('A valid profile and note identifier are required.');
  }
  const deleted = await ProfileAdminNote.destroy({ where: { id: noteNumericId, profileId: profileNumericId } });
  if (!deleted) {
    throw new NotFoundError('Note not found.');
  }
  return { success: true };
}

export default {
  listProfiles,
  getProfile,
  createProfile,
  updateProfile,
  createReference,
  updateReference,
  deleteReference,
  createNote,
  updateNote,
  deleteNote,
};
