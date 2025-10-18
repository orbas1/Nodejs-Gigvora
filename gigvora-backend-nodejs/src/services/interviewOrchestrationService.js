import crypto from 'crypto';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function generateId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function normaliseDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date provided.');
  }
  return date.toISOString();
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

const interviewRooms = new Map();
const interviewWorkflows = new Map();
const interviewPanelTemplates = new Map();
const candidatePrepPortals = new Map();

function normaliseString(value, fallback = '') {
  if (value == null) {
    return fallback;
  }
  const stringValue = `${value}`.trim();
  return stringValue.length ? stringValue : fallback;
}

function seedDefaults() {
  if (interviewRooms.size || interviewWorkflows.size) {
    return;
  }

  const roomId = 'room_enterprise_final_loop';
  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + 6);

  interviewRooms.set(roomId, {
    id: roomId,
    companyId: 501,
    jobId: 9824,
    candidateId: 3012,
    stage: 'Founder loop',
    status: 'scheduled',
    scheduledAt: scheduledAt.toISOString(),
    videoBridgeUrl: 'https://video.gigvora.com/rooms/room_enterprise_final_loop',
    hdEnabled: true,
    recordingEnabled: true,
    workspaceId: 'workspace_enterprise_recruiting',
    agenda: 'Deep dive on product instincts, collaboration rituals, and roadmap leadership.',
    participants: [
      {
        id: 'participant_candidate',
        participantType: 'candidate',
        name: 'Amina Al-Farsi',
        email: 'amina@example.com',
        role: 'Senior Product Lead candidate',
        status: 'confirmed',
        joinUrl: 'https://video.gigvora.com/join/room_enterprise_final_loop/candidate',
        videoDevice: 'Web • Auto HD',
      },
      {
        id: 'participant_hiring_manager',
        participantType: 'company_member',
        memberId: 2101,
        name: 'Lena Torres',
        email: 'lena.torres@gigvora.com',
        role: 'Hiring manager',
        status: 'confirmed',
        joinUrl: 'https://video.gigvora.com/join/room_enterprise_final_loop/hm',
        videoDevice: 'Desktop • 1080p',
        isModerator: true,
      },
      {
        id: 'participant_panelist_1',
        participantType: 'company_member',
        memberId: 2102,
        name: 'Marco Chen',
        email: 'marco.chen@gigvora.com',
        role: 'Design director',
        status: 'accepted',
        joinUrl: 'https://video.gigvora.com/join/room_enterprise_final_loop/design',
        videoDevice: 'Tablet • 720p',
      },
      {
        id: 'participant_panelist_2',
        participantType: 'company_member',
        memberId: 2103,
        name: 'Priya Desai',
        email: 'priya.desai@gigvora.com',
        role: 'Engineering manager',
        status: 'accepted',
        joinUrl: 'https://video.gigvora.com/join/room_enterprise_final_loop/eng',
        videoDevice: 'Desktop • 1080p',
      },
      {
        id: 'participant_coordinator',
        participantType: 'company_member',
        memberId: 2055,
        name: 'Noah Williams',
        email: 'noah.williams@gigvora.com',
        role: 'Recruiting coordinator',
        status: 'confirmed',
        joinUrl: 'https://video.gigvora.com/join/room_enterprise_final_loop/coord',
        videoDevice: 'Web • HD',
      },
    ],
    checklist: [
      {
        id: 'check_scorecard_linked',
        label: 'Scorecard ready with core competencies',
        description: 'Verify the structured rubric and weightings before the panel starts.',
        status: 'completed',
        ownerName: 'Noah Williams',
        completedAt: new Date().toISOString(),
      },
      {
        id: 'check_candidate_brief',
        label: 'Candidate experience checklist reviewed',
        description: 'Confirm we sent the personalised prep portal and logistics.',
        status: 'in_progress',
        ownerName: 'Lena Torres',
        completedAt: null,
      },
      {
        id: 'check_panel_alignment',
        label: 'Panel calibration sync complete',
        description: 'Alignment on signal ownership, anti-bias reminders, and go/no-go criteria.',
        status: 'pending',
        ownerName: 'Marco Chen',
        completedAt: null,
      },
    ],
    qualitySignals: {
      networkStability: 'excellent',
      bandwidthMbps: 62,
      recordingsQueued: 2,
      autoRecordingEnabled: true,
      transcriptionEnabled: true,
      backupsReady: true,
    },
  });

  const workspaceId = 'workspace_enterprise_recruiting';

  interviewWorkflows.set(workspaceId, {
    workspaceId: 'workspace_enterprise_recruiting',
    name: 'Enterprise hiring workflow',
    lanes: [
      {
        id: 'lane_screen',
        name: 'Recruiter screen',
        orderIndex: 1,
        color: '#38bdf8',
        slaMinutes: 48 * 60,
        cards: [
          {
            id: 'card_ari_akintola',
            candidateId: 4311,
            candidateName: 'Ari Akintola',
            jobTitle: 'Senior Product Lead',
            scheduledAt: new Date(Date.now() + 3600 * 1000 * 12).toISOString(),
            ownerName: 'Noah Williams',
            status: 'awaiting_feedback',
            stage: 'Recruiter screen',
          },
        ],
      },
      {
        id: 'lane_panel',
        name: 'Panel loop',
        orderIndex: 2,
        color: '#6366f1',
        slaMinutes: 72 * 60,
        cards: [
          {
            id: 'card_amira',
            candidateId: 3012,
            candidateName: 'Amina Al-Farsi',
            jobTitle: 'Senior Product Lead',
            scheduledAt: scheduledAt.toISOString(),
            ownerName: 'Lena Torres',
            status: 'scheduled',
            stage: 'Founder loop',
          },
          {
            id: 'card_jacob',
            candidateId: 3022,
            candidateName: 'Jacob Idris',
            jobTitle: 'Senior Product Lead',
            scheduledAt: new Date(Date.now() + 3600 * 1000 * 24).toISOString(),
            ownerName: 'Priya Desai',
            status: 'awaiting_feedback',
            stage: 'Panel debrief',
          },
        ],
      },
      {
        id: 'lane_final',
        name: 'Executive review',
        orderIndex: 3,
        color: '#f97316',
        slaMinutes: 96 * 60,
        cards: [
          {
            id: 'card_naomi',
            candidateId: 3034,
            candidateName: 'Naomi Rivers',
            jobTitle: 'Product Director',
            scheduledAt: new Date(Date.now() + 3600 * 1000 * 36).toISOString(),
            ownerName: 'CEO Panel',
            status: 'needs_scheduling',
            stage: 'Executive alignment',
          },
        ],
      },
      {
        id: 'lane_offer',
        name: 'Offer orchestration',
        orderIndex: 4,
        color: '#22c55e',
        slaMinutes: 48 * 60,
        cards: [
          {
            id: 'card_laila',
            candidateId: 2999,
            candidateName: 'Laila Rahman',
            jobTitle: 'Growth PM',
            scheduledAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
            ownerName: 'People Ops',
            status: 'offer_sent',
            stage: 'Offer negotiation',
          },
        ],
      },
    ],
  });

  interviewPanelTemplates.set('template_founder_loop', {
    id: 'template_founder_loop',
    workspaceId,
    name: 'Founder loop',
    stage: 'Executive review',
    durationMinutes: 120,
    interviewerRoster: [
      { id: 'panel_lena', name: 'Lena Torres', title: 'Hiring manager' },
      { id: 'panel_priya', name: 'Priya Desai', title: 'Engineering manager' },
    ],
    focusAreas: ['Leadership', 'Product sense', 'Systems thinking'],
    notes: 'Calibrate expectations on executive partnership before final approval.',
    updatedAt: new Date().toISOString(),
  });

  interviewPanelTemplates.set('template_panel_sync', {
    id: 'template_panel_sync',
    workspaceId,
    name: 'Panel sync',
    stage: 'Panel loop',
    durationMinutes: 90,
    interviewerRoster: [
      { id: 'panel_noah', name: 'Noah Williams', title: 'Recruiting coordinator' },
      { id: 'panel_marco', name: 'Marco Chen', title: 'Design director' },
    ],
    focusAreas: ['Collaboration', 'Communication', 'Execution'],
    notes: 'Share briefing packet and expectations 24 hours ahead.',
    updatedAt: new Date().toISOString(),
  });

  candidatePrepPortals.set('prep_ari', {
    id: 'prep_ari',
    workspaceId,
    title: 'Ari Akintola – Screen',
    status: 'active',
    shareUrl: 'https://gigvora.com/prep/ari-akintola',
    resources: [
      { id: 'resource_agenda', label: 'Agenda', url: 'https://cdn.gigvora.com/prep/ari-agenda.pdf' },
      { id: 'resource_story', label: 'Team intro', url: 'https://cdn.gigvora.com/prep/team-intro.mp4' },
    ],
    checklist: ['Confirm schedule', 'Share questions'],
    updatedAt: new Date().toISOString(),
  });

  candidatePrepPortals.set('prep_amira', {
    id: 'prep_amira',
    workspaceId,
    title: 'Amina Al-Farsi – Loop',
    status: 'active',
    shareUrl: 'https://gigvora.com/prep/amina-al-farsi',
    resources: [
      { id: 'resource_playbook', label: 'Interview playbook', url: 'https://cdn.gigvora.com/prep/final-loop.pdf' },
    ],
    checklist: ['Confirm travel', 'Upload portfolio'],
    updatedAt: new Date().toISOString(),
  });
}

