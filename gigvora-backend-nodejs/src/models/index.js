import { Sequelize, DataTypes, Op } from 'sequelize';
import databaseConfig from '../config/database.js';

const { url: databaseUrl, ...sequelizeOptions } = databaseConfig;

export const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, sequelizeOptions)
  : new Sequelize(sequelizeOptions);

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const PROFILE_AVAILABILITY_STATUSES = ['available', 'limited', 'unavailable', 'on_leave'];
export const PROFILE_APPRECIATION_TYPES = ['like', 'celebrate', 'support', 'endorse', 'applause'];
export const PROFILE_FOLLOWER_STATUSES = ['active', 'muted', 'blocked'];
export const PROFILE_ENGAGEMENT_JOB_STATUSES = ['pending', 'completed', 'failed'];


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
export const AUTO_ASSIGN_STATUSES = [
  'pending',
  'notified',
  'accepted',
  'declined',
  'expired',
  'reassigned',
  'completed',
];
export const MESSAGE_CHANNEL_TYPES = ['support', 'project', 'contract', 'group', 'direct'];
export const MESSAGE_THREAD_STATES = ['active', 'archived', 'locked'];
export const MESSAGE_TYPES = ['text', 'file', 'system', 'event'];
export const SUPPORT_CASE_STATUSES = ['triage', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'];
export const SUPPORT_CASE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
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
export const ESCROW_ACCOUNT_STATUSES = ['pending', 'active', 'suspended', 'closed'];
export const ESCROW_TRANSACTION_TYPES = ['project', 'gig', 'milestone', 'retainer'];
export const ESCROW_TRANSACTION_STATUSES = [
  'initiated',
  'funded',
  'in_escrow',
  'released',
  'refunded',
  'cancelled',
  'disputed',
];
export const DISPUTE_STAGES = ['intake', 'mediation', 'arbitration', 'resolved'];
export const DISPUTE_STATUSES = ['open', 'awaiting_customer', 'under_review', 'settled', 'closed'];
export const DISPUTE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const DISPUTE_ACTION_TYPES = [
  'comment',
  'evidence_upload',
  'deadline_adjusted',
  'stage_advanced',
  'status_change',
  'system_notice',
];
export const DISPUTE_ACTOR_TYPES = ['customer', 'provider', 'mediator', 'admin', 'system'];
export const LAUNCHPAD_STATUSES = ['draft', 'recruiting', 'active', 'archived'];
export const LAUNCHPAD_APPLICATION_STATUSES = [
  'screening',
  'interview',
  'accepted',
  'waitlisted',
  'rejected',
  'withdrawn',
  'completed',
];
export const LAUNCHPAD_EMPLOYER_REQUEST_STATUSES = ['new', 'needs_review', 'approved', 'declined', 'paused'];
export const LAUNCHPAD_PLACEMENT_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];
export const LAUNCHPAD_TARGET_TYPES = ['job', 'gig', 'project'];
export const LAUNCHPAD_OPPORTUNITY_SOURCES = ['employer_request', 'placement', 'manual'];

export const FINANCE_VALUE_UNITS = ['currency', 'percentage', 'ratio', 'count'];
export const FINANCE_CHANGE_UNITS = ['currency', 'percentage', 'percentage_points', 'count', 'ratio'];
export const FINANCE_TRENDS = ['up', 'down', 'neutral'];
export const FREELANCER_PAYOUT_STATUSES = ['released', 'scheduled', 'in_escrow', 'pending', 'failed'];
export const FREELANCER_TAX_ESTIMATE_STATUSES = ['on_track', 'due_soon', 'past_due', 'paid', 'processing'];
export const FREELANCER_FILING_STATUSES = ['not_started', 'in_progress', 'submitted', 'overdue'];

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
    location: { type: DataTypes.STRING(255), allowNull: true },
    timezone: { type: DataTypes.STRING(120), allowNull: true },
    missionStatement: { type: DataTypes.TEXT, allowNull: true },
    areasOfFocus: { type: jsonType, allowNull: true },
    availabilityStatus: {
      type: DataTypes.ENUM(...PROFILE_AVAILABILITY_STATUSES),
      allowNull: false,
      defaultValue: 'limited',
      validate: { isIn: [PROFILE_AVAILABILITY_STATUSES] },
    },
    availableHoursPerWeek: { type: DataTypes.INTEGER, allowNull: true },
    openToRemote: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    availabilityNotes: { type: DataTypes.TEXT, allowNull: true },
    availabilityUpdatedAt: { type: DataTypes.DATE, allowNull: true },
    trustScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    likesCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    followersCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    qualifications: { type: jsonType, allowNull: true },
    experienceEntries: { type: jsonType, allowNull: true },
    statusFlags: { type: jsonType, allowNull: true },
    launchpadEligibility: { type: jsonType, allowNull: true },
    volunteerBadges: { type: jsonType, allowNull: true },
    portfolioLinks: { type: jsonType, allowNull: true },
    preferredEngagements: { type: jsonType, allowNull: true },
    collaborationRoster: { type: jsonType, allowNull: true },
    impactHighlights: { type: jsonType, allowNull: true },
    pipelineInsights: { type: jsonType, allowNull: true },
    profileCompletion: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    avatarSeed: { type: DataTypes.STRING(255), allowNull: true },
    engagementRefreshedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'profiles' },
);

