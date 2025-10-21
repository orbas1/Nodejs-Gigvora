import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../apiClient.js', () => {
  const client = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return { apiClient: client, default: client };
});

import { apiClient } from '../apiClient.js';
import * as blogService from '../blog.js';
import * as catalogInsightsService from '../catalogInsights.js';
import * as clientPortalsService from '../clientPortals.js';
import * as clientSuccessService from '../clientSuccessAutomation.js';
import * as collaborationService from '../collaboration.js';
import * as communitySpotlightService from '../communitySpotlight.js';
import * as companyService from '../company.js';
import * as companyAdsService from '../companyAds.js';
import * as companyAutoReplyService from '../companyAutoReply.js';
import * as companyCalendarService from '../companyCalendar.js';
import * as companyEscrowService from '../companyEscrow.js';
import * as companyIdentityService from '../companyIdentity.js';
import * as companyInboxService from '../companyInbox.js';
import * as companyIntegrationsService from '../companyIntegrations.js';
import * as companyJobOperationsService from '../companyJobOperations.js';
import * as companyLaunchpadJobsService from '../companyLaunchpadJobs.js';
import * as companyMetricsService from '../companyMetrics.js';
import * as companyOrdersService from '../companyOrders.js';
import * as companyProfileService from '../companyProfile.js';

function resetApiClientMocks() {
  apiClient.get.mockReset();
  apiClient.post.mockReset();
  apiClient.put.mockReset();
  apiClient.patch.mockReset();
  apiClient.delete.mockReset();
}

