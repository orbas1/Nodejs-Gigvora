import { describe, it, expect, beforeEach } from '@jest/globals';
import { Op } from 'sequelize';
import {
  createProject,
  updateProjectAutoAssign,
  getProjectOverview,
  listProjectEvents,
  updateProjectDetails,
} from '../src/services/projectService.js';
import {
  Project,
  AutoAssignQueueEntry,
  ProjectAssignmentEvent,
  FreelancerAssignmentMetric,
} from '../src/models/index.js';
import { createUser } from './helpers/factories.js';

describe('projectService', () => {
  beforeEach(async () => {
    await Project.destroy({ where: {} });
    await AutoAssignQueueEntry.destroy({ where: {} });
    await FreelancerAssignmentMetric.destroy({ where: {} });
    await ProjectAssignmentEvent.destroy({ where: {} });
  });

  it('creates a project with auto-assign enabled, queue entries, and event trail', async () => {
    const freelancers = await Promise.all([
      createUser({ userType: 'freelancer', firstName: 'Ava', lastName: 'Builder' }),
      createUser({ userType: 'freelancer', firstName: 'Noor', lastName: 'Maker' }),
      createUser({ userType: 'freelancer', firstName: 'Eli', lastName: 'Analyst' }),
    ]);

    const result = await createProject(
      {
        title: 'New marketplace instrumentation',
        description: 'Implement dashboards and alerts for the analytics squad.',
        status: 'open',
        budgetAmount: 2500,
        budgetCurrency: 'usd',
        autoAssign: {
          enabled: true,
          limit: 2,
          weights: { rating: 0.3, opportunity: 0.4 },
          fairness: { maxAssignments: 1 },
        },
      },
      { actorId: freelancers[0].id },
    );

    expect(result.project.ownerId).toBe(freelancers[0].id);
    expect(result.project.autoAssignEnabled).toBe(true);
    expect(result.project.autoAssignStatus).toBe('queue_active');
    expect(result.project.autoAssignSettings.limit).toBe(2);
    expect(result.queueEntries).toHaveLength(2);
    expect(result.queueEntries[0]).toHaveProperty('weights');

    const storedProject = await Project.findByPk(result.project.id);
    expect(storedProject.autoAssignLastQueueSize).toBe(2);

    const events = await ProjectAssignmentEvent.findAll({ where: { projectId: storedProject.id } });
    const eventTypes = events.map((event) => event.eventType);
    expect(eventTypes).toContain('created');
    expect(eventTypes).toContain('auto_assign_enabled');
    expect(eventTypes).toContain('auto_assign_queue_generated');

    const overview = await getProjectOverview(result.project.id);
    expect(overview.queueEntries).toHaveLength(2);
    expect(overview.project.autoAssignStatus).toBe('queue_active');

    const feed = await listProjectEvents(result.project.id, { limit: 5 });
    expect(feed.length).toBeGreaterThan(0);
  });

  it('enables and disables auto-assign while expiring queue entries and logging events', async () => {
    const freelancers = await Promise.all([
      createUser({ userType: 'freelancer', firstName: 'Ivy', lastName: 'Creator' }),
      createUser({ userType: 'freelancer', firstName: 'Kai', lastName: 'Strategist' }),
    ]);

    const project = await createProject(
      {
        title: 'Community portal redesign',
        description: 'Ship the refreshed Gigvora community portal.',
        status: 'planning',
        budgetAmount: 1800,
        autoAssign: { enabled: false },
      },
      { actorId: freelancers[0].id },
    );

    expect(project.project.autoAssignEnabled).toBe(false);

    const enabled = await updateProjectAutoAssign(
      project.project.id,
      {
        enabled: true,
        settings: {
          limit: 3,
          fairness: { ensureNewcomer: true, maxAssignments: 0 },
        },
      },
      { actorId: freelancers[0].id },
    );

    expect(enabled.project.autoAssignEnabled).toBe(true);
    expect(enabled.project.autoAssignLastQueueSize).toBeGreaterThan(0);

    const queueCount = await AutoAssignQueueEntry.count({
      where: { targetType: 'project', targetId: project.project.id, status: 'notified' },
    });
    expect(queueCount).toBeGreaterThan(0);

    const disabled = await updateProjectAutoAssign(
      project.project.id,
      { enabled: false },
      { actorId: freelancers[1].id },
    );

    expect(disabled.project.autoAssignEnabled).toBe(false);
    expect(disabled.project.autoAssignStatus).toBe('inactive');

    const remainingQueue = await AutoAssignQueueEntry.count({
      where: { targetType: 'project', targetId: project.project.id, status: { [Op.in]: ['pending', 'notified'] } },
    });
    expect(remainingQueue).toBe(0);

    const events = await ProjectAssignmentEvent.findAll({ where: { projectId: project.project.id } });
    expect(events.some((event) => event.eventType === 'auto_assign_disabled')).toBe(true);
  });

  it('updates project details, regenerates auto-assign queue, and records change events', async () => {
    const freelancers = await Promise.all([
      createUser({ userType: 'freelancer', firstName: 'Nova', lastName: 'Maker' }),
      createUser({ userType: 'freelancer', firstName: 'Jules', lastName: 'Builder' }),
      createUser({ userType: 'freelancer', firstName: 'Ara', lastName: 'Strategist' }),
    ]);

    const created = await createProject(
      {
        title: 'Data operations overhaul',
        description: 'Stand up the new data tooling stack with observability.',
        status: 'open',
        budgetAmount: 4200,
        autoAssign: { enabled: true, limit: 2 },
      },
      { actorId: freelancers[0].id },
    );

    const updated = await updateProjectDetails(
      created.project.id,
      {
        status: 'in_progress',
        budgetAmount: 5300,
        location: 'Hybrid • NYC',
        autoAssign: {
          regenerateQueue: true,
          settings: { fairness: { maxAssignments: 2 } },
        },
      },
      { actorId: freelancers[1].id },
    );

    expect(updated.project.status).toBe('in_progress');
    expect(updated.project.location).toBe('Hybrid • NYC');
    expect(updated.project.autoAssignEnabled).toBe(true);
    expect(updated.project.autoAssignLastQueueSize).toBeGreaterThan(0);
    expect(Array.isArray(updated.queueEntries)).toBe(true);
    expect(updated.queueEntries?.[0]).toHaveProperty('freelancer');

    const refreshedEvents = await listProjectEvents(created.project.id, { limit: 10 });
    const eventTypes = refreshedEvents.map((event) => event.eventType);
    expect(eventTypes).toContain('updated');
    expect(eventTypes).toContain('auto_assign_queue_regenerated');
  });

  it('disables auto-assign via project details update and preserves settings for future use', async () => {
    const freelancers = await Promise.all([
      createUser({ userType: 'freelancer', firstName: 'Sky', lastName: 'Analyst' }),
      createUser({ userType: 'freelancer', firstName: 'Rei', lastName: 'Engineer' }),
    ]);

    const created = await createProject(
      {
        title: 'Brand hub redesign',
        description: 'Rebuild the marketing hub with new launch assets.',
        status: 'open',
        budgetAmount: 3200,
        autoAssign: {
          enabled: true,
          limit: 2,
          fairness: { maxAssignments: 1 },
        },
      },
      { actorId: freelancers[0].id },
    );

    const disabled = await updateProjectDetails(
      created.project.id,
      {
        autoAssign: { enabled: false },
      },
      { actorId: freelancers[1].id },
    );

    expect(disabled.project.autoAssignEnabled).toBe(false);
    expect(disabled.project.autoAssignStatus).toBe('inactive');
    expect(disabled.queueEntries).toEqual([]);

    const followUp = await updateProjectDetails(
      created.project.id,
      {
        autoAssign: { enabled: true, settings: { limit: 3 } },
      },
      { actorId: freelancers[1].id },
    );

    expect(followUp.project.autoAssignEnabled).toBe(true);
    expect(followUp.project.autoAssignSettings.limit).toBe(3);
    expect(followUp.queueEntries?.length).toBeGreaterThan(0);
  });
});