export const ProfileReference = sequelize.define(
  'ProfileReference',
  {
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    referenceName: { type: DataTypes.STRING(255), allowNull: false },
    relationship: { type: DataTypes.STRING(255), allowNull: true },
    company: { type: DataTypes.STRING(255), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    phone: { type: DataTypes.STRING(60), allowNull: true },
    endorsement: { type: DataTypes.TEXT, allowNull: true },
    isVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    weight: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    lastInteractedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'profile_references' },
);

export const ProfileAppreciation = sequelize.define(
  'ProfileAppreciation',
  {
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: false },
    appreciationType: {
      type: DataTypes.ENUM(...PROFILE_APPRECIATION_TYPES),
      allowNull: false,
      defaultValue: 'like',
      validate: { isIn: [PROFILE_APPRECIATION_TYPES] },
    },
    source: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'profile_appreciations',
    indexes: [
      { unique: true, fields: ['profileId', 'actorId', 'appreciationType'] },
      { fields: ['profileId'] },
      { fields: ['actorId'] },
    ],
  },
);

export const ProfileFollower = sequelize.define(
  'ProfileFollower',
  {
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    followerId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...PROFILE_FOLLOWER_STATUSES),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [PROFILE_FOLLOWER_STATUSES] },
    },
    notificationsEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    metadata: { type: jsonType, allowNull: true },
    followedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'profile_followers',
    indexes: [
      { unique: true, fields: ['profileId', 'followerId'] },
      { fields: ['profileId'] },
      { fields: ['followerId'] },
    ],
  },
);

export const ProfileEngagementJob = sequelize.define(
  'ProfileEngagementJob',
  {
    profileId: { type: DataTypes.INTEGER, allowNull: false },
    scheduledAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM(...PROFILE_ENGAGEMENT_JOB_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [PROFILE_ENGAGEMENT_JOB_STATUSES] },
    },
    lockedAt: { type: DataTypes.DATE, allowNull: true },
    lockedBy: { type: DataTypes.STRING(120), allowNull: true },
    lastError: { type: DataTypes.TEXT, allowNull: true },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'profile_engagement_jobs',
    indexes: [
      { fields: ['status', 'scheduledAt'] },
      { fields: ['profileId'] },
    ],
  },
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
    geoLocation: { type: jsonType, allowNull: true },
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
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
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
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
    budgetAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    budgetCurrency: { type: DataTypes.STRING(6), allowNull: true },
    autoAssignEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoAssignStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'inactive' },
    autoAssignSettings: { type: jsonType, allowNull: true },
    autoAssignLastRunAt: { type: DataTypes.DATE, allowNull: true },
    autoAssignLastQueueSize: { type: DataTypes.INTEGER, allowNull: true },
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

Project.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    title: plain.title,
    description: plain.description,
    status: plain.status,
    location: plain.location,
    geoLocation: plain.geoLocation,
    budgetAmount: plain.budgetAmount == null ? null : Number(plain.budgetAmount),
    budgetCurrency: plain.budgetCurrency ?? null,
    autoAssignEnabled: Boolean(plain.autoAssignEnabled),
    autoAssignStatus: plain.autoAssignStatus,
    autoAssignSettings: plain.autoAssignSettings ?? null,
    autoAssignLastRunAt: plain.autoAssignLastRunAt ?? null,
    autoAssignLastQueueSize: plain.autoAssignLastQueueSize ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExperienceLaunchpad = sequelize.define(
  'ExperienceLaunchpad',
  {
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    track: { type: DataTypes.STRING(120), allowNull: false },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
    programType: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'cohort' },
    status: {
      type: DataTypes.ENUM(...LAUNCHPAD_STATUSES),
      allowNull: false,
      defaultValue: 'recruiting',
      validate: { isIn: [LAUNCHPAD_STATUSES] },
    },
    applicationUrl: { type: DataTypes.STRING(500), allowNull: true },
    mentorLead: { type: DataTypes.STRING(255), allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: true },
    eligibilityCriteria: { type: jsonType, allowNull: true },
    employerSponsorship: { type: jsonType, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
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

ExperienceLaunchpad.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    title: plain.title,
    description: plain.description,
    track: plain.track,
    location: plain.location,
    geoLocation: plain.geoLocation,
    programType: plain.programType,
    status: plain.status,
    applicationUrl: plain.applicationUrl,
    mentorLead: plain.mentorLead,
    startDate: plain.startDate,
    endDate: plain.endDate,
    capacity: plain.capacity,
    eligibilityCriteria: plain.eligibilityCriteria,
    employerSponsorship: plain.employerSponsorship,
    publishedAt: plain.publishedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExperienceLaunchpadApplication = sequelize.define(
  'ExperienceLaunchpadApplication',
  {
    launchpadId: { type: DataTypes.INTEGER, allowNull: false },
    applicantId: { type: DataTypes.INTEGER, allowNull: false },
    applicationId: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...LAUNCHPAD_APPLICATION_STATUSES),
      allowNull: false,
      defaultValue: 'screening',
      validate: { isIn: [LAUNCHPAD_APPLICATION_STATUSES] },
    },
    qualificationScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    yearsExperience: { type: DataTypes.DECIMAL(4, 1), allowNull: true },
    skills: { type: jsonType, allowNull: true },
    motivations: { type: DataTypes.TEXT, allowNull: true },
    portfolioUrl: { type: DataTypes.STRING(500), allowNull: true },
    availabilityDate: { type: DataTypes.DATE, allowNull: true },
    eligibilitySnapshot: { type: jsonType, allowNull: true },
    assignedMentor: { type: DataTypes.STRING(255), allowNull: true },
    interviewScheduledAt: { type: DataTypes.DATE, allowNull: true },
    decisionNotes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'experience_launchpad_applications' },
);

