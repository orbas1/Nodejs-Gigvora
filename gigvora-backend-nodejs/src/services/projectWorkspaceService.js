import {
  sequelize,
  Project,
  ProjectWorkspace,
  ProjectWorkspaceBrief,
  ProjectWorkspaceWhiteboard,
  ProjectWorkspaceFile,
  ProjectWorkspaceConversation,
  ProjectWorkspaceApproval,
  WORKSPACE_APPROVAL_STATUSES,
  WORKSPACE_CONVERSATION_PRIORITIES,
} from '../models/index.js';
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

function computeWorkspaceMetrics(workspace, { approvals, files, conversations, whiteboards }) {
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

  const [brief, whiteboards, files, conversations, approvals] = await Promise.all([
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
  ]);

  const briefPayload = brief ? brief.toPublicObject() : null;
  const whiteboardsPayload = whiteboards.map((board) => board.toPublicObject());
  const filesPayload = files.map((file) => file.toPublicObject());
  const conversationsPayload = conversations.map((conversation) => conversation.toPublicObject());
  const approvalsPayload = approvals.map((approval) => approval.toPublicObject());

  return {
    project: project.toPublicObject(),
    workspace: workspace.toPublicObject(),
    brief: briefPayload,
    whiteboards: whiteboardsPayload,
    files: filesPayload,
    conversations: conversationsPayload,
    approvals: approvalsPayload,
    metrics: computeWorkspaceMetrics(workspace, {
      approvals: approvalsPayload,
      files: filesPayload,
      conversations: conversationsPayload,
      whiteboards: whiteboardsPayload,
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

export default {
  initializeWorkspaceForProject,
  getWorkspaceDashboard,
  updateWorkspaceBrief,
  updateWorkspaceApproval,
  acknowledgeWorkspaceConversation,
};
