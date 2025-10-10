import { Sequelize, DataTypes, Op } from 'sequelize';
import databaseConfig from '../config/database.js';

const { url: databaseUrl, ...sequelizeOptions } = databaseConfig;

export const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, sequelizeOptions)
  : new Sequelize(sequelizeOptions);

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const APPLICATION_TARGET_TYPES = ['job', 'gig', 'project', 'launchpad', 'volunteer'];
export const APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'shortlisted',
  'interview',
  'offered',
  'hired',
  'rejected',
  'withdrawn',
];
export const APPLICATION_REVIEW_STAGES = ['screen', 'interview', 'assessment', 'final', 'offer'];
export const APPLICATION_REVIEW_DECISIONS = ['pending', 'advance', 'reject', 'hold', 'withdrawn'];
export const MESSAGE_CHANNEL_TYPES = ['support', 'project', 'contract', 'group', 'direct'];
export const MESSAGE_THREAD_STATES = ['active', 'archived', 'locked'];
export const MESSAGE_TYPES = ['text', 'file', 'system', 'event'];
export const NOTIFICATION_CATEGORIES = ['system', 'message', 'project', 'financial', 'compliance', 'marketing'];
export const NOTIFICATION_PRIORITIES = ['low', 'normal', 'high', 'critical'];
export const NOTIFICATION_STATUSES = ['pending', 'delivered', 'read', 'dismissed'];
export const DIGEST_FREQUENCIES = ['immediate', 'daily', 'weekly'];
export const ANALYTICS_ACTOR_TYPES = ['user', 'system', 'anonymous'];
export const PROVIDER_WORKSPACE_TYPES = ['agency', 'company', 'recruiter', 'partner'];
export const PROVIDER_WORKSPACE_MEMBER_ROLES = ['owner', 'admin', 'manager', 'staff', 'viewer'];
export const PROVIDER_WORKSPACE_MEMBER_STATUSES = ['pending', 'active', 'suspended', 'revoked'];
export const PROVIDER_WORKSPACE_INVITE_STATUSES = ['pending', 'accepted', 'expired', 'revoked'];
export const PROVIDER_CONTACT_NOTE_VISIBILITIES = ['internal', 'shared', 'compliance'];

export const User = sequelize.define(
  'User',
  {
    firstName: { type: DataTypes.STRING(120), allowNull: false },
    lastName: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(255), unique: true, allowNull: false, validate: { isEmail: true } },
    password: { type: DataTypes.STRING(255), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: true },
    age: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 13 } },
    userType: {
      type: DataTypes.ENUM('user', 'company', 'freelancer', 'agency', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
  },
  {
    tableName: 'users',
    indexes: [{ fields: ['email'] }],
  },
);

User.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  return User.findAll({
    where: {
      [Op.or]: [
        { firstName: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
        { lastName: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
        { email: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
      ],
    },
    limit: 20,
    order: [['lastName', 'ASC']],
  });
};

export const Profile = sequelize.define(
  'Profile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    skills: { type: DataTypes.TEXT, allowNull: true },
    experience: { type: DataTypes.TEXT, allowNull: true },
    education: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'profiles' },
);

export const CompanyProfile = sequelize.define(
  'CompanyProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    companyName: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    website: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'company_profiles' },
);

export const AgencyProfile = sequelize.define(
  'AgencyProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    agencyName: { type: DataTypes.STRING(255), allowNull: false },
    focusArea: { type: DataTypes.STRING(255), allowNull: true },
    website: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'agency_profiles' },
);

export const FreelancerProfile = sequelize.define(
  'FreelancerProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: true },
    hourlyRate: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    availability: { type: DataTypes.STRING(120), allowNull: true },
  },
  { tableName: 'freelancer_profiles' },
);

export const FeedPost = sequelize.define(
  'FeedPost',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    visibility: { type: DataTypes.ENUM('public', 'connections'), defaultValue: 'public', allowNull: false },
  },
  { tableName: 'feed_posts' },
);

export const Job = sequelize.define(
  'Job',
  {
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    location: { type: DataTypes.STRING(255), allowNull: true },
    employmentType: { type: DataTypes.STRING(120), allowNull: true },
  },
  { tableName: 'jobs' },
);

Job.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  return Job.findAll({
    where: { title: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
    limit: 20,
    order: [['title', 'ASC']],
  });
};

