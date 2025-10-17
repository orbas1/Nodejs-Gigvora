import {
  projectGigManagementSequelize,
  Project,
  ProjectWorkspace,
  ProjectMilestone,
  ProjectCollaborator,
  ProjectIntegration,
  ProjectRetrospective,
  ProjectAsset,
  ProjectTemplate,
  GigOrder,
  GigOrderRequirement,
  GigOrderRevision,
  GigVendorScorecard,
  GigTimelineEvent,
  GigSubmission,
  GigSubmissionAsset,
  GigChatMessage,
  StoryBlock,
  BrandAsset,
  GigTimelineEvent,
  GigSubmission,
  GigChatMessage,
  PROJECT_STATUSES,
  PROJECT_RISK_LEVELS,
  GIG_ORDER_STATUSES,
  GIG_TIMELINE_EVENT_TYPES,
  GIG_TIMELINE_EVENT_STATUSES,
  GIG_SUBMISSION_STATUSES,
  GIG_TIMELINE_VISIBILITIES,
  GIG_SUBMISSION_STATUSES,
  GIG_CHAT_VISIBILITIES,
  syncProjectGigManagementModels,
} from '../models/projectGigManagementModels.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function normalizeNumber(value, fallback = 0) {
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ensureNumber(value, { label, allowNegative = false, allowZero = true } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${label ?? 'Value'} must be a valid number.`);
  }
  if (!allowNegative && parsed < 0) {
    throw new ValidationError(`${label ?? 'Value'} cannot be negative.`);
  }
  if (!allowZero && parsed === 0) {
    throw new ValidationError(`${label ?? 'Value'} must be greater than zero.`);
  }
  return parsed;
}

function ensureDate(value, { label } = {}) {
  if (value == null) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${label ?? 'Date'} is not valid.`);
  }
  return date;
}

function computeBudgetSnapshot(project) {
  const allocated = normalizeNumber(project.budgetAllocated);
  const spent = normalizeNumber(project.budgetSpent);
  const remaining = Math.max(allocated - spent, 0);
  const burnRate = allocated === 0 ? 0 : (spent / allocated) * 100;
  return {
    currency: project.budgetCurrency,
    allocated,
    spent,
    remaining,
    burnRatePercent: burnRate,
  };
}

function summarizeAssets(assets = []) {
  const total = assets.length;
  const restricted = assets.filter((asset) => asset.permissionLevel !== 'public').length;
  const watermarkedCount = assets.filter((asset) => asset.watermarkEnabled).length;
  const watermarkCoverage = total === 0 ? 0 : (watermarkedCount / total) * 100;
  const storageBytes = assets.reduce((acc, asset) => acc + normalizeNumber(asset.sizeBytes), 0);
  return {
    total,
    restricted,
    watermarked: watermarkedCount,
    watermarkCoverage,
    storageBytes,
    totalSizeBytes: storageBytes,
  };
}

function buildBoardLanes(projects) {
  const lanes = PROJECT_STATUSES.map((status) => ({
    status,
    label: status.replace(/_/g, ' '),
    projects: [],
  }));
  const laneMap = new Map(lanes.map((lane) => [lane.status, lane]));

  projects.forEach((project) => {
    const laneKey = project.workspace?.status ?? project.status ?? 'planning';
    const lane = laneMap.get(laneKey) ?? laneMap.get('planning');
    lane.projects.push({
      id: project.id,
      title: project.title,
      progress: normalizeNumber(project.workspace?.progressPercent),
      riskLevel: project.workspace?.riskLevel ?? 'low',
      dueAt: project.workspace?.nextMilestoneDueAt ?? project.dueDate ?? null,
    });
  });

  return lanes;
}

function buildBoardMetrics(projects) {
  if (projects.length === 0) {
    return {
      averageProgress: 0,
      activeProjects: 0,
      atRisk: 0,
      completed: 0,
    };
  }
  const averageProgress =
    projects.reduce((total, project) => total + normalizeNumber(project.workspace?.progressPercent), 0) /
    projects.length;
  const atRisk = projects.filter((project) => project.workspace?.riskLevel === 'high').length;
  const completed = projects.filter((project) => project.workspace?.status === 'completed').length;
  const activeProjects = projects.length - completed;
  return { averageProgress, atRisk, completed, activeProjects };
}

function buildVendorStats(orders) {
  if (orders.length === 0) {
    return {
      totalOrders: 0,
      active: 0,
      completed: 0,
      averageProgress: 0,
      averages: { overall: null, quality: null, communication: null, reliability: null },
    };
  }
  const active = orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length;
  const completed = orders.filter((order) => order.status === 'completed').length;
  const averageProgress =
    orders.reduce((total, order) => total + normalizeNumber(order.progressPercent), 0) / orders.length;

  const aggregate = orders.reduce(
    (acc, order) => {
      const scorecard = order.scorecard ?? {};
      ['overall', 'quality', 'communication', 'reliability'].forEach((key) => {
        const value = normalizeNumber(scorecard[`${key}Score`], null);
        if (value != null) {
          acc[key].sum += value;
          acc[key].count += 1;
        }
      });
      return acc;
    },
    {
      overall: { sum: 0, count: 0 },
      quality: { sum: 0, count: 0 },
      communication: { sum: 0, count: 0 },
      reliability: { sum: 0, count: 0 },
    },
  );

  const averages = Object.fromEntries(
    Object.entries(aggregate).map(([key, { sum, count }]) => [key, count === 0 ? null : sum / count]),
  );

  return { totalOrders: orders.length, active, completed, averageProgress, averages };
}

function buildGigReminders(orders) {
  const now = Date.now();
  return orders
    .flatMap((order) => {
      const reminders = [];
      if (order.dueAt) {
        reminders.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: 'delivery_due',
          dueAt: order.dueAt,
          overdue: new Date(order.dueAt).getTime() < now,
        });
      }
      order.requirements?.forEach((requirement) => {
        reminders.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: 'requirement',
          title: requirement.title,
          dueAt: requirement.dueAt,
          status: requirement.status,
        });
      });
      order.timelineEvents?.forEach((event) => {
        if (['completed', 'cancelled'].includes(event.status)) {
          return;
        }
        reminders.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: 'timeline',
          title: event.title,
          dueAt: event.scheduledAt,
          status: event.status,
          overdue: event.scheduledAt ? new Date(event.scheduledAt).getTime() < now : false,
        });
      });
      return reminders;
    })
    .sort((a, b) => new Date(a.dueAt || 0).getTime() - new Date(b.dueAt || 0).getTime());
}

function buildStorytelling(projects, orders, storyBlocks) {
  const achievements = [];

  projects.forEach((project) => {
    const progress = normalizeNumber(project.workspace?.progressPercent);
    if (progress >= 70) {
      achievements.push({
        id: `project-${project.id}`,
        type: 'project',
        title: project.title,
        bullet: `Advanced ${progress.toFixed(0)}% with ${project.collaborators.length} collaborators.`,
        metrics: {
          progressPercent: progress,
          csat: project.workspace?.metrics?.csat ?? null,
        },
        deliveredAt: project.workspace?.nextMilestoneDueAt ?? project.updatedAt ?? null,
        recommendedChannel: 'portfolio',
      });
    }
  });

  orders.forEach((order) => {
    if (order.status === 'completed') {
      achievements.push({
        id: `order-${order.id}`,
        type: 'gig',
        title: order.serviceName,
        bullet: `Delivered ${order.serviceName} with ${order.vendorName} and captured ${order.currency} ${order.amount}.`,
        metrics: {
          progressPercent: normalizeNumber(order.progressPercent),
          csat: order.scorecard?.overallScore ?? null,
        },
        deliveredAt: order.dueAt ?? order.completedAt ?? order.updatedAt ?? null,
        recommendedChannel: 'client_update',
      });
    }
  });

  storyBlocks.forEach((block) => {
    achievements.push({
      id: `story-${block.id}`,
      type: 'story_block',
      title: block.title,
      bullet: block.outcome,
      metrics: block.metrics ?? {},
      deliveredAt: block.lastUsedAt ?? block.createdAt ?? null,
      recommendedChannel: block.metadata?.recommendedChannel ?? 'linkedin',
    });
  });

  const quickExports = {
    resumeBullets: achievements.slice(0, 3).map((achievement) => `• ${achievement.bullet}`),
    linkedinPosts: achievements.slice(0, 2).map((achievement) => `Celebrated ${achievement.title}`),
    coverLetters: achievements.map((achievement) => `${achievement.title} — ${achievement.bullet}`),
  };

  const prompts = achievements.map((achievement, index) => ({
    id: `prompt-${achievement.id ?? index}`,
    title: achievement.title,
    prompt: `How would you expand on ${achievement.title} to highlight measurable impact and collaborators?`,
  }));

  return { achievements, quickExports, prompts };
}