function ensureRoomExists(roomId) {
  seedDefaults();
  const room = interviewRooms.get(roomId);
  if (!room) {
    throw new NotFoundError('Interview room not found.');
  }
  return room;
}

export function getInterviewRoom(roomId) {
  if (!roomId) {
    throw new ValidationError('roomId is required.');
  }
  const room = ensureRoomExists(roomId);
  return clone(room);
}

export function createInterviewRoom(payload = {}) {
  seedDefaults();
  const id = payload.id || generateId('room');
  const scheduledAt = payload.scheduledAt ? normaliseDate(payload.scheduledAt) : null;

  const room = {
    id,
    companyId: payload.companyId ?? null,
    jobId: payload.jobId ?? null,
    candidateId: payload.candidateId ?? null,
    stage: payload.stage || 'Interview',
    status: payload.status || 'scheduled',
    scheduledAt,
    workspaceId: payload.workspaceId || 'workspace_enterprise_recruiting',
    videoBridgeUrl:
      payload.videoBridgeUrl || `https://video.gigvora.com/rooms/${id}`,
    hdEnabled: payload.hdEnabled !== false,
    recordingEnabled: payload.recordingEnabled !== false,
    agenda: payload.agenda || null,
    participants: Array.isArray(payload.participants) ? payload.participants : [],
    checklist: Array.isArray(payload.checklist) ? payload.checklist : [],
    qualitySignals: payload.qualitySignals || {
      networkStability: 'excellent',
      bandwidthMbps: 48,
      recordingsQueued: 0,
      autoRecordingEnabled: true,
      transcriptionEnabled: true,
      backupsReady: true,
    },
  };

  interviewRooms.set(id, room);
  return clone(room);
}