export const Gig = sequelize.define(
  'Gig',
  {
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    budget: { type: DataTypes.STRING(120), allowNull: true },
    duration: { type: DataTypes.STRING(120), allowNull: true },
  },
  { tableName: 'gigs' },
);

Gig.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  return Gig.findAll({
    where: { title: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
    limit: 20,
    order: [['title', 'ASC']],
  });
};

export const Project = sequelize.define(
  'Project',
  {
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING(120), allowNull: true },
  },
  { tableName: 'projects' },
);

Project.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  return Project.findAll({
    where: { title: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
    limit: 20,
    order: [['title', 'ASC']],
  });
};

export const ExperienceLaunchpad = sequelize.define(
  'ExperienceLaunchpad',
  {
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    track: { type: DataTypes.STRING(120), allowNull: false },
  },
  { tableName: 'experience_launchpads' },
);

ExperienceLaunchpad.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  return ExperienceLaunchpad.findAll({
    where: { title: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
    limit: 20,
    order: [['title', 'ASC']],
  });
};

export const Volunteering = sequelize.define(
  'Volunteering',
  {
    title: { type: DataTypes.STRING(255), allowNull: false },
    organization: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
  },
  { tableName: 'volunteering_roles' },
);

Volunteering.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  return Volunteering.findAll({
    where: { title: { [Op.iLike ?? Op.like]: `%${sanitizedTerm}%` } },
    limit: 20,
    order: [['title', 'ASC']],
  });
};

export const Group = sequelize.define(
  'Group',
  {
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'groups' },
);

export const GroupMembership = sequelize.define(
  'GroupMembership',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    groupId: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'member' },
  },
  { tableName: 'group_memberships' },
);

export const Connection = sequelize.define(
  'Connection',
  {
    requesterId: { type: DataTypes.INTEGER, allowNull: false },
    addresseeId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
    },
  },
  { tableName: 'connections' },
);

export const TwoFactorToken = sequelize.define(
  'TwoFactorToken',
  {
    email: { type: DataTypes.STRING(255), primaryKey: true },
    code: { type: DataTypes.STRING(6), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  { tableName: 'two_factor_tokens', timestamps: false },
);

export const Application = sequelize.define(
  'Application',
  {
    applicantId: { type: DataTypes.INTEGER, allowNull: false },
    targetType: {
      type: DataTypes.ENUM(...APPLICATION_TARGET_TYPES),
      allowNull: false,
      validate: { isIn: [APPLICATION_TARGET_TYPES] },
    },
    targetId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...APPLICATION_STATUSES),
      allowNull: false,
      defaultValue: 'submitted',
      validate: { isIn: [APPLICATION_STATUSES] },
    },
    sourceChannel: {
      type: DataTypes.ENUM('web', 'mobile', 'referral', 'agency', 'import'),
      allowNull: false,
      defaultValue: 'web',
    },
    coverLetter: { type: DataTypes.TEXT, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    rateExpectation: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    currencyCode: { type: DataTypes.STRING(3), allowNull: true },
    availabilityDate: { type: DataTypes.DATEONLY, allowNull: true },
    isArchived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    decisionAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'applications',
    defaultScope: { where: { isArchived: false } },
    scopes: {
      archived: { where: { isArchived: true } },
      byStatus(status) {
        return { where: { status } };
      },
    },
    indexes: [
      { fields: ['applicantId'] },
      { fields: ['targetType', 'targetId'] },
      { fields: ['status'] },
    ],
  },
);

Application.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  let sanitizedMetadata = null;
  if (plain.metadata && typeof plain.metadata === 'object') {
    sanitizedMetadata = Object.fromEntries(
      Object.entries(plain.metadata).filter(([key]) => !/^(_|internal|private)/i.test(key)),
    );
  }

  return {
    id: plain.id,
    applicantId: plain.applicantId,
    targetType: plain.targetType,
    targetId: plain.targetId,
    status: plain.status,
    sourceChannel: plain.sourceChannel,
    coverLetter: plain.coverLetter,
    attachments: plain.attachments,
    rateExpectation: plain.rateExpectation,
    currencyCode: plain.currencyCode,
    availabilityDate: plain.availabilityDate,
    isArchived: plain.isArchived,
    submittedAt: plain.submittedAt,
    decisionAt: plain.decisionAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    metadata: sanitizedMetadata,
  };
};