function sanitizeRequirement(requirementInstance) {
  if (!requirementInstance) {
    return null;
  }
  const requirement = requirementInstance.get ? requirementInstance.get({ plain: true }) : requirementInstance;
  return {
    id: requirement.id,
    title: requirement.title,
    status: requirement.status,
    dueAt: requirement.dueAt,
    notes: requirement.notes,
    createdAt: requirement.createdAt,
    updatedAt: requirement.updatedAt,
  };
}

function sanitizeRevision(revisionInstance) {
  if (!revisionInstance) {
    return null;
  }
  const revision = revisionInstance.get ? revisionInstance.get({ plain: true }) : revisionInstance;
  return {
    id: revision.id,
    roundNumber: revision.roundNumber,
    status: revision.status,
    requestedAt: revision.requestedAt,
    dueAt: revision.dueAt,
    submittedAt: revision.submittedAt,
    approvedAt: revision.approvedAt,
    summary: revision.summary,
    createdAt: revision.createdAt,
    updatedAt: revision.updatedAt,
  };
}

function sanitizeScorecard(scorecardInstance) {
  if (!scorecardInstance) {
    return null;
  }
  const scorecard = scorecardInstance.get ? scorecardInstance.get({ plain: true }) : scorecardInstance;
  return {
    id: scorecard.id,
    qualityScore: scorecard.qualityScore != null ? Number(scorecard.qualityScore) : null,
    communicationScore: scorecard.communicationScore != null ? Number(scorecard.communicationScore) : null,
    reliabilityScore: scorecard.reliabilityScore != null ? Number(scorecard.reliabilityScore) : null,
    overallScore: scorecard.overallScore != null ? Number(scorecard.overallScore) : null,
    notes: scorecard.notes,
    createdAt: scorecard.createdAt,
    updatedAt: scorecard.updatedAt,
  };
}

