import {
  getComplianceOverview,
  createComplianceFramework,
  updateComplianceFramework,
  deleteComplianceFramework,
  createComplianceAudit,
  updateComplianceAudit,
  deleteComplianceAudit,
  createComplianceObligation,
  updateComplianceObligation,
  deleteComplianceObligation,
  logComplianceEvidence,
} from '../adminComplianceManagementService.js';
import {
  ComplianceFramework,
  ComplianceAudit,
  ComplianceObligation,
  ComplianceEvidence,
} from '../../models/complianceGovernanceModels.js';

describe('adminComplianceManagementService', () => {
  beforeAll(async () => {
    await ComplianceEvidence.sync({ force: true });
    await ComplianceObligation.sync({ force: true });
    await ComplianceAudit.sync({ force: true });
    await ComplianceFramework.sync({ force: true });
  });

  afterEach(async () => {
    await ComplianceEvidence.destroy({ where: {} });
    await ComplianceObligation.destroy({ where: {} });
    await ComplianceAudit.destroy({ where: {} });
    await ComplianceFramework.destroy({ where: {} });
  });

  const actor = { actorId: 501, reference: 'Admin User' };

  it('creates governance records and returns aggregated metrics', async () => {
    const framework = await createComplianceFramework(
      {
        name: 'SOC 2',
        owner: 'Trust & Compliance',
        status: 'active',
        type: 'attestation',
        region: 'US & UK',
        automationCoverage: 72,
        renewalCadenceMonths: 12,
        controls: ['Access reviews', 'Immutable audit logs'],
      },
      actor,
    );

    const audit = await createComplianceAudit(
      {
        frameworkId: framework.id,
        name: 'SOC 2 FY25',
        auditFirm: 'KPMG',
        status: 'scheduled',
        startDate: new Date().toISOString(),
        deliverables: ['SOC 2 report'],
      },
      actor,
    );

    const obligation = await createComplianceObligation(
      {
        title: 'Vendor risk review',
        owner: 'Vendor Ops',
        status: 'in_progress',
        riskRating: 'high',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        frameworkIds: [framework.id],
        notes: 'Collect updated SOC report',
        evidenceRequired: true,
      },
      actor,
    );

    await logComplianceEvidence(obligation.id, { description: 'SOC report uploaded' }, actor);

    const overview = await getComplianceOverview();

    expect(overview.frameworks).toHaveLength(1);
    expect(overview.audits).toHaveLength(1);
    expect(overview.obligations).toHaveLength(1);
    expect(overview.metrics.frameworksActive).toBe(1);
    expect(overview.metrics.controlsAutomated).toBe(2);
    expect(overview.metrics.obligationsDueThisWeek).toBe(1);
    expect(overview.metrics.auditsInFlight).toBe(1);
    expect(overview.frameworks[0].metadata.lastUpdatedById).toBe(actor.actorId);
    expect(overview.audits[0].metadata.lastUpdatedById).toBe(actor.actorId);
    expect(overview.obligations[0].metadata.lastUpdatedById).toBe(actor.actorId);
  });

  it('updates and deletes compliance records', async () => {
    const framework = await createComplianceFramework(
      {
        name: 'ISO 27001',
        owner: 'Security',
        status: 'planning',
        type: 'certification',
        automationCoverage: 60,
      },
      actor,
    );

    const updatedFramework = await updateComplianceFramework(
      framework.id,
      { status: 'active', automationCoverage: 88, controls: ['DR testing'] },
      actor,
    );
    expect(updatedFramework.status).toBe('active');
    expect(updatedFramework.automationCoverage).toBe(88);
    expect(updatedFramework.controls).toEqual(['DR testing']);

    const audit = await createComplianceAudit(
      {
        frameworkId: framework.id,
        name: 'ISO Surveillance',
        status: 'scheduled',
      },
      actor,
    );

    const updatedAudit = await updateComplianceAudit(audit.id, { status: 'in_progress' }, actor);
    expect(updatedAudit.status).toBe('in_progress');

    const obligation = await createComplianceObligation(
      {
        title: 'Incident response drill',
        owner: 'Trust & Safety',
        status: 'backlog',
        riskRating: 'medium',
      },
      actor,
    );

    const updatedObligation = await updateComplianceObligation(
      obligation.id,
      { status: 'complete', riskRating: 'low', evidenceRequired: false },
      actor,
    );
    expect(updatedObligation.status).toBe('complete');
    expect(updatedObligation.riskRating).toBe('low');
    expect(updatedObligation.evidenceRequired).toBe(false);

    await deleteComplianceAudit(audit.id);
    await deleteComplianceObligation(obligation.id);
    await deleteComplianceFramework(framework.id);

    const overview = await getComplianceOverview();
    expect(overview.frameworks).toHaveLength(0);
    expect(overview.audits).toHaveLength(0);
    expect(overview.obligations).toHaveLength(0);
  });
});
