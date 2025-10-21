import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Sequelize, DataTypes } from 'sequelize';

let sequelize;
let queryInterface;
let agencyProfileExpansion;
let agencyProfileManagement;

function normalizeTableNames(tables) {
  return tables.map((table) => {
    if (typeof table === 'string') {
      return table;
    }
    if (table && typeof table === 'object') {
      return table.tableName || table.name || table.tbl_name || table.tblName;
    }
    return table;
  });
}

describe('Agency profile migrations', () => {
  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    queryInterface = sequelize.getQueryInterface();
    ({ default: agencyProfileExpansion } = await import(
      '../../database/migrations/20240915113000-agency-profile-expansion.cjs'
    ));
    ({ default: agencyProfileManagement } = await import(
      '../../database/migrations/20240915120000-agency-profile-management.cjs'
    ));
  });

  beforeEach(async () => {
    await queryInterface.dropAllTables();
    await queryInterface.createTable('agency_profiles', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('applies and rolls back the agency profile expansion safely across dialects', async () => {
    await expect(agencyProfileExpansion.up(queryInterface, Sequelize)).resolves.not.toThrow();

    const expandedColumns = await queryInterface.describeTable('agency_profiles');
    expect(expandedColumns.tagline).toBeDefined();
    expect(expandedColumns.services).toBeDefined();
    expect(expandedColumns.socialLinks).toBeDefined();

    await expect(agencyProfileExpansion.down(queryInterface, Sequelize)).resolves.not.toThrow();

    const rolledBackColumns = await queryInterface.describeTable('agency_profiles');
    expect(rolledBackColumns.tagline).toBeUndefined();
    expect(rolledBackColumns.services).toBeUndefined();
    expect(rolledBackColumns.socialLinks).toBeUndefined();
  });

  it('runs management migration after expansion without duplicating schema artifacts', async () => {
    await agencyProfileExpansion.up(queryInterface, Sequelize);

    await expect(agencyProfileManagement.up(queryInterface, Sequelize)).resolves.not.toThrow();

    const profileColumns = await queryInterface.describeTable('agency_profiles');
    expect(profileColumns.description).toBeDefined();
    expect(profileColumns.introVideoUrl).toBeDefined();
    expect(profileColumns.bannerImageUrl).toBeDefined();
    expect(profileColumns.profileImageUrl).toBeDefined();
    expect(profileColumns.workforceAvailable).toBeDefined();
    expect(profileColumns.tagline).toBeDefined();

    const tables = normalizeTableNames(await queryInterface.showAllTables());
    expect(tables).toEqual(
      expect.arrayContaining([
        'agency_profile_media',
        'agency_profile_skills',
        'agency_profile_credentials',
        'agency_profile_experiences',
        'agency_profile_workforce_segments',
        'agency_profiles',
      ]),
    );

    await expect(agencyProfileManagement.down(queryInterface)).resolves.not.toThrow();

    const tablesAfterDown = normalizeTableNames(await queryInterface.showAllTables());
    expect(tablesAfterDown).not.toContain('agency_profile_media');
    expect(tablesAfterDown).not.toContain('agency_profile_skills');

    const columnsAfterDown = await queryInterface.describeTable('agency_profiles');
    expect(columnsAfterDown.description).toBeUndefined();
    expect(columnsAfterDown.introVideoUrl).toBeUndefined();
    expect(columnsAfterDown.bannerImageUrl).toBeUndefined();
    expect(columnsAfterDown.profileImageUrl).toBeUndefined();
    expect(columnsAfterDown.workforceAvailable).toBeUndefined();
    expect(columnsAfterDown.tagline).toBeDefined();

    await expect(agencyProfileExpansion.down(queryInterface, Sequelize)).resolves.not.toThrow();
  });
});
