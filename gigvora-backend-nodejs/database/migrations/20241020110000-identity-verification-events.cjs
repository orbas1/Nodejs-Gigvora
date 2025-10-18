'use strict';

const createEnum = async (queryInterface, enumName, values) => {
  const dialect = queryInterface.sequelize.getDialect();
  if ((dialect === 'postgres' || dialect === 'postgresql') && Array.isArray(values) && values.length) {
    const escapedValues = values.map((value) => `'${value.replace(/'/g, "''")}'`).join(', ');
    await queryInterface.sequelize.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumName}') THEN CREATE TYPE "${enumName}" AS ENUM (${escapedValues}); END IF; END $$;`,
    );
  }
};

const dropEnum = async (queryInterface, enumName) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    const EVENT_TYPES = [
      'submission_created',
      'status_changed',
      'assignment_updated',
      'document_updated',
      'note_recorded',
      'metadata_updated',
    ];
    const IDENTITY_STATUSES = ['pending', 'submitted', 'in_review', 'verified', 'rejected', 'expired'];

    await createEnum(queryInterface, 'enum_identity_verification_events_eventType', EVENT_TYPES);

    await queryInterface.createTable('identity_verification_events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      identityVerificationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'identity_verifications', key: 'id' },
        onDelete: 'CASCADE',
      },
      eventType: {
        type: Sequelize.ENUM(...EVENT_TYPES),
        allowNull: false,
        defaultValue: 'note_recorded',
      },
      actorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      previousStatus: {
        type: Sequelize.ENUM(...IDENTITY_STATUSES),
        allowNull: true,
      },
      newStatus: {
        type: Sequelize.ENUM(...IDENTITY_STATUSES),
        allowNull: true,
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('identity_verification_events', ['identityVerificationId']);
    await queryInterface.addIndex('identity_verification_events', ['eventType']);
    await queryInterface.addIndex('identity_verification_events', ['actorId']);
    await queryInterface.addIndex('identity_verification_events', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('identity_verification_events');
    await dropEnum(queryInterface, 'enum_identity_verification_events_eventType');
    await dropEnum(queryInterface, 'enum_identity_verification_events_previousStatus');
    await dropEnum(queryInterface, 'enum_identity_verification_events_newStatus');
  },
};
