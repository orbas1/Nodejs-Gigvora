import crypto from 'crypto';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function parseDate(value, { allowNull = true } = {}) {
  if (value == null || value === '') {
    if (allowNull) {
      return null;
    }
    throw new ValidationError('A valid ISO date string is required.');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date provided.');
  }
  return date.toISOString();
}

const operationsByProject = new Map();

function seedProject(projectId) {
  if (operationsByProject.has(projectId)) {
    return operationsByProject.get(projectId);
  }

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 45);

  const defaultOperations = {
    projectId,
    timeline: {
      id: `timeline_${projectId}`,
      name: 'Enterprise delivery timeline',
      timezone: 'UTC',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      baselineStartDate: start.toISOString(),
      baselineEndDate: end.toISOString(),
      ownerName: 'Program Management Office',
    },
    tasks: [
      {
        id: 'task_discovery',
        type: 'phase',
        title: 'Discovery & kickoff',
        ownerType: 'agency_member',
        ownerName: 'Priya Desai',
        startDate: start.toISOString(),
        endDate: new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        progressPercent: 100,
        workloadHours: 120,
        lane: 'Strategy',
        status: 'completed',
        color: '#0ea5e9',
      },
      {
        id: 'task_design',
        type: 'phase',
        title: 'Experience design sprints',
        ownerType: 'freelancer',
        ownerName: 'Kai Chen',
        startDate: new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(start.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        progressPercent: 65,
        workloadHours: 200,
        lane: 'Design',
        status: 'in_progress',
        color: '#8b5cf6',
      },
      {
        id: 'task_engineering',
        type: 'phase',
        title: 'Engineering implementation',
        ownerType: 'agency_member',
        ownerName: 'Ari Banerjee',
        startDate: new Date(start.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(start.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        progressPercent: 35,
        workloadHours: 320,
        lane: 'Engineering',
        status: 'in_progress',
        color: '#22c55e',
      },
      {
        id: 'task_enablement',
        type: 'milestone',
        title: 'Enablement and go-live',
        ownerType: 'company_member',
        ownerName: 'Lena Torres',
        startDate: end.toISOString(),
        endDate: end.toISOString(),
        progressPercent: 10,
        workloadHours: 60,
        lane: 'Enablement',
        status: 'planned',
        color: '#f97316',
      },
    ],
    agencyAssignments: [
      {
        id: 'assignment_priya',
        memberName: 'Priya Desai',
        role: 'Delivery lead',
        capacityHours: 140,
        allocatedHours: 126,
        workloadPercent: 90,
        status: 'active',
        delegatedBy: 'Lena Torres',
        delegatedAt: new Date(start.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'assignment_ari',
        memberName: 'Ari Banerjee',
        role: 'Engineering manager',
        capacityHours: 160,
        allocatedHours: 120,
        workloadPercent: 75,
        status: 'active',
        delegatedBy: 'Priya Desai',
        delegatedAt: start.toISOString(),
      },
      {
        id: 'assignment_noor',
        memberName: 'Noor El-Sayed',
        role: 'QA automation',
        capacityHours: 120,
        allocatedHours: 36,
        workloadPercent: 30,
        status: 'planned',
        delegatedBy: 'Ari Banerjee',
        delegatedAt: new Date().toISOString(),
      },
    ],
    contributorSplits: [
      {
        id: 'split_company',
        contributorType: 'company',
        contributorName: 'Gigvora Labs',
        allocationPercent: 20,
        allocationAmountCents: 1500000,
        currency: 'USD',
        payoutCadence: 'monthly',
        status: 'approved',
      },
      {
        id: 'split_agency',
        contributorType: 'agency',
        contributorName: 'Atlas Collective',
        allocationPercent: 50,
        allocationAmountCents: 3750000,
        currency: 'USD',
        payoutCadence: 'milestone',
        status: 'scheduled',
      },
      {
        id: 'split_freelancer',
        contributorType: 'freelancer',
        contributorName: 'Kai Chen',
        allocationPercent: 30,
        allocationAmountCents: 2250000,
        currency: 'USD',
        payoutCadence: 'upon_acceptance',
        status: 'pending_approval',
      },
    ],
  };

  operationsByProject.set(projectId, defaultOperations);
  return defaultOperations;
}

function ensureProject(projectId) {
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }
  return seedProject(String(projectId));
}

export function getProjectOperations(projectId) {
  const state = ensureProject(projectId);
  return clone(state);
}

export function updateProjectOperations(projectId, payload = {}) {
  const state = ensureProject(projectId);
  const updated = {
    ...state,
  };

  if (payload.timeline) {
    updated.timeline = {
      ...state.timeline,
      ...payload.timeline,
    };
    if (payload.timeline.startDate) {
      updated.timeline.startDate = parseDate(payload.timeline.startDate, { allowNull: false });
    }
    if (payload.timeline.endDate) {
      updated.timeline.endDate = parseDate(payload.timeline.endDate, { allowNull: false });
    }
  }

  if (Array.isArray(payload.tasks)) {
    updated.tasks = payload.tasks.map((task) => ({ ...task }));
  }

  if (Array.isArray(payload.agencyAssignments)) {
    updated.agencyAssignments = payload.agencyAssignments.map((assignment) => ({ ...assignment }));
  }

  if (Array.isArray(payload.contributorSplits)) {
    updated.contributorSplits = payload.contributorSplits.map((split) => ({ ...split }));
  }

  operationsByProject.set(String(projectId), updated);
  return clone(updated);
}

export function addProjectTask(projectId, payload = {}) {
  const state = ensureProject(projectId);
  if (!payload.title) {
    throw new ValidationError('Task title is required.');
  }

  const startDate = parseDate(payload.startDate);
  const endDate = parseDate(payload.endDate);

  const task = {
    id: payload.id || `task_${crypto.randomUUID()}`,
    type: payload.type || 'task',
    title: payload.title,
    ownerType: payload.ownerType || 'agency_member',
    ownerName: payload.ownerName || 'Unassigned',
    startDate,
    endDate,
    progressPercent: Number.isFinite(Number(payload.progressPercent))
      ? Math.max(0, Math.min(100, Number(payload.progressPercent)))
      : 0,
    workloadHours: Number.isFinite(Number(payload.workloadHours)) ? Number(payload.workloadHours) : null,
    lane: payload.lane || 'Delivery',
    status: payload.status || 'planned',
    color: payload.color || '#6366f1',
  };

  const tasks = Array.isArray(state.tasks) ? [...state.tasks] : [];
  const existingIndex = tasks.findIndex((item) => item.id === task.id);
  if (existingIndex >= 0) {
    tasks[existingIndex] = task;
  } else {
    tasks.push(task);
  }

  state.tasks = tasks;
  operationsByProject.set(String(projectId), state);
  return clone(state);
}

export function updateProjectTask(projectId, taskId, payload = {}) {
  const state = ensureProject(projectId);
  const tasks = Array.isArray(state.tasks) ? [...state.tasks] : [];
  const index = tasks.findIndex((item) => item.id === taskId);
  if (index === -1) {
    throw new NotFoundError('Task not found.');
  }

  const existing = tasks[index];
  const updated = {
    ...existing,
    ...payload,
  };

  if (payload.startDate) {
    updated.startDate = parseDate(payload.startDate);
  }
  if (payload.endDate) {
    updated.endDate = parseDate(payload.endDate);
  }
  if (payload.progressPercent !== undefined) {
    const numeric = Number(payload.progressPercent);
    if (!Number.isFinite(numeric)) {
      throw new ValidationError('progressPercent must be numeric.');
    }
    updated.progressPercent = Math.max(0, Math.min(100, numeric));
  }

  tasks[index] = updated;
  state.tasks = tasks;
  operationsByProject.set(String(projectId), state);
  return clone(updated);
}

export function removeProjectTask(projectId, taskId) {
  const state = ensureProject(projectId);
  const tasks = Array.isArray(state.tasks) ? [...state.tasks] : [];
  const index = tasks.findIndex((item) => item.id === taskId);
  if (index === -1) {
    throw new NotFoundError('Task not found.');
  }

  tasks.splice(index, 1);
  state.tasks = tasks;
  operationsByProject.set(String(projectId), state);
  return { success: true };
}

export default {
  getProjectOperations,
  updateProjectOperations,
  addProjectTask,
  updateProjectTask,
  removeProjectTask,
};
