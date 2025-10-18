export function buildEventPayload(values) {
  return {
    title: values.title,
    description: values.description || null,
    location: values.location || null,
    status: values.status,
    format: values.format,
    visibility: values.visibility,
    startAt: values.startAt ? new Date(values.startAt).toISOString() : null,
    endAt: values.endAt ? new Date(values.endAt).toISOString() : null,
    timezone: values.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    capacity: values.capacity ? Number(values.capacity) : null,
    registrationUrl: values.registrationUrl || null,
  };
}

export function buildTaskPayload(values) {
  return {
    title: values.title,
    status: values.status,
    priority: values.priority,
    ownerName: values.ownerName || null,
    dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : null,
    notes: values.notes || null,
  };
}

export function buildGuestPayload(values) {
  return {
    fullName: values.fullName,
    email: values.email || null,
    company: values.company || null,
    role: values.role || null,
    ticketType: values.ticketType || null,
    status: values.status,
    seatsReserved: values.seatsReserved ? Number(values.seatsReserved) : 1,
  };
}

export function buildBudgetPayload(values) {
  return {
    category: values.category,
    vendorName: values.vendorName || null,
    description: values.description || null,
    amountPlanned: values.amountPlanned === '' || values.amountPlanned == null ? null : Number(values.amountPlanned),
    amountActual: values.amountActual === '' || values.amountActual == null ? null : Number(values.amountActual),
    currency: values.currency || 'USD',
    status: values.status,
    notes: values.notes || null,
  };
}

export function buildAgendaPayload(values) {
  return {
    title: values.title,
    description: values.description || null,
    startAt: values.startAt ? new Date(values.startAt).toISOString() : null,
    endAt: values.endAt ? new Date(values.endAt).toISOString() : null,
    ownerName: values.ownerName || null,
  };
}

export function buildAssetPayload(values) {
  return {
    name: values.name,
    url: values.url,
    assetType: values.assetType,
    visibility: values.visibility,
    thumbnailUrl: values.thumbnailUrl || null,
  };
}

export function buildChecklistPayload(values) {
  return {
    label: values.label,
    ownerName: values.ownerName || null,
    dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : null,
    isComplete: Boolean(values.isComplete),
  };
}