function sanitizeTimelineEvent(eventInstance) {
  if (!eventInstance) {
    return null;
  }
  const event = eventInstance.get ? eventInstance.get({ plain: true }) : eventInstance;
  return {
    id: event.id,
    orderId: event.orderId,
    eventType: event.eventType,
    title: event.title,
    summary: event.summary,
    createdById: event.createdById,
    visibility: event.visibility,
    occurredAt: event.occurredAt,
    metadata: event.metadata ?? {},
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

function sanitizeSubmission(submissionInstance) {
  if (!submissionInstance) {
    return null;
  }
  const submission = submissionInstance.get ? submissionInstance.get({ plain: true }) : submissionInstance;
  return {
    id: submission.id,
    orderId: submission.orderId,
    title: submission.title,
    description: submission.description,
    status: submission.status,
    assetUrl: submission.assetUrl,
    assetType: submission.assetType,
    attachments: submission.attachments ?? [],
    submittedAt: submission.submittedAt,
    approvedAt: submission.approvedAt,
    submittedById: submission.submittedById,
    reviewedById: submission.reviewedById,
    metadata: submission.metadata ?? {},
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

function sanitizeChatMessage(messageInstance) {
  if (!messageInstance) {
    return null;
  }
  const message = messageInstance.get ? messageInstance.get({ plain: true }) : messageInstance;
  return {
    id: message.id,
    orderId: message.orderId,
    senderId: message.senderId,
    senderRole: message.senderRole,
    body: message.body,
    attachments: message.attachments ?? [],
    visibility: message.visibility,
    sentAt: message.sentAt,
    acknowledgedAt: message.acknowledgedAt,
    acknowledgedById: message.acknowledgedById,
    metadata: message.metadata ?? {},
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

function sanitizeGigOrder(orderInstance, { includeAssociations = true } = {}) {
  if (!orderInstance) {
    return null;
  }
  const order = orderInstance.get ? orderInstance.get({ plain: true }) : orderInstance;
  const sanitizedMetadata = sanitizeGigMetadata(order.metadata ?? {});
  const base = {
    id: order.id,
    ownerId: order.ownerId,
    orderNumber: order.orderNumber,
    vendorName: order.vendorName,
    serviceName: order.serviceName,
    status: order.status,
    progressPercent: order.progressPercent != null ? Number(order.progressPercent) : 0,
    amount: order.amount != null ? Number(order.amount) : 0,
    currency: order.currency,
    kickoffAt: order.kickoffAt,
    dueAt: order.dueAt,
    metadata: sanitizedMetadata,
    classes: sanitizedMetadata.classes ?? [],
    addons: sanitizedMetadata.addons ?? [],
    tags: sanitizedMetadata.tags ?? [],
    media: sanitizedMetadata.media ?? [],
    faqs: sanitizedMetadata.faqs ?? [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };

  if (!includeAssociations) {
    return base;
  }

  return {
    ...base,
    requirements: Array.isArray(order.requirements)
      ? order.requirements.map((requirement) => sanitizeRequirement(requirement)).filter(Boolean)
      : [],
    revisions: Array.isArray(order.revisions)
      ? order.revisions.map((revision) => sanitizeRevision(revision)).filter(Boolean)
      : [],
    scorecard: order.scorecard ? sanitizeScorecard(order.scorecard) : null,
    timeline: Array.isArray(order.timeline)
      ? order.timeline.map((event) => sanitizeTimelineEvent(event)).filter(Boolean)
      : [],
    submissions: Array.isArray(order.submissions)
      ? order.submissions.map((submission) => sanitizeSubmission(submission)).filter(Boolean)
      : [],
    messages: Array.isArray(order.messages)
      ? order.messages.map((message) => sanitizeChatMessage(message)).filter(Boolean)
      : [],
  };
}

function normalizeAttachments(rawAttachments, { limit = 10 } = {}) {
  if (!Array.isArray(rawAttachments)) {
    return [];
  }
  return rawAttachments
    .map((item) => {
      if (!item) {
        return null;
      }
      const url = typeof item.url === 'string' ? item.url.trim() : null;
      if (!url) {
        return null;
      }
      const label = typeof item.label === 'string' ? item.label.trim() : null;
      const type = typeof item.type === 'string' ? item.type.trim() : null;
      return { url, label, type };
    })
    .filter(Boolean)
    .slice(0, limit);
}

function cleanString(value, { maxLength = 240 } = {}) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, maxLength);
}

function normalizeGigTags(rawTags, { limit = 12 } = {}) {
  if (!Array.isArray(rawTags)) {
    return [];
  }
  const tags = rawTags
    .map((tag) => cleanString(tag, { maxLength: 40 }))
    .filter(Boolean)
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
    .slice(0, limit);
  return tags;
}

function normalizeGigClasses(rawClasses, { currency = 'USD' } = {}) {
  if (!Array.isArray(rawClasses)) {
    return [];
  }

  const classes = rawClasses
    .map((item, index) => {
      if (!item) {
        return null;
      }
      const name = cleanString(item.name, { maxLength: 80 }) ?? `Class ${index + 1}`;
      const summary = cleanString(item.summary, { maxLength: 260 });
      const priceAmount = ensureNumber(item.priceAmount ?? 0, {
        label: 'Gig class price',
        allowNegative: false,
      });
      if (priceAmount <= 0) {
        throw new ValidationError('Gig class price must be greater than zero.');
      }
      const deliveryDays = item.deliveryDays != null ? ensureNumber(item.deliveryDays, {
        label: 'Gig class delivery days',
        allowNegative: false,
        allowZero: false,
      }) : null;
      const inclusions = Array.isArray(item.inclusions)
        ? item.inclusions
            .map((inclusion) => cleanString(inclusion, { maxLength: 120 }))
            .filter(Boolean)
            .slice(0, 8)
        : [];

      return {
        key: cleanString(item.key, { maxLength: 60 }) ?? `class-${index + 1}`,
        name,
        summary,
        priceAmount,
        priceCurrency: item.priceCurrency ? cleanString(item.priceCurrency, { maxLength: 6 }) ?? currency : currency,
        deliveryDays,
        inclusions,
      };
    })
    .filter(Boolean)
    .slice(0, 6);

  if (classes.length < 3) {
    throw new ValidationError('Provide at least three gig classes before publishing.');
  }

  return classes;
}

function normalizeGigAddons(rawAddons, { currency = 'USD' } = {}) {
  if (!Array.isArray(rawAddons)) {
    return [];
  }

  return rawAddons
    .map((addon, index) => {
      if (!addon) {
        return null;
      }
      const name = cleanString(addon.name, { maxLength: 120 });
      if (!name) {
        return null;
      }
      const priceAmount = ensureNumber(addon.priceAmount ?? 0, {
        label: 'Addon price',
        allowNegative: false,
      });
      if (priceAmount <= 0) {
        throw new ValidationError('Addon price must be greater than zero.');
      }
      const deliveryDays = addon.deliveryDays != null ? ensureNumber(addon.deliveryDays, {
        label: 'Addon delivery days',
        allowNegative: false,
        allowZero: false,
      }) : null;
      return {
        key: cleanString(addon.key, { maxLength: 60 }) ?? `addon-${index + 1}`,
        name,
        description: cleanString(addon.description, { maxLength: 260 }),
        priceAmount,
        priceCurrency: addon.priceCurrency ? cleanString(addon.priceCurrency, { maxLength: 6 }) ?? currency : currency,
        deliveryDays,
        isPopular: Boolean(addon.isPopular),
      };
    })
    .filter(Boolean)
    .slice(0, 10);
}

const ALLOWED_MEDIA_TYPES = new Set(['image', 'video']);

function normalizeGigMedia(rawMedia) {
  if (!Array.isArray(rawMedia)) {
    return [];
  }

  return rawMedia
    .map((item, index) => {
      if (!item) {
        return null;
      }
      const type = cleanString(item.type, { maxLength: 20 }) ?? 'image';
      if (!ALLOWED_MEDIA_TYPES.has(type)) {
        throw new ValidationError('Media type must be image or video.');
      }
      const url = cleanString(item.url, { maxLength: 500 });
      if (!url || !/^https?:\/\//i.test(url)) {
        throw new ValidationError('Media items require a valid URL.');
      }
      return {
        key: cleanString(item.key, { maxLength: 60 }) ?? `media-${index + 1}`,
        type,
        url,
        thumbnailUrl: cleanString(item.thumbnailUrl, { maxLength: 500 }) ?? null,
        caption: cleanString(item.caption, { maxLength: 140 }),
      };
    })
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeGigFaqs(rawFaqs) {
  if (!Array.isArray(rawFaqs)) {
    return [];
  }

  return rawFaqs
    .map((item, index) => {
      if (!item) {
        return null;
      }
      const question = cleanString(item.question, { maxLength: 200 });
      const answer = cleanString(item.answer, { maxLength: 600 });
      if (!question || !answer) {
        return null;
      }
      return {
        key: cleanString(item.key, { maxLength: 60 }) ?? `faq-${index + 1}`,
        question,
        answer,
      };
    })
    .filter(Boolean)
    .slice(0, 12);
}

function buildGigMetadata(payload, currency) {
  const classes = normalizeGigClasses(payload.classes ?? payload.gigClasses ?? [], { currency });
  const addons = normalizeGigAddons(payload.addons ?? payload.gigAddons ?? [], { currency });
  const tags = normalizeGigTags(payload.tags ?? payload.gigTags ?? []);
  const media = normalizeGigMedia(payload.media ?? payload.gigMedia ?? []);
  const faqs = normalizeGigFaqs(payload.faqs ?? payload.gigFaqs ?? []);

  return {
    ...(payload.metadata ?? {}),
    currency,
    classes,
    addons,
    tags,
    media,
    faqs,
  };
}

function sanitizeGigMetadata(metadata = {}) {
  const currency = metadata.currency ?? 'USD';
  let classes = [];
  try {
    classes = normalizeGigClasses(metadata.classes ?? [], { currency });
  } catch (error) {
    classes = Array.isArray(metadata.classes) ? metadata.classes : [];
  }

  let addons = [];
  try {
    addons = normalizeGigAddons(metadata.addons ?? [], { currency });
  } catch (error) {
    addons = Array.isArray(metadata.addons) ? metadata.addons : [];
  }

  let tags = [];
  try {
    tags = normalizeGigTags(metadata.tags ?? []);
  } catch (error) {
    tags = Array.isArray(metadata.tags) ? metadata.tags : [];
  }

  let media = [];
  try {
    media = normalizeGigMedia(metadata.media ?? []);
  } catch (error) {
    media = Array.isArray(metadata.media) ? metadata.media : [];
  }

  let faqs = [];
  try {
    faqs = normalizeGigFaqs(metadata.faqs ?? []);
  } catch (error) {
    faqs = Array.isArray(metadata.faqs) ? metadata.faqs : [];
  }

  return {
    ...metadata,
    classes,
    addons,
    tags,
    media,
    faqs,
  };
}

function sanitizeProject(projectInstance) {
  const project = projectInstance.get({ plain: true });
  return {
    ...project,
    budget: computeBudgetSnapshot(project),
  };
}

function sanitizeTimelineEvent(eventInstance, order) {
  const event = eventInstance?.get ? eventInstance.get({ plain: true }) : { ...eventInstance };
  return {
    ...event,
    orderId: order.id,
    orderNumber: order.orderNumber,
    serviceName: order.serviceName,
  };
}

function sanitizeSubmission(submissionInstance, order) {
  const submission = submissionInstance?.get ? submissionInstance.get({ plain: true }) : { ...submissionInstance };
  submission.assets = (submission.assets ?? []).map((asset) => (asset?.get ? asset.get({ plain: true }) : asset));
  return {
    ...submission,
    orderId: order.id,
    orderNumber: order.orderNumber,
    serviceName: order.serviceName,
  };
}

function sanitizeChatMessage(messageInstance, order) {
  const message = messageInstance?.get ? messageInstance.get({ plain: true }) : { ...messageInstance };
  return {
    ...message,
    orderId: order.id,
    orderNumber: order.orderNumber,
    serviceName: order.serviceName,
  };
}

function sanitizeOrder(orderInstance) {
  const order = orderInstance.get({ plain: true });
  const requirements = Array.isArray(order.requirements) ? order.requirements : [];
  const outstandingRequirements = requirements.filter((requirement) => requirement.status !== 'approved');
  const nextRequirementDueAt = outstandingRequirements
    .map((requirement) => requirement.dueAt)
    .filter(Boolean)
    .map((due) => new Date(due).getTime())
    .sort((a, b) => a - b)[0];

  const revisions = Array.isArray(order.revisions) ? order.revisions : [];
  const timelineEvents = Array.isArray(order.timelineEvents) ? order.timelineEvents : [];
  const submissions = Array.isArray(order.submissions) ? order.submissions : [];
  const chatMessages = Array.isArray(order.chatMessages) ? order.chatMessages : [];

  return {
    ...order,
    gig: order.gig ?? { title: order.serviceName },
    outstandingRequirements: outstandingRequirements.length,
    nextRequirementDueAt: nextRequirementDueAt ? new Date(nextRequirementDueAt).toISOString() : null,
    activeRevisions: revisions.filter((revision) => revision.status !== 'approved').length,
    timelineEvents: timelineEvents.map((event) => sanitizeTimelineEvent(event, order)),
    submissions: submissions.map((submission) => sanitizeSubmission(submission, order)),
    chatMessages: chatMessages.map((message) => sanitizeChatMessage(message, order)),
    scorecard: order.scorecard?.get ? order.scorecard.get({ plain: true }) : order.scorecard ?? null,
  };
}

function buildGigOrderBuckets(orders) {
  const openStatuses = new Set(['requirements', 'in_delivery', 'in_revision']);
  const open = [];
  const closed = [];

  orders.forEach((order) => {
    if (openStatuses.has(order.status)) {
      open.push(order);
    } else {
      closed.push(order);
    }
  });

  return {
    open,
    closed,
    stats: {
      openCount: open.length,
      closedCount: closed.length,
      openValue: open.reduce((sum, order) => sum + normalizeNumber(order.amount), 0),
      closedValue: closed.reduce((sum, order) => sum + normalizeNumber(order.amount), 0),
    },
  };
}

function buildTimelineSummary(orders) {
  const now = Date.now();
  const events = orders.flatMap((order) =>
    order.timelineEvents.map((event) => {
      const scheduledAtTime = event.scheduledAt ? new Date(event.scheduledAt).getTime() : null;
      const overdue = scheduledAtTime != null && scheduledAtTime < now && !['completed', 'cancelled'].includes(event.status);
      return { ...event, orderId: order.id, overdue };
    }),
  );

  const upcoming = events
    .filter((event) => !['completed', 'cancelled'].includes(event.status))
    .sort((a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime());

  const recent = events
    .filter((event) => event.status === 'completed')
    .sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime());

  return {
    events,
    upcoming: upcoming.slice(0, 8),
    recent: recent.slice(0, 8),
    stats: {
      total: events.length,
      upcoming: upcoming.length,
      overdue: upcoming.filter((event) => event.scheduledAt && new Date(event.scheduledAt).getTime() < now).length,
      completed: recent.length,
    },
  };
}

function buildSubmissionSummary(orders) {
  const submissions = orders.flatMap((order) => order.submissions.map((submission) => ({ ...submission, orderId: order.id })));
  const pendingStatuses = new Set(['draft', 'submitted', 'needs_changes']);

  const pending = submissions
    .filter((submission) => pendingStatuses.has(submission.status))
    .sort((a, b) => new Date(a.submittedAt ?? a.createdAt ?? 0) - new Date(b.submittedAt ?? b.createdAt ?? 0));

  const recent = submissions
    .slice()
    .sort((a, b) => new Date(b.submittedAt ?? b.reviewedAt ?? 0) - new Date(a.submittedAt ?? a.reviewedAt ?? 0));

  return {
    submissions,
    pending: pending.slice(0, 8),
    recent: recent.slice(0, 8),
    stats: {
      total: submissions.length,
      pending: pending.length,
      approved: submissions.filter((submission) => submission.status === 'approved').length,
      rejected: submissions.filter((submission) => submission.status === 'rejected').length,
    },
  };
}

function buildChatSummary(orders) {
  const messages = orders.flatMap((order) => order.chatMessages.map((message) => ({ ...message, orderId: order.id })));
  const sortedMessages = messages
    .slice()
    .sort((a, b) => new Date(b.sentAt ?? 0).getTime() - new Date(a.sentAt ?? 0).getTime());

  const participants = new Map();
  sortedMessages.forEach((message) => {
    if (!message.authorName) return;
    if (!participants.has(message.authorName)) {
      participants.set(message.authorName, {
        name: message.authorName,
        role: message.authorRole ?? 'collaborator',
        messages: 0,
      });
    }
    participants.get(message.authorName).messages += 1;
  });

  return {
    recent: sortedMessages.slice(0, 25),
    totals: {
      messages: sortedMessages.length,
      ordersWithChat: orders.filter((order) => order.chatMessages.length > 0).length,
    },
    participants: Array.from(participants.values()).sort((a, b) => b.messages - a.messages),
  };
}

async function ensureTemplatesSeeded(transaction) {
  const count = await ProjectTemplate.count({ transaction });
  if (count > 0) {
    return;
  }
  await ProjectTemplate.bulkCreate(
    [
      {
        name: 'Hackathon launch kit',
        category: 'hackathon',
        description: 'Two-week hackathon workflow with mentor cadences and demo-day storytelling assets.',
        summary: 'Packaged for emerging talent communities launching quick-fire hackathons.',
        durationWeeks: 2,
        recommendedBudgetMin: 2500,
        recommendedBudgetMax: 12000,
        toolkit: ['Kickoff briefing deck', 'Mentor rotation schedule', 'Judging scorecard'],
        prompts: ['Which sponsor is accountable for marketing?', 'What is the demo-day success metric?'],
      },
      {
        name: 'Bootcamp delivery workspace',
        category: 'bootcamp',
        description: 'Structured bootcamp delivery with weekly rituals, feedback loops, and alumni storytelling prompts.',
        summary: 'Designed for reskilling cohorts and apprenticeship accelerators.',
        durationWeeks: 4,
        recommendedBudgetMin: 15000,
        recommendedBudgetMax: 48000,
        toolkit: ['Weekly retro template', 'Sponsor update deck', 'Learner survey automation'],
        prompts: ['How do we celebrate learner milestones?', 'Who owns employer showcases each week?'],
      },
      {
        name: 'Consulting engagement blueprint',
        category: 'consulting',
        description: 'Discovery-to-delivery blueprint with billing checkpoints, compliance reminders, and retrospective generator.',
        summary: 'Ideal for independent consultants running multi-stakeholder engagements.',
        durationWeeks: 6,
        recommendedBudgetMin: 12000,
        recommendedBudgetMax: 90000,
        toolkit: ['Statement of work canvas', 'Executive readout deck', 'Risk register'],
        prompts: ['Which stakeholders approve each milestone?', 'What is the client satisfaction survey cadence?'],
      },
    ],
    { transaction },
  );
}

let initialized = false;

async function ensureInitialized() {
  if (initialized) {
    return;
  }
  await projectGigManagementSequelize.authenticate();
  initialized = true;
}

export async function getProjectGigManagementOverview(ownerId) {
  await ensureInitialized();

  const projects = await Project.findAll({
    where: { ownerId },
    include: [
      { model: ProjectWorkspace, as: 'workspace' },
      { model: ProjectMilestone, as: 'milestones', separate: true, order: [['ordinal', 'ASC']] },
      { model: ProjectCollaborator, as: 'collaborators' },
      { model: ProjectIntegration, as: 'integrations' },
      { model: ProjectRetrospective, as: 'retrospectives', separate: true, order: [['generatedAt', 'DESC']] },
      { model: ProjectAsset, as: 'assets' },
    ],
    order: [['updatedAt', 'DESC']],
  });

  const templates = await ProjectTemplate.findAll({ order: [['createdAt', 'DESC']] });
  const orders = await GigOrder.findAll({
    where: { ownerId },
    include: [
      { model: GigOrderRequirement, as: 'requirements' },
      { model: GigOrderRevision, as: 'revisions', order: [['roundNumber', 'ASC']] },
      { model: GigVendorScorecard, as: 'scorecard' },
      {
        model: GigTimelineEvent,
        as: 'timelineEvents',
        separate: true,
        order: [
          ['scheduledAt', 'ASC'],
          ['createdAt', 'ASC'],
        ],
      },
      {
        model: GigSubmission,
        as: 'submissions',
        separate: true,
        include: [{ model: GigSubmissionAsset, as: 'assets' }],
        order: [
          ['submittedAt', 'DESC'],
          ['createdAt', 'DESC'],
        ],
      },
      {
        model: GigChatMessage,
        as: 'chatMessages',
        separate: true,
        order: [['sentAt', 'DESC']],
        limit: 100,
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  const storyBlocks = await StoryBlock.findAll({ where: { ownerId }, order: [['createdAt', 'DESC']] });
  const brandAssets = await BrandAsset.findAll({ where: { ownerId }, order: [['createdAt', 'DESC']] });

  const sanitizedProjects = projects.map((project) => sanitizeProject(project));
  const sanitizedOrders = orders.map((order) => sanitizeOrder(order));
  const assets = sanitizedProjects.flatMap((project) => project.assets);
  const assetSummary = summarizeAssets(assets);
  const orderBuckets = buildGigOrderBuckets(sanitizedOrders);
  const board = {
    lanes: buildBoardLanes(sanitizedProjects),
    metrics: buildBoardMetrics(sanitizedProjects),
    integrations: PROJECT_STATUSES.map((status) => ({
      status,
      integrations: sanitizedProjects
        .filter((project) => (project.workspace?.status ?? project.status) === status)
        .flatMap((project) => project.integrations.map((integration) => integration.provider)),
    })),
    retrospectives: sanitizedProjects
      .flatMap((project) => project.retrospectives.map((retro) => ({ ...retro, projectId: project.id, projectTitle: project.title })))
      .slice(0, 6),
  };

  const vendorStats = buildVendorStats(sanitizedOrders);
  const reminders = buildGigReminders(sanitizedOrders);
  const storytelling = buildStorytelling(sanitizedProjects, sanitizedOrders, storyBlocks);
  const timeline = buildTimelineSummary(sanitizedOrders);
  const submissionsSummary = buildSubmissionSummary(sanitizedOrders);
  const chatSummary = buildChatSummary(sanitizedOrders);
  const scorecards = sanitizedOrders
    .map((order) =>
      order.scorecard
        ? {
            ...order.scorecard,
            orderNumber: order.orderNumber,
            vendorName: order.vendorName,
            reviewedAt: order.scorecard.updatedAt ?? order.scorecard.createdAt ?? null,
            riskLevel: order.metadata?.riskLevel ?? order.scorecard.riskLevel ?? 'standard',
          }
        : null,
    )
    .filter(Boolean);

  const summary = {
    totalProjects: sanitizedProjects.length,
    activeProjects: sanitizedProjects.filter((project) => project.status !== 'completed').length,
    budgetInPlay: sanitizedProjects.reduce((acc, project) => acc + normalizeNumber(project.budgetAllocated), 0),
    gigsInDelivery: orderBuckets.stats.openCount,
    openGigs: orderBuckets.stats.openCount,
    closedGigs: orderBuckets.stats.closedCount,
    openGigValue: orderBuckets.stats.openValue,
    templatesAvailable: templates.length,
    assetsSecured: brandAssets.length,
    storiesReady: storytelling.achievements.length,
    vendorSatisfaction: vendorStats.averages?.overall ?? null,
    currency: sanitizedOrders.find((order) => order.currency)?.currency ?? 'USD',
  };

  const meta = {
    lastUpdated: new Date().toISOString(),
    fromCache: false,
  };
  const vendorStats = buildVendorStats(orders);
  const reminders = buildGigReminders(orders);
  const storytelling = buildStorytelling(sanitizedProjects, orders, storyBlocks);
  const sanitizedOrders = orders.map((order) => sanitizeGigOrder(order, { includeAssociations: false }));

  return {
    summary,
    projectCreation: { projects: sanitizedProjects, templates },
    assets: { items: assets, summary: assetSummary, brandAssets },
    managementBoard: board,
    board,
    purchasedGigs: {
      orders: sanitizedOrders,
      reminders,
      stats: vendorStats,
      buckets: orderBuckets.stats,
      timeline,
      submissions: submissionsSummary,
      chat: chatSummary,
      scorecards,
    },
    storytelling,
    meta,
    projects: sanitizedProjects,
    templates,
  };
}

function assertOwnership(record, ownerId, message) {
  if (!record || record.ownerId !== ownerId) {
    throw new NotFoundError(message);
  }
}

export async function createProject(ownerId, payload) {
  await ensureInitialized();
  if (!payload.title || !payload.description) {
    throw new ValidationError('Title and description are required.');
  }

  if (payload.status && !PROJECT_STATUSES.includes(payload.status)) {
    throw new ValidationError('Invalid project status provided.');
  }

  if (payload.workspace?.riskLevel && !PROJECT_RISK_LEVELS.includes(payload.workspace.riskLevel)) {
    throw new ValidationError('Invalid project risk level provided.');
  }

  if (payload.workspace?.status && !PROJECT_STATUSES.includes(payload.workspace.status)) {
    throw new ValidationError('Invalid workspace status provided.');
  }

  const budgetAllocated = ensureNumber(payload.budgetAllocated ?? 0, {
    label: 'Budget allocated',
  });
  const budgetSpent = ensureNumber(payload.budgetSpent ?? 0, { label: 'Budget spent' });
  if (budgetSpent > budgetAllocated) {
    throw new ValidationError('Budget spent cannot exceed the allocated amount.');
  }

  const startDate = ensureDate(payload.startDate, { label: 'Start date' });
  const dueDate = ensureDate(payload.dueDate, { label: 'Due date' });
  if (startDate && dueDate && dueDate.getTime() < startDate.getTime()) {
    throw new ValidationError('Due date cannot be earlier than the project start date.');
  }

  return projectGigManagementSequelize.transaction(async (transaction) => {
    const project = await Project.create(
      {
        ownerId,
        title: payload.title,
        description: payload.description,
        status: payload.status ?? 'planning',
        startDate: startDate ?? null,
        dueDate: dueDate ?? null,
        budgetCurrency: payload.budgetCurrency ?? 'USD',
        budgetAllocated,
        budgetSpent,
        metadata: payload.metadata ?? {},
      },
      { transaction },
    );

    await ProjectWorkspace.create(
      {
        projectId: project.id,
        status: payload.workspace?.status ?? project.status,
        progressPercent: payload.workspace?.progressPercent ?? 5,
        riskLevel: payload.workspace?.riskLevel && PROJECT_RISK_LEVELS.includes(payload.workspace.riskLevel)
          ? payload.workspace.riskLevel
          : 'low',
        nextMilestone: payload.workspace?.nextMilestone ?? null,
        nextMilestoneDueAt: ensureDate(payload.workspace?.nextMilestoneDueAt ?? payload.dueDate, {
          label: 'Next milestone due date',
        }),
        notes: payload.workspace?.notes ?? null,
        metrics: payload.workspace?.metrics ?? {},
      },
      { transaction },
    );

    if (Array.isArray(payload.milestones)) {
      const milestones = payload.milestones.map((milestone, index) => ({
        projectId: project.id,
        title: milestone.title,
        description: milestone.description ?? null,
        ordinal: milestone.ordinal ?? index,
        dueDate: ensureDate(milestone.dueDate, { label: 'Milestone due date' }),
        status: milestone.status ?? 'planned',
        budget: milestone.budget ?? 0,
      }));
      await ProjectMilestone.bulkCreate(milestones, { transaction });
    }

    if (Array.isArray(payload.collaborators)) {
      const collaborators = payload.collaborators.map((collaborator) => ({
        projectId: project.id,
        fullName: collaborator.fullName,
        email: collaborator.email ?? null,
        role: collaborator.role ?? 'Collaborator',
        status: collaborator.status ?? 'invited',
        hourlyRate: collaborator.hourlyRate ?? null,
        permissions: collaborator.permissions ?? {},
      }));
      await ProjectCollaborator.bulkCreate(collaborators, { transaction });
    }

    if (Array.isArray(payload.integrations)) {
      const integrations = payload.integrations.map((integration) => ({
        projectId: project.id,
        provider: integration.provider,
        status: integration.status ?? 'connected',
        connectedAt: integration.connectedAt ?? new Date(),
        metadata: integration.metadata ?? {},
      }));
      await ProjectIntegration.bulkCreate(integrations, { transaction });
    }

    await ensureTemplatesSeeded(transaction);

    return project;
  });
}

export async function addProjectAsset(ownerId, projectId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId);
  assertOwnership(project, ownerId, 'Project not found');
  if (!payload.label || !payload.storageUrl) {
    throw new ValidationError('Asset label and storageUrl are required.');
  }

  return ProjectAsset.create({
    projectId,
    label: payload.label,
    category: payload.category ?? 'artifact',
    storageUrl: payload.storageUrl,
    thumbnailUrl: payload.thumbnailUrl ?? null,
    sizeBytes: payload.sizeBytes ?? 0,
    permissionLevel: payload.permissionLevel ?? 'internal',
    watermarkEnabled: payload.watermarkEnabled ?? true,
    metadata: payload.metadata ?? {},
  });
}

export async function updateProjectWorkspace(ownerId, projectId, payload) {
  await ensureInitialized();
  const project = await Project.findByPk(projectId, { include: [{ model: ProjectWorkspace, as: 'workspace' }] });
  assertOwnership(project, ownerId, 'Project not found');
  if (!project.workspace) {
    throw new NotFoundError('Workspace not initialized for project.');
  }

  if (payload.status && !PROJECT_STATUSES.includes(payload.status)) {
    throw new ValidationError('Invalid workspace status provided.');
  }
  if (payload.riskLevel && !PROJECT_RISK_LEVELS.includes(payload.riskLevel)) {
    throw new ValidationError('Invalid workspace risk level provided.');
  }
  if (payload.progressPercent != null) {
    const parsed = ensureNumber(payload.progressPercent, { label: 'Progress percent', allowNegative: false });
    if (parsed > 100) {
      throw new ValidationError('Progress percent cannot exceed 100%.');
    }
  }
  const nextDueAt = ensureDate(payload.nextMilestoneDueAt, { label: 'Next milestone due date' });

  await project.workspace.update({
    status: payload.status ?? project.workspace.status,
    progressPercent:
      payload.progressPercent != null ? Number(payload.progressPercent) : project.workspace.progressPercent,
    riskLevel: payload.riskLevel ?? project.workspace.riskLevel,
    nextMilestone: payload.nextMilestone ?? project.workspace.nextMilestone,
    nextMilestoneDueAt: nextDueAt ?? project.workspace.nextMilestoneDueAt,
    notes: payload.notes ?? project.workspace.notes,
    metrics: payload.metrics ?? project.workspace.metrics,
  });

  return project.workspace.reload();
}

export async function createGigOrder(ownerId, payload) {
  await ensureInitialized();
  if (!payload.vendorName || !payload.serviceName) {
    throw new ValidationError('vendorName and serviceName are required');
  }

  if (payload.status && !GIG_ORDER_STATUSES.includes(payload.status)) {
    throw new ValidationError('Invalid gig order status provided.');
  }

  const amount = ensureNumber(payload.amount ?? 0, { label: 'Order amount' });
  const kickoffAt = ensureDate(payload.kickoffAt ?? new Date(), { label: 'Kickoff date' }) ?? new Date();
  const dueAt = ensureDate(payload.dueAt, { label: 'Delivery due date' });
  if (dueAt && dueAt.getTime() < kickoffAt.getTime()) {
    throw new ValidationError('Delivery due date cannot be earlier than the kickoff date.');
  }

  const currency = payload.currency ?? 'USD';
  const metadata = buildGigMetadata(payload, currency);

  return projectGigManagementSequelize.transaction(async (transaction) => {
    const order = await GigOrder.create(
      {
        ownerId,
        orderNumber: payload.orderNumber ?? `ORD-${Date.now()}`,
        vendorName: payload.vendorName,
        serviceName: payload.serviceName,
        status: payload.status ?? 'requirements',
        progressPercent: payload.progressPercent ?? 0,
        amount,
        currency,
        kickoffAt,
        dueAt,
        metadata,
      },
      { transaction },
    );

    if (Array.isArray(payload.requirements) && payload.requirements.length > 0) {
      await GigOrderRequirement.bulkCreate(
        payload.requirements.map((requirement) => ({
          orderId: order.id,
          title: requirement.title,
          status: requirement.status ?? 'pending',
          dueAt: ensureDate(requirement.dueAt, { label: 'Requirement due date' }),
          notes: requirement.notes ?? null,
        })),
        { transaction },
      );
    }

    if (payload.scorecard) {
      await GigVendorScorecard.create(
        {
          orderId: order.id,
          qualityScore: payload.scorecard.qualityScore ?? null,
          communicationScore: payload.scorecard.communicationScore ?? null,
          reliabilityScore: payload.scorecard.reliabilityScore ?? null,
          overallScore: payload.scorecard.overallScore ?? null,
          notes: payload.scorecard.notes ?? null,
        },
        { transaction },
      );
    }

    await order.reload({ transaction });
    return sanitizeGigOrder(order, { includeAssociations: false });
  });
}

export async function addGigTimelineEvent(ownerId, orderId, payload) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  if (!payload.title || !payload.title.trim()) {
    throw new ValidationError('Timeline event title is required.');
  }

  const type = payload.type ?? 'note';
  if (!GIG_TIMELINE_EVENT_TYPES.includes(type)) {
    throw new ValidationError('Invalid timeline event type provided.');
  }

  const status = payload.status ?? 'scheduled';
  if (!GIG_TIMELINE_EVENT_STATUSES.includes(status)) {
    throw new ValidationError('Invalid timeline event status provided.');
  }

  const scheduledAt = ensureDate(payload.scheduledAt, { label: 'Scheduled at' });
  const completedAt = ensureDate(payload.completedAt, { label: 'Completed at' });

  if (completedAt && !['completed'].includes(status)) {
    throw new ValidationError('Completed at can only be supplied when the event is marked as completed.');
  }

  return GigTimelineEvent.create({
    orderId: order.id,
    title: payload.title.trim(),
    type,
    status,
    scheduledAt,
    completedAt: completedAt ?? null,
    assignedTo: payload.assignedTo ?? null,
    notes: payload.notes ?? null,
    metadata: payload.metadata ?? {},
  });
}

export async function updateGigTimelineEvent(ownerId, orderId, eventId, payload) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  const event = await GigTimelineEvent.findByPk(eventId);
  if (!event || event.orderId !== order.id) {
    throw new NotFoundError('Timeline event not found');
  }

  let type = event.type;
  if (payload.type) {
    if (!GIG_TIMELINE_EVENT_TYPES.includes(payload.type)) {
      throw new ValidationError('Invalid timeline event type provided.');
    }
    type = payload.type;
  }

  let status = event.status;
  if (payload.status) {
    if (!GIG_TIMELINE_EVENT_STATUSES.includes(payload.status)) {
      throw new ValidationError('Invalid timeline event status provided.');
    }
    status = payload.status;
  }

  const scheduledAt = payload.scheduledAt ? ensureDate(payload.scheduledAt, { label: 'Scheduled at' }) : event.scheduledAt;
  const completedAt = payload.completedAt ? ensureDate(payload.completedAt, { label: 'Completed at' }) : event.completedAt;

  if (completedAt && !['completed'].includes(status)) {
    throw new ValidationError('Completed at can only be supplied when the event is marked as completed.');
  }

  await event.update({
    title: payload.title?.trim() || event.title,
    type,
    status,
    scheduledAt,
    completedAt: completedAt ?? null,
    assignedTo: payload.assignedTo ?? event.assignedTo,
    notes: payload.notes ?? event.notes,
    metadata: payload.metadata ?? event.metadata,
  });

  return event.reload();
}

export async function addGigSubmission(ownerId, orderId, payload) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  if (!payload.title || !payload.title.trim()) {
    throw new ValidationError('Submission title is required.');
  }

  const status = payload.status ?? 'submitted';
  if (!GIG_SUBMISSION_STATUSES.includes(status)) {
    throw new ValidationError('Invalid submission status provided.');
  }

  const submittedAt = ensureDate(payload.submittedAt ?? new Date(), { label: 'Submitted at' }) ?? new Date();
  const reviewedAt = ensureDate(payload.reviewedAt, { label: 'Reviewed at' });

  return projectGigManagementSequelize.transaction(async (transaction) => {
    const submission = await GigSubmission.create(
      {
        orderId: order.id,
        title: payload.title.trim(),
        status,
        submittedAt,
        submittedBy: payload.submittedBy ?? null,
        submittedByEmail: payload.submittedByEmail ?? null,
        notes: payload.notes ?? null,
        reviewNotes: payload.reviewNotes ?? null,
        reviewedAt: reviewedAt ?? null,
        reviewedBy: payload.reviewedBy ?? null,
        metadata: payload.metadata ?? {},
      },
      { transaction },
    );

    if (Array.isArray(payload.assets) && payload.assets.length > 0) {
      await GigSubmissionAsset.bulkCreate(
        payload.assets
          .filter((asset) => asset?.url)
          .map((asset) => ({
            submissionId: submission.id,
            label: asset.label ?? asset.url,
            url: asset.url,
            previewUrl: asset.previewUrl ?? null,
            sizeBytes: asset.sizeBytes ?? null,
            metadata: asset.metadata ?? {},
          })),
        { transaction },
      );
    }

    return submission;
  });
}

export async function updateGigSubmission(ownerId, orderId, submissionId, payload) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  const submission = await GigSubmission.findByPk(submissionId, {
    include: [{ model: GigSubmissionAsset, as: 'assets' }],
  });

  if (!submission || submission.orderId !== order.id) {
    throw new NotFoundError('Gig submission not found');
  }

  let status = submission.status;
  if (payload.status) {
    if (!GIG_SUBMISSION_STATUSES.includes(payload.status)) {
      throw new ValidationError('Invalid submission status provided.');
    }
    status = payload.status;
  }

  const submittedAt = payload.submittedAt ? ensureDate(payload.submittedAt, { label: 'Submitted at' }) : submission.submittedAt;
  const reviewedAt = payload.reviewedAt ? ensureDate(payload.reviewedAt, { label: 'Reviewed at' }) : submission.reviewedAt;

  await submission.update({
    title: payload.title?.trim() || submission.title,
    status,
    submittedAt,
    submittedBy: payload.submittedBy ?? submission.submittedBy,
    submittedByEmail: payload.submittedByEmail ?? submission.submittedByEmail,
    notes: payload.notes ?? submission.notes,
    reviewNotes: payload.reviewNotes ?? submission.reviewNotes,
    reviewedAt,
    reviewedBy: payload.reviewedBy ?? submission.reviewedBy,
    metadata: payload.metadata ?? submission.metadata,
  });

  if (Array.isArray(payload.appendAssets) && payload.appendAssets.length > 0) {
    await GigSubmissionAsset.bulkCreate(
      payload.appendAssets
        .filter((asset) => asset?.url)
        .map((asset) => ({
          submissionId: submission.id,
          label: asset.label ?? asset.url,
          url: asset.url,
          previewUrl: asset.previewUrl ?? null,
          sizeBytes: asset.sizeBytes ?? null,
          metadata: asset.metadata ?? {},
        })),
    );
  }

  return submission.reload({ include: [{ model: GigSubmissionAsset, as: 'assets' }] });
}

export async function postGigChatMessage(ownerId, orderId, payload) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  if (!payload.body || !payload.body.trim()) {
    throw new ValidationError('Message body is required.');
  }

  const sentAt = ensureDate(payload.sentAt ?? new Date(), { label: 'Sent at' }) ?? new Date();
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : payload.attachments ? [payload.attachments] : [];

  return GigChatMessage.create({
    orderId: order.id,
    authorId: payload.authorId ?? ownerId,
    authorName: payload.authorName ?? 'Workspace member',
    authorRole: payload.authorRole ?? null,
    body: payload.body.trim(),
    attachments: attachments.length ? attachments : null,
    sentAt,
    pinned: Boolean(payload.pinned),
    visibility: payload.visibility ?? 'internal',
  });
}

export async function updateGigOrder(ownerId, orderId, payload) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId, {
    include: [
      { model: GigOrderRequirement, as: 'requirements' },
      { model: GigOrderRevision, as: 'revisions' },
      { model: GigVendorScorecard, as: 'scorecard' },
    ],
  });
  assertOwnership(order, ownerId, 'Gig order not found');

  if (payload.status && !GIG_ORDER_STATUSES.includes(payload.status)) {
    throw new ValidationError('Invalid gig order status provided.');
  }
  if (payload.progressPercent != null) {
    const progress = ensureNumber(payload.progressPercent, { label: 'Progress percent', allowNegative: false });
    if (progress > 100) {
      throw new ValidationError('Progress percent cannot exceed 100%.');
    }
  }
  const dueAt = ensureDate(payload.dueAt, { label: 'Delivery due date' });

  const currency = payload.currency ?? order.currency;
  let nextMetadata = order.metadata ?? {};
  if (
    payload.classes ||
    payload.gigClasses ||
    payload.addons ||
    payload.gigAddons ||
    payload.tags ||
    payload.gigTags ||
    payload.media ||
    payload.gigMedia ||
    payload.faqs ||
    payload.gigFaqs
  ) {
    nextMetadata = buildGigMetadata(
      {
        ...payload,
        metadata: { ...order.metadata, ...(payload.metadata ?? {}) },
        classes: payload.classes ?? payload.gigClasses ?? order.metadata?.classes ?? [],
        addons: payload.addons ?? payload.gigAddons ?? order.metadata?.addons ?? [],
        tags: payload.tags ?? payload.gigTags ?? order.metadata?.tags ?? [],
        media: payload.media ?? payload.gigMedia ?? order.metadata?.media ?? [],
        faqs: payload.faqs ?? payload.gigFaqs ?? order.metadata?.faqs ?? [],
      },
      currency,
    );
  } else if (payload.metadata) {
    nextMetadata = { ...order.metadata, ...payload.metadata };
  }

  await order.update({
    status: payload.status ?? order.status,
    progressPercent:
      payload.progressPercent != null ? Number(payload.progressPercent) : order.progressPercent,
    dueAt: dueAt ?? order.dueAt,
    metadata: nextMetadata,
  });

  if (Array.isArray(payload.newRevisions)) {
    await GigOrderRevision.bulkCreate(
      payload.newRevisions.map((revision) => ({
        orderId: order.id,
        roundNumber: revision.roundNumber ?? (order.revisions?.length ?? 0) + 1,
        status: revision.status ?? 'requested',
        requestedAt: revision.requestedAt ?? new Date(),
        dueAt: revision.dueAt ?? null,
        submittedAt: revision.submittedAt ?? null,
        approvedAt: revision.approvedAt ?? null,
        summary: revision.summary ?? null,
      })),
    );
  }

  if (payload.scorecard) {
    if (order.scorecard) {
      await order.scorecard.update({
        qualityScore: payload.scorecard.qualityScore ?? order.scorecard.qualityScore,
        communicationScore: payload.scorecard.communicationScore ?? order.scorecard.communicationScore,
        reliabilityScore: payload.scorecard.reliabilityScore ?? order.scorecard.reliabilityScore,
        overallScore: payload.scorecard.overallScore ?? order.scorecard.overallScore,
        notes: payload.scorecard.notes ?? order.scorecard.notes,
      });
    } else {
      await GigVendorScorecard.create({
        orderId: order.id,
        qualityScore: payload.scorecard.qualityScore ?? null,
        communicationScore: payload.scorecard.communicationScore ?? null,
        reliabilityScore: payload.scorecard.reliabilityScore ?? null,
        overallScore: payload.scorecard.overallScore ?? null,
        notes: payload.scorecard.notes ?? null,
      });
    }
  }

  await order.reload();
  return sanitizeGigOrder(order);
}

export async function getGigOrderDetail(ownerId, orderId, { messageLimit = 50 } = {}) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId, {
    include: [
      { model: GigOrderRequirement, as: 'requirements', separate: true, order: [['createdAt', 'ASC']] },
      { model: GigOrderRevision, as: 'revisions', separate: true, order: [['roundNumber', 'ASC']] },
      { model: GigVendorScorecard, as: 'scorecard' },
      {
        model: GigTimelineEvent,
        as: 'timeline',
        separate: true,
        order: [
          ['occurredAt', 'DESC'],
          ['createdAt', 'DESC'],
        ],
        limit: 120,
      },
      {
        model: GigSubmission,
        as: 'submissions',
        separate: true,
        order: [
          ['submittedAt', 'DESC'],
          ['createdAt', 'DESC'],
        ],
        limit: 120,
      },
      {
        model: GigChatMessage,
        as: 'messages',
        separate: true,
        order: [
          ['sentAt', 'DESC'],
          ['createdAt', 'DESC'],
        ],
        limit: Number.isFinite(messageLimit) && messageLimit > 0 ? Math.min(messageLimit, 200) : 50,
      },
    ],
  });
  assertOwnership(order, ownerId, 'Gig order not found');
  return sanitizeGigOrder(order);
}

