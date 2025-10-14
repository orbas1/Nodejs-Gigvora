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

  interviewWorkflows.set('workspace_enterprise_recruiting', {
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

export default {
  getInterviewRoom,
  createInterviewRoom,
  upsertInterviewRoom,
  addInterviewParticipant,
  updateChecklistItem,
  getInterviewWorkflow,
  updateInterviewWorkflowLane,
};