export function upsertInterviewRoom(roomId, payload = {}) {
  if (!roomId) {
    throw new ValidationError('roomId is required.');
  }
  seedDefaults();
  const existing = interviewRooms.get(roomId) || createInterviewRoom({ id: roomId });
  const scheduledAt = payload.scheduledAt ? normaliseDate(payload.scheduledAt) : existing.scheduledAt;

  const updated = {
    ...existing,
    ...payload,
    scheduledAt,
    hdEnabled: payload.hdEnabled ?? existing.hdEnabled,
    recordingEnabled: payload.recordingEnabled ?? existing.recordingEnabled,
  };

  if (payload.participants) {
    updated.participants = Array.isArray(payload.participants) ? payload.participants : existing.participants;
  }

  if (payload.checklist) {
    updated.checklist = Array.isArray(payload.checklist) ? payload.checklist : existing.checklist;
  }

  interviewRooms.set(roomId, updated);
  return clone(updated);
}

export function addInterviewParticipant(roomId, payload = {}) {
  const room = ensureRoomExists(roomId);
  if (!payload.name) {
    throw new ValidationError('Participant name is required.');
  }

  const participant = {
    id: payload.id || generateId('participant'),
    participantType: payload.participantType || 'company_member',
    memberId: payload.memberId ?? null,
    name: payload.name,
    email: payload.email ?? null,
    role: payload.role ?? null,
    status: payload.status || 'invited',
    joinUrl: payload.joinUrl || `${room.videoBridgeUrl}/participant/${crypto.randomUUID()}`,
    videoDevice: payload.videoDevice || 'Web • Auto HD',
    isModerator: Boolean(payload.isModerator),
  };

  const updated = {
    ...room,
    participants: [...room.participants.filter((item) => item.id !== participant.id), participant],
  };

  interviewRooms.set(roomId, updated);
  return clone(participant);
}

