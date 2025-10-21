import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { DataTypes } from 'sequelize';
import sequelize from '../../src/models/sequelizeClient.js';
import {
  AppearanceTheme,
  AppearanceAsset,
  AppearanceLayout,
} from '../../src/models/appearanceModels.js';
import {
  CareerDocument,
  CareerDocumentVersion,
  CareerDocumentCollaborator,
  CareerDocumentExport,
} from '../../src/models/careerDocumentModels.js';
import { AdCampaign, AdCreative, AdPlacement } from '../../src/models/companyAdsModels.js';
import {
  CompanyPage,
  CompanyPageSection,
  CompanyPageRevision,
  CompanyPageCollaborator,
  CompanyPageMedia,
} from '../../src/models/companyPageModels.js';
import {
  ConsentPolicy,
  ConsentPolicyVersion,
  UserConsent,
  ConsentAuditEvent,
  activatePolicyVersion,
  normaliseConsentCode,
  supersedePolicyVersion,
} from '../../src/models/consentModels.js';
import {
  CreationStudioItem,
  CreationStudioAsset,
  CreationStudioPermission,
  CREATION_STUDIO_ITEM_TYPES,
} from '../../src/models/creationStudioModels.js';
import DatabaseAuditEvent from '../../src/models/databaseAuditEvent.js';
import DatabaseConnectionProfile from '../../src/models/databaseConnectionProfile.js';
import { EmailSmtpConfig, EmailTemplate } from '../../src/models/emailModels.js';
import {
  MessageThread,
  Message,
  MessageParticipant,
  MessageAttachment,
  SupportCase,
  MESSAGE_TYPES,
  User as MessagingUser,
} from '../../src/models/messagingModels.js';
import {
  ModerationEvent,
  ModerationEventStatuses,
  ModerationEventActions,
} from '../../src/models/moderationModels.js';
import {
  LegalDocument,
  LegalDocumentVersion,
  LegalDocumentAuditEvent,
} from '../../src/models/legalDocumentModels.js';
import {
  UserEvent,
  UserEventAgendaItem,
  UserEventTask,
  UserEventGuest,
  UserEventBudgetItem,
  UserEventAsset,
} from '../../src/models/eventManagement.js';
import {
  ProviderAvailabilityWindow,
  ProviderWellbeingLog,
} from '../../src/models/headhunterExtras.js';
import {
  JobApplication,
  JobApplicationDocument,
  JobApplicationNote,
  JobApplicationStageHistory,
  JobApplicationInterview,
} from '../../src/models/jobApplicationModels.js';
import {
  SupportPlaybook,
  SupportPlaybookStep,
  AnalyticsEvent,
} from '../../src/models/liveServiceTelemetryModels.js';
import PageSetting from '../../src/models/pageSetting.js';

const RESET_MODELS = [
  ConsentAuditEvent,
  UserConsent,
  ConsentPolicyVersion,
  ConsentPolicy,
  LegalDocumentAuditEvent,
  LegalDocumentVersion,
  LegalDocument,
  CreationStudioPermission,
  CreationStudioAsset,
  CreationStudioItem,
  AdPlacement,
  AdCreative,
  AdCampaign,
  CompanyPageMedia,
  CompanyPageCollaborator,
  CompanyPageSection,
  CompanyPageRevision,
  CompanyPage,
  AppearanceAsset,
  AppearanceLayout,
  AppearanceTheme,
  CareerDocumentExport,
  CareerDocumentCollaborator,
  CareerDocumentVersion,
  CareerDocument,
  JobApplicationInterview,
  JobApplicationDocument,
  JobApplicationNote,
  JobApplicationStageHistory,
  JobApplication,
  UserEventAsset,
  UserEventBudgetItem,
  UserEventGuest,
  UserEventTask,
  UserEventAgendaItem,
  UserEvent,
  ProviderAvailabilityWindow,
  ProviderWellbeingLog,
  MessageAttachment,
  Message,
  MessageParticipant,
  SupportCase,
  MessageThread,
  MessagingUser,
  ModerationEvent,
  AnalyticsEvent,
  SupportPlaybookStep,
  SupportPlaybook,
  EmailTemplate,
  EmailSmtpConfig,
  PageSetting,
  DatabaseAuditEvent,
  DatabaseConnectionProfile,
];

