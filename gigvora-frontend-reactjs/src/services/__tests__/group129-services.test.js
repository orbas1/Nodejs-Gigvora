import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../apiClient.js', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    API_BASE_URL: 'http://localhost/api',
    ApiError: class ApiError extends Error {},
  };
  return {
    apiClient: api,
    default: api,
  };
});

import apiClient from '../apiClient.js';
import {
  fetchIdentityVerification,
  createIdentityVerificationEvent,
} from '../identityVerification.js';
import { deleteInboxSavedReply } from '../inbox.js';
import { submitTalentApplication } from '../launchpad.js';
import { fetchFreelancerLearningHub } from '../learningHub.js';
import {
  reactToFeedPost,
  listFeedPosts,
  listFeedComments,
  createFeedComment,
  createFeedReply,
} from '../liveFeed.js';
import { scheduleMaintenanceWindow } from '../maintenanceMode.js';
import { resolveModerationEvent } from '../moderation.js';
import {
  listNetworkingSessions,
  getNetworkingSession,
  updateNetworkingSession,
  updateNetworkingSignup,
} from '../networking.js';
import { fetchUserNotifications } from '../notificationCenter.js';
import { updateOrderRequirement } from '../orderPipeline.js';
import { createPageSetting } from '../pageSettings.js';
import { createUserPage } from '../pages.js';
import { deletePipelineDeal } from '../pipeline.js';
import { updatePlatformSettings } from '../platformSettings.js';
import { archiveWorkspaceJobApplication } from '../jobApplications.js';
import { sendMessage } from '../messaging.js';
import { updateAdminMobileApp } from '../mobileApps.js';
import { fetchInterviewRoom } from '../interviews.js';

beforeEach(() => {
  apiClient.get.mockReset();
  apiClient.post.mockReset();
  apiClient.put.mockReset();
  apiClient.patch.mockReset();
  apiClient.delete.mockReset();
});

describe('identityVerification service', () => {
  it('sanitises actor context when fetching verification', async () => {
    apiClient.get.mockResolvedValue({});

    await fetchIdentityVerification({
      userId: 'user-123',
      profileId: 'profile-9',
      includeHistory: false,
      actorRoles: [' Admin ', 'mentor', 'admin'],
      actorId: 'actor-1',
    });

    expect(apiClient.get).toHaveBeenCalledWith('/compliance/identity', {
      params: {
        userId: 'user-123',
        profileId: 'profile-9',
        includeHistory: 'false',
        actorId: 'actor-1',
        actorRoles: 'admin,mentor',
      },
      signal: undefined,
    });
  });

  it('requires event type when creating verification event', async () => {
    await expect(createIdentityVerificationEvent('ver-1', {})).rejects.toThrow(
      'type is required to create an identity verification event.',
    );
  });
});

describe('inbox service', () => {
  it('sends delete payload in request body', async () => {
    apiClient.delete.mockResolvedValue({ status: 204 });

    await deleteInboxSavedReply('reply-1', { userId: 'u1' });

    expect(apiClient.delete).toHaveBeenCalledWith('/messaging/inbox/saved-replies/reply-1', {
      signal: undefined,
      body: { userId: 'u1' },
    });
  });
});

describe('launchpad service', () => {
  it('requires launchpadId when submitting talent application', async () => {
    await expect(submitTalentApplication({ applicant: 'A' })).rejects.toThrow(
      'launchpadId is required for Launchpad submissions.',
    );
  });
});

describe('learning hub service', () => {
  it('requires freelancerId for workspace fetch', async () => {
    await expect(fetchFreelancerLearningHub({ includeEmpty: true })).rejects.toThrow(
      'freelancerId is required for learning hub operations.',
    );
  });
});

describe('live feed service', () => {
  it('requires reaction when reacting to feed post', async () => {
    await expect(reactToFeedPost('post-1')).rejects.toThrow(
      'A reaction is required to react to the feed entry.',
    );
  });

  it('normalises list response when fetching posts', async () => {
    apiClient.get.mockResolvedValue({ data: [{ id: 'p1' }], nextCursor: 'next', hasMore: true });

    const result = await listFeedPosts({ params: { limit: 5 } });

    expect(apiClient.get).toHaveBeenCalledWith('/feed', {
      params: { limit: 5 },
      signal: undefined,
      headers: undefined,
    });
    expect(result.items).toHaveLength(1);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('next');
  });

  it('requires post id to list comments', async () => {
    await expect(listFeedComments()).rejects.toThrow('A post identifier is required to list feed comments.');
  });

  it('requires message when creating feed comment', async () => {
    await expect(createFeedComment('post-1', {})).rejects.toThrow(
      'A message is required to create a feed comment.',
    );
  });

  it('requires comment id when creating a reply', async () => {
    await expect(createFeedReply('post-1')).rejects.toThrow(
      'A comment identifier is required to create a feed reply.',
    );
  });
});

