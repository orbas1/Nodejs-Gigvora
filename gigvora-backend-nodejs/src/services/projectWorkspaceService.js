import {
  Project,
  ProjectWorkspace,
  ProjectWorkspaceBrief,
  ProjectWorkspaceWhiteboard,
  ProjectWorkspaceFile,
  ProjectWorkspaceConversation,
  ProjectWorkspaceApproval,
  ProjectWorkspaceMessage,
  ProjectWorkspaceBudget,
  ProjectWorkspaceObject,
  ProjectWorkspaceTimelineEntry,
  ProjectWorkspaceMeeting,
  ProjectWorkspaceRole,
  ProjectWorkspaceSubmission,
  ProjectWorkspaceInvite,
  ProjectWorkspaceHrRecord,
  WORKSPACE_APPROVAL_STATUSES,
  WORKSPACE_CONVERSATION_PRIORITIES,
  WORKSPACE_BUDGET_STATUSES,
  WORKSPACE_OBJECT_TYPES,
  WORKSPACE_OBJECT_STATUSES,
  WORKSPACE_TIMELINE_ENTRY_TYPES,
  WORKSPACE_MEETING_STATUSES,
  WORKSPACE_ROLE_STATUSES,
  WORKSPACE_SUBMISSION_STATUSES,
  WORKSPACE_INVITE_STATUSES,
  WORKSPACE_HR_STATUSES,
  PROJECT_MILESTONE_STATUSES,
} from '../models/index.js';
import crypto from 'crypto';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function normalizeStringList(input) {
  if (input === undefined) {
    return undefined;
  }
  if (Array.isArray(input)) {
    return input
      .map((item) => (item == null ? '' : String(item).trim()))
      .filter((value) => value.length > 0);
  }
  if (typeof input === 'string') {
    return input
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }
  return [];
}

function normalizeAttachments(input) {
  if (input === undefined) {
    return undefined;
  }
  if (Array.isArray(input)) {
    return input.map((entry) => {
      if (entry && typeof entry === 'object') {
        const clone = { ...entry };
        if (clone.url && typeof clone.url === 'string') {
          clone.url = clone.url.trim();
        }
        if (clone.label && typeof clone.label === 'string') {
          clone.label = clone.label.trim();
        }
        return clone;
      }
      return { label: String(entry), url: null };
    });
  }
  if (typeof input === 'string') {
    return normalizeStringList(input).map((label) => ({ label, url: null }));
  ProjectCollaborator,
  projectGigManagementSequelize,
} from '../models/projectGigManagementModels.js';
import {
  ProjectBudgetLine,
  ProjectDeliverable,
  ProjectTask,
  ProjectTaskAssignment,
  ProjectTaskDependency,
  ProjectChatChannel,
  ProjectChatMessage,
  ProjectTimelineEntry,
  ProjectMeeting,
  ProjectMeetingAttendee,
  ProjectCalendarEvent,
  ProjectRoleDefinition,
  ProjectRoleAssignment,
  ProjectSubmission,
  ProjectFile,
  ProjectInvitation,
  ProjectHrRecord,
} from '../models/projectWorkspaceModels.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';

function pick(input, allowed) {
  if (!input || typeof input !== 'object') {
    return {};
  }
  const payload = {};
  allowed.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(input, field) && input[field] !== undefined) {
      payload[field] = input[field];
    }
  });
  return payload;
}

