import {
  getWorkspaceProjectsList,
  getWorkspaceManagementSnapshot,
  createWorkspaceEntity,
  updateWorkspaceEntity,
  deleteWorkspaceEntity,
} from '../services/projectWorkspaceManagementService.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import {
  ensurePlainObject,
  ensureProjectManagementAccess,
  parsePositiveInteger,
  respondWithAccess,
  sanitizeActorPayload,
} from '../utils/controllerAccess.js';

const ENTITY_ALIASES = new Map([
  ['budgetlines', 'budget-lines'],
  ['budget-line', 'budget-lines'],
  ['budget_line', 'budget-lines'],
  ['objectives', 'objectives'],
  ['objective', 'objectives'],
  ['tasks', 'tasks'],
  ['task', 'tasks'],
  ['meetings', 'meetings'],
  ['meeting', 'meetings'],
  ['calendar', 'calendar-events'],
  ['calendar-events', 'calendar-events'],
  ['calendar_event', 'calendar-events'],
  ['roles', 'role-assignments'],
  ['role-assignments', 'role-assignments'],
  ['role_assignment', 'role-assignments'],
  ['submissions', 'submissions'],
  ['submission', 'submissions'],
  ['invites', 'invites'],
  ['invite', 'invites'],
  ['hr-records', 'hr-records'],
  ['hr_record', 'hr-records'],
  ['time-entries', 'time-entries'],
  ['time_entry', 'time-entries'],
  ['objects', 'objects'],
  ['object', 'objects'],
  ['documents', 'documents'],
  ['document', 'documents'],
  ['chat-messages', 'chat-messages'],
  ['chat_message', 'chat-messages'],
  ['summary', 'summary'],
  ['integrations', 'integrations'],
]);

function normaliseEntityKey(rawValue) {
  if (!rawValue) {
    throw new ValidationError('entity is required.');
  }
  const slug = String(rawValue)
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');
  const resolved = ENTITY_ALIASES.get(slug) ?? slug;
  if (!ENTITY_ALIASES.has(resolved) && !ENTITY_ALIASES.has(slug)) {
    ENTITY_ALIASES.set(resolved, resolved);
  }
  return resolved;
}

function parseOptionalProjectId(value) {
  return parsePositiveInteger(value, 'projectId', { optional: true });
}

async function fetchWorkspace(projectId) {
  if (!projectId) {
    return null;
  }
  try {
    return await getWorkspaceManagementSnapshot(projectId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }
    throw error;
  }
}

function withActorOverride(context, actorId) {
  if (!actorId) {
    return context;
  }
  return { ...context, actorId };
}

export async function index(req, res) {
  const access = ensureProjectManagementAccess(req);
  const requestedProjectId = parseOptionalProjectId(req.query?.projectId);
  const projects = await getWorkspaceProjectsList();

  const fallbackProjectId = projects.length > 0 ? parseOptionalProjectId(projects[0]?.id) ?? projects[0]?.id : null;
  const selectedProjectId = requestedProjectId ?? fallbackProjectId ?? null;
  const workspace = await fetchWorkspace(selectedProjectId);

  respondWithAccess(
    res,
    {
      projects,
      workspace,
      selectedProjectId: workspace?.project?.id ?? selectedProjectId ?? null,
    },
    access,
  );
}

export async function show(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parsePositiveInteger(req.params?.projectId, 'projectId');
  const workspace = await getWorkspaceManagementSnapshot(projectId);

  respondWithAccess(
    res,
    {
      workspace,
      selectedProjectId: workspace?.project?.id ?? projectId,
    },
    access,
  );
}

async function mutateEntity(req, res, handler, { status = 200 } = {}) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parsePositiveInteger(req.params?.projectId, 'projectId');
  const { actorId, payload } = sanitizeActorPayload(req.body, access);
  const entityKey = normaliseEntityKey(req.params?.entity);
  const context = withActorOverride(access, actorId);

  const result = await handler({ projectId, entityKey, payload });
  const workspace = await fetchWorkspace(projectId);

  respondWithAccess(
    res,
    {
      entity: entityKey,
      record: result ?? null,
      workspace,
    },
    context,
    { status, performedBy: actorId ?? undefined },
  );
}

export async function create(req, res) {
  await mutateEntity(
    req,
    res,
    async ({ projectId, entityKey, payload }) =>
      createWorkspaceEntity(projectId, entityKey, ensurePlainObject(payload, 'workspace entity')),
    { status: 201 },
  );
}

export async function update(req, res) {
  await mutateEntity(req, res, async ({ projectId, entityKey, payload }) => {
    const recordId = parsePositiveInteger(req.params?.recordId, 'recordId', { optional: true });
    return updateWorkspaceEntity(
      projectId,
      entityKey,
      recordId,
      ensurePlainObject(payload, 'workspace entity update'),
    );
  });
}

export async function destroy(req, res) {
  const access = ensureProjectManagementAccess(req);
  const projectId = parsePositiveInteger(req.params?.projectId, 'projectId');
  const entityKey = normaliseEntityKey(req.params?.entity);
  const recordId = parsePositiveInteger(req.params?.recordId, 'recordId');

  await deleteWorkspaceEntity(projectId, entityKey, recordId);
  const workspace = await fetchWorkspace(projectId);

  respondWithAccess(
    res,
    {
      entity: entityKey,
      removedRecordId: recordId,
      workspace,
    },
    access,
    { status: 200 },
  );
}

export default {
  index,
  show,
  create,
  update,
  destroy,
};
