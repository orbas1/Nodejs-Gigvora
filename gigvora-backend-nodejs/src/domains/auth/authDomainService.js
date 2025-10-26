import crypto from 'crypto';
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

const PASSWORD_RESET_DEFAULT_EXPIRY_MINUTES = 30;
const PASSWORD_RESET_MAX_EXPIRY_MINUTES = 180;
const PASSWORD_RESET_DEFAULT_COOLDOWN_SECONDS = 120;
const PASSWORD_RESET_MAX_COOLDOWN_SECONDS = 900;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;

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
  const profile = plain.Profile ?? plain.profile ?? null;
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
  const normalizedPrimaryDashboard = normalizeRoleName(plain.primaryDashboard) || normalizeRoleName(plain.userType) || 'user';
  const normalizedPreferredRoles = Array.isArray(plain.preferredRoles)
    ? plain.preferredRoles.map(normalizeRoleName).filter(Boolean)
    : [];
  const profileSnapshot = profile
    ? {
        id: profile.id,
        headline: profile.headline ?? null,
        bio: profile.bio ?? null,
        location: profile.location ?? plain.location ?? null,
        timezone: profile.timezone ?? null,
        followersCount: Number.isFinite(Number(profile.followersCount))
          ? Number(profile.followersCount)
          : 0,
        followersVisibility: profile.followersVisibility ?? 'connections',
        networkVisibility: profile.networkVisibility ?? 'connections',
        profileVisibility: profile.profileVisibility ?? 'members',
        avatarUrl: profile.avatarUrl ?? plain.avatarUrl ?? null,
        avatarSeed: profile.avatarSeed ?? null,
        profileCompletion: profile.profileCompletion != null ? Number(profile.profileCompletion) : null,
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
    appleId: plain.appleId || null,
    linkedinId: plain.linkedinId || null,
    dateOfBirth:
      plain.dateOfBirth instanceof Date
        ? plain.dateOfBirth.toISOString().slice(0, 10)
        : typeof plain.dateOfBirth === 'string' && plain.dateOfBirth
          ? plain.dateOfBirth.slice(0, 10)
          : null,
    memberships: Array.from(memberships),
    roles: Array.from(roleSet),
    preferredRoles: normalizedPreferredRoles,
    primaryDashboard: normalizedPrimaryDashboard,
    marketingOptIn: plain.marketingOptIn !== false,
    timezone: profile?.timezone ?? plain.timezone ?? null,
    profile: profileSnapshot,
  };
}

function coerceBirthDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    const iso = value.toISOString();
    return iso.slice(0, 10);
  }
  const text = `${value}`.trim();
  if (!text) {
    return null;
  }
  const match = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/u.exec(text);
  if (!match) {
    throw new ValidationError('dateOfBirth must use the YYYY-MM-DD format.');
  }
  const [year, month, day] = text.split('-').map((part) => Number.parseInt(part, 10));
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new ValidationError('dateOfBirth must reference a valid calendar day.');
  }
  const today = new Date();
  if (candidate.getTime() > today.getTime()) {
    throw new ValidationError('dateOfBirth cannot be in the future.');
  }
  return text;
}

function calculateAgeFromBirthDate(dateOfBirth) {
  if (!dateOfBirth) {
    return null;
  }
  const [year, month, day] = dateOfBirth.split('-').map((part) => Number.parseInt(part, 10));
  const today = new Date();
  let age = today.getUTCFullYear() - year;
  const currentMonth = today.getUTCMonth() + 1;
  const currentDay = today.getUTCDate();
  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age -= 1;
  }
  return age;
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

function resolvePasswordResetExpiryMinutes() {
  const raw = Number.parseInt(
    process.env.PASSWORD_RESET_EXPIRY_MINUTES ?? `${PASSWORD_RESET_DEFAULT_EXPIRY_MINUTES}`,
    10,
  );
  if (!Number.isFinite(raw) || raw < 5) {
    return PASSWORD_RESET_DEFAULT_EXPIRY_MINUTES;
  }
  return Math.min(raw, PASSWORD_RESET_MAX_EXPIRY_MINUTES);
}

