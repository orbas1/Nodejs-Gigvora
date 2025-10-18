import { Op, fn, col } from 'sequelize';
import {
  sequelize,
  PeerMentoringSession,
  MentoringSessionNote,
  MentoringSessionActionItem,
  User,
  ServiceLine,
  PEER_MENTORING_STATUSES,
  MENTORING_SESSION_NOTE_VISIBILITIES,
  MENTORING_SESSION_ACTION_STATUSES,
  MENTORING_SESSION_ACTION_PRIORITIES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function normaliseId(value, label = 'id') {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${label} must be a positive integer.`);
  }
  return numeric;
}

function normaliseDate(value, label) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${label ?? 'date'} is invalid.`);
  }
  return date;
}

function sanitiseUser(user) {
  if (!user) {
    return null;
  }
  const plain = user.get ? user.get({ plain: true }) : user;
  return {
    id: plain.id,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
    userType: plain.userType ?? null,
  };
}

function sanitiseAttachments(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (!entry) return null;
        if (typeof entry === 'string') {
          return { label: entry, url: entry };
        }
        const label = `${entry.label ?? entry.name ?? ''}`.trim();
        const url = `${entry.url ?? entry.href ?? ''}`.trim();
        if (!url) {
          return null;
        }
        return {
          label: label || url,
          url,
          type: entry.type ?? entry.kind ?? null,
        };
      })
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [{ label: trimmed, url: trimmed }] : [];
  }
  return [];
}

function sanitiseResourceLinks(value) {
  return sanitiseAttachments(value).map((entry) => ({
    ...entry,
    type: entry.type ?? 'resource',
  }));
}

