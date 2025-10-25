import { NotFoundError } from '../../utils/errors.js';

const HOURS_IN_MS = 60 * 60 * 1000;

export function toFiniteNumber(value, fallback = 0) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normalizeDeliverables(deliverables = []) {
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
      const notes = typeof item.notes === 'string' ? item.notes.trim() || null : null;
      const dueAt = item.dueAt ? new Date(item.dueAt).toISOString() : null;
      const ordinal = item.ordinal != null ? Number(item.ordinal) : index + 1;
      const amount = item.amount != null ? toFiniteNumber(item.amount, null) : null;
      const deliveryDays = item.deliveryDays != null ? toFiniteNumber(item.deliveryDays, null) : null;

      return {
        id: item.id != null ? Number(item.id) : undefined,
        title,
        notes,
        dueAt,
        ordinal,
        amount,
        deliveryDays,
      };
    })
    .filter(Boolean);
}

export function buildGigClassesFromDeliverables(deliverables, { amount, currency }) {
  const resolvedCurrency = (currency && currency.toString().trim().toUpperCase()) || 'USD';
  const safeAmount = Math.max(toFiniteNumber(amount, 1200), 1200);
  const slice = Array.isArray(deliverables) ? deliverables.slice(0, 6) : [];
  const baseShare = slice.length ? safeAmount / slice.length : safeAmount;

  const classes = slice.map((deliverable, index) => {
    const label = deliverable.title || `Deliverable ${index + 1}`;
    const share =
      deliverable.amount != null
        ? Math.max(toFiniteNumber(deliverable.amount), 50)
        : Math.max(baseShare, 50);
    const deliveryDays =
      deliverable.deliveryDays != null
        ? Math.max(toFiniteNumber(deliverable.deliveryDays), 1)
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

export function deriveOrderMetrics(orders = [], currency = 'USD') {
  const collection = Array.isArray(orders) ? orders : [];
  const openOrders = collection.filter(
    (order) =>
      order &&
      order.isClosed !== true &&
      String(order.status).toLowerCase() !== 'closed' &&
      String(order.status).toLowerCase() !== 'completed',
  );
  const closedOrders = collection.filter(
    (order) =>
      order &&
      (order.isClosed === true ||
        String(order.status).toLowerCase() === 'closed' ||
        String(order.status).toLowerCase() === 'completed'),
  );

  const valueInFlight = openOrders.reduce((total, order) => total + toFiniteNumber(order.amount), 0);
  const escrowHeldAmount = collection.reduce((total, order) => total + toFiniteNumber(order.escrowHeldAmount), 0);

  return {
    totalOrders: collection.length,
    openOrders: openOrders.length,
    closedOrders: closedOrders.length,
    valueInFlight: Math.round(valueInFlight),
    escrowHeldAmount: Math.round(escrowHeldAmount),
    currency,
  };
}

export function evaluateSlaAlerts(
  orders = [],
  { now = new Date(), atRiskWindowHours = 48, breachGraceHours = 0, includeResolved = false } = {},
) {
  const nowDate = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(nowDate.getTime())) {
    throw new NotFoundError('SLA evaluation requires a valid timestamp.');
  }

  const nowMs = nowDate.getTime();
  const atRiskWindowMs = atRiskWindowHours * HOURS_IN_MS;
  const breachGraceMs = breachGraceHours * HOURS_IN_MS;

  const alerts = [];
  const escalations = [];

  const normalizedOrders = Array.isArray(orders) ? orders : [];
  normalizedOrders.forEach((order) => {
    if (!order) {
      return;
    }
    const status = String(order.status ?? '').toLowerCase();
    const isClosed = order.isClosed === true || ['completed', 'closed', 'cancelled'].includes(status);
    if (isClosed && !includeResolved) {
      return;
    }

    const dueAt = order.dueAt ? new Date(order.dueAt) : null;
    if (!dueAt || Number.isNaN(dueAt.getTime())) {
      return;
    }

    const dueMs = dueAt.getTime();
    const progress = toFiniteNumber(order.progressPercent ?? order.progress ?? 0, 0);
    const hoursUntilDue = Math.round((dueMs - nowMs) / HOURS_IN_MS);
    const hoursBreached = Math.round((nowMs - dueMs) / HOURS_IN_MS);

    let severity = null;
    if (dueMs + breachGraceMs < nowMs && !isClosed) {
      severity = 'breached';
    } else if (dueMs >= nowMs && dueMs - nowMs <= atRiskWindowMs && !isClosed) {
      severity = 'at_risk';
    }

    if (!severity) {
      return;
    }

    const alert = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      vendorName: order.vendorName,
      dueAt: dueAt.toISOString(),
      severity,
      status,
      progressPercent: progress,
      hoursUntilDue,
      hoursBreached,
    };

    alerts.push(alert);

    const alreadyEscalated = Boolean(order.metadata?.slaEscalatedAt);
    if (severity === 'breached' && !alreadyEscalated) {
      escalations.push({
        ...alert,
        triggeredAt: nowDate.toISOString(),
        order,
      });
    }
  });

  const breached = alerts.filter((alert) => alert.severity === 'breached').length;
  const atRisk = alerts.filter((alert) => alert.severity === 'at_risk').length;

  return {
    alerts,
    escalations,
    counts: {
      total: alerts.length,
      breached,
      atRisk,
    },
  };
}

export default {
  toFiniteNumber,
  normalizeDeliverables,
  buildGigClassesFromDeliverables,
  deriveOrderMetrics,
  evaluateSlaAlerts,
};
