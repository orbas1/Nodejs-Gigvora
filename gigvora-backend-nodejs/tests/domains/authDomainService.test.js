import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import { Op } from 'sequelize';

import { AuthDomainService } from '../../src/domains/auth/authDomainService.js';
import { ValidationError } from '../../src/utils/errors.js';

class FakeUserInstance {
  constructor(values) {
    Object.assign(this, values);
  }

  get() {
    return { ...this };
  }
}

class FakeUserModel {
  static reset() {
    this.records = [];
    this.nextId = 1;
  }

  static async create(values) {
    const record = new FakeUserInstance({
      ...values,
      id: this.nextId++,
      createdAt: values.createdAt ?? new Date(),
      updatedAt: values.updatedAt ?? new Date(),
    });
    this.records.push(record);
    return record;
  }

  static async findOne({ where } = {}) {
    if (!where) {
      return this.records[0] ?? null;
    }
    if (where.email) {
      const target = where.email[Op.eq] ?? where.email;
      return this.records.find((record) => record.email === target) ?? null;
    }
    if (where.id) {
      const target = where.id[Op.eq] ?? where.id;
      return this.records.find((record) => record.id === target) ?? null;
    }
    return null;
  }

  static async findByPk(id) {
    const record = this.records.find((item) => item.id === Number(id));
    return record ? new FakeUserInstance({ ...record }) : null;
  }

  static async update(values, { where } = {}) {
    let count = 0;
    this.records = this.records.map((record) => {
      const matches = !where?.id || where.id === record.id || (where.id?.[Op.eq] ?? where.id) === record.id;
      if (matches) {
        count += 1;
        return Object.assign(record, values, { updatedAt: new Date() });
      }
      return record;
    });
    return [count];
  }
}

FakeUserModel.reset();

class FakeUserRoleModel {
  static reset() {
    this.records = [];
    this.nextId = 1;
  }

  static async findAll({ where } = {}) {
    if (!where?.userId) {
      return this.records.map((record) => ({ ...record }));
    }
    return this.records
      .filter((record) => record.userId === where.userId)
      .map((record) => ({ ...record }));
  }

  static async destroy({ where } = {}) {
    const roles = Array.isArray(where?.role) ? where.role : where?.role ? [where.role] : null;
    const initialLength = this.records.length;
    this.records = this.records.filter((record) => {
      if (where?.userId && record.userId !== where.userId) {
        return true;
      }
      if (roles && roles.length) {
        return !roles.includes(record.role);
      }
      return false;
    });
    return initialLength - this.records.length;
  }

  static async create(values) {
    const record = { ...values, id: this.nextId++ };
    this.records.push(record);
    return record;
  }
}

FakeUserRoleModel.reset();

class FakeUserNoteInstance {
  constructor(values) {
    Object.assign(this, values);
  }

  get() {
    return { ...this };
  }
}

class FakeUserNoteModel {
  static reset() {
    this.records = [];
    this.nextId = 1;
  }

  static async create(values) {
    const record = new FakeUserNoteInstance({
      ...values,
      id: this.nextId++,
      createdAt: values.createdAt ?? new Date(),
      updatedAt: values.updatedAt ?? new Date(),
    });
    this.records.push(record);
    return record;
  }

  static async findAndCountAll({ where, limit = 20, offset = 0, order } = {}) {
    const filtered = this.records
      .filter((record) => (where?.userId ? record.userId === where.userId : true))
      .sort((a, b) => {
        if (!Array.isArray(order) || !order.length) {
          return 0;
        }
        const [field, direction] = order[0];
        const aValue = a[field];
        const bValue = b[field];
        if (!(aValue instanceof Date) || !(bValue instanceof Date)) {
          return 0;
        }
        return direction === 'DESC' ? bValue - aValue : aValue - bValue;
      });

    const slice = filtered.slice(offset, offset + limit);
    return {
      rows: slice.map((record) => new FakeUserNoteInstance({ ...record })),
      count: filtered.length,
    };
  }
}

FakeUserNoteModel.reset();

class FakeUserLoginAuditModel {
  static reset() {
    this.records = [];
    this.nextId = 1;
  }

  static async create(values) {
    const record = {
      ...values,
      id: this.nextId++,
      createdAt: values.createdAt ?? new Date(),
    };
    this.records.push(record);
    return {
      ...record,
      get() {
        return { ...record };
      },
    };
  }
}

FakeUserLoginAuditModel.reset();

