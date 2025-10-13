import { Op } from 'sequelize';
import {
  ProviderWorkspace,
  ProviderWorkspaceMember,
  ProviderWorkspaceInvite,
  ProviderContactNote,
  CompanyProfile,
  User,
  Profile,
  Job,
  Gig,
  Project,
  Application,
  ApplicationReview,
  HiringAlert,
  CandidateDemographicSnapshot,
  CandidateSatisfactionSurvey,
  InterviewSchedule,
  JobStage,
  JobApprovalWorkflow,
  JobCampaignPerformance,
  PartnerEngagement,
  HeadhunterInvite,
  HeadhunterBrief,
  HeadhunterBriefAssignment,
  HeadhunterPerformanceSnapshot,
  HeadhunterCommission,
  TalentPool,
  TalentPoolMember,
  TalentPoolEngagement,
  AgencyCollaboration,
  AgencyCollaborationInvitation,
  AgencyRateCard,
  AgencyRateCardItem,
  AgencySlaSnapshot,
  AgencyBillingEvent,
  RecruitingCalendarEvent,
  EmployerBrandAsset,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'dashboard:company';
const CACHE_TTL_SECONDS = 45;
const MIN_LOOKBACK_DAYS = 7;
const MAX_LOOKBACK_DAYS = 180;

function clamp(value, { min, max, fallback }) {
  if (!Number.isFinite(Number(value))) {
    return fallback;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return fallback;
  }
  if (numeric < min) {
    return min;
  }
  if (numeric > max) {
    return max;
  }
  return numeric;
}

function differenceInDays(start, end = new Date()) {
  if (!start) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  const diffMs = endDate.getTime() - startDate.getTime();
  if (!Number.isFinite(diffMs)) {
    return null;
  }
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function average(numbers) {
  const valid = numbers.filter((value) => Number.isFinite(value));
  if (!valid.length) {
    return null;
  }
  const total = valid.reduce((sum, value) => sum + value, 0);
  return Number((total / valid.length).toFixed(1));
}

function median(numbers) {
  const valid = numbers.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!valid.length) {
    return null;
  }
  const mid = Math.floor(valid.length / 2);
  if (valid.length % 2 === 0) {
    return Number(((valid[mid - 1] + valid[mid]) / 2).toFixed(1));
  }
  return Number(valid[mid].toFixed(1));
}

function percentage(part, total) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total === 0) {
    return 0;
  }
  return Number(((part / total) * 100).toFixed(1));
}

function differenceInHours(start, end = new Date()) {
  if (!start) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  const diffMs = endDate.getTime() - startDate.getTime();
  if (!Number.isFinite(diffMs)) {
    return null;
  }
  return Number((diffMs / (1000 * 60 * 60)).toFixed(1));
}

function startOfQuarter(reference = new Date()) {
  const date = new Date(reference);
  const month = date.getMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  return new Date(date.getFullYear(), quarterStartMonth, 1);
}

function toPlain(record) {
  return record?.get ? record.get({ plain: true }) : record;
}