export async function createGigTimelineEvent(ownerId, orderId, payload, { actorId } = {}) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  if (!title) {
    throw new ValidationError('Timeline events must include a title.');
  }
  const eventType = typeof payload.eventType === 'string' ? payload.eventType.trim().toLowerCase() : '';
  if (!GIG_TIMELINE_EVENT_TYPES.includes(eventType)) {
    throw new ValidationError('Choose a valid event type for the timeline entry.');
  }
  const visibility = typeof payload.visibility === 'string' ? payload.visibility.trim().toLowerCase() : 'internal';
  if (!GIG_TIMELINE_VISIBILITIES.includes(visibility)) {
    throw new ValidationError('Timeline visibility must be internal, client, or vendor.');
  }
  const occurredAt = ensureDate(payload.occurredAt ?? new Date(), { label: 'Event time' }) ?? new Date();

  const event = await GigTimelineEvent.create({
    orderId: order.id,
    eventType,
    title,
    summary: typeof payload.summary === 'string' ? payload.summary.trim() || null : null,
    createdById: actorId ?? ownerId,
    visibility,
    occurredAt,
    metadata: payload.metadata ?? {},
  });

  return sanitizeTimelineEvent(event);
}

export async function createGigSubmission(ownerId, orderId, payload, { actorId } = {}) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  if (!title) {
    throw new ValidationError('Provide a submission title so the team can reference it.');
  }
  const status = typeof payload.status === 'string' ? payload.status.trim().toLowerCase() : 'submitted';
  if (!GIG_SUBMISSION_STATUSES.includes(status)) {
    throw new ValidationError('Submission status is not recognised.');
  }

  const submission = await GigSubmission.create({
    orderId: order.id,
    title,
    description: typeof payload.description === 'string' ? payload.description.trim() || null : null,
    status,
    assetUrl: typeof payload.assetUrl === 'string' ? payload.assetUrl.trim() || null : null,
    assetType: typeof payload.assetType === 'string' ? payload.assetType.trim() || null : null,
    attachments: normalizeAttachments(payload.attachments),
    submittedAt: ensureDate(payload.submittedAt ?? new Date(), { label: 'Submission time' }) ?? new Date(),
    approvedAt:
      status === 'approved'
        ? ensureDate(payload.approvedAt ?? new Date(), { label: 'Approval time' }) ?? new Date()
        : ensureDate(payload.approvedAt, { label: 'Approval time' }),
    submittedById: actorId ?? ownerId,
    reviewedById: payload.reviewedById ?? null,
    metadata: payload.metadata ?? {},
  });

  return sanitizeSubmission(submission);
}