export function updateChecklistItem(roomId, itemId, payload = {}) {
  const room = ensureRoomExists(roomId);
  if (!itemId) {
    throw new ValidationError('Checklist item id is required.');
  }

  const items = Array.isArray(room.checklist) ? room.checklist : [];
  const index = items.findIndex((item) => item.id === itemId);
  if (index === -1) {
    throw new NotFoundError('Checklist item not found.');
  }

  const nextStatus = payload.status || items[index].status;
  const allowedStatuses = ['pending', 'in_progress', 'completed'];
  if (!allowedStatuses.includes(nextStatus)) {
    throw new ValidationError('Invalid checklist status.');
  }

  const updatedItem = {
    ...items[index],
    status: nextStatus,
    ownerName: payload.ownerName ?? items[index].ownerName ?? null,
    completedAt: nextStatus === 'completed' ? new Date().toISOString() : null,
  };

  const updated = { ...room, checklist: [...items] };
  updated.checklist[index] = updatedItem;
  interviewRooms.set(roomId, updated);
  return clone(updatedItem);
}

export function listInterviewRooms(workspaceId) {
  seedDefaults();
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }
  const rooms = Array.from(interviewRooms.values()).filter((room) => room.workspaceId === workspaceId);
  rooms.sort((a, b) => {
    const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
    const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
    return aTime - bTime;
  });
  return rooms.map((room) => clone(room));
}

export function deleteInterviewRoom(roomId) {
  if (!roomId) {
    throw new ValidationError('roomId is required.');
  }
  seedDefaults();
  const existed = interviewRooms.delete(roomId);
  if (!existed) {
    throw new NotFoundError('Interview room not found.');
  }
  return { id: roomId };
}

export function updateInterviewParticipant(roomId, participantId, payload = {}) {
  if (!participantId) {
    throw new ValidationError('participantId is required.');
  }
  const room = ensureRoomExists(roomId);
  const participants = Array.isArray(room.participants) ? room.participants : [];
  const index = participants.findIndex((item) => item.id === participantId);
  if (index === -1) {
    throw new NotFoundError('Participant not found.');
  }

  const nextStatus = payload.status ?? participants[index].status ?? 'invited';
  const allowedStatuses = ['invited', 'accepted', 'confirmed', 'declined'];
  if (!allowedStatuses.includes(nextStatus)) {
    throw new ValidationError('Invalid participant status.');
  }

  const updatedParticipant = {
    ...participants[index],
    participantType: payload.participantType ?? participants[index].participantType ?? 'company_member',
    name: normaliseString(payload.name, participants[index].name ?? ''),
    email: payload.email ?? participants[index].email ?? null,
    role: payload.role ?? participants[index].role ?? null,
    status: nextStatus,
    joinUrl: payload.joinUrl ?? participants[index].joinUrl ?? null,
    videoDevice: payload.videoDevice ?? participants[index].videoDevice ?? null,
    isModerator: payload.isModerator ?? participants[index].isModerator ?? false,
  };

  const updated = { ...room, participants: [...participants] };
  updated.participants[index] = updatedParticipant;
  interviewRooms.set(roomId, updated);
  return clone(updatedParticipant);
}