Application.paginate = async function paginate({
  where = {},
  include = [],
  order = [['updatedAt', 'DESC']],
  page = 1,
  pageSize = 25,
}) {
  const limit = Math.min(Math.max(pageSize, 1), 100);
  const offset = (Math.max(page, 1) - 1) * limit;
  const { rows, count } = await Application.findAndCountAll({ where, include, order, limit, offset });
  return {
    results: rows,
    total: count,
    page: Math.max(page, 1),
    pageSize: limit,
    totalPages: Math.ceil(count / limit) || 1,
  };
};

export const ApplicationReview = sequelize.define(
  'ApplicationReview',
  {
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    reviewerId: { type: DataTypes.INTEGER, allowNull: true },
    stage: {
      type: DataTypes.ENUM(...APPLICATION_REVIEW_STAGES),
      allowNull: false,
      validate: { isIn: [APPLICATION_REVIEW_STAGES] },
    },
    decision: {
      type: DataTypes.ENUM(...APPLICATION_REVIEW_DECISIONS),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [APPLICATION_REVIEW_DECISIONS] },
    },
    score: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0, max: 100 } },
    notes: { type: DataTypes.TEXT, allowNull: true },
    decidedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'application_reviews',
    indexes: [
      { fields: ['applicationId'] },
      { fields: ['reviewerId'] },
      { fields: ['stage'] },
    ],
  },
);

ApplicationReview.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

export const MessageThread = sequelize.define(
  'MessageThread',
  {
    subject: { type: DataTypes.STRING(255), allowNull: true },
    channelType: {
      type: DataTypes.ENUM(...MESSAGE_CHANNEL_TYPES),
      allowNull: false,
      defaultValue: 'direct',
    },
    state: {
      type: DataTypes.ENUM(...MESSAGE_THREAD_STATES),
      allowNull: false,
      defaultValue: 'active',
    },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    lastMessageAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'message_threads',
    scopes: {
      active: { where: { state: 'active' } },
    },
  },
);

export const MessageParticipant = sequelize.define(
  'MessageParticipant',
  {
    threadId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    role: {
      type: DataTypes.ENUM('owner', 'participant', 'support', 'system'),
      allowNull: false,
      defaultValue: 'participant',
    },
    notificationsEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    mutedUntil: { type: DataTypes.DATE, allowNull: true },
    lastReadAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'message_participants',
    indexes: [
      { unique: true, fields: ['threadId', 'userId'] },
      { fields: ['userId'] },
    ],
  },
);

export const Message = sequelize.define(
  'Message',
  {
    threadId: { type: DataTypes.INTEGER, allowNull: false },
    senderId: { type: DataTypes.INTEGER, allowNull: true },
    messageType: {
      type: DataTypes.ENUM(...MESSAGE_TYPES),
      allowNull: false,
      defaultValue: 'text',
    },
    body: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    isEdited: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    editedAt: { type: DataTypes.DATE, allowNull: true },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'messages',
    paranoid: true,
    deletedAt: 'deletedAt',
    indexes: [
      { fields: ['threadId'] },
      { fields: ['senderId'] },
      { fields: ['createdAt'] },
    ],
  },
);

export const MessageAttachment = sequelize.define(
  'MessageAttachment',
  {
    messageId: { type: DataTypes.INTEGER, allowNull: false },
    storageKey: { type: DataTypes.STRING(512), allowNull: false },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    mimeType: { type: DataTypes.STRING(128), allowNull: false },
    fileSize: { type: DataTypes.BIGINT, allowNull: false },
    checksum: { type: DataTypes.STRING(128), allowNull: true },
  },
  {
    tableName: 'message_attachments',
    indexes: [{ fields: ['messageId'] }],
  },
);

Message.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  let sanitizedMetadata = null;
  if (plain.metadata && typeof plain.metadata === 'object') {
    sanitizedMetadata = Object.fromEntries(
      Object.entries(plain.metadata).filter(([key]) => !/^(_|internal|private)/i.test(key)),
    );
  }
  return {
    id: plain.id,
    threadId: plain.threadId,
    senderId: plain.senderId,
    messageType: plain.messageType,
    body: plain.body,
    isEdited: plain.isEdited,
    editedAt: plain.editedAt,
    deliveredAt: plain.deliveredAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    metadata: sanitizedMetadata,
  };
};

