import {
  adminAgencyCreateSchema,
  adminAgencyListQuerySchema,
  adminAgencyUpdateSchema,
} from '../../src/validation/schemas/adminAgencyManagementSchemas.js';
import {
  adminCompanyCreateSchema,
  adminCompanyListQuerySchema,
  adminCompanyUpdateSchema,
} from '../../src/validation/schemas/adminCompanyManagementSchemas.js';
import {
  adminMessagingApplyLabelsSchema,
  adminMessagingAssignSchema,
  adminMessagingChangeStateSchema,
  adminMessagingCreateThreadSchema,
  adminMessagingEscalateSchema,
  adminMessagingListQuerySchema,
  adminMessagingSendMessageSchema,
  adminMessagingSupportStatusSchema,
} from '../../src/validation/schemas/adminMessagingSchemas.js';
import {
  adminModerationEventsQuerySchema,
  adminModerationQueueQuerySchema,
  adminModerationResolveSchema,
} from '../../src/validation/schemas/adminModerationSchemas.js';
import {
  agencyProfileQuerySchema,
  createAgencyProfileMediaSchema,
  createAgencyProfileSkillSchema,
  followerParamsSchema,
  requestConnectionBodySchema,
  respondConnectionBodySchema,
  updateAgencyAvatarSchema,
  updateAgencyProfileBasicsSchema,
  updateAgencyProfileSchema,
} from '../../src/validation/schemas/agencySchemas.js';

const sampleOwner = {
  ownerEmail: 'owner@example.com',
  ownerFirstName: 'Taylor',
  ownerLastName: 'Swift',
  ownerPhone: '+1234567890',
  password: 'super-secure-password',
};

describe('adminAgencyManagementSchemas', () => {
  it('normalises create payloads and collections', () => {
    const result = adminAgencyCreateSchema.parse({
      ...sampleOwner,
      agencyName: '  Acme Agency ',
      focusArea: null,
      services: ['Design', ' design '],
      industries: 'Media,Marketing',
      clients: ['Acme Corp', 'acme corp'],
      followerPolicy: 'Open',
      connectionPolicy: 'Invite_only',
      status: 'ACTIVE',
    });

    expect(result.agencyName).toBe('Acme Agency');
    expect(result.services).toEqual(['design']);
    expect(result.industries).toEqual(['media', 'marketing']);
    expect(result.clients).toEqual(['acme corp']);
    expect(result.followerPolicy).toBe('open');
    expect(result.connectionPolicy).toBe('invite_only');
    expect(result.status).toBe('active');
  });

  it('strips unsupported status values', () => {
    expect(() =>
      adminAgencyUpdateSchema.parse({ agencyName: 'Agency', status: 'unknown-status' }),
    ).toThrow('status must be invited, active, suspended, or archived.');
  });

  it('enforces allowed sort orders on list queries', () => {
    const parsed = adminAgencyListQuerySchema.parse({ sort: 'NAME_ASC', limit: '50' });
    expect(parsed.sort).toBe('name_asc');
    expect(parsed.limit).toBe(50);
  });
});

describe('adminCompanyManagementSchemas', () => {
  it('normalises social links and status', () => {
    const result = adminCompanyCreateSchema.parse({
      ...sampleOwner,
      companyName: 'Gigvora',
      socialLinks: [{ label: 'LinkedIn', url: 'linkedin.com/company/gigvora' }],
      status: 'Invited',
    });

    expect(result.socialLinks[0]).toEqual({ label: 'LinkedIn', url: 'https://linkedin.com/company/gigvora' });
    expect(result.status).toBe('invited');
  });

  it('rejects malformed social links', () => {
    expect(() =>
      adminCompanyUpdateSchema.parse({ companyName: 'Gigvora', socialLinks: [{ label: '', url: '' }] }),
    ).toThrow('Provide a label or URL for the social link.');
  });

  it('ensures list query sort and pagination are constrained', () => {
    const parsed = adminCompanyListQuerySchema.parse({ sort: 'CREATED_DESC', limit: '10', offset: '5' });
    expect(parsed.sort).toBe('created_desc');
    expect(parsed.limit).toBe(10);
    expect(parsed.offset).toBe(5);
  });
});

