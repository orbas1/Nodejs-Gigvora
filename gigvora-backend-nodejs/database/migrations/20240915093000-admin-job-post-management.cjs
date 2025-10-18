import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('job_post_admin_details', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'jobs', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'draft' },
    visibility: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'public' },
    workflowStage: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'draft' },
    approvalStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'pending_review' },
    approvalNotes: { type: DataTypes.TEXT, allowNull: true },
    applicationUrl: { type: DataTypes.STRING(2048), allowNull: true },
    applicationEmail: { type: DataTypes.STRING(255), allowNull: true },
    applicationInstructions: { type: DataTypes.TEXT, allowNull: true },
    salaryMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    salaryMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: true },
    compensationType: { type: DataTypes.STRING(40), allowNull: true },
    workplaceType: { type: DataTypes.STRING(40), allowNull: true },
    contractType: { type: DataTypes.STRING(40), allowNull: true },
    experienceLevel: { type: DataTypes.STRING(40), allowNull: true },
    department: { type: DataTypes.STRING(120), allowNull: true },
    team: { type: DataTypes.STRING(120), allowNull: true },
    hiringManagerName: { type: DataTypes.STRING(120), allowNull: true },
    hiringManagerEmail: { type: DataTypes.STRING(255), allowNull: true },
    recruiterName: { type: DataTypes.STRING(120), allowNull: true },
    recruiterEmail: { type: DataTypes.STRING(255), allowNull: true },
    tags: { type: DataTypes.JSON, allowNull: true },
    benefits: { type: DataTypes.JSON, allowNull: true },
    responsibilities: { type: DataTypes.JSON, allowNull: true },
    requirements: { type: DataTypes.JSON, allowNull: true },
    attachments: { type: DataTypes.JSON, allowNull: true },
    promotionFlags: { type: DataTypes.JSON, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    archivedAt: { type: DataTypes.DATE, allowNull: true },
    archiveReason: { type: DataTypes.STRING(255), allowNull: true },
    externalReference: { type: DataTypes.STRING(120), allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('job_post_admin_details', ['jobId']);
  await queryInterface.addIndex('job_post_admin_details', ['status']);
  await queryInterface.addIndex('job_post_admin_details', ['visibility']);
  await queryInterface.addIndex('job_post_admin_details', ['workflowStage']);
  await queryInterface.addIndex('job_post_admin_details', ['approvalStatus']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('job_post_admin_details');
}