function resolvePasswordResetCooldownSeconds() {
  const raw = Number.parseInt(
    process.env.PASSWORD_RESET_COOLDOWN_SECONDS ?? `${PASSWORD_RESET_DEFAULT_COOLDOWN_SECONDS}`,
    10,
  );
  if (!Number.isFinite(raw) || raw < 30) {
    return PASSWORD_RESET_DEFAULT_COOLDOWN_SECONDS;
  }
  return Math.min(raw, PASSWORD_RESET_MAX_COOLDOWN_SECONDS);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
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
    this.PasswordResetToken = this.models.PasswordResetToken;
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

    const normalizedMemberships = this.normalizeRoles(payload.memberships ?? []);
    const normalizedPreferredRoles = this.normalizeRoles(payload.preferredRoles ?? normalizedMemberships);
    const membershipSet = new Set(normalizedMemberships);
    const canonicalUserType = payload.userType || 'user';
    membershipSet.add(canonicalUserType);
    normalizedPreferredRoles.forEach((role) => membershipSet.add(role));
    if (membershipSet.size === 0) {
      membershipSet.add('user');
    }

    const birthDate = coerceBirthDate(payload.dateOfBirth);
    const derivedAge = birthDate ? calculateAgeFromBirthDate(birthDate) : null;
    const declaredAge = payload.age ?? null;
    const age = derivedAge ?? declaredAge;
    if (age != null && age < 13) {
      throw new ValidationError('Users must be at least 13 years old to register.');
    }

    let primaryDashboard = null;
    const primaryCandidates = [
      payload.primaryDashboard,
      normalizedPreferredRoles.find((role) => role !== 'user'),
      normalizedMemberships.find((role) => role !== 'user'),
      canonicalUserType,
    ].filter(Boolean);
    for (const candidate of primaryCandidates) {
      try {
        primaryDashboard = this.normalizeRole(candidate);
        break;
      } catch (error) {
        continue;
      }
    }
    if (!primaryDashboard) {
      primaryDashboard = 'user';
    }

    const marketingOptIn = payload.marketingOptIn !== false;

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
          age,
          dateOfBirth: birthDate,
          phoneNumber: payload.phoneNumber ?? null,
          jobTitle: payload.jobTitle ?? null,
          avatarUrl: payload.avatarUrl ?? null,
          status: this.normalizeStatus(payload.status),
          lastSeenAt: payload.lastSeenAt ?? null,
          userType: payload.userType || 'user',
          twoFactorEnabled,
          twoFactorMethod,
          googleId: payload.googleId || null,
          appleId: payload.appleId || null,
          linkedinId: payload.linkedinId || null,
          memberships: Array.from(membershipSet),
          preferredRoles: normalizedPreferredRoles,
          primaryDashboard,
          marketingOptIn,
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

  async findUserByAppleId(appleId, { transaction } = {}) {
    if (!appleId) {
      return null;
    }
    return this.User.findOne({ where: { appleId }, transaction });
  }

  async findUserByGoogleId(googleId, { transaction } = {}) {
    if (!googleId) {
      return null;
    }
    return this.User.findOne({ where: { googleId }, transaction });
  }

  async findUserByLinkedinId(linkedinId, { transaction } = {}) {
    if (!linkedinId) {
      return null;
    }
    return this.User.findOne({ where: { linkedinId }, transaction });
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

  async purgeExpiredPasswordResets({ transaction } = {}) {
    if (!this.PasswordResetToken) {
      return 0;
    }
    return this.PasswordResetToken.destroy({ where: { expiresAt: { [Op.lt]: new Date() } }, transaction });
  }

  async createPasswordResetToken(
    userInstance,
    { context = {}, metadata = null, transaction: externalTransaction } = {},
  ) {
    if (!this.PasswordResetToken) {
      throw new Error('Password reset tokens are not enabled in the current configuration.');
    }
    const userId = userInstance?.id ?? userInstance?.get?.('id');
    if (!userId) {
      throw new ValidationError('A valid account is required to create a password reset token.');
    }

    const cooldownSeconds = resolvePasswordResetCooldownSeconds();
    const expiryMinutes = resolvePasswordResetExpiryMinutes();
    const now = new Date();

    const perform = async (transaction) => {
      await this.PasswordResetToken.destroy({
        where: { userId, expiresAt: { [Op.lt]: now } },
        transaction,
      });

      const recent = await this.PasswordResetToken.findOne({
        where: { userId, consumedAt: { [Op.is]: null } },
        order: [['createdAt', 'DESC']],
        transaction,
        lock: transaction?.LOCK?.UPDATE,
      });

      if (recent) {
        const availableAt = new Date(recent.createdAt.getTime() + cooldownSeconds * 1000);
        if (availableAt > now) {
          const retryAfterSeconds = Math.max(1, Math.ceil((availableAt.getTime() - now.getTime()) / 1000));
          return {
            rateLimited: true,
            cooldownSeconds: retryAfterSeconds,
            retryAvailableAt: availableAt.toISOString(),
            record: recent,
          };
        }
      }

      const token = crypto.randomBytes(32).toString('hex');
      const record = await this.PasswordResetToken.create(
        {
          userId,
          tokenHash: hashToken(token),
          requestedFromIp: context.ipAddress ?? null,
          requestedUserAgent: context.userAgent ?? null,
          metadata: metadata && typeof metadata === 'object' ? metadata : null,
          expiresAt: new Date(now.getTime() + expiryMinutes * 60 * 1000),
        },
        { transaction },
      );

      this.logger.info({ userId }, 'Issued password reset token.');
      return {
        rateLimited: false,
        token,
        expiresAt: record.expiresAt,
        cooldownSeconds,
        record,
      };
    };

    if (externalTransaction) {
      return perform(externalTransaction);
    }
    return this.registry.transaction('auth', ({ transaction }) => perform(transaction));
  }

  async findPasswordResetToken(token, { transaction } = {}) {
    if (!this.PasswordResetToken) {
      return null;
    }
    if (!token || typeof token !== 'string') {
      return null;
    }
    const trimmed = token.trim();
    if (trimmed.length < 16) {
      return null;
    }

    const record = await this.PasswordResetToken.findOne({
      where: { tokenHash: hashToken(trimmed) },
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    });
    if (!record) {
      return null;
    }
    if (record.consumedAt || record.expiresAt < new Date()) {
      await record.destroy({ transaction });
      return null;
    }
    const user = await this.User.findByPk(record.userId, { transaction });
    if (!user) {
      await record.destroy({ transaction });
      return null;
    }
    return { record, user };
  }

  async incrementPasswordResetAttempt(record, { transaction } = {}) {
    if (!this.PasswordResetToken || !record) {
      return null;
    }
    const attempts = (record.attempts ?? 0) + 1;
    await record.update({ attempts }, { transaction });
    if (attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
      await record.destroy({ transaction });
      return null;
    }
    return attempts;
  }

  async consumePasswordResetToken(record, { metadata = {}, transaction } = {}) {
    if (!this.PasswordResetToken || !record) {
      return null;
    }
    const updates = {
      consumedAt: new Date(),
      attempts: (record.attempts ?? 0) + 1,
    };
    if (metadata && typeof metadata === 'object' && Object.keys(metadata).length > 0) {
      updates.metadata = { ...(record.metadata ?? {}), ...metadata };
    }
    await record.update(updates, { transaction });
    await this.PasswordResetToken.destroy({
      where: {
        userId: record.userId,
        consumedAt: { [Op.is]: null },
        id: { [Op.ne]: record.id },
      },
      transaction,
    });
    return record;
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
        'purgeExpiredPasswordResets',
        'createPasswordResetToken',
        'findPasswordResetToken',
        'incrementPasswordResetAttempt',
        'consumePasswordResetToken',
      ],
      models: Object.keys(this.models),
    };
  }
}

export default AuthDomainService;
