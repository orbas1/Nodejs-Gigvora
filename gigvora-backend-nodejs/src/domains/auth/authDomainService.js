import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { normalizeLocationPayload } from '../../utils/location.js';
import { ValidationError } from '../../utils/errors.js';

const EMAIL_REGEX = /^(?:[A-Za-z0-9_'^&+{}=-]+(?:\.[A-Za-z0-9_'^&+{}=-]+)*)@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/u;
const PASSWORD_MIN_LENGTH = 8;

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
  const memberships = new Set();
  if (Array.isArray(plain.memberships)) {
    plain.memberships.filter(Boolean).forEach((item) => memberships.add(item));
  }
  if (plain.userType) {
    memberships.add(plain.userType);
  }
  if (memberships.size === 0) {
    memberships.add('user');
  }
  const fullName = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim() || plain.email;
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
    userType: plain.userType,
    twoFactorEnabled: plain.twoFactorEnabled !== false,
    twoFactorMethod: plain.twoFactorMethod || 'email',
    lastLoginAt: plain.lastLoginAt || null,
    googleId: plain.googleId || null,
    memberships: Array.from(memberships),
    primaryDashboard: plain.primaryDashboard || plain.userType || 'user',
  };
}

export class AuthDomainService {
  constructor({ domainRegistry, logger }) {
    this.registry = domainRegistry;
    this.logger = createLogger(logger);
    this.models = domainRegistry.getContextModels('auth');
    this.User = this.models.User;
    if (!this.User) {
      throw new Error('Auth domain requires the User model to be registered.');
    }
    this.UserLoginAudit = this.models.UserLoginAudit;
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
    await this.User.update({ lastLoginAt: new Date() }, { where: { id: userId }, transaction });
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
}

export default AuthDomainService;
