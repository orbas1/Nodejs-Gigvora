const FALLBACK_INTERESTS = [
  'product strategy',
  'experience launchpad',
  'community',
  'growth marketing',
  'brand partnerships',
  'sustainability',
  'future of work',
  'web3',
  'ai & automation',
  'volunteering',
];

const CONNECTION_LIBRARY = [
  {
    id: 'conn-ava-chen',
    name: 'Ava Chen',
    headline: 'Product Marketing Lead · Nova Labs',
    location: 'Berlin, Germany',
    interests: ['product strategy', 'growth marketing', 'launchpad'],
    mutualConnections: 6,
    reason: 'Collaborated on Launchpad growth playbooks last quarter.',
  },
  {
    id: 'conn-nikhil-shah',
    name: 'Nikhil Shah',
    headline: 'Director of Ecosystem · Atlas Studio',
    location: 'London, United Kingdom',
    interests: ['community', 'sustainability', 'experience launchpad'],
    mutualConnections: 3,
    reason: 'Runs the Atlas community sprints your teammates joined.',
  },
  {
    id: 'conn-sophie-mayer',
    name: 'Sophie Mayer',
    headline: 'Chief Storyteller · Momentum Collective',
    location: 'Amsterdam, Netherlands',
    interests: ['brand partnerships', 'future of work', 'community'],
    mutualConnections: 4,
    reason: 'Co-leads the narrative design guild aligned to your interests.',
  },
  {
    id: 'conn-dario-fernandez',
    name: 'Dario Fernández',
    headline: 'Head of Product · Signal Eight',
    location: 'Barcelona, Spain',
    interests: ['product strategy', 'ai & automation', 'future of work'],
    mutualConnections: 5,
    reason: 'Recently launched an AI assistant with strong community feedback.',
  },
  {
    id: 'conn-leila-odum',
    name: 'Leila Odum',
    headline: 'Talent Partner · Northwind Ventures',
    location: 'Copenhagen, Denmark',
    interests: ['volunteering', 'community', 'growth marketing'],
    mutualConnections: 2,
    reason: 'Leads volunteering missions that align with your causes.',
  },
  {
    id: 'conn-mateo-ruiz',
    name: 'Mateo Ruiz',
    headline: 'Innovation Lead · Aurora Labs',
    location: 'Lisbon, Portugal',
    interests: ['experience launchpad', 'ai & automation', 'future of work'],
    mutualConnections: 7,
    reason: 'Hosts the Lisbon innovation circles your peers follow.',
  },
];

const GROUP_LIBRARY = [
  {
    id: 'group-future-work',
    name: 'Future of Work Collective',
    focus: ['future of work', 'product strategy'],
    members: 2140,
    description: 'Weekly salons on marketplaces, distributed teams, and community building.',
  },
  {
    id: 'group-launchpad-alumni',
    name: 'Launchpad Alumni Guild',
    focus: ['experience launchpad', 'community'],
    members: 860,
    description: 'Alumni-only working groups sharing frameworks, retros, and partner leads.',
  },
  {
    id: 'group-purpose-lab',
    name: 'Purpose Lab',
    focus: ['sustainability', 'volunteering'],
    members: 530,
    description: 'Cross-functional volunteers mobilising for climate-positive missions.',
  },
  {
    id: 'group-ai-crafters',
    name: 'AI Collaboration Crafters',
    focus: ['ai & automation', 'product strategy'],
    members: 1475,
    description: 'Designers and product leaders pairing on AI-native experiences.',
  },
  {
    id: 'group-creative-growth',
    name: 'Creative Growth Syndicate',
    focus: ['growth marketing', 'brand partnerships'],
    members: 980,
    description: 'Brand builders swapping go-to-market plays and partnership intros.',
  },
];

const LIVE_MOMENT_LIBRARY = [
  {
    id: 'moment-lisbon-lab',
    title: 'Lisbon innovation circle is reviewing AI pilots right now',
    tag: 'Happening live',
    icon: '🎙️',
    timestamp: () => minutesAgo(7),
  },
  {
    id: 'moment-volunteer',
    title: 'Purpose Lab opened 12 new climate volunteering spots',
    tag: 'Volunteer',
    icon: '🌱',
    timestamp: () => minutesAgo(18),
  },
  {
    id: 'moment-partner-spotlight',
    title: 'Nova Labs is requesting partner intros for their spring launch',
    tag: 'Partnerships',
    icon: '🤝',
    timestamp: () => minutesAgo(25),
  },
  {
    id: 'moment-launchpad',
    title: 'Experience Launchpad Cohort 05 shared their demo day decks',
    tag: 'Launchpad',
    icon: '🚀',
    timestamp: () => minutesAgo(33),
  },
];

