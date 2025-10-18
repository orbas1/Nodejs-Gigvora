export const TIMELINE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

export const TIMELINE_VISIBILITIES = [
  { value: 'internal', label: 'Internal' },
  { value: 'partners', label: 'Partners' },
  { value: 'public', label: 'Public' },
];

export const EVENT_TYPES = [
  { value: 'milestone', label: 'Milestone' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'release', label: 'Release' },
  { value: 'checkpoint', label: 'Checkpoint' },
  { value: 'handoff', label: 'Handoff' },
];

export const EVENT_STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'complete', label: 'Complete' },
];

export function formatDateForInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

export function formatDateForDisplay(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function parseListFromText(text) {
  if (!text) return [];
  return text
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 25);
}

export function parseAttachments(text) {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, urlPart, descriptionPart] = line.split('|').map((segment) => segment.trim());
      const url = urlPart || labelPart || '';
      if (!url) {
        return null;
      }
      return {
        label: labelPart || null,
        url,
        description: descriptionPart || null,
      };
    })
    .filter(Boolean)
    .slice(0, 10);
}

export function attachmentsToText(attachments) {
  if (!Array.isArray(attachments) || !attachments.length) {
    return '';
  }
  return attachments
    .map((attachment) => {
      if (!attachment) return null;
      const label = attachment.label ? `${attachment.label}`.trim() : '';
      const url = attachment.url ? `${attachment.url}`.trim() : '';
      const description = attachment.description ? `${attachment.description}`.trim() : '';
      if (!label && !url && !description) {
        return null;
      }
      return [label, url, description].filter(Boolean).join(' | ');
    })
    .filter(Boolean)
    .join('\n');
}

export function timelineToForm(timeline) {
  if (!timeline) {
    return {
      id: null,
      name: '',
      slug: '',
      summary: '',
      description: '',
      timelineType: '',
      status: 'draft',
      visibility: 'internal',
      startDate: '',
      endDate: '',
      heroImageUrl: '',
      thumbnailUrl: '',
      tagsText: '',
      programOwner: '',
      programEmail: '',
      coordinationChannel: '',
      riskNotes: '',
    };
  }

  const tags = Array.isArray(timeline.tags) ? timeline.tags.join(', ') : '';
  const settings = timeline.settings ?? {};

  return {
    id: timeline.id ?? null,
    name: timeline.name ?? '',
    slug: timeline.slug ?? '',
    summary: timeline.summary ?? '',
    description: timeline.description ?? '',
    timelineType: timeline.timelineType ?? '',
    status: timeline.status ?? 'draft',
    visibility: timeline.visibility ?? 'internal',
    startDate: formatDateForInput(timeline.startDate),
    endDate: formatDateForInput(timeline.endDate),
    heroImageUrl: timeline.heroImageUrl ?? '',
    thumbnailUrl: timeline.thumbnailUrl ?? '',
    tagsText: tags,
    programOwner: settings.programOwner ?? '',
    programEmail: settings.programEmail ?? '',
    coordinationChannel: settings.coordinationChannel ?? '',
    riskNotes: settings.riskNotes ?? '',
  };
}

export function eventToForm(event) {
  if (!event) {
    return {
      id: null,
      title: '',
      summary: '',
      description: '',
      eventType: 'milestone',
      status: 'planned',
      startDate: '',
      dueDate: '',
      endDate: '',
      ownerName: '',
      ownerEmail: '',
      ownerId: '',
      location: '',
      ctaLabel: '',
      ctaUrl: '',
      tagsText: '',
      attachmentsText: '',
      orderIndex: 0,
    };
  }

  return {
    id: event.id ?? null,
    title: event.title ?? '',
    summary: event.summary ?? '',
    description: event.description ?? '',
    eventType: event.eventType ?? 'milestone',
    status: event.status ?? 'planned',
    startDate: formatDateForInput(event.startDate),
    dueDate: formatDateForInput(event.dueDate),
    endDate: formatDateForInput(event.endDate),
    ownerName: event.ownerName ?? '',
    ownerEmail: event.ownerEmail ?? '',
    ownerId: event.ownerId ?? '',
    location: event.location ?? '',
    ctaLabel: event.ctaLabel ?? '',
    ctaUrl: event.ctaUrl ?? '',
    tagsText: Array.isArray(event.tags) ? event.tags.join(', ') : '',
    attachmentsText: attachmentsToText(event.attachments),
    orderIndex: Number.isFinite(event.orderIndex) ? event.orderIndex : 0,
  };
}

export function timelineFormToPayload(form) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    summary: form.summary.trim(),
    description: form.description.trim(),
    timelineType: form.timelineType.trim(),
    status: form.status,
    visibility: form.visibility,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    heroImageUrl: form.heroImageUrl.trim() || null,
    thumbnailUrl: form.thumbnailUrl.trim() || null,
    tags: parseListFromText(form.tagsText),
    settings: {
      programOwner: form.programOwner.trim() || null,
      programEmail: form.programEmail.trim() || null,
      coordinationChannel: form.coordinationChannel.trim() || null,
      riskNotes: form.riskNotes.trim() || null,
    },
  };
}

export function eventFormToPayload(form) {
  return {
    title: form.title.trim(),
    summary: form.summary.trim(),
    description: form.description.trim(),
    eventType: form.eventType,
    status: form.status,
    startDate: form.startDate || null,
    dueDate: form.dueDate || null,
    endDate: form.endDate || null,
    ownerName: form.ownerName.trim() || null,
    ownerEmail: form.ownerEmail.trim() || null,
    ownerId: form.ownerId.trim() || null,
    location: form.location.trim() || null,
    ctaLabel: form.ctaLabel.trim() || null,
    ctaUrl: form.ctaUrl.trim() || null,
    tags: parseListFromText(form.tagsText),
    attachments: parseAttachments(form.attachmentsText),
    orderIndex: Number.isFinite(form.orderIndex) ? form.orderIndex : 0,
  };
}