function sanitiseNote(note) {
  const plain = note.get ? note.get({ plain: true }) : note;
  return {
    id: plain.id,
    sessionId: plain.sessionId,
    authorId: plain.authorId ?? null,
    visibility: plain.visibility,
    body: plain.body,
    attachments: sanitiseAttachments(plain.attachments),
    author: sanitiseUser(plain.author),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function sanitiseActionItem(action) {
  const plain = action.get ? action.get({ plain: true }) : action;
  return {
    id: plain.id,
    sessionId: plain.sessionId,
    title: plain.title,
    description: plain.description ?? null,
    status: plain.status,
    priority: plain.priority,
    dueAt: plain.dueAt,
    assigneeId: plain.assigneeId ?? null,
    createdById: plain.createdById ?? null,
    completedAt: plain.completedAt ?? null,
    assignee: sanitiseUser(plain.assignee),
    createdBy: sanitiseUser(plain.createdBy),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function sanitiseSession(session) {
  const plain = session.get({ plain: true });
  return {
    id: plain.id,
    serviceLineId: plain.serviceLineId,
    serviceLine: plain.serviceLine
      ? { id: plain.serviceLine.id, name: plain.serviceLine.name, slug: plain.serviceLine.slug }
      : null,
    mentorId: plain.mentorId,
    mentor: sanitiseUser(plain.mentor),
    menteeId: plain.menteeId,
    mentee: sanitiseUser(plain.mentee),
    adminOwnerId: plain.adminOwnerId ?? null,
    adminOwner: sanitiseUser(plain.adminOwner),
    topic: plain.topic,
    agenda: plain.agenda ?? null,
    scheduledAt: plain.scheduledAt,
    durationMinutes: plain.durationMinutes == null ? null : Number(plain.durationMinutes),
    status: plain.status,
    meetingUrl: plain.meetingUrl ?? null,
    meetingProvider: plain.meetingProvider ?? null,
    recordingUrl: plain.recordingUrl ?? null,
    notesSummary: plain.notes ?? null,
    followUpAt: plain.followUpAt ?? null,
    feedbackRating: plain.feedbackRating == null ? null : Number(plain.feedbackRating),
    feedbackSummary: plain.feedbackSummary ?? null,
    cancellationReason: plain.cancellationReason ?? null,
    resourceLinks: sanitiseResourceLinks(plain.resourceLinks),
    sessionNotes: Array.isArray(plain.sessionNotes) ? plain.sessionNotes.map(sanitiseNote) : [],
    actionItems: Array.isArray(plain.actionItems) ? plain.actionItems.map(sanitiseActionItem) : [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function humanise(value) {
  if (!value) return '';
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function normaliseStatusFilter(status) {
  if (!status) {
    return null;
  }
  if (Array.isArray(status)) {
    const valid = status
      .map((entry) => `${entry}`.trim().toLowerCase())
      .filter((entry) => PEER_MENTORING_STATUSES.includes(entry));
    return valid.length ? valid : null;
  }
  const candidate = `${status}`.trim().toLowerCase();
  return PEER_MENTORING_STATUSES.includes(candidate) ? candidate : null;
}

function buildSearchWhere(search) {
  if (!search) {
    return null;
  }
  const like = Op.iLike ?? Op.like;
  const term = `%${search.toLowerCase()}%`;
  return {
    [Op.or]: [
      { topic: { [like]: term } },
      { agenda: { [like]: term } },
      { meetingProvider: { [like]: term } },
      sequelize.where(fn('LOWER', col('mentor.firstName')), { [Op.like]: term }),
      sequelize.where(fn('LOWER', col('mentor.lastName')), { [Op.like]: term }),
      sequelize.where(fn('LOWER', col('mentee.firstName')), { [Op.like]: term }),
      sequelize.where(fn('LOWER', col('mentee.lastName')), { [Op.like]: term }),
      sequelize.where(fn('LOWER', col('serviceLine.name')), { [Op.like]: term }),
    ],
  };
}

async function fetchUsersByIds(ids) {
  if (!ids?.length) {
    return [];
  }
  const uniqueIds = Array.from(new Set(ids));
  const users = await User.findAll({
    where: { id: { [Op.in]: uniqueIds } },
    attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
    order: [['firstName', 'ASC'], ['lastName', 'ASC']],
  });
  return users.map(sanitiseUser);
}

export async function fetchMentoringCatalog() {
  const [mentorRows, menteeRows, ownerRows, serviceLines] = await Promise.all([
    PeerMentoringSession.findAll({ attributes: ['mentorId'], group: ['mentorId'], raw: true }),
    PeerMentoringSession.findAll({ attributes: ['menteeId'], group: ['menteeId'], raw: true }),
    PeerMentoringSession.findAll({ attributes: ['adminOwnerId'], group: ['adminOwnerId'], raw: true }),
    ServiceLine.findAll({ attributes: ['id', 'name', 'slug'], order: [['name', 'ASC']] }),
  ]);

  const mentorIds = mentorRows.map((row) => row.mentorId).filter(Boolean);
  const menteeIds = menteeRows.map((row) => row.menteeId).filter(Boolean);
  const ownerIds = ownerRows.map((row) => row.adminOwnerId).filter(Boolean);

  const [mentors, mentees, owners] = await Promise.all([
    fetchUsersByIds(mentorIds),
    fetchUsersByIds(menteeIds),
    fetchUsersByIds(ownerIds),
  ]);

  const defaultMeetingProviders = [
    { value: 'zoom', label: 'Zoom' },
    { value: 'google_meet', label: 'Google Meet' },
    { value: 'microsoft_teams', label: 'Microsoft Teams' },
    { value: 'in_person', label: 'In person' },
    { value: 'phone', label: 'Phone' },
    { value: 'other', label: 'Other' },
  ];

  return {
    mentors,
    mentees,
    owners,
    serviceLines: serviceLines.map((line) => ({ id: line.id, name: line.name, slug: line.slug })),
    statuses: PEER_MENTORING_STATUSES.map((status) => ({ value: status, label: humanise(status) })),
    noteVisibilities: MENTORING_SESSION_NOTE_VISIBILITIES.map((value) => ({ value, label: humanise(value) })),
    actionStatuses: MENTORING_SESSION_ACTION_STATUSES.map((value) => ({ value, label: humanise(value) })),
    actionPriorities: MENTORING_SESSION_ACTION_PRIORITIES.map((value) => ({ value, label: humanise(value) })),
    meetingProviders: defaultMeetingProviders,
    defaultDurations: [30, 45, 60, 75, 90, 120],
    roleAllowances: ['admin', 'mentor_operations', 'learning_ops'],
  };
}

export async function listMentoringSessions({
  status,
  mentorId,
  menteeId,
  serviceLineId,
  ownerId,
  from,
  to,
  search,
  page = 1,
  pageSize = 20,
  sort = 'scheduledAt:desc',
} = {}) {
  const normalisedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const normalisedPageSize = Math.min(100, Math.max(1, Number.parseInt(pageSize, 10) || 20));
  const offset = (normalisedPage - 1) * normalisedPageSize;

  const statusFilter = normaliseStatusFilter(status);
  const where = {};

  if (Array.isArray(statusFilter)) {
    where.status = { [Op.in]: statusFilter };
  } else if (statusFilter) {
    where.status = statusFilter;
  }

  const mentorIdNumber = normaliseId(mentorId, 'mentorId');
  if (mentorIdNumber) {
    where.mentorId = mentorIdNumber;
  }

  const menteeIdNumber = normaliseId(menteeId, 'menteeId');
  if (menteeIdNumber) {
    where.menteeId = menteeIdNumber;
  }

  const serviceLineIdNumber = normaliseId(serviceLineId, 'serviceLineId');
  if (serviceLineIdNumber) {
    where.serviceLineId = serviceLineIdNumber;
  }

  const ownerIdNumber = normaliseId(ownerId, 'adminOwnerId');
  if (ownerIdNumber) {
    where.adminOwnerId = ownerIdNumber;
  }

  const fromDate = normaliseDate(from, 'from');
  const toDate = normaliseDate(to, 'to');
  if (fromDate || toDate) {
    where.scheduledAt = {};
    if (fromDate) {
      where.scheduledAt[Op.gte] = fromDate;
    }
    if (toDate) {
      where.scheduledAt[Op.lte] = toDate;
    }
  }

  const searchWhere = buildSearchWhere(search);
  const [sortField, sortDir] = `${sort}`.split(':');
  const allowedSortFields = new Map([
    ['scheduledAt', ['scheduledAt']],
  ]);
  allowedSortFields.set('createdAt', ['createdAt']);
  allowedSortFields.set('updatedAt', ['updatedAt']);
  allowedSortFields.set('status', ['status']);
  const resolvedSort = allowedSortFields.get(sortField) ?? ['scheduledAt'];
  const resolvedDirection = `${sortDir}`.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const sessions = await PeerMentoringSession.findAndCountAll({
    where: searchWhere ? { [Op.and]: [where, searchWhere] } : where,
    include: [
      { model: User, as: 'mentor', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'mentee', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'adminOwner', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: ServiceLine, as: 'serviceLine', attributes: ['id', 'name', 'slug'] },
      {
        model: MentoringSessionNote,
        as: 'sessionNotes',
        separate: true,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] }],
      },
      {
        model: MentoringSessionActionItem,
        as: 'actionItems',
        separate: true,
        order: [['dueAt', 'ASC']],
        include: [
          { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
          { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        ],
      },
    ],
    order: [
      [...resolvedSort, resolvedDirection],
      ['id', 'DESC'],
    ],
    limit: normalisedPageSize,
    offset,
    distinct: true,
  });

  const data = sessions.rows.map(sanitiseSession);

  const [statusBreakdownRows, upcomingCount, followUpsDue, averageFeedbackRow] = await Promise.all([
    PeerMentoringSession.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      where,
      group: ['status'],
      raw: true,
    }),
    PeerMentoringSession.count({ where: { ...where, status: 'scheduled', scheduledAt: { [Op.gte]: new Date() } } }),
    PeerMentoringSession.count({ where: { ...where, followUpAt: { [Op.not]: null, [Op.lte]: new Date() } } }),
    PeerMentoringSession.findOne({
      attributes: [[fn('AVG', col('feedbackRating')), 'average']],
      where: { ...where, feedbackRating: { [Op.not]: null } },
      raw: true,
    }),
  ]);

  const totalsByStatus = statusBreakdownRows.reduce((acc, row) => {
    acc[row.status] = Number(row.count ?? 0);
    return acc;
  }, {});

  const openActionItems = data
    .flatMap((session) => session.actionItems.map((item) => ({ ...item, sessionId: session.id, session })))
    .filter((item) => ['pending', 'in_progress'].includes(item.status))
    .sort((a, b) => {
      const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
      return aDue - bDue;
    })
    .slice(0, 50);

  return {
    data,
    pagination: {
      page: normalisedPage,
      pageSize: normalisedPageSize,
      total: sessions.count,
      totalPages: Math.ceil(sessions.count / normalisedPageSize) || 1,
    },
    metrics: {
      totalsByStatus,
      upcomingCount,
      followUpsDue,
      averageFeedback: averageFeedbackRow?.average ? Number(parseFloat(averageFeedbackRow.average).toFixed(2)) : null,
      openActionItems: openActionItems.length,
    },
    actionQueue: openActionItems,
  };
}

export async function getMentoringSession(sessionId) {
  const id = normaliseId(sessionId, 'sessionId');
  const session = await PeerMentoringSession.findByPk(id, {
    include: [
      { model: User, as: 'mentor', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'mentee', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'adminOwner', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: ServiceLine, as: 'serviceLine', attributes: ['id', 'name', 'slug'] },
      {
        model: MentoringSessionNote,
        as: 'sessionNotes',
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] }],
      },
      {
        model: MentoringSessionActionItem,
        as: 'actionItems',
        order: [['dueAt', 'ASC']],
        include: [
          { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
          { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        ],
      },
    ],
  });

  if (!session) {
    throw new NotFoundError('Mentoring session not found.');
  }

  return sanitiseSession(session);
}

export async function createMentoringSession({
  mentorId,
  menteeId,
  serviceLineId,
  adminOwnerId,
  topic,
  agenda,
  scheduledAt,
  durationMinutes,
  status,
  meetingUrl,
  meetingProvider,
  recordingUrl,
  notesSummary,
  followUpAt,
  feedbackRating,
  feedbackSummary,
  resourceLinks,
  actionItems = [],
  sessionNotes = [],
}) {
  const mentorIdNumber = normaliseId(mentorId, 'mentorId');
  const menteeIdNumber = normaliseId(menteeId, 'menteeId');
  if (!mentorIdNumber) {
    throw new ValidationError('mentorId is required.');
  }
  if (!menteeIdNumber) {
    throw new ValidationError('menteeId is required.');
  }
  if (!topic || !topic.trim()) {
    throw new ValidationError('topic is required.');
  }
  const scheduledDate = normaliseDate(scheduledAt, 'scheduledAt');
  if (!scheduledDate) {
    throw new ValidationError('scheduledAt is required.');
  }

  const serviceLineIdNumber = normaliseId(serviceLineId, 'serviceLineId');
  const adminOwnerIdNumber = normaliseId(adminOwnerId, 'adminOwnerId');
  const followUpDate = normaliseDate(followUpAt, 'followUpAt');

  const payload = {
    mentorId: mentorIdNumber,
    menteeId: menteeIdNumber,
    serviceLineId: serviceLineIdNumber,
    adminOwnerId: adminOwnerIdNumber,
    topic: topic.trim(),
    agenda: agenda ?? null,
    scheduledAt: scheduledDate,
    durationMinutes: durationMinutes == null ? null : Number(durationMinutes),
    status: normaliseStatusFilter(status) ?? 'scheduled',
    meetingUrl: meetingUrl ?? null,
    meetingProvider: meetingProvider ?? null,
    recordingUrl: recordingUrl ?? null,
    notes: notesSummary ?? null,
    followUpAt: followUpDate,
    feedbackRating: feedbackRating == null ? null : Number(feedbackRating),
    feedbackSummary: feedbackSummary ?? null,
    resourceLinks: sanitiseResourceLinks(resourceLinks),
  };

  if (payload.feedbackRating != null) {
    if (Number.isNaN(payload.feedbackRating) || payload.feedbackRating < 0 || payload.feedbackRating > 5) {
      throw new ValidationError('feedbackRating must be between 0 and 5.');
    }
  }

  const result = await sequelize.transaction(async (transaction) => {
    const session = await PeerMentoringSession.create(payload, { transaction });

    if (Array.isArray(sessionNotes) && sessionNotes.length) {
      const notePayload = sessionNotes
        .filter((entry) => entry?.body)
        .map((entry) => ({
          sessionId: session.id,
          authorId: normaliseId(entry.authorId, 'authorId'),
          visibility: MENTORING_SESSION_NOTE_VISIBILITIES.includes(entry.visibility)
            ? entry.visibility
            : 'internal',
          body: entry.body,
          attachments: sanitiseAttachments(entry.attachments),
        }));
      if (notePayload.length) {
        await MentoringSessionNote.bulkCreate(notePayload, { transaction });
      }
    }

    if (Array.isArray(actionItems) && actionItems.length) {
      const actionPayload = actionItems
        .filter((entry) => entry?.title)
        .map((entry) => {
          const statusValue = MENTORING_SESSION_ACTION_STATUSES.includes(entry.status)
            ? entry.status
            : 'pending';
          return {
            sessionId: session.id,
            title: entry.title,
            description: entry.description ?? null,
            status: statusValue,
            priority: MENTORING_SESSION_ACTION_PRIORITIES.includes(entry.priority)
              ? entry.priority
              : 'normal',
            dueAt: normaliseDate(entry.dueAt, 'dueAt'),
            assigneeId: normaliseId(entry.assigneeId, 'assigneeId'),
            createdById: normaliseId(entry.createdById, 'createdById'),
            completedAt:
              statusValue === 'completed' ? normaliseDate(entry.completedAt, 'completedAt') ?? new Date() : null,
          };
        });
      if (actionPayload.length) {
        await MentoringSessionActionItem.bulkCreate(actionPayload, { transaction });
      }
    }

    const hydrated = await PeerMentoringSession.findByPk(session.id, {
      include: [
        { model: User, as: 'mentor', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'mentee', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'adminOwner', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: ServiceLine, as: 'serviceLine', attributes: ['id', 'name', 'slug'] },
        {
          model: MentoringSessionNote,
          as: 'sessionNotes',
          order: [['createdAt', 'DESC']],
          include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] }],
        },
        {
          model: MentoringSessionActionItem,
          as: 'actionItems',
          order: [['dueAt', 'ASC']],
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
            { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
          ],
        },
      ],
      transaction,
    });

    return sanitiseSession(hydrated);
  });

  return result;
}

export async function updateMentoringSession(sessionId, updates) {
  const id = normaliseId(sessionId, 'sessionId');
  const session = await PeerMentoringSession.findByPk(id);
  if (!session) {
    throw new NotFoundError('Mentoring session not found.');
  }

  const payload = {};
  if (updates.topic != null) {
    if (!updates.topic.trim()) {
      throw new ValidationError('topic cannot be empty.');
    }
    payload.topic = updates.topic.trim();
  }
  if (updates.agenda !== undefined) {
    payload.agenda = updates.agenda ?? null;
  }
  if (updates.status) {
    const statusValue = normaliseStatusFilter(updates.status);
    if (!statusValue) {
      throw new ValidationError('Invalid status provided.');
    }
    payload.status = statusValue;
  }
  if (updates.meetingUrl !== undefined) {
    payload.meetingUrl = updates.meetingUrl ?? null;
  }
  if (updates.meetingProvider !== undefined) {
    payload.meetingProvider = updates.meetingProvider ?? null;
  }
  if (updates.recordingUrl !== undefined) {
    payload.recordingUrl = updates.recordingUrl ?? null;
  }
  if (updates.notesSummary !== undefined) {
    payload.notes = updates.notesSummary ?? null;
  }
  if (updates.durationMinutes !== undefined) {
    payload.durationMinutes = updates.durationMinutes == null ? null : Number(updates.durationMinutes);
  }
  if (updates.scheduledAt !== undefined) {
    payload.scheduledAt = normaliseDate(updates.scheduledAt, 'scheduledAt');
  }
  if (updates.followUpAt !== undefined) {
    payload.followUpAt = updates.followUpAt ? normaliseDate(updates.followUpAt, 'followUpAt') : null;
  }
  if (updates.feedbackRating !== undefined) {
    if (updates.feedbackRating == null || updates.feedbackRating === '') {
      payload.feedbackRating = null;
    } else {
      const rating = Number(updates.feedbackRating);
      if (Number.isNaN(rating) || rating < 0 || rating > 5) {
        throw new ValidationError('feedbackRating must be between 0 and 5.');
      }
      payload.feedbackRating = rating;
    }
  }
  if (updates.feedbackSummary !== undefined) {
    payload.feedbackSummary = updates.feedbackSummary ?? null;
  }
  if (updates.cancellationReason !== undefined) {
    payload.cancellationReason = updates.cancellationReason ?? null;
  }
  if (updates.serviceLineId !== undefined) {
    payload.serviceLineId = normaliseId(updates.serviceLineId, 'serviceLineId');
  }
  if (updates.adminOwnerId !== undefined) {
    payload.adminOwnerId = normaliseId(updates.adminOwnerId, 'adminOwnerId');
  }
  if (updates.resourceLinks !== undefined) {
    payload.resourceLinks = sanitiseResourceLinks(updates.resourceLinks);
  }

  await session.update(payload);
  return getMentoringSession(session.id);
}

export async function createSessionNote(sessionId, { authorId, visibility, body, attachments }) {
  const id = normaliseId(sessionId, 'sessionId');
  const session = await PeerMentoringSession.findByPk(id);
  if (!session) {
    throw new NotFoundError('Mentoring session not found.');
  }
  if (!body || !body.trim()) {
    throw new ValidationError('Note body is required.');
  }

  const note = await MentoringSessionNote.create({
    sessionId: id,
    authorId: normaliseId(authorId, 'authorId'),
    visibility: MENTORING_SESSION_NOTE_VISIBILITIES.includes(visibility) ? visibility : 'internal',
    body,
    attachments: sanitiseAttachments(attachments),
  });

  const hydrated = await MentoringSessionNote.findByPk(note.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] }],
  });

  return sanitiseNote(hydrated);
}