function safeNumber(value) {
  if (value == null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function sumBy(items, selector) {
  return items.reduce((total, item) => {
    const value = selector(item);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}

function resolveWorkspaceSelector({ workspaceId, workspaceSlug }) {
  if (workspaceId != null && `${workspaceId}`.trim().length) {
    const parsed = Number(workspaceId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new ValidationError('workspaceId must be a positive integer.');
    }
    return { id: parsed };
  }

  if (workspaceSlug != null && `${workspaceSlug}`.trim().length) {
    return { slug: `${workspaceSlug}`.trim() };
  }

  throw new ValidationError('workspaceId or workspaceSlug is required.');
}

function buildMemberSummary(members) {
  const totals = {
    total: members.length,
    active: 0,
    pending: 0,
    bench: 0,
    averageWeeklyCapacity: null,
    timezones: new Set(),
  };

  const capacities = [];

  members.forEach((member) => {
    if (member.status === 'active') {
      totals.active += 1;
    }
    if (member.status === 'pending') {
      totals.pending += 1;
    }

    const profile = member.member?.Profile ?? member.member?.profile ?? null;
    if (profile?.availabilityStatus === 'available') {
      totals.bench += 1;
    }
    if (profile?.availableHoursPerWeek != null) {
      const numeric = Number(profile.availableHoursPerWeek);
      if (Number.isFinite(numeric)) {
        capacities.push(numeric);
      }
    }
    if (profile?.timezone) {
      totals.timezones.add(profile.timezone);
    }
  });

  totals.averageWeeklyCapacity = capacities.length ? average(capacities) : null;
  totals.uniqueTimezones = totals.timezones.size;
  delete totals.timezones;

  return totals;
}

function buildInviteSummary(invites) {
  if (!invites.length) {
    return { pending: 0, accepted: 0, expired: 0, lastSentAt: null };
  }

  const summary = { pending: 0, accepted: 0, expired: 0, lastSentAt: null };
  invites.forEach((invite) => {
    if (invite.status === 'pending') {
      summary.pending += 1;
    } else if (invite.status === 'accepted') {
      summary.accepted += 1;
    } else if (invite.status === 'expired' || invite.status === 'revoked') {
      summary.expired += 1;
    }

    if (!summary.lastSentAt || new Date(invite.createdAt) > new Date(summary.lastSentAt)) {
      summary.lastSentAt = invite.createdAt;
    }
  });
  return summary;
}

function buildPipelineSummary(applications) {
  const statusCounts = new Map();
  const sourceCounts = new Map();
  const velocityToDecision = [];
  const velocityToInterview = [];
  let interviews = 0;
  let offers = 0;
  let hires = 0;

  applications.forEach((application) => {
    statusCounts.set(application.status, (statusCounts.get(application.status) ?? 0) + 1);
    sourceCounts.set(application.sourceChannel, (sourceCounts.get(application.sourceChannel) ?? 0) + 1);

    if (application.status === 'interview') {
      interviews += 1;
    }
    if (application.status === 'offered') {
      offers += 1;
    }
    if (application.status === 'hired') {
      hires += 1;
    }

    if (application.decisionAt) {
      const days = differenceInDays(application.submittedAt ?? application.createdAt, application.decisionAt);
      if (Number.isFinite(days)) {
        velocityToDecision.push(days);
      }
    }

    if (application.metadata?.interviewScheduledAt) {
      const days = differenceInDays(
        application.submittedAt ?? application.createdAt,
        application.metadata.interviewScheduledAt,
      );
      if (Number.isFinite(days)) {
        velocityToInterview.push(days);
      }
    }
  });

  const totalApplications = applications.length;
  const convertedStatuses = Object.fromEntries(statusCounts.entries());
  const sources = Object.fromEntries(sourceCounts.entries());

  return {
    totals: {
      applications: totalApplications,
      interviews,
      offers,
      hires,
    },
    byStatus: convertedStatuses,
    bySource: sources,
    velocity: {
      averageDaysToDecision: average(velocityToDecision),
      medianDaysToInterview: median(velocityToInterview),
    },
    conversionRates: {
      offerRate: percentage(offers, totalApplications),
      hireRate: percentage(hires, totalApplications),
      interviewRate: percentage(interviews, totalApplications),
    },
  };
}

function buildProjectSummary(projects) {
  const buckets = {
    active: 0,
    planning: 0,
    atRisk: 0,
    completed: 0,
  };

  let automationEnabled = 0;
  let automationQueue = 0;

  projects.forEach((project) => {
    const status = (project.status ?? '').toLowerCase();
    if (['draft', 'planning', 'proposal', 'scoping'].includes(status)) {
      buckets.planning += 1;
    } else if (['delayed', 'blocked', 'on_hold', 'at_risk'].includes(status)) {
      buckets.atRisk += 1;
    } else if (['completed', 'closed', 'archived'].includes(status)) {
      buckets.completed += 1;
    } else {
      buckets.active += 1;
    }

    if (project.autoAssignEnabled) {
      automationEnabled += 1;
      if (project.autoAssignLastQueueSize != null) {
        const numeric = Number(project.autoAssignLastQueueSize);
        if (Number.isFinite(numeric)) {
          automationQueue += numeric;
        }
      }
    }
  });

  return {
    totals: buckets,
    automation: {
      automationEnabled,
      queueSize: automationQueue,
    },
  };
}

function sanitiseWorkspace(workspace, memberSummary, inviteSummary, badges = []) {
  const plain = workspace.get({ plain: true });
  const owner = workspace.owner?.get?.({ plain: true }) ?? workspace.owner ?? null;
  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    timezone: plain.timezone,
    defaultCurrency: plain.defaultCurrency,
    intakeEmail: plain.intakeEmail,
    type: plain.type,
    isActive: plain.isActive,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    memberSummary,
    inviteSummary,
    health: {
      badges,
    },
    owner: owner
      ? {
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
        }
      : null,
  };
}

function deriveWorkspaceBadges({ memberSummary, pipelineSummary, projectSummary }) {
  const badges = new Set();
  if ((memberSummary?.active ?? 0) >= 10) {
    badges.add('Scaled recruiting operations');
  }
  if ((pipelineSummary?.conversionRates?.hireRate ?? 0) >= 15) {
    badges.add('High offer acceptance');
  }
  if ((projectSummary?.automation?.automationEnabled ?? 0) > 0) {
    badges.add('Automation enabled');
  }
  if ((memberSummary?.uniqueTimezones ?? 0) > 2) {
    badges.add('Global hiring coverage');
  }
  return Array.from(badges);
}

function sanitizeProfile(companyProfile) {
  if (!companyProfile) {
    return null;
  }
  const plain = companyProfile.get ? companyProfile.get({ plain: true }) : companyProfile;
  return {
    companyName: plain.companyName,
    description: plain.description,
    website: plain.website,
  };
}

function buildRecentNotes(notes) {
  return notes.map((note) => {
    const plain = note.get ? note.get({ plain: true }) : note;
    const author = note.author?.get?.({ plain: true }) ?? note.author ?? null;
    const subject = note.subject?.get?.({ plain: true }) ?? note.subject ?? null;
    return {
      id: plain.id,
      visibility: plain.visibility,
      note: plain.note,
      createdAt: plain.createdAt,
      author: author
        ? {
            id: author.id,
            firstName: author.firstName,
            lastName: author.lastName,
            email: author.email,
          }
        : null,
      subject: subject
        ? {
            id: subject.id,
            firstName: subject.firstName,
            lastName: subject.lastName,
            email: subject.email,
          }
        : null,
    };
  });
}

async function fetchWorkspace(selector) {
  const workspace = await ProviderWorkspace.findOne({
    where: {
      type: 'company',
      ...(selector.id ? { id: selector.id } : {}),
      ...(selector.slug ? { slug: selector.slug } : {}),
    },
    include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });

  if (!workspace) {
    throw new NotFoundError('Company workspace not found.');
  }

  return workspace;
}

async function fetchMembers(workspaceId) {
  return ProviderWorkspaceMember.findAll({
    where: { workspaceId },
    include: [
      {
        model: User,
        as: 'member',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        include: [
          {
            model: Profile,
            as: 'Profile',
            attributes: ['availabilityStatus', 'availableHoursPerWeek', 'timezone'],
            required: false,
          },
        ],
      },
    ],
    order: [['createdAt', 'ASC']],
  });
}

async function fetchInvites(workspaceId) {
  return ProviderWorkspaceInvite.findAll({
    where: { workspaceId },
    order: [['createdAt', 'DESC']],
  });
}

async function fetchNotes(workspaceId) {
  return ProviderContactNote.findAll({
    where: { workspaceId },
    include: [
      { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'subject', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    limit: 8,
    order: [['createdAt', 'DESC']],
  });
}

async function fetchApplications({ workspaceId, since }) {
  const where = {
    targetType: { [Op.in]: ['job', 'project', 'gig'] },
  };

  if (since) {
    where.createdAt = { [Op.gte]: since };
  }

  // We do not yet store a direct foreign key to the company workspace on applications.
  // As a pragmatic interim, we scope by metadata.workspaceId when present and fall back to all records.
  const applications = await Application.findAll({
    where,
    attributes: [
      'id',
      'applicantId',
      'targetType',
      'targetId',
      'status',
      'sourceChannel',
      'submittedAt',
      'decisionAt',
      'createdAt',
      'updatedAt',
      'metadata',
    ],
  });

  if (!applications.length) {
    return applications;
  }

  return applications.filter((application) => {
    const metadata = application.metadata ?? {};
    if (!metadata || typeof metadata !== 'object') {
      return true;
    }
    if (metadata.companyWorkspaceId && Number.isInteger(metadata.companyWorkspaceId)) {
      return Number(metadata.companyWorkspaceId) === workspaceId;
    }
    if (metadata.workspaceId && Number.isInteger(metadata.workspaceId)) {
      return Number(metadata.workspaceId) === workspaceId;
    }
    return true;
  });
}

async function fetchApplicationReviews({ applicationIds, since }) {
  if (!applicationIds.length) {
    return [];
  }
  const where = { applicationId: { [Op.in]: applicationIds } };
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return ApplicationReview.findAll({
    where,
    attributes: ['id', 'applicationId', 'stage', 'decision', 'score', 'decidedAt', 'createdAt'],
  });
}

async function fetchProjects({ since, workspaceId }) {
  const where = {};
  if (since) {
    where.updatedAt = { [Op.gte]: since };
  }
  const projects = await Project.findAll({
    where,
    attributes: [
      'id',
      'status',
      'autoAssignEnabled',
      'autoAssignLastQueueSize',
      'autoAssignSettings',
      'createdAt',
      'updatedAt',
    ],
  });

  if (!projects.length) {
    return projects;
  }

  // Filter by metadata if present.
  return projects.filter((project) => {
    const metadata = project.autoAssignSettings ?? {};
    if (metadata && typeof metadata === 'object') {
      if (metadata.companyWorkspaceId && Number.isInteger(metadata.companyWorkspaceId)) {
        return Number(metadata.companyWorkspaceId) === workspaceId;
      }
      if (metadata.workspaceId && Number.isInteger(metadata.workspaceId)) {
        return Number(metadata.workspaceId) === workspaceId;
      }
    }
    return true;
  });
}

async function fetchJobs({ since }) {
  const where = {};
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return Job.findAll({ where, attributes: ['id', 'title', 'location', 'createdAt'] });
}

async function fetchGigs({ since }) {
  const where = {};
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return Gig.findAll({ where, attributes: ['id', 'title', 'location', 'createdAt'] });
}

async function fetchHiringAlerts({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.detectedAt = { [Op.gte]: since };
  }
  return HiringAlert.findAll({
    where,
    order: [['detectedAt', 'DESC']],
    limit: 25,
  });
}

async function fetchCandidateSnapshots({ workspaceId, applicationIds, since }) {
  const where = { workspaceId };
  if (since) {
    where.capturedAt = { [Op.gte]: since };
  }
  if (applicationIds?.length) {
    where.applicationId = { [Op.in]: applicationIds };
  }
  return CandidateDemographicSnapshot.findAll({
    where,
    attributes: [
      'id',
      'applicationId',
      'genderIdentity',
      'ethnicity',
      'veteranStatus',
      'disabilityStatus',
      'capturedAt',
    ],
    limit: 500,
  });
}

async function fetchCandidateSurveys({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.responseAt = { [Op.gte]: since };
  }
  return CandidateSatisfactionSurvey.findAll({
    where,
    order: [['responseAt', 'DESC']],
    limit: 100,
  });
}

async function fetchInterviewSchedules({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.scheduledAt = { [Op.gte]: since };
  }
  return InterviewSchedule.findAll({
    where,
    order: [['scheduledAt', 'ASC']],
    limit: 100,
  });
}

async function fetchJobStagesData({ workspaceId }) {
  return JobStage.findAll({
    where: { workspaceId },
    order: [['orderIndex', 'ASC']],
    limit: 50,
  });
}

async function fetchJobApprovals({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return JobApprovalWorkflow.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: 100,
  });
}

async function fetchJobCampaigns({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.reportingDate = { [Op.gte]: since };
  }
  return JobCampaignPerformance.findAll({
    where,
    order: [['reportingDate', 'DESC']],
    limit: 120,
  });
}

async function fetchPartnerEngagements({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.lastInteractionAt = { [Op.gte]: since };
  }
  return PartnerEngagement.findAll({
    where,
    order: [['lastInteractionAt', 'DESC']],
    limit: 50,
  });
}

async function fetchHeadhunterInvites({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.sentAt = { [Op.gte]: since };
  }
  return HeadhunterInvite.findAll({
    where,
    include: [{ model: ProviderWorkspace, as: 'headhunterWorkspace', attributes: ['id', 'name', 'type'] }],
    order: [['sentAt', 'DESC']],
    limit: 100,
  });
}

async function fetchHeadhunterBriefs({ workspaceId }) {
  return HeadhunterBrief.findAll({
    where: { workspaceId },
    include: [
      {
        model: HeadhunterBriefAssignment,
        as: 'assignments',
        include: [{ model: ProviderWorkspace, as: 'headhunterWorkspace', attributes: ['id', 'name', 'type'] }],
      },
    ],
    order: [['updatedAt', 'DESC']],
    limit: 80,
  });
}

async function fetchHeadhunterAssignments({ workspaceId }) {
  return HeadhunterBriefAssignment.findAll({
    where: { workspaceId },
    include: [
      { model: HeadhunterBrief, as: 'brief', attributes: ['id', 'title', 'status', 'dueAt'] },
      { model: ProviderWorkspace, as: 'headhunterWorkspace', attributes: ['id', 'name'] },
    ],
  });
}

async function fetchHeadhunterPerformance({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.periodEnd = { [Op.gte]: since };
  }
  return HeadhunterPerformanceSnapshot.findAll({
    where,
    include: [{ model: ProviderWorkspace, as: 'headhunterWorkspace', attributes: ['id', 'name'] }],
    order: [['periodEnd', 'DESC']],
    limit: 100,
  });
}

async function fetchHeadhunterCommissions({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.updatedAt = { [Op.gte]: since };
  }
  return HeadhunterCommission.findAll({
    where,
    include: [
      { model: HeadhunterBrief, as: 'brief', attributes: ['id', 'title'] },
      { model: ProviderWorkspace, as: 'headhunterWorkspace', attributes: ['id', 'name'] },
    ],
    order: [['dueAt', 'ASC']],
  });
}

async function fetchTalentPools({ workspaceId }) {
  return TalentPool.findAll({
    where: { workspaceId },
    include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    order: [['updatedAt', 'DESC']],
    limit: 60,
  });
}

async function fetchTalentPoolMembers({ workspaceId }) {
  return TalentPoolMember.findAll({
    where: { workspaceId },
    include: [{ model: TalentPool, as: 'pool', attributes: ['id', 'name', 'poolType'] }],
    order: [['updatedAt', 'DESC']],
    limit: 300,
  });
}

async function fetchTalentPoolEngagements({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.occurredAt = { [Op.gte]: since };
  }
  return TalentPoolEngagement.findAll({
    where,
    include: [
      { model: TalentPool, as: 'pool', attributes: ['id', 'name'] },
      { model: User, as: 'performedBy', attributes: ['id', 'firstName', 'lastName'] },
    ],
    order: [['occurredAt', 'DESC']],
    limit: 120,
  });
}

async function fetchAgencyCollaborations({ workspaceId }) {
  const collaborations = await AgencyCollaboration.findAll({
    include: [{ model: ProviderWorkspace, as: 'agencyWorkspace', attributes: ['id', 'name', 'slug'] }],
    order: [['updatedAt', 'DESC']],
    limit: 80,
  });

  return collaborations.filter((collaboration) => {
    const plain = collaboration?.get ? collaboration.get({ plain: true }) : collaboration;
    const snapshot = plain.sharedDeliverySnapshot ?? {};
    if (snapshot && typeof snapshot === 'object' && Number.isInteger(snapshot.companyWorkspaceId)) {
      return Number(snapshot.companyWorkspaceId) === workspaceId;
    }
    return true;
  });
}

async function fetchAgencyInvitations({ collaborationIds }) {
  if (!collaborationIds.length) {
    return [];
  }
  return AgencyCollaborationInvitation.findAll({
    where: { collaborationId: { [Op.in]: collaborationIds } },
    order: [['createdAt', 'DESC']],
  });
}

async function fetchAgencyRateCards({ agencyWorkspaceIds }) {
  if (!agencyWorkspaceIds.length) {
    return [];
  }
  return AgencyRateCard.findAll({
    where: { agencyWorkspaceId: { [Op.in]: agencyWorkspaceIds } },
    include: [{ model: AgencyRateCardItem, as: 'items' }],
    order: [['updatedAt', 'DESC']],
    limit: 60,
  });
}

async function fetchAgencySlaSnapshots({ collaborationIds, since }) {
  if (!collaborationIds.length) {
    return [];
  }
  const where = { agencyCollaborationId: { [Op.in]: collaborationIds } };
  if (since) {
    where.periodEnd = { [Op.gte]: since };
  }
  return AgencySlaSnapshot.findAll({
    where,
    order: [['periodEnd', 'DESC']],
  });
}

async function fetchAgencyBillingEvents({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.updatedAt = { [Op.gte]: since };
  }
  return AgencyBillingEvent.findAll({
    where,
    order: [['dueAt', 'ASC']],
    limit: 120,
  });
}

async function fetchCalendarEvents({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.startsAt = { [Op.gte]: since };
  }
  return RecruitingCalendarEvent.findAll({
    where,
    order: [['startsAt', 'ASC']],
    limit: 50,
  });
}

async function fetchBrandAssets({ workspaceId }) {
  return EmployerBrandAsset.findAll({
    where: { workspaceId },
    order: [['updatedAt', 'DESC']],
    limit: 25,
  });
}

function buildJobSummary({ jobs, gigs }) {
  const total = jobs.length + gigs.length;
  const byType = {
    jobs: jobs.length,
    gigs: gigs.length,
  };

  const locations = new Map();
  [...jobs, ...gigs].forEach((record) => {
    if (record.location) {
      locations.set(record.location, (locations.get(record.location) ?? 0) + 1);
    }
  });

  return {
    total,
    byType,
    topLocations: Array.from(locations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count })),
  };
}

function buildRecommendations({ memberSummary, pipelineSummary, inviteSummary }) {
  const recommendations = [];

  if ((inviteSummary?.pending ?? 0) > 0) {
    recommendations.push({
      title: 'Follow up on pending invites',
      description:
        'A few workspace invites are still awaiting acceptance. Consider nudging stakeholders to maintain hiring momentum.',
      action: 'Review pending invites and resend reminders where appropriate.',
    });
  }

  if ((pipelineSummary?.conversionRates?.interviewRate ?? 0) < 25) {
    recommendations.push({
      title: 'Increase interview throughput',
      description: 'Interview conversion is below target for the selected lookback window.',
      action: 'Audit screening criteria and ensure interviewers are responding promptly to scheduling requests.',
    });
  }

  if ((memberSummary?.bench ?? 0) > 0) {
    recommendations.push({
      title: 'Re-engage bench recruiters',
      description: 'Some active workspace members are marked as available. Balance load by assigning them to priority roles.',
      action: 'Distribute requisitions to underutilised teammates and share refreshed hiring goals.',
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      title: 'Keep momentum strong',
      description:
        'Hiring operations are running smoothly. Continue monitoring interview velocity and candidate experience metrics.',
      action: 'Schedule a weekly review to celebrate wins and align on upcoming requisitions.',
    });
  }

  return recommendations;
}

function normalizeCategory(value, fallback = 'Unspecified') {
  if (value == null) {
    return fallback;
  }
  const label = `${value}`.trim();
  return label.length ? label : fallback;
}

function buildBreakdown(records, key) {
  const counts = new Map();
  records.forEach((record) => {
    const plain = record?.get ? record.get({ plain: true }) : record;
    const label = normalizeCategory(plain?.[key]);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return counts;
}

function formatBreakdown(counts, total) {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, percentage: percentage(count, total) }));
}

function computeDiversityIndex(counts, total) {
  if (!total) {
    return null;
  }
  const normalised = Array.from(counts.values()).reduce((sum, count) => {
    const share = count / total;
    return sum + share * share;
  }, 0);
  return Number((1 - normalised).toFixed(3));
}

function buildDiversityMetrics(snapshots) {
  const total = snapshots.length;
  if (!total) {
    return {
      total,
      breakdowns: {
        gender: [],
        ethnicity: [],
        veteranStatus: [],
        disabilityStatus: [],
      },
      representationIndex: null,
    };
  }

  const genderCounts = buildBreakdown(snapshots, 'genderIdentity');
  const ethnicityCounts = buildBreakdown(snapshots, 'ethnicity');
  const veteranCounts = buildBreakdown(snapshots, 'veteranStatus');
  const disabilityCounts = buildBreakdown(snapshots, 'disabilityStatus');

  return {
    total,
    breakdowns: {
      gender: formatBreakdown(genderCounts, total),
      ethnicity: formatBreakdown(ethnicityCounts, total),
      veteranStatus: formatBreakdown(veteranCounts, total),
      disabilityStatus: formatBreakdown(disabilityCounts, total),
    },
    representationIndex: computeDiversityIndex(ethnicityCounts, total),
  };
}

function sanitizeAlert(alert) {
  const plain = alert?.get ? alert.get({ plain: true }) : alert;
  return {
    id: plain.id,
    category: plain.category,
    severity: plain.severity,
    status: plain.status,
    message: plain.message,
    detectedAt: plain.detectedAt,
    resolvedAt: plain.resolvedAt,
  };
}

function buildAlertsSummary(alerts) {
  if (!alerts?.length) {
    return {
      total: 0,
      open: 0,
      acknowledged: 0,
      resolved: 0,
      bySeverity: {},
      byCategory: {},
      latestDetection: null,
      items: [],
    };
  }

  const bySeverity = new Map();
  const byCategory = new Map();
  let open = 0;
  let acknowledged = 0;
  let resolved = 0;
  let latestDetection = null;

  alerts.forEach((alert) => {
    const plain = alert?.get ? alert.get({ plain: true }) : alert;
    bySeverity.set(plain.severity, (bySeverity.get(plain.severity) ?? 0) + 1);
    byCategory.set(plain.category, (byCategory.get(plain.category) ?? 0) + 1);

    if (plain.status === 'open') {
      open += 1;
    } else if (plain.status === 'acknowledged') {
      acknowledged += 1;
    } else if (plain.status === 'resolved') {
      resolved += 1;
    }

    if (!latestDetection || new Date(plain.detectedAt) > new Date(latestDetection)) {
      latestDetection = plain.detectedAt;
    }
  });

  return {
    total: alerts.length,
    open,
    acknowledged,
    resolved,
    bySeverity: Object.fromEntries(bySeverity.entries()),
    byCategory: Object.fromEntries(byCategory.entries()),
    latestDetection,
    items: alerts.slice(0, 12).map(sanitizeAlert),
  };
}

function buildJobLifecycleInsights({ jobStages, approvals, campaigns, pipelineSummary, jobSummary }) {
  const sortedStages = [...jobStages].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  const averageStageDuration = average(
    sortedStages
      .map((stage) => (stage.averageDurationHours == null ? null : Number(stage.averageDurationHours)))
      .filter((value) => Number.isFinite(value)),
  );

  const pendingApprovals = approvals.filter((item) => item.status !== 'approved');
  const overdueApprovals = pendingApprovals.filter((item) => {
    if (!item.dueAt) return false;
    return new Date(item.dueAt) < new Date();
  });

  const completionDurations = approvals
    .filter((item) => item.completedAt)
    .map((item) => {
      const end = new Date(item.completedAt);
      const start = item.createdAt ? new Date(item.createdAt) : null;
      if (!start || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
      }
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return Number.isFinite(diffHours) ? diffHours : null;
    })
    .filter((value) => Number.isFinite(value));

  const campaignsByChannel = new Map();
  campaigns.forEach((campaign) => {
    const channel = normalizeCategory(campaign.channel, 'Direct');
    const entry = campaignsByChannel.get(channel) ?? {
      impressions: 0,
      clicks: 0,
      applications: 0,
      hires: 0,
      spend: 0,
    };
    entry.impressions += Number(campaign.impressions ?? 0);
    entry.clicks += Number(campaign.clicks ?? 0);
    entry.applications += Number(campaign.applications ?? 0);
    entry.hires += Number(campaign.hires ?? 0);
    entry.spend += Number.parseFloat(campaign.spendAmount ?? 0);
    campaignsByChannel.set(channel, entry);
  });

  const totalSpend = Array.from(campaignsByChannel.values()).reduce((sum, entry) => sum + entry.spend, 0);

  return {
    totalStages: jobStages.length,
    averageStageDurationHours: averageStageDuration,
    pendingApprovals: pendingApprovals.length,
    overdueApprovals: overdueApprovals.length,
    averageApprovalTurnaroundHours: completionDurations.length ? Number(average(completionDurations)) : null,
    stageGuides: sortedStages.slice(0, 8).map((stage) => ({
      id: stage.id,
      name: stage.name,
      slaHours: stage.slaHours,
      averageDurationHours: stage.averageDurationHours == null ? null : Number(stage.averageDurationHours),
      guideUrl: stage.guideUrl,
    })),
    campaigns: {
      totalSpend,
      byChannel: Array.from(campaignsByChannel.entries())
        .sort((a, b) => b[1].applications - a[1].applications)
        .map(([channel, metrics]) => ({
          channel,
          ...metrics,
          conversionRate: metrics.applications ? Number(((metrics.hires / metrics.applications) * 100).toFixed(1)) : 0,
        })),
    },
    atsHealth: {
      conversionRates: pipelineSummary?.conversionRates ?? {},
      velocity: pipelineSummary?.velocity ?? {},
      activeRequisitions: jobSummary?.total ?? 0,
    },
  };
}

function buildJobDesignStudioSummary({ approvals, jobStages, jobSummary, alerts }) {
  const approvalsInFlight = approvals.filter((item) => ['pending', 'in_review'].includes(item.status));
  const coAuthorSessions = approvals.filter((item) => (item.metadata?.coAuthorCount ?? 1) > 1);
  const complianceAlerts = alerts.items.filter((item) => normalizeCategory(item.category).toLowerCase().includes('compliance'));

  return {
    totalRequisitions: jobSummary?.total ?? 0,
    approvalsInFlight: approvalsInFlight.length,
    coAuthorSessions: coAuthorSessions.length,
    structuredStages: jobStages.length,
    complianceAlerts: complianceAlerts.length,
  };
}

function buildSourcingSummary({ pipelineSummary, campaigns }) {
  const sources = Object.entries(pipelineSummary?.bySource ?? {}).map(([source, count]) => ({
    source,
    count,
    percentage: percentage(count, pipelineSummary?.totals?.applications ?? 0),
  }));

  const campaignTotals = campaigns.reduce(
    (totals, campaign) => {
      totals.applications += Number(campaign.applications ?? 0);
      totals.hires += Number(campaign.hires ?? 0);
      totals.spend += Number.parseFloat(campaign.spendAmount ?? 0);
      return totals;
    },
    { applications: 0, hires: 0, spend: 0 },
  );

  return {
    sources: sources.sort((a, b) => b.count - a.count),
    campaignTotals,
    averageCostPerApplication:
      campaignTotals.applications > 0 ? Number((campaignTotals.spend / campaignTotals.applications).toFixed(2)) : null,
    hireContributionRate:
      campaignTotals.applications > 0 ? percentage(campaignTotals.hires, campaignTotals.applications) : 0,
  };
}

function buildApplicantRelationshipManagerSummary({ surveys, pipelineSummary, partnerSummary }) {
  const followUpsScheduled = surveys.filter((survey) => {
    if (!survey.followUpScheduledAt) return false;
    return new Date(survey.followUpScheduledAt) > new Date();
  }).length;
  const complianceReviews = surveys.filter((survey) => normalizeCategory(survey.sentiment).toLowerCase() === 'compliance').length;

  return {
    totalActiveCandidates: pipelineSummary?.totals?.applications ?? 0,
    nurtureCampaigns: partnerSummary?.touchpoints ?? 0,
    followUpsScheduled,
    complianceReviews,
  };
}

function buildAnalyticsForecastingSummary({ pipelineSummary, jobSummary, projectSummary }) {
  const applications = pipelineSummary?.totals?.applications ?? 0;
  const hireRate = pipelineSummary?.conversionRates?.hireRate ?? 0;
  const projectedHires = Math.round((applications * hireRate) / 100);
  const backlog = (jobSummary?.total ?? 0) - projectedHires;
  const atRiskProjects = projectSummary?.totals?.atRisk ?? 0;

  return {
    projectedHires,
    backlog: backlog > 0 ? backlog : 0,
    timeToFillDays: pipelineSummary?.velocity?.averageDaysToDecision ?? null,
    atRiskProjects,
  };
}

function buildInterviewOperationsSummary({ schedules, reviews }) {
  const now = new Date();
  const upcoming = [];
  const durations = [];
  const leadTimes = [];
  let reschedules = 0;

  schedules.forEach((schedule) => {
    const plain = schedule?.get ? schedule.get({ plain: true }) : schedule;
    if (plain.rescheduleCount) {
      reschedules += Number(plain.rescheduleCount);
    }
    if (plain.durationMinutes != null) {
      durations.push(Number(plain.durationMinutes));
    }
    if (plain.createdAt && plain.scheduledAt) {
      const start = new Date(plain.createdAt);
      const scheduled = new Date(plain.scheduledAt);
      if (Number.isFinite(start.getTime()) && Number.isFinite(scheduled.getTime())) {
        const hours = (scheduled.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (Number.isFinite(hours)) {
          leadTimes.push(hours);
        }
      }
    }
    if (!plain.completedAt && plain.scheduledAt && new Date(plain.scheduledAt) >= now) {
      upcoming.push({
        id: plain.id,
        stage: plain.interviewStage,
        scheduledAt: plain.scheduledAt,
        interviewerCount: Array.isArray(plain.interviewerRoster) ? plain.interviewerRoster.length : null,
      });
    }
  });

  const completedReviews = reviews.filter((review) => review.decision && review.decision !== 'pending');

  return {
    upcomingCount: upcoming.length,
    upcoming: upcoming.slice(0, 6),
    averageDurationMinutes: durations.length ? Number(average(durations)) : null,
    averageLeadTimeHours: leadTimes.length ? Number(average(leadTimes).toFixed(1)) : null,
    rescheduleRate: schedules.length ? percentage(reschedules, schedules.length) : 0,
    feedbackLogged: completedReviews.length,
  };
}

function buildCandidateExperienceSummary({ surveys }) {
  if (!surveys.length) {
    return {
      responseCount: 0,
      averageScore: null,
      nps: null,
      sentiments: {},
      followUpsPending: 0,
      latestFeedback: [],
    };
  }

  const scores = [];
  let promoters = 0;
  let detractors = 0;
  const sentiments = new Map();
  let followUpsPending = 0;

  const latestFeedback = surveys
    .slice()
    .sort((a, b) => new Date(b.responseAt ?? b.createdAt ?? 0) - new Date(a.responseAt ?? a.createdAt ?? 0))
    .slice(0, 6)
    .map((survey) => {
      const plain = survey?.get ? survey.get({ plain: true }) : survey;
      return {
        id: plain.id,
        stage: plain.stage,
        score: plain.score,
        npsRating: plain.npsRating,
        sentiment: plain.sentiment,
        notes: plain.notes,
        responseAt: plain.responseAt,
      };
    });

  surveys.forEach((survey) => {
    const plain = survey?.get ? survey.get({ plain: true }) : survey;
    if (plain.score != null && Number.isFinite(Number(plain.score))) {
      scores.push(Number(plain.score));
    }
    if (plain.npsRating != null && Number.isFinite(Number(plain.npsRating))) {
      const rating = Number(plain.npsRating);
      if (rating >= 9) promoters += 1;
      else if (rating <= 6) detractors += 1;
    }
    const sentimentLabel = normalizeCategory(plain.sentiment);
    sentiments.set(sentimentLabel, (sentiments.get(sentimentLabel) ?? 0) + 1);
    if (plain.followUpScheduledAt && new Date(plain.followUpScheduledAt) > new Date()) {
      followUpsPending += 1;
    }
  });

  const totalResponses = surveys.length;
  const nps = totalResponses ? Number((((promoters - detractors) / totalResponses) * 100).toFixed(1)) : null;

  return {
    responseCount: totalResponses,
    averageScore: scores.length ? Number(average(scores).toFixed(1)) : null,
    nps,
    sentiments: Object.fromEntries(sentiments.entries()),
    followUpsPending,
    latestFeedback,
  };
}

function buildOfferAndOnboardingSummary({ offers, candidateExperience, interviewOperations, applications, alerts }) {
  const openOffers = Math.max((offers?.extended ?? 0) - (offers?.accepted ?? 0), 0);
  const rescheduleAlerts = alerts.items.filter((item) => normalizeCategory(item.category).toLowerCase().includes('schedule'));

  const startLeadTimes = applications
    .filter((application) => application.status === 'hired' && application.decisionAt && application.availabilityDate)
    .map((application) => {
      const decision = new Date(application.decisionAt);
      const availability = new Date(application.availabilityDate);
      if (Number.isNaN(decision.getTime()) || Number.isNaN(availability.getTime())) {
        return null;
      }
      const diff = (availability.getTime() - decision.getTime()) / (1000 * 60 * 60 * 24);
      return Number.isFinite(diff) ? diff : null;
    })
    .filter((value) => Number.isFinite(value));

  return {
    openOffers,
    acceptanceRate: offers?.winRate ?? 0,
    onboardingFollowUps: candidateExperience.followUpsPending ?? 0,
    interviewsToSchedule: interviewOperations.upcomingCount ?? 0,
    scheduleAlerts: rescheduleAlerts.length,
    averageDaysToStart: startLeadTimes.length ? Number(average(startLeadTimes).toFixed(1)) : null,
  };
}

function buildCandidateCareSummary({ candidateExperience, alerts }) {
  const escalations = alerts.items.filter((item) => normalizeCategory(item.category).toLowerCase().includes('experience'));

  return {
    satisfaction: candidateExperience.averageScore,
    nps: candidateExperience.nps,
    followUpsPending: candidateExperience.followUpsPending,
    escalations: escalations.length,
  };
}

function buildPartnerCollaborationSummary({ partnerSummary, engagements }) {
  const leaderboard = engagements
    .map((engagement) => {
      const plain = engagement?.get ? engagement.get({ plain: true }) : engagement;
      return {
        name: plain.partnerName,
        type: plain.partnerType,
        touchpoints: plain.touchpoints,
        activeBriefs: plain.activeBriefs,
        conversionRate: plain.conversionRate == null ? null : Number(plain.conversionRate),
        lastInteractionAt: plain.lastInteractionAt,
      };
    })
    .sort((a, b) => (b.conversionRate ?? 0) - (a.conversionRate ?? 0));

  return {
    engagedContacts: partnerSummary?.engagedContacts ?? 0,
    touchpoints: partnerSummary?.touchpoints ?? 0,
    pendingInvites: partnerSummary?.pendingInvites ?? 0,
    activePartners: engagements.length,
    leaderboard: leaderboard.slice(0, 6),
  };
}

function buildHeadhunterProgramSummary({ invites, briefs, assignments, performanceSnapshots, commissions, lookbackDays }) {
  const inviteRecords = (invites ?? []).map(toPlain);
  const briefRecords = (briefs ?? []).map((brief) => (brief?.toPublicObject ? brief.toPublicObject() : toPlain(brief)));
  const assignmentRecords = (assignments ?? []).map((assignment) =>
    assignment?.toPublicObject ? assignment.toPublicObject() : toPlain(assignment),
  );
  const performanceRecords = (performanceSnapshots ?? []).map((snapshot) =>
    snapshot?.toPublicObject ? snapshot.toPublicObject() : toPlain(snapshot),
  );
  const commissionRecords = (commissions ?? []).map((commission) =>
    commission?.toPublicObject ? commission.toPublicObject() : toPlain(commission),
  );

  const inviteSummary = {
    total: inviteRecords.length,
    accepted: 0,
    pending: 0,
    declined: 0,
    expired: 0,
    acceptanceRate: 0,
    medianResponseHours: null,
    lastInviteAt: null,
  };

  const inviteResponseHours = [];

  inviteRecords.forEach((invite) => {
    if (invite.status === 'accepted') {
      inviteSummary.accepted += 1;
    } else if (invite.status === 'pending') {
      inviteSummary.pending += 1;
    } else if (invite.status === 'declined') {
      inviteSummary.declined += 1;
    } else if (invite.status === 'expired' || invite.status === 'revoked') {
      inviteSummary.expired += 1;
    }

    const response = differenceInHours(invite.sentAt, invite.respondedAt);
    if (Number.isFinite(response)) {
      inviteResponseHours.push(response);
    }

    if (!inviteSummary.lastInviteAt || new Date(invite.sentAt) > new Date(inviteSummary.lastInviteAt)) {
      inviteSummary.lastInviteAt = invite.sentAt;
    }
  });

  inviteSummary.acceptanceRate = inviteSummary.total
    ? Number(((inviteSummary.accepted / inviteSummary.total) * 100).toFixed(1))
    : 0;
  inviteSummary.medianResponseHours = inviteResponseHours.length ? median(inviteResponseHours) : null;

  const assignmentByBrief = new Map();
  assignmentRecords.forEach((assignment) => {
    const list = assignmentByBrief.get(assignment.briefId) ?? [];
    list.push(assignment);
    assignmentByBrief.set(assignment.briefId, list);
  });

  const briefFeeValues = [];
  const briefAgingDays = [];
  const activeStatuses = new Set(['shared', 'in_progress']);
  const pipeline = [];

  briefRecords.forEach((brief) => {
    const numericFee = safeNumber(brief.feePercentage);
    if (Number.isFinite(numericFee)) {
      briefFeeValues.push(numericFee);
    }

    if (brief.sharedAt && activeStatuses.has(brief.status)) {
      const age = differenceInDays(brief.sharedAt);
      if (Number.isFinite(age)) {
        briefAgingDays.push(age);
      }
    }

    if (activeStatuses.has(brief.status)) {
      const relatedAssignments = assignmentByBrief.get(brief.id) ?? [];
      const headhunterNames = new Set();
      let submissions = 0;
      let placements = 0;

      relatedAssignments.forEach((assignment) => {
        submissions += Number(assignment.submittedCandidates ?? 0);
        placements += Number(assignment.placements ?? 0);
        if (assignment.headhunterWorkspace?.name) {
          headhunterNames.add(assignment.headhunterWorkspace.name);
        }
      });

      pipeline.push({
        id: brief.id,
        title: brief.title,
        status: brief.status,
        openings: Number(brief.openings ?? 0),
        headhunters: Array.from(headhunterNames),
        submissions,
        placements,
        dueAt: brief.dueAt,
      });
    }
  });

  const assignmentResponseTimes = assignmentRecords
    .map((assignment) => safeNumber(assignment.responseTimeHours))
    .filter((value) => Number.isFinite(value));

  const assignmentsSummary = {
    totalAssignments: assignmentRecords.length,
    submittedCandidates: sumBy(assignmentRecords, (assignment) => Number(assignment.submittedCandidates ?? 0)),
    placements: sumBy(assignmentRecords, (assignment) => Number(assignment.placements ?? 0)),
    averageResponseHours: assignmentResponseTimes.length ? Number(average(assignmentResponseTimes)) : null,
  };

  const totalOpenings = sumBy(briefRecords, (brief) => safeNumber(brief.openings) ?? 0);
  assignmentsSummary.fillRate = totalOpenings
    ? percentage(assignmentsSummary.placements, totalOpenings)
    : percentage(assignmentsSummary.placements, assignmentsSummary.submittedCandidates || 1);

  const performanceLeaderboard = performanceRecords
    .map((record) => ({
      id: record.id,
      headhunterWorkspaceId: record.headhunterWorkspaceId,
      name: record.headhunterName ?? record.headhunterWorkspace?.name ?? 'Partner',
      placements: Number(record.placements ?? 0),
      interviews: Number(record.interviews ?? 0),
      responseRate: safeNumber(record.responseRate),
      averageTimeToSubmitHours: safeNumber(record.averageTimeToSubmitHours),
      qualityScore: safeNumber(record.qualityScore),
      activeBriefs: Number(record.activeBriefs ?? 0),
      lastSubmissionAt: record.lastSubmissionAt,
    }))
    .sort((a, b) => b.placements - a.placements || (b.responseRate ?? 0) - (a.responseRate ?? 0))
    .slice(0, 8);

  const averageResponseRate = average(
    performanceLeaderboard
      .map((entry) => entry.responseRate)
      .filter((value) => Number.isFinite(value)),
  );
  const averageQualityScore = average(
    performanceLeaderboard
      .map((entry) => entry.qualityScore)
      .filter((value) => Number.isFinite(value)),
  );

  const normalizedQuality = averageQualityScore != null ? (averageQualityScore / 5) * 100 : null;
  const healthScore = (() => {
    if (averageResponseRate == null && normalizedQuality == null) {
      return null;
    }
    const responseComponent = averageResponseRate != null ? averageResponseRate * 0.6 : 0;
    const qualityComponent = normalizedQuality != null ? normalizedQuality * 0.4 : 0;
    return Number((responseComponent + qualityComponent).toFixed(1));
  })();

  const outstandingStatuses = new Set(['pending', 'invoiced', 'overdue']);
  const outstandingCommissions = commissionRecords.filter((commission) => outstandingStatuses.has(commission.status));
  const dueSoonThreshold = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const dueSoonCommissions = outstandingCommissions.filter((commission) => {
    if (!commission.dueAt) return false;
    const dueDate = new Date(commission.dueAt);
    return dueDate <= dueSoonThreshold && dueDate >= new Date();
  });
  const quarterStart = startOfQuarter();
  const paidThisQuarter = commissionRecords.filter(
    (commission) => commission.status === 'paid' && commission.paidAt && new Date(commission.paidAt) >= quarterStart,
  );

  const commissionCurrency =
    outstandingCommissions.find((commission) => commission.currency)?.currency || commissionRecords[0]?.currency || 'USD';

  const commissionsSummary = {
    outstandingCount: outstandingCommissions.length,
    outstandingAmount: Number(
      sumBy(outstandingCommissions, (commission) => safeNumber(commission.amount) ?? 0).toFixed(2),
    ),
    dueSoon: {
      count: dueSoonCommissions.length,
      amount: Number(sumBy(dueSoonCommissions, (commission) => safeNumber(commission.amount) ?? 0).toFixed(2)),
    },
    paidThisQuarter: {
      count: paidThisQuarter.length,
      amount: Number(sumBy(paidThisQuarter, (commission) => safeNumber(commission.amount) ?? 0).toFixed(2)),
    },
    currency: commissionCurrency,
    upcoming: outstandingCommissions
      .slice()
      .sort((a, b) => {
        const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
        const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
        return aDue - bDue;
      })
      .slice(0, 6)
      .map((commission) => ({
        headhunter: commission.headhunterName ?? commission.headhunterWorkspace?.name ?? 'Partner',
        candidate: commission.candidateName,
        amount: safeNumber(commission.amount),
        currency: commission.currency ?? commissionCurrency,
        status: commission.status,
        dueAt: commission.dueAt,
      })),
  };

  const lookbackMillis = Number.isFinite(lookbackDays)
    ? lookbackDays * 24 * 60 * 60 * 1000
    : null;
  const lookbackStart = lookbackMillis ? new Date(Date.now() - lookbackMillis) : null;
  const briefsSharedInWindow = lookbackStart
    ? briefRecords.filter((brief) => brief.sharedAt && new Date(brief.sharedAt) >= lookbackStart).length
    : null;

  return {
    invites: inviteSummary,
    briefs: {
      total: briefRecords.length,
      active: briefRecords.filter((brief) => activeStatuses.has(brief.status)).length,
      sharedThisWindow: briefsSharedInWindow,
      averageFeePercentage: briefFeeValues.length ? Number(average(briefFeeValues)) : null,
      averageAgeDays: briefAgingDays.length ? Number(average(briefAgingDays)) : null,
      pipeline: pipeline
        .sort((a, b) => {
          if (!a.dueAt && !b.dueAt) return 0;
          if (!a.dueAt) return 1;
          if (!b.dueAt) return -1;
          return new Date(a.dueAt) - new Date(b.dueAt);
        })
        .slice(0, 8),
    },
    assignments: assignmentsSummary,
    performance: {
      leaderboard: performanceLeaderboard,
      averageResponseRate,
      averageQualityScore,
      healthScore,
      totalPlacements: sumBy(performanceRecords, (record) => Number(record.placements ?? 0)),
    },
    commissions: commissionsSummary,
  };
}

function buildTalentPoolSummary({ pools, members, engagements, lookbackDays }) {
  const poolRecords = (pools ?? []).map((pool) => (pool?.get ? pool.get({ plain: true }) : pool));
  const memberRecords = (members ?? []).map(toPlain);
  const engagementRecords = (engagements ?? []).map(toPlain);

  const poolsById = new Map(poolRecords.map((pool) => [pool.id, pool]));
  const activePoolCount = poolRecords.filter((pool) => pool.status === 'active').length;
  const pausedPoolCount = poolRecords.filter((pool) => pool.status === 'paused').length;
  const archivedPoolCount = poolRecords.filter((pool) => pool.status === 'archived').length;

  const activeCandidateStatuses = new Set(['active', 'engaged', 'interview', 'offered']);
  const totalCandidates = memberRecords.length;
  const activeCandidates = memberRecords.filter((member) => activeCandidateStatuses.has(member.status)).length;
  const hiresFromPools = memberRecords.filter((member) => member.status === 'hired').length;

  const stageCounts = { outreach: 0, engaged: 0, interview: 0, offer: 0, hired: 0 };
  const stageMapping = {
    active: 'outreach',
    engaged: 'engaged',
    interview: 'interview',
    offered: 'offer',
    hired: 'hired',
  };

  const typeStats = new Map();

  poolRecords.forEach((pool) => {
    if (!typeStats.has(pool.poolType)) {
      typeStats.set(pool.poolType, {
        type: pool.poolType,
        pools: 0,
        candidates: 0,
        active: 0,
        hires: 0,
        _durations: [],
      });
    }
    typeStats.get(pool.poolType).pools += 1;
  });

  memberRecords.forEach((member) => {
    const pool = poolsById.get(member.poolId);
    const poolType = pool?.poolType ?? member.sourceType ?? 'silver_medalist';
    if (!typeStats.has(poolType)) {
      typeStats.set(poolType, {
        type: poolType,
        pools: 0,
        candidates: 0,
        active: 0,
        hires: 0,
        _durations: [],
      });
    }
    const entry = typeStats.get(poolType);
    entry.candidates += 1;
    if (activeCandidateStatuses.has(member.status)) {
      entry.active += 1;
    }
    if (member.status === 'hired') {
      entry.hires += 1;
    }
    const duration = differenceInDays(member.joinedAt);
    if (Number.isFinite(duration)) {
      entry._durations.push(duration);
    }

    const stageKey = stageMapping[member.status];
    if (stageKey) {
      stageCounts[stageKey] += 1;
    }
  });

  const typeBreakdown = Array.from(typeStats.values()).map((entry) => {
    const durations = entry._durations ?? [];
    const averageTimeInPoolDays = durations.length ? Number(average(durations)) : null;
    delete entry._durations;
    return {
      ...entry,
      averageTimeInPoolDays,
    };
  });

  const latestEngagement = engagementRecords
    .map((engagement) => engagement.occurredAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0] ?? null;

  const lookbackStart = Number.isFinite(lookbackDays)
    ? new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)
    : null;
  const engagementsInWindow = lookbackStart
    ? engagementRecords.filter((engagement) => new Date(engagement.occurredAt) >= lookbackStart)
    : engagementRecords;

  const upcomingActions = memberRecords
    .filter((member) => member.nextActionAt && new Date(member.nextActionAt) >= new Date())
    .sort((a, b) => new Date(a.nextActionAt) - new Date(b.nextActionAt))
    .slice(0, 8)
    .map((member) => {
      const pool = poolsById.get(member.poolId);
      const owner = pool?.owner;
      const ownerName = owner ? `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim() : null;
      return {
        poolName: pool?.name ?? 'Talent pool',
        candidateName: member.candidateName,
        nextActionAt: member.nextActionAt,
        status: member.status,
        ownerName: ownerName?.length ? ownerName : null,
      };
    });

  const recentEngagements = engagementRecords
    .slice()
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    .slice(0, 8)
    .map((engagement) => ({
      poolName: engagement.pool?.name ?? poolsById.get(engagement.poolId)?.name ?? 'Talent pool',
      interactionType: engagement.interactionType,
      occurredAt: engagement.occurredAt,
      summary: engagement.summary,
      performedBy: engagement.performedBy
        ? `${engagement.performedBy.firstName ?? ''} ${engagement.performedBy.lastName ?? ''}`.trim()
        : null,
    }));

  return {
    totals: {
      pools: poolRecords.length,
      activePools: activePoolCount,
      pausedPools: pausedPoolCount,
      archivedPools: archivedPoolCount,
      totalCandidates,
      activeCandidates,
      hiresFromPools,
      engagementsInWindow: engagementsInWindow.length,
      lastEngagedAt: latestEngagement,
    },
    byType: typeBreakdown.sort((a, b) => b.candidates - a.candidates),
    pipeline: {
      stageCounts,
      conversionRate: totalCandidates ? percentage(stageCounts.hired, totalCandidates) : 0,
    },
    upcomingActions,
    recentEngagements,
  };
}

function buildAgencyCollaborationInsights({
  collaborations,
  invitations,
  rateCards,
  slaSnapshots,
  billingEvents,
}) {
  const collaborationRecords = (collaborations ?? []).map((collaboration) =>
    collaboration?.toPublicObject ? collaboration.toPublicObject() : toPlain(collaboration),
  );
  const invitationRecords = (invitations ?? []).map(toPlain);
  const rateCardRecords = (rateCards ?? []).map((card) => (card?.toPublicObject ? card.toPublicObject() : toPlain(card)));
  const slaRecords = (slaSnapshots ?? []).map((snapshot) =>
    snapshot?.toPublicObject ? snapshot.toPublicObject() : toPlain(snapshot),
  );
  const billingRecords = (billingEvents ?? []).map((event) =>
    event?.toPublicObject ? event.toPublicObject() : toPlain(event),
  );

  const summary = {
    total: collaborationRecords.length,
    active: collaborationRecords.filter((collaboration) => collaboration.status === 'active').length,
    paused: collaborationRecords.filter((collaboration) => collaboration.status === 'paused').length,
    ended: collaborationRecords.filter((collaboration) => ['ended', 'closed'].includes(collaboration.status)).length,
    averageHealthScore: null,
    averageSatisfactionScore: null,
    forecastedUpsellValue: Number(sumBy(collaborationRecords, (collaboration) => safeNumber(collaboration.forecastedUpsellValue) ?? 0).toFixed(2)),
  };

  const healthScores = collaborationRecords
    .map((collaboration) => safeNumber(collaboration.healthScore))
    .filter((value) => Number.isFinite(value));
  summary.averageHealthScore = healthScores.length ? Number(average(healthScores)) : null;

  const satisfactionScores = collaborationRecords
    .map((collaboration) => safeNumber(collaboration.satisfactionScore))
    .filter((value) => Number.isFinite(value));
  summary.averageSatisfactionScore = satisfactionScores.length ? Number(average(satisfactionScores)) : null;

  const upcomingRenewals = collaborationRecords
    .filter((collaboration) => collaboration.renewalDate && new Date(collaboration.renewalDate) >= new Date())
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
    .slice(0, 6)
    .map((collaboration) => ({
      agencyName: collaboration.agencyWorkspace?.name ?? 'Partner agency',
      renewalDate: collaboration.renewalDate,
      status: collaboration.status,
      healthScore: safeNumber(collaboration.healthScore),
      satisfactionScore: safeNumber(collaboration.satisfactionScore),
    }));

  const inviteSummary = {
    total: invitationRecords.length,
    pending: invitationRecords.filter((invite) => invite.status === 'pending').length,
    accepted: invitationRecords.filter((invite) => invite.status === 'accepted').length,
    declined: invitationRecords.filter((invite) => invite.status === 'declined').length,
    lastSentAt: invitationRecords.length
      ? invitationRecords.map((invite) => invite.createdAt).sort((a, b) => new Date(b) - new Date(a))[0]
      : null,
  };

  const rateCardSummary = {
    total: rateCardRecords.length,
    shared: rateCardRecords.filter((card) => card.status === 'shared').length,
    draft: rateCardRecords.filter((card) => card.status === 'draft').length,
    newest: rateCardRecords
      .slice()
      .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0) - new Date(a.updatedAt ?? a.createdAt ?? 0))
      .slice(0, 5)
      .map((card) => ({
        title: card.title,
        status: card.status,
        effectiveFrom: card.effectiveFrom,
        effectiveTo: card.effectiveTo,
        currency: card.currency,
        itemCount: Array.isArray(card.items) ? card.items.length : 0,
      })),
  };

  const slaSummary = (() => {
    if (!slaRecords.length) {
      return {
        onTimeDeliveryRate: null,
        averageResponseHours: null,
        breachCount: 0,
        escalations: 0,
        partners: [],
      };
    }

    const onTimeRates = slaRecords
      .map((snapshot) => safeNumber(snapshot.onTimeDeliveryRate))
      .filter((value) => Number.isFinite(value));
    const responseHours = slaRecords
      .map((snapshot) => safeNumber(snapshot.responseTimeHoursAvg))
      .filter((value) => Number.isFinite(value));

    const latestByCollaboration = new Map();
    slaRecords.forEach((snapshot) => {
      const existing = latestByCollaboration.get(snapshot.agencyCollaborationId);
      if (!existing || new Date(snapshot.periodEnd) > new Date(existing.periodEnd)) {
        latestByCollaboration.set(snapshot.agencyCollaborationId, snapshot);
      }
    });

    const partners = Array.from(latestByCollaboration.values())
      .map((snapshot) => ({
        collaborationId: snapshot.agencyCollaborationId,
        onTimeDeliveryRate: safeNumber(snapshot.onTimeDeliveryRate),
        responseTimeHours: safeNumber(snapshot.responseTimeHoursAvg),
        breachCount: Number(snapshot.breachCount ?? 0),
        escalationsCount: Number(snapshot.escalationsCount ?? 0),
      }))
      .sort((a, b) => (b.onTimeDeliveryRate ?? 0) - (a.onTimeDeliveryRate ?? 0))
      .slice(0, 6);

    return {
      onTimeDeliveryRate: onTimeRates.length ? Number(average(onTimeRates)) : null,
      averageResponseHours: responseHours.length ? Number(average(responseHours)) : null,
      breachCount: sumBy(slaRecords, (snapshot) => Number(snapshot.breachCount ?? 0)),
      escalations: sumBy(slaRecords, (snapshot) => Number(snapshot.escalationsCount ?? 0)),
      partners,
    };
  })();

  const billingSummary = (() => {
    if (!billingRecords.length) {
      return {
        outstandingAmount: 0,
        outstandingCount: 0,
        currency: 'USD',
        dueSoon: { count: 0, amount: 0 },
        paidThisQuarter: { count: 0, amount: 0 },
        upcomingInvoices: [],
      };
    }

    const outstandingStatuses = new Set(['draft', 'sent', 'overdue']);
    const outstanding = billingRecords.filter((event) => outstandingStatuses.has(event.status));
    const dueSoonThreshold = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
    const dueSoon = outstanding.filter((event) => event.dueAt && new Date(event.dueAt) <= dueSoonThreshold);
    const quarterStart = startOfQuarter();
    const paid = billingRecords.filter((event) => event.status === 'paid' && event.paidAt && new Date(event.paidAt) >= quarterStart);

    const currency = outstanding.find((event) => event.currency)?.currency || billingRecords[0]?.currency || 'USD';

    return {
      outstandingAmount: Number(sumBy(outstanding, (event) => safeNumber(event.amount) ?? 0).toFixed(2)),
      outstandingCount: outstanding.length,
      currency,
      dueSoon: {
        count: dueSoon.length,
        amount: Number(sumBy(dueSoon, (event) => safeNumber(event.amount) ?? 0).toFixed(2)),
      },
      paidThisQuarter: {
        count: paid.length,
        amount: Number(sumBy(paid, (event) => safeNumber(event.amount) ?? 0).toFixed(2)),
      },
      upcomingInvoices: outstanding
        .slice()
        .sort((a, b) => new Date(a.dueAt ?? a.issuedAt ?? 0) - new Date(b.dueAt ?? b.issuedAt ?? 0))
        .slice(0, 6)
        .map((event) => ({
          invoiceNumber: event.invoiceNumber,
          status: event.status,
          amount: safeNumber(event.amount),
          currency: event.currency ?? currency,
          dueAt: event.dueAt,
        })),
    };
  })();

  return {
    summary,
    renewals: upcomingRenewals,
    invites: inviteSummary,
    rateCards: rateCardSummary,
    sla: slaSummary,
    billing: billingSummary,
  };
}

function buildBrandIntelligenceSummary({ profile, assets, jobSummary }) {
  const publishedAssets = assets.filter((asset) => asset.status === 'published');
  const engagementScores = publishedAssets
    .map((asset) => (asset.engagementScore == null ? null : Number(asset.engagementScore)))
    .filter((value) => Number.isFinite(value));

  const profileCompleteness = (() => {
    if (!profile) return 0;
    const fields = ['companyName', 'description', 'website'];
    const completed = fields.reduce((count, field) => (profile[field] ? count + 1 : count), 0);
    return Number(((completed / fields.length) * 100).toFixed(0));
  })();

  return {
    publishedAssets: publishedAssets.length,
    averageEngagementScore: engagementScores.length ? Number(average(engagementScores).toFixed(1)) : null,
    profileCompleteness,
    activeRoles: jobSummary?.total ?? 0,
    assets: publishedAssets.slice(0, 6).map((asset) => ({
      id: asset.id,
      title: asset.title,
      assetType: asset.assetType,
      url: asset.url,
      engagementScore: asset.engagementScore,
      publishedAt: asset.publishedAt,
    })),
  };
}

function buildGovernanceSummary({ approvals, alerts, workspace }) {
  const pendingApprovals = approvals.filter((item) => ['pending', 'in_review'].includes(item.status));
  const criticalAlerts = alerts.items.filter((item) => item.severity === 'critical');

  return {
    pendingApprovals: pendingApprovals.length,
    criticalAlerts: criticalAlerts.length,
    workspaceActive: Boolean(workspace?.isActive),
    timezone: workspace?.timezone ?? null,
  };
}

function buildCalendarDigest(events) {
  if (!events.length) {
    return { upcoming: [], eventCount: 0 };
  }

  const upcoming = events
    .map((event) => (event?.get ? event.get({ plain: true }) : event))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .filter((event) => new Date(event.endsAt ?? event.startsAt) >= new Date())
    .map((event) => ({
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location,
    }));

  return {
    eventCount: events.length,
    upcoming: upcoming.slice(0, 8),
  };
}

function buildMemberships(workspace) {
  return [
    {
      name: 'Company',
      active: Boolean(workspace?.isActive),
      description: 'Full access to hiring operations, analytics, and governance controls.',
    },
    {
      name: 'Headhunter',
      active: true,
      description: 'Collaborate with agencies and external recruiters on shared briefs.',
    },
    {
      name: 'User & Job Seeker',
      active: true,
      description: 'Talent community experience for employees, referrals, and alumni.',
    },
  ];
}

async function listAvailableWorkspaces() {
  const workspaces = await ProviderWorkspace.findAll({
    where: { type: 'company' },
    attributes: ['id', 'name', 'slug'],
    order: [['name', 'ASC']],
    limit: 25,
  });
  return workspaces.map((workspace) => workspace.get({ plain: true }));
}

export async function getCompanyDashboard({ workspaceId, workspaceSlug, lookbackDays } = {}) {
  const selector = resolveWorkspaceSelector({ workspaceId, workspaceSlug });
  const lookback = clamp(lookbackDays, {
    min: MIN_LOOKBACK_DAYS,
    max: MAX_LOOKBACK_DAYS,
    fallback: 30,
  });

  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { selector, lookback });

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    const workspace = await fetchWorkspace(selector);
    const since = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);

    const [members, invites, notes, companyProfile, availableWorkspaces] = await Promise.all([
      fetchMembers(workspace.id),
      fetchInvites(workspace.id),
      fetchNotes(workspace.id),
      CompanyProfile.findOne({ where: { userId: workspace.ownerId } }),
      listAvailableWorkspaces(),
    ]);

    const [
      applications,
      jobs,
      gigs,
      projects,
      jobStages,
      jobApprovals,
      jobCampaigns,
      interviewSchedules,
      hiringAlerts,
      candidateSurveys,
      partnerEngagements,
      calendarEvents,
      brandAssets,
      headhunterInvites,
      headhunterBriefs,
      headhunterAssignments,
      headhunterPerformanceSnapshots,
      headhunterCommissions,
      talentPools,
      talentPoolMembers,
      talentPoolEngagements,
      agencyCollaborations,
      agencyBillingEvents,
    ] = await Promise.all([
      fetchApplications({ workspaceId: workspace.id, since }),
      fetchJobs({ since }),
      fetchGigs({ since }),
      fetchProjects({ workspaceId: workspace.id, since }),
      fetchJobStagesData({ workspaceId: workspace.id }),
      fetchJobApprovals({ workspaceId: workspace.id, since }),
      fetchJobCampaigns({ workspaceId: workspace.id, since }),
      fetchInterviewSchedules({ workspaceId: workspace.id, since }),
      fetchHiringAlerts({ workspaceId: workspace.id, since }),
      fetchCandidateSurveys({ workspaceId: workspace.id, since }),
      fetchPartnerEngagements({ workspaceId: workspace.id, since }),
      fetchCalendarEvents({ workspaceId: workspace.id, since }),
      fetchBrandAssets({ workspaceId: workspace.id }),
      fetchHeadhunterInvites({ workspaceId: workspace.id, since }),
      fetchHeadhunterBriefs({ workspaceId: workspace.id }),
      fetchHeadhunterAssignments({ workspaceId: workspace.id }),
      fetchHeadhunterPerformance({ workspaceId: workspace.id, since }),
      fetchHeadhunterCommissions({ workspaceId: workspace.id, since }),
      fetchTalentPools({ workspaceId: workspace.id }),
      fetchTalentPoolMembers({ workspaceId: workspace.id }),
      fetchTalentPoolEngagements({ workspaceId: workspace.id, since }),
      fetchAgencyCollaborations({ workspaceId: workspace.id }),
      fetchAgencyBillingEvents({ workspaceId: workspace.id, since }),
    ]);

    const agencyCollaborationIds = agencyCollaborations.map((collaboration) => collaboration.id).filter((id) => id != null);
    const agencyWorkspaceIds = agencyCollaborations
      .map((collaboration) => collaboration.agencyWorkspaceId ?? collaboration.agencyWorkspace?.id)
      .filter((id) => Number.isInteger(Number(id)))
      .map((id) => Number(id));

    const [agencyInvitations, agencyRateCards, agencySlaSnapshots] = await Promise.all([
      fetchAgencyInvitations({ collaborationIds: agencyCollaborationIds }),
      fetchAgencyRateCards({ agencyWorkspaceIds }),
      fetchAgencySlaSnapshots({ collaborationIds: agencyCollaborationIds, since }),
    ]);

    const applicationIds = applications.map((application) => application.id);
    const [reviews, demographicSnapshots] = await Promise.all([
      fetchApplicationReviews({ applicationIds, since }),
      fetchCandidateSnapshots({ workspaceId: workspace.id, applicationIds, since }),
    ]);

    const memberSummary = buildMemberSummary(members);
    const inviteSummary = buildInviteSummary(invites);
    const jobSummary = buildJobSummary({ jobs, gigs });
    const pipelineSummary = buildPipelineSummary(applications);
    const projectSummary = buildProjectSummary(projects);
    const badges = deriveWorkspaceBadges({ memberSummary, pipelineSummary, projectSummary });

    const reviewScores = reviews.map((review) => (review.score == null ? null : Number(review.score))).filter((score) =>
      Number.isFinite(score),
    );

    const profile = sanitizeProfile(companyProfile);

    const workspaceSummary = sanitiseWorkspace(workspace, memberSummary, inviteSummary, badges);
    const memberships = buildMemberships(workspaceSummary);
    const recommendations = buildRecommendations({ memberSummary, pipelineSummary, inviteSummary });

    const partnerContactIds = new Set(notes.map((note) => note.subjectUserId));

    const partnerSummary = {
      engagedContacts: partnerContactIds.size,
      touchpoints: notes.length,
      pendingInvites: inviteSummary.pending,
      activeMembers: memberSummary.active,
    };

    const recentNotes = buildRecentNotes(notes);

    const offersAccepted = pipelineSummary.totals.hires;
    const offersExtended = pipelineSummary.totals.offers;
    const offers = {
      accepted: offersAccepted,
      extended: offersExtended,
      winRate: percentage(offersAccepted, offersExtended || pipelineSummary.totals.applications || 1),
    };

    const diversityMetrics = buildDiversityMetrics(demographicSnapshots);
    const alertsSummary = buildAlertsSummary(hiringAlerts);
    const interviewOperations = buildInterviewOperationsSummary({ schedules: interviewSchedules, reviews });
    const candidateExperience = buildCandidateExperienceSummary({ surveys: candidateSurveys });
    const jobLifecycle = buildJobLifecycleInsights({
      jobStages,
      approvals: jobApprovals,
      campaigns: jobCampaigns,
      pipelineSummary,
      jobSummary,
    });
    const jobDesign = buildJobDesignStudioSummary({
      approvals: jobApprovals,
      jobStages,
      jobSummary,
      alerts: alertsSummary,
    });
    const sourcing = buildSourcingSummary({ pipelineSummary, campaigns: jobCampaigns });
    const applicantRelationshipManager = buildApplicantRelationshipManagerSummary({
      surveys: candidateSurveys,
      pipelineSummary,
      partnerSummary,
    });
    const analyticsForecasting = buildAnalyticsForecastingSummary({ pipelineSummary, jobSummary, projectSummary });
    const partnerCollaborationDetails = buildPartnerCollaborationSummary({
      partnerSummary,
      engagements: partnerEngagements,
    });
    const headhunterProgram = buildHeadhunterProgramSummary({
      invites: headhunterInvites,
      briefs: headhunterBriefs,
      assignments: headhunterAssignments,
      performanceSnapshots: headhunterPerformanceSnapshots,
      commissions: headhunterCommissions,
      lookbackDays: lookback,
    });
    const talentPoolSummary = buildTalentPoolSummary({
      pools: talentPools,
      members: talentPoolMembers,
      engagements: talentPoolEngagements,
      lookbackDays: lookback,
    });
    const agencyCollaborationInsights = buildAgencyCollaborationInsights({
      collaborations: agencyCollaborations,
      invitations: agencyInvitations,
      rateCards: agencyRateCards,
      slaSnapshots: agencySlaSnapshots,
      billingEvents: agencyBillingEvents,
    });
    const plainBrandAssets = brandAssets.map((asset) => (asset?.get ? asset.get({ plain: true }) : asset));
    const brandIntelligence = buildBrandIntelligenceSummary({ profile, assets: plainBrandAssets, jobSummary });
    const governance = buildGovernanceSummary({ approvals: jobApprovals, alerts: alertsSummary, workspace: workspaceSummary });
    const calendarDigest = buildCalendarDigest(calendarEvents);
    const offerOnboarding = buildOfferAndOnboardingSummary({
      offers,
      candidateExperience,
      interviewOperations,
      applications,
      alerts: alertsSummary,
    });
    const candidateCare = buildCandidateCareSummary({ candidateExperience, alerts: alertsSummary });

    const insights = {
      averageReviewScore: reviewScores.length ? average(reviewScores) : null,
      reviewSampleSize: reviewScores.length,
      candidateSources: pipelineSummary.bySource,
      topLocations: jobSummary.topLocations,
      diversityIndex: diversityMetrics.representationIndex,
      candidateNps: candidateExperience.nps,
    };

    return {
      meta: {
        lookbackDays: lookback,
        selectedWorkspaceId: workspace.id,
        availableWorkspaces,
        memberships,
      },
      workspace: workspaceSummary,
      profile,
      memberSummary,
      inviteSummary,
      jobSummary,
      pipelineSummary,
      projectSummary,
      partnerSummary,
      insights,
      diversity: diversityMetrics,
      alerts: alertsSummary,
      jobLifecycle,
      jobDesign,
      sourcing,
      applicantRelationshipManager,
      analyticsForecasting,
      interviewOperations,
      candidateExperience,
      offerOnboarding,
      candidateCare,
      partnerCollaboration: partnerCollaborationDetails,
      partnerships: {
        headhunterProgram,
        talentPools: talentPoolSummary,
        agencyCollaboration: agencyCollaborationInsights,
      },
      brandIntelligence,
      governance,
      calendar: calendarDigest,
      reviews: {
        total: reviews.length,
        averageScore: insights.averageReviewScore,
      },
      offers,
      recommendations,
      memberships,
      recentNotes,
      generatedAt: new Date().toISOString(),
    };
  });
}

export default {
  getCompanyDashboard,
};