export const Notification = sequelize.define(
  'Notification',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    category: {
      type: DataTypes.ENUM(...NOTIFICATION_CATEGORIES),
      allowNull: false,
      defaultValue: 'system',
    },
    type: { type: DataTypes.STRING(128), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: true },
    payload: { type: jsonType, allowNull: true },
    priority: {
      type: DataTypes.ENUM(...NOTIFICATION_PRIORITIES),
      allowNull: false,
      defaultValue: 'normal',
    },
    status: {
      type: DataTypes.ENUM(...NOTIFICATION_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    readAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'notifications',
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['category'] },
    ],
  },
);

Notification.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  let sanitizedPayload = null;
  if (plain.payload && typeof plain.payload === 'object') {
    sanitizedPayload = Object.fromEntries(
      Object.entries(plain.payload).filter(([key]) => !/^(_|internal|private)/i.test(key)),
    );
  }
  return {
    id: plain.id,
    userId: plain.userId,
    category: plain.category,
    type: plain.type,
    title: plain.title,
    body: plain.body,
    priority: plain.priority,
    status: plain.status,
    deliveredAt: plain.deliveredAt,
    readAt: plain.readAt,
    expiresAt: plain.expiresAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    payload: sanitizedPayload,
  };
};

export const NotificationPreference = sequelize.define(
  'NotificationPreference',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    emailEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    pushEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    smsEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    inAppEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    digestFrequency: {
      type: DataTypes.ENUM(...DIGEST_FREQUENCIES),
      allowNull: false,
      defaultValue: 'immediate',
    },
    quietHoursStart: { type: DataTypes.TIME, allowNull: true },
    quietHoursEnd: { type: DataTypes.TIME, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'notification_preferences' },
);

export const AnalyticsEvent = sequelize.define(
  'AnalyticsEvent',
  {
    eventName: { type: DataTypes.STRING(128), allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    actorType: {
      type: DataTypes.ENUM(...ANALYTICS_ACTOR_TYPES),
      allowNull: false,
      defaultValue: 'user',
    },
    entityType: { type: DataTypes.STRING(64), allowNull: true },
    entityId: { type: DataTypes.INTEGER, allowNull: true },
    source: { type: DataTypes.STRING(64), allowNull: true },
    context: { type: jsonType, allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    ingestedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'analytics_events',
    timestamps: false,
    indexes: [
      { fields: ['eventName'] },
      { fields: ['occurredAt'] },
      { fields: ['entityType', 'entityId'] },
    ],
  },
);

export const AnalyticsDailyRollup = sequelize.define(
  'AnalyticsDailyRollup',
  {
    metricKey: { type: DataTypes.STRING(128), allowNull: false },
    dimensionHash: { type: DataTypes.STRING(64), allowNull: false },
    dimensions: { type: jsonType, allowNull: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    value: { type: DataTypes.DECIMAL(18, 4), allowNull: false },
  },
  {
    tableName: 'analytics_daily_rollups',
    indexes: [{ unique: true, fields: ['metricKey', 'date', 'dimensionHash'] }],
  },
);

export const ProviderWorkspace = sequelize.define(
  'ProviderWorkspace',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    type: {
      type: DataTypes.ENUM(...PROVIDER_WORKSPACE_TYPES),
      allowNull: false,
      defaultValue: 'agency',
    },
    timezone: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'UTC' },
    defaultCurrency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    intakeEmail: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    settings: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'provider_workspaces',
    indexes: [
      { fields: ['type'] },
      { fields: ['ownerId'] },
    ],
  },
);

export const ProviderWorkspaceMember = sequelize.define(
  'ProviderWorkspaceMember',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    role: {
      type: DataTypes.ENUM(...PROVIDER_WORKSPACE_MEMBER_ROLES),
      allowNull: false,
      defaultValue: 'staff',
    },
    status: {
      type: DataTypes.ENUM(...PROVIDER_WORKSPACE_MEMBER_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    invitedById: { type: DataTypes.INTEGER, allowNull: true },
    joinedAt: { type: DataTypes.DATE, allowNull: true },
    lastActiveAt: { type: DataTypes.DATE, allowNull: true },
    removedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'provider_workspace_members',
    indexes: [
      { unique: true, fields: ['workspaceId', 'userId'] },
      { fields: ['workspaceId'] },
      { fields: ['status'] },
    ],
  },
);

export const ProviderWorkspaceInvite = sequelize.define(
  'ProviderWorkspaceInvite',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, validate: { isEmail: true } },
    role: {
      type: DataTypes.ENUM(...PROVIDER_WORKSPACE_MEMBER_ROLES),
      allowNull: false,
      defaultValue: 'staff',
    },
    status: {
      type: DataTypes.ENUM(...PROVIDER_WORKSPACE_INVITE_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    inviteToken: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    invitedById: { type: DataTypes.INTEGER, allowNull: false },
    acceptedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'provider_workspace_invites',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['status'] },
    ],
  },
);

