import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createClientPortal,
  updateClientPortal,
  getClientPortalDashboard,
  addTimelineEvent,
  updateTimelineEvent,
  addScopeItem,
  updateScopeItem,
  recordDecision,
  createInsightWidget,
  updateInsightWidget,
} from '../src/services/clientPortalService.js';
import {
  ClientPortal,
  ClientPortalTimelineEvent,
  ClientPortalScopeItem,
  ClientPortalDecisionLog,
  ClientPortalInsightWidget,
  Project,
} from '../src/models/index.js';
import { createUser } from './helpers/factories.js';

describe('clientPortalService', () => {
  beforeEach(async () => {
    await ClientPortalInsightWidget.destroy({ where: {} });
    await ClientPortalDecisionLog.destroy({ where: {} });
    await ClientPortalScopeItem.destroy({ where: {} });
    await ClientPortalTimelineEvent.destroy({ where: {} });
    await ClientPortal.destroy({ where: {} });
    await Project.destroy({ where: {} });
  });

  it('creates a portal, manages collaboration artefacts, and returns a dashboard view', async () => {
    const owner = await createUser({ userType: 'freelancer', firstName: 'Riley', lastName: 'Morgan' });
    const stakeholder = await createUser({ userType: 'company', firstName: 'Mia', lastName: 'Ops' });
    const project = await Project.create({
      title: 'Brand Retainer',
      description: 'Deliver brand, design, and analytics workstreams for Rize Analytics.',
      status: 'active',
    });

    const portal = await createClientPortal({
      projectId: project.id,
      ownerId: owner.id,
      title: 'Brand Retainer Collaboration Hub',
      summary: 'Shared portal with Rize leadership for milestones, scope, and approvals.',
      status: 'active',
      stakeholders: [
        { name: 'Mia Operations', email: 'mia@example.com', role: 'COO' },
      ],
      preferences: { digest: { frequency: 'weekly', recipients: ['mia@example.com'] } },
    });

    expect(portal.slug).toContain('brand-retainer');
    expect(portal.status).toBe('active');

    const kickoff = await addTimelineEvent(portal.id, {
      title: 'Kickoff workshop',
      status: 'completed',
      startDate: new Date(),
      dueDate: new Date(),
      ownerId: owner.id,
      metadata: { deliverables: ['Discovery brief'] },
    });

    expect(kickoff.status).toBe('completed');

    const updatedKickoff = await updateTimelineEvent(portal.id, kickoff.id, {
      status: 'at_risk',
      metadata: { riskNotes: 'Waiting on stakeholder availability' },
    });

    expect(updatedKickoff.status).toBe('at_risk');
    expect(updatedKickoff.metadata.riskNotes).toContain('stakeholder');

    const scopeItem = await addScopeItem(portal.id, {
      title: 'Brand messaging playbook',
      status: 'committed',
      effortHours: 18,
      valueAmount: 6200,
      valueCurrency: 'USD',
    });

    const updatedScope = await updateScopeItem(portal.id, scopeItem.id, {
      status: 'delivered',
      effortHours: 20,
      lastDecisionAt: new Date(),
    });

    expect(updatedScope.status).toBe('delivered');
    expect(updatedScope.effortHours).toBe(20);

    const decision = await recordDecision(portal.id, {
      summary: 'Approve analytics instrumentation',
      decision: 'Green-lit analytics scope increase with contingency hours.',
      decidedById: stakeholder.id,
      decidedAt: new Date(),
      category: 'scope',
      visibility: 'client',
      impactSummary: 'Adds 8 billable hours and extends delivery by two days.',
    });

    expect(decision.visibility).toBe('client');
    expect(decision.decidedBy.name).toContain('Mia');

    const widget = await createInsightWidget(portal.id, {
      widgetType: 'health',
      title: 'Delivery confidence',
      data: { score: 85, trend: 'up' },
    });

    const updatedWidget = await updateInsightWidget(portal.id, widget.id, {
      data: { score: 88, trend: 'stable' },
      visibility: 'shared',
    });

    expect(updatedWidget.data.score).toBe(88);

    const dashboard = await getClientPortalDashboard(portal.id);

    expect(dashboard.portal.title).toBe('Brand Retainer Collaboration Hub');
    expect(dashboard.timeline.events).toHaveLength(1);
    expect(dashboard.timeline.summary.totalCount).toBe(1);
    expect(dashboard.scope.items[0].status).toBe('delivered');
    expect(dashboard.decisions.entries).toHaveLength(1);
    expect(dashboard.insights.widgets[0].data.score).toBe(88);
    expect(dashboard.portal.healthScore).toBeGreaterThanOrEqual(0);
  });

  it('updates portal metadata, slug uniqueness, and stakeholder roster', async () => {
    const owner = await createUser({ userType: 'freelancer', firstName: 'Nova', lastName: 'Builder' });
    const project = await Project.create({
      title: 'Product Launch',
      description: 'Multi-workstream launch effort.',
      status: 'planning',
    });

    const portal = await createClientPortal({
      projectId: project.id,
      ownerId: owner.id,
      title: 'Launch portal',
      status: 'draft',
    });

    const updated = await updateClientPortal(portal.id, {
      status: 'active',
      preferences: { digest: { frequency: 'daily' } },
      stakeholders: [
        { name: 'Client Sponsor', email: 'sponsor@example.com', role: 'VP Marketing' },
      ],
      brandColor: '#1D4ED8',
    });

    expect(updated.status).toBe('active');
    expect(updated.preferences.digest.frequency).toBe('daily');
    expect(updated.stakeholders).toHaveLength(1);
    expect(updated.brandColor).toBe('#1D4ED8');
  });

  it('produces actionable dashboard health metrics with risk indicators', async () => {
    const owner = await createUser({ userType: 'freelancer', firstName: 'Jordan', lastName: 'Ops' });
    const reviewer = await createUser({ userType: 'company', firstName: 'Pat', lastName: 'Sponsor' });
    const project = await Project.create({
      title: 'Global Rollout',
      description: 'Coordinate international launch deliverables.',
      status: 'active',
    });

    const portal = await createClientPortal({
      projectId: project.id,
      ownerId: owner.id,
      title: 'Global Rollout Command Center',
      summary: 'Tracks milestones and scope for leadership visibility.',
      status: 'active',
    });

    await addTimelineEvent(portal.id, {
      title: 'Pilot enablement',
      status: 'completed',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      ownerId: owner.id,
    });

    const riskEvent = await addTimelineEvent(portal.id, {
      title: 'Regional training',
      status: 'planned',
      startDate: new Date(),
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      ownerId: reviewer.id,
    });

    await updateTimelineEvent(portal.id, riskEvent.id, {
      status: 'at_risk',
      metadata: { blocker: 'Awaiting translated content approval' },
    });

    const committed = await addScopeItem(portal.id, {
      title: 'Launch analytics dashboard',
      status: 'committed',
      effortHours: 18,
      valueAmount: 8500,
      valueCurrency: 'USD',
    });

    await addScopeItem(portal.id, {
      title: 'Localization tooling',
      status: 'delivered',
      effortHours: 22,
    });

    await updateScopeItem(portal.id, committed.id, { status: 'in_delivery', effortHours: 20 });

    await recordDecision(portal.id, {
      summary: 'Approve training materials',
      decision: 'Approved with minor updates',
      decidedById: reviewer.id,
      category: 'enablement',
    });

    const widget = await createInsightWidget(portal.id, {
      title: 'Confidence tracker',
      widgetType: 'timeline',
      visibility: 'client',
      data: { confidence: 72, commentary: 'Risk trending upward due to content dependencies.' },
    });

    await updateInsightWidget(portal.id, widget.id, { orderIndex: 4 });

    const dashboard = await getClientPortalDashboard(portal.id);

    expect(dashboard.timeline.summary.totalCount).toBeGreaterThanOrEqual(2);
    expect(dashboard.timeline.summary.overdueCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.scope.summary.totalEffortHours).toBeGreaterThan(0);
    expect(dashboard.decisions.entries[0].category).toBe('enablement');
    expect(dashboard.insights.widgets[0].orderIndex).toBe(4);
    expect(['confident', 'watch', 'at_risk']).toContain(dashboard.portal.riskLevel);
    expect(dashboard.portal.healthScore).toBeGreaterThanOrEqual(0);
  });
});
