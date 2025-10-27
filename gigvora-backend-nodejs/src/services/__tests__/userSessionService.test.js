import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Sequelize, DataTypes } from 'sequelize';

const modelsModulePath = new URL('../../models/index.js', import.meta.url).pathname;

const testDb = new Sequelize('sqlite::memory:', { logging: false });

const UserRefreshSession = testDb.define(
  'UserRefreshSession',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    tokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    ipAddress: { type: DataTypes.STRING(128), allowNull: true },
    userAgent: { type: DataTypes.STRING(1024), allowNull: true },
    context: { type: DataTypes.JSON, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
    revokedReason: { type: DataTypes.STRING(120), allowNull: true },
    revokedById: { type: DataTypes.INTEGER, allowNull: true },
    revocationContext: { type: DataTypes.JSON, allowNull: true },
    replacedByTokenHash: { type: DataTypes.STRING(128), allowNull: true },
    deviceFingerprint: { type: DataTypes.STRING(128), allowNull: true },
    deviceLabel: { type: DataTypes.STRING(180), allowNull: true },
    riskLevel: { type: DataTypes.ENUM('low', 'medium', 'high'), allowNull: false, defaultValue: 'low' },
    riskScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    riskSignals: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: 'user_refresh_sessions' },
);

await jest.unstable_mockModule(modelsModulePath, () => ({
  __esModule: true,
  UserRefreshSession,
}));

const serviceModule = await import('../userSessionService.js');
const { listActiveSessions, revokeUserSession } = serviceModule;

describe('userSessionService', () => {
  beforeAll(async () => {
    await testDb.sync({ force: true });
  });

  beforeEach(async () => {
    await UserRefreshSession.destroy({ where: {} });
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('lists active sessions with sanitised metadata and stats', async () => {
    const now = Date.now();
    await UserRefreshSession.bulkCreate([
      {
        userId: 55,
        tokenHash: 'hash-a',
        ipAddress: '198.51.100.10',
        userAgent: 'Chrome/124.0',
        context: {
          additional: {
            location: { city: 'New York', country: 'US' },
            timezone: 'America/New_York',
            deviceLabel: 'MacBook Pro',
          },
        },
        riskLevel: 'high',
        riskScore: 82,
        riskSignals: ['ip_velocity'],
        expiresAt: new Date(now + 86_400_000),
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-01T11:00:00Z'),
      },
      {
        userId: 55,
        tokenHash: 'hash-b',
        ipAddress: '203.0.113.44',
        userAgent: 'Safari/17.4',
        context: { additional: { location: { label: 'London' } } },
        riskLevel: 'medium',
        riskScore: 35,
        riskSignals: ['new_device'],
        expiresAt: new Date(now + 172_800_000),
      },
      {
        userId: 55,
        tokenHash: 'hash-expired',
        ipAddress: '192.0.2.20',
        userAgent: 'Edge',
        context: {},
        riskLevel: 'low',
        riskScore: 5,
        expiresAt: new Date(now - 3600_000),
      },
    ]);

    const result = await listActiveSessions(55);

    expect(result.items).toHaveLength(2);
    const highRisk = result.items.find((entry) => entry.riskLevel === 'high');
    expect(highRisk).toMatchObject({
      userId: 55,
      riskLevel: 'high',
      riskScore: 82,
      locationLabel: 'New York, US',
      timezone: 'America/New_York',
      deviceLabel: 'MacBook Pro',
    });
    expect(result.stats).toMatchObject({
      totalActive: 2,
      highRiskCount: 1,
      mediumRiskCount: 1,
    });
  });

  it('revokes a session and sanitises the response', async () => {
    const record = await UserRefreshSession.create({
      userId: 77,
      tokenHash: 'hash-c',
      ipAddress: '198.51.100.5',
      userAgent: 'Firefox',
      riskLevel: 'low',
      riskScore: 12,
      context: null,
    });

    const revoked = await revokeUserSession(77, record.id, {
      actorId: 77,
      reason: ' user requested logout ',
      context: { ipAddress: '198.51.100.5', userAgent: 'Firefox', note: 'logout' },
    });

    expect(revoked).toMatchObject({
      id: record.id,
      revokedReason: 'user requested logout',
      revokedById: 77,
    });
    expect(revoked.revokedAt).toBeTruthy();

    const updated = await UserRefreshSession.findByPk(record.id);
    expect(updated.revokedAt).not.toBeNull();
    expect(updated.revocationContext).toMatchObject({
      ipAddress: '198.51.100.5',
      userAgent: 'Firefox',
      note: 'logout',
    });
  });
});