export function removeInterviewParticipant(roomId, participantId) {
  if (!participantId) {
    throw new ValidationError('participantId is required.');
  }
  const room = ensureRoomExists(roomId);
  const participants = Array.isArray(room.participants) ? room.participants : [];
  if (!participants.some((participant) => participant.id === participantId)) {
    throw new NotFoundError('Participant not found.');
  }
  const updated = {
    ...room,
    participants: participants.filter((participant) => participant.id !== participantId),
  };
  interviewRooms.set(roomId, updated);
  return { id: participantId };
}

export function createChecklistItem(roomId, payload = {}) {
  const room = ensureRoomExists(roomId);
  if (!payload.label) {
    throw new ValidationError('Checklist label is required.');
  }
  const item = {
    id: payload.id || generateId('check'),
    label: normaliseString(payload.label),
    description: payload.description ?? null,
    status: payload.status && ['pending', 'in_progress', 'completed'].includes(payload.status)
      ? payload.status
      : 'pending',
    ownerName: payload.ownerName ?? null,
    completedAt: null,
  };
  const checklist = Array.isArray(room.checklist) ? [...room.checklist] : [];
  checklist.push(item);
  const updated = { ...room, checklist };
  interviewRooms.set(roomId, updated);
  return clone(item);
}

export function deleteChecklistItem(roomId, itemId) {
  if (!itemId) {
    throw new ValidationError('Checklist item id is required.');
  }
  const room = ensureRoomExists(roomId);
  const checklist = Array.isArray(room.checklist) ? room.checklist : [];
  if (!checklist.some((item) => item.id === itemId)) {
    throw new NotFoundError('Checklist item not found.');
  }
  const updated = {
    ...room,
    checklist: checklist.filter((item) => item.id !== itemId),
  };
  interviewRooms.set(roomId, updated);
  return { id: itemId };
}

export function getInterviewWorkflow(workspaceId) {
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }
  seedDefaults();
  const workflow = interviewWorkflows.get(workspaceId);
  if (!workflow) {
    throw new NotFoundError('Interview workflow not found.');
  }
  return clone(workflow);
}

export function updateInterviewWorkflowLane(workspaceId, laneId, payload = {}) {
  const workflow = getInterviewWorkflow(workspaceId);
  const index = workflow.lanes.findIndex((lane) => lane.id === laneId);
  if (index === -1) {
    throw new NotFoundError('Lane not found.');
  }

  const updatedLane = {
    ...workflow.lanes[index],
    ...payload,
  };

  const updatedWorkflow = {
    ...workflow,
    lanes: [...workflow.lanes],
  };
  updatedWorkflow.lanes[index] = updatedLane;
  interviewWorkflows.set(workspaceId, updatedWorkflow);
  return clone(updatedLane);
}

export function createInterviewWorkflowLane(workspaceId, payload = {}) {
  const workflow = getInterviewWorkflow(workspaceId);
  const id = payload.id || generateId('lane');
  if (workflow.lanes.some((lane) => lane.id === id)) {
    throw new ValidationError('Lane id already exists.');
  }
  const lane = {
    id,
    name: normaliseString(payload.name, 'Lane'),
    orderIndex: Number.isFinite(payload.orderIndex) ? Number(payload.orderIndex) : workflow.lanes.length + 1,
    color: payload.color ?? '#38bdf8',
    slaMinutes: Number.isFinite(payload.slaMinutes) ? Number(payload.slaMinutes) : 24 * 60,
    cards: Array.isArray(payload.cards) ? payload.cards : [],
  };
  const updatedWorkflow = {
    ...workflow,
    lanes: [...workflow.lanes, lane],
  };
  interviewWorkflows.set(workspaceId, updatedWorkflow);
  return clone(lane);
}

