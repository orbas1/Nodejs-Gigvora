import { Op, fn, col, literal } from 'sequelize';

import {
  AgencyProfile,
  Profile,
  User,
} from '../models/index.js';
import sequelize from '../models/sequelizeClient.js';
import { getAuthDomainService } from '../domains/serviceCatalog.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const authDomainService = getAuthDomainService();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const SORT_MAP = new Map([
  ['created_desc', [['createdAt', 'DESC']]],
  ['created_asc', [['createdAt', 'ASC']]],
  ['name_asc', [['agencyName', 'ASC']]],
  ['name_desc', [['agencyName', 'DESC']]],
]);

const INCLUDE_DEFINITION = [
  {
    model: User,
    attributes: [
      'id',
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'status',
      'memberships',
      'primaryDashboard',
      'createdAt',
      'updatedAt',
    ],
    include: [
      {
        model: Profile,
        attributes: ['headline', 'missionStatement', 'location', 'timezone'],
        required: false,
      },
    ],
    required: true,
  },
];

function normaliseLimit(value) {
  const parsed = Number.parseInt(value ?? `${DEFAULT_LIMIT}`, 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

function normaliseOffset(value) {
  const parsed = Number.parseInt(value ?? '0', 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function resolveSort(sort) {
  if (typeof sort !== 'string') {
    return SORT_MAP.get('created_desc');
  }
  const key = sort.trim().toLowerCase();
  return SORT_MAP.get(key) ?? SORT_MAP.get('created_desc');
}

function normaliseStringArray(value) {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    const items = value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : `${entry ?? ''}`.trim()))
      .filter(Boolean);
    return items.length ? items : [];
  }
  if (typeof value === 'string') {
    const items = value
      .split(/[,\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    return items.length ? items : [];
  }
  return null;
}

function normaliseSocialLinks(value) {
  if (!value) {
    return null;
  }
  const items = Array.isArray(value) ? value : [];
  const normalised = items
    .map((entry) => {
      if (!entry) {
        return null;
      }
      if (typeof entry === 'string') {
        const trimmed = entry.trim();
        if (!trimmed) {
          return null;
        }
        return { label: trimmed, url: trimmed };
      }
      const label = typeof entry.label === 'string' ? entry.label.trim() : '';
      const url = typeof entry.url === 'string' ? entry.url.trim() : '';
      if (!label && !url) {
        return null;
      }
      return {
        label: label || url,
        url: url || label,
      };
    })
    .filter(Boolean);
  return normalised.length ? normalised : [];
}

function coerceNumeric(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric;
}

function normaliseStatus(value) {
  if (!value) {
    return undefined;
  }
  const normalised = `${value}`.trim().toLowerCase();
  if (!['invited', 'active', 'suspended', 'archived'].includes(normalised)) {
    throw new ValidationError('Invalid agency status supplied.');
  }
  return normalised;
}

function uniqueMemberships(existingMemberships = [], membershipToEnsure) {
  const values = Array.isArray(existingMemberships) ? existingMemberships : [];
  const set = new Set(values.filter(Boolean).map((entry) => `${entry}`.trim()));
  if (membershipToEnsure) {
    set.add(membershipToEnsure);
  }
  return Array.from(set);
}

function sanitizeAgencyRecord(instance) {
  if (!instance) {
    return null;
  }
  const plain = instance.get({ plain: true });
  const user = plain.User ?? {};
  const profile = user.Profile ?? {};

  const teamSize = coerceNumeric(plain.teamSize);
  const foundedYear = coerceNumeric(plain.foundedYear);
  const workforceAvailable = coerceNumeric(plain.workforceAvailable);

  return {
    id: plain.id,
    userId: plain.userId,
    agencyName: plain.agencyName,
    focusArea: plain.focusArea ?? null,
    website: plain.website ?? null,
    location: plain.location ?? profile.location ?? null,
    tagline: plain.tagline ?? null,
    summary: plain.summary ?? null,
    services: Array.isArray(plain.services) ? plain.services : [],
    industries: Array.isArray(plain.industries) ? plain.industries : [],
    clients: Array.isArray(plain.clients) ? plain.clients : [],
    awards: Array.isArray(plain.awards) ? plain.awards : [],
    socialLinks: Array.isArray(plain.socialLinks) ? plain.socialLinks : [],
    teamSize,
    foundedYear,
    workforceAvailable,
    workforceNotes: plain.workforceNotes ?? null,
    introVideoUrl: plain.introVideoUrl ?? null,
    bannerUrl: plain.bannerUrl ?? plain.bannerImageUrl ?? null,
    avatarUrl: plain.avatarUrl ?? plain.profileImageUrl ?? null,
    autoAcceptFollowers: plain.autoAcceptFollowers !== false,
    defaultConnectionMessage: plain.defaultConnectionMessage ?? null,
    followerPolicy: plain.followerPolicy ?? 'open',
    connectionPolicy: plain.connectionPolicy ?? 'open',
    primaryContact: {
      name: plain.primaryContactName ?? null,
      email: plain.primaryContactEmail ?? user.email ?? null,
      phone: plain.primaryContactPhone ?? user.phoneNumber ?? null,
    },
    owner: {
      id: user.id ?? null,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      phoneNumber: user.phoneNumber ?? null,
      status: user.status ?? 'active',
      memberships: Array.isArray(user.memberships) ? user.memberships : [],
      primaryDashboard: user.primaryDashboard ?? null,
      createdAt: user.createdAt ?? null,
      updatedAt: user.updatedAt ?? null,
    },
    profile: {
      headline: profile.headline ?? null,
      missionStatement: profile.missionStatement ?? null,
      location: profile.location ?? null,
      timezone: profile.timezone ?? null,
    },
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

async function computeSummary() {
  const [statusRows, teamStats] = await Promise.all([
    User.findAll({
      attributes: ['status', [fn('COUNT', col('User.id')), 'count']],
      include: [
        {
          model: AgencyProfile,
          attributes: [],
          required: true,
        },
      ],
      group: ['User.status'],
      raw: true,
    }),
    AgencyProfile.findOne({
      attributes: [
        [fn('AVG', col('teamSize')), 'avgTeamSize'],
        [fn('COUNT', col('AgencyProfile.id')), 'total'],
        [fn('SUM', literal('CASE WHEN workforceAvailable IS NOT NULL THEN workforceAvailable ELSE 0 END')), 'totalCapacity'],
      ],
      raw: true,
    }),
  ]);

  const statusCounts = statusRows.reduce(
    (acc, row) => {
      const status = row.status ?? 'active';
      const count = Number.parseInt(row.count, 10) || 0;
      acc[status] = (acc[status] ?? 0) + count;
      acc.total += count;
      return acc;
    },
    { total: 0 },
  );

  const avgTeamSizeRaw = teamStats?.avgTeamSize ?? null;
  const avgTeamSize = avgTeamSizeRaw == null ? null : Number.parseFloat(avgTeamSizeRaw);
  const totalAgencies = Number.parseInt(teamStats?.total, 10) || statusCounts.total || 0;
  const totalCapacity = Number.parseFloat(teamStats?.totalCapacity ?? 0) || 0;

  return {
    total: totalAgencies,
    statuses: {
      invited: statusCounts.invited ?? 0,
      active: statusCounts.active ?? 0,
      suspended: statusCounts.suspended ?? 0,
      archived: statusCounts.archived ?? 0,
    },
    averageTeamSize: avgTeamSize == null ? null : Number(avgTeamSize.toFixed(1)),
    totalCapacity,
  };
}

export async function listAgencies(filters = {}) {
  const limit = normaliseLimit(filters.limit);
  const offset = normaliseOffset(filters.offset);
  const order = resolveSort(filters.sort);

  const where = {};
  const userWhere = {};

  if (filters.status) {
    userWhere.status = normaliseStatus(filters.status);
  }

  if (filters.focusArea) {
    where.focusArea = { [Op.iLike ?? Op.like]: `%${filters.focusArea.trim()}%` };
  }

  if (filters.search) {
    const value = filters.search.trim();
    if (value) {
      where[Op.or] = [
        { agencyName: { [Op.iLike ?? Op.like]: `%${value}%` } },
        { focusArea: { [Op.iLike ?? Op.like]: `%${value}%` } },
        { location: { [Op.iLike ?? Op.like]: `%${value}%` } },
        { '$User.email$': { [Op.iLike ?? Op.like]: `%${value}%` } },
        { '$User.firstName$': { [Op.iLike ?? Op.like]: `%${value}%` } },
        { '$User.lastName$': { [Op.iLike ?? Op.like]: `%${value}%` } },
      ];
    }
  }

  const { rows, count } = await AgencyProfile.findAndCountAll({
    where,
    include: [
      {
        ...INCLUDE_DEFINITION[0],
        where: Object.keys(userWhere).length ? userWhere : undefined,
      },
    ],
    limit,
    offset,
    order,
    distinct: true,
  });

  const items = rows.map(sanitizeAgencyRecord);
  const summary = await computeSummary();

  return {
    items,
    pagination: {
      limit,
      offset,
      total: typeof count === 'number' ? count : count.length,
    },
    summary,
  };
}

export async function getAgency(agencyId) {
  if (!agencyId) {
    throw new ValidationError('agencyId is required.');
  }
  const record = await AgencyProfile.findByPk(agencyId, {
    include: INCLUDE_DEFINITION,
  });
  if (!record) {
    throw new NotFoundError('Agency not found.');
  }
  return sanitizeAgencyRecord(record);
}

async function ensureProfile(userId, transaction) {
  const [profile] = await Profile.findOrCreate({
    where: { userId },
    defaults: { userId },
    transaction,
  });
  return profile;
}

export async function createAgency(payload, { actorId } = {}) {
  if (!payload?.ownerEmail || !payload?.password) {
    throw new ValidationError('Owner email and password are required to create an agency.');
  }

  const normalizedStatus = normaliseStatus(payload.status ?? 'active');

  return sequelize.transaction(async (transaction) => {
    const user = await authDomainService.registerUser(
      {
        email: payload.ownerEmail,
        password: payload.password,
        firstName: payload.ownerFirstName ?? 'Agency',
        lastName: payload.ownerLastName ?? 'Owner',
        phoneNumber: payload.ownerPhone ?? null,
        userType: 'agency',
        status: normalizedStatus,
      },
      { transaction },
    );

    const memberships = uniqueMemberships(user.memberships, 'agency');
    await User.update(
      { memberships, primaryDashboard: 'agency' },
      { where: { id: user.id }, transaction },
    );

    const profile = await ensureProfile(user.id, transaction);
    await profile.update(
      {
        headline: payload.profileHeadline ?? profile.headline ?? null,
        missionStatement: payload.profileMission ?? profile.missionStatement ?? null,
        location: payload.location ?? profile.location ?? null,
        timezone: payload.timezone ?? profile.timezone ?? null,
      },
      { transaction },
    );

    const services = normaliseStringArray(payload.services);
    const industries = normaliseStringArray(payload.industries);
    const clients = normaliseStringArray(payload.clients);
    const awards = normaliseStringArray(payload.awards);
    const socialLinks = normaliseSocialLinks(payload.socialLinks);

    const agency = await AgencyProfile.create(
      {
        userId: user.id,
        agencyName: payload.agencyName,
        focusArea: payload.focusArea ?? null,
        website: payload.website ?? null,
        location: payload.location ?? null,
        tagline: payload.tagline ?? null,
        summary: payload.summary ?? null,
        description: payload.summary ?? null,
        services,
        industries,
        clients,
        awards,
        socialLinks,
        teamSize: coerceNumeric(payload.teamSize),
        foundedYear: coerceNumeric(payload.foundedYear),
        primaryContactName: payload.primaryContactName ?? null,
        primaryContactEmail: payload.primaryContactEmail ?? payload.ownerEmail ?? null,
        primaryContactPhone: payload.primaryContactPhone ?? payload.ownerPhone ?? null,
        brandColor: payload.brandColor ?? null,
        bannerUrl: payload.bannerUrl ?? null,
        introVideoUrl: payload.introVideoUrl ?? null,
        profileImageUrl: payload.avatarUrl ?? null,
        workforceAvailable: coerceNumeric(payload.workforceAvailable),
        workforceNotes: payload.workforceNotes ?? null,
        autoAcceptFollowers: payload.autoAcceptFollowers !== false,
        defaultConnectionMessage: payload.defaultConnectionMessage ?? null,
        followerPolicy: payload.followerPolicy ?? 'open',
        connectionPolicy: payload.connectionPolicy ?? 'open',
      },
      { transaction },
    );

    await agency.reload({ include: INCLUDE_DEFINITION, transaction });
    return sanitizeAgencyRecord(agency);
  });
}

export async function updateAgency(agencyId, payload = {}) {
  if (!agencyId) {
    throw new ValidationError('agencyId is required.');
  }

  const agency = await AgencyProfile.findByPk(agencyId, {
    include: INCLUDE_DEFINITION,
  });
  if (!agency) {
    throw new NotFoundError('Agency not found.');
  }

  return sequelize.transaction(async (transaction) => {
    const user = agency.User;
    if (!user) {
      throw new NotFoundError('Agency owner could not be resolved.');
    }

    const updates = {};

    if (payload.ownerEmail && payload.ownerEmail !== user.email) {
      const email = authDomainService.validateEmail(payload.ownerEmail);
      await authDomainService.ensureUniqueEmail(email, { transaction });
      updates.email = email;
    }
    if (payload.ownerFirstName != null) {
      updates.firstName = payload.ownerFirstName.trim();
    }
    if (payload.ownerLastName != null) {
      updates.lastName = payload.ownerLastName.trim();
    }
    if (payload.ownerPhone !== undefined) {
      updates.phoneNumber = payload.ownerPhone ?? null;
    }
    if (payload.status) {
      updates.status = normaliseStatus(payload.status);
    }
    if (payload.memberships) {
      updates.memberships = uniqueMemberships(payload.memberships, 'agency');
    }
    if (payload.primaryDashboard) {
      updates.primaryDashboard = payload.primaryDashboard;
    }

    if (Object.keys(updates).length) {
      await user.update(updates, { transaction });
    }

    const services = normaliseStringArray(payload.services);
    const industries = normaliseStringArray(payload.industries);
    const clients = normaliseStringArray(payload.clients);
    const awards = normaliseStringArray(payload.awards);
    const socialLinks = normaliseSocialLinks(payload.socialLinks);

    const agencyUpdates = {};

    const updatableFields = [
      'agencyName',
      'focusArea',
      'website',
      'location',
      'tagline',
      'summary',
      'description',
      'brandColor',
      'bannerUrl',
      'introVideoUrl',
      'profileImageUrl',
      'workforceNotes',
      'defaultConnectionMessage',
      'primaryContactName',
      'primaryContactEmail',
      'primaryContactPhone',
    ];
    updatableFields.forEach((field) => {
      if (field in payload) {
        agencyUpdates[field] = payload[field] ?? null;
      }
    });

    if (services !== null) {
      agencyUpdates.services = services;
    }
    if (industries !== null) {
      agencyUpdates.industries = industries;
    }
    if (clients !== null) {
      agencyUpdates.clients = clients;
    }
    if (awards !== null) {
      agencyUpdates.awards = awards;
    }
    if (socialLinks !== null) {
      agencyUpdates.socialLinks = socialLinks;
    }

    if (payload.autoAcceptFollowers !== undefined) {
      agencyUpdates.autoAcceptFollowers = payload.autoAcceptFollowers !== false;
    }
    if (payload.followerPolicy) {
      agencyUpdates.followerPolicy = payload.followerPolicy;
    }
    if (payload.connectionPolicy) {
      agencyUpdates.connectionPolicy = payload.connectionPolicy;
    }
    if (payload.teamSize !== undefined) {
      agencyUpdates.teamSize = coerceNumeric(payload.teamSize);
    }
    if (payload.foundedYear !== undefined) {
      agencyUpdates.foundedYear = coerceNumeric(payload.foundedYear);
    }
    if (payload.workforceAvailable !== undefined) {
      agencyUpdates.workforceAvailable = coerceNumeric(payload.workforceAvailable);
    }

    if (Object.keys(agencyUpdates).length) {
      await agency.update(agencyUpdates, { transaction });
    }

    const profile = await ensureProfile(user.id, transaction);
    const profileUpdates = {};
    if (payload.profileHeadline !== undefined) {
      profileUpdates.headline = payload.profileHeadline ?? null;
    }
    if (payload.profileMission !== undefined) {
      profileUpdates.missionStatement = payload.profileMission ?? null;
    }
    if (payload.location !== undefined) {
      profileUpdates.location = payload.location ?? null;
    }
    if (payload.timezone !== undefined) {
      profileUpdates.timezone = payload.timezone ?? null;
    }
    if (Object.keys(profileUpdates).length) {
      await profile.update(profileUpdates, { transaction });
    }

    await agency.reload({ include: INCLUDE_DEFINITION, transaction });
    return sanitizeAgencyRecord(agency);
  });
}

export async function archiveAgency(agencyId, { actorId } = {}) {
  if (!agencyId) {
    throw new ValidationError('agencyId is required.');
  }

  const agency = await AgencyProfile.findByPk(agencyId, {
    include: INCLUDE_DEFINITION,
  });
  if (!agency) {
    throw new NotFoundError('Agency not found.');
  }

  await sequelize.transaction(async (transaction) => {
    const user = agency.User;
    if (!user) {
      throw new NotFoundError('Agency owner could not be resolved.');
    }
    await user.update({ status: 'archived' }, { transaction });
    await agency.update(
      {
        followerPolicy: 'closed',
        connectionPolicy: 'manual_review',
        autoAcceptFollowers: false,
      },
      { transaction },
    );
  });

  await agency.reload({ include: INCLUDE_DEFINITION });
  return sanitizeAgencyRecord(agency);
}

export default {
  listAgencies,
  getAgency,
  createAgency,
  updateAgency,
  archiveAgency,
};