async function ensureProject(ownerId, projectId, { include } = {}) {
  if (!ownerId) {
    throw new ValidationError('Owner id is required.');
  }
  if (!projectId) {
    throw new ValidationError('Project id is required.');
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date.`);
  }
  return date;
}

function normalizeCurrencyCode(value, { fallback = 'USD' } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  if (typeof value !== 'string') {
    throw new ValidationError('currency must be a string when provided.');
  }
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new ValidationError('currency must be a 3-letter ISO code.');
  }
  return normalized;
}

function normalizeMoneyValue(value, { fieldName = 'amount', allowNull = true } = {}) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    return allowNull ? null : 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError(`${fieldName} must be a numeric value.`);
  }
  return Number(numeric.toFixed(2));
}

function normalizeDecimalValue(value, { fieldName = 'value', allowNull = true } = {}) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    return allowNull ? null : 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError(`${fieldName} must be a numeric value.`);
  }
  return Number(numeric.toFixed(2));
}

function generateInviteToken() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return crypto.randomBytes(16).toString('hex');
}

async function mutateWorkspace(projectId, actorId, mutator) {
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const project = await Project.findByPk(projectId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    const workspace = await initializeWorkspaceForProject(project, { transaction, actorId });
    const result = await mutator({ project, workspace, transaction });

    await workspace.update({ lastActivityAt: new Date(), updatedById: actorId ?? null }, { transaction });

    return result;
  });
}

function computeWorkspaceMetrics(workspace, {
  approvals,
  files,
  conversations,
  whiteboards,
  budgets = [],
  timelineEntries = [],
  hrRecords = [],
}) {
  const snapshot = workspace.metricsSnapshot ?? {};
  const pendingApprovals = approvals.filter((item) => item.status !== 'approved').length;
  const overdueApprovals = approvals.filter((item) => {
    if (!item.dueAt) return false;
    if (['approved', 'rejected'].includes(item.status)) return false;
    return new Date(item.dueAt).getTime() < Date.now();
  }).length;
  const unreadMessages = conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0);
  const totalAssetsSizeBytes = files.reduce((total, file) => total + Number(file.sizeBytes || 0), 0);
  const activeWhiteboards = whiteboards.filter((board) => board.status === 'active').length;
  const budgetTotals = budgets.reduce(
    (acc, budget) => {
      const allocated = Number(budget.allocatedAmount || 0);
      const actual = Number(budget.actualAmount || 0);
      acc.allocated += allocated;
      acc.actual += actual;
      if (budget.status === 'over_budget') {
        acc.overBudget += 1;
      }
      return acc;
    },
    { allocated: 0, actual: 0, overBudget: 0 },
  );
  const activeTimeline = timelineEntries.filter((entry) => entry.status !== 'completed');
  const atRiskTimeline = timelineEntries.filter((entry) => entry.status === 'at_risk');
  const activeContributors = hrRecords.filter((record) => record.status === 'active');
  const capacityHours = activeContributors.reduce((total, record) => total + Number(record.capacityHours || 0), 0);
  const allocatedHours = activeContributors.reduce((total, record) => total + Number(record.allocatedHours || 0), 0);
  const budgetVariance = budgetTotals.allocated
    ? Number(((budgetTotals.actual - budgetTotals.allocated) / budgetTotals.allocated).toFixed(3))
    : 0;

  const metrics = {
    progressPercent: workspace.progressPercent == null ? 0 : Number(workspace.progressPercent),
    healthScore: workspace.healthScore == null ? null : Number(workspace.healthScore),
    velocityScore: workspace.velocityScore == null ? null : Number(workspace.velocityScore),
    riskLevel: workspace.riskLevel,
    clientSatisfaction: workspace.clientSatisfaction == null ? null : Number(workspace.clientSatisfaction),
    automationCoverage: workspace.automationCoverage == null ? null : Number(workspace.automationCoverage),
    pendingApprovals,
    overdueApprovals,
    unreadMessages,
    totalAssets: files.length,
    totalAssetsSizeBytes,
    activeWhiteboards,
    nextMilestone: workspace.nextMilestone,
    nextMilestoneDueAt: workspace.nextMilestoneDueAt,
    billingStatus: workspace.billingStatus,
    budgetAllocated: Number(budgetTotals.allocated.toFixed(2)),
    budgetActual: Number(budgetTotals.actual.toFixed(2)),
    budgetVariance,
    overBudgetLines: budgetTotals.overBudget,
    activeTimelineEntries: activeTimeline.length,
    atRiskTimelineEntries: atRiskTimeline.length,
    activeContributors: activeContributors.length,
    capacityHours: Number(capacityHours.toFixed(2)),
    allocatedHours: Number(allocatedHours.toFixed(2)),
  };

  ['automationRuns', 'activeStreams', 'deliverablesInProgress', 'teamUtilization'].forEach((key) => {
    if (snapshot[key] != null) {
      metrics[key] = snapshot[key];
    }
  const project = await Project.findOne({
    where: { id: projectId, ownerId },
    include,
  });
  if (!project) {
    throw new NotFoundError('Project not found.');
  }
  return project;
}

async function ensureTask(ownerId, projectId, taskId) {
  const project = await ensureProject(ownerId, projectId);
  const task = await ProjectTask.findOne({ where: { id: taskId, projectId } });
  if (!task) {
    throw new NotFoundError('Task not found.');
  }
  return { project, task };
}

async function ensureChannel(ownerId, projectId, channelId) {
  await ensureProject(ownerId, projectId);
  const channel = await ProjectChatChannel.findOne({ where: { id: channelId, projectId } });
  if (!channel) {
    throw new NotFoundError('Chat channel not found.');
  }
  return channel;
}

async function ensureDefaultChannel(projectId, { transaction } = {}) {
  const existing = await ProjectChatChannel.findOne({ where: { projectId, name: 'general' }, transaction });
  if (existing) {
    return existing;
  }
  return ProjectChatChannel.create(
    {
      projectId,
      name: 'general',
      topic: 'General project coordination',
      metadata: { systemGenerated: true },
    },
    { transaction },
  );
}

export async function initializeWorkspaceForProject(project, { transaction, actorId } = {}) {
  if (!project) {
    throw new ValidationError('Project instance is required.');
  }

  const projectId = project.id ?? project.get?.('id');
  if (!projectId) {
    throw new ValidationError('Project instance must include an id.');
  }

  const workspace = await ProjectWorkspace.findOrCreate({
    where: { projectId },
    defaults: {
      status: 'planning',
      progressPercent: 0,
      riskLevel: 'low',
      metrics: { initializedBy: actorId ?? null },
    },
    transaction,
  });

  await ensureDefaultChannel(projectId, { transaction });

  return workspace[0];
}

function sanitizeRecord(record) {
  if (!record) return null;
  if (typeof record.toJSON === 'function') {
    return record.toJSON();
  }
  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  if (record && typeof record === 'object') {
    return { ...record };
  }
  return record;
}

async function buildProjectPayload(project) {
  const plain = sanitizeRecord(project);
  if (!plain) {
    return null;
  }

  const channels = Array.isArray(plain.chatChannels) ? plain.chatChannels : [];
  const messages = [];
  channels.forEach((channel) => {
    if (Array.isArray(channel.messages)) {
      channel.messages
        .slice()
        .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
        .forEach((message) => {
          messages.push({ ...message, channelId: channel.id });
        });
    }
  });

  const tasks = Array.isArray(plain.tasks)
    ? plain.tasks.map((task) => ({
        ...task,
        assignments: Array.isArray(task.assignments) ? task.assignments : [],
        dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      }))
    : [];

  return {
    ...plain,
    chat: {
      channels: channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        topic: channel.topic,
        isPrivate: channel.isPrivate,
        metadata: channel.metadata ?? null,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
      })),
      messages,
    },
    tasks,
  };
}

function buildSummary(projects) {
  const aggregate = {
    projectCount: 0,
    budgetLines: 0,
    totalBudgetPlanned: 0,
    totalBudgetActual: 0,
    taskCount: 0,
    completedTasks: 0,
    meetingCount: 0,
    upcomingMeetings: 0,
    invitationCount: 0,
    activeCollaborators: 0,
    submissionCount: 0,
  };

  projects.forEach((project) => {
    aggregate.projectCount += 1;
    const budgetLines = project.budgetLines ?? [];
    aggregate.budgetLines += budgetLines.length;
    budgetLines.forEach((line) => {
      aggregate.totalBudgetPlanned += Number(line.plannedAmount ?? 0);
      aggregate.totalBudgetActual += Number(line.actualAmount ?? 0);
    });

    const tasks = project.tasks ?? [];
    aggregate.taskCount += tasks.length;
    aggregate.completedTasks += tasks.filter((task) => task.status === 'completed').length;

    const meetings = project.meetings ?? [];
    aggregate.meetingCount += meetings.length;
    aggregate.upcomingMeetings += meetings.filter((meeting) => new Date(meeting.scheduledAt) > new Date()).length;

    const invitations = project.invitations ?? [];
    aggregate.invitationCount += invitations.length;

    const assignments = project.roleDefinitions?.flatMap((role) => role.assignments ?? []) ?? [];
    aggregate.activeCollaborators += assignments.filter((assignment) => assignment.status === 'active').length;

    const submissions = project.submissions ?? [];
    aggregate.submissionCount += submissions.length;
  });

  aggregate.totalBudgetPlanned = Number(aggregate.totalBudgetPlanned.toFixed(2));
  aggregate.totalBudgetActual = Number(aggregate.totalBudgetActual.toFixed(2));

  return aggregate;
}

export async function getProjectWorkspaceOverview(ownerId, { includeDetails = true } = {}) {
  if (!ownerId) {
    throw new ValidationError('Owner id is required.');
  }

  const include = [
    { model: ProjectWorkspace, as: 'workspace' },
    { model: ProjectBudgetLine, as: 'budgetLines' },
    { model: ProjectDeliverable, as: 'deliverables' },
    {
      model: ProjectTask,
      as: 'tasks',
      include: [
        { model: ProjectTaskAssignment, as: 'assignments' },
        { model: ProjectTaskDependency, as: 'dependencies', include: [{ model: ProjectTask, as: 'prerequisite' }] },
      ],
    },
    {
      model: ProjectChatChannel,
      as: 'chatChannels',
      include: [
        {
          model: ProjectChatMessage,
          as: 'messages',
          separate: true,
          limit: 50,
          order: [['createdAt', 'DESC']],
        },
      ],
    },
    { model: ProjectTimelineEntry, as: 'timelineEntries' },
    { model: ProjectMeeting, as: 'meetings', include: [{ model: ProjectMeetingAttendee, as: 'attendees' }] },
    { model: ProjectCalendarEvent, as: 'calendarEvents' },
    { model: ProjectRoleDefinition, as: 'roleDefinitions', include: [{ model: ProjectRoleAssignment, as: 'assignments' }] },
    { model: ProjectSubmission, as: 'submissions' },
    { model: ProjectFile, as: 'files' },
    { model: ProjectInvitation, as: 'invitations' },
    { model: ProjectHrRecord, as: 'hrRecords' },
  ];

  const projects = await Project.findAll({
    where: { ownerId },
    include: includeDetails ? include : [{ model: ProjectWorkspace, as: 'workspace' }],
    order: [
      ['updatedAt', 'DESC'],
      [{ model: ProjectTask, as: 'tasks' }, 'dueDate', 'ASC'],
    ],
  });

  await Promise.all(projects.map((project) => ensureDefaultChannel(project.id)));

  if (!includeDetails) {
    return {
      projects: projects.map((project) => ({
        id: project.id,
        title: project.title,
        status: project.status,
        workspace: sanitizeRecord(project.workspace),
      })),
      summary: buildSummary(projects.map((project) => sanitizeRecord(project))),
    };
  }

  const budgetCount = await ProjectWorkspaceBudget.count({ where: { workspaceId: workspace.id }, transaction });

  if (budgetCount === 0) {
    await ProjectWorkspaceBudget.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          category: 'Strategy & research',
          allocatedAmount: 18000,
          actualAmount: 14250,
          currency: 'USD',
          status: 'in_review',
          ownerName: 'Strategy Lead',
          notes: 'Awaiting latest agency invoice before closing the month.',
        },
        {
          workspaceId: workspace.id,
          category: 'Design & experience',
          allocatedAmount: 24000,
          actualAmount: 22000,
          currency: 'USD',
          status: 'approved',
          ownerName: 'Design Director',
          notes: 'Includes freelance storyboard sprint and asset QA.',
        },
        {
          workspaceId: workspace.id,
          category: 'Engineering & automation',
          allocatedAmount: 32000,
          actualAmount: 34850,
          currency: 'USD',
          status: 'over_budget',
          ownerName: 'Technical Program Manager',
          notes: 'Spike due to additional workflow automation connectors.',
        },
      ],
      { transaction },
    );
  }

  let seededObjects = await ProjectWorkspaceObject.findAll({
    where: { workspaceId: workspace.id },
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });

  if (!seededObjects.length) {
    seededObjects = await ProjectWorkspaceObject.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          name: 'Discovery workshop assets',
          objectType: 'deliverable',
          status: 'completed',
          ownerName: 'Engagement Lead',
          description: 'Kickoff deck, stakeholder notes, and initial opportunity map.',
          dueAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
          tags: ['workshop', 'briefing'],
        },
        {
          workspaceId: workspace.id,
          name: 'Automation runbook',
          objectType: 'asset',
          status: 'active',
          ownerName: 'Automation PM',
          description: 'Ops-approved automation workflow templates and RACI chart.',
          dueAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4),
          tags: ['automation', 'ops'],
        },
        {
          workspaceId: workspace.id,
          name: 'Client enablement hub',
          objectType: 'milestone',
          status: 'draft',
          ownerName: 'Client Success',
          description: 'Self-service resource hub, training plan, and FAQs.',
          dueAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14),
          tags: ['launch', 'enablement'],
        },
      ],
      { transaction, returning: true },
    );
  }

  const timelineCount = await ProjectWorkspaceTimelineEntry.count({
    where: { workspaceId: workspace.id },
    transaction,
  });

  if (timelineCount === 0) {
    await ProjectWorkspaceTimelineEntry.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          title: 'Discovery complete',
          entryType: 'milestone',
          startAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 12),
          endAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 9),
          status: 'completed',
          ownerName: 'Engagement Lead',
          relatedObjectId: seededObjects[0]?.id ?? null,
          lane: 'Strategy',
          progressPercent: 100,
          metadata: { health: 'on_track' },
        },
        {
          workspaceId: workspace.id,
          title: 'Automation build sprint',
          entryType: 'phase',
          startAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
          endAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4),
          status: 'in_progress',
          ownerName: 'Technical Program Manager',
          relatedObjectId: seededObjects[1]?.id ?? null,
          lane: 'Engineering',
          progressPercent: 56,
          metadata: { blockers: ['API rate limits'] },
        },
        {
          workspaceId: workspace.id,
          title: 'Client enablement',
          entryType: 'task',
          startAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5),
          endAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 12),
          status: 'planned',
          ownerName: 'Client Success',
          relatedObjectId: seededObjects[2]?.id ?? null,
          lane: 'Enablement',
          progressPercent: 10,
          metadata: { workshop: 'Enablement rehearsal' },
        },
      ],
      { transaction },
    );
  }

  const meetingCount = await ProjectWorkspaceMeeting.count({ where: { workspaceId: workspace.id }, transaction });

  if (meetingCount === 0) {
    await ProjectWorkspaceMeeting.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          title: 'Client steering committee',
          agenda: 'Delivery status, risks, and finance approvals.',
          startAt: new Date(now.getTime() + 1000 * 60 * 60 * 24),
          endAt: new Date(now.getTime() + 1000 * 60 * 60 * 25),
          location: 'Zoom',
          meetingUrl: 'https://zoom.example.com/steering',
          hostName: 'Engagement Lead',
          status: 'scheduled',
          attendees: ['Client sponsor', 'Operations lead', 'Delivery manager'],
        },
        {
          workspaceId: workspace.id,
          title: 'Automation QA sync',
          agenda: 'Review failed test cases and mitigation plan.',
          startAt: new Date(now.getTime() + 1000 * 60 * 60 * 6),
          endAt: new Date(now.getTime() + 1000 * 60 * 60 * 7),
          location: 'Google Meet',
          meetingUrl: 'https://meet.example.com/automation',
          hostName: 'QA Lead',
          status: 'scheduled',
          attendees: ['QA team', 'Engineering'],
        },
        {
          workspaceId: workspace.id,
          title: 'Retrospective planning',
          agenda: 'Prep facilitation plan for phase retrospective.',
          startAt: new Date(now.getTime() + 1000 * 60 * 60 * 48),
          endAt: new Date(now.getTime() + 1000 * 60 * 60 * 49),
          location: 'Hybrid',
          meetingUrl: null,
          hostName: 'Program Manager',
          status: 'scheduled',
          attendees: ['Delivery', 'Client success'],
        },
      ],
      { transaction },
    );
  }

  const roleCount = await ProjectWorkspaceRole.count({ where: { workspaceId: workspace.id }, transaction });

  if (roleCount === 0) {
    await ProjectWorkspaceRole.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          memberName: 'Lena Torres',
          email: 'lena.torres@gigvora.com',
          role: 'Engagement Lead',
          status: 'active',
          permissions: ['workspace_admin', 'billing', 'approvals'],
          responsibilities: ['Client sponsor liaison', 'Delivery governance'],
          capacityHours: 32,
        },
        {
          workspaceId: workspace.id,
          memberName: 'Ari Banerjee',
          email: 'ari.banerjee@gigvora.com',
          role: 'Engineering Manager',
          status: 'active',
          permissions: ['deploy', 'automation'],
          responsibilities: ['Automation delivery', 'Technical QA'],
          capacityHours: 28,
        },
        {
          workspaceId: workspace.id,
          memberName: 'Noor El-Sayed',
          email: 'noor.el-sayed@gigvora.com',
          role: 'QA Automation',
          status: 'pending',
          permissions: ['qa'],
          responsibilities: ['Automated testing', 'Regression suites'],
          capacityHours: 20,
        },
      ],
      { transaction },
    );
  }

  const submissionCount = await ProjectWorkspaceSubmission.count({
    where: { workspaceId: workspace.id },
    transaction,
  });

  if (submissionCount === 0) {
    await ProjectWorkspaceSubmission.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          title: 'Discovery summary pack',
          submissionType: 'brief',
          status: 'approved',
          submittedBy: 'Engagement Lead',
          submittedAt: new Date(now.getTime() - 1000 * 60 * 60 * 48),
          reviewedBy: 'Client sponsor',
          reviewedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
          notes: 'Approved after including extended market sizing.',
          attachmentUrl: `/projects/${project.id}/submissions/discovery-pack.pdf`,
        },
        {
          workspaceId: workspace.id,
          title: 'Automation architecture',
          submissionType: 'technical',
          status: 'in_review',
          submittedBy: 'Technical Program Manager',
          submittedAt: new Date(now.getTime() - 1000 * 60 * 60 * 6),
          notes: 'Waiting for security architecture sign-off.',
          attachmentUrl: `/projects/${project.id}/submissions/automation-architecture.pdf`,
        },
        {
          workspaceId: workspace.id,
          title: 'Enablement guide draft',
          submissionType: 'enablement',
          status: 'submitted',
          submittedBy: 'Client Success',
          submittedAt: new Date(now.getTime() - 1000 * 60 * 30),
          notes: 'Pending review by client operations.',
          attachmentUrl: `/projects/${project.id}/submissions/enablement-guide.docx`,
        },
      ],
      { transaction },
    );
  }

  const inviteCount = await ProjectWorkspaceInvite.count({ where: { workspaceId: workspace.id }, transaction });

  if (inviteCount === 0) {
    await ProjectWorkspaceInvite.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          email: 'client.sponsor@example.com',
          role: 'Client sponsor',
          status: 'pending',
          invitedByName: 'Lena Torres',
          inviteToken: generateInviteToken(),
          expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3),
          message: 'Join the workspace to review approvals and milestone progress.',
        },
        {
          workspaceId: workspace.id,
          email: 'legal.review@example.com',
          role: 'Legal reviewer',
          status: 'accepted',
          invitedByName: 'Program Manager',
          inviteToken: generateInviteToken(),
          expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
          message: 'Provides legal oversight for data processing agreements.',
        },
      ],
      { transaction },
    );
  }

  const hrRecordCount = await ProjectWorkspaceHrRecord.count({ where: { workspaceId: workspace.id }, transaction });

  if (hrRecordCount === 0) {
    await ProjectWorkspaceHrRecord.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          memberName: 'Priya Desai',
          assignmentRole: 'Delivery Lead',
          status: 'active',
          capacityHours: 35,
          allocatedHours: 30,
          costRate: 145,
          currency: 'USD',
          startedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 21),
          notes: 'Primary point of contact for delivery execution.',
        },
        {
          workspaceId: workspace.id,
          memberName: 'Kai Chen',
          assignmentRole: 'Experience Designer',
          status: 'active',
          capacityHours: 30,
          allocatedHours: 24,
          costRate: 120,
          currency: 'USD',
          startedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
          notes: 'Leads design sprints and client reviews.',
        },
        {
          workspaceId: workspace.id,
          memberName: 'Noor El-Sayed',
          assignmentRole: 'QA Automation',
          status: 'pending',
          capacityHours: 20,
          allocatedHours: 8,
          costRate: 95,
          currency: 'USD',
          startedAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2),
          notes: 'Onboarding next week to expand regression coverage.',
        },
      ],
      { transaction },
    );
  }

  const conversationMessages = await ProjectWorkspaceMessage.count({ where: { workspaceId: workspace.id }, transaction });
  if (conversationMessages === 0) {
    const conversations = await ProjectWorkspaceConversation.findAll({
      where: { workspaceId: workspace.id },
      transaction,
    });
    const convoMap = conversations.reduce((map, convo) => {
      map.set(convo.topic, convo);
      return map;
    }, new Map());

    await ProjectWorkspaceMessage.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          conversationId: convoMap.get('Daily delivery standup')?.id ?? conversations[0]?.id,
          authorName: 'Lena Torres',
          authorRole: 'Engagement Lead',
          body: 'Reminder: today’s standup focuses on automation blockers and client demo prep.',
          postedAt: new Date(now.getTime() - 1000 * 60 * 12),
          attachments: [],
        },
        {
          workspaceId: workspace.id,
          conversationId: convoMap.get('Feedback loop')?.id ?? conversations[1]?.id,
          authorName: 'Client sponsor',
          authorRole: 'Client',
          body: 'Uploaded annotated deck with specific experience feedback—please review.',
          postedAt: new Date(now.getTime() - 1000 * 60 * 50),
          attachments: [
            { label: 'Annotated deck', url: `/projects/${project.id}/files/client-feedback.pdf` },
          ],
        },
        {
          workspaceId: workspace.id,
          conversationId: convoMap.get('Billing & procurement')?.id ?? conversations[2]?.id,
          authorName: 'Operations',
          authorRole: 'Operations',
          body: 'Purchase order submitted to finance. Expect confirmation within 24 hours.',
          postedAt: new Date(now.getTime() - 1000 * 60 * 110),
          attachments: [],
        },
      ],
      { transaction },
    );
  }
}

  const payload = await Promise.all(projects.map((project) => buildProjectPayload(project)));
  const summary = buildSummary(payload);

  return {
    projects: payload,
    summary,
  };
}

export async function getProjectWorkspaceSummary(ownerId) {
  const overview = await getProjectWorkspaceOverview(ownerId, { includeDetails: true });
  return overview.summary;
}

export async function createWorkspaceProject(ownerId, payload) {
  if (!ownerId) {
    throw new ValidationError('Owner id is required to create a project workspace.');
  }
  if (!payload?.title) {
    throw new ValidationError('A project title is required.');
  }
  if (!payload?.description) {
    throw new ValidationError('Project description is required.');
  }

  return projectGigManagementSequelize.transaction(async (transaction) => {
    const project = await Project.create(
      {
        ownerId,
        title: payload.title,
        description: payload.description,
        status: payload.status ?? 'planning',
        startDate: payload.startDate ?? null,
        dueDate: payload.dueDate ?? null,
        budgetCurrency: payload.budgetCurrency ?? 'USD',
        budgetAllocated: payload.budgetAllocated ?? 0,
        budgetSpent: 0,
        workspace: {
          status: payload.workspace?.status ?? 'planning',
          progressPercent: payload.workspace?.progressPercent ?? 0,
          riskLevel: payload.workspace?.riskLevel ?? 'low',
          nextMilestone: payload.workspace?.nextMilestone ?? null,
          nextMilestoneDueAt: payload.workspace?.nextMilestoneDueAt ?? null,
          notes: payload.workspace?.notes ?? null,
          metrics: payload.workspace?.metrics ?? null,
        },
      },
      { include: [{ model: ProjectWorkspace, as: 'workspace' }], transaction },
    );

    await ensureDefaultChannel(project.id, { transaction });

    if (Array.isArray(payload.budgetLines) && payload.budgetLines.length) {
      await ProjectBudgetLine.bulkCreate(
        payload.budgetLines.map((line) => ({
          projectId: project.id,
          ...pick(line, [
            'label',
            'category',
            'plannedAmount',
            'actualAmount',
            'currency',
            'status',
            'ownerId',
            'notes',
            'metadata',
          ]),
        })),
        { transaction },
      );
    }

    return sanitizeRecord(project);
  });
}

export async function updateProjectDetails(ownerId, projectId, payload) {
  const project = await ensureProject(ownerId, projectId);
  const updates = pick(payload, [
    'title',
    'description',
    'status',
    'startDate',
    'dueDate',
    'budgetAllocated',
    'budgetCurrency',
    'budgetSpent',
  ]);
  if (Object.keys(updates).length === 0) {
    return sanitizeRecord(project);
  }
  await project.update(updates);
  if (payload.workspace) {
    const workspace = await project.getWorkspace();
    if (workspace) {
      await workspace.update(
        pick(payload.workspace, [
          'status',
          'progressPercent',
          'riskLevel',
          'nextMilestone',
          'nextMilestoneDueAt',
          'notes',
          'metrics',
        ]),
      );
    }
  }
  return sanitizeRecord(await project.reload({ include: [{ model: ProjectWorkspace, as: 'workspace' }] }));
}

export async function createBudgetLine(ownerId, projectId, payload) {
  await ensureProject(ownerId, projectId);
  if (!payload?.label) {
    throw new ValidationError('Budget label is required.');
  }
  if (!payload?.category) {
    throw new ValidationError('Budget category is required.');
  }
  const line = await ProjectBudgetLine.create({
    projectId,
    ...pick(payload, [
      'label',
      'category',
      'plannedAmount',
      'actualAmount',
      'currency',
      'status',
      'ownerId',
      'notes',
      'metadata',
    ]),
  });
  return sanitizeRecord(line);
}

export async function updateBudgetLine(ownerId, projectId, budgetLineId, payload) {
  await ensureProject(ownerId, projectId);
  const line = await ProjectBudgetLine.findOne({ where: { id: budgetLineId, projectId } });
  if (!line) {
    throw new NotFoundError('Budget line not found.');
  }
  await line.update(
    pick(payload, [
      'label',
      'category',
      'plannedAmount',
      'actualAmount',
      'currency',
      'status',
      'ownerId',
      'notes',
      'metadata',
    ]),
  );
  return sanitizeRecord(line);
}

  const [
    brief,
    whiteboards,
    files,
    conversations,
    approvals,
    budgets,
    objects,
    timelineEntries,
    meetings,
    roles,
    submissions,
    invites,
    hrRecords,
    messages,
  ] = await Promise.all([
    ProjectWorkspaceBrief.findOne({ where: { workspaceId: workspace.id } }),
    ProjectWorkspaceWhiteboard.findAll({
      where: { workspaceId: workspace.id },
      order: [
        ['status', 'ASC'],
        ['updatedAt', 'DESC'],
      ],
    }),
    ProjectWorkspaceFile.findAll({
      where: { workspaceId: workspace.id },
      order: [
        ['category', 'ASC'],
        ['updatedAt', 'DESC'],
      ],
    }),
    ProjectWorkspaceConversation.findAll({
      where: { workspaceId: workspace.id },
      order: [
        ['priority', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
    }),
    ProjectWorkspaceApproval.findAll({
      where: { workspaceId: workspace.id },
      order: [
        ['status', 'ASC'],
        ['dueAt', 'ASC'],
      ],
    }),
    ProjectWorkspaceBudget.findAll({
      where: { workspaceId: workspace.id },
      order: [
        ['status', 'ASC'],
        ['category', 'ASC'],
      ],
    }),
    ProjectWorkspaceObject.findAll({
      where: { workspaceId: workspace.id },
      order: [
        ['dueAt', 'ASC'],
        ['name', 'ASC'],
      ],
    }),
    ProjectWorkspaceTimelineEntry.findAll({
      where: { workspaceId: workspace.id },
      include: [{ model: ProjectWorkspaceObject, as: 'relatedObject' }],
      order: [
        ['startAt', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    }),
    ProjectWorkspaceMeeting.findAll({
      where: { workspaceId: workspace.id },
      order: [
        ['startAt', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    }),
    ProjectWorkspaceRole.findAll({
      where: { workspaceId: workspace.id },
      order: [
        ['status', 'ASC'],
        ['memberName', 'ASC'],
      ],
    }),
    ProjectWorkspaceSubmission.findAll({
      where: { workspaceId: workspace.id },
      order: [
        ['status', 'ASC'],
        ['submittedAt', 'DESC'],
      ],
    }),
    ProjectWorkspaceInvite.findAll({
      where: { workspaceId: workspace.id },
      order: [
        ['status', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    }),
    ProjectWorkspaceHrRecord.findAll({
      where: { workspaceId: workspace.id },
      order: [
        ['status', 'ASC'],
        ['memberName', 'ASC'],
      ],
    }),
    ProjectWorkspaceMessage.findAll({
      where: { workspaceId: workspace.id },
      order: [
        ['postedAt', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    }),
  ]);

  const briefPayload = brief ? brief.toPublicObject() : null;
  const whiteboardsPayload = whiteboards.map((board) => board.toPublicObject());
  const filesPayload = files.map((file) => file.toPublicObject());
  const messagesGrouped = messages.reduce((map, message) => {
    const convoId = message.conversationId;
    if (!map.has(convoId)) {
      map.set(convoId, []);
    }
    map.get(convoId).push(message.toPublicObject());
    return map;
  }, new Map());
  const conversationsPayload = conversations.map((conversation) => {
    const payload = conversation.toPublicObject();
    payload.messages = messagesGrouped.get(conversation.id) ?? [];
    return payload;
  });
  const approvalsPayload = approvals.map((approval) => approval.toPublicObject());
  const budgetsPayload = budgets.map((budget) => budget.toPublicObject());
  const objectsPayload = objects.map((object) => {
    const payload = object.toPublicObject();
    return payload;
  });
  const timelinePayload = timelineEntries.map((entry) => {
    const payload = entry.toPublicObject();
    if (entry.relatedObject) {
      payload.relatedObject = entry.relatedObject.toPublicObject?.() ?? entry.relatedObject;
    }
    return payload;
  });
  const meetingsPayload = meetings.map((meeting) => meeting.toPublicObject());
  const rolesPayload = roles.map((role) => role.toPublicObject());
  const submissionsPayload = submissions.map((submission) => submission.toPublicObject());
  const invitesPayload = invites.map((invite) => invite.toPublicObject());
  const hrRecordsPayload = hrRecords.map((record) => record.toPublicObject());

  return {
    project: project.toPublicObject(),
    workspace: workspace.toPublicObject(),
    brief: briefPayload,
    whiteboards: whiteboardsPayload,
    files: filesPayload,
    conversations: conversationsPayload,
    approvals: approvalsPayload,
    budgets: budgetsPayload,
    objects: objectsPayload,
    timeline: timelinePayload,
    meetings: meetingsPayload,
    roles: rolesPayload,
    submissions: submissionsPayload,
    invites: invitesPayload,
    hrRecords: hrRecordsPayload,
    metrics: computeWorkspaceMetrics(workspace, {
      approvals: approvalsPayload,
      files: filesPayload,
      conversations: conversationsPayload,
      whiteboards: whiteboardsPayload,
      budgets: budgetsPayload,
      timelineEntries: timelinePayload,
      hrRecords: hrRecordsPayload,
    }),
  };
export async function deleteBudgetLine(ownerId, projectId, budgetLineId) {
  await ensureProject(ownerId, projectId);
  await ProjectBudgetLine.destroy({ where: { id: budgetLineId, projectId } });
}

export async function createDeliverable(ownerId, projectId, payload) {
  await ensureProject(ownerId, projectId);
  if (!payload?.title) {
    throw new ValidationError('Deliverable title is required.');
  }
  const deliverable = await ProjectDeliverable.create({
    projectId,
    ...pick(payload, ['title', 'description', 'status', 'dueDate', 'submissionUrl', 'metadata']),
  });
  return sanitizeRecord(deliverable);
}

export async function updateDeliverable(ownerId, projectId, deliverableId, payload) {
  await ensureProject(ownerId, projectId);
  const deliverable = await ProjectDeliverable.findOne({ where: { id: deliverableId, projectId } });
  if (!deliverable) {
    throw new NotFoundError('Deliverable not found.');
  }
  await deliverable.update(pick(payload, ['title', 'description', 'status', 'dueDate', 'submissionUrl', 'metadata']));
  return sanitizeRecord(deliverable);
}

export async function deleteDeliverable(ownerId, projectId, deliverableId) {
  await ensureProject(ownerId, projectId);
  await ProjectDeliverable.destroy({ where: { id: deliverableId, projectId } });
}

export async function createTask(ownerId, projectId, payload) {
  await ensureProject(ownerId, projectId);
  if (!payload?.title) {
    throw new ValidationError('Task title is required.');
  }
  const task = await ProjectTask.create({
    projectId,
    ...pick(payload, [
      'title',
      'description',
      'status',
      'priority',
      'startDate',
      'dueDate',
      'estimatedHours',
      'completedAt',
      'metadata',
    ]),
  });
  return sanitizeRecord(task);
}

export async function updateTask(ownerId, projectId, taskId, payload) {
  const { task } = await ensureTask(ownerId, projectId, taskId);
  await task.update(
    pick(payload, [
      'title',
      'description',
      'status',
      'priority',
      'startDate',
      'dueDate',
      'estimatedHours',
      'completedAt',
      'metadata',
    ]),
  );
  return sanitizeRecord(task);
}

export async function deleteTask(ownerId, projectId, taskId) {
  await ensureTask(ownerId, projectId, taskId);
  await ProjectTask.destroy({ where: { id: taskId, projectId } });
}

export async function assignTask(ownerId, projectId, taskId, payload) {
  const { task } = await ensureTask(ownerId, projectId, taskId);
  if (!payload?.assigneeName) {
    throw new ValidationError('Assignee name is required.');
  }
  const assignment = await ProjectTaskAssignment.create({
    taskId: task.id,
    ...pick(payload, ['assigneeName', 'assigneeEmail', 'assigneeRole', 'allocationHours', 'status', 'metadata']),
  });
  return sanitizeRecord(assignment);
}

export async function updateTaskAssignment(ownerId, projectId, taskId, assignmentId, payload) {
  await ensureTask(ownerId, projectId, taskId);
  const assignment = await ProjectTaskAssignment.findOne({ where: { id: assignmentId, taskId } });
  if (!assignment) {
    throw new NotFoundError('Task assignment not found.');
  }
  await assignment.update(
    pick(payload, ['assigneeName', 'assigneeEmail', 'assigneeRole', 'allocationHours', 'status', 'metadata']),
  );
  return sanitizeRecord(assignment);
}

export async function removeTaskAssignment(ownerId, projectId, taskId, assignmentId) {
  await ensureTask(ownerId, projectId, taskId);
  await ProjectTaskAssignment.destroy({ where: { id: assignmentId, taskId } });
}

export async function createTaskDependency(ownerId, projectId, taskId, payload) {
  const { task } = await ensureTask(ownerId, projectId, taskId);
  const dependsOnTaskId = Number(payload?.dependsOnTaskId);
  if (!dependsOnTaskId) {
    throw new ValidationError('dependsOnTaskId is required.');
  }
  if (dependsOnTaskId === task.id) {
    throw new ValidationError('A task cannot depend on itself.');
  }
  const targetTask = await ProjectTask.findOne({ where: { id: dependsOnTaskId, projectId } });
  if (!targetTask) {
    throw new ValidationError('Dependency task must belong to the same project.');
  }
  const dependency = await ProjectTaskDependency.create({
    taskId: task.id,
    dependsOnTaskId,
    lagDays: payload?.lagDays ?? 0,
  });
  return sanitizeRecord(dependency);
}

export async function removeTaskDependency(ownerId, projectId, taskId, dependencyId) {
  await ensureTask(ownerId, projectId, taskId);
  await ProjectTaskDependency.destroy({ where: { id: dependencyId, taskId } });
}

export async function postChatMessage(ownerId, projectId, payload) {
  const channelId = payload?.channelId;
  if (!channelId) {
    throw new ValidationError('Channel id is required to post a message.');
  }
  const channel = await ensureChannel(ownerId, projectId, channelId);
  if (!payload?.authorName || !payload.body) {
    throw new ValidationError('Author name and body are required.');
  }
  const message = await ProjectChatMessage.create({
    channelId: channel.id,
    ...pick(payload, ['authorName', 'authorRole', 'body', 'pinned', 'metadata']),
  });
  return sanitizeRecord(message);
}

export async function updateChatMessage(ownerId, projectId, messageId, payload) {
  const message = await ProjectChatMessage.findByPk(messageId, { include: [{ model: ProjectChatChannel, as: 'channel' }] });
  if (!message) {
    throw new NotFoundError('Message not found.');
  }
  if (message.channel.projectId !== Number(projectId)) {
    throw new AuthorizationError('You can only edit messages for this project.');
  }
  await ensureProject(ownerId, projectId);
  await message.update(pick(payload, ['body', 'pinned', 'metadata']));
  return sanitizeRecord(message);
}

export async function deleteChatMessage(ownerId, projectId, messageId) {
  const message = await ProjectChatMessage.findByPk(messageId, { include: [{ model: ProjectChatChannel, as: 'channel' }] });
  if (!message) {
    return;
  }
  if (message.channel.projectId !== Number(projectId)) {
    throw new AuthorizationError('You can only remove messages for this project.');
  }
  await ensureProject(ownerId, projectId);
  await message.destroy();
}

export async function createTimelineEntry(ownerId, projectId, payload) {
  await ensureProject(ownerId, projectId);
  if (!payload?.title) {
    throw new ValidationError('Timeline title is required.');
  }
  const entry = await ProjectTimelineEntry.create({
    projectId,
    ...pick(payload, ['title', 'entryType', 'occurredAt', 'notes', 'workspaceId', 'metadata']),
  });
  return sanitizeRecord(entry);
}

export async function updateTimelineEntry(ownerId, projectId, entryId, payload) {
  await ensureProject(ownerId, projectId);
  const entry = await ProjectTimelineEntry.findOne({ where: { id: entryId, projectId } });
  if (!entry) {
    throw new NotFoundError('Timeline entry not found.');
  }
  await entry.update(pick(payload, ['title', 'entryType', 'occurredAt', 'notes', 'workspaceId', 'metadata']));
  return sanitizeRecord(entry);
}

export async function deleteTimelineEntry(ownerId, projectId, entryId) {
  await ensureProject(ownerId, projectId);
  await ProjectTimelineEntry.destroy({ where: { id: entryId, projectId } });
}

export async function scheduleMeeting(ownerId, projectId, payload) {
  await ensureProject(ownerId, projectId);
  if (!payload?.title) {
    throw new ValidationError('Meeting title is required.');
  }
  if (!payload?.scheduledAt) {
    throw new ValidationError('Meeting scheduled time is required.');
  }
  return projectGigManagementSequelize.transaction(async (transaction) => {
    const meeting = await ProjectMeeting.create(
      {
        projectId,
        ...pick(payload, [
          'title',
          'agenda',
          'scheduledAt',
          'durationMinutes',
          'location',
          'meetingLink',
          'status',
          'notes',
        ]),
      },
      { transaction },
    );

    if (Array.isArray(payload.attendees) && payload.attendees.length) {
      await ProjectMeetingAttendee.bulkCreate(
        payload.attendees.map((attendee) => ({
          meetingId: meeting.id,
          ...pick(attendee, ['name', 'email', 'role', 'responseStatus']),
        })),
        { transaction },
      );
    }

    return sanitizeRecord(await meeting.reload({ include: [{ model: ProjectMeetingAttendee, as: 'attendees' }] }));
  });
}

export async function updateMeeting(ownerId, projectId, meetingId, payload) {
  await ensureProject(ownerId, projectId);
  return projectGigManagementSequelize.transaction(async (transaction) => {
    const meeting = await ProjectMeeting.findOne({
      where: { id: meetingId, projectId },
      include: [{ model: ProjectMeetingAttendee, as: 'attendees' }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!meeting) {
      throw new NotFoundError('Meeting not found.');
    }

    await meeting.update(
      pick(payload, ['title', 'agenda', 'scheduledAt', 'durationMinutes', 'location', 'meetingLink', 'status', 'notes']),
      { transaction },
    );

    if (Array.isArray(payload.attendees)) {
      await ProjectMeetingAttendee.destroy({ where: { meetingId }, transaction });
      if (payload.attendees.length) {
        await ProjectMeetingAttendee.bulkCreate(
          payload.attendees.map((attendee) => ({
            meetingId,
            ...pick(attendee, ['name', 'email', 'role', 'responseStatus']),
          })),
          { transaction },
        );
      }
    }

    return sanitizeRecord(await meeting.reload({ include: [{ model: ProjectMeetingAttendee, as: 'attendees' }] }));
  });
}

export async function deleteMeeting(ownerId, projectId, meetingId) {
  await ensureProject(ownerId, projectId);
  await ProjectMeeting.destroy({ where: { id: meetingId, projectId } });
}

export async function createCalendarEvent(ownerId, projectId, payload) {
  await ensureProject(ownerId, projectId);
  if (!payload?.title) {
    throw new ValidationError('Event title is required.');
  }
  if (!payload?.startAt) {
    throw new ValidationError('Event start date is required.');
  }
  const event = await ProjectCalendarEvent.create({
    projectId,
    ...pick(payload, ['title', 'category', 'startAt', 'endAt', 'allDay', 'location', 'metadata']),
  });
  return sanitizeRecord(event);
}

export async function updateCalendarEvent(ownerId, projectId, eventId, payload) {
  await ensureProject(ownerId, projectId);
  const event = await ProjectCalendarEvent.findOne({ where: { id: eventId, projectId } });
  if (!event) {
    throw new NotFoundError('Calendar event not found.');
  }
  await event.update(pick(payload, ['title', 'category', 'startAt', 'endAt', 'allDay', 'location', 'metadata']));
  return sanitizeRecord(event);
}

export async function deleteCalendarEvent(ownerId, projectId, eventId) {
  await ensureProject(ownerId, projectId);
  await ProjectCalendarEvent.destroy({ where: { id: eventId, projectId } });
}

export async function createRoleDefinition(ownerId, projectId, payload) {
  await ensureProject(ownerId, projectId);
  if (!payload?.name) {
    throw new ValidationError('Role name is required.');
  }
  const role = await ProjectRoleDefinition.create({
    projectId,
    ...pick(payload, ['name', 'description', 'seatLimit', 'permissions']),
  });
  return sanitizeRecord(role);
}

export async function updateRoleDefinition(ownerId, projectId, roleId, payload) {
  await ensureProject(ownerId, projectId);
  const role = await ProjectRoleDefinition.findOne({ where: { id: roleId, projectId } });
  if (!role) {
    throw new NotFoundError('Role not found.');
  }
  await role.update(pick(payload, ['name', 'description', 'seatLimit', 'permissions']));
  return sanitizeRecord(role);
}

export async function deleteRoleDefinition(ownerId, projectId, roleId) {
  await ensureProject(ownerId, projectId);
  await ProjectRoleDefinition.destroy({ where: { id: roleId, projectId } });
}

export async function assignRole(ownerId, projectId, roleId, payload) {
  await ensureProject(ownerId, projectId);
  const role = await ProjectRoleDefinition.findOne({ where: { id: roleId, projectId } });
  if (!role) {
    throw new NotFoundError('Role not found.');
  }
  if (!payload?.collaboratorName) {
    throw new ValidationError('Collaborator name is required.');
  }

  let collaboratorId = payload.collaboratorId ?? null;
  if (!collaboratorId && payload.collaboratorEmail) {
    const collaborator = await ProjectCollaborator.findOne({
      where: { projectId, email: payload.collaboratorEmail },
    });
    collaboratorId = collaborator?.id ?? null;
  }

  const assignment = await ProjectRoleAssignment.create({
    roleId,
    collaboratorId,
    ...pick(payload, ['collaboratorName', 'collaboratorEmail', 'status']),
  });
  return sanitizeRecord(assignment);
}

export async function updateRoleAssignment(ownerId, projectId, roleId, assignmentId, payload) {
  await ensureProject(ownerId, projectId);
  const role = await ProjectRoleDefinition.findOne({ where: { id: roleId, projectId } });
  if (!role) {
    throw new NotFoundError('Role not found.');
  }
  const assignment = await ProjectRoleAssignment.findOne({ where: { id: assignmentId, roleId } });
  if (!assignment) {
    throw new NotFoundError('Role assignment not found.');
  }
  await assignment.update(pick(payload, ['collaboratorName', 'collaboratorEmail', 'status', 'collaboratorId']));
  return sanitizeRecord(assignment);
}

export async function removeRoleAssignment(ownerId, projectId, roleId, assignmentId) {
  await ensureProject(ownerId, projectId);
  const role = await ProjectRoleDefinition.findOne({ where: { id: roleId, projectId } });
  if (!role) {
    throw new NotFoundError('Role not found.');
  }
  await ProjectRoleAssignment.destroy({ where: { id: assignmentId, roleId } });
}

export async function createSubmission(ownerId, projectId, payload) {
  await ensureProject(ownerId, projectId);
  if (!payload?.title) {
    throw new ValidationError('Submission title is required.');
  }
  const submission = await ProjectSubmission.create({
    projectId,
    ...pick(payload, ['title', 'description', 'status', 'submittedAt', 'submissionUrl', 'notes']),
  });
  return sanitizeRecord(submission);
}

export async function updateSubmission(ownerId, projectId, submissionId, payload) {
  await ensureProject(ownerId, projectId);
  const submission = await ProjectSubmission.findOne({ where: { id: submissionId, projectId } });
  if (!submission) {
    throw new NotFoundError('Submission not found.');
  }
  await submission.update(pick(payload, ['title', 'description', 'status', 'submittedAt', 'submissionUrl', 'notes']));
  return sanitizeRecord(submission);
}

export async function deleteSubmission(ownerId, projectId, submissionId) {
  await ensureProject(ownerId, projectId);
  await ProjectSubmission.destroy({ where: { id: submissionId, projectId } });
}

export async function createFile(ownerId, projectId, payload) {
  await ensureProject(ownerId, projectId);
  if (!payload?.label || !payload?.storageUrl) {
    throw new ValidationError('File label and storage URL are required.');
  }
  const file = await ProjectFile.create({
    projectId,
    ...pick(payload, ['label', 'storageUrl', 'sizeBytes', 'fileType', 'uploadedBy', 'visibility', 'metadata']),
  });
  return sanitizeRecord(file);
}

export async function updateFile(ownerId, projectId, fileId, payload) {
  await ensureProject(ownerId, projectId);
  const file = await ProjectFile.findOne({ where: { id: fileId, projectId } });
  if (!file) {
    throw new NotFoundError('File not found.');
  }
  await file.update(pick(payload, ['label', 'storageUrl', 'sizeBytes', 'fileType', 'uploadedBy', 'visibility', 'metadata']));
  return sanitizeRecord(file);
}

export async function deleteFile(ownerId, projectId, fileId) {
  await ensureProject(ownerId, projectId);
  await ProjectFile.destroy({ where: { id: fileId, projectId } });
}

export async function createInvitation(ownerId, projectId, payload) {
  await ensureProject(ownerId, projectId);
  if (!payload?.email) {
    throw new ValidationError('Invite email is required.');
  }
  if (!payload?.role) {
    throw new ValidationError('Invite role is required.');
  }
  const invitation = await ProjectInvitation.create({
    projectId,
    ...pick(payload, ['email', 'role', 'status', 'token', 'invitedBy', 'expiresAt', 'metadata']),
  });
  return sanitizeRecord(invitation);
}

export async function updateInvitation(ownerId, projectId, invitationId, payload) {
  await ensureProject(ownerId, projectId);
  const invitation = await ProjectInvitation.findOne({ where: { id: invitationId, projectId } });
  if (!invitation) {
    throw new NotFoundError('Invitation not found.');
  }
  await invitation.update(pick(payload, ['email', 'role', 'status', 'token', 'invitedBy', 'expiresAt', 'metadata']));
  return sanitizeRecord(invitation);
}

export async function deleteInvitation(ownerId, projectId, invitationId) {
  await ensureProject(ownerId, projectId);
  await ProjectInvitation.destroy({ where: { id: invitationId, projectId } });
}

export async function createHrRecord(ownerId, projectId, payload) {
  await ensureProject(ownerId, projectId);
  if (!payload?.fullName) {
    throw new ValidationError('Full name is required.');
  }
  if (!payload?.position) {
    throw new ValidationError('Position is required.');
  }
  const record = await ProjectHrRecord.create({
    projectId,
    ...pick(payload, [
      'fullName',
      'position',
      'status',
      'startDate',
      'endDate',
      'compensation',
      'allocationPercent',
      'metadata',
    ]),
  });
  return sanitizeRecord(record);
}

export async function updateHrRecord(ownerId, projectId, hrRecordId, payload) {
  await ensureProject(ownerId, projectId);
  const record = await ProjectHrRecord.findOne({ where: { id: hrRecordId, projectId } });
  if (!record) {
    throw new NotFoundError('HR record not found.');
  }
  await record.update(
    pick(payload, [
      'fullName',
      'position',
      'status',
      'startDate',
      'endDate',
      'compensation',
      'allocationPercent',
      'metadata',
    ]),
  );
  return sanitizeRecord(record);
}

export async function deleteHrRecord(ownerId, projectId, hrRecordId) {
  await ensureProject(ownerId, projectId);
  await ProjectHrRecord.destroy({ where: { id: hrRecordId, projectId } });
}

export async function upsertWorkspaceBudget(projectId, budgetId, payload = {}, { actorId } = {}) {
  const prepared = {};

  if (payload.category !== undefined) {
    const category = typeof payload.category === 'string' ? payload.category.trim() : '';
    if (!category) {
      throw new ValidationError('category cannot be empty.');
    }
    prepared.category = category;
  }

  if (payload.status !== undefined) {
    if (!WORKSPACE_BUDGET_STATUSES.includes(payload.status)) {
      throw new ValidationError('Invalid budget status.');
    }
    prepared.status = payload.status;
  }

  if (payload.ownerName !== undefined) {
    prepared.ownerName = payload.ownerName ? String(payload.ownerName).trim() : null;
  }

  if (payload.notes !== undefined) {
    prepared.notes = payload.notes ? String(payload.notes).trim() : null;
  }

  if (payload.currency !== undefined) {
    prepared.currency = normalizeCurrencyCode(payload.currency);
  }

  if (payload.allocatedAmount !== undefined) {
    prepared.allocatedAmount = normalizeMoneyValue(payload.allocatedAmount, {
      fieldName: 'allocatedAmount',
      allowNull: false,
    });
  }

  if (payload.actualAmount !== undefined) {
    prepared.actualAmount = normalizeMoneyValue(payload.actualAmount, {
      fieldName: 'actualAmount',
      allowNull: false,
    });
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    if (budgetId) {
      const budget = await ProjectWorkspaceBudget.findOne({
        where: { id: budgetId, workspaceId: workspace.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!budget) {
        throw new NotFoundError('Budget line not found.');
      }

      if (Object.keys(prepared).length === 0) {
        return budget;
      }

      await budget.update({ ...prepared, updatedById: actorId ?? null }, { transaction });
      return budget;
    }

    const category = prepared.category ?? (typeof payload.category === 'string' ? payload.category.trim() : '');
    if (!category) {
      throw new ValidationError('category is required.');
    }

    await ProjectWorkspaceBudget.create(
      {
        workspaceId: workspace.id,
        category,
        allocatedAmount:
          prepared.allocatedAmount ??
          normalizeMoneyValue(payload.allocatedAmount ?? 0, { fieldName: 'allocatedAmount', allowNull: false }),
        actualAmount:
          prepared.actualAmount ??
          normalizeMoneyValue(payload.actualAmount ?? 0, { fieldName: 'actualAmount', allowNull: false }),
        currency: prepared.currency ?? normalizeCurrencyCode(payload.currency ?? 'USD'),
        status: prepared.status ?? (WORKSPACE_BUDGET_STATUSES.includes(payload.status) ? payload.status : 'draft'),
        ownerName: prepared.ownerName ?? (payload.ownerName ? String(payload.ownerName).trim() : null),
        notes: prepared.notes ?? (payload.notes ? String(payload.notes).trim() : null),
        updatedById: actorId ?? null,
      },
      { transaction },
    );

    return null;
  });

  return getWorkspaceDashboard(projectId);
}

export async function removeWorkspaceBudget(projectId, budgetId, { actorId } = {}) {
  if (!budgetId) {
    throw new ValidationError('budgetId is required.');
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    const budget = await ProjectWorkspaceBudget.findOne({
      where: { id: budgetId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!budget) {
      throw new NotFoundError('Budget line not found.');
    }

    await budget.destroy({ transaction });
  });

  return getWorkspaceDashboard(projectId);
}

export async function upsertWorkspaceObject(projectId, objectId, payload = {}, { actorId } = {}) {
  const prepared = {};

  if (payload.name !== undefined) {
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    if (!name) {
      throw new ValidationError('name cannot be empty.');
    }
    prepared.name = name;
  }

  if (payload.objectType !== undefined) {
    if (!WORKSPACE_OBJECT_TYPES.includes(payload.objectType)) {
      throw new ValidationError('Invalid workspace object type.');
    }
    prepared.objectType = payload.objectType;
  }

  if (payload.status !== undefined) {
    if (!WORKSPACE_OBJECT_STATUSES.includes(payload.status)) {
      throw new ValidationError('Invalid workspace object status.');
    }
    prepared.status = payload.status;
  }

  if (payload.ownerName !== undefined) {
    prepared.ownerName = payload.ownerName ? String(payload.ownerName).trim() : null;
  }

  if (payload.description !== undefined) {
    prepared.description = payload.description ? String(payload.description).trim() : null;
  }

  const dueAt = parseDateValue(payload.dueAt ?? payload.dueDate ?? undefined, 'dueAt');
  if (dueAt !== undefined) {
    prepared.dueAt = dueAt;
  }

  const tags = normalizeStringList(payload.tags);
  if (tags !== undefined) {
    prepared.tags = tags;
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    if (objectId) {
      const object = await ProjectWorkspaceObject.findOne({
        where: { id: objectId, workspaceId: workspace.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!object) {
        throw new NotFoundError('Workspace object not found.');
      }

      if (Object.keys(prepared).length === 0) {
        return object;
      }

      await object.update(prepared, { transaction });
      return object;
    }

    const name = prepared.name ?? (typeof payload.name === 'string' ? payload.name.trim() : '');
    if (!name) {
      throw new ValidationError('name is required.');
    }

    const objectType = prepared.objectType ?? (WORKSPACE_OBJECT_TYPES.includes(payload.objectType) ? payload.objectType : 'deliverable');
    const status = prepared.status ?? (WORKSPACE_OBJECT_STATUSES.includes(payload.status) ? payload.status : 'draft');

    await ProjectWorkspaceObject.create(
      {
        workspaceId: workspace.id,
        name,
        objectType,
        status,
        ownerName: prepared.ownerName ?? (payload.ownerName ? String(payload.ownerName).trim() : null),
        description: prepared.description ?? (payload.description ? String(payload.description).trim() : null),
        dueAt: prepared.dueAt ?? parseDateValue(payload.dueAt ?? payload.dueDate ?? null, 'dueAt'),
        tags: prepared.tags ?? normalizeStringList(payload.tags),
        metadata: payload.metadata ?? null,
      },
      { transaction },
    );

    return null;
  });

  return getWorkspaceDashboard(projectId);
}

export async function removeWorkspaceObject(projectId, objectId, { actorId } = {}) {
  if (!objectId) {
    throw new ValidationError('objectId is required.');
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    const object = await ProjectWorkspaceObject.findOne({
      where: { id: objectId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!object) {
      throw new NotFoundError('Workspace object not found.');
    }

    await object.destroy({ transaction });
  });

  return getWorkspaceDashboard(projectId);
}

export async function upsertWorkspaceTimelineEntry(projectId, entryId, payload = {}, { actorId } = {}) {
  const prepared = {};

  if (payload.title !== undefined) {
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    if (!title) {
      throw new ValidationError('title cannot be empty.');
    }
    prepared.title = title;
  }

  if (payload.entryType !== undefined) {
    if (!WORKSPACE_TIMELINE_ENTRY_TYPES.includes(payload.entryType)) {
      throw new ValidationError('Invalid timeline entry type.');
    }
    prepared.entryType = payload.entryType;
  }

  if (payload.status !== undefined) {
    if (!PROJECT_MILESTONE_STATUSES.includes(payload.status)) {
      throw new ValidationError('Invalid timeline status.');
    }
    prepared.status = payload.status;
  }

  if (payload.ownerName !== undefined) {
    prepared.ownerName = payload.ownerName ? String(payload.ownerName).trim() : null;
  }

  if (payload.lane !== undefined) {
    prepared.lane = payload.lane ? String(payload.lane).trim() : null;
  }

  const startAt = parseDateValue(payload.startAt ?? payload.startDate ?? undefined, 'startAt');
  if (startAt !== undefined) {
    prepared.startAt = startAt;
  }

  const endAt = parseDateValue(payload.endAt ?? payload.endDate ?? undefined, 'endAt');
  if (endAt !== undefined) {
    prepared.endAt = endAt;
  }

  const progressPercent = normalizeDecimalValue(payload.progressPercent, {
    fieldName: 'progressPercent',
    allowNull: true,
  });
  if (progressPercent !== undefined) {
    prepared.progressPercent = progressPercent;
  }

  if (payload.metadata !== undefined) {
    prepared.metadata = payload.metadata ?? null;
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    let relatedObjectId = payload.relatedObjectId ?? payload.objectId ?? prepared.relatedObjectId;
    if (relatedObjectId != null) {
      const relatedObject = await ProjectWorkspaceObject.findOne({
        where: { id: relatedObjectId, workspaceId: workspace.id },
        transaction,
      });
      if (!relatedObject) {
        throw new ValidationError('relatedObjectId does not reference a workspace object.');
      }
      prepared.relatedObjectId = relatedObject.id;
    }

    if (entryId) {
      const entry = await ProjectWorkspaceTimelineEntry.findOne({
        where: { id: entryId, workspaceId: workspace.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!entry) {
        throw new NotFoundError('Timeline entry not found.');
      }

      if (Object.keys(prepared).length === 0) {
        return entry;
      }

      await entry.update(prepared, { transaction });
      return entry;
    }

    const title = prepared.title ?? (typeof payload.title === 'string' ? payload.title.trim() : '');
    if (!title) {
      throw new ValidationError('title is required.');
    }

    await ProjectWorkspaceTimelineEntry.create(
      {
        workspaceId: workspace.id,
        title,
        entryType:
          prepared.entryType ??
          (WORKSPACE_TIMELINE_ENTRY_TYPES.includes(payload.entryType) ? payload.entryType : 'milestone'),
        status:
          prepared.status ??
          (PROJECT_MILESTONE_STATUSES.includes(payload.status) ? payload.status : PROJECT_MILESTONE_STATUSES[0]),
        ownerName: prepared.ownerName ?? (payload.ownerName ? String(payload.ownerName).trim() : null),
        lane: prepared.lane ?? (payload.lane ? String(payload.lane).trim() : null),
        startAt: prepared.startAt ?? parseDateValue(payload.startAt ?? payload.startDate ?? new Date(), 'startAt'),
        endAt: prepared.endAt ?? parseDateValue(payload.endAt ?? payload.endDate ?? null, 'endAt'),
        progressPercent: prepared.progressPercent ?? normalizeDecimalValue(payload.progressPercent, {
          fieldName: 'progressPercent',
          allowNull: true,
        }),
        relatedObjectId: prepared.relatedObjectId ?? null,
        metadata: prepared.metadata ?? payload.metadata ?? null,
      },
      { transaction },
    );

    return null;
  });

  return getWorkspaceDashboard(projectId);
}

export async function removeWorkspaceTimelineEntry(projectId, entryId, { actorId } = {}) {
  if (!entryId) {
    throw new ValidationError('entryId is required.');
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    const entry = await ProjectWorkspaceTimelineEntry.findOne({
      where: { id: entryId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!entry) {
      throw new NotFoundError('Timeline entry not found.');
    }

    await entry.destroy({ transaction });
  });

  return getWorkspaceDashboard(projectId);
}

export async function upsertWorkspaceMeeting(projectId, meetingId, payload = {}, { actorId } = {}) {
  const prepared = {};

  if (payload.title !== undefined) {
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    if (!title) {
      throw new ValidationError('title cannot be empty.');
    }
    prepared.title = title;
  }

  if (payload.status !== undefined) {
    if (!WORKSPACE_MEETING_STATUSES.includes(payload.status)) {
      throw new ValidationError('Invalid meeting status.');
    }
    prepared.status = payload.status;
  }

  if (payload.agenda !== undefined) {
    prepared.agenda = payload.agenda ? String(payload.agenda).trim() : null;
  }

  if (payload.location !== undefined) {
    prepared.location = payload.location ? String(payload.location).trim() : null;
  }

  if (payload.meetingUrl !== undefined) {
    prepared.meetingUrl = payload.meetingUrl ? String(payload.meetingUrl).trim() : null;
  }

  if (payload.hostName !== undefined) {
    prepared.hostName = payload.hostName ? String(payload.hostName).trim() : null;
  }

  const startAt = parseDateValue(payload.startAt ?? payload.startDate ?? undefined, 'startAt');
  if (startAt !== undefined) {
    prepared.startAt = startAt;
  }

  const endAt = parseDateValue(payload.endAt ?? payload.endDate ?? undefined, 'endAt');
  if (endAt !== undefined) {
    prepared.endAt = endAt;
  }

  const attendees = normalizeStringList(payload.attendees ?? payload.participants);
  if (attendees !== undefined) {
    prepared.attendees = attendees;
  }

  if (payload.notes !== undefined) {
    prepared.notes = payload.notes ? String(payload.notes).trim() : null;
  }

  if (payload.recordingUrl !== undefined) {
    prepared.recordingUrl = payload.recordingUrl ? String(payload.recordingUrl).trim() : null;
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    if (meetingId) {
      const meeting = await ProjectWorkspaceMeeting.findOne({
        where: { id: meetingId, workspaceId: workspace.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!meeting) {
        throw new NotFoundError('Meeting not found.');
      }

      if (Object.keys(prepared).length === 0) {
        return meeting;
      }

      await meeting.update(prepared, { transaction });
      return meeting;
    }

    const title = prepared.title ?? (typeof payload.title === 'string' ? payload.title.trim() : '');
    if (!title) {
      throw new ValidationError('title is required.');
    }

    await ProjectWorkspaceMeeting.create(
      {
        workspaceId: workspace.id,
        title,
        agenda: prepared.agenda ?? (payload.agenda ? String(payload.agenda).trim() : null),
        startAt:
          prepared.startAt ?? parseDateValue(payload.startAt ?? payload.startDate ?? new Date(), 'startAt'),
        endAt: prepared.endAt ?? parseDateValue(payload.endAt ?? payload.endDate ?? null, 'endAt'),
        location: prepared.location ?? (payload.location ? String(payload.location).trim() : null),
        meetingUrl: prepared.meetingUrl ?? (payload.meetingUrl ? String(payload.meetingUrl).trim() : null),
        hostName: prepared.hostName ?? (payload.hostName ? String(payload.hostName).trim() : null),
        status: prepared.status ?? (WORKSPACE_MEETING_STATUSES.includes(payload.status) ? payload.status : 'scheduled'),
        attendees: prepared.attendees ?? normalizeStringList(payload.attendees ?? payload.participants),
        notes: prepared.notes ?? (payload.notes ? String(payload.notes).trim() : null),
        recordingUrl: prepared.recordingUrl ?? (payload.recordingUrl ? String(payload.recordingUrl).trim() : null),
      },
      { transaction },
    );

    return null;
  });

  return getWorkspaceDashboard(projectId);
}

export async function removeWorkspaceMeeting(projectId, meetingId, { actorId } = {}) {
  if (!meetingId) {
    throw new ValidationError('meetingId is required.');
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    const meeting = await ProjectWorkspaceMeeting.findOne({
      where: { id: meetingId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!meeting) {
      throw new NotFoundError('Meeting not found.');
    }

    await meeting.destroy({ transaction });
  });

  return getWorkspaceDashboard(projectId);
}

export async function upsertWorkspaceRole(projectId, roleId, payload = {}, { actorId } = {}) {
  const prepared = {};

  if (payload.memberName !== undefined) {
    const memberName = typeof payload.memberName === 'string' ? payload.memberName.trim() : '';
    if (!memberName) {
      throw new ValidationError('memberName cannot be empty.');
    }
    prepared.memberName = memberName;
  }

  if (payload.role !== undefined) {
    const role = typeof payload.role === 'string' ? payload.role.trim() : '';
    if (!role) {
      throw new ValidationError('role cannot be empty.');
    }
    prepared.role = role;
  }

  if (payload.status !== undefined) {
    if (!WORKSPACE_ROLE_STATUSES.includes(payload.status)) {
      throw new ValidationError('Invalid role status.');
    }
    prepared.status = payload.status;
  }

  if (payload.email !== undefined) {
    prepared.email = payload.email ? String(payload.email).trim() : null;
  }

  const permissions = normalizeStringList(payload.permissions);
  if (permissions !== undefined) {
    prepared.permissions = permissions;
  }

  const responsibilities = normalizeStringList(payload.responsibilities);
  if (responsibilities !== undefined) {
    prepared.responsibilities = responsibilities;
  }

  const capacityHours = normalizeDecimalValue(payload.capacityHours, {
    fieldName: 'capacityHours',
    allowNull: true,
  });
  if (capacityHours !== undefined) {
    prepared.capacityHours = capacityHours;
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    if (roleId) {
      const role = await ProjectWorkspaceRole.findOne({
        where: { id: roleId, workspaceId: workspace.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!role) {
        throw new NotFoundError('Workspace role not found.');
      }

      if (Object.keys(prepared).length === 0) {
        return role;
      }

      await role.update(prepared, { transaction });
      return role;
    }

    const memberName = prepared.memberName ?? (typeof payload.memberName === 'string' ? payload.memberName.trim() : '');
    if (!memberName) {
      throw new ValidationError('memberName is required.');
    }

    const roleName = prepared.role ?? (typeof payload.role === 'string' ? payload.role.trim() : '');
    if (!roleName) {
      throw new ValidationError('role is required.');
    }

    await ProjectWorkspaceRole.create(
      {
        workspaceId: workspace.id,
        memberName,
        email: prepared.email ?? (payload.email ? String(payload.email).trim() : null),
        role: roleName,
        status: prepared.status ?? (WORKSPACE_ROLE_STATUSES.includes(payload.status) ? payload.status : 'active'),
        permissions: prepared.permissions ?? normalizeStringList(payload.permissions),
        responsibilities: prepared.responsibilities ?? normalizeStringList(payload.responsibilities),
        capacityHours:
          prepared.capacityHours ?? normalizeDecimalValue(payload.capacityHours, { fieldName: 'capacityHours', allowNull: true }),
      },
      { transaction },
    );

    return null;
  });

  return getWorkspaceDashboard(projectId);
}

export async function removeWorkspaceRole(projectId, roleId, { actorId } = {}) {
  if (!roleId) {
    throw new ValidationError('roleId is required.');
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    const role = await ProjectWorkspaceRole.findOne({
      where: { id: roleId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!role) {
      throw new NotFoundError('Workspace role not found.');
    }

    await role.destroy({ transaction });
  });

  return getWorkspaceDashboard(projectId);
}

export async function upsertWorkspaceSubmission(projectId, submissionId, payload = {}, { actorId } = {}) {
  const prepared = {};

  if (payload.title !== undefined) {
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    if (!title) {
      throw new ValidationError('title cannot be empty.');
    }
    prepared.title = title;
  }

  if (payload.status !== undefined) {
    if (!WORKSPACE_SUBMISSION_STATUSES.includes(payload.status)) {
      throw new ValidationError('Invalid submission status.');
    }
    prepared.status = payload.status;
  }

  if (payload.submissionType !== undefined) {
    prepared.submissionType = payload.submissionType ? String(payload.submissionType).trim() : null;
  }

  if (payload.submittedBy !== undefined) {
    prepared.submittedBy = payload.submittedBy ? String(payload.submittedBy).trim() : null;
  }

  if (payload.reviewedBy !== undefined) {
    prepared.reviewedBy = payload.reviewedBy ? String(payload.reviewedBy).trim() : null;
  }

  if (payload.notes !== undefined) {
    prepared.notes = payload.notes ? String(payload.notes).trim() : null;
  }

  if (payload.attachmentUrl !== undefined) {
    prepared.attachmentUrl = payload.attachmentUrl ? String(payload.attachmentUrl).trim() : null;
  }

  const submittedAt = parseDateValue(payload.submittedAt ?? payload.submittedOn ?? undefined, 'submittedAt');
  if (submittedAt !== undefined) {
    prepared.submittedAt = submittedAt;
  }

  const reviewedAt = parseDateValue(payload.reviewedAt ?? payload.reviewedOn ?? undefined, 'reviewedAt');
  if (reviewedAt !== undefined) {
    prepared.reviewedAt = reviewedAt;
  }

  if (payload.metadata !== undefined) {
    prepared.metadata = payload.metadata ?? null;
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    if (submissionId) {
      const submission = await ProjectWorkspaceSubmission.findOne({
        where: { id: submissionId, workspaceId: workspace.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!submission) {
        throw new NotFoundError('Workspace submission not found.');
      }

      if (Object.keys(prepared).length === 0) {
        return submission;
      }

      await submission.update(prepared, { transaction });
      return submission;
    }

    const title = prepared.title ?? (typeof payload.title === 'string' ? payload.title.trim() : '');
    if (!title) {
      throw new ValidationError('title is required.');
    }

    await ProjectWorkspaceSubmission.create(
      {
        workspaceId: workspace.id,
        title,
        submissionType: prepared.submissionType ?? (payload.submissionType ? String(payload.submissionType).trim() : null),
        status:
          prepared.status ??
          (WORKSPACE_SUBMISSION_STATUSES.includes(payload.status) ? payload.status : WORKSPACE_SUBMISSION_STATUSES[0]),
        submittedBy: prepared.submittedBy ?? (payload.submittedBy ? String(payload.submittedBy).trim() : null),
        submittedAt:
          prepared.submittedAt ?? parseDateValue(payload.submittedAt ?? payload.submittedOn ?? new Date(), 'submittedAt'),
        reviewedBy: prepared.reviewedBy ?? (payload.reviewedBy ? String(payload.reviewedBy).trim() : null),
        reviewedAt: prepared.reviewedAt ?? parseDateValue(payload.reviewedAt ?? payload.reviewedOn ?? null, 'reviewedAt'),
        notes: prepared.notes ?? (payload.notes ? String(payload.notes).trim() : null),
        attachmentUrl: prepared.attachmentUrl ?? (payload.attachmentUrl ? String(payload.attachmentUrl).trim() : null),
        metadata: prepared.metadata ?? payload.metadata ?? null,
      },
      { transaction },
    );

    return null;
  });

  return getWorkspaceDashboard(projectId);
}

export async function removeWorkspaceSubmission(projectId, submissionId, { actorId } = {}) {
  if (!submissionId) {
    throw new ValidationError('submissionId is required.');
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    const submission = await ProjectWorkspaceSubmission.findOne({
      where: { id: submissionId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!submission) {
      throw new NotFoundError('Workspace submission not found.');
    }

    await submission.destroy({ transaction });
  });

  return getWorkspaceDashboard(projectId);
}

export async function upsertWorkspaceInvite(projectId, inviteId, payload = {}, { actorId } = {}) {
  const prepared = {};

  if (payload.email !== undefined) {
    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    if (!email) {
      throw new ValidationError('email cannot be empty.');
    }
    prepared.email = email;
  }

  if (payload.role !== undefined) {
    const role = typeof payload.role === 'string' ? payload.role.trim() : '';
    if (!role) {
      throw new ValidationError('role cannot be empty.');
    }
    prepared.role = role;
  }

  if (payload.status !== undefined) {
    if (!WORKSPACE_INVITE_STATUSES.includes(payload.status)) {
      throw new ValidationError('Invalid invite status.');
    }
    prepared.status = payload.status;
  }

  if (payload.invitedByName !== undefined) {
    prepared.invitedByName = payload.invitedByName ? String(payload.invitedByName).trim() : null;
  }

  if (payload.message !== undefined) {
    prepared.message = payload.message ? String(payload.message).trim() : null;
  }

  if (payload.inviteToken !== undefined) {
    prepared.inviteToken = payload.inviteToken ? String(payload.inviteToken).trim() : generateInviteToken();
  }

  const expiresAt = parseDateValue(payload.expiresAt ?? payload.expiresOn ?? undefined, 'expiresAt');
  if (expiresAt !== undefined) {
    prepared.expiresAt = expiresAt;
  }

  if (payload.metadata !== undefined) {
    prepared.metadata = payload.metadata ?? null;
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    if (inviteId) {
      const invite = await ProjectWorkspaceInvite.findOne({
        where: { id: inviteId, workspaceId: workspace.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!invite) {
        throw new NotFoundError('Workspace invite not found.');
      }

      if (Object.keys(prepared).length === 0) {
        return invite;
      }

      await invite.update(prepared, { transaction });
      return invite;
    }

    const email = prepared.email ?? (typeof payload.email === 'string' ? payload.email.trim() : '');
    if (!email) {
      throw new ValidationError('email is required.');
    }

    const role = prepared.role ?? (typeof payload.role === 'string' ? payload.role.trim() : '');
    if (!role) {
      throw new ValidationError('role is required.');
    }

    await ProjectWorkspaceInvite.create(
      {
        workspaceId: workspace.id,
        email,
        role,
        status: prepared.status ?? (WORKSPACE_INVITE_STATUSES.includes(payload.status) ? payload.status : 'pending'),
        invitedByName: prepared.invitedByName ?? (payload.invitedByName ? String(payload.invitedByName).trim() : null),
        inviteToken: prepared.inviteToken ?? generateInviteToken(),
        expiresAt: prepared.expiresAt ?? parseDateValue(payload.expiresAt ?? payload.expiresOn ?? null, 'expiresAt'),
        message: prepared.message ?? (payload.message ? String(payload.message).trim() : null),
        metadata: prepared.metadata ?? payload.metadata ?? null,
      },
      { transaction },
    );

    return null;
  });

  return getWorkspaceDashboard(projectId);
}

export async function removeWorkspaceInvite(projectId, inviteId, { actorId } = {}) {
  if (!inviteId) {
    throw new ValidationError('inviteId is required.');
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    const invite = await ProjectWorkspaceInvite.findOne({
      where: { id: inviteId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!invite) {
      throw new NotFoundError('Workspace invite not found.');
    }

    await invite.destroy({ transaction });
  });

  return getWorkspaceDashboard(projectId);
}

export async function upsertWorkspaceHrRecord(projectId, recordId, payload = {}, { actorId } = {}) {
  const prepared = {};

  if (payload.memberName !== undefined) {
    const memberName = typeof payload.memberName === 'string' ? payload.memberName.trim() : '';
    if (!memberName) {
      throw new ValidationError('memberName cannot be empty.');
    }
    prepared.memberName = memberName;
  }

  if (payload.assignmentRole !== undefined) {
    prepared.assignmentRole = payload.assignmentRole ? String(payload.assignmentRole).trim() : null;
  }

  if (payload.status !== undefined) {
    if (!WORKSPACE_HR_STATUSES.includes(payload.status)) {
      throw new ValidationError('Invalid HR record status.');
    }
    prepared.status = payload.status;
  }

  const capacityHours = normalizeDecimalValue(payload.capacityHours, { fieldName: 'capacityHours', allowNull: true });
  if (capacityHours !== undefined) {
    prepared.capacityHours = capacityHours;
  }

  const allocatedHours = normalizeDecimalValue(payload.allocatedHours, { fieldName: 'allocatedHours', allowNull: true });
  if (allocatedHours !== undefined) {
    prepared.allocatedHours = allocatedHours;
  }

  if (payload.currency !== undefined) {
    prepared.currency = normalizeCurrencyCode(payload.currency);
  }

  const costRate = normalizeMoneyValue(payload.costRate, { fieldName: 'costRate', allowNull: true });
  if (costRate !== undefined) {
    prepared.costRate = costRate;
  }

  const startedAt = parseDateValue(payload.startedAt ?? payload.startDate ?? undefined, 'startedAt');
  if (startedAt !== undefined) {
    prepared.startedAt = startedAt;
  }

  const endedAt = parseDateValue(payload.endedAt ?? payload.endDate ?? undefined, 'endedAt');
  if (endedAt !== undefined) {
    prepared.endedAt = endedAt;
  }

  if (payload.notes !== undefined) {
    prepared.notes = payload.notes ? String(payload.notes).trim() : null;
  }

  if (payload.metadata !== undefined) {
    prepared.metadata = payload.metadata ?? null;
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    if (recordId) {
      const record = await ProjectWorkspaceHrRecord.findOne({
        where: { id: recordId, workspaceId: workspace.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!record) {
        throw new NotFoundError('HR record not found.');
      }

      if (Object.keys(prepared).length === 0) {
        return record;
      }

      await record.update(prepared, { transaction });
      return record;
    }

    const memberName = prepared.memberName ?? (typeof payload.memberName === 'string' ? payload.memberName.trim() : '');
    if (!memberName) {
      throw new ValidationError('memberName is required.');
    }

    await ProjectWorkspaceHrRecord.create(
      {
        workspaceId: workspace.id,
        memberName,
        assignmentRole: prepared.assignmentRole ?? (payload.assignmentRole ? String(payload.assignmentRole).trim() : null),
        status: prepared.status ?? (WORKSPACE_HR_STATUSES.includes(payload.status) ? payload.status : 'pending'),
        capacityHours:
          prepared.capacityHours ?? normalizeDecimalValue(payload.capacityHours, { fieldName: 'capacityHours', allowNull: true }),
        allocatedHours:
          prepared.allocatedHours ?? normalizeDecimalValue(payload.allocatedHours, { fieldName: 'allocatedHours', allowNull: true }),
        costRate: prepared.costRate ?? normalizeMoneyValue(payload.costRate ?? null, { fieldName: 'costRate', allowNull: true }),
        currency: prepared.currency ?? normalizeCurrencyCode(payload.currency ?? 'USD'),
        startedAt: prepared.startedAt ?? parseDateValue(payload.startedAt ?? payload.startDate ?? new Date(), 'startedAt'),
        endedAt: prepared.endedAt ?? parseDateValue(payload.endedAt ?? payload.endDate ?? null, 'endedAt'),
        notes: prepared.notes ?? (payload.notes ? String(payload.notes).trim() : null),
        metadata: prepared.metadata ?? payload.metadata ?? null,
      },
      { transaction },
    );

    return null;
  });

  return getWorkspaceDashboard(projectId);
}

export async function removeWorkspaceHrRecord(projectId, recordId, { actorId } = {}) {
  if (!recordId) {
    throw new ValidationError('recordId is required.');
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    const record = await ProjectWorkspaceHrRecord.findOne({
      where: { id: recordId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!record) {
      throw new NotFoundError('HR record not found.');
    }

    await record.destroy({ transaction });
  });

  return getWorkspaceDashboard(projectId);
}

export async function postWorkspaceConversationMessage(projectId, conversationId, payload = {}, { actorId } = {}) {
  if (!conversationId) {
    throw new ValidationError('conversationId is required.');
  }

  const authorName = payload.authorName ? String(payload.authorName).trim() : 'Workspace member';
  const authorRole = payload.authorRole ? String(payload.authorRole).trim() : null;
  const body = typeof payload.body === 'string' ? payload.body.trim() : '';

  if (!body) {
    throw new ValidationError('body is required.');
  }

  const attachments = normalizeAttachments(payload.attachments);

  const message = await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    const conversation = await ProjectWorkspaceConversation.findOne({
      where: { id: conversationId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found.');
    }

    const createdMessage = await ProjectWorkspaceMessage.create(
      {
        workspaceId: workspace.id,
        conversationId: conversation.id,
        authorName,
        authorRole,
        body,
        postedAt: payload.postedAt ? parseDateValue(payload.postedAt, 'postedAt') : new Date(),
        attachments,
        metadata: payload.metadata ?? null,
      },
      { transaction },
    );

    await conversation.update(
      {
        lastMessagePreview: body.slice(0, 280),
        lastMessageAt: createdMessage.postedAt,
        unreadCount: Math.max(0, (conversation.unreadCount ?? 0) + (payload.markRead ? 0 : 1)),
      },
      { transaction },
    );

    return createdMessage;
  });

  return message.toPublicObject();
}

export async function upsertWorkspaceFile(projectId, fileId, payload = {}, { actorId } = {}) {
  const prepared = {};

  if (payload.name !== undefined) {
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    if (!name) {
      throw new ValidationError('name cannot be empty.');
    }
    prepared.name = name;
  }

  if (payload.category !== undefined) {
    prepared.category = payload.category ? String(payload.category).trim() : null;
  }

  if (payload.fileType !== undefined) {
    prepared.fileType = payload.fileType ? String(payload.fileType).trim() : null;
  }

  if (payload.storageProvider !== undefined) {
    prepared.storageProvider = payload.storageProvider ? String(payload.storageProvider).trim() : null;
  }

  if (payload.storagePath !== undefined) {
    prepared.storagePath = payload.storagePath ? String(payload.storagePath).trim() : null;
  }

  if (payload.version !== undefined) {
    prepared.version = payload.version ? String(payload.version).trim() : null;
  }

  if (payload.sizeBytes !== undefined) {
    const size = Number(payload.sizeBytes);
    if (Number.isNaN(size) || size < 0) {
      throw new ValidationError('sizeBytes must be a positive number when provided.');
    }
    prepared.sizeBytes = Math.floor(size);
  }

  const tags = normalizeStringList(payload.tags);
  if (tags !== undefined) {
    prepared.tags = tags;
  }

  if (payload.permissions !== undefined) {
    prepared.permissions = payload.permissions ?? null;
  }

  if (payload.watermarkSettings !== undefined) {
    prepared.watermarkSettings = payload.watermarkSettings ?? null;
  }

  const uploadedAt = parseDateValue(payload.uploadedAt ?? payload.uploadedOn ?? undefined, 'uploadedAt');
  if (uploadedAt !== undefined) {
    prepared.uploadedAt = uploadedAt;
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    if (fileId) {
      const file = await ProjectWorkspaceFile.findOne({
        where: { id: fileId, workspaceId: workspace.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!file) {
        throw new NotFoundError('Workspace file not found.');
      }

      if (Object.keys(prepared).length === 0) {
        return file;
      }

      await file.update(prepared, { transaction });
      return file;
    }

    const name = prepared.name ?? (typeof payload.name === 'string' ? payload.name.trim() : '');
    if (!name) {
      throw new ValidationError('name is required.');
    }

    await ProjectWorkspaceFile.create(
      {
        workspaceId: workspace.id,
        name,
        category: prepared.category ?? (payload.category ? String(payload.category).trim() : null),
        fileType: prepared.fileType ?? (payload.fileType ? String(payload.fileType).trim() : null),
        storageProvider: prepared.storageProvider ?? (payload.storageProvider ? String(payload.storageProvider).trim() : null),
        storagePath: prepared.storagePath ?? (payload.storagePath ? String(payload.storagePath).trim() : null),
        version: prepared.version ?? (payload.version ? String(payload.version).trim() : null),
        sizeBytes:
          prepared.sizeBytes ?? (payload.sizeBytes != null ? Math.max(0, Math.floor(Number(payload.sizeBytes) || 0)) : null),
        tags: prepared.tags ?? normalizeStringList(payload.tags),
        permissions: prepared.permissions ?? payload.permissions ?? null,
        watermarkSettings: prepared.watermarkSettings ?? payload.watermarkSettings ?? null,
        uploadedById: actorId ?? null,
        uploadedAt: prepared.uploadedAt ?? parseDateValue(payload.uploadedAt ?? payload.uploadedOn ?? new Date(), 'uploadedAt'),
      },
      { transaction },
    );

    return null;
  });

  return getWorkspaceDashboard(projectId);
}

export async function removeWorkspaceFile(projectId, fileId, { actorId } = {}) {
  if (!fileId) {
    throw new ValidationError('fileId is required.');
  }

  await mutateWorkspace(projectId, actorId, async ({ workspace, transaction }) => {
    const file = await ProjectWorkspaceFile.findOne({
      where: { id: fileId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!file) {
      throw new NotFoundError('Workspace file not found.');
    }

    await file.destroy({ transaction });
  });

  return getWorkspaceDashboard(projectId);
}

export default {
  initializeWorkspaceForProject,
  getWorkspaceDashboard,
  updateWorkspaceBrief,
  updateWorkspaceApproval,
  acknowledgeWorkspaceConversation,
  upsertWorkspaceBudget,
  removeWorkspaceBudget,
  upsertWorkspaceObject,
  removeWorkspaceObject,
  upsertWorkspaceTimelineEntry,
  removeWorkspaceTimelineEntry,
  upsertWorkspaceMeeting,
  removeWorkspaceMeeting,
  upsertWorkspaceRole,
  removeWorkspaceRole,
  upsertWorkspaceSubmission,
  removeWorkspaceSubmission,
  upsertWorkspaceInvite,
  removeWorkspaceInvite,
  upsertWorkspaceHrRecord,
  removeWorkspaceHrRecord,
  postWorkspaceConversationMessage,
  upsertWorkspaceFile,
  removeWorkspaceFile,
  getProjectWorkspaceOverview,
  getProjectWorkspaceSummary,
  createWorkspaceProject,
  updateProjectDetails,
  createBudgetLine,
  updateBudgetLine,
  deleteBudgetLine,
  createDeliverable,
  updateDeliverable,
  deleteDeliverable,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskAssignment,
  removeTaskAssignment,
  createTaskDependency,
  removeTaskDependency,
  postChatMessage,
  updateChatMessage,
  deleteChatMessage,
  createTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry,
  scheduleMeeting,
  updateMeeting,
  deleteMeeting,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  createRoleDefinition,
  updateRoleDefinition,
  deleteRoleDefinition,
  assignRole,
  updateRoleAssignment,
  removeRoleAssignment,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  createFile,
  updateFile,
  deleteFile,
  createInvitation,
  updateInvitation,
  deleteInvitation,
  createHrRecord,
  updateHrRecord,
  deleteHrRecord,
};