ExperienceLaunchpadApplication.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    launchpadId: plain.launchpadId,
    applicantId: plain.applicantId,
    applicationId: plain.applicationId,
    status: plain.status,
    qualificationScore: plain.qualificationScore == null ? null : Number(plain.qualificationScore),
    yearsExperience: plain.yearsExperience == null ? null : Number(plain.yearsExperience),
    skills: Array.isArray(plain.skills) ? plain.skills : [],
    motivations: plain.motivations,
    portfolioUrl: plain.portfolioUrl,
    availabilityDate: plain.availabilityDate,
    eligibilitySnapshot: plain.eligibilitySnapshot,
    assignedMentor: plain.assignedMentor,
    interviewScheduledAt: plain.interviewScheduledAt,
    decisionNotes: plain.decisionNotes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExperienceLaunchpadEmployerRequest = sequelize.define(
  'ExperienceLaunchpadEmployerRequest',
  {
    launchpadId: { type: DataTypes.INTEGER, allowNull: false },
    organizationName: { type: DataTypes.STRING(255), allowNull: false },
    contactName: { type: DataTypes.STRING(255), allowNull: false },
    contactEmail: { type: DataTypes.STRING(255), allowNull: false, validate: { isEmail: true } },
    headcount: { type: DataTypes.INTEGER, allowNull: true },
    engagementTypes: { type: jsonType, allowNull: true },
    targetStartDate: { type: DataTypes.DATE, allowNull: true },
    idealCandidateProfile: { type: DataTypes.TEXT, allowNull: true },
    hiringNotes: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...LAUNCHPAD_EMPLOYER_REQUEST_STATUSES),
      allowNull: false,
      defaultValue: 'new',
      validate: { isIn: [LAUNCHPAD_EMPLOYER_REQUEST_STATUSES] },
    },
    slaCommitmentDays: { type: DataTypes.INTEGER, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'experience_launchpad_employer_requests' },
);

ExperienceLaunchpadEmployerRequest.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    launchpadId: plain.launchpadId,
    organizationName: plain.organizationName,
    contactName: plain.contactName,
    contactEmail: plain.contactEmail,
    headcount: plain.headcount == null ? null : Number(plain.headcount),
    engagementTypes: Array.isArray(plain.engagementTypes)
      ? plain.engagementTypes
      : plain.engagementTypes ?? [],
    targetStartDate: plain.targetStartDate,
    idealCandidateProfile: plain.idealCandidateProfile,
    hiringNotes: plain.hiringNotes,
    status: plain.status,
    slaCommitmentDays: plain.slaCommitmentDays,
    createdById: plain.createdById,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExperienceLaunchpadPlacement = sequelize.define(
  'ExperienceLaunchpadPlacement',
  {
    launchpadId: { type: DataTypes.INTEGER, allowNull: false },
    candidateId: { type: DataTypes.INTEGER, allowNull: false },
    employerRequestId: { type: DataTypes.INTEGER, allowNull: true },
    targetType: {
      type: DataTypes.ENUM(...LAUNCHPAD_TARGET_TYPES),
      allowNull: true,
      validate: { isIn: [LAUNCHPAD_TARGET_TYPES] },
    },
    targetId: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM(...LAUNCHPAD_PLACEMENT_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
      validate: { isIn: [LAUNCHPAD_PLACEMENT_STATUSES] },
    },
    placementDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    compensation: { type: jsonType, allowNull: true },
    feedbackScore: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
  },
  { tableName: 'experience_launchpad_placements' },
);

ExperienceLaunchpadPlacement.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    launchpadId: plain.launchpadId,
    candidateId: plain.candidateId,
    employerRequestId: plain.employerRequestId,
    targetType: plain.targetType,
    targetId: plain.targetId,
    status: plain.status,
    placementDate: plain.placementDate,
    endDate: plain.endDate,
    compensation: plain.compensation,
    feedbackScore: plain.feedbackScore == null ? null : Number(plain.feedbackScore),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ExperienceLaunchpadOpportunityLink = sequelize.define(
  'ExperienceLaunchpadOpportunityLink',
  {
    launchpadId: { type: DataTypes.INTEGER, allowNull: false },
    targetType: {
      type: DataTypes.ENUM(...LAUNCHPAD_TARGET_TYPES),
      allowNull: false,
      validate: { isIn: [LAUNCHPAD_TARGET_TYPES] },
    },
    targetId: { type: DataTypes.INTEGER, allowNull: false },
    source: {
      type: DataTypes.ENUM(...LAUNCHPAD_OPPORTUNITY_SOURCES),
      allowNull: false,
      defaultValue: 'manual',
      validate: { isIn: [LAUNCHPAD_OPPORTUNITY_SOURCES] },
    },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'experience_launchpad_opportunity_links' },
);

ExperienceLaunchpadOpportunityLink.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    launchpadId: plain.launchpadId,
    targetType: plain.targetType,
    targetId: plain.targetId,
    source: plain.source,
    createdById: plain.createdById,
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const Volunteering = sequelize.define(
  'Volunteering',
  {
    title: { type: DataTypes.STRING(255), allowNull: false },
    organization: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
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

export const SupportCase = sequelize.define(
  'SupportCase',
  {
    threadId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...SUPPORT_CASE_STATUSES),
      allowNull: false,
      defaultValue: 'triage',
    },
    priority: {
      type: DataTypes.ENUM(...SUPPORT_CASE_PRIORITIES),
      allowNull: false,
      defaultValue: 'medium',
    },
    reason: { type: DataTypes.TEXT, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
    escalatedBy: { type: DataTypes.INTEGER, allowNull: false },
    escalatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    assignedTo: { type: DataTypes.INTEGER, allowNull: true },
    assignedBy: { type: DataTypes.INTEGER, allowNull: true },
    assignedAt: { type: DataTypes.DATE, allowNull: true },
    firstResponseAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    resolvedBy: { type: DataTypes.INTEGER, allowNull: true },
    resolutionSummary: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'support_cases',
    indexes: [
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['assignedTo'] },
    ],
  },
);

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

