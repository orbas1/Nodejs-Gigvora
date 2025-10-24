import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { normalizeLocationPayload } from '../../utils/location.js';
import { ValidationError } from '../../utils/errors.js';
import { USER_STATUSES } from '../../models/index.js';

const EMAIL_REGEX = /^(?:[A-Za-z0-9_'^&+{}=-]+(?:\.[A-Za-z0-9_'^&+{}=-]+)*)@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/u;
const PASSWORD_MIN_LENGTH = 8;
const FALLBACK_USER_STATUSES = ['invited', 'active', 'suspended', 'archived'];
const KNOWN_USER_STATUSES = Array.from(new Set([...(USER_STATUSES ?? []), ...FALLBACK_USER_STATUSES]))
  .map((status) => `${status}`.trim().toLowerCase())
  .filter(Boolean);
const KNOWN_USER_ROLES = Object.freeze([
  'admin',
  'company',
  'freelancer',
  'agency',
  'mentor',
  'headhunter',
  'support',
  'analyst',
  'moderator',
  'partner',
  'volunteer',
]);

function createLogger(logger) {
  if (!logger) {
    return {
      child() {
        return this;
      },
      debug() {},
      info() {},
      warn() {},
      error() {},
    };
  }
  return logger.child({ module: 'AuthDomainService' });
}

function sanitizeUser(userInstance) {
  const plain = typeof userInstance.get === 'function' ? userInstance.get({ plain: true }) : userInstance;
  const normalizedStatus = normalizeStatusValue(plain.status);
  const roleSet = new Set();
  const roleSources = [];
  if (Array.isArray(plain.roleAssignments)) {
    roleSources.push(...plain.roleAssignments.map((entry) => entry?.role ?? entry));
  }
  if (Array.isArray(plain.roles)) {
    roleSources.push(...plain.roles);
  }
  if (Array.isArray(plain.memberships)) {
    roleSources.push(...plain.memberships);
  }
  roleSources
    .map(normalizeRoleName)
    .filter(Boolean)
    .forEach((role) => roleSet.add(role));
  const memberships = new Set();
  if (Array.isArray(plain.memberships)) {
    plain.memberships.filter(Boolean).forEach((item) => memberships.add(item));
  }
  if (plain.userType) {
    memberships.add(plain.userType);
  }
  roleSet.forEach((role) => memberships.add(role));
  if (memberships.size === 0) {
    memberships.add('user');
  }
  const fullName = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim() || plain.email;
  const profile = plain.Profile ?? plain.profile ?? null;
  const companyProfile = plain.CompanyProfile ?? plain.companyProfile ?? null;
  const agencyProfile = plain.AgencyProfile ?? plain.agencyProfile ?? null;
  const sanitizeLinks = (value) => {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'object') {
      return Object.values(value);
    }
    return [];
  };
  const sanitizedProfile = profile
    ? {
        id: profile.id ?? null,
        headline: profile.headline ?? null,
        missionStatement: profile.missionStatement ?? profile.bio ?? null,
        bio: profile.bio ?? null,
        location: profile.location ?? plain.location ?? null,
        geoLocation: profile.geoLocation ?? plain.geoLocation ?? null,
        timezone: profile.timezone ?? null,
        avatarUrl: profile.avatarUrl ?? plain.avatarUrl ?? null,
        avatarSeed: profile.avatarSeed ?? null,
        socialLinks: sanitizeLinks(profile.socialLinks),
        tags: Array.isArray(profile.tags) ? profile.tags : [],
      }
    : null;
  const sanitizedCompanyProfile = companyProfile
    ? {
        id: companyProfile.id ?? null,
        companyName: companyProfile.companyName ?? null,
        tagline: companyProfile.tagline ?? null,
        location: companyProfile.location ?? null,
        website: companyProfile.website ?? null,
        logoUrl: companyProfile.logoUrl ?? null,
        bannerUrl: companyProfile.bannerUrl ?? null,
        socialLinks: sanitizeLinks(companyProfile.socialLinks),
      }
    : null;
  const sanitizedAgencyProfile = agencyProfile
    ? {
        id: agencyProfile.id ?? null,
        agencyName: agencyProfile.agencyName ?? null,
        focusArea: agencyProfile.focusArea ?? null,
        website: agencyProfile.website ?? null,
        location: agencyProfile.location ?? null,
        tagline: agencyProfile.tagline ?? null,
        profileImageUrl: agencyProfile.profileImageUrl ?? null,
        bannerUrl: agencyProfile.bannerUrl ?? null,
        services: Array.isArray(agencyProfile.services) ? agencyProfile.services : [],
        industries: Array.isArray(agencyProfile.industries) ? agencyProfile.industries : [],
      }
    : null;
  return {
    id: plain.id,
    email: plain.email,
    firstName: plain.firstName,
    lastName: plain.lastName,
    name: fullName,
    address: plain.address,
    location: plain.location,
    geoLocation: plain.geoLocation,
    age: plain.age,
    status: normalizedStatus,
    phoneNumber: plain.phoneNumber ?? null,
    jobTitle: plain.jobTitle ?? null,
    avatarUrl: plain.avatarUrl ?? null,
    lastSeenAt: plain.lastSeenAt ?? null,
    userType: plain.userType,
    twoFactorEnabled: plain.twoFactorEnabled !== false,
    twoFactorMethod: plain.twoFactorMethod || 'email',
    lastLoginAt: plain.lastLoginAt || null,
    googleId: plain.googleId || null,
    memberships: Array.from(memberships),
    roles: Array.from(roleSet),
    primaryDashboard: plain.primaryDashboard || plain.userType || 'user',
    profileId: sanitizedProfile?.id ?? null,
    profile: sanitizedProfile,
    companyProfile: sanitizedCompanyProfile,
    agencyProfile: sanitizedAgencyProfile,
  };
}