export async function updateGigSubmission(ownerId, orderId, submissionId, payload, { actorId } = {}) {
  await ensureInitialized();
  const submission = await GigSubmission.findByPk(submissionId);
  if (!submission || submission.orderId !== orderId) {
    throw new NotFoundError('Gig submission not found.');
  }
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  const updates = {};
  if (payload.title != null) {
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    if (!title) {
      throw new ValidationError('Submission title cannot be empty.');
    }
    updates.title = title;
  }
  if (payload.description != null) {
    updates.description = typeof payload.description === 'string' ? payload.description.trim() || null : null;
  }
  if (payload.status != null) {
    const status = typeof payload.status === 'string' ? payload.status.trim().toLowerCase() : '';
    if (!GIG_SUBMISSION_STATUSES.includes(status)) {
      throw new ValidationError('Submission status is not recognised.');
    }
    updates.status = status;
    if (status === 'approved') {
      updates.approvedAt = ensureDate(payload.approvedAt ?? new Date(), { label: 'Approval time' }) ?? new Date();
      updates.reviewedById = payload.reviewedById ?? actorId ?? ownerId;
    } else if (payload.approvedAt != null) {
      updates.approvedAt = ensureDate(payload.approvedAt, { label: 'Approval time' });
    }
  }
  if (payload.assetUrl != null) {
    updates.assetUrl = typeof payload.assetUrl === 'string' ? payload.assetUrl.trim() || null : null;
  }
  if (payload.assetType != null) {
    updates.assetType = typeof payload.assetType === 'string' ? payload.assetType.trim() || null : null;
  }
  if (payload.attachments != null) {
    updates.attachments = normalizeAttachments(payload.attachments);
  }
  if (payload.metadata != null) {
    updates.metadata = payload.metadata;
  }
  if (Object.keys(updates).length === 0) {
    return sanitizeSubmission(submission);
  }

  await submission.update(updates);
  return sanitizeSubmission(submission);
}