export const EscrowAccount = sequelize.define(
  'EscrowAccount',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    provider: { type: DataTypes.STRING(80), allowNull: false },
    externalId: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...ESCROW_ACCOUNT_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    currentBalance: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    pendingReleaseTotal: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
    lastReconciledAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'escrow_accounts',
    indexes: [
      { fields: ['userId'] },
      { fields: ['provider'] },
      { fields: ['status'] },
    ],
  },
);

EscrowAccount.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    provider: plain.provider,
    externalId: plain.externalId,
    status: plain.status,
    currencyCode: plain.currencyCode,
    currentBalance: Number.parseFloat(plain.currentBalance ?? 0),
    pendingReleaseTotal: Number.parseFloat(plain.pendingReleaseTotal ?? 0),
    lastReconciledAt: plain.lastReconciledAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const EscrowTransaction = sequelize.define(
  'EscrowTransaction',
  {
    accountId: { type: DataTypes.INTEGER, allowNull: false },
    reference: { type: DataTypes.STRING(120), allowNull: false },
    externalId: { type: DataTypes.STRING(120), allowNull: true },
    type: {
      type: DataTypes.ENUM(...ESCROW_TRANSACTION_TYPES),
      allowNull: false,
      defaultValue: 'project',
    },
    status: {
      type: DataTypes.ENUM(...ESCROW_TRANSACTION_STATUSES),
      allowNull: false,
      defaultValue: 'initiated',
    },
    amount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      validate: { min: 0 },
    },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    feeAmount: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    netAmount: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    initiatedById: { type: DataTypes.INTEGER, allowNull: false },
    counterpartyId: { type: DataTypes.INTEGER, allowNull: true },
    projectId: { type: DataTypes.INTEGER, allowNull: true },
    gigId: { type: DataTypes.INTEGER, allowNull: true },
    milestoneLabel: { type: DataTypes.STRING(180), allowNull: true },
    scheduledReleaseAt: { type: DataTypes.DATE, allowNull: true },
    releasedAt: { type: DataTypes.DATE, allowNull: true },
    refundedAt: { type: DataTypes.DATE, allowNull: true },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    auditTrail: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'escrow_transactions',
    indexes: [
      { fields: ['accountId'] },
      { fields: ['reference'], unique: true },
      { fields: ['status'] },
      { fields: ['projectId'] },
      { fields: ['gigId'] },
      { fields: ['scheduledReleaseAt'] },
    ],
  },
);

EscrowTransaction.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    accountId: plain.accountId,
    reference: plain.reference,
    externalId: plain.externalId,
    type: plain.type,
    status: plain.status,
    amount: Number.parseFloat(plain.amount ?? 0),
    currencyCode: plain.currencyCode,
    feeAmount: Number.parseFloat(plain.feeAmount ?? 0),
    netAmount: Number.parseFloat(plain.netAmount ?? 0),
    initiatedById: plain.initiatedById,
    counterpartyId: plain.counterpartyId,
    projectId: plain.projectId,
    gigId: plain.gigId,
    milestoneLabel: plain.milestoneLabel,
    scheduledReleaseAt: plain.scheduledReleaseAt,
    releasedAt: plain.releasedAt,
    refundedAt: plain.refundedAt,
    cancelledAt: plain.cancelledAt,
    metadata: plain.metadata,
    auditTrail: plain.auditTrail,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const DisputeCase = sequelize.define(
  'DisputeCase',
  {
    escrowTransactionId: { type: DataTypes.INTEGER, allowNull: false },
    openedById: { type: DataTypes.INTEGER, allowNull: false },
    assignedToId: { type: DataTypes.INTEGER, allowNull: true },
    stage: {
      type: DataTypes.ENUM(...DISPUTE_STAGES),
      allowNull: false,
      defaultValue: 'intake',
    },
    status: {
      type: DataTypes.ENUM(...DISPUTE_STATUSES),
      allowNull: false,
      defaultValue: 'open',
    },
    priority: {
      type: DataTypes.ENUM(...DISPUTE_PRIORITIES),
      allowNull: false,
      defaultValue: 'medium',
    },
    reasonCode: { type: DataTypes.STRING(80), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: false },
    customerDeadlineAt: { type: DataTypes.DATE, allowNull: true },
    providerDeadlineAt: { type: DataTypes.DATE, allowNull: true },
    resolutionNotes: { type: DataTypes.TEXT, allowNull: true },
    openedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'dispute_cases',
    indexes: [
      { fields: ['escrowTransactionId'] },
      { fields: ['stage'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['openedById'] },
    ],
  },
);

DisputeCase.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    escrowTransactionId: plain.escrowTransactionId,
    openedById: plain.openedById,
    assignedToId: plain.assignedToId,
    stage: plain.stage,
    status: plain.status,
    priority: plain.priority,
    reasonCode: plain.reasonCode,
    summary: plain.summary,
    customerDeadlineAt: plain.customerDeadlineAt,
    providerDeadlineAt: plain.providerDeadlineAt,
    resolutionNotes: plain.resolutionNotes,
    openedAt: plain.openedAt,
    resolvedAt: plain.resolvedAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const DisputeEvent = sequelize.define(
  'DisputeEvent',
  {
    disputeCaseId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    actorType: {
      type: DataTypes.ENUM(...DISPUTE_ACTOR_TYPES),
      allowNull: false,
      defaultValue: 'system',
    },
    actionType: {
      type: DataTypes.ENUM(...DISPUTE_ACTION_TYPES),
      allowNull: false,
      defaultValue: 'comment',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    evidenceKey: { type: DataTypes.STRING(255), allowNull: true },
    evidenceUrl: { type: DataTypes.TEXT, allowNull: true },
    evidenceFileName: { type: DataTypes.STRING(180), allowNull: true },
    evidenceContentType: { type: DataTypes.STRING(80), allowNull: true },
    eventAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'dispute_events',
    indexes: [
      { fields: ['disputeCaseId'] },
      { fields: ['actorType'] },
      { fields: ['actionType'] },
    ],
  },
);

DisputeEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    disputeCaseId: plain.disputeCaseId,
    actorId: plain.actorId,
    actorType: plain.actorType,
    actionType: plain.actionType,
    notes: plain.notes,
    evidenceKey: plain.evidenceKey,
    evidenceUrl: plain.evidenceUrl,
    evidenceFileName: plain.evidenceFileName,
    evidenceContentType: plain.evidenceContentType,
    eventAt: plain.eventAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const SearchSubscription = sequelize.define(
  'SearchSubscription',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    category: {
      type: DataTypes.ENUM('job', 'gig', 'project', 'launchpad', 'volunteering', 'people', 'mixed'),
      allowNull: false,
      defaultValue: 'job',
    },
    query: { type: DataTypes.STRING(500), allowNull: true },
    filters: { type: jsonType, allowNull: true },
    sort: { type: DataTypes.STRING(120), allowNull: true },
    frequency: {
      type: DataTypes.ENUM(...DIGEST_FREQUENCIES),
      allowNull: false,
      defaultValue: 'daily',
    },
    notifyByEmail: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notifyInApp: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastTriggeredAt: { type: DataTypes.DATE, allowNull: true },
    nextRunAt: { type: DataTypes.DATE, allowNull: true },
    mapViewport: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'search_subscriptions',
    indexes: [
      { fields: ['userId', 'category'] },
      { fields: ['frequency'] },
    ],
  },
);

export const FreelancerAssignmentMetric = sequelize.define(
  'FreelancerAssignmentMetric',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    completionRate: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
    avgAssignedValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    lifetimeAssignedValue: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    lifetimeCompletedValue: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    lastAssignedAt: { type: DataTypes.DATE, allowNull: true },
    lastCompletedAt: { type: DataTypes.DATE, allowNull: true },
    totalAssigned: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    totalCompleted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: 'freelancer_assignment_metrics' },
);

