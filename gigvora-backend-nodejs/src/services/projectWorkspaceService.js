import {
  sequelize,
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
  }
  return [];
}

function parseDateValue(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    return null;
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
  });

  return metrics;
}

async function ensureWorkspaceArtifacts(workspace, { project, actorId, transaction }) {
  if (!workspace) {
    return null;
  }

  const now = new Date();

  const brief = await ProjectWorkspaceBrief.findOne({
    where: { workspaceId: workspace.id },
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });

  if (!brief) {
    await ProjectWorkspaceBrief.create(
      {
        workspaceId: workspace.id,
        title: `${project.title} workspace brief`,
        summary: project.description,
        objectives: [
          'Align on client goals and constraints',
          'Map delivery milestones with stakeholders',
        ],
        deliverables: [
          'Kickoff workshop assets',
          'Integrated delivery roadmap',
          'Weekly performance digest template',
        ],
        successMetrics: ['NPS ≥ 45', 'Delivery variance < 10%', 'Revision turnaround < 24h'],
        clientStakeholders: ['Client sponsor', 'Operations lead', 'Finance approver'],
        lastUpdatedById: actorId ?? null,
      },
      { transaction },
    );
  }

  const whiteboardCount = await ProjectWorkspaceWhiteboard.count({
    where: { workspaceId: workspace.id },
    transaction,
  });

  if (whiteboardCount === 0) {
    await ProjectWorkspaceWhiteboard.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          title: 'Strategy canvas',
          status: 'active',
          ownerName: 'Engagement Lead',
          activeCollaborators: ['Design', 'Product', 'Client sponsor'],
          tags: ['briefing', 'insights'],
          lastEditedAt: now,
        },
        {
          workspaceId: workspace.id,
          title: 'Sprint plan storyboard',
          status: 'pending_review',
          ownerName: 'Delivery Manager',
          activeCollaborators: ['Engineering', 'QA'],
          tags: ['execution'],
          lastEditedAt: new Date(now.getTime() - 1000 * 60 * 45),
        },
      ],
      { transaction },
    );
  }

  const fileCount = await ProjectWorkspaceFile.count({ where: { workspaceId: workspace.id }, transaction });

  if (fileCount === 0) {
    await ProjectWorkspaceFile.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          name: 'Client brief v1.2.pdf',
          category: 'brief',
          fileType: 'application/pdf',
          storageProvider: 's3',
          storagePath: `/projects/${project.id}/briefs/client-brief-v1-2.pdf`,
          version: '1.2',
          sizeBytes: 5242880,
          tags: ['client', 'brief'],
          permissions: {
            visibility: 'client_internal',
            allowedRoles: ['owner', 'mentor', 'client_sponsor'],
            allowDownload: false,
            shareableLink: false,
          },
          watermarkSettings: {
            enabled: true,
            pattern: 'diagonal',
            label: 'Gigvora Confidential',
            appliedAt: new Date(now.getTime() - 1000 * 60 * 60 * 18),
          },
          uploadedAt: new Date(now.getTime() - 1000 * 60 * 90),
        },
        {
          workspaceId: workspace.id,
          name: 'Wireframes-round-2.fig',
          category: 'design',
          fileType: 'application/octet-stream',
          storageProvider: 'figma',
          storagePath: 'https://www.figma.com/file/abc123',
          version: '2.0',
          sizeBytes: 7340032,
          tags: ['design', 'whiteboard'],
          permissions: {
            visibility: 'project_team',
            allowedRoles: ['design', 'product', 'owner'],
            allowDownload: true,
            shareableLink: true,
          },
          watermarkSettings: {
            enabled: false,
            pattern: null,
            label: null,
            appliedAt: null,
          },
          uploadedAt: new Date(now.getTime() - 1000 * 60 * 60 * 6),
        },
        {
          workspaceId: workspace.id,
          name: 'QA-checklist.xlsx',
          category: 'operations',
          fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          storageProvider: 'drive',
          storagePath: `/projects/${project.id}/ops/qa-checklist.xlsx`,
          version: '1.0',
          sizeBytes: 1048576,
          tags: ['qa', 'operations'],
          permissions: {
            visibility: 'internal_only',
            allowedRoles: ['owner', 'operations', 'qa'],
            allowDownload: true,
            shareableLink: false,
          },
          watermarkSettings: {
            enabled: true,
            pattern: 'horizontal',
            label: 'For QA Eyes Only',
            appliedAt: new Date(now.getTime() - 1000 * 60 * 60 * 3),
          },
          uploadedAt: new Date(now.getTime() - 1000 * 60 * 30),
        },
      ],
      { transaction },
    );
  }

  const conversationCount = await ProjectWorkspaceConversation.count({
    where: { workspaceId: workspace.id },
    transaction,
  });

  if (conversationCount === 0) {
    await ProjectWorkspaceConversation.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          channelType: 'project',
          topic: 'Daily delivery standup',
          priority: 'normal',
          unreadCount: 3,
          lastMessagePreview: 'Reminder: client demo rehearsal tomorrow at 10am ET',
          lastMessageAt: new Date(now.getTime() - 1000 * 60 * 15),
          participants: ['Delivery Manager', 'Client sponsor', 'QA lead'],
        },
        {
          workspaceId: workspace.id,
          channelType: 'client',
          topic: 'Feedback loop',
          priority: 'high',
          unreadCount: 1,
          lastMessagePreview: 'Client uploaded annotated deck—need revised assets by Friday',
          lastMessageAt: new Date(now.getTime() - 1000 * 60 * 50),
          participants: ['Engagement Lead', 'Design Director'],
        },
        {
          workspaceId: workspace.id,
          channelType: 'ops',
          topic: 'Billing & procurement',
          priority: 'low',
          unreadCount: 0,
          lastMessagePreview: 'PO submitted to finance—awaiting receipt confirmation',
          lastMessageAt: new Date(now.getTime() - 1000 * 60 * 120),
          participants: ['Operations', 'Finance'],
        },
      ],
      { transaction },
    );
  }

  const approvalCount = await ProjectWorkspaceApproval.count({
    where: { workspaceId: workspace.id },
    transaction,
  });

  if (approvalCount === 0) {
    await ProjectWorkspaceApproval.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          title: 'Creative direction sign-off',
          stage: 'discovery',
          status: 'in_review',
          ownerName: 'Design Director',
          approverEmail: 'client.creative@example.com',
          dueAt: new Date(now.getTime() + 1000 * 60 * 60 * 48),
          submittedAt: new Date(now.getTime() - 1000 * 60 * 60 * 12),
          metadata: { round: 2 },
        },
        {
          workspaceId: workspace.id,
          title: 'Automation workflow approval',
          stage: 'build',
          status: 'pending',
          ownerName: 'Automation PM',
          approverEmail: 'client.ops@example.com',
          dueAt: new Date(now.getTime() + 1000 * 60 * 60 * 72),
          metadata: { checklist: 'ops-automation' },
        },
        {
          workspaceId: workspace.id,
          title: 'Launch readiness',
          stage: 'launch',
          status: 'changes_requested',
          ownerName: 'Delivery Manager',
          approverEmail: 'client.pm@example.com',
          dueAt: new Date(now.getTime() + 1000 * 60 * 60 * 96),
          submittedAt: new Date(now.getTime() - 1000 * 60 * 60 * 6),
          decisionNotes: 'Need updated risk register before approval',
        },
      ],
      { transaction },
    );
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