export function deleteInterviewWorkflowLane(workspaceId, laneId) {
  const workflow = getInterviewWorkflow(workspaceId);
  const lanes = workflow.lanes.filter((lane) => lane.id !== laneId);
  if (lanes.length === workflow.lanes.length) {
    throw new NotFoundError('Lane not found.');
  }
  const updatedWorkflow = {
    ...workflow,
    lanes,
  };
  interviewWorkflows.set(workspaceId, updatedWorkflow);
  return { id: laneId };
}

export function createInterviewCard(workspaceId, laneId, payload = {}) {
  const workflow = getInterviewWorkflow(workspaceId);
  const laneIndex = workflow.lanes.findIndex((lane) => lane.id === laneId);
  if (laneIndex === -1) {
    throw new NotFoundError('Lane not found.');
  }
  const lane = workflow.lanes[laneIndex];
  const id = payload.id || generateId('card');
  if (lane.cards.some((card) => card.id === id)) {
    throw new ValidationError('Card id already exists in lane.');
  }
  const scheduledAt = payload.scheduledAt ? normaliseDate(payload.scheduledAt) : null;
  const card = {
    id,
    candidateId: payload.candidateId ?? null,
    candidateName: normaliseString(payload.candidateName, 'Candidate'),
    jobTitle: payload.jobTitle ?? null,
    scheduledAt,
    ownerName: payload.ownerName ?? null,
    status: payload.status ?? 'scheduled',
    stage: payload.stage ?? lane.name,
  };
  const updatedLane = {
    ...lane,
    cards: [...lane.cards, card],
  };
  const updatedWorkflow = {
    ...workflow,
    lanes: [...workflow.lanes],
  };
  updatedWorkflow.lanes[laneIndex] = updatedLane;
  interviewWorkflows.set(workspaceId, updatedWorkflow);
  return clone(card);
}

export function updateInterviewCard(workspaceId, laneId, cardId, payload = {}) {
  const workflow = getInterviewWorkflow(workspaceId);
  const sourceLaneIndex = workflow.lanes.findIndex((lane) => lane.id === laneId);
  if (sourceLaneIndex === -1) {
    throw new NotFoundError('Lane not found.');
  }
  const sourceLane = workflow.lanes[sourceLaneIndex];
  const cardIndex = sourceLane.cards.findIndex((card) => card.id === cardId);
  if (cardIndex === -1) {
    throw new NotFoundError('Card not found.');
  }

  const targetLaneId = payload.laneId ?? payload.targetLaneId ?? laneId;
  const targetLaneIndex = workflow.lanes.findIndex((lane) => lane.id === targetLaneId);
  if (targetLaneIndex === -1) {
    throw new NotFoundError('Target lane not found.');
  }

  const scheduledAt = payload.scheduledAt ? normaliseDate(payload.scheduledAt) : sourceLane.cards[cardIndex].scheduledAt;
  const updatedCard = {
    ...sourceLane.cards[cardIndex],
    ...payload,
    scheduledAt,
    stage: payload.stage ?? sourceLane.cards[cardIndex].stage,
  };

  const workflowClone = {
    ...workflow,
    lanes: workflow.lanes.map((lane, index) => {
      if (index === sourceLaneIndex && index === targetLaneIndex) {
        const cards = [...lane.cards];
        cards[cardIndex] = updatedCard;
        return { ...lane, cards };
      }
      if (index === sourceLaneIndex) {
        return { ...lane, cards: lane.cards.filter((card) => card.id !== cardId) };
      }
      if (index === targetLaneIndex) {
        return { ...lane, cards: [...lane.cards, updatedCard] };
      }
      return lane;
    }),
  };

  interviewWorkflows.set(workspaceId, workflowClone);
  return clone(updatedCard);
}