FreelancerAssignmentMetric.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    freelancerId: plain.freelancerId,
    rating: plain.rating == null ? null : Number(plain.rating),
    completionRate: plain.completionRate == null ? null : Number(plain.completionRate),
    avgAssignedValue: plain.avgAssignedValue == null ? null : Number(plain.avgAssignedValue),
    lifetimeAssignedValue: Number(plain.lifetimeAssignedValue ?? 0),
    lifetimeCompletedValue: Number(plain.lifetimeCompletedValue ?? 0),
    lastAssignedAt: plain.lastAssignedAt,
    lastCompletedAt: plain.lastCompletedAt,
    totalAssigned: plain.totalAssigned,
    totalCompleted: plain.totalCompleted,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

function decimalToNumber(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const FreelancerFinanceMetric = sequelize.define(
  'FreelancerFinanceMetric',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    metricKey: { type: DataTypes.STRING(64), allowNull: false },
    label: { type: DataTypes.STRING(160), allowNull: false },
    value: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
    valueUnit: {
      type: DataTypes.ENUM(...FINANCE_VALUE_UNITS),
      allowNull: false,
      defaultValue: 'currency',
      validate: { isIn: [FINANCE_VALUE_UNITS] },
    },
    currencyCode: { type: DataTypes.STRING(3), allowNull: true },
    changeValue: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
    changeUnit: {
      type: DataTypes.ENUM(...FINANCE_CHANGE_UNITS),
      allowNull: true,
      validate: { isIn: [FINANCE_CHANGE_UNITS] },
    },
    trend: {
      type: DataTypes.ENUM(...FINANCE_TRENDS),
      allowNull: false,
      defaultValue: 'neutral',
      validate: { isIn: [FINANCE_TRENDS] },
    },
    caption: { type: DataTypes.TEXT, allowNull: true },
    effectiveAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_finance_metrics',
    indexes: [
      { fields: ['freelancerId', 'metricKey'] },
      { fields: ['freelancerId', 'effectiveAt'] },
    ],
  },
);

FreelancerFinanceMetric.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    metricKey: plain.metricKey,
    label: plain.label,
    value: decimalToNumber(plain.value),
    valueUnit: plain.valueUnit,
    currencyCode: plain.currencyCode,
    changeValue: decimalToNumber(plain.changeValue),
    changeUnit: plain.changeUnit,
    trend: plain.trend,
    caption: plain.caption,
    effectiveAt: plain.effectiveAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerRevenueMonthly = sequelize.define(
  'FreelancerRevenueMonthly',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    month: { type: DataTypes.DATEONLY, allowNull: false },
    bookedAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    realizedAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(3), allowNull: true },
  },
  {
    tableName: 'freelancer_revenue_monthlies',
    indexes: [
      { unique: true, fields: ['freelancerId', 'month'] },
      { fields: ['freelancerId', 'createdAt'] },
    ],
  },
);

FreelancerRevenueMonthly.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    month: plain.month,
    bookedAmount: decimalToNumber(plain.bookedAmount),
    realizedAmount: decimalToNumber(plain.realizedAmount),
    currencyCode: plain.currencyCode,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerRevenueStream = sequelize.define(
  'FreelancerRevenueStream',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    sharePercent: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
    monthlyRecurringRevenue: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(3), allowNull: true },
    yoyChangePercent: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_revenue_streams',
    indexes: [{ fields: ['freelancerId'] }],
  },
);