function normalizeRoleName(value) {
  if (!value) {
    return null;
  }
  const trimmed = `${value}`.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/\s+/g, '_');
}

function normalizeRoleList(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  const unique = new Set();
  values
    .map(normalizeRoleName)
    .filter(Boolean)
    .forEach((role) => {
      unique.add(role);
    });
  return Array.from(unique);
}

function normalizeStatusValue(value) {
  if (!value) {
    return 'active';
  }
  const normalized = `${value}`.trim().toLowerCase();
  if (!normalized) {
    return 'active';
  }
  return KNOWN_USER_STATUSES.includes(normalized) ? normalized : 'active';
}

export class AuthDomainService {
  constructor({ domainRegistry, logger }) {
    this.registry = domainRegistry;
    this.logger = createLogger(logger);
    this.contextName = 'auth';
    this.models = domainRegistry.getContextModels('auth');
    this.User = this.models.User;
    if (!this.User) {
      throw new Error('Auth domain requires the User model to be registered.');
    }
    this.UserLoginAudit = this.models.UserLoginAudit;
    this.UserRole = this.models.UserRole;
    this.UserNote = this.models.UserNote;
  }

  validateEmail(email) {
    if (!email || !EMAIL_REGEX.test(email)) {
      throw new ValidationError('A valid email address is required.');
    }
    return email.toLowerCase();
  }

  async ensureUniqueEmail(email, { transaction } = {}) {
    const existing = await this.User.findOne({
      where: { email: { [Op.eq]: email } },
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
    });
    if (existing) {
      throw new ValidationError('An account with this email already exists.');
    }
  }

  normalizeTwoFactorPreference(data = {}) {
    const enabled = data.twoFactorEnabled !== false;
    const preferredMethod = typeof data.twoFactorMethod === 'string' ? data.twoFactorMethod.toLowerCase() : undefined;
    const allowed = ['email', 'app', 'sms'];
    const method = enabled && preferredMethod && allowed.includes(preferredMethod) ? preferredMethod : 'email';
    return { twoFactorEnabled: enabled, twoFactorMethod: method };
  }

