import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { Sequelize as SequelizeLib, DataTypes } from 'sequelize';

import agencyIntegrationsMigration from '../../database/migrations/20241010120000-agency-integrations.cjs';
import networkingMigration from '../../database/migrations/20241012091500-freelancer-networking.cjs';
import reviewMigration from '../../database/migrations/20241012091500-freelancer-review-management.cjs';

const baseColumns = () => ({
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: SequelizeLib.literal('CURRENT_TIMESTAMP') },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: SequelizeLib.literal('CURRENT_TIMESTAMP') },
});

const baseTimestamps = () => ({ createdAt: new Date(), updatedAt: new Date() });

const createUsersTable = async (queryInterface) => {
  await queryInterface.createTable('users', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.STRING, allowNull: true },
    ...baseColumns(),
  });
};

const insertUser = (queryInterface, overrides = {}) =>
  queryInterface.bulkInsert('users', [{ email: 'user@example.test', role: 'member', ...baseTimestamps(), ...overrides }]);

describe('20241010120000-agency-integrations.cjs', () => {
  let sequelize;
  let queryInterface;

  beforeEach(async () => {
    sequelize = new SequelizeLib('sqlite::memory:', { logging: false });
    queryInterface = sequelize.getQueryInterface();

    await createUsersTable(queryInterface);
    await queryInterface.createTable('workspace_integrations', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
      ...baseColumns(),
    });

    await insertUser(queryInterface, { id: 1 });
    await queryInterface.bulkInsert('workspace_integrations', [
      { id: 1, name: 'crm', status: 'active', ...baseTimestamps() },
    ]);
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('applies and reverts integration secret protections', async () => {
    await agencyIntegrationsMigration.up(queryInterface, SequelizeLib);

    await queryInterface.bulkInsert('workspace_integration_secrets', [
      {
        integrationId: 1,
        name: 'primary',
        secretType: 'api_key',
        hashAlgorithm: 'pbkdf2_sha512',
        hashedValue: 'hash-one',
        salt: 'salt-one',
        lastFour: '1234',
        version: 1,
        metadata: null,
        rotatedById: 1,
        ...baseTimestamps(),
      },
    ]);

    await expect(
      queryInterface.bulkInsert('workspace_integration_secrets', [
        {
          integrationId: 1,
          name: 'primary',
          secretType: 'api_key',
          hashAlgorithm: 'pbkdf2_sha512',
          hashedValue: 'hash-two',
          salt: 'salt-two',
          version: 1,
          ...baseTimestamps(),
        },
      ]),
    ).rejects.toThrow();

    const auditShape = await queryInterface.describeTable('workspace_integration_audit_logs');
    expect(auditShape.requestId).toBeDefined();
    expect(auditShape.ipAddress).toBeDefined();

    await agencyIntegrationsMigration.down(queryInterface);
    await expect(queryInterface.describeTable('workspace_integration_secrets')).rejects.toThrow();
  });
});

describe('20241012091500-freelancer-networking.cjs', () => {
  let sequelize;
  let queryInterface;

  beforeEach(async () => {
    sequelize = new SequelizeLib('sqlite::memory:', { logging: false });
    queryInterface = sequelize.getQueryInterface();

    await createUsersTable(queryInterface);
    await queryInterface.createTable('networking_sessions', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: DataTypes.STRING, allowNull: false },
      ...baseColumns(),
    });
    await queryInterface.createTable('networking_session_signups', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      sessionId: { type: DataTypes.INTEGER, allowNull: false },
      attendeeEmail: { type: DataTypes.STRING, allowNull: true },
      ...baseColumns(),
    });

    await insertUser(queryInterface, { id: 1 });
    await insertUser(queryInterface, { id: 2, email: 'second@example.test' });
    await queryInterface.bulkInsert('networking_sessions', [
      { id: 1, title: 'Demo networking', ...baseTimestamps() },
    ]);
    await queryInterface.bulkInsert('networking_session_signups', [
      { id: 10, sessionId: 1, attendeeEmail: 'alpha@example.test', ...baseTimestamps() },
      { id: 11, sessionId: 1, attendeeEmail: 'beta@example.test', ...baseTimestamps() },
    ]);
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('adds monetisation and connection tracking safely', async () => {
    await networkingMigration.up(queryInterface, SequelizeLib);

    const signupSchema = await queryInterface.describeTable('networking_session_signups');
    expect(signupSchema.paymentStatus).toBeDefined();
    expect(signupSchema.purchaseCents).toBeDefined();

    await queryInterface.bulkInsert('networking_connections', [
      {
        sessionId: 1,
        sourceSignupId: 10,
        targetSignupId: 11,
        sourceParticipantId: 1,
        targetParticipantId: 2,
        connectionType: 'follow',
        status: 'new',
        createdById: 1,
        ...baseTimestamps(),
      },
    ]);

    await expect(
      queryInterface.bulkInsert('networking_connections', [
        {
          sessionId: 1,
          sourceSignupId: 10,
          targetSignupId: 11,
          connectionType: 'follow',
          status: 'new',
          ...baseTimestamps(),
        },
      ]),
    ).rejects.toThrow();

    await networkingMigration.down(queryInterface);
    await expect(queryInterface.describeTable('networking_connections')).rejects.toThrow();
    const revertedSchema = await queryInterface.describeTable('networking_session_signups');
    expect(revertedSchema.paymentStatus).toBeUndefined();
    expect(revertedSchema.purchaseCents).toBeUndefined();
  });
});

describe('20241012091500-freelancer-review-management.cjs', () => {
  let sequelize;
  let queryInterface;

  beforeEach(async () => {
    sequelize = new SequelizeLib('sqlite::memory:', { logging: false });
    queryInterface = sequelize.getQueryInterface();

    await createUsersTable(queryInterface);
    await insertUser(queryInterface, { id: 42, email: 'freelancer@example.test' });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('enforces rating bounds and uniqueness', async () => {
    await reviewMigration.up(queryInterface, SequelizeLib);

    await queryInterface.bulkInsert('freelancer_reviews', [
      {
        freelancerId: 42,
        title: 'Great collaborator',
        status: 'published',
        highlighted: true,
        rating: 4.5,
        body: 'High quality delivery',
        reviewSource: 'project_portal',
        reviewerName: 'Project Owner',
        reviewerEmail: 'owner@example.test',
        responses: JSON.stringify([]),
        attachments: JSON.stringify([]),
        tags: JSON.stringify([]),
        ...baseTimestamps(),
      },
    ]);

    await expect(
      queryInterface.bulkInsert('freelancer_reviews', [
        {
          freelancerId: 42,
          title: 'Great collaborator',
          status: 'draft',
          highlighted: false,
          body: 'Duplicate title is blocked',
          ...baseTimestamps(),
        },
      ]),
    ).rejects.toThrow();

    await expect(
      queryInterface.bulkInsert('freelancer_reviews', [
        {
          freelancerId: 42,
          title: 'Out of range rating',
          status: 'draft',
          highlighted: false,
          rating: 6,
          body: 'Should fail',
          ...baseTimestamps(),
        },
      ]),
    ).rejects.toThrow();

    await reviewMigration.down(queryInterface);
    await expect(queryInterface.describeTable('freelancer_reviews')).rejects.toThrow();
  });
});
