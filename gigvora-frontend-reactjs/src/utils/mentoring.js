const FALLBACK_PREFIX = 'Mentor';

function buildDisplayName({ fullName, name, firstName, lastName, handle, id }) {
  if (fullName && typeof fullName === 'string') {
    return fullName.trim();
  }
  if (name && typeof name === 'string') {
    return name.trim();
  }
  const composed = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (composed) {
    return composed;
  }
  if (handle && typeof handle === 'string') {
    return handle.trim();
  }
  if (id) {
    return `${FALLBACK_PREFIX} #${id}`;
  }
  return FALLBACK_PREFIX;
}

export function normaliseMentor(rawMentor, fallbackId = null) {
  if (!rawMentor && !fallbackId) {
    return null;
  }

  const source = rawMentor ?? {};
  const id = source.id ?? fallbackId ?? null;
  if (!id) {
    return null;
  }

  const profile =
    source.profile ??
    source.Profile ??
    (typeof source.get === 'function' ? source.get('profile') ?? source.get('Profile') : null) ??
    null;

  return {
    id,
    name: buildDisplayName({
      fullName: source.fullName,
      name: source.name,
      firstName: source.firstName,
      lastName: source.lastName,
      handle: source.handle,
      id,
    }),
    email: source.email ?? null,
    location: source.location ?? profile?.location ?? null,
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

export function formatMentorName(mentor) {
  if (!mentor) {
    return FALLBACK_PREFIX;
  }
  return mentor.name ?? buildDisplayName({
    fullName: mentor.fullName,
    name: mentor.name,
    firstName: mentor.firstName,
    lastName: mentor.lastName,
    id: mentor.id,
  });
}

export function formatMentorContactLine(mentor) {
  if (!mentor) {
    return 'No contact set';
  }
  if (mentor.email) {
    return mentor.email;
  }
  if (mentor.location) {
    return mentor.location;
  }
  const profileLocation = mentor.profile?.timezone ?? mentor.profile?.headline;
  return profileLocation ?? 'No contact set';
}

export function buildMentorLookupFromWorkspace(data) {
  const lookup = new Map();
  if (!data) {
    return lookup;
  }

  const registerMentor = (candidate, fallbackId) => {
    const identity = normaliseMentor(candidate, fallbackId);
    if (!identity) {
      return;
    }
    const existing = lookup.get(identity.id) ?? {};
    const enriched = {
      ...existing,
      ...(candidate || {}),
      id: identity.id,
      name: identity.name ?? existing.name ?? candidate?.name,
      email: identity.email ?? existing.email ?? candidate?.email ?? null,
      location: identity.location ?? existing.location ?? candidate?.location ?? null,
      profile: identity.profile ?? existing.profile ?? candidate?.profile ?? null,
    };
    lookup.set(identity.id, enriched);
  };

  const applyList = (items = []) => {
    items.forEach((item) => {
      if (!item) return;
      const mentor = item.mentor ?? item;
      const fallbackId = item.mentorId ?? mentor?.id ?? null;
      registerMentor(mentor, fallbackId);
    });
  };

  applyList(data.favourites);
  applyList(data.suggestions);
  applyList(data.sessions?.all);
  applyList(data.purchases?.orders);
  applyList(data.reviews?.recent);

  return lookup;
}

function ensureStatBucket(collection, mentor, fallbackId) {
  const identity = normaliseMentor(mentor, fallbackId);
  if (!identity) {
    return null;
  }
  if (!collection.has(identity.id)) {
    collection.set(identity.id, {
      mentorId: identity.id,
      mentor: identity,
      totalSessions: 0,
      completed: 0,
      upcoming: 0,
      requested: 0,
      cancelled: 0,
      purchases: 0,
      sessionsPurchased: 0,
      sessionsRedeemed: 0,
      totalSpend: 0,
      favourited: false,
      score: 0,
    });
  }
  const bucket = collection.get(identity.id);
  if (!bucket.mentor?.name) {
    bucket.mentor = identity;
  }
  return bucket;
}

export function calculateMentorAnalytics({ sessions = [], orders = [], favourites = [], summary = null } = {}) {
  const mentorStats = new Map();

  sessions.forEach((session) => {
    if (!session) return;
    const bucket = ensureStatBucket(mentorStats, session.mentor, session.mentorId);
    if (!bucket) return;
    bucket.totalSessions += 1;
    const status = session.status;
    if (status === 'completed') {
      bucket.completed += 1;
      bucket.score += 4;
    } else if (status === 'scheduled') {
      bucket.upcoming += 1;
      bucket.score += 3;
    } else if (status === 'requested') {
      bucket.requested += 1;
      bucket.score += 2;
    } else if (status === 'cancelled') {
      bucket.cancelled += 1;
    }
    if (session.pricePaid != null) {
      const numeric = Number(session.pricePaid);
      if (Number.isFinite(numeric)) {
        bucket.totalSpend += numeric;
      }
    }
  });

  orders.forEach((order) => {
    if (!order) return;
    const bucket = ensureStatBucket(mentorStats, order.mentor, order.mentorId);
    if (!bucket) return;
    bucket.purchases += 1;
    bucket.sessionsPurchased += Number(order.sessionsPurchased ?? 0);
    bucket.sessionsRedeemed += Number(order.sessionsRedeemed ?? 0);
    const totalAmount = Number(order.totalAmount ?? 0);
    if (Number.isFinite(totalAmount)) {
      bucket.totalSpend += totalAmount;
    }
    bucket.score += 3;
    if (order.status && ['active', 'pending'].includes(order.status)) {
      bucket.score += 1;
    }
  });

  favourites.forEach((favourite) => {
    if (!favourite) return;
    const bucket = ensureStatBucket(mentorStats, favourite.mentor, favourite.mentorId);
    if (!bucket) return;
    bucket.favourited = true;
    bucket.score += 1;
  });

  const totalMentors = mentorStats.size;
  const conversionEligible = sessions.filter((session) =>
    ['requested', 'scheduled', 'completed'].includes(session?.status),
  );
  const completedSessions = sessions.filter((session) => session?.status === 'completed');
  const conversionRate = conversionEligible.length
    ? completedSessions.length / conversionEligible.length
    : null;

  const avgSpendPerMentor = totalMentors
    ? (summary?.totalSpend ?? 0) / totalMentors
    : null;

  const topMentors = Array.from(mentorStats.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.completed !== a.completed) return b.completed - a.completed;
      if (b.upcoming !== a.upcoming) return b.upcoming - a.upcoming;
      return (b.totalSpend ?? 0) - (a.totalSpend ?? 0);
    })
    .slice(0, 3);

  return {
    totalMentors,
    conversionRate,
    avgSpendPerMentor,
    topMentors,
    mentorStats,
    currency: summary?.currency ?? 'USD',
  };
}

export function getMentorAnalyticsForId(analytics, mentorId) {
  if (!analytics?.mentorStats) {
    return null;
  }
  const key = Number(mentorId);
  if (!Number.isFinite(key)) {
    return null;
  }
  return analytics.mentorStats.get(key) ?? null;
}

