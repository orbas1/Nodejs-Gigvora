import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../apiClient.js', () => {
  class ApiError extends Error {
    constructor(message, status, body) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.body = body;
    }
  }

  const mockClient = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  };

  mockClient.ApiError = ApiError;

  return {
    __esModule: true,
    default: mockClient,
    apiClient: mockClient,
  };
});

import apiClient from '../apiClient.js';
import {
  AutoAssignServiceError,
  enqueueProjectAssignments,
  fetchFreelancerQueue,
  fetchProjectQueue,
  updateQueueEntry,
} from '../autoAssign.js';

describe('autoAssign service', () => {
  beforeEach(() => {
    apiClient.get.mockReset();
    apiClient.post.mockReset();
    apiClient.patch.mockReset();
  });

  describe('fetchFreelancerQueue', () => {
    it('requires a valid freelancerId', async () => {
      await expect(fetchFreelancerQueue()).rejects.toThrow('freelancerId is required');
      await expect(fetchFreelancerQueue({ freelancerId: 0 })).rejects.toThrow('freelancerId is required');
    });

    it('normalises parameters and response payloads', async () => {
      apiClient.get.mockResolvedValue({
        entries: [
          {
            id: '31',
            status: 'UNKNOWN',
            score: '0.45678',
            position: 0,
            priorityBucket: '3',
            projectValue: '5200',
            weights: { recency: '0.2', rating: 'not-a-number' },
            breakdown: { recencyScore: '0.7' },
            metadata: { projectName: 'Launch' },
            response: { status: 'pending' },
            freelancer: { id: 99, name: 'Taylor' },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: 'invalid-date',
            expiresAt: '2024-01-02T12:00:00Z',
          },
        ],
        pagination: { page: '0', pageSize: '200', totalEntries: '1', totalPages: 0 },
      });

      const result = await fetchFreelancerQueue({
        freelancerId: '42',
        statuses: ['PENDING', 'ignored'],
        page: '2.8',
        pageSize: '200',
      });

      expect(apiClient.get).toHaveBeenCalledWith('/auto-assign/queue', {
        params: {
          freelancerId: 42,
          page: 2,
          pageSize: 50,
          statuses: 'pending',
        },
        signal: undefined,
      });

      expect(result.entries).toHaveLength(1);
      const entry = result.entries[0];
      expect(entry.status).toBe('pending');
      expect(entry.score).toBeCloseTo(0.4568);
      expect(entry.position).toBe(1);
      expect(entry.priorityBucket).toBe(3);
      expect(entry.projectValue).toBe(5200);
      expect(entry.weights).toEqual({ recency: 0.2, rating: 0 });
      expect(entry.breakdown).toEqual({ recencyScore: '0.7' });
      expect(entry.metadata).toEqual({ projectName: 'Launch' });
      expect(entry.response).toEqual({ status: 'pending' });
      expect(entry.freelancer).toEqual({ id: 99, name: 'Taylor' });
      expect(entry.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(entry.updatedAt).toBeNull();
      expect(entry.expiresAt).toBe('2024-01-02T12:00:00.000Z');
      expect(result.pagination).toEqual({ page: 2, pageSize: 50, totalEntries: 1, totalPages: 1 });
    });

    it('defaults to historical statuses when requested', async () => {
      apiClient.get.mockResolvedValue({ entries: [], pagination: {} });

      await fetchFreelancerQueue({ freelancerId: 5, includeHistorical: true });

      expect(apiClient.get).toHaveBeenCalledWith('/auto-assign/queue', {
        params: {
          freelancerId: 5,
          page: 1,
          pageSize: 10,
          statuses: 'pending,notified,accepted,declined,expired,reassigned,completed',
        },
        signal: undefined,
      });
    });

    it('wraps ApiError responses with friendly messaging', async () => {
      apiClient.get.mockRejectedValue(new apiClient.ApiError('Forbidden', 403));

      await expect(fetchFreelancerQueue({ freelancerId: 12 })).rejects.toMatchObject({
        name: 'AutoAssignServiceError',
        status: 403,
      });
    });
  });

  describe('enqueueProjectAssignments', () => {
    it('requires a valid project identifier', async () => {
      await expect(enqueueProjectAssignments()).rejects.toThrow('projectId is required');
    });

    it('sanitises payloads before submission', async () => {
      apiClient.post.mockResolvedValue({ entries: [] });

      await enqueueProjectAssignments(
        '7',
        {
          projectValue: '1200.5',
          limit: 0,
          expiresInMinutes: '180',
          weights: { recency: '0.5', rating: 'not-a-number' },
          fairness: { ensureNewcomer: 'false', maxAssignments: '3', windowDays: '7' },
        },
        {},
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        '/auto-assign/projects/7/enqueue',
        {
          projectValue: 1200.5,
          expiresInMinutes: 180,
          targetType: 'project',
          weights: { recency: 0.5, rating: 0 },
          fairness: { ensureNewcomer: false, maxAssignments: 3, windowDays: 7 },
        },
        { signal: undefined },
      );
    });

    it('translates ApiErrors into service errors', async () => {
      apiClient.post.mockRejectedValue(new apiClient.ApiError('Conflict', 409, { reason: 'fresh' }));

      await expect(enqueueProjectAssignments(1, {})).rejects.toMatchObject({
        name: 'AutoAssignServiceError',
        status: 409,
        details: { reason: 'fresh' },
      });
    });
  });

  describe('updateQueueEntry', () => {
    it('validates identifiers and statuses', async () => {
      await expect(updateQueueEntry()).rejects.toThrow('entryId is required');
      await expect(updateQueueEntry(1, { status: 'invalid' })).rejects.toBeInstanceOf(AutoAssignServiceError);
    });

    it('normalises queue update payloads', async () => {
      apiClient.patch.mockResolvedValue({ ok: true });

      await updateQueueEntry(
        '22',
        {
          status: 'Declined',
          rating: '4.6',
          completionValue: '1500',
          freelancerId: '33',
          reasonCode: 'double_booked',
          reasonLabel: 'Double booked ',
          responseNotes: '  Thanks!  ',
          metadata: { handledBy: 'ops' },
        },
        {},
      );

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/auto-assign/queue/22',
        {
          status: 'declined',
          rating: 4.6,
          completionValue: 1500,
          freelancerId: 33,
          reasonCode: 'double_booked',
          reasonLabel: 'Double booked',
          responseNotes: 'Thanks!',
          metadata: { handledBy: 'ops' },
        },
        { signal: undefined },
      );
    });

    it('wraps patch errors into AutoAssignServiceError', async () => {
      apiClient.patch.mockRejectedValue(new apiClient.ApiError('Gone', 404));

      await expect(updateQueueEntry(5, {})).rejects.toMatchObject({
        name: 'AutoAssignServiceError',
        status: 404,
      });
    });
  });

  describe('fetchProjectQueue', () => {
    it('validates identifiers and sanitises target types', async () => {
      apiClient.get.mockResolvedValue({ entries: [{ id: 1, status: 'accepted', score: 0.4 }], pagination: {} });

      const result = await fetchProjectQueue('9', { targetType: 'Invalid' });

      expect(apiClient.get).toHaveBeenCalledWith('/auto-assign/projects/9/queue', {
        params: { targetType: 'project' },
        signal: undefined,
      });

      expect(result.entries[0]).toMatchObject({ status: 'accepted', score: 0.4, position: 1 });
      expect(result.pagination).toEqual({ page: 1, pageSize: 10, totalEntries: 1, totalPages: 1 });
    });

    it('surfaces authentication errors clearly', async () => {
      apiClient.get.mockRejectedValue(new apiClient.ApiError('Unauthorized', 401));

      await expect(fetchProjectQueue(8, {})).rejects.toMatchObject({
        name: 'AutoAssignServiceError',
        status: 401,
      });
    });
  });
});