const BASE_NOTIFICATIONS = [
  {
    id: 'notif-invite-1',
    type: 'invite',
    title: 'Atlas Studio invited you to co-host a Launchpad sprint',
    body: 'Review the scope and confirm whether you can facilitate next Tuesday.',
    timestamp: () => minutesAgo(9),
    action: { label: 'Review invite', href: '/projects' },
  },
  {
    id: 'notif-follow-1',
    type: 'follow',
    title: 'Ava Chen started following you',
    body: 'She leads growth at Nova Labs and follows three of your collaborators.',
    timestamp: () => minutesAgo(22),
    action: { label: 'View profile', href: '/connections' },
  },
  {
    id: 'notif-comment-1',
    type: 'comment',
    title: 'Zoe North commented on your update',
    body: '“Let’s feature this in the community newsletter—stellar work.”',
    timestamp: () => minutesAgo(47),
    action: { label: 'Open feed', href: '/feed' },
  },
  {
    id: 'notif-activity-1',
    type: 'activity',
    title: 'Launchpad Alumni Guild posted new resources',
    body: 'Download the new retrospective template shared by alumni facilitators.',
    timestamp: () => minutesAgo(63),
    action: { label: 'View group', href: '/groups' },
  },
];

const MESSAGE_THREAD_LIBRARY = [
  {
    id: 'thread-concierge',
    sender: 'Gigvora Talent Concierge',
    preview: 'We have three product designers shortlisted for your Berlin brief.',
    timestamp: () => minutesAgo(4),
  },
  {
    id: 'thread-nova',
    sender: 'Nova Labs',
    preview: 'Approved the new milestone. Finance release scheduled for Friday.',
    timestamp: () => minutesAgo(16),
  },
  {
    id: 'thread-atlas',
    sender: 'Atlas Studio',
    preview: 'Shared a revised scope for the experience launchpad pilot.',
    timestamp: () => minutesAgo(58),
  },
];

function normaliseArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim().toLowerCase());
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

function minutesAgo(minutes) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
}

function resolveInterests(session = {}) {
  const interestSources = [
    session.interests,
    session.skills,
    session.focusAreas,
    session.tags,
    session.causes,
    session.preferredCauses,
    session.preferredIndustries,
    session.industryFocus,
  ];
  const collected = interestSources.flatMap(normaliseArray);

  if (Array.isArray(session.memberships)) {
    session.memberships.forEach((membership) => {
      if (!membership) return;
      collected.push(String(membership).replace(/_/g, ' '));
    });
  }

  if (session.primaryDashboard) {
    collected.push(String(session.primaryDashboard).replace(/_/g, ' '));
  }

  const finalSet = new Set(collected.length ? collected : FALLBACK_INTERESTS);
  return Array.from(finalSet).slice(0, 12);
}

function scoreByInterestOverlap(candidateInterests, userInterests) {
  const userSet = new Set(userInterests);
  const candidateSet = new Set(normaliseArray(candidateInterests));
  let score = 0;
  candidateSet.forEach((interest) => {
    if (userSet.has(interest)) {
      score += 3;
    }
    if (interest.includes('launchpad') && userSet.has('experience launchpad')) {
      score += 1;
    }
    if (interest.includes('community') && userSet.has('community')) {
      score += 1;
    }
  });
  return score;
}

function createConnectionFromPost(post, session) {
  if (!post) {
    return null;
  }
  const name =
    post.authorName ||
    [post?.User?.firstName, post?.User?.lastName].filter(Boolean).join(' ') ||
    post?.user?.name ||
    post?.user?.fullName ||
    null;
  if (!name || (session?.name && name.toLowerCase() === session.name.toLowerCase())) {
    return null;
  }

  const headline =
    post.authorHeadline ||
    post?.User?.Profile?.headline ||
    post?.user?.title ||
    post?.user?.headline ||
    'Active Gigvora member';
  const interest = (post.type || post.category || '').toString().toLowerCase();

  return {
    id: `post-connection-${post.id}`,
    name,
    headline,
    location: post.location || post?.User?.Profile?.location || 'Gigvora network',
    interests: [interest].filter(Boolean),
    mutualConnections: Math.max(1, Math.ceil(Math.random() * 3)),
    reason: 'Recently active on the timeline — say hello while the thread is fresh.',
  };
}