describe('maintenance mode service', () => {
  it('requires window boundaries when scheduling maintenance', async () => {
    await expect(scheduleMaintenanceWindow({ startsAt: null })).rejects.toThrow(
      'startsAt and endsAt are required to schedule a maintenance window.',
    );
  });
});

describe('moderation service', () => {
  it('validates resolution payload', async () => {
    await expect(resolveModerationEvent('evt-1', {})).rejects.toThrow(
      'resolution status is required to resolve a moderation event.',
    );
  });
});

describe('networking service', () => {
  it('sanitises list parameters and boolean flags', () => {
    listNetworkingSessions({ includeMetrics: true, upcomingOnly: false });

    expect(apiClient.get).toHaveBeenCalledWith('/networking/sessions', {
      params: { includeMetrics: 'true', upcomingOnly: 'false' },
      signal: undefined,
    });
  });

  it('requires session identifier for details', () => {
    expect(() => getNetworkingSession()).toThrow('sessionId is required to fetch a networking session.');
  });

  it('validates update identifiers', () => {
    expect(() => updateNetworkingSession()).toThrow('sessionId is required to update a networking session.');
    expect(() => updateNetworkingSignup('session-1')).toThrow(
      'signupId is required to update a networking signup.',
    );
  });
});

describe('notification center service', () => {
  it('normalises filter parameters', async () => {
    apiClient.get.mockResolvedValue({});
    await fetchUserNotifications('user-1', { status: 'all', category: 'Mentions', page: 2 });
    expect(apiClient.get).toHaveBeenCalledWith('/users/user-1/notifications', {
      params: { category: 'mentions', page: 2 },
      signal: undefined,
    });
  });
});

describe('order pipeline service', () => {
  it('requires formId when updating requirement', () => {
    expect(() => updateOrderRequirement('order-1')).toThrow('formId is required to update a requirement form.');
  });
});

describe('page settings service', () => {
  it('requires pageId when creating settings', async () => {
    await expect(createPageSetting({})).rejects.toThrow('pageId is required to create a page setting.');
  });
});

describe('pages service', () => {
  it('requires name when creating a page', () => {
    expect(() => createUserPage('user-9', {})).toThrow('name is required to create a page.');
  });
});

describe('pipeline service', () => {
  it('sends owner metadata in delete body', async () => {
    apiClient.delete.mockResolvedValue({});
    await deletePipelineDeal('owner-1', 'deal-3', { ownerType: 'agency' });
    expect(apiClient.delete).toHaveBeenCalledWith('/pipeline/deals/deal-3', {
      signal: undefined,
      body: { ownerId: 'owner-1', ownerType: 'agency' },
    });
  });
});

describe('platform settings service', () => {
  it('requires payload to update settings', async () => {
    await expect(updatePlatformSettings(null)).rejects.toThrow(
      'A payload is required to update platform settings.',
    );
  });
});

describe('job applications service', () => {
  it('sends archive requests with secure body payload', async () => {
    apiClient.delete.mockResolvedValue({});
    await archiveWorkspaceJobApplication('owner-2', 'app-5');
    expect(apiClient.delete).toHaveBeenCalledWith('/job-applications/app-5', {
      signal: undefined,
      body: { ownerId: 'owner-2' },
    });
  });
});

describe('messaging service', () => {
  it('requires message body or attachments', () => {
    expect(() => sendMessage('thread-1', { userId: 'user-1' })).toThrow(
      'A message body or attachments are required to send a message.',
    );
  });
});

describe('mobile apps service', () => {
  it('requires appId to update admin mobile app', async () => {
    await expect(updateAdminMobileApp(null, {})).rejects.toThrow('appId is required');
  });
});

describe('interviews service', () => {
  it('requires roomId when fetching interview room', () => {
    expect(() => fetchInterviewRoom()).toThrow('roomId is required');
  });
});