FreelancerRevenueStream.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    name: plain.name,
    sharePercent: decimalToNumber(plain.sharePercent),
    monthlyRecurringRevenue: decimalToNumber(plain.monthlyRecurringRevenue),
    currencyCode: plain.currencyCode,
    yoyChangePercent: decimalToNumber(plain.yoyChangePercent),
    notes: plain.notes,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerPayout = sequelize.define(
  'FreelancerPayout',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    payoutDate: { type: DataTypes.DATEONLY, allowNull: false },
    clientName: { type: DataTypes.STRING(160), allowNull: false },
    gigTitle: { type: DataTypes.STRING(160), allowNull: false },
    amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.ENUM(...FREELANCER_PAYOUT_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
      validate: { isIn: [FREELANCER_PAYOUT_STATUSES] },
    },
    reference: { type: DataTypes.STRING(120), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_payouts',
    indexes: [
      { fields: ['freelancerId', 'payoutDate'] },
      { fields: ['status'] },
    ],
  },
);

FreelancerPayout.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    payoutDate: plain.payoutDate,
    clientName: plain.clientName,
    gigTitle: plain.gigTitle,
    amount: decimalToNumber(plain.amount),
    currencyCode: plain.currencyCode,
    status: plain.status,
    reference: plain.reference,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerTaxEstimate = sequelize.define(
  'FreelancerTaxEstimate',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false },
    amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.ENUM(...FREELANCER_TAX_ESTIMATE_STATUSES),
      allowNull: false,
      defaultValue: 'on_track',
      validate: { isIn: [FREELANCER_TAX_ESTIMATE_STATUSES] },
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_tax_estimates',
    indexes: [{ fields: ['freelancerId', 'dueDate'] }],
  },
);

FreelancerTaxEstimate.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    dueDate: plain.dueDate,
    amount: decimalToNumber(plain.amount),
    currencyCode: plain.currencyCode,
    status: plain.status,
    notes: plain.notes,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerTaxFiling = sequelize.define(
  'FreelancerTaxFiling',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(180), allowNull: false },
    jurisdiction: { type: DataTypes.STRING(120), allowNull: true },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM(...FREELANCER_FILING_STATUSES),
      allowNull: false,
      defaultValue: 'not_started',
      validate: { isIn: [FREELANCER_FILING_STATUSES] },
    },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_tax_filings',
    indexes: [
      { fields: ['freelancerId'] },
      { fields: ['dueDate'] },
    ],
  },
);

FreelancerTaxFiling.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    name: plain.name,
    jurisdiction: plain.jurisdiction,
    dueDate: plain.dueDate,
    status: plain.status,
    submittedAt: plain.submittedAt,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerDeductionSummary = sequelize.define(
  'FreelancerDeductionSummary',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    taxYear: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    changePercentage: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'freelancer_deduction_summaries',
    indexes: [{ unique: true, fields: ['freelancerId', 'taxYear'] }],
  },
);

FreelancerDeductionSummary.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    taxYear: plain.taxYear,
    amount: decimalToNumber(plain.amount),
    currencyCode: plain.currencyCode,
    changePercentage: decimalToNumber(plain.changePercentage),
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerProfitabilityMetric = sequelize.define(
  'FreelancerProfitabilityMetric',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    metricKey: { type: DataTypes.STRING(64), allowNull: false },
    label: { type: DataTypes.STRING(160), allowNull: false },
    value: { type: DataTypes.DECIMAL(10, 4), allowNull: false, defaultValue: 0 },
    valueUnit: {
      type: DataTypes.ENUM(...FINANCE_VALUE_UNITS),
      allowNull: false,
      defaultValue: 'percentage',
      validate: { isIn: [FINANCE_VALUE_UNITS] },
    },
    changeValue: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
    changeUnit: {
      type: DataTypes.ENUM(...FINANCE_CHANGE_UNITS),
      allowNull: true,
      validate: { isIn: [FINANCE_CHANGE_UNITS] },
    },
    currencyCode: { type: DataTypes.STRING(3), allowNull: true },
  },
  {
    tableName: 'freelancer_profitability_metrics',
    indexes: [{ fields: ['freelancerId', 'metricKey'] }],
  },
);

FreelancerProfitabilityMetric.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    metricKey: plain.metricKey,
    label: plain.label,
    value: decimalToNumber(plain.value),
    valueUnit: plain.valueUnit,
    changeValue: decimalToNumber(plain.changeValue),
    changeUnit: plain.changeUnit,
    currencyCode: plain.currencyCode,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerCostBreakdown = sequelize.define(
  'FreelancerCostBreakdown',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(160), allowNull: false },
    percentage: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
    caption: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'freelancer_cost_breakdowns',
    indexes: [{ fields: ['freelancerId'] }],
  },
);

FreelancerCostBreakdown.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    label: plain.label,
    percentage: decimalToNumber(plain.percentage),
    caption: plain.caption,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerSavingsGoal = sequelize.define(
  'FreelancerSavingsGoal',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    targetAmount: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
    currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    progress: { type: DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
    cadence: { type: DataTypes.STRING(160), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_savings_goals',
    indexes: [{ fields: ['freelancerId'] }],
  },
);

FreelancerSavingsGoal.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    name: plain.name,
    targetAmount: decimalToNumber(plain.targetAmount),
    currencyCode: plain.currencyCode,
    progress: decimalToNumber(plain.progress),
    cadence: plain.cadence,
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const FreelancerFinanceControl = sequelize.define(
  'FreelancerFinanceControl',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    bullets: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'freelancer_finance_controls',
    indexes: [{ fields: ['freelancerId'] }],
  },
);

FreelancerFinanceControl.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    freelancerId: plain.freelancerId,
    name: plain.name,
    description: plain.description,
    bullets: Array.isArray(plain.bullets) ? plain.bullets : [],
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ProjectAssignmentEvent = sequelize.define(
  'ProjectAssignmentEvent',
  {
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    eventType: {
      type: DataTypes.ENUM(
        'created',
        'auto_assign_enabled',
        'auto_assign_disabled',
        'auto_assign_queue_generated',
        'auto_assign_queue_exhausted',
      ),
      allowNull: false,
      defaultValue: 'created',
    },
    payload: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'project_assignment_events',
    indexes: [{ fields: ['projectId', 'eventType'] }],
  },
);

ProjectAssignmentEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    actorId: plain.actorId,
    eventType: plain.eventType,
    payload: plain.payload,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AutoAssignQueueEntry = sequelize.define(
  'AutoAssignQueueEntry',
  {
    targetType: {
      type: DataTypes.ENUM(...APPLICATION_TARGET_TYPES),
      allowNull: false,
      validate: { isIn: [APPLICATION_TARGET_TYPES] },
    },
    targetId: { type: DataTypes.INTEGER, allowNull: false },
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    score: { type: DataTypes.DECIMAL(10, 4), allowNull: false },
    priorityBucket: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
    status: {
      type: DataTypes.ENUM(...AUTO_ASSIGN_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [AUTO_ASSIGN_STATUSES] },
    },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    notifiedAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    projectValue: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'auto_assign_queue_entries',
    indexes: [
      { fields: ['targetType', 'targetId'] },
      { fields: ['freelancerId', 'status'] },
    ],
  },
);

AutoAssignQueueEntry.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    targetType: plain.targetType,
    targetId: plain.targetId,
    freelancerId: plain.freelancerId,
    score: Number(plain.score),
    priorityBucket: plain.priorityBucket,
    status: plain.status,
    expiresAt: plain.expiresAt,
    notifiedAt: plain.notifiedAt,
    resolvedAt: plain.resolvedAt,
    projectValue: plain.projectValue == null ? null : Number(plain.projectValue),
    metadata: plain.metadata,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

SearchSubscription.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    name: plain.name,
    category: plain.category,
    query: plain.query,
    filters: plain.filters,
    sort: plain.sort,
    frequency: plain.frequency,
    notifyByEmail: plain.notifyByEmail,
    notifyInApp: plain.notifyInApp,
    lastTriggeredAt: plain.lastTriggeredAt,
    nextRunAt: plain.nextRunAt,
    mapViewport: plain.mapViewport,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

User.hasOne(Profile, { foreignKey: 'userId' });
Profile.belongsTo(User, { foreignKey: 'userId' });
Profile.hasMany(ProfileReference, { as: 'references', foreignKey: 'profileId', onDelete: 'CASCADE' });
ProfileReference.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });
Profile.hasMany(ProfileAppreciation, { as: 'appreciations', foreignKey: 'profileId', onDelete: 'CASCADE' });
ProfileAppreciation.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });
ProfileAppreciation.belongsTo(User, { as: 'actor', foreignKey: 'actorId' });
Profile.hasMany(ProfileFollower, { as: 'followers', foreignKey: 'profileId', onDelete: 'CASCADE' });
ProfileFollower.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });
ProfileFollower.belongsTo(User, { as: 'follower', foreignKey: 'followerId' });
Profile.hasMany(ProfileEngagementJob, { as: 'engagementJobs', foreignKey: 'profileId', onDelete: 'CASCADE' });
ProfileEngagementJob.belongsTo(Profile, { as: 'profile', foreignKey: 'profileId' });

User.hasOne(CompanyProfile, { foreignKey: 'userId' });
CompanyProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(AgencyProfile, { foreignKey: 'userId' });
AgencyProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(FreelancerProfile, { foreignKey: 'userId' });
FreelancerProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(FreelancerAssignmentMetric, { foreignKey: 'freelancerId', as: 'assignmentMetric' });
FreelancerAssignmentMetric.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerFinanceMetric, { foreignKey: 'freelancerId', as: 'financeMetrics' });
FreelancerFinanceMetric.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerRevenueMonthly, { foreignKey: 'freelancerId', as: 'revenueMonths' });
FreelancerRevenueMonthly.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerRevenueStream, { foreignKey: 'freelancerId', as: 'revenueStreams' });
FreelancerRevenueStream.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerPayout, { foreignKey: 'freelancerId', as: 'payouts' });
FreelancerPayout.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerTaxEstimate, { foreignKey: 'freelancerId', as: 'taxEstimates' });
FreelancerTaxEstimate.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerTaxFiling, { foreignKey: 'freelancerId', as: 'taxFilings' });
FreelancerTaxFiling.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerDeductionSummary, { foreignKey: 'freelancerId', as: 'deductionSummaries' });
FreelancerDeductionSummary.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerProfitabilityMetric, { foreignKey: 'freelancerId', as: 'profitabilityMetrics' });
FreelancerProfitabilityMetric.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerCostBreakdown, { foreignKey: 'freelancerId', as: 'costBreakdowns' });
FreelancerCostBreakdown.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerSavingsGoal, { foreignKey: 'freelancerId', as: 'savingsGoals' });
FreelancerSavingsGoal.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

User.hasMany(FreelancerFinanceControl, { foreignKey: 'freelancerId', as: 'financeControls' });
FreelancerFinanceControl.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

Project.hasMany(ProjectAssignmentEvent, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'assignmentEvents',
  constraints: false,
});
ProjectAssignmentEvent.belongsTo(Project, {
  foreignKey: { name: 'projectId', allowNull: false },
  as: 'project',
  constraints: false,
});
ProjectAssignmentEvent.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

User.hasMany(AutoAssignQueueEntry, { foreignKey: 'freelancerId', as: 'autoAssignQueue' });
AutoAssignQueueEntry.belongsTo(User, { foreignKey: 'freelancerId', as: 'freelancer' });

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

ExperienceLaunchpad.hasMany(ExperienceLaunchpadApplication, { foreignKey: 'launchpadId', as: 'applications' });
ExperienceLaunchpadApplication.belongsTo(ExperienceLaunchpad, { foreignKey: 'launchpadId', as: 'launchpad' });
ExperienceLaunchpadApplication.belongsTo(User, { foreignKey: 'applicantId', as: 'applicant' });
ExperienceLaunchpadApplication.belongsTo(Application, { foreignKey: 'applicationId', as: 'application' });