export function generateConnectionSuggestions({ session, feedPosts = [], limit = 6 } = {}) {
  const interests = resolveInterests(session);
  const scored = CONNECTION_LIBRARY.map((connection) => {
    const interestScore = scoreByInterestOverlap(connection.interests, interests);
    return {
      ...connection,
      score: interestScore + connection.mutualConnections,
    };
  });

  const dynamic = feedPosts
    .map((post) => createConnectionFromPost(post, session))
    .filter(Boolean)
    .map((connection) => ({
      ...connection,
      score: connection.mutualConnections + 2,
    }));

  const combined = [...dynamic, ...scored]
    .filter((connection, index, array) => array.findIndex((item) => item.id === connection.id) === index)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  return combined.slice(0, limit).map((connection) => {
    const { score, ...rest } = connection;
    void score;
    return rest;
  });
}

export function generateGroupSuggestions({ session, limit = 4 } = {}) {
  const interests = resolveInterests(session);
  const scored = GROUP_LIBRARY.map((group) => {
    const interestScore = scoreByInterestOverlap(group.focus, interests);
    return {
      ...group,
      score: interestScore + Math.min(group.members / 500, 5),
    };
  });

  return scored
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit)
    .map((group) => {
      const { score, ...rest } = group;
      void score;
      return rest;
    });
}

export function generateLiveMoments({ feedPosts = [], limit = 5 } = {}) {
  const baseMoments = LIVE_MOMENT_LIBRARY.map((moment) => ({
    ...moment,
    timestamp: moment.timestamp(),
  }));

  const feedMoments = feedPosts.slice(0, 5).map((post) => ({
    id: `moment-post-${post.id}`,
    title:
      (post.authorName ? `${post.authorName} shared a ${post.type || 'update'}` : 'New community update just dropped') ??
      'Community update',
    tag: (post.type || 'Update').toString().charAt(0).toUpperCase() + (post.type || 'Update').toString().slice(1),
    icon: '⚡️',
    timestamp: post.createdAt || minutesAgo(3),
  }));

  const combined = [...feedMoments, ...baseMoments];
  combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return combined.slice(0, limit);
}

export function generateNotificationStream({ session, feedPosts = [] } = {}) {
  const base = BASE_NOTIFICATIONS.map((notification) => ({
    ...notification,
    timestamp: notification.timestamp(),
  }));

  const feedNotifications = feedPosts.slice(0, 3).map((post) => {
    const name =
      post.authorName ||
      [post?.User?.firstName, post?.User?.lastName].filter(Boolean).join(' ') ||
      post?.user?.name ||
      'A community member';
    const kind = (post.type || post.category || 'update').toString().toLowerCase();
    return {
      id: `notif-post-${post.id}`,
      type: 'activity',
      title: `${name} posted a new ${kind}`,
      body: (post.content || post.summary || '').slice(0, 140) || 'Jump in before the thread cools off.',
      timestamp: post.createdAt || minutesAgo(5),
      action: { label: 'Open feed', href: '/feed' },
    };
  });

  const inviteFollow = [];
  if (session?.name) {
    inviteFollow.push({
      id: 'notif-welcome-return',
      type: 'activity',
      title: `Welcome back, ${session.name.split(' ')[0]}!`,
      body: 'We highlighted a few fresh threads based on your collaborations.',
      timestamp: minutesAgo(2),
      action: { label: 'Continue reading', href: '/feed' },
    });
  }

  const combined = [...inviteFollow, ...feedNotifications, ...base];
  combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return combined;
}

export function generateMessageAlerts() {
  return MESSAGE_THREAD_LIBRARY.map((thread, index) => ({
    ...thread,
    timestamp: thread.timestamp(),
    unread: index < 2,
    location: 'inbox',
    route: '/inbox',
  }));
}

export function resolveUserInterests(session) {
  return resolveInterests(session);
}

export default {
  resolveUserInterests,
  generateConnectionSuggestions,
  generateGroupSuggestions,
  generateLiveMoments,
  generateNotificationStream,
  generateMessageAlerts,
};
