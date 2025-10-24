'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('message_read_receipts', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      messageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'messages', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      participantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'message_participants', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      deliveredAt: { type: Sequelize.DATE, allowNull: true },
      readAt: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('message_read_receipts', {
      fields: ['messageId', 'participantId'],
      type: 'unique',
      name: 'message_read_receipts_message_participant_unique',
    });

    await queryInterface.addIndex('message_read_receipts', ['messageId']);
    await queryInterface.addIndex('message_read_receipts', ['participantId']);
    await queryInterface.addIndex('message_read_receipts', ['userId']);
    await queryInterface.addIndex('message_read_receipts', ['readAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('message_read_receipts');
  },
};