export const ProviderContactNote = sequelize.define(
  'ProviderContactNote',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    subjectUserId: { type: DataTypes.INTEGER, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: false },
    visibility: {
      type: DataTypes.ENUM(...PROVIDER_CONTACT_NOTE_VISIBILITIES),
      allowNull: false,
      defaultValue: 'internal',
    },
  },
  {
    tableName: 'provider_contact_notes',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['subjectUserId'] },
    ],
  },
);

ProviderContactNote.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

User.hasOne(Profile, { foreignKey: 'userId' });
Profile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(CompanyProfile, { foreignKey: 'userId' });
CompanyProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(AgencyProfile, { foreignKey: 'userId' });
AgencyProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(FreelancerProfile, { foreignKey: 'userId' });
FreelancerProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(FeedPost, { foreignKey: 'userId' });
FeedPost.belongsTo(User, { foreignKey: 'userId' });

User.belongsToMany(Group, { through: GroupMembership, foreignKey: 'userId' });
Group.belongsToMany(User, { through: GroupMembership, foreignKey: 'groupId' });

User.belongsToMany(User, {
  through: Connection,
  as: 'connections',
  foreignKey: 'requesterId',
  otherKey: 'addresseeId',
});

User.hasMany(Application, { foreignKey: 'applicantId', as: 'applications' });
Application.belongsTo(User, { foreignKey: 'applicantId', as: 'applicant' });

Application.hasMany(ApplicationReview, { foreignKey: 'applicationId', as: 'reviews' });
ApplicationReview.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });
ApplicationReview.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

MessageThread.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
MessageThread.hasMany(MessageParticipant, { foreignKey: 'threadId', as: 'participants' });
MessageThread.hasMany(Message, { foreignKey: 'threadId', as: 'messages' });

MessageParticipant.belongsTo(MessageThread, { foreignKey: 'threadId' });
MessageParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Message.belongsTo(MessageThread, { foreignKey: 'threadId', as: 'thread' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.hasMany(MessageAttachment, { foreignKey: 'messageId', as: 'attachments' });

MessageAttachment.belongsTo(Message, { foreignKey: 'messageId', as: 'message' });

Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });
NotificationPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(NotificationPreference, { foreignKey: 'userId', as: 'notificationPreference' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

AnalyticsEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ProviderWorkspace.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
ProviderWorkspace.hasMany(ProviderWorkspaceMember, { foreignKey: 'workspaceId', as: 'members' });
ProviderWorkspace.hasMany(ProviderWorkspaceInvite, { foreignKey: 'workspaceId', as: 'invites' });
ProviderWorkspace.hasMany(ProviderContactNote, { foreignKey: 'workspaceId', as: 'contactNotes' });

ProviderWorkspaceMember.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProviderWorkspaceMember.belongsTo(User, { foreignKey: 'userId', as: 'member' });
ProviderWorkspaceMember.belongsTo(User, { foreignKey: 'invitedById', as: 'inviter' });

ProviderWorkspaceInvite.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProviderWorkspaceInvite.belongsTo(User, { foreignKey: 'invitedById', as: 'inviter' });

ProviderContactNote.belongsTo(ProviderWorkspace, { foreignKey: 'workspaceId', as: 'workspace' });
ProviderContactNote.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
ProviderContactNote.belongsTo(User, { foreignKey: 'subjectUserId', as: 'subject' });

export default {
  sequelize,
  User,
  Profile,
  CompanyProfile,
  AgencyProfile,
  FreelancerProfile,
  FeedPost,
  Job,
  Gig,
  Project,
  ExperienceLaunchpad,
  Volunteering,
  Group,
  GroupMembership,
  Connection,
  TwoFactorToken,
  Application,
  ApplicationReview,
  MessageThread,
  MessageParticipant,
  Message,
  MessageAttachment,
  Notification,
  NotificationPreference,
  AnalyticsEvent,
  AnalyticsDailyRollup,
  ProviderWorkspace,
  ProviderWorkspaceMember,
  ProviderWorkspaceInvite,
  ProviderContactNote,
};