describe('adminMessagingSchemas', () => {
  it('normalises list query filters', () => {
    const parsed = adminMessagingListQuerySchema.parse({
      channelTypes: 'support,PROJECT',
      supportPriorities: ['HIGH', 'low'],
      labelIds: ['1', 2, '002'],
      pageSize: '40',
      dateFrom: '2024-05-01T10:00:00Z',
    });

    expect(parsed.channelTypes).toEqual(['support', 'project']);
    expect(parsed.supportPriorities).toEqual(['high', 'low']);
    expect(parsed.labelIds).toEqual([1, 2]);
    expect(parsed.pageSize).toBe(40);
    expect(parsed.dateFrom).toBe('2024-05-01T10:00:00.000Z');
  });

  it('requires valid thread creation payloads', () => {
    const result = adminMessagingCreateThreadSchema.parse({
      subject: ' Kick-off ',
      channelType: 'PROJECT',
      participantIds: ['1', 1, 2],
    });

    expect(result.channelType).toBe('project');
    expect(result.participantIds).toEqual([1, 2]);
    expect(result.subject).toBe('Kick-off');
  });

  it('rejects empty messages without body or attachments', () => {
    expect(() => adminMessagingSendMessageSchema.parse({ messageType: 'text' })).toThrow(
      'Provide a message body or at least one attachment.',
    );
  });

  it('enforces valid state transitions and assignment payloads', () => {
    const state = adminMessagingChangeStateSchema.parse({ state: 'ARCHIVED', note: 'duplicate thread' });
    expect(state).toEqual({ state: 'archived', note: 'duplicate thread' });

    const assignment = adminMessagingAssignSchema.parse({ agentId: '42', notifyAgent: 'true' });
    expect(assignment.agentId).toBe(42);
    expect(assignment.notifyAgent).toBe(true);
  });

  it('validates escalation and support status payloads', () => {
    const escalation = adminMessagingEscalateSchema.parse({ priority: 'HIGH', reason: 'VIP customer' });
    expect(escalation.priority).toBe('high');

    expect(() => adminMessagingSupportStatusSchema.parse({ status: 'unknown' })).toThrow('status is not supported.');
  });

  it('deduplicates label ids', () => {
    const payload = adminMessagingApplyLabelsSchema.parse({ labelIds: [1, '1', 2] });
    expect(payload.labelIds).toEqual([1, 2]);
  });
});

describe('adminModerationSchemas', () => {
  it('normalises queue query filters', () => {
    const parsed = adminModerationQueueQuerySchema.parse({
      severities: 'HIGH,low',
      channels: ['Support', 'support'],
      status: 'open,RESOLVED',
      page: '2',
      createdFrom: '2024-01-01T00:00:00Z',
    });

    expect(parsed.severities).toEqual(['high', 'low']);
    expect(parsed.channels).toEqual(['support']);
    expect(parsed.status).toEqual(['open', 'resolved']);
    expect(parsed.page).toBe(2);
    expect(parsed.createdFrom).toBe('2024-01-01T00:00:00.000Z');
  });

  it('normalises event queries with actor filtering', () => {
    const parsed = adminModerationEventsQuerySchema.parse({
      actorId: '99',
      actions: 'message_flagged,manual_review',
      severities: ['LOW', 'critical'],
    });

    expect(parsed.actorId).toBe(99);
    expect(parsed.actions).toEqual(['message_flagged', 'manual_review']);
    expect(parsed.severities).toEqual(['low', 'critical']);
  });

  it('requires actionable resolve payloads', () => {
    expect(() => adminModerationResolveSchema.parse({ notes: '' })).toThrow(
      'Provide a status update or resolution notes.',
    );

    const resolved = adminModerationResolveSchema.parse({ status: 'RESOLVED', notes: 'Handled by ops' });
    expect(resolved.status).toBe('resolved');
    expect(resolved.notes).toBe('Handled by ops');
  });
});

describe('agencySchemas', () => {
  it('validates profile updates and avatar payloads', () => {
    const profile = updateAgencyProfileSchema.parse({
      agencyName: '  Gigvora Labs ',
      website: 'gigvora.com',
      followerPolicy: 'Closed',
    });
    expect(profile.agencyName).toBe('Gigvora Labs');
    expect(profile.website).toBe('https://gigvora.com');
    expect(profile.followerPolicy).toBe('closed');

    expect(() => updateAgencyAvatarSchema.parse({})).toThrow('Provide at least one field to update.');
  });

  it('handles follower, connection, and respond payloads', () => {
    const followerParams = followerParamsSchema.parse({ followerId: '42' });
    expect(followerParams.followerId).toBe(42);

    const connectionRequest = requestConnectionBodySchema.parse({ targetId: 5 });
    expect(connectionRequest.targetId).toBe(5);

    const response = respondConnectionBodySchema.parse({ decision: 'ACCEPT', note: 'welcome aboard' });
    expect(response.decision).toBe('accept');
    expect(response.note).toBe('welcome aboard');
  });

  it('normalises media and skill payloads', () => {
    const media = createAgencyProfileMediaSchema.parse({ url: 'https://example.com/demo.mp4', title: '  Demo  ' });
    expect(media.type).toBe('image');
    expect(media.title).toBe('Demo');

    const skill = createAgencyProfileSkillSchema.parse({ name: ' Delivery ', proficiency: '90' });
    expect(skill.name).toBe('Delivery');
    expect(skill.proficiency).toBe(90);
  });

  it('sanitises profile basics queries', () => {
    const query = agencyProfileQuerySchema.parse({ includeFollowers: 'true', followersLimit: '10' });
    expect(query.includeFollowers).toBe(true);
    expect(query.followersLimit).toBe(10);
  });
});
