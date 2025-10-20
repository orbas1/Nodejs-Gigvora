import bcrypt from 'bcrypt';
import { Op, fn, col } from 'sequelize';

import { CompanyProfile, Profile, User } from '../models/adminManagementModels.js';
import sequelize from '../models/sequelizeClient.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const SORT_MAP = new Map([
  ['created_desc', [['createdAt', 'DESC']]],
  ['created_asc', [['createdAt', 'ASC']]],
  ['name_asc', [['companyName', 'ASC']]],
  ['name_desc', [['companyName', 'DESC']]],
]);

const INCLUDE_DEFINITION = [
  {
    model: User,
    as: 'User',
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
        as: 'Profile',
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

function uniqueMemberships(existingMemberships = [], membershipToEnsure) {
  const values = Array.isArray(existingMemberships) ? existingMemberships : [];
  const set = new Set(values.filter(Boolean).map((entry) => `${entry}`.trim()));
  if (membershipToEnsure) {
    set.add(membershipToEnsure);
  }
  return Array.from(set);
}

function normalizeSocialLinks(value) {
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

function validateEmail(email) {
  if (typeof email !== 'string') {
    throw new ValidationError('A valid email address is required.');
  }
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    throw new ValidationError('A valid email address is required.');
  }
  const EMAIL_REGEX = /^(?:[A-Za-z0-9_'^&+{}=-]+(?:\.[A-Za-z0-9_'^&+{}=-]+)*)@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/u;
  if (!EMAIL_REGEX.test(trimmed)) {
    throw new ValidationError('A valid email address is required.');
  }
  return trimmed;
}

async function ensureEmailAvailable(email, { transaction, excludeUserId = null } = {}) {
  const where = { email };
  if (excludeUserId != null) {
    where.id = { [Op.ne]: excludeUserId };
  }
  const existing = await User.findOne({
    where,
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (existing) {
    throw new ValidationError('A user with this email already exists.');
  }
}

async function hashPassword(password) {
  if (typeof password !== 'string' || password.trim().length < 8) {
    throw new ValidationError('Password must be at least 8 characters long.');
  }
  return bcrypt.hash(password, 10);
}

async function createOwnerAccount(
  { email, password, firstName, lastName, phoneNumber, status, membership },
  transaction,
) {
  if (!email) {
    throw new ValidationError('Owner email is required.');
  }
  const normalisedEmail = validateEmail(email);
  await ensureEmailAvailable(normalisedEmail, { transaction });

  const hashedPassword = await hashPassword(password);

  const user = await User.create(
    {
      email: normalisedEmail,
      password: hashedPassword,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      phoneNumber: phoneNumber ?? null,
      status,
      userType: membership,
      memberships: uniqueMemberships([], membership),
      primaryDashboard: membership,
    },
    { transaction },
  );

  return user;
}

function sanitizeCompanyRecord(instance) {
  if (!instance) {
    return null;
  }
  const plain = instance.get({ plain: true });
  const user = plain.User ?? {};
  const profile = user.Profile ?? {};

  return {
    id: plain.id,
    userId: plain.userId,
    companyName: plain.companyName,
    description: plain.description ?? null,
    website: plain.website ?? null,
    location: plain.location ?? profile.location ?? null,
    tagline: plain.tagline ?? null,
    logoUrl: plain.logoUrl ?? null,
    bannerUrl: plain.bannerUrl ?? null,
    contactEmail: plain.contactEmail ?? user.email ?? null,
    contactPhone: plain.contactPhone ?? user.phoneNumber ?? null,
    socialLinks: Array.isArray(plain.socialLinks) ? plain.socialLinks : [],
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
  const statusRows = await User.findAll({
    attributes: ['status', [fn('COUNT', col('User.id')), 'count']],
    include: [
      {
        model: CompanyProfile,
        as: 'CompanyProfile',
        attributes: [],
        required: true,
      },
    ],
    group: ['User.status'],
    raw: true,
  });

  const totals = statusRows.reduce(
    (acc, row) => {
      const status = row.status ?? 'active';
      const count = Number.parseInt(row.count, 10) || 0;
      acc[status] = (acc[status] ?? 0) + count;
      acc.total += count;
      return acc;
    },
    { total: 0 },
  );

  const withWebsite = await CompanyProfile.count({ where: { website: { [Op.not]: null } } });
  const withContact = await CompanyProfile.count({ where: { contactEmail: { [Op.not]: null } } });

  return {
    total: totals.total,
    statuses: {
      invited: totals.invited ?? 0,
      active: totals.active ?? 0,
      suspended: totals.suspended ?? 0,
      archived: totals.archived ?? 0,
    },
    withWebsite,
    withContact,
  };
}

export async function listCompanies(filters = {}) {
  const limit = normaliseLimit(filters.limit);
  const offset = normaliseOffset(filters.offset);
  const order = resolveSort(filters.sort);

  const where = {};
  const userWhere = {};

  if (filters.status) {
    userWhere.status = `${filters.status}`.trim().toLowerCase();
  }

  if (filters.search) {
    const value = filters.search.trim();
    if (value) {
      where[Op.or] = [
        { companyName: { [Op.iLike ?? Op.like]: `%${value}%` } },
        { location: { [Op.iLike ?? Op.like]: `%${value}%` } },
        { '$User.email$': { [Op.iLike ?? Op.like]: `%${value}%` } },
        { '$User.firstName$': { [Op.iLike ?? Op.like]: `%${value}%` } },
        { '$User.lastName$': { [Op.iLike ?? Op.like]: `%${value}%` } },
      ];
    }
  }

  const { rows, count } = await CompanyProfile.findAndCountAll({
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

  const items = rows.map(sanitizeCompanyRecord);
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

export async function getCompany(companyId) {
  if (!companyId) {
    throw new ValidationError('companyId is required.');
  }
  const record = await CompanyProfile.findByPk(companyId, { include: INCLUDE_DEFINITION });
  if (!record) {
    throw new NotFoundError('Company not found.');
  }
  return sanitizeCompanyRecord(record);
}

async function ensureProfile(userId, transaction) {
  const [profile] = await Profile.findOrCreate({
    where: { userId },
    defaults: { userId },
    transaction,
  });
  return profile;
}

export async function createCompany(payload, { actorId } = {}) {
  if (!payload?.ownerEmail || !payload?.password) {
    throw new ValidationError('Owner email and password are required to create a company.');
  }

  const status = payload.status ? `${payload.status}`.trim().toLowerCase() : 'active';

  const createdCompanyId = await sequelize.transaction(async (transaction) => {
    const user = await createOwnerAccount(
      {
        email: payload.ownerEmail,
        password: payload.password,
        firstName: payload.ownerFirstName ?? 'Company',
        lastName: payload.ownerLastName ?? 'Owner',
        phoneNumber: payload.ownerPhone ?? null,
        status,
        membership: 'company',
      },
      transaction,
    );

    const memberships = uniqueMemberships(user.memberships, 'company');
    await user.update(
      { memberships, primaryDashboard: 'company' },
      { transaction },
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

    const socialLinks = normalizeSocialLinks(payload.socialLinks);

    const company = await CompanyProfile.create(
      {
        userId: user.id,
        companyName: payload.companyName,
        description: payload.description ?? null,
        website: payload.website ?? null,
        location: payload.location ?? null,
        tagline: payload.tagline ?? null,
        logoUrl: payload.logoUrl ?? null,
        bannerUrl: payload.bannerUrl ?? null,
        contactEmail: payload.contactEmail ?? payload.ownerEmail ?? null,
        contactPhone: payload.contactPhone ?? payload.ownerPhone ?? null,
        socialLinks,
      },
      { transaction },
    );

    return company.id;
  });

  return getCompany(createdCompanyId);
}

export async function updateCompany(companyId, payload = {}) {
  if (!companyId) {
    throw new ValidationError('companyId is required.');
  }

  const company = await CompanyProfile.findByPk(companyId, { include: INCLUDE_DEFINITION });
  if (!company) {
    throw new NotFoundError('Company not found.');
  }

  await sequelize.transaction(async (transaction) => {
    const user = company.User;
    if (!user) {
      throw new NotFoundError('Company owner could not be resolved.');
    }

    const userUpdates = {};
    if (payload.ownerEmail && payload.ownerEmail !== user.email) {
      const email = validateEmail(payload.ownerEmail);
      await ensureEmailAvailable(email, { transaction, excludeUserId: user.id });
      userUpdates.email = email;
    }
    if (payload.ownerFirstName != null) {
      userUpdates.firstName = payload.ownerFirstName.trim();
    }
    if (payload.ownerLastName != null) {
      userUpdates.lastName = payload.ownerLastName.trim();
    }
    if (payload.ownerPhone !== undefined) {
      userUpdates.phoneNumber = payload.ownerPhone ?? null;
    }
    if (payload.status) {
      userUpdates.status = `${payload.status}`.trim().toLowerCase();
    }
    if (payload.memberships) {
      userUpdates.memberships = uniqueMemberships(payload.memberships, 'company');
    }
    if (payload.primaryDashboard) {
      userUpdates.primaryDashboard = payload.primaryDashboard;
    }

    if (Object.keys(userUpdates).length) {
      await user.update(userUpdates, { transaction });
    }

    const socialLinks = normalizeSocialLinks(payload.socialLinks);
    const companyUpdates = {};
    const updatableFields = [
      'companyName',
      'description',
      'website',
      'location',
      'tagline',
      'logoUrl',
      'bannerUrl',
      'contactEmail',
      'contactPhone',
    ];
    updatableFields.forEach((field) => {
      if (field in payload) {
        companyUpdates[field] = payload[field] ?? null;
      }
    });

    if (socialLinks !== null) {
      companyUpdates.socialLinks = socialLinks;
    }

    if (Object.keys(companyUpdates).length) {
      await company.update(companyUpdates, { transaction });
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

  });

  return getCompany(companyId);
}

export async function archiveCompany(companyId, { actorId } = {}) {
  if (!companyId) {
    throw new ValidationError('companyId is required.');
  }

  const company = await CompanyProfile.findByPk(companyId, { include: INCLUDE_DEFINITION });
  if (!company) {
    throw new NotFoundError('Company not found.');
  }

  await sequelize.transaction(async (transaction) => {
    const user = company.User;
    if (!user) {
      throw new NotFoundError('Company owner could not be resolved.');
    }
    await user.update({ status: 'archived' }, { transaction });
  });

  return getCompany(companyId);
}

export default {
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  archiveCompany,
};