export async function updateSessionNote(sessionId, noteId, { visibility, body, attachments }) {
  const sessionIdNumber = normaliseId(sessionId, 'sessionId');
  const noteIdNumber = normaliseId(noteId, 'noteId');
  const note = await MentoringSessionNote.findByPk(noteIdNumber);
  if (!note || note.sessionId !== sessionIdNumber) {
    throw new NotFoundError('Mentoring note not found.');
  }

  const payload = {};
  if (visibility) {
    if (!MENTORING_SESSION_NOTE_VISIBILITIES.includes(visibility)) {
      throw new ValidationError('Invalid note visibility.');
    }
    payload.visibility = visibility;
  }
  if (body !== undefined) {
    if (!body || !body.trim()) {
      throw new ValidationError('Note body cannot be empty.');
    }
    payload.body = body;
  }
  if (attachments !== undefined) {
    payload.attachments = sanitiseAttachments(attachments);
  }

  await note.update(payload);
  return sanitiseNote(await note.reload({
    include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] }],
  }));
}

export async function deleteSessionNote(sessionId, noteId) {
  const sessionIdNumber = normaliseId(sessionId, 'sessionId');
  const noteIdNumber = normaliseId(noteId, 'noteId');
  const note = await MentoringSessionNote.findByPk(noteIdNumber);
  if (!note || note.sessionId !== sessionIdNumber) {
    throw new NotFoundError('Mentoring note not found.');
  }
  await note.destroy();
  return { success: true };
}

