import { useCallback, useMemo, useState } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchFreelancerReviews,
  createFreelancerReview,
  updateFreelancerReview,
  deleteFreelancerReview,
} from '../services/reputation.js';

const FALLBACK_REVIEWS = [
  {
    id: 'demo-review-1',
    title: 'Outstanding strategic partner',
    reviewerName: 'Priya Desai',
    reviewerRole: 'Chief Product Officer',
    reviewerCompany: 'Lumina Health',
    rating: 5,
    status: 'published',
    highlighted: true,
    reviewSource: 'invited',
    body:
      'Amelia aligned engineering, design, and commercial teams around a bold customer experience vision. She led the execution with empathy and rigour.',
    capturedAt: '2024-04-18T12:00:00.000Z',
    publishedAt: '2024-04-20T09:00:00.000Z',
    previewUrl: null,
    heroImageUrl: null,
    tags: ['product strategy', 'enterprise'],
    createdAt: '2024-04-18T12:00:00.000Z',
    updatedAt: '2024-04-20T09:00:00.000Z',
  },
  {
    id: 'demo-review-2',
    title: 'Reliable enterprise delivery',
    reviewerName: 'Miguel Alvarez',
    reviewerRole: 'Director of CX',
    reviewerCompany: 'Northwind Bank',
    rating: 4.8,
    status: 'pending',
    highlighted: false,
    reviewSource: 'auto-request',
    body:
      'Discovery was thorough, communication transparent, and the delivery playbook kept our stakeholders confident throughout.',
    capturedAt: '2024-04-22T15:20:00.000Z',
    publishedAt: null,
    previewUrl: null,
    heroImageUrl: null,
    tags: ['financial services', 'cx research'],
    createdAt: '2024-04-22T15:20:00.000Z',
    updatedAt: '2024-04-22T15:20:00.000Z',
  },
  {
    id: 'demo-review-3',
    title: 'Go-to innovation partner',
    reviewerName: 'Dana Lee',
    reviewerRole: 'VP Innovation',
    reviewerCompany: 'Atlas Robotics',
    rating: 4.9,
    status: 'draft',
    highlighted: false,
    reviewSource: 'imported',
    body:
      'From framing the opportunity to orchestrating the pilot, Amelia kept momentum high and grounded decisions in evidence.',
    capturedAt: '2024-04-25T11:15:00.000Z',
    publishedAt: null,
    previewUrl: null,
    heroImageUrl: null,
    tags: ['innovation', 'pilot'],
    createdAt: '2024-04-25T11:15:00.000Z',
    updatedAt: '2024-04-25T11:15:00.000Z',
  },
];

const FALLBACK_SUMMARY = {
  total: FALLBACK_REVIEWS.length,
  draft: 1,
  pending: 1,
  published: 1,
  archived: 0,
  highlighted: 1,
  averageRating: 4.9,
  lastPublishedAt: '2024-04-20T09:00:00.000Z',
};

const FALLBACK_RATING_DISTRIBUTION = { 5: 2, 4: 1, 3: 0, 2: 0, 1: 0 };

const FALLBACK_INSIGHTS = {
  topTags: [
    { tag: 'product strategy', count: 1 },
    { tag: 'enterprise', count: 1 },
    { tag: 'financial services', count: 1 },
  ],
  highlightedCount: 1,
  heroImageCoverage: 0,
  previewCoverage: 0,
  lastPublishedAt: '2024-04-20T09:00:00.000Z',
};

const DEFAULT_FILTERS = Object.freeze({
  status: 'all',
  highlighted: undefined,
  minRating: null,
  maxRating: null,
  sort: 'recent',
  query: '',
  tags: [],
  page: 1,
  pageSize: 10,
});

function serializeFilters(filters) {
  const normalised = { ...filters };
  normalised.tags = Array.isArray(filters.tags) ? filters.tags.slice().sort() : [];
  return JSON.stringify(normalised);
}