export async function initializeWorkspaceForProject(projectOrId, { actorId, transaction } = {}) {
  const project =
    projectOrId && typeof projectOrId === 'object' && projectOrId.id
      ? projectOrId
      : await Project.findByPk(projectOrId, { transaction });

  if (!project) {
    throw new NotFoundError('Project not found.');
  }

  const existing = await ProjectWorkspace.findOne({
    where: { projectId: project.id },
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });

  if (existing) {
    await ensureWorkspaceArtifacts(existing, { project, actorId, transaction });
    return existing;
  }

  const now = new Date();
  const workspace = await ProjectWorkspace.create(
    {
      projectId: project.id,
      status: 'briefing',
      healthScore: 78.5,
      velocityScore: 72.4,
      riskLevel: 'low',
      progressPercent: 18.2,
      clientSatisfaction: 91.0,
      automationCoverage: 42.5,
      billingStatus: 'deposit_cleared',
      nextMilestone: 'Kickoff workshop',
      nextMilestoneDueAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5),
      metricsSnapshot: {
        automationRuns: 8,
        activeStreams: 4,
        deliverablesInProgress: 6,
        teamUtilization: 0.78,
      },
      lastActivityAt: now,
      updatedById: actorId ?? null,
    },
    { transaction },
  );

  await ensureWorkspaceArtifacts(workspace, { project, actorId, transaction });
  await workspace.reload({ transaction });
  return workspace;
}

export async function getWorkspaceDashboard(projectId) {
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }

  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new NotFoundError('Project not found.');
  }

  const workspace = await initializeWorkspaceForProject(project);
  await workspace.reload();

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
}