export function deleteInterviewCard(workspaceId, laneId, cardId) {
  const workflow = getInterviewWorkflow(workspaceId);
  const laneIndex = workflow.lanes.findIndex((lane) => lane.id === laneId);
  if (laneIndex === -1) {
    throw new NotFoundError('Lane not found.');
  }
  const lane = workflow.lanes[laneIndex];
  if (!lane.cards.some((card) => card.id === cardId)) {
    throw new NotFoundError('Card not found.');
  }
  const updatedLane = {
    ...lane,
    cards: lane.cards.filter((card) => card.id !== cardId),
  };
  const updatedWorkflow = {
    ...workflow,
    lanes: [...workflow.lanes],
  };
  updatedWorkflow.lanes[laneIndex] = updatedLane;
  interviewWorkflows.set(workspaceId, updatedWorkflow);
  return { id: cardId };
}

export function listPanelTemplates(workspaceId) {
  seedDefaults();
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }
  return Array.from(interviewPanelTemplates.values())
    .filter((template) => template.workspaceId === workspaceId)
    .map((template) => clone(template));
}

export function createPanelTemplate(workspaceId, payload = {}) {
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }
  seedDefaults();
  const id = payload.id || generateId('template');
  if (interviewPanelTemplates.has(id)) {
    throw new ValidationError('Template id already exists.');
  }
  const template = {
    id,
    workspaceId,
    name: normaliseString(payload.name, 'Template'),
    stage: normaliseString(payload.stage, 'Interview'),
    durationMinutes: Number.isFinite(payload.durationMinutes) ? Number(payload.durationMinutes) : 60,
    interviewerRoster: Array.isArray(payload.interviewerRoster) ? payload.interviewerRoster : [],
    focusAreas: Array.isArray(payload.focusAreas) ? payload.focusAreas : [],
    notes: payload.notes ?? null,
    updatedAt: new Date().toISOString(),
  };
  interviewPanelTemplates.set(id, template);
  return clone(template);
}

export function updatePanelTemplate(templateId, payload = {}) {
  if (!templateId) {
    throw new ValidationError('templateId is required.');
  }
  const existing = interviewPanelTemplates.get(templateId);
  if (!existing) {
    throw new NotFoundError('Panel template not found.');
  }
  const template = {
    ...existing,
    ...payload,
    name: normaliseString(payload.name, existing.name),
    stage: normaliseString(payload.stage, existing.stage),
    durationMinutes: Number.isFinite(payload.durationMinutes)
      ? Number(payload.durationMinutes)
      : existing.durationMinutes,
    interviewerRoster: Array.isArray(payload.interviewerRoster)
      ? payload.interviewerRoster
      : existing.interviewerRoster,
    focusAreas: Array.isArray(payload.focusAreas) ? payload.focusAreas : existing.focusAreas,
    updatedAt: new Date().toISOString(),
  };
  interviewPanelTemplates.set(templateId, template);
  return clone(template);
}

export function deletePanelTemplate(templateId) {
  if (!templateId) {
    throw new ValidationError('templateId is required.');
  }
  const existed = interviewPanelTemplates.delete(templateId);
  if (!existed) {
    throw new NotFoundError('Panel template not found.');
  }
  return { id: templateId };
}

export function listCandidatePrepPortals(workspaceId) {
  seedDefaults();
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }
  return Array.from(candidatePrepPortals.values())
    .filter((portal) => portal.workspaceId === workspaceId)
    .map((portal) => clone(portal));
}

export function createCandidatePrepPortal(workspaceId, payload = {}) {
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }
  seedDefaults();
  const id = payload.id || generateId('prep');
  if (candidatePrepPortals.has(id)) {
    throw new ValidationError('Prep portal id already exists.');
  }
  const portal = {
    id,
    workspaceId,
    title: normaliseString(payload.title, 'Prep portal'),
    status: normaliseString(payload.status, 'active'),
    shareUrl: payload.shareUrl || `https://gigvora.com/prep/${id}`,
    resources: Array.isArray(payload.resources) ? payload.resources : [],
    checklist: Array.isArray(payload.checklist) ? payload.checklist : [],
    updatedAt: new Date().toISOString(),
  };
  candidatePrepPortals.set(id, portal);
  return clone(portal);
}

