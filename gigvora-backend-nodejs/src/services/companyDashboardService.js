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
  InterviewPanelTemplate,
  InterviewSchedule,
  InterviewerAvailability,
  InterviewReminder,
  CandidatePrepPortal,
  InterviewEvaluation,
  EvaluationCalibrationSession,
  DecisionTracker,
  OfferPackage,
  OnboardingTask,
  CandidateCareTicket,
  JobStage,
  JobApprovalWorkflow,
  JobCampaignPerformance,
  PartnerEngagement,
  RecruitingCalendarEvent,
  EmployerBrandAsset,
  EmployerBrandStory,
  EmployerBenefit,
  EmployeeJourneyProgram,
  WorkspaceIntegration,
  WorkspaceCalendarConnection,
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
  return diffMs / (1000 * 60 * 60);
  return Number((diffMs / (1000 * 60 * 60)).toFixed(1));
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

function toDateKey(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
function normalizeStageKey(value) {
  if (value == null) {
    return null;
  }
  return `${value}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
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

async function fetchInterviewPanelTemplates({ workspaceId }) {
  return InterviewPanelTemplate.findAll({
    where: { workspaceId },
    order: [['updatedAt', 'DESC']],
    limit: 50,
  });
}

async function fetchInterviewerAvailability({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.availableFrom = { [Op.gte]: new Date(since.getTime() - 48 * 60 * 60 * 1000) };
  }
  return InterviewerAvailability.findAll({
    where,
    order: [['availableFrom', 'ASC']],
    limit: 150,
  });
}

async function fetchInterviewReminders({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.sentAt = { [Op.gte]: since };
  }
  return InterviewReminder.findAll({
    where,
    order: [['sentAt', 'DESC']],
    limit: 200,
  });
}

async function fetchCandidatePrepPortals({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return CandidatePrepPortal.findAll({
    where,
    order: [['updatedAt', 'DESC']],
    limit: 120,
  });
}

async function fetchInterviewEvaluations({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.submittedAt = { [Op.gte]: since };
  }
  return InterviewEvaluation.findAll({
    where,
    order: [['submittedAt', 'DESC']],
    limit: 200,
  });
}

async function fetchEvaluationCalibrationSessions({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.scheduledAt = { [Op.gte]: since };
  }
  return EvaluationCalibrationSession.findAll({
    where,
    order: [['scheduledAt', 'DESC']],
    limit: 50,
  });
}

async function fetchDecisionTrackers({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.openedAt = { [Op.gte]: since };
  }
  return DecisionTracker.findAll({
    where,
    order: [['updatedAt', 'DESC']],
    limit: 100,
  });
}

async function fetchOfferPackages({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return OfferPackage.findAll({
    where,
    order: [['updatedAt', 'DESC']],
    limit: 100,
  });
}

async function fetchOnboardingTasks({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return OnboardingTask.findAll({
    where,
    order: [['dueAt', 'ASC']],
    limit: 200,
  });
}

async function fetchCandidateCareTickets({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.openedAt = { [Op.gte]: since };
  }
  return CandidateCareTicket.findAll({
    where,
    order: [['openedAt', 'DESC']],
    limit: 150,
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

async function fetchBrandStories({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.updatedAt = { [Op.gte]: since };
  }
  return EmployerBrandStory.findAll({
    where,
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id'],
        include: [
          {
            model: Profile,
            as: 'profile',
            attributes: ['firstName', 'lastName'],
          },
        ],
      },
    ],
    order: [['updatedAt', 'DESC']],
    limit: 40,
  });
}

async function fetchEmployerBenefits({ workspaceId }) {
  return EmployerBenefit.findAll({
    where: { workspaceId },
    order: [['isFeatured', 'DESC'], ['updatedAt', 'DESC']],
    limit: 40,
  });
}

async function fetchEmployeeJourneys({ workspaceId }) {
  return EmployeeJourneyProgram.findAll({
    where: { workspaceId },
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id'],
        include: [
          { model: Profile, as: 'profile', attributes: ['firstName', 'lastName'] },
        ],
      },
    ],
    order: [['updatedAt', 'DESC']],
    limit: 50,
  });
}

async function fetchWorkspaceIntegrations({ workspaceId }) {
  return WorkspaceIntegration.findAll({
    where: { workspaceId },
    order: [['status', 'ASC'], ['displayName', 'ASC']],
    limit: 50,
  });
}

async function fetchCalendarConnections({ workspaceId }) {
  return WorkspaceCalendarConnection.findAll({
    where: { workspaceId },
    order: [['status', 'ASC'], ['updatedAt', 'DESC']],
    limit: 20,
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

function buildJobLifecycleInsights({
  jobStages,
  approvals,
  campaigns,
  pipelineSummary,
  jobSummary,
  applications,
  reviews,
  interviewSchedules,
}) {
  const now = new Date();
  const stageRecords = [...jobStages]
    .map((stage) => (stage?.get ? stage.get({ plain: true }) : stage))
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  const approvalRecords = approvals.map((item) => (item?.get ? item.get({ plain: true }) : item));
  const campaignRecords = campaigns.map((item) => (item?.get ? item.get({ plain: true }) : item));
  const reviewRecords = reviews.map((review) => (review?.get ? review.get({ plain: true }) : review));
  const applicationRecords = applications.map((application) => (application?.get ? application.get({ plain: true }) : application));
  const interviewRecords = interviewSchedules.map((schedule) =>
    schedule?.get ? schedule.get({ plain: true }) : schedule,
  );

  const averageStageDuration = average(
    stageRecords
      .map((stage) => (stage.averageDurationHours == null ? null : Number(stage.averageDurationHours)))
      .filter((value) => Number.isFinite(value)),
  );

  const pendingApprovals = approvalRecords.filter((item) => item.status !== 'approved');
  const overdueApprovals = pendingApprovals.filter((item) => {
    if (!item.dueAt) return false;
    return new Date(item.dueAt) < now;
  });

  const completionDurations = approvalRecords
    .filter((item) => item.completedAt)
    .map((item) => differenceInHours(item.createdAt, item.completedAt))
    .filter((value) => Number.isFinite(value));

  const campaignsByChannel = new Map();
  campaignRecords.forEach((campaign) => {
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
  const campaignMetrics = Array.from(campaignsByChannel.entries())
    .sort((a, b) => b[1].applications - a[1].applications)
    .map(([channel, metrics]) => ({
      channel,
      ...metrics,
      conversionRate: metrics.applications ? Number(((metrics.hires / metrics.applications) * 100).toFixed(1)) : 0,
    }));
  const totalCampaignApplications = campaignMetrics.reduce((sum, entry) => sum + entry.applications, 0);
  const averageCampaignCpa =
    totalCampaignApplications > 0 ? Number((totalSpend / totalCampaignApplications).toFixed(2)) : null;

  const applicationMap = new Map();
  applicationRecords.forEach((application) => {
    if (application?.id != null) {
      applicationMap.set(application.id, application);
    }
  });

  const stageBuckets = stageRecords.map((stage) => {
    const normalizedKey = normalizeStageKey(stage?.metadata?.stageKey ?? stage?.metadata?.reviewStage ?? stage?.name);
    return {
      stage,
      normalizedKey: normalizedKey ?? `stage_${stage.id}`,
      reviews: [],
    };
  });
  const stageIndex = new Map(stageBuckets.map((bucket) => [bucket.normalizedKey, bucket]));

  reviewRecords.forEach((review) => {
    const key = normalizeStageKey(review.stage) ?? `stage_${review.stage ?? 'unknown'}`;
    const bucket = stageIndex.get(key);
    if (bucket) {
      bucket.reviews.push(review);
    }
  });

  const stagePerformance = stageBuckets.map(({ stage, reviews: stageReviews }) => {
    const decided = stageReviews.filter((review) => review.decision && review.decision !== 'pending');
    const advances = decided.filter((review) => review.decision === 'advance').length;
    const rejects = decided.filter((review) => review.decision === 'reject').length;
    const holds = decided.filter((review) => review.decision === 'hold').length;
    const averageScore = decided.length
      ? average(
          decided
            .map((review) => (review.score == null ? null : Number(review.score)))
            .filter((score) => Number.isFinite(score)),
        )
      : null;
    const cycleTimes = decided
      .map((review) => {
        const application = applicationMap.get(review.applicationId);
        const start = application?.submittedAt ?? application?.createdAt ?? review.createdAt;
        const end = review.decidedAt ?? review.updatedAt ?? review.createdAt;
        return differenceInHours(start, end);
      })
      .filter((value) => Number.isFinite(value));
    const pending = stageReviews.filter((review) => review.decision === 'pending').length;
    const throughput = stageReviews.length;
    const slaDelta =
      stage.averageDurationHours != null && stage.slaHours != null
        ? Number(stage.averageDurationHours) - Number(stage.slaHours)
        : null;

    return {
      id: stage.id,
      name: stage.name,
      orderIndex: stage.orderIndex ?? 0,
      slaHours: stage.slaHours ?? null,
      averageDurationHours: stage.averageDurationHours == null ? null : Number(stage.averageDurationHours),
      throughput,
      pendingReviews: pending,
      advanceRate: percentage(advances, decided.length || 0),
      rejectionRate: percentage(rejects, decided.length || 0),
      holdRate: percentage(holds, decided.length || 0),
      averageScore: averageScore == null ? null : Number(averageScore),
      medianDecisionHours: cycleTimes.length ? median(cycleTimes) : null,
      slaDeltaHours: slaDelta == null ? null : Number(slaDelta.toFixed(1)),
      guideUrl: stage.guideUrl ?? null,
    };
  });

  const sortedStagePerformance = stagePerformance.sort((a, b) => a.orderIndex - b.orderIndex);

  const approvalQueueItems = pendingApprovals
    .slice()
    .sort((a, b) => {
      const aDue = a.dueAt ? new Date(a.dueAt) : new Date(a.createdAt ?? 0);
      const bDue = b.dueAt ? new Date(b.dueAt) : new Date(b.createdAt ?? 0);
      return aDue - bDue;
    })
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      approverRole: item.approverRole,
      status: item.status,
      dueAt: item.dueAt,
      createdAt: item.createdAt,
      completedAt: item.completedAt ?? null,
      ageHours: differenceInHours(item.createdAt),
      isOverdue: item.dueAt ? new Date(item.dueAt) < now : false,
      metadata: item.metadata ?? null,
    }));

  const byStatus = pipelineSummary?.byStatus ?? {};
  const totalApplications = pipelineSummary?.totals?.applications ?? 0;
  const funnelOrder = [
    { status: 'submitted', label: 'Submitted' },
    { status: 'under_review', label: 'Under review' },
    { status: 'shortlisted', label: 'Shortlisted' },
    { status: 'interview', label: 'Interview' },
    { status: 'offered', label: 'Offer' },
    { status: 'hired', label: 'Hired' },
  ];
  let previousCount = totalApplications || 0;
  const funnel = funnelOrder.map((stage, index) => {
    const count = Number(byStatus[stage.status] ?? 0);
    const conversionFromPrevious =
      index === 0
        ? 100
        : percentage(count, previousCount || (index === 1 ? totalApplications : previousCount) || 1);
    const cumulativeConversion = percentage(count, totalApplications || 1);
    previousCount = count || previousCount;
    return {
      ...stage,
      count,
      conversionFromPrevious,
      cumulativeConversion,
    };
  });

  const upcomingInterviews = interviewRecords.filter((item) => {
    if (item.completedAt) return false;
    if (!item.scheduledAt) return false;
    return new Date(item.scheduledAt) >= now;
  }).length;
  const rescheduleCount = interviewRecords.reduce((sum, item) => sum + Number(item.rescheduleCount ?? 0), 0);

  const approvalsCompleted = approvalRecords.filter((item) => item.completedAt).length;

  return {
    totalStages: jobStages.length,
    averageStageDurationHours: averageStageDuration,
    pendingApprovals: pendingApprovals.length,
    overdueApprovals: overdueApprovals.length,
    averageApprovalTurnaroundHours: completionDurations.length ? Number(average(completionDurations)) : null,
    stageGuides: stageRecords.slice(0, 8).map((stage) => ({
      id: stage.id,
      name: stage.name,
      slaHours: stage.slaHours,
      averageDurationHours: stage.averageDurationHours == null ? null : Number(stage.averageDurationHours),
      guideUrl: stage.guideUrl,
    })),
    stagePerformance: sortedStagePerformance,
    approvalQueue: {
      total: pendingApprovals.length,
      overdue: overdueApprovals.length,
      averageCompletionHours: completionDurations.length ? Number(average(completionDurations)) : null,
      items: approvalQueueItems,
    },
    campaigns: {
      totalSpend,
      averageCostPerApplication: averageCampaignCpa,
      byChannel: campaignMetrics,
      topChannels: campaignMetrics.slice(0, 5),
    },
    atsHealth: {
      conversionRates: pipelineSummary?.conversionRates ?? {},
      velocity: pipelineSummary?.velocity ?? {},
      activeRequisitions: jobSummary?.total ?? 0,
      upcomingInterviews,
      rescheduleCount,
      pendingApprovals: pendingApprovals.length,
    },
    funnel,
    recentActivity: {
      approvalsCompleted,
      campaignsTracked: campaignRecords.length,
      interviewsScheduled: interviewRecords.length,
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

function buildInterviewSchedulerDetail({ schedules, availability, reminders }) {
  const scheduleRecords = (Array.isArray(schedules) ? schedules : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );
  const availabilityRecords = (Array.isArray(availability) ? availability : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );
  const reminderRecords = (Array.isArray(reminders) ? reminders : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );

  const now = new Date();
  const upcoming = scheduleRecords
    .filter((schedule) => {
      const scheduledAt = schedule?.scheduledAt ? new Date(schedule.scheduledAt) : null;
      return scheduledAt && !Number.isNaN(scheduledAt.getTime()) && scheduledAt >= now;
    })
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const durations = [];
  const leadTimes = [];
  let reschedules = 0;
  let roomsReserved = 0;
  let conflicts = 0;
  const interviewerLoad = new Map();
  const timezoneCounts = new Map();

  scheduleRecords.forEach((schedule) => {
    const durationMinutes = Number(schedule?.durationMinutes ?? 0);
    if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
      durations.push(durationMinutes);
    }

    const createdAt = schedule?.createdAt ?? schedule?.updatedAt;
    if (createdAt && schedule?.scheduledAt) {
      const lead = differenceInHours(createdAt, schedule.scheduledAt);
      if (Number.isFinite(lead) && lead >= 0) {
        leadTimes.push(lead);
      }
    }

    reschedules += Number(schedule?.rescheduleCount ?? 0);

    if (schedule?.metadata?.roomReservation?.status === 'confirmed') {
      roomsReserved += 1;
    }

    if (schedule?.metadata?.conflict) {
      conflicts += 1;
    }

    const roster = Array.isArray(schedule?.interviewerRoster) ? schedule.interviewerRoster : [];
    roster.forEach((member) => {
      const name = member?.name ?? member?.email ?? 'Unassigned';
      interviewerLoad.set(name, (interviewerLoad.get(name) ?? 0) + 1);
      const tz = member?.timezone ?? schedule?.metadata?.timezone;
      if (tz) {
        timezoneCounts.set(tz, (timezoneCounts.get(tz) ?? 0) + 1);
      }
    });
  });

  availabilityRecords.forEach((slot) => {
    if (slot?.timezone) {
      timezoneCounts.set(slot.timezone, (timezoneCounts.get(slot.timezone) ?? 0) + 1);
    }
  });

  const reminderScheduleIds = new Set(
    reminderRecords
      .filter((reminder) => reminder?.interviewScheduleId && reminder?.deliveryStatus !== 'failed')
      .map((reminder) => reminder.interviewScheduleId),
  );
  const reminderCoverage = upcoming.length ? percentage(reminderScheduleIds.size, upcoming.length) : 0;

  const planningWindowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const relevantAvailability = availabilityRecords.filter((slot) => {
    const start = slot?.availableFrom ? new Date(slot.availableFrom) : null;
    const end = slot?.availableTo ? new Date(slot.availableTo) : null;
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return false;
    }
    return end >= now && start <= planningWindowEnd;
  });

  const totalAvailabilityHours = relevantAvailability.reduce((total, slot) => {
    const slotHours = Number(slot?.capacityHours ?? null);
    if (Number.isFinite(slotHours) && slotHours > 0) {
      return total + slotHours;
    }
    const calculated = differenceInHours(slot.availableFrom, slot.availableTo);
    return Number.isFinite(calculated) && calculated > 0 ? total + calculated : total;
  }, 0);

  const scheduledHours = upcoming.reduce((total, schedule) => {
    const minutes = Number(schedule?.durationMinutes ?? 0);
    return Number.isFinite(minutes) ? total + minutes / 60 : total;
  }, 0);

  const availabilityCoverage =
    totalAvailabilityHours > 0
      ? Math.min(100, Number(((scheduledHours / totalAvailabilityHours) * 100).toFixed(1)))
      : null;

  const dailyAvailability = new Map();
  relevantAvailability.forEach((slot) => {
    const key = toDateKey(slot.availableFrom);
    if (!key) return;
    const existing = dailyAvailability.get(key) ?? { availableHours: 0, scheduledHours: 0 };
    const slotHours = Number(slot?.capacityHours ?? null);
    if (Number.isFinite(slotHours) && slotHours > 0) {
      existing.availableHours += slotHours;
    } else {
      const calculated = differenceInHours(slot.availableFrom, slot.availableTo);
      if (Number.isFinite(calculated) && calculated > 0) {
        existing.availableHours += calculated;
      }
    }
    dailyAvailability.set(key, existing);
  });

  upcoming.forEach((schedule) => {
    const key = toDateKey(schedule?.scheduledAt);
    if (!key) return;
    const existing = dailyAvailability.get(key) ?? { availableHours: 0, scheduledHours: 0 };
    const durationHours = Number(schedule?.durationMinutes ?? 0) / 60;
    if (Number.isFinite(durationHours) && durationHours > 0) {
      existing.scheduledHours += durationHours;
    }
    dailyAvailability.set(key, existing);
  });

  const availabilityGaps = Array.from(dailyAvailability.entries())
    .map(([date, value]) => ({
      date,
      availableHours: Number(value.availableHours.toFixed?.(1) ?? value.availableHours),
      scheduledHours: Number(value.scheduledHours.toFixed?.(1) ?? value.scheduledHours),
      shortfallHours:
        value.availableHours >= value.scheduledHours
          ? 0
          : Number((value.scheduledHours - value.availableHours).toFixed(1)),
    }))
    .filter((entry) => entry.shortfallHours > 0)
    .slice(0, 5);

  const upcomingSummary = upcoming.slice(0, 8).map((schedule) => ({
    id: schedule.id,
    stage: schedule.interviewStage,
    scheduledAt: schedule.scheduledAt,
    durationMinutes: schedule.durationMinutes,
    interviewerCount: Array.isArray(schedule?.interviewerRoster) ? schedule.interviewerRoster.length : null,
    location: schedule?.metadata?.roomReservation?.room ?? schedule?.metadata?.meetingUrl ?? null,
    templateId: schedule?.metadata?.templateId ?? schedule?.templateId ?? null,
  }));

  return {
    upcomingCount: upcoming.length,
    averageLeadTimeHours: leadTimes.length ? Number(average(leadTimes).toFixed(1)) : null,
    averageDurationMinutes: durations.length ? Number(average(durations).toFixed(1)) : null,
    rescheduleRate: scheduleRecords.length ? percentage(reschedules, scheduleRecords.length) : 0,
    reminderCoverage,
    roomsReserved,
    conflicts,
    availabilityCoverage,
    interviewerLoad: Array.from(interviewerLoad.entries())
      .map(([name, load]) => ({ name, load }))
      .sort((a, b) => b.load - a.load)
      .slice(0, 6),
    timezoneCoverage: Array.from(timezoneCounts.entries()).map(([timezone, count]) => ({ timezone, count })),
    availabilityGaps,
    upcoming: upcomingSummary,
  };
}

function buildPanelTemplateSummary({ templates, evaluations }) {
  const templateRecords = (Array.isArray(templates) ? templates : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );
  const evaluationRecords = (Array.isArray(evaluations) ? evaluations : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );

  const roleCoverage = new Set();
  const stageCoverage = new Map();
  const competencyCoverage = new Map();
  const evaluationCounts = new Map();
  const rubricScores = new Map();

  evaluationRecords.forEach((evaluation) => {
    if (evaluation?.templateId) {
      evaluationCounts.set(
        evaluation.templateId,
        (evaluationCounts.get(evaluation.templateId) ?? 0) + 1,
      );
    }

    const rubric = evaluation?.rubricScores;
    if (rubric && typeof rubric === 'object') {
      Object.entries(rubric).forEach(([competency, score]) => {
        const numeric = Number(score);
        if (!Number.isFinite(numeric)) return;
        if (!rubricScores.has(competency)) {
          rubricScores.set(competency, []);
        }
        rubricScores.get(competency).push(numeric);
      });
    }
  });

  templateRecords.forEach((template) => {
    if (template?.roleName) {
      roleCoverage.add(template.roleName);
    }
    if (template?.stage) {
      stageCoverage.set(template.stage, (stageCoverage.get(template.stage) ?? 0) + 1);
    }
    const competencies = Array.isArray(template?.competencies) ? template.competencies : [];
    competencies.forEach((competency) => {
      const label = typeof competency === 'string' ? competency : competency?.name ?? competency?.title;
      if (!label) return;
      competencyCoverage.set(label, (competencyCoverage.get(label) ?? 0) + 1);
    });
  });

  const topTemplates = templateRecords
    .slice()
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0) - new Date(a.updatedAt ?? a.createdAt ?? 0))
    .slice(0, 6)
    .map((template) => ({
      id: template.id,
      roleName: template.roleName,
      stage: template.stage,
      durationMinutes: template.durationMinutes,
      version: template.version,
      lastUsedAt: template.lastUsedAt,
      competencies: (Array.isArray(template?.competencies) ? template.competencies : []).slice(0, 4),
      evaluations: evaluationCounts.get(template.id) ?? 0,
    }));

  const rubricLibrary = Array.from(rubricScores.entries()).map(([competency, scores]) => ({
    competency,
    averageScore: scores.length ? Number(average(scores).toFixed(1)) : null,
    submissions: scores.length,
  }));

  return {
    totalTemplates: templateRecords.length,
    rolesCovered: roleCoverage.size,
    stageCoverage: Array.from(stageCoverage.entries()).map(([stage, count]) => ({ stage, count })),
    competencyCoverage: Array.from(competencyCoverage.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    topTemplates,
    rubricLibrary,
  };
}

function buildCandidatePrepSummary({ portals }) {
  const portalRecords = (Array.isArray(portals) ? portals : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );

  const ndaRequired = portalRecords.filter((portal) => portal?.ndaRequired);
  const ndaSigned = ndaRequired.filter((portal) => portal?.ndaStatus === 'signed');

  const formsRequired = portalRecords.reduce((total, portal) => total + Number(portal?.formsRequired ?? 0), 0);
  const formsCompleted = portalRecords.reduce((total, portal) => total + Number(portal?.formsCompleted ?? 0), 0);
  const resourcesTotal = portalRecords.reduce((total, portal) => total + Number(portal?.resourceTotal ?? 0), 0);
  const resourcesViewed = portalRecords.reduce((total, portal) => total + Number(portal?.resourceViews ?? 0), 0);
  const totalVisits = portalRecords.reduce((total, portal) => total + Number(portal?.visitCount ?? 0), 0);
  const followUpsPending = portalRecords.filter((portal) => {
    if (!portal?.nextActionAt) return false;
    const dueAt = new Date(portal.nextActionAt);
    return !Number.isNaN(dueAt.getTime()) && dueAt > new Date();
  }).length;

  const topPortals = portalRecords
    .slice()
    .sort((a, b) => new Date(b.lastAccessedAt ?? b.updatedAt ?? 0) - new Date(a.lastAccessedAt ?? a.updatedAt ?? 0))
    .slice(0, 6)
    .map((portal) => ({
      id: portal.id,
      candidateName: portal.candidateName,
      stage: portal.stage,
      status: portal.status,
      lastAccessedAt: portal.lastAccessedAt,
      ndaStatus: portal.ndaStatus,
      formsProgress:
        portal.formsRequired > 0
          ? Math.min(100, Math.round((Number(portal.formsCompleted ?? 0) / portal.formsRequired) * 100))
          : null,
      resourceProgress:
        portal.resourceTotal > 0
          ? Math.min(100, Math.round((Number(portal.resourceViews ?? 0) / portal.resourceTotal) * 100))
          : null,
    }));

  return {
    totalPortals: portalRecords.length,
    activePortals: portalRecords.filter((portal) => portal?.status !== 'archived').length,
    ndaCompletionRate: ndaRequired.length ? percentage(ndaSigned.length, ndaRequired.length) : 0,
    formCompletionRate: formsRequired ? percentage(formsCompleted, formsRequired) : 0,
    resourceEngagementRate: resourcesTotal ? percentage(resourcesViewed, resourcesTotal) : 0,
    averageVisits: portalRecords.length ? Number((totalVisits / portalRecords.length).toFixed(1)) : null,
    followUpsPending,
    topPortals,
  };
}

function buildEvaluationWorkspaceSummary({ evaluations, calibrationSessions, decisionTrackers }) {
  const evaluationRecords = (Array.isArray(evaluations) ? evaluations : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );
  const calibrationRecords = (Array.isArray(calibrationSessions) ? calibrationSessions : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );
  const decisionRecords = (Array.isArray(decisionTrackers) ? decisionTrackers : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );

  const recommendations = new Map();
  let anonymizedCount = 0;
  const scores = [];
  const biasFlags = new Map();

  evaluationRecords.forEach((evaluation) => {
    if (evaluation?.overallRecommendation) {
      const label = evaluation.overallRecommendation;
      recommendations.set(label, (recommendations.get(label) ?? 0) + 1);
    }
    const score = Number(evaluation?.overallScore ?? null);
    if (Number.isFinite(score)) {
      scores.push(score);
    }
    if (evaluation?.anonymized) {
      anonymizedCount += 1;
    }
    const flags = Array.isArray(evaluation?.biasFlags)
      ? evaluation.biasFlags
      : evaluation?.biasFlags && typeof evaluation.biasFlags === 'object'
        ? Object.entries(evaluation.biasFlags)
            .filter(([, value]) => Boolean(value))
            .map(([key]) => key)
        : [];
    flags.forEach((flag) => {
      const label = normalizeCategory(flag);
      biasFlags.set(label, (biasFlags.get(label) ?? 0) + 1);
    });
  });

  const decisionVelocities = decisionRecords
    .filter((decision) => decision?.decidedAt)
    .map((decision) => differenceInDays(decision.openedAt, decision.decidedAt))
    .filter((value) => Number.isFinite(value));

  const decisionSummaries = decisionRecords.slice(0, 10).map((decision) => ({
    id: decision.id,
    applicationId: decision.applicationId,
    candidateName: decision.candidateName,
    status: decision.status,
    decision: decision.decision,
    updatedAt: decision.updatedAt,
    approvals: decision.approvals,
  }));

  const calibrationSummaries = calibrationRecords
    .slice(0, 8)
    .map((session) => ({
      id: session.id,
      roleName: session.roleName,
      scheduledAt: session.scheduledAt,
      completedAt: session.completedAt,
      alignmentScore:
        session.alignmentScore == null ? null : Number(session.alignmentScore),
      participants: session.participants,
    }));

  return {
    evaluationsSubmitted: evaluationRecords.length,
    averageScore: scores.length ? Number(average(scores).toFixed(1)) : null,
    anonymizedShare: evaluationRecords.length ? percentage(anonymizedCount, evaluationRecords.length) : 0,
    recommendationMix: Object.fromEntries(recommendations.entries()),
    biasFlags: Array.from(biasFlags.entries())
      .map(([flag, count]) => ({ flag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    calibrationSessions: calibrationSummaries,
    decisionVelocityDays: decisionVelocities.length ? Number(average(decisionVelocities).toFixed(1)) : null,
    decisionTrackers: decisionSummaries,
  };
}

function buildOfferBridgeDetail({ offerPackages, onboardingTasks }) {
  const packageRecords = (Array.isArray(offerPackages) ? offerPackages : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );
  const taskRecords = (Array.isArray(onboardingTasks) ? onboardingTasks : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );

  const openOffers = packageRecords.filter((pkg) => ['extended', 'accepted', 'pending'].includes(pkg?.status)).length;
  const approvalsPending = packageRecords.filter((pkg) => pkg?.approvalStatus === 'pending').length;
  const backgroundChecksInProgress = packageRecords.filter((pkg) => pkg?.backgroundCheckStatus === 'in_progress').length;
  const signaturesOutstanding = packageRecords.filter((pkg) => pkg?.digitalSignatureStatus !== 'completed').length;
  const packageValues = packageRecords
    .map((pkg) => Number(pkg?.packageValue ?? null))
    .filter((value) => Number.isFinite(value));

  const upcomingStartDates = packageRecords
    .filter((pkg) => pkg?.startDate)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 6)
    .map((pkg) => ({
      id: pkg.id,
      candidateName: pkg.candidateName,
      roleName: pkg.roleName,
      startDate: pkg.startDate,
      status: pkg.status,
    }));

  const tasksByCategory = new Map();
  let completedTasks = 0;
  taskRecords.forEach((task) => {
    const category = task?.category ?? 'general';
    const entry = tasksByCategory.get(category) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (task?.status === 'completed') {
      entry.completed += 1;
      completedTasks += 1;
    }
    tasksByCategory.set(category, entry);
  });

  const breakdown = Array.from(tasksByCategory.entries()).map(([category, metrics]) => ({
    category,
    total: metrics.total,
    completed: metrics.completed,
    completionRate: metrics.total ? percentage(metrics.completed, metrics.total) : 0,
  }));

  return {
    openOffers,
    approvalsPending,
    backgroundChecksInProgress,
    signaturesOutstanding,
    averagePackageValue: packageValues.length ? Number(average(packageValues).toFixed(2)) : null,
    offerPackages: packageRecords.slice(0, 10).map((pkg) => ({
      id: pkg.id,
      candidateName: pkg.candidateName,
      roleName: pkg.roleName,
      status: pkg.status,
      approvalStatus: pkg.approvalStatus,
      backgroundCheckStatus: pkg.backgroundCheckStatus,
      digitalSignatureStatus: pkg.digitalSignatureStatus,
      startDate: pkg.startDate,
      packageValue: pkg.packageValue,
      currency: pkg.currency,
    })),
    upcomingStartDates,
    tasks: {
      total: taskRecords.length,
      completed: completedTasks,
      completionRate: taskRecords.length ? percentage(completedTasks, taskRecords.length) : 0,
      breakdown,
    },
  };
}

function buildCandidateCareCenterSummary({ tickets, candidateExperience }) {
  const ticketRecords = (Array.isArray(tickets) ? tickets : []).map((record) =>
    record?.get ? record.get({ plain: true }) : record,
  );

  const responseTimes = [];
  let escalations = 0;
  const inclusionCounts = new Map();

  ticketRecords.forEach((ticket) => {
    if (ticket?.firstRespondedAt) {
      const minutes = differenceInHours(ticket.openedAt, ticket.firstRespondedAt);
      if (Number.isFinite(minutes) && minutes >= 0) {
        responseTimes.push(minutes * 60);
      }
    }
    if (ticket?.escalatedAt) {
      escalations += 1;
    }
    if (ticket?.inclusionCategory) {
      const label = normalizeCategory(ticket.inclusionCategory);
      inclusionCounts.set(label, (inclusionCounts.get(label) ?? 0) + 1);
    }
  });

  const openTickets = ticketRecords.filter((ticket) => !['resolved', 'closed'].includes(ticket?.status)).length;
  const followUpsPending = ticketRecords.filter((ticket) => {
    if (!ticket?.followUpDueAt) return false;
    const dueAt = new Date(ticket.followUpDueAt);
    return !Number.isNaN(dueAt.getTime()) && dueAt > new Date();
  }).length;

  const inclusionScore = ticketRecords.length
    ? Number(((inclusionCounts.size / ticketRecords.length) * 100).toFixed(1))
    : null;

  const recentTickets = ticketRecords
    .slice()
    .sort((a, b) => new Date(b.openedAt ?? b.createdAt ?? 0) - new Date(a.openedAt ?? a.createdAt ?? 0))
    .slice(0, 8)
    .map((ticket) => ({
      id: ticket.id,
      candidateName: ticket.candidateName,
      type: ticket.type,
      status: ticket.status,
      openedAt: ticket.openedAt,
      firstRespondedAt: ticket.firstRespondedAt,
      priority: ticket.priority,
      inclusionCategory: ticket.inclusionCategory,
    }));

  return {
    satisfaction: candidateExperience?.averageScore ?? null,
    nps: candidateExperience?.nps ?? null,
    averageResponseMinutes: responseTimes.length ? Number(average(responseTimes).toFixed(1)) : null,
    openTickets,
    escalations,
    followUpsPending: (candidateExperience?.followUpsPending ?? 0) + followUpsPending,
    inclusionScore,
    inclusionBreakdown: Object.fromEntries(inclusionCounts.entries()),
    recentTickets,
  };
}

function buildOfferAndOnboardingSummary({
  offers,
  candidateExperience,
  interviewOperations,
  applications,
  alerts,
  offerBridge,
}) {
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
    approvalsPending: offerBridge?.approvalsPending ?? 0,
    backgroundChecksInProgress: offerBridge?.backgroundChecksInProgress ?? 0,
    signaturesOutstanding: offerBridge?.signaturesOutstanding ?? 0,
  };
}

function buildCandidateCareSummary({ candidateExperience, alerts, candidateCareCenter }) {
  const escalations = alerts.items.filter((item) => normalizeCategory(item.category).toLowerCase().includes('experience'));

  return {
    satisfaction: candidateExperience.averageScore,
    nps: candidateExperience.nps,
    followUpsPending: candidateExperience.followUpsPending,
    escalations: (candidateCareCenter?.escalations ?? 0) + escalations.length,
    openTickets: candidateCareCenter?.openTickets ?? null,
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

function buildEmployerBrandStudioSummary({ profile, assets, stories, benefits }) {
  const normalizeName = (record) => {
    const profileRecord = record?.profile ?? record;
    const parts = [profileRecord?.firstName, profileRecord?.lastName].filter(Boolean);
    return parts.length ? parts.join(' ') : null;
  };

  const publishedAssets = assets.filter((asset) => asset.status === 'published');
  const engagementScores = publishedAssets
    .map((asset) => (asset.engagementScore == null ? null : Number(asset.engagementScore)))
    .filter((value) => Number.isFinite(value));

  const publishedStories = stories.filter((story) => story.status === 'published');
  const scheduledStories = stories.filter((story) => story.status === 'scheduled');
  const topStories = [...publishedStories]
    .sort((a, b) => (Number(b.engagementScore) || 0) - (Number(a.engagementScore) || 0))
    .slice(0, 3)
    .map((story) => ({
      id: story.id,
      title: story.title,
      storyType: story.storyType,
      summary: story.summary,
      engagementScore: story.engagementScore == null ? null : Number(story.engagementScore),
      publishedAt: story.publishedAt,
      authorName: normalizeName(story.author?.profile) ?? normalizeName(story.author),
    }));

  const featuredBenefits = benefits.filter((benefit) => Boolean(benefit.isFeatured));
  const benefitCategories = new Map();
  benefits.forEach((benefit) => {
    benefitCategories.set(benefit.category, (benefitCategories.get(benefit.category) ?? 0) + 1);
  });

  const profileCompleteness = (() => {
    if (!profile) return 0;
    const fields = ['companyName', 'description', 'website', 'valuesStatement'];
    const completed = fields.reduce((count, field) => (profile[field] ? count + 1 : count), 0);
    return Number(((completed / fields.length) * 100).toFixed(0));
  })();

  const highlights = [];
  if (profileCompleteness >= 80) {
    highlights.push('Company profile is nearly complete and ready for campaigns.');
  } else if (profileCompleteness >= 40) {
    highlights.push('Expand your company story to boost talent conversion.');
  }
  if (publishedAssets.length >= 5) {
    highlights.push('Robust library of published employer brand assets available.');
  }
  if (publishedStories.length && topStories.length) {
    highlights.push(`Top story “${topStories[0].title}” is driving engagement.`);
  }
  if (!benefits.length) {
    highlights.push('Document employee benefits to power offer and onboarding content.');
  }

  return {
    profileCompleteness,
    publishedAssets: publishedAssets.length,
    averageAssetEngagement: engagementScores.length
      ? Number((engagementScores.reduce((sum, value) => sum + value, 0) / engagementScores.length).toFixed(1))
      : null,
    stories: {
      total: stories.length,
      published: publishedStories.length,
      scheduled: scheduledStories.length,
      topStories,
    },
    assets: publishedAssets.slice(0, 5).map((asset) => ({
      id: asset.id,
      title: asset.title,
      assetType: asset.assetType,
      engagementScore: asset.engagementScore == null ? null : Number(asset.engagementScore),
      publishedAt: asset.publishedAt,
      url: asset.url,
    })),
    benefits: {
      total: benefits.length,
      featured: featuredBenefits.slice(0, 5).map((benefit) => ({
        id: benefit.id,
        title: benefit.title,
        category: benefit.category,
        effectiveDate: benefit.effectiveDate,
      })),
      categories: Array.from(benefitCategories.entries()).map(([category, count]) => ({ category, count })),
    },
    highlights,
  };
}

function buildEmployeeJourneysSummary({ journeys, memberSummary }) {
  if (!journeys?.length) {
    return {
      totalPrograms: 0,
      activeEmployees: 0,
      averageCompletionRate: null,
      programsAtRisk: 0,
      workforceCoverage: null,
      byType: [],
      spotlightPrograms: [],
      highlights: ['Launch an onboarding journey to track day-one readiness.'],
    };
  }

  const byType = new Map();
  let activeEmployees = 0;
  const completionRates = [];
  const spotlight = [];

  const healthWeights = new Map([
    ['off_track', 0],
    ['needs_attention', 1],
    ['at_risk', 2],
    ['on_track', 3],
  ]);

  journeys.forEach((program) => {
    const completionRate = program.completionRate == null ? null : Number(program.completionRate);
    if (Number.isFinite(completionRate)) {
      completionRates.push(completionRate);
    }

    const active = Number(program.activeEmployees ?? 0);
    activeEmployees += Number.isFinite(active) ? active : 0;

    const entry = byType.get(program.programType) ?? {
      type: program.programType,
      programCount: 0,
      activeEmployees: 0,
      completionRateSum: 0,
      completionSamples: 0,
      atRiskPrograms: 0,
      averageDurationSum: 0,
      durationSamples: 0,
    };
    entry.programCount += 1;
    entry.activeEmployees += active;
    if (Number.isFinite(completionRate)) {
      entry.completionRateSum += completionRate;
      entry.completionSamples += 1;
    }
    if (program.averageDurationDays != null && Number.isFinite(Number(program.averageDurationDays))) {
      entry.averageDurationSum += Number(program.averageDurationDays);
      entry.durationSamples += 1;
    }
    if (['at_risk', 'off_track', 'needs_attention'].includes(program.healthStatus)) {
      entry.atRiskPrograms += 1;
    }
    byType.set(program.programType, entry);

    const ownerProfile = program.owner?.profile ?? program.owner;
    const ownerName = ownerProfile
      ? [ownerProfile.firstName, ownerProfile.lastName].filter(Boolean).join(' ').trim() || null
      : null;

    spotlight.push({
      id: program.id,
      title: program.title,
      programType: program.programType,
      healthStatus: program.healthStatus,
      activeEmployees: active,
      completionRate,
      averageDurationDays:
        program.averageDurationDays != null && Number.isFinite(Number(program.averageDurationDays))
          ? Number(program.averageDurationDays)
          : null,
      ownerName,
      priority: healthWeights.get(program.healthStatus) ?? 3,
    });
  });

  const programsAtRisk = spotlight.filter((program) => program.priority <= 2).length;
  const averageCompletionRate = completionRates.length
    ? Number((completionRates.reduce((sum, value) => sum + value, 0) / completionRates.length).toFixed(1))
    : null;
  const workforceCoverage = memberSummary?.total
    ? percentage(activeEmployees, memberSummary.total)
    : null;

  const byTypeSummaries = Array.from(byType.values()).map((entry) => ({
    type: entry.type,
    programCount: entry.programCount,
    activeEmployees: entry.activeEmployees,
    averageCompletionRate: entry.completionSamples
      ? Number((entry.completionRateSum / entry.completionSamples).toFixed(1))
      : null,
    averageDurationDays: entry.durationSamples
      ? Number((entry.averageDurationSum / entry.durationSamples).toFixed(1))
      : null,
    atRiskPrograms: entry.atRiskPrograms,
  }));

  const spotlightPrograms = spotlight
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      const aRate = Number.isFinite(a.completionRate) ? a.completionRate : 101;
      const bRate = Number.isFinite(b.completionRate) ? b.completionRate : 101;
      return aRate - bRate;
    })
    .slice(0, 5)
    .map(({ priority, ...program }) => program);

  const highlights = [];
  if (programsAtRisk) {
    highlights.push(`${programsAtRisk} journey${programsAtRisk === 1 ? '' : 's'} flagged for follow-up.`);
  }
  if (averageCompletionRate != null) {
    highlights.push(`Average completion rate is ${averageCompletionRate}% across journeys.`);
  }
  if (workforceCoverage != null) {
    highlights.push(`Journeys cover ${workforceCoverage}% of active workspace members.`);
  }

  return {
    totalPrograms: journeys.length,
    activeEmployees,
    averageCompletionRate,
    programsAtRisk,
    workforceCoverage,
    byType: byTypeSummaries,
    spotlightPrograms,
    highlights,
  };
}

function buildSettingsGovernanceDetails({
  governance,
  integrations,
  calendarConnections,
  memberSummary,
  inviteSummary,
  alerts,
}) {
  const integrationCategories = new Map();
  let connectedIntegrations = 0;
  let failingIntegrations = 0;

  integrations.forEach((integration) => {
    integrationCategories.set(
      integration.category,
      (integrationCategories.get(integration.category) ?? 0) + 1,
    );
    if (integration.status === 'connected') {
      connectedIntegrations += 1;
    }
    if (integration.status === 'error' || integration.status === 'disconnected') {
      failingIntegrations += 1;
    }
  });

  let lastCalendarSync = null;
  let calendarIssues = 0;
  let connectedCalendars = 0;
  calendarConnections.forEach((connection) => {
    if (!lastCalendarSync || new Date(connection.lastSyncedAt ?? 0) > new Date(lastCalendarSync)) {
      lastCalendarSync = connection.lastSyncedAt;
    }
    if (connection.status === 'sync_error') {
      calendarIssues += 1;
    }
    if (connection.status === 'connected') {
      connectedCalendars += 1;
    }
  });

  const highlights = [];
  if (connectedCalendars) {
    highlights.push(`Calendar sync live across ${connectedCalendars} connection${connectedCalendars === 1 ? '' : 's'}.`);
  }
  if (failingIntegrations) {
    highlights.push(`Resolve ${failingIntegrations} integration${failingIntegrations === 1 ? '' : 's'} showing errors.`);
  }
  if ((inviteSummary?.pending ?? 0) > 0) {
    highlights.push(`${inviteSummary.pending} workspace invite${inviteSummary.pending === 1 ? '' : 's'} awaiting approval.`);
  }
  if ((alerts?.criticalAlerts ?? 0) > 0) {
    highlights.push('Critical compliance alerts require attention.');
  }

  return {
    calendar: {
      totalConnections: calendarConnections.length,
      connected: connectedCalendars,
      issues: calendarIssues,
      lastSyncedAt: lastCalendarSync,
      primaryCalendars: calendarConnections
        .filter((connection) => Boolean(connection.primaryCalendar))
        .slice(0, 3)
        .map((connection) => ({
          providerKey: connection.providerKey,
          primaryCalendar: connection.primaryCalendar,
          status: connection.status,
        })),
    },
    integrations: {
      total: integrations.length,
      connected: connectedIntegrations,
      failing: failingIntegrations,
      categories: Array.from(integrationCategories.entries()).map(([category, count]) => ({
        category,
        count,
      })),
    },
    permissions: {
      activeMembers: memberSummary?.active ?? 0,
      pendingInvites: inviteSummary?.pending ?? 0,
      uniqueTimezones: memberSummary?.uniqueTimezones ?? 0,
    },
    compliance: {
      criticalAlerts: alerts?.criticalAlerts ?? 0,
      openAlerts: alerts?.open ?? 0,
    },
    approvals: {
      pending: governance?.pendingApprovals ?? 0,
      criticalAlerts: governance?.criticalAlerts ?? 0,
      workspaceActive: governance?.workspaceActive ?? false,
    },
    highlights,
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
      panelTemplates,
      prepPortals,
      interviewEvaluations,
      calibrationSessions,
      decisionTrackers,
      offerPackages,
      onboardingTasks,
      candidateCareTickets,
      interviewerAvailability,
      interviewReminders,
      brandStories,
      employerBenefits,
      employeeJourneys,
      workspaceIntegrations,
      calendarConnections,
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
      fetchInterviewPanelTemplates({ workspaceId: workspace.id }),
      fetchCandidatePrepPortals({ workspaceId: workspace.id, since }),
      fetchInterviewEvaluations({ workspaceId: workspace.id, since }),
      fetchEvaluationCalibrationSessions({ workspaceId: workspace.id, since }),
      fetchDecisionTrackers({ workspaceId: workspace.id, since }),
      fetchOfferPackages({ workspaceId: workspace.id, since }),
      fetchOnboardingTasks({ workspaceId: workspace.id, since }),
      fetchCandidateCareTickets({ workspaceId: workspace.id, since }),
      fetchInterviewerAvailability({ workspaceId: workspace.id, since }),
      fetchInterviewReminders({ workspaceId: workspace.id, since }),
      fetchBrandStories({ workspaceId: workspace.id, since }),
      fetchEmployerBenefits({ workspaceId: workspace.id }),
      fetchEmployeeJourneys({ workspaceId: workspace.id }),
      fetchWorkspaceIntegrations({ workspaceId: workspace.id }),
      fetchCalendarConnections({ workspaceId: workspace.id }),
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
      applications,
      reviews,
      interviewSchedules,
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
    const interviewScheduler = buildInterviewSchedulerDetail({
      schedules: interviewSchedules,
      availability: interviewerAvailability,
      reminders: interviewReminders,
    });
    const panelTemplateSummary = buildPanelTemplateSummary({
      templates: panelTemplates,
      evaluations: interviewEvaluations,
    });
    const candidatePrep = buildCandidatePrepSummary({ portals: prepPortals });
    const evaluationWorkspaceSummary = buildEvaluationWorkspaceSummary({
      evaluations: interviewEvaluations,
      calibrationSessions,
      decisionTrackers,
    });
    const offerBridge = buildOfferBridgeDetail({ offerPackages, onboardingTasks });
    const candidateCareCenter = buildCandidateCareCenterSummary({
      tickets: candidateCareTickets,
      candidateExperience,
    });
    const partnerCollaborationDetails = buildPartnerCollaborationSummary({
      partnerSummary,
      engagements: partnerEngagements,
    });
    const plainBrandAssets = brandAssets.map((asset) => (asset?.get ? asset.get({ plain: true }) : asset));
    const plainBrandStories = brandStories.map((story) => (story?.get ? story.get({ plain: true }) : story));
    const plainBenefits = employerBenefits.map((benefit) => (benefit?.get ? benefit.get({ plain: true }) : benefit));
    const plainEmployeeJourneys = employeeJourneys.map((journey) => (journey?.get ? journey.get({ plain: true }) : journey));
    const plainIntegrations = workspaceIntegrations.map((integration) =>
      integration?.get ? integration.get({ plain: true }) : integration,
    );
    const plainCalendarConnections = calendarConnections.map((connection) =>
      connection?.get ? connection.get({ plain: true }) : connection,
    );

    const brandIntelligence = buildBrandIntelligenceSummary({ profile, assets: plainBrandAssets, jobSummary });
    const governance = buildGovernanceSummary({ approvals: jobApprovals, alerts: alertsSummary, workspace: workspaceSummary });
    const calendarDigest = buildCalendarDigest(calendarEvents);
    const employerBrandStudio = buildEmployerBrandStudioSummary({
      profile,
      assets: plainBrandAssets,
      stories: plainBrandStories,
      benefits: plainBenefits,
    });
    const employeeJourneysSummary = buildEmployeeJourneysSummary({
      journeys: plainEmployeeJourneys,
      memberSummary,
    });
    const settingsGovernance = buildSettingsGovernanceDetails({
      governance,
      integrations: plainIntegrations,
      calendarConnections: plainCalendarConnections,
      memberSummary,
      inviteSummary,
      alerts: alertsSummary,
    });
    const brandAndPeople = {
      employerBrandStudio,
      employeeJourneys: employeeJourneysSummary,
      settingsGovernance,
    };
    const offerOnboarding = buildOfferAndOnboardingSummary({
      offers,
      candidateExperience,
      interviewOperations,
      applications,
      alerts: alertsSummary,
      offerBridge,
    });
    const candidateCare = buildCandidateCareSummary({
      candidateExperience,
      alerts: alertsSummary,
      candidateCareCenter,
    });

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
      interviewExperience: {
        scheduler: interviewScheduler,
        panelTemplates: panelTemplateSummary,
        candidatePrep,
        evaluationWorkspace: evaluationWorkspaceSummary,
        offerBridge,
        candidateCareCenter,
      },
      candidateExperience,
      offerOnboarding,
      candidateCare,
      partnerCollaboration: partnerCollaborationDetails,
      brandIntelligence,
      governance,
      calendar: calendarDigest,
      brandAndPeople,
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

