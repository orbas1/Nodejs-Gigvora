import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
  await queryInterface.createTable('message_labels', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
    },
    color: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: '#2563eb',
    },
    description: {
      type: DataTypes.STRING(400),
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.createTable('message_thread_labels', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    threadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'message_threads', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    labelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'message_labels', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    appliedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    appliedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex('message_thread_labels', ['threadId', 'labelId'], {
    unique: true,
    name: 'message_thread_labels_unique_pair',
  });
  await queryInterface.addIndex('message_thread_labels', ['labelId']);
  await queryInterface.addIndex('message_thread_labels', ['threadId']);
  await queryInterface.addIndex('message_labels', ['createdBy']);
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('message_thread_labels', 'message_thread_labels_unique_pair');
  await queryInterface.removeIndex('message_thread_labels', ['labelId']);
  await queryInterface.removeIndex('message_thread_labels', ['threadId']);
  await queryInterface.removeIndex('message_labels', ['createdBy']);
  await queryInterface.dropTable('message_thread_labels');
  await queryInterface.dropTable('message_labels');
}