  normalizeStatus(value) {
    return normalizeStatusValue(value);
  }

  getAssignableRoles() {
    return [...KNOWN_USER_ROLES];
  }

  normalizeRole(role) {
    const normalized = normalizeRoleName(role);
    if (!normalized) {
      throw new ValidationError('A valid role identifier is required.');
    }
    if (KNOWN_USER_ROLES.length && !KNOWN_USER_ROLES.includes(normalized)) {
      throw new ValidationError(`Role "${role}" is not assignable.`);
    }
    return normalized;
  }

  normalizeRoles(roles) {
    const normalized = normalizeRoleList(roles);
    if (!normalized.length) {
      return [];
    }
    if (KNOWN_USER_ROLES.length) {
      normalized.forEach((role) => {
        if (!KNOWN_USER_ROLES.includes(role)) {
          throw new ValidationError(`Role "${role}" is not assignable.`);
        }
      });
    }
    return normalized;
  }

  async hashPassword(password) {
    if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
      throw new ValidationError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`);
    }
    return bcrypt.hash(password, 10);
  }

  async registerUser(payload, { transaction: externalTransaction } = {}) {
    const email = this.validateEmail(payload.email);
    const hashedPassword = await this.hashPassword(payload.password);
    const { twoFactorEnabled, twoFactorMethod } = this.normalizeTwoFactorPreference(payload);

    const locationPayload = normalizeLocationPayload({
      location: payload.location ?? payload.address,
      geoLocation: payload.geoLocation,
    });

    const createUser = async (transaction) => {
      await this.ensureUniqueEmail(email, { transaction });
      const user = await this.User.create(
        {
          email,
          password: hashedPassword,
          firstName: payload.firstName,
          lastName: payload.lastName,
          address: payload.address,
          location: locationPayload.location,
          geoLocation: locationPayload.geoLocation,
          age: payload.age,
          phoneNumber: payload.phoneNumber ?? null,
          jobTitle: payload.jobTitle ?? null,
          avatarUrl: payload.avatarUrl ?? null,
          status: this.normalizeStatus(payload.status),
          lastSeenAt: payload.lastSeenAt ?? null,
          userType: payload.userType || 'user',
          twoFactorEnabled,
          twoFactorMethod,
          googleId: payload.googleId || null,
        },
        { transaction },
      );
      this.logger.info({ userId: user.id, email }, 'User registered through AuthDomainService.');
      return sanitizeUser(user);
    };

    if (externalTransaction) {
      return createUser(externalTransaction);
    }
    return this.registry.transaction('auth', ({ transaction }) => createUser(transaction));
  }

  async findUserByEmail(email, { transaction } = {}) {
    const normalizedEmail = this.validateEmail(email);
    const user = await this.User.findOne({ where: { email: normalizedEmail }, transaction });
    return user ?? null;
  }

  async findUserById(userId, { transaction } = {}) {
    if (!Number.isInteger(Number(userId))) {
      return null;
    }
    return this.User.findByPk(userId, { transaction });
  }

  sanitizeUser(userInstance) {
    return sanitizeUser(userInstance);
  }

  async comparePassword(userInstance, password) {
    if (!userInstance || typeof userInstance.password !== 'string') {
      return false;
    }
    return bcrypt.compare(password, userInstance.password);
  }

  async updateLastLogin(userId, { transaction } = {}) {
    const now = new Date();
    await this.User.update({ lastLoginAt: now, lastSeenAt: now }, { where: { id: userId }, transaction });
  }

  async listRoles(userId, { transaction } = {}) {
    if (!this.UserRole) {
      return [];
    }
    const roles = await this.UserRole.findAll({
      where: { userId },
      attributes: ['role'],
      order: [['role', 'ASC']],
      transaction,
    });
    return roles.map((entry) => entry.role);
  }

  async replaceRoles(userId, roles, { transaction: externalTransaction, actorId } = {}) {
    if (!this.UserRole) {
      return [];
    }
    const normalizedRoles = this.normalizeRoles(roles);
    const perform = async (transaction) => {
      const existing = await this.UserRole.findAll({ where: { userId }, transaction, lock: transaction?.LOCK.UPDATE });
      const existingRoles = new Set(existing.map((entry) => entry.role));
      const desiredRoles = new Set(normalizedRoles);

      const toRemove = Array.from(existingRoles).filter((role) => !desiredRoles.has(role));
      if (toRemove.length) {
        await this.UserRole.destroy({ where: { userId, role: toRemove }, transaction });
      }

      const now = new Date();
      for (const role of desiredRoles) {
        if (!existingRoles.has(role)) {
          await this.UserRole.create(
            { userId, role, assignedBy: actorId ?? null, assignedAt: now },
            { transaction },
          );
        }
      }

      return normalizedRoles;
    };

    if (externalTransaction) {
      return perform(externalTransaction);
    }

    return this.registry.transaction('auth', ({ transaction }) => perform(transaction));
  }

  async removeRole(userId, role, { transaction } = {}) {
    if (!this.UserRole) {
      return 0;
    }
    const normalizedRole = this.normalizeRole(role);
    return this.UserRole.destroy({ where: { userId, role: normalizedRole }, transaction });
  }

  async recordUserNote(userId, { authorId = null, body, visibility = 'internal', metadata = null }, { transaction } = {}) {
    if (!this.UserNote) {
      throw new ValidationError('User notes are not supported in the current configuration.');
    }
    if (!body || typeof body !== 'string' || !body.trim()) {
      throw new ValidationError('Note body is required.');
    }
    const normalizedVisibility = typeof visibility === 'string' ? visibility.trim().toLowerCase() : 'internal';
    if (!['internal', 'restricted'].includes(normalizedVisibility)) {
      throw new ValidationError('Visibility must be internal or restricted.');
    }
    const record = await this.UserNote.create(
      {
        userId,
        authorId,
        visibility: normalizedVisibility,
        body: body.trim(),
        metadata: metadata ?? null,
      },
      { transaction },
    );
    return record.get({ plain: true });
  }

  async listUserNotes(userId, { limit = 20, offset = 0, transaction } = {}) {
    if (!this.UserNote) {
      return { items: [], pagination: { limit, offset, count: 0 } };
    }
    const resolvedLimit = Math.min(Math.max(Number.parseInt(`${limit}`, 10) || 20, 1), 100);
    const resolvedOffset = Math.max(Number.parseInt(`${offset}`, 10) || 0, 0);
    const { rows, count } = await this.UserNote.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: resolvedLimit,
      offset: resolvedOffset,
      transaction,
    });
    return {
      items: rows.map((row) => row.get({ plain: true })),
      pagination: { limit: resolvedLimit, offset: resolvedOffset, count },
    };
  }

  async recordLoginAudit(userId, { eventType = 'login', ipAddress, userAgent, metadata = {} }, { transaction } = {}) {
    if (!this.UserLoginAudit) {
      return null;
    }
    const record = await this.UserLoginAudit.create(
      {
        userId,
        eventType,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        metadata,
      },
      { transaction },
    );
    this.logger.debug({ userId, eventType }, 'Recorded login audit event.');
    return record.get({ plain: true });
  }

  describeCapabilities() {
    return {
      key: 'auth',
      contextName: this.contextName,
      description: 'Identity, session lifecycle, and authentication guardrails.',
      operations: [
        'registerUser',
        'ensureUniqueEmail',
        'hashPassword',
        'comparePassword',
        'updateLastLogin',
        'recordLoginAudit',
        'sanitizeUser',
        'normalizeStatus',
        'getAssignableRoles',
        'normalizeRole',
        'normalizeRoles',
        'listRoles',
        'replaceRoles',
        'removeRole',
        'recordUserNote',
        'listUserNotes',
      ],
      models: Object.keys(this.models),
    };
  }
}

export default AuthDomainService;