export async function createActionItem(sessionId, payload) {
  const id = normaliseId(sessionId, 'sessionId');
  const session = await PeerMentoringSession.findByPk(id);
  if (!session) {
    throw new NotFoundError('Mentoring session not found.');
  }
  if (!payload?.title) {
    throw new ValidationError('Action item title is required.');
  }

  const statusValue = payload.status && MENTORING_SESSION_ACTION_STATUSES.includes(payload.status)
    ? payload.status
    : 'pending';
  const priorityValue = payload.priority && MENTORING_SESSION_ACTION_PRIORITIES.includes(payload.priority)
    ? payload.priority
    : 'normal';

  const action = await MentoringSessionActionItem.create({
    sessionId: id,
    title: payload.title,
    description: payload.description ?? null,
    status: statusValue,
    priority: priorityValue,
    dueAt: normaliseDate(payload.dueAt, 'dueAt'),
    assigneeId: normaliseId(payload.assigneeId, 'assigneeId'),
    createdById: normaliseId(payload.createdById, 'createdById'),
    completedAt: statusValue === 'completed' ? new Date() : null,
  });

  const hydrated = await MentoringSessionActionItem.findByPk(action.id, {
    include: [
      { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });

  return sanitiseActionItem(hydrated);
}

export async function updateActionItem(sessionId, actionId, payload) {
  const sessionIdNumber = normaliseId(sessionId, 'sessionId');
  const actionIdNumber = normaliseId(actionId, 'actionId');
  const action = await MentoringSessionActionItem.findByPk(actionIdNumber);
  if (!action || action.sessionId !== sessionIdNumber) {
    throw new NotFoundError('Mentoring action item not found.');
  }

  const updates = {};
  if (payload.title !== undefined) {
    if (!payload.title.trim()) {
      throw new ValidationError('Action item title cannot be empty.');
    }
    updates.title = payload.title.trim();
  }
  if (payload.description !== undefined) {
    updates.description = payload.description ?? null;
  }
  if (payload.status) {
    if (!MENTORING_SESSION_ACTION_STATUSES.includes(payload.status)) {
      throw new ValidationError('Invalid action item status.');
    }
    updates.status = payload.status;
    if (payload.status === 'completed') {
      updates.completedAt = payload.completedAt ? normaliseDate(payload.completedAt, 'completedAt') : new Date();
    } else if (payload.status === 'cancelled') {
      updates.completedAt = normaliseDate(payload.completedAt, 'completedAt');
    } else {
      updates.completedAt = null;
    }
  }
  if (payload.priority) {
    if (!MENTORING_SESSION_ACTION_PRIORITIES.includes(payload.priority)) {
      throw new ValidationError('Invalid action item priority.');
    }
    updates.priority = payload.priority;
  }
  if (payload.dueAt !== undefined) {
    updates.dueAt = payload.dueAt ? normaliseDate(payload.dueAt, 'dueAt') : null;
  }
  if (payload.assigneeId !== undefined) {
    updates.assigneeId = normaliseId(payload.assigneeId, 'assigneeId');
  }
  if (payload.createdById !== undefined) {
    updates.createdById = normaliseId(payload.createdById, 'createdById');
  }

  await action.update(updates);
  const hydrated = await action.reload({
    include: [
      { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });
  return sanitiseActionItem(hydrated);
}

export async function deleteActionItem(sessionId, actionId) {
  const sessionIdNumber = normaliseId(sessionId, 'sessionId');
  const actionIdNumber = normaliseId(actionId, 'actionId');
  const action = await MentoringSessionActionItem.findByPk(actionIdNumber);
  if (!action || action.sessionId !== sessionIdNumber) {
    throw new NotFoundError('Mentoring action item not found.');
  }
  await action.destroy();
  return { success: true };
}

export default {
  fetchMentoringCatalog,
  listMentoringSessions,
  getMentoringSession,
  createMentoringSession,
  updateMentoringSession,
  createSessionNote,
  updateSessionNote,
  deleteSessionNote,
  createActionItem,
  updateActionItem,
  deleteActionItem,
};
