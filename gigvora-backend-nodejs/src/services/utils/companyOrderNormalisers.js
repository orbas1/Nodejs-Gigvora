function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeCompanyOrderDeliverables(deliverables = []) {
  if (!Array.isArray(deliverables)) {
    return [];
  }

  return deliverables
    .map((item, index) => {
      if (!item) {
        return null;
      }
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      if (!title) {
        return null;
      }
      const dueAt = item?.dueAt ? new Date(item.dueAt).toISOString() : null;
      const notes = typeof item?.notes === 'string' ? item.notes.trim() : null;
      const amount = item?.amount != null ? toNumber(item.amount, null) : null;
      const deliveryDays = item?.deliveryDays != null ? toNumber(item.deliveryDays, null) : null;
      return {
        id: item?.id != null ? Number(item.id) : undefined,
        title,
        dueAt,
        notes,
        amount,
        deliveryDays,
        ordinal: item?.ordinal != null ? Number(item.ordinal) : index + 1,
      };
    })
    .filter(Boolean);
}

export function buildGigClassesFromDeliverables(deliverables, { amount, currency }) {
  const resolvedCurrency = (currency && currency.toString().trim().toUpperCase()) || 'USD';
  const safeAmount = Math.max(toNumber(amount, 1200), 1200);
  const slice = (Array.isArray(deliverables) ? deliverables : []).slice(0, 6);
  const baseShare = slice.length ? safeAmount / slice.length : safeAmount;

  const classes = slice.map((deliverable, index) => {
    const label = deliverable.title || `Deliverable ${index + 1}`;
    const share =
      deliverable.amount != null ? Math.max(toNumber(deliverable.amount), 50) : Math.max(baseShare, 50);
    const deliveryDays =
      deliverable.deliveryDays != null
        ? Math.max(toNumber(deliverable.deliveryDays), 1)
        : 7 * (index + 1);

    return {
      key: `deliverable-${index + 1}`,
      name: label.slice(0, 80),
      summary: deliverable.notes?.slice(0, 260) || 'Curated deliverable packaged for this engagement.',
      priceAmount: Math.round(share),
      priceCurrency: resolvedCurrency,
      deliveryDays,
      inclusions: [],
    };
  });

  while (classes.length < 3) {
    const ordinal = classes.length + 1;
    classes.push({
      key: `package-${ordinal}`,
      name: `Package ${ordinal}`,
      summary: 'Expanded scope with additional collaboration hours.',
      priceAmount: Math.round(safeAmount * (1 + ordinal * 0.15)),
      priceCurrency: resolvedCurrency,
      deliveryDays: 7 * (ordinal + 1),
      inclusions: [],
    });
  }

  return classes.slice(0, 6);
}

export function mapDeliverablesToRequirements(deliverables, { status = 'pending' } = {}) {
  const safeDeliverables = Array.isArray(deliverables) ? deliverables : [];
  return safeDeliverables.map((item) => ({
    id: item.id,
    title: item.title,
    dueAt: item.dueAt ?? null,
    status,
    notes: item.notes ?? null,
  }));
}

export default {
  normalizeCompanyOrderDeliverables,
  buildGigClassesFromDeliverables,
  mapDeliverablesToRequirements,
};
