import { fn, col } from 'sequelize';
import {
  PeerMentoringSession,
  MentorshipOrder,
  MentorFavourite,
  MentorRecommendation,
  MentorReview,
  User,
  Profile,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'dashboard:user:mentoring';
const PARENT_DASHBOARD_NAMESPACE = 'dashboard:user';
const CACHE_TTL_SECONDS = 60;

const mentorAttributes = ['id', 'firstName', 'lastName', 'email', 'location'];
const profileAttributes = ['headline', 'missionStatement', 'availabilityStatus', 'avatarSeed', 'timezone'];

function buildMentorInclude() {
  return {
    model: User,
    as: 'mentor',
    attributes: mentorAttributes,
    include: [{ model: Profile, as: 'Profile', attributes: profileAttributes }],
  };
}

function normalizeUserId(userId) {
  const numeric = Number.parseInt(userId, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('A valid userId is required.');
  }
  return numeric;
}

function toPlainUser(instance) {
  if (!instance) return null;
  const plain = instance.get?.({ plain: true }) ?? instance;
  const profile =
    plain.profile ??
    plain.Profile ??
    instance.get?.('profile') ??
    instance.get?.('Profile') ??
    null;
  return {
    id: plain.id,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
    location: plain.location ?? null,
    profile: profile
      ? {
          headline: profile.headline ?? profile.missionStatement ?? null,
          availabilityStatus: profile.availabilityStatus ?? null,
          avatarSeed: profile.avatarSeed ?? null,
          timezone: profile.timezone ?? null,
        }
      : null,
  };
}

function toPlainOrder(instance) {
  if (!instance) return null;
  const plain = instance.get?.({ plain: true }) ?? instance;
  return {
    id: plain.id,
    userId: plain.userId,
    mentorId: plain.mentorId,
    packageName: plain.packageName,
    packageDescription: plain.packageDescription,
    sessionsPurchased: plain.sessionsPurchased,
    sessionsRedeemed: plain.sessionsRedeemed,
    totalAmount: plain.totalAmount != null ? Number(plain.totalAmount) : null,
    currency: plain.currency,
    status: plain.status,
    purchasedAt: plain.purchasedAt,
    expiresAt: plain.expiresAt,
    metadata: plain.metadata ?? null,
    mentor: toPlainUser(plain.mentor ?? instance.get?.('mentor')),
    sessions: Array.isArray(plain.sessions)
      ? plain.sessions.map((session) => ({ id: session.id, status: session.status, scheduledAt: session.scheduledAt }))
      : [],
  };
}

function toPlainSession(instance) {
  if (!instance) return null;
  const plain = instance.get?.({ plain: true }) ?? instance;
  return {
    id: plain.id,
    serviceLineId: plain.serviceLineId ?? null,
    mentorId: plain.mentorId,
    menteeId: plain.menteeId,
    orderId: plain.orderId ?? null,
    topic: plain.topic,
    agenda: plain.agenda ?? null,
    scheduledAt: plain.scheduledAt,
    durationMinutes: plain.durationMinutes ?? null,
    status: plain.status,
    meetingUrl: plain.meetingUrl ?? null,
    meetingLocation: plain.meetingLocation ?? null,
    meetingType: plain.meetingType ?? null,
    recordingUrl: plain.recordingUrl ?? null,
    notes: plain.notes ?? null,
    pricePaid: plain.pricePaid != null ? Number(plain.pricePaid) : null,
    currency: plain.currency ?? null,
    cancelledAt: plain.cancelledAt ?? null,
    completedAt: plain.completedAt ?? null,
    feedbackRequested: Boolean(plain.feedbackRequested),
    mentor: toPlainUser(plain.mentor ?? instance.get?.('mentor')),
    order: toPlainOrder(plain.order ?? instance.get?.('order')),
  };
}

function toPlainFavourite(instance) {
  if (!instance) return null;
  const plain = instance.get?.({ plain: true }) ?? instance;
  return {
    id: plain.id,
    userId: plain.userId,
    mentorId: plain.mentorId,
    notes: plain.notes ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    mentor: toPlainUser(plain.mentor ?? instance.get?.('mentor')),
  };
}

function toPlainRecommendation(instance) {
  if (!instance) return null;
  const plain = instance.get?.({ plain: true }) ?? instance;
  return {
    id: plain.id,
    userId: plain.userId,
    mentorId: plain.mentorId,
    score: plain.score != null ? Number(plain.score) : null,
    source: plain.source ?? null,
    reason: plain.reason ?? null,
    generatedAt: plain.generatedAt,
    mentor: toPlainUser(plain.mentor ?? instance.get?.('mentor')),
  };
}

function toPlainReview(instance) {
  if (!instance) return null;
  const plain = instance.get?.({ plain: true }) ?? instance;
  return {
    id: plain.id,
    userId: plain.userId,
    mentorId: plain.mentorId,
    sessionId: plain.sessionId ?? null,
    orderId: plain.orderId ?? null,
    rating: plain.rating,
    wouldRecommend: Boolean(plain.wouldRecommend),
    headline: plain.headline ?? null,
    feedback: plain.feedback ?? null,
    praiseHighlights: Array.isArray(plain.praiseHighlights) ? plain.praiseHighlights : [],
    improvementAreas: Array.isArray(plain.improvementAreas) ? plain.improvementAreas : [],
    publishedAt: plain.publishedAt,
    isPublic: Boolean(plain.isPublic),
    mentor: toPlainUser(plain.mentor ?? instance.get?.('mentor')),
    session: plain.session ? toPlainSession(plain.session) : null,
  };
}

function calculateSummary(sessions, orders) {
  const totalSessions = sessions.length;
  const now = new Date();
  const upcomingSessions = sessions.filter(
    (session) => session.status === 'scheduled' && session.scheduledAt && new Date(session.scheduledAt) >= now,
  ).length;
  const completedSessions = sessions.filter((session) => session.status === 'completed').length;
  const cancelledSessions = sessions.filter((session) => session.status === 'cancelled').length;

  const ordersSpend = orders.reduce((total, order) => total + (Number(order.totalAmount ?? 0) || 0), 0);
  const sessionsWithoutOrderSpend = sessions
    .filter((session) => !session.orderId && session.pricePaid != null)
    .reduce((total, session) => total + (Number(session.pricePaid) || 0), 0);

  const totalSpend = ordersSpend + sessionsWithoutOrderSpend;
  const currency = orders.find((order) => order.currency)?.currency || sessions.find((session) => session.currency)?.currency;
  const activePackages = orders.filter((order) => ['pending', 'active'].includes(order.status)).length;
  const sessionsPurchased = orders.reduce((sum, order) => sum + (order.sessionsPurchased ?? 0), 0);
  const sessionsRedeemed = orders.reduce((sum, order) => sum + (order.sessionsRedeemed ?? 0), 0);

  return {
    totalSessions,
    upcomingSessions,
    completedSessions,
    cancelledSessions,
    activePackages,
    totalSpend,
    currency: currency ?? 'USD',
    sessionsPurchased,
    sessionsRedeemed,
    sessionsRemaining: Math.max(sessionsPurchased - sessionsRedeemed, 0),
  };
}

async function loadMentoringDashboard(userId) {
  const sessionQuery = PeerMentoringSession.findAll({
    where: { menteeId: userId },
    include: [buildMentorInclude(), { model: MentorshipOrder, as: 'order', include: [buildMentorInclude()] }],
    order: [
      ['scheduledAt', 'ASC'],
      ['createdAt', 'DESC'],
    ],
  });

  const ordersQuery = MentorshipOrder.findAll({
    where: { userId },
    include: [buildMentorInclude(), { model: PeerMentoringSession, as: 'sessions', attributes: ['id', 'status', 'scheduledAt'] }],
    order: [
      ['purchasedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });

  const favouritesQuery = MentorFavourite.findAll({
    where: { userId },
    include: [buildMentorInclude()],
    order: [['createdAt', 'DESC']],
  });

  const recommendationsQuery = MentorRecommendation.findAll({
    where: { userId },
    include: [buildMentorInclude()],
    order: [
      ['score', 'DESC'],
      ['generatedAt', 'DESC'],
    ],
    limit: 8,
  });

  const reviewsQuery = MentorReview.findAll({
    where: { userId },
    include: [buildMentorInclude(), { model: PeerMentoringSession, as: 'session', include: [buildMentorInclude()] }],
    order: [['publishedAt', 'DESC']],
    limit: 25,
  });

  const aggregateSpendQuery = MentorshipOrder.findAll({
    where: { userId },
    attributes: [[fn('SUM', col('totalAmount')), 'totalAmount'], [fn('SUM', col('sessionsRedeemed')), 'sessionsRedeemed']],
    raw: true,
  });

  const [sessionRecords, orderRecords, favouriteRecords, recommendationRecords, reviewRecords, aggregateSpend] = await Promise.all([
    sessionQuery,
    ordersQuery,
    favouritesQuery,
    recommendationsQuery,
    reviewsQuery,
    aggregateSpendQuery,
  ]);

  const sessions = sessionRecords.map(toPlainSession);
  const orders = orderRecords.map(toPlainOrder);
  const favourites = favouriteRecords.map(toPlainFavourite);
  const recommendations = recommendationRecords.map(toPlainRecommendation);
  const reviews = reviewRecords.map(toPlainReview);

  const summary = calculateSummary(sessions, orders);

  const reviewMap = new Map();
  reviews.forEach((review) => {
    if (review.sessionId) {
      reviewMap.set(review.sessionId, review);
    }
  });

  const pendingReviewSessions = sessions.filter(
    (session) => session.status === 'completed' && !reviewMap.has(session.id),
  );

  const totalSpendAggregate = aggregateSpend?.[0] ?? null;
  const aggregateTotalAmount = totalSpendAggregate?.totalAmount != null ? Number(totalSpendAggregate.totalAmount) : 0;
  const aggregateSessionsRedeemed = totalSpendAggregate?.sessionsRedeemed != null ? Number(totalSpendAggregate.sessionsRedeemed) : 0;

  return {
    summary,
    sessions: {
      upcoming: sessions.filter((session) => session.status === 'scheduled'),
      requested: sessions.filter((session) => session.status === 'requested'),
      completed: sessions.filter((session) => session.status === 'completed'),
      cancelled: sessions.filter((session) => session.status === 'cancelled'),
      all: sessions,
    },
    purchases: {
      orders,
      stats: {
        totalOrders: orders.length,
        activeOrders: orders.filter((order) => ['pending', 'active'].includes(order.status)).length,
        totalSpend: aggregateTotalAmount,
        sessionsRedeemed: aggregateSessionsRedeemed,
      },
    },
    favourites,
    suggestions: recommendations.length
      ? recommendations
      : favourites.slice(0, 5).map((favourite) => ({
          id: favourite.id,
          userId,
          mentorId: favourite.mentorId,
          score: null,
          source: 'favourites',
          reason: 'Based on your saved mentors.',
          generatedAt: favourite.createdAt,
          mentor: favourite.mentor,
        })),
    reviews: {
      recent: reviews,
      pending: pendingReviewSessions,
    },
  };
}

function forgetCachesForUser(userId) {
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { userId });
  appCache.delete(cacheKey);
  const parentKey = buildCacheKey(PARENT_DASHBOARD_NAMESPACE, { userId });
  appCache.delete(parentKey);
}

export async function getMentoringDashboard(userId, { bypassCache = false } = {}) {
  const normalisedUserId = normalizeUserId(userId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { userId: normalisedUserId });

  if (bypassCache) {
    return loadMentoringDashboard(normalisedUserId);
  }

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, () => loadMentoringDashboard(normalisedUserId));
}

function validateSessionPayload(payload) {
  if (!payload) {
    throw new ValidationError('Session details are required.');
  }
  const { mentorId, topic, scheduledAt, durationMinutes } = payload;
  if (!mentorId || !Number.isInteger(Number(mentorId))) {
    throw new ValidationError('A valid mentorId must be provided.');
  }
  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    throw new ValidationError('A session topic is required.');
  }
  const scheduled = new Date(scheduledAt ?? Date.now());
  if (Number.isNaN(scheduled.getTime())) {
    throw new ValidationError('A valid scheduledAt date is required.');
  }
  if (durationMinutes != null && (!Number.isInteger(Number(durationMinutes)) || Number(durationMinutes) <= 0)) {
    throw new ValidationError('Duration must be a positive integer.');
  }
}

export async function createMentoringSession(userId, payload = {}) {
  const normalisedUserId = normalizeUserId(userId);
  validateSessionPayload(payload);

  if (payload.orderId) {
    const order = await MentorshipOrder.findOne({ where: { id: payload.orderId, userId: normalisedUserId } });
    if (!order) {
      throw new ValidationError('The selected mentorship order was not found for this user.');
    }
  }

  const session = await PeerMentoringSession.create({
    menteeId: normalisedUserId,
    mentorId: Number(payload.mentorId),
    serviceLineId: payload.serviceLineId ?? null,
    orderId: payload.orderId ?? null,
    topic: payload.topic.trim(),
    agenda: payload.agenda ?? null,
    scheduledAt: payload.scheduledAt,
    durationMinutes: payload.durationMinutes ?? null,
    status: payload.status && ['requested', 'scheduled', 'completed', 'cancelled'].includes(payload.status)
      ? payload.status
      : 'scheduled',
    meetingUrl: payload.meetingUrl ?? null,
    meetingLocation: payload.meetingLocation ?? null,
    meetingType: payload.meetingType ?? null,
    notes: payload.notes ?? null,
    pricePaid: payload.pricePaid ?? null,
    currency: payload.currency ?? null,
  });

  const created = await PeerMentoringSession.findByPk(session.id, {
    include: [
      { model: User, as: 'mentor', attributes: mentorAttributes, include: [{ model: Profile, as: 'Profile', attributes: profileAttributes }] },
      { model: MentorshipOrder, as: 'order', include: [{ model: User, as: 'mentor', attributes: mentorAttributes }] },
    ],
  });

  forgetCachesForUser(normalisedUserId);
  return toPlainSession(created);
}

export async function updateMentoringSession(userId, sessionId, payload = {}) {
  const normalisedUserId = normalizeUserId(userId);
  const session = await PeerMentoringSession.findByPk(sessionId);
  if (!session || session.menteeId !== normalisedUserId) {
    throw new NotFoundError('Mentoring session not found.');
  }

  const updates = {};
  if (payload.topic) {
    updates.topic = payload.topic.trim();
  }
  if (payload.agenda !== undefined) {
    updates.agenda = payload.agenda;
  }
  if (payload.scheduledAt) {
    const scheduled = new Date(payload.scheduledAt);
    if (Number.isNaN(scheduled.getTime())) {
      throw new ValidationError('Invalid scheduledAt value supplied.');
    }
    updates.scheduledAt = scheduled;
  }
  if (payload.durationMinutes !== undefined) {
    const duration = Number.parseInt(payload.durationMinutes, 10);
    if (!Number.isInteger(duration) || duration <= 0) {
      throw new ValidationError('Duration must be a positive integer.');
    }
    updates.durationMinutes = duration;
  }
  if (payload.status && ['requested', 'scheduled', 'completed', 'cancelled'].includes(payload.status)) {
    updates.status = payload.status;
    if (payload.status === 'completed') {
      updates.completedAt = new Date();
    }
    if (payload.status === 'cancelled') {
      updates.cancelledAt = new Date();
    }
  }
  if (payload.meetingUrl !== undefined) {
    updates.meetingUrl = payload.meetingUrl;
  }
  if (payload.meetingLocation !== undefined) {
    updates.meetingLocation = payload.meetingLocation;
  }
  if (payload.meetingType !== undefined) {
    updates.meetingType = payload.meetingType;
  }
  if (payload.notes !== undefined) {
    updates.notes = payload.notes;
  }
  if (payload.pricePaid !== undefined) {
    const price = payload.pricePaid == null ? null : Number(payload.pricePaid);
    if (price != null && Number.isNaN(price)) {
      throw new ValidationError('Price must be numeric.');
    }
    updates.pricePaid = price;
  }
  if (payload.currency !== undefined) {
    updates.currency = payload.currency ?? null;
  }
  if (payload.orderId !== undefined) {
    if (payload.orderId === null) {
      updates.orderId = null;
    } else {
      const order = await MentorshipOrder.findOne({ where: { id: payload.orderId, userId: normalisedUserId } });
      if (!order) {
        throw new ValidationError('The selected mentorship order was not found for this user.');
      }
      updates.orderId = order.id;
    }
  }

  await session.update(updates);

  const updated = await PeerMentoringSession.findByPk(session.id, {
    include: [
      { model: User, as: 'mentor', attributes: mentorAttributes, include: [{ model: Profile, as: 'Profile', attributes: profileAttributes }] },
      { model: MentorshipOrder, as: 'order', include: [{ model: User, as: 'mentor', attributes: mentorAttributes }] },
    ],
  });

  forgetCachesForUser(normalisedUserId);
  return toPlainSession(updated);
}

function validateOrderPayload(payload) {
  if (!payload) {
    throw new ValidationError('Order details are required.');
  }
  const { mentorId, packageName, sessionsPurchased, totalAmount } = payload;
  if (!mentorId || !Number.isInteger(Number(mentorId))) {
    throw new ValidationError('A valid mentorId must be provided.');
  }
  if (!packageName || typeof packageName !== 'string' || !packageName.trim()) {
    throw new ValidationError('Package name is required.');
  }
  if (!Number.isInteger(Number(sessionsPurchased)) || Number(sessionsPurchased) <= 0) {
    throw new ValidationError('Sessions purchased must be a positive integer.');
  }
  if (totalAmount == null || Number.isNaN(Number(totalAmount))) {
    throw new ValidationError('Total amount must be provided.');
  }
}

export async function recordMentorshipPurchase(userId, payload = {}) {
  const normalisedUserId = normalizeUserId(userId);
  validateOrderPayload(payload);

  const order = await MentorshipOrder.create({
    userId: normalisedUserId,
    mentorId: Number(payload.mentorId),
    packageName: payload.packageName.trim(),
    packageDescription: payload.packageDescription ?? null,
    sessionsPurchased: Number(payload.sessionsPurchased),
    sessionsRedeemed: Number(payload.sessionsRedeemed ?? 0),
    totalAmount: Number(payload.totalAmount),
    currency: (payload.currency ?? 'USD').toUpperCase().slice(0, 3),
    status: payload.status && ['pending', 'active', 'completed', 'cancelled'].includes(payload.status)
      ? payload.status
      : 'pending',
    purchasedAt: payload.purchasedAt ?? new Date(),
    expiresAt: payload.expiresAt ?? null,
    metadata: payload.metadata ?? null,
  });

  const created = await MentorshipOrder.findByPk(order.id, {
    include: [
      { model: User, as: 'mentor', attributes: mentorAttributes, include: [{ model: Profile, as: 'Profile', attributes: profileAttributes }] },
      { model: PeerMentoringSession, as: 'sessions', attributes: ['id', 'status', 'scheduledAt'] },
    ],
  });

  forgetCachesForUser(normalisedUserId);
  return toPlainOrder(created);
}

export async function updateMentorshipPurchase(userId, orderId, payload = {}) {
  const normalisedUserId = normalizeUserId(userId);
  const order = await MentorshipOrder.findOne({ where: { id: orderId, userId: normalisedUserId } });
  if (!order) {
    throw new NotFoundError('Mentorship purchase not found.');
  }

  const updates = {};
  if (payload.packageName) {
    updates.packageName = payload.packageName.trim();
  }
  if (payload.packageDescription !== undefined) {
    updates.packageDescription = payload.packageDescription;
  }
  if (payload.sessionsPurchased !== undefined) {
    const sessionsPurchased = Number.parseInt(payload.sessionsPurchased, 10);
    if (!Number.isInteger(sessionsPurchased) || sessionsPurchased <= 0) {
      throw new ValidationError('Sessions purchased must be a positive integer.');
    }
    updates.sessionsPurchased = sessionsPurchased;
  }
  if (payload.sessionsRedeemed !== undefined) {
    const sessionsRedeemed = Number.parseInt(payload.sessionsRedeemed, 10);
    if (!Number.isInteger(sessionsRedeemed) || sessionsRedeemed < 0) {
      throw new ValidationError('Sessions redeemed must be zero or more.');
    }
    updates.sessionsRedeemed = sessionsRedeemed;
  }
  if (payload.totalAmount !== undefined) {
    const amount = Number(payload.totalAmount);
    if (Number.isNaN(amount)) {
      throw new ValidationError('Total amount must be numeric.');
    }
    updates.totalAmount = amount;
  }
  if (payload.currency !== undefined) {
    updates.currency = payload.currency ? String(payload.currency).toUpperCase().slice(0, 3) : 'USD';
  }
  if (payload.status && ['pending', 'active', 'completed', 'cancelled'].includes(payload.status)) {
    updates.status = payload.status;
  }
  if (payload.purchasedAt) {
    const purchasedAt = new Date(payload.purchasedAt);
    if (Number.isNaN(purchasedAt.getTime())) {
      throw new ValidationError('Invalid purchasedAt value supplied.');
    }
    updates.purchasedAt = purchasedAt;
  }
  if (payload.expiresAt !== undefined) {
    updates.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
  }
  if (payload.metadata !== undefined) {
    updates.metadata = payload.metadata;
  }

  await order.update(updates);

  const refreshed = await MentorshipOrder.findByPk(order.id, {
    include: [
      { model: User, as: 'mentor', attributes: mentorAttributes, include: [{ model: Profile, as: 'Profile', attributes: profileAttributes }] },
      { model: PeerMentoringSession, as: 'sessions', attributes: ['id', 'status', 'scheduledAt'] },
    ],
  });

  forgetCachesForUser(normalisedUserId);
  return toPlainOrder(refreshed);
}

export async function addFavouriteMentor(userId, payload = {}) {
  const normalisedUserId = normalizeUserId(userId);
  if (!payload.mentorId || !Number.isInteger(Number(payload.mentorId))) {
    throw new ValidationError('A valid mentorId must be provided.');
  }

  const [record] = await MentorFavourite.findOrCreate({
    where: { userId: normalisedUserId, mentorId: Number(payload.mentorId) },
    defaults: { notes: payload.notes ?? null },
  });

  if (payload.notes !== undefined) {
    await record.update({ notes: payload.notes });
  }

  const refreshed = await MentorFavourite.findByPk(record.id, {
    include: [{ model: User, as: 'mentor', attributes: mentorAttributes, include: [{ model: Profile, as: 'Profile', attributes: profileAttributes }] }],
  });

  forgetCachesForUser(normalisedUserId);
  return toPlainFavourite(refreshed);
}

export async function removeFavouriteMentor(userId, mentorId) {
  const normalisedUserId = normalizeUserId(userId);
  const record = await MentorFavourite.findOne({ where: { userId: normalisedUserId, mentorId } });
  if (!record) {
    throw new NotFoundError('Favourite mentor record not found.');
  }
  await record.destroy();
  forgetCachesForUser(normalisedUserId);
  return { success: true };
}

function validateReviewPayload(payload) {
  if (!payload || payload.rating == null) {
    throw new ValidationError('A rating is required to submit a mentor review.');
  }
  const rating = Number.parseInt(payload.rating, 10);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be an integer between 1 and 5.');
  }
}

export async function submitMentorReview(userId, payload = {}) {
  const normalisedUserId = normalizeUserId(userId);
  validateReviewPayload(payload);

  if (!payload.mentorId || !Number.isInteger(Number(payload.mentorId))) {
    throw new ValidationError('A valid mentorId must be provided.');
  }

  let session = null;
  if (payload.sessionId) {
    session = await PeerMentoringSession.findByPk(payload.sessionId);
    if (!session || session.menteeId !== normalisedUserId) {
      throw new AuthorizationError('You can only review sessions that you attended.');
    }
  }

  if (payload.orderId) {
    const order = await MentorshipOrder.findOne({ where: { id: payload.orderId, userId: normalisedUserId } });
    if (!order) {
      throw new ValidationError('The selected order could not be found.');
    }
  }

  const [review] = await MentorReview.findOrCreate({
    where: {
      userId: normalisedUserId,
      mentorId: Number(payload.mentorId),
      sessionId: payload.sessionId ?? null,
    },
    defaults: {
      orderId: payload.orderId ?? null,
      rating: Number(payload.rating),
      wouldRecommend: payload.wouldRecommend !== undefined ? Boolean(payload.wouldRecommend) : true,
      headline: payload.headline ?? null,
      feedback: payload.feedback ?? null,
      praiseHighlights: payload.praiseHighlights ?? null,
      improvementAreas: payload.improvementAreas ?? null,
      isPublic: payload.isPublic !== undefined ? Boolean(payload.isPublic) : false,
    },
  });

  if (payload.orderId !== undefined) {
    review.orderId = payload.orderId;
  }

  await review.update({
    rating: Number(payload.rating),
    wouldRecommend: payload.wouldRecommend !== undefined ? Boolean(payload.wouldRecommend) : review.wouldRecommend,
    headline: payload.headline ?? review.headline,
    feedback: payload.feedback ?? review.feedback,
    praiseHighlights: payload.praiseHighlights ?? review.praiseHighlights,
    improvementAreas: payload.improvementAreas ?? review.improvementAreas,
    isPublic: payload.isPublic !== undefined ? Boolean(payload.isPublic) : review.isPublic,
    publishedAt: payload.publishedAt ?? review.publishedAt ?? new Date(),
  });

  const refreshed = await MentorReview.findByPk(review.id, {
    include: [buildMentorInclude(), { model: PeerMentoringSession, as: 'session', include: [buildMentorInclude()] }],
  });

  forgetCachesForUser(normalisedUserId);
  return toPlainReview(refreshed);
}

export default {
  getMentoringDashboard,
  createMentoringSession,
  updateMentoringSession,
  recordMentorshipPurchase,
  updateMentorshipPurchase,
  addFavouriteMentor,
  removeFavouriteMentor,
  submitMentorReview,
};