ExperienceLaunchpad.hasMany(ExperienceLaunchpadEmployerRequest, {
  foreignKey: 'launchpadId',
  as: 'employerRequests',
});
ExperienceLaunchpadEmployerRequest.belongsTo(ExperienceLaunchpad, {
  foreignKey: 'launchpadId',
  as: 'launchpad',
});
ExperienceLaunchpadEmployerRequest.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

ExperienceLaunchpad.hasMany(ExperienceLaunchpadPlacement, { foreignKey: 'launchpadId', as: 'placements' });
ExperienceLaunchpadPlacement.belongsTo(ExperienceLaunchpad, { foreignKey: 'launchpadId', as: 'launchpad' });
ExperienceLaunchpadPlacement.belongsTo(ExperienceLaunchpadApplication, {
  foreignKey: 'candidateId',
  as: 'candidate',
});
ExperienceLaunchpadPlacement.belongsTo(ExperienceLaunchpadEmployerRequest, {
  foreignKey: 'employerRequestId',
  as: 'employerRequest',
});

ExperienceLaunchpad.hasMany(ExperienceLaunchpadOpportunityLink, {
  foreignKey: 'launchpadId',
  as: 'opportunityLinks',
});
ExperienceLaunchpadOpportunityLink.belongsTo(ExperienceLaunchpad, {
  foreignKey: 'launchpadId',
  as: 'launchpad',
});
ExperienceLaunchpadOpportunityLink.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

MessageThread.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
MessageThread.hasMany(MessageParticipant, { foreignKey: 'threadId', as: 'participants' });
MessageThread.hasMany(MessageParticipant, { foreignKey: 'threadId', as: 'viewerParticipants' });
MessageThread.hasMany(Message, { foreignKey: 'threadId', as: 'messages' });
MessageThread.hasOne(SupportCase, { foreignKey: 'threadId', as: 'supportCase' });

MessageParticipant.belongsTo(MessageThread, { foreignKey: 'threadId', as: 'thread' });
MessageParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Message.belongsTo(MessageThread, { foreignKey: 'threadId', as: 'thread' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.hasMany(MessageAttachment, { foreignKey: 'messageId', as: 'attachments' });

MessageAttachment.belongsTo(Message, { foreignKey: 'messageId', as: 'message' });

SupportCase.belongsTo(MessageThread, { foreignKey: 'threadId', as: 'thread' });
SupportCase.belongsTo(User, { foreignKey: 'escalatedBy', as: 'escalatedByUser' });
SupportCase.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedAgent' });
SupportCase.belongsTo(User, { foreignKey: 'assignedBy', as: 'assignedByUser' });
SupportCase.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolvedByUser' });

Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });
NotificationPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(NotificationPreference, { foreignKey: 'userId', as: 'notificationPreference' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

User.hasMany(SearchSubscription, { foreignKey: 'userId', as: 'searchSubscriptions' });
SearchSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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

User.hasMany(EscrowAccount, { foreignKey: 'userId', as: 'escrowAccounts' });
EscrowAccount.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
EscrowAccount.hasMany(EscrowTransaction, { foreignKey: 'accountId', as: 'transactions' });

EscrowTransaction.belongsTo(EscrowAccount, { foreignKey: 'accountId', as: 'account' });
EscrowTransaction.belongsTo(User, { foreignKey: 'initiatedById', as: 'initiator' });
EscrowTransaction.belongsTo(User, { foreignKey: 'counterpartyId', as: 'counterparty' });
EscrowTransaction.hasMany(DisputeCase, { foreignKey: 'escrowTransactionId', as: 'disputes' });

DisputeCase.belongsTo(EscrowTransaction, { foreignKey: 'escrowTransactionId', as: 'transaction' });
DisputeCase.belongsTo(User, { foreignKey: 'openedById', as: 'openedBy' });
DisputeCase.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });
DisputeCase.hasMany(DisputeEvent, { foreignKey: 'disputeCaseId', as: 'events' });

DisputeEvent.belongsTo(DisputeCase, { foreignKey: 'disputeCaseId', as: 'disputeCase' });
DisputeEvent.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

export default {
  sequelize,
  User,
  Profile,
  ProfileReference,
  ProfileAppreciation,
  ProfileFollower,
  ProfileEngagementJob,
  CompanyProfile,
  AgencyProfile,
  FreelancerProfile,
  FeedPost,
  Job,
  Gig,
  Project,
  ExperienceLaunchpad,
  ExperienceLaunchpadApplication,
  ExperienceLaunchpadEmployerRequest,
  ExperienceLaunchpadPlacement,
  ExperienceLaunchpadOpportunityLink,
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
  SupportCase,
  Notification,
  NotificationPreference,
  AnalyticsEvent,
  AnalyticsDailyRollup,
  ProviderWorkspace,
  ProviderWorkspaceMember,
  ProviderWorkspaceInvite,
  ProviderContactNote,
  EscrowAccount,
  EscrowTransaction,
  DisputeCase,
  DisputeEvent,
  SearchSubscription,
  FreelancerAssignmentMetric,
  FreelancerFinanceMetric,
  FreelancerRevenueMonthly,
  FreelancerRevenueStream,
  FreelancerPayout,
  FreelancerTaxEstimate,
  FreelancerTaxFiling,
  FreelancerDeductionSummary,
  FreelancerProfitabilityMetric,
  FreelancerCostBreakdown,
  FreelancerSavingsGoal,
  FreelancerFinanceControl,
  ProjectAssignmentEvent,
  AutoAssignQueueEntry,
};