async function truncateAllTables() {
  for (const model of RESET_MODELS) {
    // eslint-disable-next-line no-await-in-loop
    await model.destroy({ where: {}, truncate: true, force: true, cascade: true });
  }

  const { ProviderWorkspaceMember, ProviderWorkspace } = sequelize.models;
  if (ProviderWorkspaceMember) {
    await ProviderWorkspaceMember.destroy({ where: {}, truncate: true, force: true, cascade: true });
  }
  if (ProviderWorkspace) {
    await ProviderWorkspace.destroy({ where: {}, truncate: true, force: true, cascade: true });
  }
}

describe('group 18 backend models', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  it('serialises appearance models with related assets and layouts', async () => {
    const theme = await AppearanceTheme.create({
      slug: 'gigvora-default',
      name: 'Gigvora Default',
      status: 'active',
      isDefault: true,
      tokens: { colors: { primary: '#1c6ef2' } },
    });
    await AppearanceAsset.create({
      themeId: theme.id,
      type: 'logo_light',
      label: 'Primary logo',
      url: 'https://cdn.gigvora.test/logo-light.svg',
      isPrimary: true,
      metadata: { width: 320 },
    });
    await AppearanceLayout.create({
      themeId: theme.id,
      name: 'Marketing hero',
      slug: 'marketing-hero',
      page: 'marketing',
      status: 'published',
      config: { hero: true },
      allowedRoles: ['guest'],
    });

    const fetched = await AppearanceTheme.findByPk(theme.id, {
      include: [
        { model: AppearanceAsset, as: 'assets' },
        { model: AppearanceLayout, as: 'layouts' },
      ],
    });

    const summary = fetched.toPublicObject({ includeRelations: true });
    expect(summary).toMatchObject({
      slug: 'gigvora-default',
      isDefault: true,
      status: 'active',
      tokens: { colors: { primary: '#1c6ef2' } },
    });
    expect(summary.assets).toHaveLength(1);
    expect(summary.layouts).toHaveLength(1);
    expect(summary.assets[0]).toMatchObject({
      label: 'Primary logo',
      isPrimary: true,
      metadata: { width: 320 },
    });
    expect(summary.layouts[0]).toMatchObject({
      slug: 'marketing-hero',
      allowedRoles: ['guest'],
    });

    const baseSummary = fetched.toPublicObject();
    expect(baseSummary.assets).toBeUndefined();
    expect(baseSummary.layouts).toBeUndefined();
  });

  it('ensures career document associations remain consistent across calls', async () => {
    const firstId = CareerDocumentVersion.associations.document.target === CareerDocument;
    expect(firstId).toBe(true);

    const document = await CareerDocument.create({
      userId: 91,
      documentType: 'cv',
      title: 'Staff Engineer CV',
      status: 'draft',
    });
    const version = await CareerDocumentVersion.create({
      documentId: document.id,
      versionNumber: 1,
      approvalStatus: 'draft',
      content: 'Initial draft',
    });
    await CareerDocumentCollaborator.create({
      documentId: document.id,
      collaboratorId: 44,
      role: 'editor',
      permissions: { canEdit: true },
    });
    await CareerDocumentExport.create({
      documentId: document.id,
      versionId: version.id,
      format: 'pdf',
      deliveryUrl: 'https://cdn.gigvora.test/cv.pdf',
    });

    const populated = await CareerDocument.findByPk(document.id, {
      include: [
        { model: CareerDocumentVersion, as: 'versions' },
        { model: CareerDocumentCollaborator, as: 'collaborators' },
        { model: CareerDocumentExport, as: 'exports' },
      ],
    });

    expect(populated.versions).toHaveLength(1);
    expect(populated.collaborators).toHaveLength(1);
    expect(populated.exports).toHaveLength(1);
    expect(populated.versions[0].approvalStatus).toBe('draft');
  });

  it('normalises company ad payloads for downstream consumers', async () => {
    const campaign = await AdCampaign.create({
      name: 'Q4 Hiring',
      objective: 'talent',
      status: 'active',
      budgetCents: 1250000,
      currencyCode: 'USD',
      ownerId: 71,
    });
    const creative = await AdCreative.create({
      campaignId: campaign.id,
      name: 'Founder spotlight',
      type: 'video',
      status: 'active',
      headline: 'Meet the founding team',
      durationSeconds: 45,
    });
    const placement = await AdPlacement.create({
      creativeId: creative.id,
      surface: 'homepage',
      position: 'hero',
      status: 'scheduled',
      weight: 4,
      maxImpressionsPerHour: 1200,
    });

    expect(campaign.toPublicObject()).toMatchObject({
      budgetCents: 1250000,
      currencyCode: 'USD',
    });
    expect(creative.toPublicObject()).toMatchObject({
      type: 'video',
      durationSeconds: 45,
    });
    expect(placement.toPublicObject()).toMatchObject({
      surface: 'homepage',
      weight: 4,
      maxImpressionsPerHour: 1200,
    });
  });

  it('hydrates company page structures with collaborators and media', async () => {
    const page = await CompanyPage.create({
      workspaceId: 42,
      title: 'Gigvora Labs',
      slug: 'gigvora-labs',
      headline: 'Build what is next',
      status: 'draft',
      visibility: 'private',
    });
    await CompanyPageSection.create({
      pageId: page.id,
      title: 'Hero',
      variant: 'hero',
      orderIndex: 1,
      visibility: 'public',
    });
    await CompanyPageCollaborator.create({
      pageId: page.id,
      collaboratorEmail: 'editor@gigvora.test',
      collaboratorName: 'Page Editor',
      role: 'editor',
      status: 'active',
    });
    await CompanyPageMedia.create({
      pageId: page.id,
      url: 'https://cdn.gigvora.test/hero.png',
      mediaType: 'image',
      label: 'Hero image',
      isPrimary: true,
    });
    await CompanyPageRevision.create({
      pageId: page.id,
      version: 1,
      snapshot: { title: 'Gigvora Labs' },
    });

    const populated = await CompanyPage.findByPk(page.id, {
      include: [
        { model: CompanyPageSection, as: 'sections' },
        { model: CompanyPageCollaborator, as: 'collaborators' },
        { model: CompanyPageMedia, as: 'media' },
        { model: CompanyPageRevision, as: 'revisions' },
      ],
    });

    expect(populated.sections).toHaveLength(1);
    expect(populated.media[0].isPrimary).toBe(true);
    expect(populated.collaborators[0]).toMatchObject({ collaboratorName: 'Page Editor', status: 'active' });
  });

  it('handles consent policy lifecycle actions with audit logs', async () => {
    const policy = await ConsentPolicy.create({
      code: 'platform.marketing',
      title: 'Marketing communications',
      legalBasis: 'consent',
      required: false,
    });
    const version = await ConsentPolicyVersion.create({
      policyId: policy.id,
      version: 1,
      effectiveAt: new Date('2024-01-01T00:00:00Z'),
      content: 'Version 1 content',
    });

    await activatePolicyVersion(policy, version);
    await policy.reload({ include: [{ model: ConsentPolicyVersion, as: 'versions' }] });

    expect(policy.activeVersionId).toBe(version.id);
    const summary = policy.toSummary({ includeVersions: true });
    expect(summary.versions).toHaveLength(1);

    await supersedePolicyVersion(version, {
      supersededAt: new Date('2024-06-01T00:00:00Z'),
      actorId: 'admin-42',
    });
    await version.reload();

    expect(version.supersededAt).not.toBeNull();
    const events = await ConsentAuditEvent.findAll({ where: { policyId: policy.id } });
    expect(events).toHaveLength(2);

    const consentHolder = await MessagingUser.create({
      firstName: 'Casey',
      lastName: 'Consent',
      email: 'casey.consent@gigvora.test',
      password: 'hashed-password',
      userType: 'user',
    });
    const consent = await UserConsent.create({
      userId: consentHolder.id,
      policyId: policy.id,
      policyVersionId: version.id,
      status: 'granted',
      grantedAt: new Date('2024-02-01T12:00:00Z'),
      metadata: { channel: 'email' },
    });
    expect(consent.toSnapshot()).toMatchObject({
      policyId: policy.id,
      status: 'granted',
      metadata: { channel: 'email' },
    });

    expect(normaliseConsentCode('  Marketing_Updates ')).toBe('marketing_updates');
  });

  it('tracks job application lifecycle with supporting records', async () => {
    const application = await JobApplication.create({
      candidateName: 'Jordan Talent',
      candidateEmail: 'jordan.talent@gigvora.test',
      jobTitle: 'Senior Product Manager',
      jobLocation: 'Remote',
      status: 'new',
      stage: 'application_review',
    });
    await JobApplicationNote.create({
      applicationId: application.id,
      authorName: 'Recruiter',
      body: 'Excels at narrative storytelling',
      visibility: 'internal',
    });
    await JobApplicationDocument.create({
      applicationId: application.id,
      fileName: 'jordan-resume.pdf',
      fileUrl: 'https://cdn.gigvora.test/resume.pdf',
      sizeBytes: 20480,
    });
    await JobApplicationInterview.create({
      applicationId: application.id,
      scheduledAt: new Date('2024-07-01T15:00:00Z'),
      type: 'video',
      status: 'scheduled',
      interviewerName: 'Hiring Manager',
    });
    await JobApplicationStageHistory.create({
      applicationId: application.id,
      fromStage: 'application_review',
      toStage: 'phone_screen',
      fromStatus: 'new',
      toStatus: 'screening',
      note: 'Proceed to screening',
    });

    const payload = application.toPublicObject();
    expect(payload).toMatchObject({
      candidateEmail: 'jordan.talent@gigvora.test',
      jobTitle: 'Senior Product Manager',
      status: 'new',
    });
  });

  it('exposes creation studio items with related assets and permissions', async () => {
    const item = await CreationStudioItem.create({
      ownerId: 11,
      type: CREATION_STUDIO_ITEM_TYPES[0],
      title: 'AI Strategy Sprint',
      status: 'draft',
      visibility: 'private',
      createdById: 11,
      settings: { phases: 3 },
      tags: ['ai', 'strategy'],
      compensationMin: 1500,
      compensationMax: 3200,
    });
    await CreationStudioAsset.create({
      itemId: item.id,
      label: 'Cover image',
      type: 'image',
      url: 'https://cdn.gigvora.test/cover.png',
      isPrimary: true,
      metadata: { width: 1440 },
    });
    await CreationStudioPermission.create({
      itemId: item.id,
      role: 'mentor',
      canView: true,
      canEdit: true,
      canPublish: false,
      canManageAssets: true,
    });

    const populated = await CreationStudioItem.findByPk(item.id, {
      include: [
        { model: CreationStudioAsset, as: 'assets' },
        { model: CreationStudioPermission, as: 'permissions' },
      ],
    });
    const publicItem = populated.toPublicObject();

    expect(publicItem).toMatchObject({
      title: 'AI Strategy Sprint',
      payoutType: 'fixed',
      compensation: { minimum: 1500, maximum: 3200 },
      settings: { phases: 3 },
    });
    expect(publicItem.assets).toHaveLength(1);
    expect(publicItem.permissions[0]).toMatchObject({
      role: 'mentor',
      canEdit: true,
      canManageAssets: true,
    });
  });

  it('manages legal documents and audit events', async () => {
    const document = await LegalDocument.create({
      slug: 'platform-privacy',
      title: 'Gigvora Privacy Policy',
      category: 'privacy',
      status: 'draft',
    });
    const version = await LegalDocumentVersion.create({
      documentId: document.id,
      version: 1,
      locale: 'en',
      status: 'approved',
      externalUrl: 'https://gigvora.test/privacy',
    });
    await LegalDocumentAuditEvent.create({
      documentId: document.id,
      versionId: version.id,
      actorId: 'legal-team',
      action: 'approved',
      metadata: { note: 'Reviewed by legal' },
    });

    const storedVersion = await LegalDocumentVersion.findOne({ where: { documentId: document.id } });
    expect(storedVersion.status).toBe('approved');
    const audits = await LegalDocumentAuditEvent.findAll({ where: { documentId: document.id } });
    expect(audits).toHaveLength(1);
  });

  it('records database audit events with validation', async () => {
    await expect(DatabaseAuditEvent.recordEvent({})).rejects.toThrow('eventType');

    const event = await DatabaseAuditEvent.recordEvent({
      eventType: 'schema_migration',
      reason: 'Added indexes for analytics',
      initiatedBy: 'system',
      metadata: { migration: '2024_10_01' },
    });

    expect(event.eventType).toBe('schema_migration');
    expect(event.metadata).toEqual({ migration: '2024_10_01' });
  });

  it('captures live service telemetry events and playbook steps', async () => {
    const playbook = await SupportPlaybook.create({
      slug: 'onboarding-playbook',
      title: 'Customer Onboarding',
      stage: 'intake',
      persona: 'client',
    });
    await SupportPlaybookStep.create({ playbookId: playbook.id, stepNumber: 1, title: 'Send welcome email' });
    await AnalyticsEvent.create({
      eventName: 'playbook_step_completed',
      occurredAt: new Date('2024-03-01T12:00:00Z'),
      metadata: { playbookSlug: 'onboarding-playbook' },
    });

    const steps = await SupportPlaybookStep.findAll({ where: { playbookId: playbook.id } });
    expect(steps).toHaveLength(1);
  });

  it('produces admin payloads for database connection profiles', async () => {
    const profile = await DatabaseConnectionProfile.create({
      name: 'Primary Postgres',
      slug: 'primary-postgres',
      environment: 'production',
      role: 'writer',
      dialect: 'postgres',
      host: 'db.gigvora.internal',
      port: 5432,
      databaseName: 'gigvora',
      username: 'gigvora_app',
      sslMode: 'require',
      allowedRoles: ['admin'],
      options: { statementTimeout: 5000 },
      isPrimary: true,
    });

    expect(profile.toAdminPayload()).toMatchObject({
      slug: 'primary-postgres',
      allowedRoles: ['admin'],
      isPrimary: true,
      status: 'unknown',
    });
  });

  it('exposes SMTP and template metadata without leaking credentials', async () => {
    const smtp = await EmailSmtpConfig.create({
      label: 'Transactional',
      host: 'smtp.gigvora.test',
      username: 'mailer',
      password: 'super-secret',
      fromAddress: 'noreply@gigvora.test',
      secure: true,
    });
    const template = await EmailTemplate.create({
      slug: 'welcome',
      name: 'Welcome to Gigvora',
      subject: 'Welcome!',
      htmlBody: '<p>Hello!</p>',
      variables: ['first_name'],
    });

    expect(smtp.toPublicObject()).toMatchObject({
      label: 'Transactional',
      host: 'smtp.gigvora.test',
      secure: true,
      hasPassword: true,
    });
    expect(template.toPublicObject()).toMatchObject({
      slug: 'welcome',
      name: 'Welcome to Gigvora',
      variables: ['first_name'],
    });
  });

  it('produces moderation events with consistent snapshots', async () => {
    const event = await ModerationEvent.create({
      threadId: 77,
      channelSlug: 'global-support',
      action: ModerationEventActions[0],
      severity: 'high',
      status: ModerationEventStatuses[0],
      reason: 'Prohibited content detected',
      metadata: { policy: 'anti-harassment' },
    });

    expect(event.toPublicObject()).toMatchObject({
      threadId: 77,
      severity: 'high',
      reason: 'Prohibited content detected',
    });
  });

  it('serialises messaging resources and honours search helpers', async () => {
    const agent = await MessagingUser.create({
      id: 99,
      firstName: 'Support',
      lastName: 'Agent',
      email: 'support.agent99@gigvora.test',
      password: 'hashed-password',
      userType: 'admin',
    });
    const thread = await MessageThread.create({
      subject: 'Implementation details',
      channelType: 'support',
      state: 'active',
      createdBy: agent.id,
    });
    await MessageParticipant.create({ threadId: thread.id, userId: agent.id, role: 'owner' });
    const message = await Message.create({
      threadId: thread.id,
      senderId: agent.id,
      messageType: MESSAGE_TYPES[0],
      body: 'Hello',
    });
    await MessageAttachment.create({
      messageId: message.id,
      fileName: 'screenshot.png',
      mimeType: 'image/png',
      fileSize: 2048,
      storageKey: 'attachments/screenshot.png',
    });
    await SupportCase.create({
      threadId: thread.id,
      status: 'triage',
      priority: 'medium',
      reason: 'Investigate onboarding issue',
    });

    const lookup = await MessageThread.searchByTerm('implementation');
    expect(lookup).toHaveLength(1);
    expect(thread.toPublicObject()).toMatchObject({
      subject: 'Implementation details',
      channelType: 'support',
    });
  });

  it('maintains provider availability and wellbeing logs', async () => {
    const ProviderWorkspaceModel =
      sequelize.models.ProviderWorkspace ??
      sequelize.define(
        'ProviderWorkspace',
        {
          ownerId: { type: DataTypes.INTEGER, allowNull: false },
          name: { type: DataTypes.STRING(150), allowNull: false },
          slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
          type: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'agency' },
        },
        { tableName: 'provider_workspaces' },
      );
    const ProviderWorkspaceMemberModel =
      sequelize.models.ProviderWorkspaceMember ??
      sequelize.define(
        'ProviderWorkspaceMember',
        {
          workspaceId: { type: DataTypes.INTEGER, allowNull: false },
          userId: { type: DataTypes.INTEGER, allowNull: false },
          role: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'staff' },
          status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'pending' },
        },
        { tableName: 'provider_workspace_members' },
      );

    await ProviderWorkspaceModel.sync({ alter: false });
    await ProviderWorkspaceMemberModel.sync({ alter: false });

    const workspace = await ProviderWorkspaceModel.create({
      ownerId: 501,
      name: 'Gigvora Agency',
      slug: 'gigvora-agency',
      type: 'agency',
    });
    const member = await ProviderWorkspaceMemberModel.create({
      workspaceId: workspace.id,
      userId: 800,
      role: 'lead',
      status: 'active',
    });
    await ProviderAvailabilityWindow.create({
      workspaceId: workspace.id,
      memberId: member.id,
      dayOfWeek: 'monday',
      startTimeUtc: '09:00',
      endTimeUtc: '11:00',
      availabilityType: 'interview',
    });
    await ProviderWellbeingLog.create({
      workspaceId: workspace.id,
      memberId: member.id,
      energyScore: 8,
      stressScore: 3,
    });

    const availability = await ProviderAvailabilityWindow.findAll({ where: { workspaceId: workspace.id } });
    expect(availability).toHaveLength(1);
    const logs = await ProviderWellbeingLog.findAll({ where: { workspaceId: workspace.id } });
    expect(logs[0].energyScore).toBe(8);
  });

  it('sanitises page setting payloads for client consumption', async () => {
    const setting = await PageSetting.create({
      name: 'Company overview',
      slug: 'company-overview',
      status: 'published',
      visibility: 'public',
      layout: 'standard',
      sections: [{ type: 'hero', title: 'Welcome' }],
      roleAccess: { allowedRoles: ['admin', 'company'] },
      lastPublishedAt: new Date('2024-04-05T00:00:00Z'),
    });

    expect(setting.toPublicObject()).toMatchObject({
      slug: 'company-overview',
      sections: [{ type: 'hero', title: 'Welcome' }],
      roleAccess: { allowedRoles: ['admin', 'company'] },
      lastPublishedAt: '2024-04-05T00:00:00.000Z',
    });
  });

  it('curates event management resources with agenda and tasks', async () => {
    const userEvent = await UserEvent.create({
      ownerId: 70,
      title: 'Agency Demo Day',
      status: 'planned',
      format: 'hybrid',
      visibility: 'invite_only',
      locationLabel: 'Virtual + NYC Hub',
    });
    await UserEventAgendaItem.create({
      eventId: userEvent.id,
      title: 'Opening Remarks',
      startAt: new Date('2024-08-01T16:00:00Z'),
      orderIndex: 1,
    });
    await UserEventTask.create({
      eventId: userEvent.id,
      title: 'Prepare AV kit',
      status: 'in_progress',
      priority: 'high',
    });
    await UserEventGuest.create({
      eventId: userEvent.id,
      fullName: 'Jordan Guest',
      status: 'confirmed',
      seatsReserved: 2,
    });
    await UserEventBudgetItem.create({
      eventId: userEvent.id,
      category: 'catering',
      amountPlanned: 1200,
      status: 'planned',
    });
    await UserEventAsset.create({
      eventId: userEvent.id,
      name: 'Run of show deck',
      type: 'document',
      visibility: 'internal',
      url: 'https://cdn.gigvora.test/run-of-show.pdf',
    });

    const agenda = await UserEventAgendaItem.findAll({ where: { eventId: userEvent.id } });
    expect(agenda[0].title).toBe('Opening Remarks');
    const guests = await UserEventGuest.findAll({ where: { eventId: userEvent.id } });
    expect(guests).toHaveLength(1);
  });
});