function buildRegistry() {
  const models = {
    auth: {
      User: FakeUserModel,
      UserLoginAudit: FakeUserLoginAuditModel,
      UserRole: FakeUserRoleModel,
      UserNote: FakeUserNoteModel,
    },
  };

  return {
    getContextModels(name) {
      if (!models[name]) {
        throw new Error(`Unknown domain context: ${name}`);
      }
      return models[name];
    },
    async transaction(name, handler) {
      if (!models[name]) {
        throw new Error(`Unknown domain context: ${name}`);
      }
      return handler({ transaction: null, context: { name } });
    },
  };
}

function buildService() {
  const registry = buildRegistry();
  const logger = {
    child() {
      return this;
    },
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };
  const service = new AuthDomainService({ domainRegistry: registry, logger });
  return { service, logger };
}

describe('AuthDomainService', () => {
  beforeEach(() => {
    FakeUserModel.reset();
    FakeUserRoleModel.reset();
    FakeUserNoteModel.reset();
    FakeUserLoginAuditModel.reset();
  });

  it('registers a user with secure defaults and sanitisation', async () => {
    const { service } = buildService();
    const payload = {
      email: 'New.User@Example.com',
      password: 'StrongPass#123',
      firstName: 'New',
      lastName: 'User',
      address: '123 Remote Lane',
      location: 'Remote, Earth',
      geoLocation: { lat: 10, lng: 20 },
      phoneNumber: '+1234567890',
      status: 'invited',
    };

    const registered = await service.registerUser(payload);

    expect(registered.email).toBe('new.user@example.com');
    expect(registered.status).toBe('invited');
    expect(registered.memberships).toContain('user');
    expect(registered.twoFactorEnabled).toBe(true);
    expect(registered.twoFactorMethod).toBe('email');

    const stored = FakeUserModel.records[0];
    expect(stored.password).not.toBe(payload.password);
    await expect(service.comparePassword(stored, payload.password)).resolves.toBe(true);
  });

  it('prevents duplicate registrations via ensureUniqueEmail', async () => {
    const { service } = buildService();
    const payload = {
      email: 'duplicate@example.com',
      password: 'AnotherPass#321',
    };

    await service.registerUser(payload);
    await expect(service.registerUser(payload)).rejects.toThrow(ValidationError);
  });

  it('enforces assignable roles when replacing roles', async () => {
    const { service } = buildService();
    const payload = {
      email: 'roles@example.com',
      password: 'RolesPass#456',
    };

    const user = await service.registerUser(payload);

    const roles = await service.replaceRoles(user.id, ['Admin', 'Support']);
    expect(roles).toEqual(['admin', 'support']);

    const listed = await service.listRoles(user.id);
    expect(listed).toEqual(['admin', 'support']);

    const updated = await service.replaceRoles(user.id, ['Support']);
    expect(updated).toEqual(['support']);
    expect(await service.listRoles(user.id)).toEqual(['support']);

    await expect(service.replaceRoles(user.id, ['unknown-role'])).rejects.toThrow(ValidationError);
  });

  it('records and retrieves secure user notes', async () => {
    const { service } = buildService();
    const user = await service.registerUser({
      email: 'note@example.com',
      password: 'Notes#789',
    });

    await expect(service.recordUserNote(user.id, { body: '   ' })).rejects.toThrow(ValidationError);

    const note = await service.recordUserNote(
      user.id,
      { authorId: 42, body: 'Trusted analyst note', visibility: 'internal' },
      {},
    );

    expect(note.body).toBe('Trusted analyst note');
    expect(note.authorId).toBe(42);

    const { items, pagination } = await service.listUserNotes(user.id, { limit: 10, offset: 0 });
    expect(pagination.count).toBe(1);
    expect(items).toHaveLength(1);
    expect(items[0].body).toBe('Trusted analyst note');
  });

  it('records login audit events for telemetry', async () => {
    const { service } = buildService();
    const user = await service.registerUser({
      email: 'audit@example.com',
      password: 'Audit#987',
    });

    const audit = await service.recordLoginAudit(
      user.id,
      { eventType: 'login', ipAddress: '127.0.0.1', userAgent: 'Jest' },
      {},
    );

    expect(audit.userId).toBe(user.id);
    expect(audit.eventType).toBe('login');
    expect(FakeUserLoginAuditModel.records).toHaveLength(1);
  });

  it('normalises two-factor preferences to supported policies', () => {
    const { service } = buildService();
    const enabled = service.normalizeTwoFactorPreference({ twoFactorEnabled: true, twoFactorMethod: 'SMS' });
    expect(enabled).toEqual({ twoFactorEnabled: true, twoFactorMethod: 'sms' });

    const disabled = service.normalizeTwoFactorPreference({ twoFactorEnabled: false, twoFactorMethod: 'app' });
    expect(disabled).toEqual({ twoFactorEnabled: false, twoFactorMethod: 'email' });
  });
});