function normaliseTagsInput(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return `${value}`
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function useFreelancerReviews({ freelancerId, enabled = true, initialFilters = {} } = {}) {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [lastError, setLastError] = useState(null);

  const safeId = freelancerId ?? 'demo-freelancer';
  const serializedFilters = useMemo(() => serializeFilters(filters), [filters]);

  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!freelancerId) {
        return Promise.resolve({
          reviews: FALLBACK_REVIEWS,
          summary: FALLBACK_SUMMARY,
          ratingDistribution: FALLBACK_RATING_DISTRIBUTION,
          insights: FALLBACK_INSIGHTS,
          pagination: { page: 1, pageSize: DEFAULT_FILTERS.pageSize, total: FALLBACK_REVIEWS.length, totalPages: 1 },
        });
      }
      const params = {
        ...filters,
        tags: filters.tags,
      };
      if (!params.highlighted) {
        delete params.highlighted;
      }
      return fetchFreelancerReviews(freelancerId, params, { signal });
    },
    [filters, freelancerId],
  );

  const resource = useCachedResource(`freelancer:reviews:${safeId}:${serializedFilters}`, fetcher, {
    enabled,
    dependencies: [safeId, serializedFilters],
    ttl: 1000 * 30,
  });

  const reviews = resource.data?.reviews ?? FALLBACK_REVIEWS;
  const summary = resource.data?.summary ?? FALLBACK_SUMMARY;
  const ratingDistribution = resource.data?.ratingDistribution ?? FALLBACK_RATING_DISTRIBUTION;
  const insights = resource.data?.insights ?? FALLBACK_INSIGHTS;
  const pagination = resource.data?.pagination ?? {
    page: filters.page,
    pageSize: filters.pageSize,
    total: reviews.length,
    totalPages: Math.max(1, Math.ceil(reviews.length / filters.pageSize)),
  };

  const setFilterValue = useCallback((patch) => {
    setFilters((previous) => ({ ...previous, ...patch }));
  }, []);

  const refresh = useCallback((options) => resource.refresh(options), [resource]);

  const handleCreate = useCallback(
    async (payload) => {
      if (!freelancerId) {
        return { review: payload, fallback: true };
      }
      setCreating(true);
      setLastError(null);
      try {
        const result = await createFreelancerReview(freelancerId, payload);
        await refresh({ force: true });
        return { review: result, fallback: false };
      } catch (error) {
        setLastError(error);
        throw error;
      } finally {
        setCreating(false);
      }
    },
    [freelancerId, refresh],
  );

  const handleUpdate = useCallback(
    async (reviewId, payload) => {
      if (!freelancerId) {
        return { review: { ...payload, id: reviewId }, fallback: true };
      }
      setUpdatingId(reviewId);
      setLastError(null);
      try {
        const result = await updateFreelancerReview(freelancerId, reviewId, payload);
        await refresh({ force: true });
        return { review: result, fallback: false };
      } catch (error) {
        setLastError(error);
        throw error;
      } finally {
        setUpdatingId(null);
      }
    },
    [freelancerId, refresh],
  );

  const handleDelete = useCallback(
    async (reviewId) => {
      if (!freelancerId) {
        return { success: true, fallback: true };
      }
      setDeletingId(reviewId);
      setLastError(null);
      try {
        await deleteFreelancerReview(freelancerId, reviewId);
        await refresh({ force: true });
        return { success: true, fallback: false };
      } catch (error) {
        setLastError(error);
        throw error;
      } finally {
        setDeletingId(null);
      }
    },
    [freelancerId, refresh],
  );

  return {
    reviews,
    summary,
    ratingDistribution,
    insights,
    pagination,
    filters,
    setFilters: setFilterValue,
    setFilterTags: (tags) => setFilterValue({ tags: normaliseTagsInput(tags), page: 1 }),
    setPage: (page) => setFilterValue({ page }),
    createReview: handleCreate,
    updateReview: handleUpdate,
    deleteReview: handleDelete,
    creating,
    updatingId,
    deletingId,
    loading: resource.loading,
    error: resource.error,
    lastError,
    lastUpdated: resource.lastUpdated,
    fromCache: resource.fromCache,
    refresh,
  };
}
