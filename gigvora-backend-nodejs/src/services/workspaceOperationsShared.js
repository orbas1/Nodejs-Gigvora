import {
  ProjectWorkspaceTimeline,
  ProjectWorkspaceTask,
  ProjectWorkspaceTaskAssignment,
  ProjectWorkspaceBudgetLine,
  ProjectWorkspaceObject,
  ProjectWorkspaceTimelineEvent,
  ProjectWorkspaceMeeting,
  ProjectWorkspaceCalendarEntry,
  ProjectWorkspaceRole,
  ProjectWorkspaceSubmission,
  ProjectWorkspaceInvite,
  ProjectWorkspaceHrRecord,
  ProjectWorkspaceTimeLog,
  ProjectWorkspaceTarget,
  ProjectWorkspaceObjective,
  ProjectWorkspaceFile,
  ProjectWorkspaceConversation,
  ProjectWorkspaceMessage,
} from '../models/index.js';

export async function seedWorkspaceOperationsArtifacts(workspace, { project, transaction } = {}) {
  if (!workspace) {
    return;
  }

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 45);

  await ProjectWorkspaceTimeline.findOrCreate({
    where: { workspaceId: workspace.id },
    defaults: {
      workspaceId: workspace.id,
      name: `${project?.title ?? 'Project'} delivery timeline`,
      timezone: 'UTC',
      startDate: start,
      endDate: end,
      baselineStartDate: start,
      baselineEndDate: end,
      ownerName: 'Program Management Office',
    },
    transaction,
  });

  const existingTaskCount = await ProjectWorkspaceTask.count({ where: { workspaceId: workspace.id }, transaction });
  const seededTasks = [];
  if (existingTaskCount === 0) {
    const discoveryTask = await ProjectWorkspaceTask.create(
      {
        workspaceId: workspace.id,
        title: 'Discovery & kickoff',
        description: 'Research, stakeholder interviews, and alignment workshops.',
        ownerName: 'Priya Desai',
        ownerType: 'agency_member',
        startDate: start,
        endDate: new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'completed',
        lane: 'Strategy',
        progressPercent: 100,
        workloadHours: 120,
        color: '#0ea5e9',
        priority: 'medium',
      },
      { transaction },
    );
    seededTasks.push(discoveryTask);
    await ProjectWorkspaceTaskAssignment.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          taskId: discoveryTask.id,
          assigneeName: 'Priya Desai',
          assigneeRole: 'Delivery lead',
          allocationPercent: 100,
          hoursCommitted: 80,
        },
        {
          workspaceId: workspace.id,
          taskId: discoveryTask.id,
          assigneeName: 'Lena Torres',
          assigneeRole: 'Client sponsor',
          allocationPercent: 40,
          hoursCommitted: 40,
        },
      ],
      { transaction },
    );

    const designTask = await ProjectWorkspaceTask.create(
      {
        workspaceId: workspace.id,
        title: 'Experience design sprints',
        description: 'Rapid prototyping with client feedback loops.',
        ownerName: 'Kai Chen',
        ownerType: 'freelancer',
        startDate: new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(start.getTime() + 21 * 24 * 60 * 60 * 1000),
        status: 'in_progress',
        lane: 'Design',
        progressPercent: 65,
        workloadHours: 200,
        color: '#8b5cf6',
        priority: 'high',
      },
      { transaction },
    );
    seededTasks.push(designTask);
    await ProjectWorkspaceTaskAssignment.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          taskId: designTask.id,
          assigneeName: 'Kai Chen',
          assigneeRole: 'Design lead',
          allocationPercent: 70,
          hoursCommitted: 140,
        },
        {
          workspaceId: workspace.id,
          taskId: designTask.id,
          assigneeName: 'Noor El-Sayed',
          assigneeRole: 'UX researcher',
          allocationPercent: 30,
          hoursCommitted: 60,
        },
      ],
      { transaction },
    );

    const engineeringTask = await ProjectWorkspaceTask.create(
      {
        workspaceId: workspace.id,
        title: 'Engineering implementation',
        description: 'API integrations, automation, and platform hardening.',
        ownerName: 'Ari Banerjee',
        ownerType: 'agency_member',
        startDate: new Date(start.getTime() + 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(start.getTime() + 45 * 24 * 60 * 60 * 1000),
        status: 'in_progress',
        lane: 'Engineering',
        progressPercent: 38,
        workloadHours: 320,
        color: '#22c55e',
        priority: 'medium',
      },
      { transaction },
    );
    seededTasks.push(engineeringTask);
    await ProjectWorkspaceTaskAssignment.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          taskId: engineeringTask.id,
          assigneeName: 'Ari Banerjee',
          assigneeRole: 'Engineering manager',
          allocationPercent: 60,
          hoursCommitted: 180,
        },
        {
          workspaceId: workspace.id,
          taskId: engineeringTask.id,
          assigneeName: 'Sofia Moretti',
          assigneeRole: 'Automation engineer',
          allocationPercent: 40,
          hoursCommitted: 120,
        },
      ],
      { transaction },
    );

    const enablementTask = await ProjectWorkspaceTask.create(
      {
        workspaceId: workspace.id,
        title: 'Enablement and go-live',
        description: 'Training, documentation, and success metrics validation.',
        ownerName: 'Lena Torres',
        ownerType: 'company_member',
        startDate: end,
        endDate: end,
        status: 'planned',
        lane: 'Enablement',
        progressPercent: 12,
        workloadHours: 80,
        color: '#f97316',
        priority: 'medium',
      },
      { transaction },
    );
    seededTasks.push(enablementTask);
    await ProjectWorkspaceTaskAssignment.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          taskId: enablementTask.id,
          assigneeName: 'Helena Park',
          assigneeRole: 'Client operations',
          allocationPercent: 50,
          hoursCommitted: 40,
        },
        {
          workspaceId: workspace.id,
          taskId: enablementTask.id,
          assigneeName: 'Jordan Malik',
          assigneeRole: 'Success engineer',
          allocationPercent: 50,
          hoursCommitted: 40,
        },
      ],
      { transaction },
    );
  }

  const budgetCount = await ProjectWorkspaceBudgetLine.count({ where: { workspaceId: workspace.id }, transaction });
  if (budgetCount === 0) {
    await ProjectWorkspaceBudgetLine.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          category: 'Discovery & strategy',
          description: 'Stakeholder interviews, research, and roadmapping.',
          plannedAmountCents: 1500000,
          actualAmountCents: 1400000,
          currency: 'USD',
          status: 'approved',
          ownerName: 'Priya Desai',
          approvalsRequired: 1,
        },
        {
          workspaceId: workspace.id,
          category: 'Design sprints',
          description: 'UX/UI production, testing incentives, and tooling.',
          plannedAmountCents: 2750000,
          actualAmountCents: 1800000,
          currency: 'USD',
          status: 'in_review',
          ownerName: 'Kai Chen',
          approvalsRequired: 2,
        },
        {
          workspaceId: workspace.id,
          category: 'Engineering delivery',
          description: 'Automation, integrations, and QA environments.',
          plannedAmountCents: 4200000,
          actualAmountCents: 1250000,
          currency: 'USD',
          status: 'tracking',
          ownerName: 'Ari Banerjee',
          approvalsRequired: 2,
        },
      ],
      { transaction },
    );
  }

  const objectCount = await ProjectWorkspaceObject.count({ where: { workspaceId: workspace.id }, transaction });
  if (objectCount === 0) {
    await ProjectWorkspaceObject.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          name: 'Workspace blueprint',
          type: 'blueprint',
          status: 'active',
          ownerName: 'Program Office',
          summary: 'Cross-functional operating model and RACI.',
          dueAt: new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000),
          tags: ['governance', 'brief'],
        },
        {
          workspaceId: workspace.id,
          name: 'Automation playbook',
          type: 'playbook',
          status: 'in_review',
          ownerName: 'Automation PM',
          summary: 'Approval workflow coverage and exception handling.',
          dueAt: new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000),
          tags: ['automation', 'compliance'],
        },
        {
          workspaceId: workspace.id,
          name: 'Client portal',
          type: 'portal',
          status: 'planned',
          ownerName: 'Client success',
          summary: 'Shared visibility for milestones and decisions.',
          dueAt: end,
          tags: ['client', 'visibility'],
        },
      ],
      { transaction },
    );
  }

  const timelineEventCount = await ProjectWorkspaceTimelineEvent.count({ where: { workspaceId: workspace.id }, transaction });
  if (timelineEventCount === 0) {
    await ProjectWorkspaceTimelineEvent.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          title: 'Kickoff workshop',
          description: 'Align on objectives, success metrics, and stakeholders.',
          eventDate: start,
          eventType: 'milestone',
          ownerName: 'Priya Desai',
          milestone: true,
          color: '#0ea5e9',
        },
        {
          workspaceId: workspace.id,
          title: 'Sprint review',
          description: 'Client demo and acceptance of sprint two deliverables.',
          eventDate: new Date(start.getTime() + 15 * 24 * 60 * 60 * 1000),
          eventType: 'review',
          ownerName: 'Kai Chen',
          milestone: false,
          color: '#8b5cf6',
        },
        {
          workspaceId: workspace.id,
          title: 'Go-live readiness',
          description: 'Final checklist sign-off with automation stakeholders.',
          eventDate: new Date(end.getTime() - 3 * 24 * 60 * 60 * 1000),
          eventType: 'readiness',
          ownerName: 'Ari Banerjee',
          milestone: true,
          color: '#f97316',
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
          title: 'Delivery stand-up',
          agenda: 'Status checks, blockers, and action items.',
          meetingType: 'standup',
          startAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          endAt: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
          hostName: 'Priya Desai',
          attendees: ['Ari Banerjee', 'Kai Chen', 'Noor El-Sayed', 'Helena Park'],
          actionItems: ['Capture blockers', 'Update risk log'],
        },
        {
          workspaceId: workspace.id,
          title: 'Client executive sync',
          agenda: 'Milestone review, financial status, and decisions.',
          meetingType: 'executive_sync',
          location: 'Client HQ',
          startAt: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
          endAt: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          hostName: 'Lena Torres',
          attendees: ['Lena Torres', 'Client sponsor', 'Priya Desai'],
          actionItems: ['Review budget variance', 'Confirm risk mitigation'],
        },
      ],
      { transaction },
    );
  }

  const calendarCount = await ProjectWorkspaceCalendarEntry.count({ where: { workspaceId: workspace.id }, transaction });
  if (calendarCount === 0) {
    await ProjectWorkspaceCalendarEntry.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          title: 'QA automation window',
          startAt: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
          endAt: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000),
          eventType: 'qa',
          ownerName: 'Sofia Moretti',
          visibility: 'workspace',
        },
        {
          workspaceId: workspace.id,
          title: 'Finance checkpoint',
          startAt: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000),
          endAt: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
          eventType: 'finance',
          ownerName: 'Lena Torres',
          visibility: 'workspace',
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
          roleName: 'Delivery lead',
          memberName: 'Priya Desai',
          responsibilities: 'Overall delivery cadence, stakeholder alignment, and risk management.',
          permissions: ['workspace_admin', 'budget_approver'],
          contactEmail: 'priya.desai@example.com',
        },
        {
          workspaceId: workspace.id,
          roleName: 'Automation PM',
          memberName: 'Jordan Malik',
          responsibilities: 'Own automation backlog, client approvals, and change control.',
          permissions: ['automation_editor', 'risk_viewer'],
          contactEmail: 'jordan.malik@example.com',
        },
        {
          workspaceId: workspace.id,
          roleName: 'Client sponsor',
          memberName: 'Lena Torres',
          responsibilities: 'Executive sponsorship, approvals, and budget oversight.',
          permissions: ['approval_owner'],
          contactEmail: 'lena.torres@example.com',
        },
      ],
      { transaction },
    );
  }

  const submissionCount = await ProjectWorkspaceSubmission.count({ where: { workspaceId: workspace.id }, transaction });
  if (submissionCount === 0) {
    await ProjectWorkspaceSubmission.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          title: 'Sprint 2 deliverables',
          description: 'Prototype, research insights, and automation requirements.',
          status: 'in_review',
          submittedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
          reviewerName: 'Client sponsor',
          ownerName: 'Kai Chen',
        },
        {
          workspaceId: workspace.id,
          title: 'Automation workflow approval',
          description: 'Runbooks, guardrails, and monitoring dashboards.',
          status: 'approved',
          submittedAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
          decisionAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
          decisionNotes: 'Approved with minor adjustments to risk matrix.',
          reviewerName: 'Automation PM',
          ownerName: 'Jordan Malik',
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
          email: 'ops.lead@example.com',
          roleName: 'Operations lead',
          status: 'pending',
          invitedBy: 'Priya Desai',
          invitedAt: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        },
        {
          workspaceId: workspace.id,
          email: 'finance@example.com',
          roleName: 'Finance approver',
          status: 'accepted',
          invitedBy: 'Lena Torres',
          invitedAt: new Date(today.getTime() - 48 * 60 * 60 * 1000),
        },
      ],
      { transaction },
    );
  }

  const hrCount = await ProjectWorkspaceHrRecord.count({ where: { workspaceId: workspace.id }, transaction });
  if (hrCount === 0) {
    await ProjectWorkspaceHrRecord.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          fullName: 'Helena Park',
          position: 'Client operations',
          status: 'active',
          startDate: start,
          allocationPercent: 60,
          metadata: { capacityHours: 30 },
        },
        {
          workspaceId: workspace.id,
          fullName: 'Noor El-Sayed',
          position: 'UX researcher',
          status: 'active',
          startDate: start,
          allocationPercent: 40,
          metadata: { capacityHours: 20 },
        },
      ],
      { transaction },
    );
  }

  const timeLogCount = await ProjectWorkspaceTimeLog.count({ where: { workspaceId: workspace.id }, transaction });
  if (timeLogCount === 0) {
    await ProjectWorkspaceTimeLog.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          taskId: seededTasks[0]?.id ?? null,
          memberName: 'Priya Desai',
          startedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
          endedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
          durationMinutes: 180,
          notes: 'Discovery synthesis and summary preparation.',
        },
        {
          workspaceId: workspace.id,
          taskId: seededTasks[1]?.id ?? null,
          memberName: 'Kai Chen',
          startedAt: new Date(today.getTime() - 24 * 60 * 60 * 1000),
          endedAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
          durationMinutes: 240,
          notes: 'Prototype iteration with client feedback.',
        },
      ],
      { transaction },
    );
  }

  const targetCount = await ProjectWorkspaceTarget.count({ where: { workspaceId: workspace.id }, transaction });
  if (targetCount === 0) {
    await ProjectWorkspaceTarget.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          title: 'Automation coverage',
          description: 'Reach 70% of finance workflow automation coverage by launch.',
          status: 'in_progress',
          dueAt: new Date(end.getTime() - 10 * 24 * 60 * 60 * 1000),
          ownerName: 'Ari Banerjee',
        },
        {
          workspaceId: workspace.id,
          title: 'Stakeholder satisfaction',
          description: 'Maintain NPS above 4.5 across executive stakeholders.',
          status: 'in_progress',
          dueAt: end,
          ownerName: 'Lena Torres',
        },
      ],
      { transaction },
    );
  }

  const objectiveCount = await ProjectWorkspaceObjective.count({ where: { workspaceId: workspace.id }, transaction });
  if (objectiveCount === 0) {
    await ProjectWorkspaceObjective.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          title: 'Launch automation pilot',
          description: 'Deliver pilot for finance approvals with monitoring and reporting.',
          status: 'in_progress',
          dueAt: new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000),
          ownerName: 'Jordan Malik',
        },
        {
          workspaceId: workspace.id,
          title: 'Enablement programme',
          description: 'Publish enablement guides and training to client teams.',
          status: 'planned',
          dueAt: end,
          ownerName: 'Helena Park',
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
          name: 'Executive alignment deck.pdf',
          category: 'Executive updates',
          fileType: 'pdf',
          storageProvider: 'internal',
          storagePath: `/workspaces/${workspace.id}/files/executive-alignment-deck.pdf`,
          version: '4',
          sizeBytes: 9_400_000,
          tags: ['executive', 'briefing'],
          uploadedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          workspaceId: workspace.id,
          name: 'Automation architecture.drawio',
          category: 'Design systems',
          fileType: 'diagram',
          storageProvider: 'internal',
          storagePath: `/workspaces/${workspace.id}/files/automation-architecture.drawio`,
          version: '2',
          sizeBytes: 3_200_000,
          tags: ['automation', 'engineering'],
          uploadedAt: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        },
        {
          workspaceId: workspace.id,
          name: 'Change management plan.docx',
          category: 'Compliance & legal',
          fileType: 'document',
          storageProvider: 'internal',
          storagePath: `/workspaces/${workspace.id}/files/change-management-plan.docx`,
          version: '3',
          sizeBytes: 5_800_000,
          tags: ['compliance', 'enablement'],
          uploadedAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        },
      ],
      { transaction },
    );
  }

  const conversationCount = await ProjectWorkspaceConversation.count({ where: { workspaceId: workspace.id }, transaction });
  if (conversationCount === 0) {
    const conversations = await ProjectWorkspaceConversation.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          topic: 'Delivery standup',
          priority: 'high',
          unreadCount: 2,
          lastMessagePreview: 'Reminder: standup starts in 10 minutes.',
          lastMessageAt: new Date(today.getTime() - 30 * 60 * 1000),
          participants: ['Priya Desai', 'Delivery Team'],
        },
        {
          workspaceId: workspace.id,
          topic: 'Design feedback',
          priority: 'normal',
          unreadCount: 0,
          lastMessagePreview: 'Client sponsor shared annotated deck for review.',
          lastMessageAt: new Date(today.getTime() - 75 * 60 * 1000),
          participants: ['Kai Chen', 'Client sponsor'],
        },
        {
          workspaceId: workspace.id,
          topic: 'Finance coordination',
          priority: 'medium',
          unreadCount: 1,
          lastMessagePreview: 'Purchase order submitted to finance.',
          lastMessageAt: new Date(today.getTime() - 110 * 60 * 1000),
          participants: ['Lena Torres', 'Finance'],
        },
      ],
      { transaction, returning: true },
    );

    await ProjectWorkspaceMessage.bulkCreate(
      [
        {
          workspaceId: workspace.id,
          conversationId: conversations[0].id,
          authorName: 'Priya Desai',
          body: 'Standup notes posted in the workspace. Please review the new risks before tomorrow.',
          postedAt: new Date(today.getTime() - 3 * 60 * 60 * 1000),
        },
        {
          workspaceId: workspace.id,
          conversationId: conversations[0].id,
          authorName: 'Kai Chen',
          body: 'Design sprint assets uploaded to the file manager. Feedback welcome by EOD.',
          postedAt: new Date(today.getTime() - 2 * 60 * 60 * 1000),
        },
        {
          workspaceId: workspace.id,
          conversationId: conversations[1].id,
          authorName: 'Automation PM Bot',
          body: 'Automation health check completed — no alerts triggered.',
          postedAt: new Date(today.getTime() - 60 * 60 * 1000),
        },
      ],
      { transaction },
    );
  }
}