export async function postGigChatMessage(ownerId, orderId, payload, { actorId, actorRole } = {}) {
  await ensureInitialized();
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  if (!body) {
    throw new ValidationError('Chat messages require content.');
  }
  const visibility = typeof payload.visibility === 'string' ? payload.visibility.trim().toLowerCase() : 'internal';
  if (!GIG_CHAT_VISIBILITIES.includes(visibility)) {
    throw new ValidationError('Chat visibility must be internal, client, or vendor.');
  }

  const message = await GigChatMessage.create({
    orderId: order.id,
    senderId: actorId ?? ownerId,
    senderRole:
      typeof payload.senderRole === 'string'
        ? payload.senderRole.trim().toLowerCase()
        : typeof actorRole === 'string'
        ? actorRole.trim().toLowerCase()
        : 'owner',
    body,
    attachments: normalizeAttachments(payload.attachments, { limit: 6 }),
    visibility,
    sentAt: ensureDate(payload.sentAt ?? new Date(), { label: 'Message time' }) ?? new Date(),
    metadata: payload.metadata ?? {},
  });

  return sanitizeChatMessage(message);
}

export async function acknowledgeGigChatMessage(ownerId, orderId, messageId, { actorId } = {}) {
  await ensureInitialized();
  const message = await GigChatMessage.findByPk(messageId);
  if (!message || message.orderId !== orderId) {
    throw new NotFoundError('Chat message not found.');
  }
  const order = await GigOrder.findByPk(orderId);
  assertOwnership(order, ownerId, 'Gig order not found');

  await message.update({
    acknowledgedAt: ensureDate(new Date(), { label: 'Acknowledged at' }) ?? new Date(),
    acknowledgedById: actorId ?? ownerId,
  });

  return sanitizeChatMessage(message);
}

export default {
  getProjectGigManagementOverview,
  createProject,
  addProjectAsset,
  updateProjectWorkspace,
  createGigOrder,
  addGigTimelineEvent,
  updateGigTimelineEvent,
  addGigSubmission,
  updateGigSubmission,
  postGigChatMessage,
  updateGigOrder,
  getGigOrderDetail,
  createGigTimelineEvent,
  createGigSubmission,
  updateGigSubmission,
  postGigChatMessage,
  acknowledgeGigChatMessage,
};