export function updateCandidatePrepPortal(portalId, payload = {}) {
  if (!portalId) {
    throw new ValidationError('portalId is required.');
  }
  const existing = candidatePrepPortals.get(portalId);
  if (!existing) {
    throw new NotFoundError('Prep portal not found.');
  }
  const portal = {
    ...existing,
    ...payload,
    title: normaliseString(payload.title, existing.title),
    status: normaliseString(payload.status, existing.status),
    shareUrl: payload.shareUrl ?? existing.shareUrl,
    resources: Array.isArray(payload.resources) ? payload.resources : existing.resources,
    checklist: Array.isArray(payload.checklist) ? payload.checklist : existing.checklist,
    updatedAt: new Date().toISOString(),
  };
  candidatePrepPortals.set(portalId, portal);
  return clone(portal);
}

export function deleteCandidatePrepPortal(portalId) {
  if (!portalId) {
    throw new ValidationError('portalId is required.');
  }
  const existed = candidatePrepPortals.delete(portalId);
  if (!existed) {
    throw new NotFoundError('Prep portal not found.');
  }
  return { id: portalId };
}

export function listInterviewWorkspaces() {
  seedDefaults();
  return Array.from(interviewWorkflows.values()).map((workflow) => {
    const rooms = listInterviewRooms(workflow.workspaceId);
    const templates = listPanelTemplates(workflow.workspaceId);
    const prep = listCandidatePrepPortals(workflow.workspaceId);
    return {
      id: workflow.workspaceId,
      name: workflow.name,
      lanes: workflow.lanes.length,
      rooms: rooms.length,
      templates: templates.length,
      prep: prep.length,
    };
  });
}

export function getWorkspaceOverview(workspaceId) {
  const workflow = getInterviewWorkflow(workspaceId);
  const rooms = listInterviewRooms(workspaceId);
  const templates = listPanelTemplates(workspaceId);
  const prep = listCandidatePrepPortals(workspaceId);

  const now = Date.now();
  const upcoming = rooms.filter((room) => room.scheduledAt && new Date(room.scheduledAt).getTime() > now);
  const awaitingFeedback = rooms.filter((room) =>
    room.checklist?.some((item) => item.status !== 'completed'),
  );
  const averageSlaMinutes =
    workflow.lanes.length === 0
      ? 0
      : workflow.lanes.reduce((total, lane) => total + Number(lane.slaMinutes ?? 0), 0) / workflow.lanes.length;

  return {
    workspace: {
      id: workflow.workspaceId,
      name: workflow.name,
    },
    stats: {
      totalRooms: rooms.length,
      upcoming: upcoming.length,
      awaitingFeedback: awaitingFeedback.length,
      averageSlaMinutes,
      totalTemplates: templates.length,
      totalPrepPortals: prep.length,
    },
    workflow,
    rooms,
    panelTemplates: templates,
    prepPortals: prep,
  };
}

export default {
  getInterviewRoom,
  createInterviewRoom,
  upsertInterviewRoom,
  addInterviewParticipant,
  updateChecklistItem,
  getInterviewWorkflow,
  updateInterviewWorkflowLane,
  listInterviewRooms,
  deleteInterviewRoom,
  updateInterviewParticipant,
  removeInterviewParticipant,
  createChecklistItem,
  deleteChecklistItem,
  createInterviewWorkflowLane,
  deleteInterviewWorkflowLane,
  createInterviewCard,
  updateInterviewCard,
  deleteInterviewCard,
  listPanelTemplates,
  createPanelTemplate,
  updatePanelTemplate,
  deletePanelTemplate,
  listCandidatePrepPortals,
  createCandidatePrepPortal,
  updateCandidatePrepPortal,
  deleteCandidatePrepPortal,
  listInterviewWorkspaces,
  getWorkspaceOverview,
};