describe('Group 126 service contracts', () => {
  beforeEach(() => {
    resetApiClientMocks();
  });

  describe('blog service', () => {
    it('throws when fetching a post without id', () => {
      expect(() => blogService.fetchBlogPost()).toThrow('A blog identifier is required.');
    });

    it('fetches blog posts with sanitised params', async () => {
      apiClient.get.mockResolvedValue({});
      await blogService.fetchBlogPosts({ search: ' launch ', includeUnpublished: true });
      expect(apiClient.get).toHaveBeenCalledWith('/blog/posts', {
        params: {
          page: 1,
          pageSize: 9,
          search: 'launch',
          includeUnpublished: 'true',
        },
        signal: undefined,
      });
    });

    it('creates agency blog tag with workspace guard', async () => {
      apiClient.post.mockResolvedValue({});
      await blogService.createAgencyBlogTag('ws-1', { name: 'Growth' });
      expect(apiClient.post).toHaveBeenCalledWith(
        '/agency/blog/tags',
        { name: 'Growth', workspaceId: 'ws-1' },
        { signal: undefined },
      );
      expect(() => blogService.createAgencyBlogTag('', { name: 'Invalid' })).toThrow('workspaceId is required.');
    });

    it('fetches admin comments for all posts when no postId is supplied', async () => {
      apiClient.get.mockResolvedValue({});
      await blogService.fetchAdminBlogComments();
      expect(apiClient.get).toHaveBeenCalledWith('/admin/blog/comments', {
        params: { page: 1, pageSize: 25 },
        signal: undefined,
      });
    });
  });

  describe('catalog insights service', () => {
    it('requires a freelancer id', async () => {
      await expect(catalogInsightsService.fetchCatalogInsights()).rejects.toThrow(
        'freelancerId is required to load catalog insights.',
      );
    });

    it('delegates to api client with freelancer id', async () => {
      apiClient.get.mockResolvedValue({ data: [] });
      await catalogInsightsService.fetchCatalogInsights('abc');
      expect(apiClient.get).toHaveBeenCalledWith('/users/abc/catalog-insights', { signal: undefined });
    });
  });

  describe('client portal service', () => {
    it('normalises portal id', async () => {
      apiClient.get.mockResolvedValue({ dashboard: {} });
      await clientPortalsService.fetchClientPortalDashboard(' 123 ');
      expect(apiClient.get).toHaveBeenCalledWith('/client-portals/123/dashboard', { signal: undefined });
    });

    it('throws on missing portal id', async () => {
      await expect(clientPortalsService.fetchClientPortalDashboard()).rejects.toThrow('portalId is required');
    });
  });

  describe('client success automation', () => {
    it('validates freelancer id and gig id', async () => {
      await expect(clientSuccessService.createClientSuccessAffiliateLink('123')).rejects.toThrow(
        'freelancerId and gigId are required',
      );
    });

    it('submits referral payloads to api client', async () => {
      apiClient.post.mockResolvedValue({ ok: true });
      await clientSuccessService.createClientSuccessReferral('f-1', 'g-2', { note: 'Great fit' });
      expect(apiClient.post).toHaveBeenCalledWith(
        '/freelancers/f-1/client-success/gigs/g-2/referrals',
        { note: 'Great fit' },
      );
    });
  });

  describe('collaboration service', () => {
    it('fetches spaces with signal support', async () => {
      const controller = new AbortController();
      apiClient.get.mockResolvedValue({ spaces: [{ id: '1' }] });
      const result = await collaborationService.fetchCollaborationSpaces({}, { signal: controller.signal });
      expect(result).toEqual([{ id: '1' }]);
      expect(apiClient.get).toHaveBeenCalledWith('/collaboration/spaces', { params: {}, signal: controller.signal });
    });

    it('guards repository creation when space id missing', async () => {
      await expect(collaborationService.connectCollaborationRepository()).rejects.toThrow(
        'spaceId is required to connect a repository.',
      );
    });
  });

  describe('community spotlight', () => {
    it('requires freelancer id', async () => {
      await expect(communitySpotlightService.fetchCommunitySpotlight()).rejects.toThrow(
        'freelancerId is required to load the community spotlight.',
      );
    });
  });

  describe('company dashboard service', () => {
    it('requires workspaceId when listing pages', async () => {
      await expect(companyService.fetchCompanyPages()).rejects.toThrow(
        'workspaceId is required to fetch company pages.',
      );
    });

    it('passes deletion parameters correctly', async () => {
      apiClient.delete.mockResolvedValue({});
      await companyService.deleteCompanyPage('page-1', { workspaceId: 'ws-9' });
      expect(apiClient.delete).toHaveBeenCalledWith('/company/dashboard/pages/page-1', {
        params: { workspaceId: 'ws-9' },
        signal: undefined,
      });
    });
  });

  describe('company ads service', () => {
    it('throws on missing creative id', () => {
      expect(() => companyAdsService.updateCompanyAdCreative()).toThrow(
        'creativeId is required to update a creative.',
      );
    });

    it('updates placement when ids provided', async () => {
      apiClient.put.mockResolvedValue({});
      await companyAdsService.updateCompanyAdPlacement('place-1', { name: 'Hero Placement' });
      expect(apiClient.put).toHaveBeenCalledWith(
        '/company/ads/placements/place-1',
        { name: 'Hero Placement' },
        { signal: undefined },
      );
    });
  });

  describe('company auto reply service', () => {
    it('prevents template updates without an id', async () => {
      await expect(companyAutoReplyService.updateAutoReplyTemplate()).rejects.toThrow('templateId is required');
    });

    it('posts template creation payloads', async () => {
      apiClient.post.mockResolvedValue({ id: 'tmpl-1' });
      await companyAutoReplyService.createAutoReplyTemplate({ workspaceId: 'ws-1', template: { name: 'Intro' } });
      expect(apiClient.post).toHaveBeenCalledWith(
        '/company/ai/auto-reply/templates',
        { name: 'Intro', workspaceId: 'ws-1' },
        { signal: undefined },
      );
    });
  });

  describe('company calendar service', () => {
    it('requires workspaceId for fetching events', async () => {
      await expect(companyCalendarService.fetchCompanyCalendar()).rejects.toThrow(
        'workspaceId is required to load company calendar events.',
      );
    });
  });

  describe('company escrow service', () => {
    it('throws when updating account without id', async () => {
      await expect(companyEscrowService.updateEscrowAccount()).rejects.toThrow(
        'accountId is required to update an escrow account.',
      );
    });

    it('posts escrow release payload', async () => {
      apiClient.post.mockResolvedValue({});
      await companyEscrowService.releaseEscrowTransaction('txn-1', { amount: 100 });
      expect(apiClient.post).toHaveBeenCalledWith(
        '/company/escrow/transactions/txn-1/release',
        { amount: 100 },
        { signal: undefined },
      );
    });
  });

  describe('company identity service', () => {
    it('requires verification id', async () => {
      await expect(companyIdentityService.fetchIdentityVerificationDetail()).rejects.toThrow(
        'verificationId is required.',
      );
    });
  });

  describe('company inbox service', () => {
    it('requires thread id for detail fetch', () => {
      expect(() => companyInboxService.fetchCompanyInboxThread()).toThrow(
        'threadId is required to load a company inbox thread.',
      );
    });

    it('serialises thread label updates', async () => {
      apiClient.post.mockResolvedValue({});
      await companyInboxService.setCompanyThreadLabels('thread-1', { labelIds: ['a', 'b'] });
      expect(apiClient.post).toHaveBeenCalledWith(
        '/company/inbox/threads/thread-1/labels',
        { labelIds: ['a', 'b'], actorId: undefined },
        { params: {}, signal: undefined },
      );
    });
  });

  describe('company integrations service', () => {
    it('requires provider key when updating integration', () => {
      expect(() => companyIntegrationsService.updateCrmIntegration()).toThrow(
        'providerKey is required to update an integration.',
      );
    });

    it('creates incidents with full identifiers', async () => {
      apiClient.post.mockResolvedValue({});
      await companyIntegrationsService.createCrmIncident('int-1', {
        providerKey: 'hubspot',
        severity: 'high',
        summary: 'Sync failed',
      });
      expect(apiClient.post).toHaveBeenCalledWith(
        '/company/integrations/crm/int-1/incidents',
        { providerKey: 'hubspot', severity: 'high', summary: 'Sync failed', description: undefined },
      );
    });
  });

  describe('company job operations', () => {
    it('refuses to update without job id', async () => {
      await expect(companyJobOperationsService.updateJobAdvert()).rejects.toThrow(
        'jobId is required to update a job advert.',
      );
    });

    it('patches candidate notes with identifiers', async () => {
      apiClient.patch.mockResolvedValue({});
      await companyJobOperationsService.updateCandidateNote('job-1', 'app-2', 'note-3', { text: 'Updated' });
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/company/jobs/job-1/applications/app-2/notes/note-3',
        { text: 'Updated' },
        { signal: undefined },
      );
    });
  });

  describe('company launchpad jobs', () => {
    it('validates identifiers on placement updates', async () => {
      await expect(companyLaunchpadJobsService.updateLaunchpadPlacement(undefined, {})).rejects.toThrow(
        'placementId is required to update a launchpad placement.',
      );
    });

    it('deletes placements with sanitised id', async () => {
      apiClient.delete.mockResolvedValue({});
      await companyLaunchpadJobsService.deleteLaunchpadPlacement('pl-7');
      expect(apiClient.delete).toHaveBeenCalledWith('/company/launchpad/placements/pl-7', { signal: undefined });
    });
  });

  describe('company metrics service', () => {
    it('requires goal id to update metric goal', () => {
      expect(() => companyMetricsService.updateCompanyMetricGoal()).toThrow(
        'goalId is required to update a metric goal.',
      );
    });
  });

  describe('company orders service', () => {
    it('requires orderId when updating', () => {
      expect(() => companyOrdersService.updateCompanyOrder()).toThrow('orderId is required');
    });

    it('posts escrow updates with identifiers', async () => {
      apiClient.patch.mockResolvedValue({});
      await companyOrdersService.updateCompanyOrderEscrow('order-1', 'check-2', { status: 'released' });
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/company/orders/order-1/escrow/check-2',
        { status: 'released' },
        { signal: undefined },
      );
    });
  });

  describe('company profile service', () => {
    it('requires follower id to update follower', () => {
      expect(() => companyProfileService.updateCompanyFollower()).toThrow('followerId is required');
    });

    it('removes connections via api client', async () => {
      apiClient.delete.mockResolvedValue({});
      await companyProfileService.removeCompanyConnection('conn-4');
      expect(apiClient.delete).toHaveBeenCalledWith('/company/profile/connections/conn-4', { signal: undefined });
    });
  });
});

