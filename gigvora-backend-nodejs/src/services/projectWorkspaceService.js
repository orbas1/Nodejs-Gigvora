import {
  Project,
  ProjectWorkspace,
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

export default {
  initializeWorkspaceForProject,
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