export function mapWorkspaceTaskWithAssignments(taskInstance) {
  if (!taskInstance) {
    return null;
  }
  const task = taskInstance.toPublicObject();
  const assignments = Array.isArray(taskInstance.assignments)
    ? taskInstance.assignments.map((assignment) => assignment.toPublicObject())
    : [];
  return { ...task, assignments };
}

export function groupWorkspaceMessagesByConversation(messages) {
  return messages.reduce((map, message) => {
    const key = message.conversationId;
    const entry = map.get(key) ?? [];
    entry.push(message.toPublicObject());
    map.set(key, entry);
    return map;
  }, new Map());
}

export function mapWorkspaceConversation(conversation, messagesByConversationId) {
  const payload = conversation.toPublicObject();
  payload.messages = messagesByConversationId.get(conversation.id) ?? [];
  return payload;
}

export function buildWorkspaceActivityFeed({ conversations = [], messages = [], timelineEntries = [] } = {}) {
  const activity = [];

  messages
    .slice()
    .sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0))
    .slice(0, 10)
    .forEach((message) => {
      activity.push({
        id: `message-${message.id}`,
        actor: message.authorName ?? 'Workspace',
        message: message.body ?? '',
        timestamp: message.postedAt ?? message.createdAt,
        related: conversations.find((conversation) => conversation.id === message.conversationId)?.topic ?? 'Conversation',
      });
    });

  timelineEntries
    .slice()
    .sort((a, b) => new Date(b.startAt || 0) - new Date(a.startAt || 0))
    .slice(0, 5)
    .forEach((entry) => {
      activity.push({
        id: `timeline-${entry.id}`,
        actor: entry.ownerName ?? 'Timeline',
        message: `${entry.title} ${entry.status ? `(${entry.status.replace(/_/g, ' ')})` : ''}`.trim(),
        timestamp: entry.startAt ?? entry.createdAt,
        related: 'Timeline',
      });
    });

  return activity
    .filter((item) => item.message)
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, 15);
}

export function buildWorkspaceStorageSummary(files = []) {
  const totalSize = files.reduce((total, file) => total + Number(file.sizeBytes || 0), 0);
  const capacity = 512_000_000;
  const usedPercent = capacity ? Number(((totalSize / capacity) * 100).toFixed(1)) : 0;
  return {
    fileCount: files.length,
    totalSize,
    capacity,
    usedPercent,
  };
}