export async function updateWorkspaceBrief(projectId, payload = {}, { actorId } = {}) {
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }

  await sequelize.transaction(async (transaction) => {
    const project = await Project.findByPk(projectId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    const workspace = await initializeWorkspaceForProject(project, { transaction, actorId });
    const brief = await ProjectWorkspaceBrief.findOne({
      where: { workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!brief) {
      throw new NotFoundError('Workspace brief not found.');
    }

    const updates = {};

    if (payload.title !== undefined) {
      const title = typeof payload.title === 'string' ? payload.title.trim() : '';
      if (!title) {
        throw new ValidationError('title cannot be empty.');
      }
      updates.title = title;
    }

    if (payload.summary !== undefined) {
      const summary = typeof payload.summary === 'string' ? payload.summary.trim() : null;
      updates.summary = summary || null;
    }

    const objectives = normalizeStringList(payload.objectives ?? payload.objectivesText);
    if (objectives !== undefined) {
      updates.objectives = objectives;
    }

    const deliverables = normalizeStringList(payload.deliverables ?? payload.deliverablesText);
    if (deliverables !== undefined) {
      updates.deliverables = deliverables;
    }

    const successMetrics = normalizeStringList(payload.successMetrics ?? payload.successMetricsText);
    if (successMetrics !== undefined) {
      updates.successMetrics = successMetrics;
    }

    const stakeholders = normalizeStringList(payload.clientStakeholders ?? payload.stakeholders);
    if (stakeholders !== undefined) {
      updates.clientStakeholders = stakeholders;
    }

    if (Object.keys(updates).length > 0) {
      updates.lastUpdatedById = actorId ?? null;
      await brief.update(updates, { transaction });
      await workspace.update({ lastActivityAt: new Date(), updatedById: actorId ?? null }, { transaction });
    }
  });

  return getWorkspaceDashboard(projectId);
}

export async function updateWorkspaceApproval(projectId, approvalId, payload = {}, { actorId } = {}) {
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }
  if (!approvalId) {
    throw new ValidationError('approvalId is required.');
  }

  await sequelize.transaction(async (transaction) => {
    const project = await Project.findByPk(projectId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    const workspace = await initializeWorkspaceForProject(project, { transaction, actorId });
    const approval = await ProjectWorkspaceApproval.findOne({
      where: { id: approvalId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!approval) {
      throw new NotFoundError('Approval not found.');
    }

    const updates = {};

    if (payload.status !== undefined) {
      if (!WORKSPACE_APPROVAL_STATUSES.includes(payload.status)) {
        throw new ValidationError('Invalid approval status.');
      }
      updates.status = payload.status;
      if (['approved', 'rejected', 'changes_requested'].includes(payload.status) && payload.decidedAt === undefined) {
        updates.decidedAt = new Date();
      }
    }

    if (payload.stage !== undefined) {
      const stage = typeof payload.stage === 'string' ? payload.stage.trim() : '';
      if (!stage) {
        throw new ValidationError('stage cannot be empty.');
      }
      updates.stage = stage;
    }

    if (payload.ownerName !== undefined) {
      updates.ownerName = payload.ownerName ? String(payload.ownerName).trim() : null;
    }

    if (payload.approverEmail !== undefined) {
      updates.approverEmail = payload.approverEmail ? String(payload.approverEmail).trim() : null;
    }

    const dueAt = parseDateValue(payload.dueAt, 'dueAt');
    if (dueAt !== undefined) {
      updates.dueAt = dueAt;
    }

    const submittedAt = parseDateValue(payload.submittedAt, 'submittedAt');
    if (submittedAt !== undefined) {
      updates.submittedAt = submittedAt;
    }

    const decidedAt = parseDateValue(payload.decidedAt, 'decidedAt');
    if (decidedAt !== undefined) {
      updates.decidedAt = decidedAt;
    }

    if (payload.decisionNotes !== undefined) {
      updates.decisionNotes = payload.decisionNotes ? String(payload.decisionNotes).trim() : null;
    }

    const attachments = normalizeAttachments(payload.attachments);
    if (attachments !== undefined) {
      updates.attachments = attachments;
    }

    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return;
    }

    await approval.update(updates, { transaction });
    await workspace.update({ lastActivityAt: new Date(), updatedById: actorId ?? null }, { transaction });
  });

  return getWorkspaceDashboard(projectId);
}

export async function acknowledgeWorkspaceConversation(projectId, conversationId, payload = {}, { actorId } = {}) {
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }
  if (!conversationId) {
    throw new ValidationError('conversationId is required.');
  }

  await sequelize.transaction(async (transaction) => {
    const project = await Project.findByPk(projectId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    const workspace = await initializeWorkspaceForProject(project, { transaction, actorId });
    const conversation = await ProjectWorkspaceConversation.findOne({
      where: { id: conversationId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found.');
    }

    const updates = {
      unreadCount: 0,
      lastReadAt: new Date(),
    };

    if (payload.priority !== undefined) {
      if (!WORKSPACE_CONVERSATION_PRIORITIES.includes(payload.priority)) {
        throw new ValidationError('Invalid conversation priority.');
      }
      updates.priority = payload.priority;
    }

    if (payload.externalLink !== undefined) {
      updates.externalLink = payload.externalLink ? String(payload.externalLink).trim() : null;
    }

    await conversation.update(updates, { transaction });
    await workspace.update({ lastActivityAt: new Date(), updatedById: actorId ?? null }, { transaction });
  });

  return getWorkspaceDashboard(projectId);
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
};
