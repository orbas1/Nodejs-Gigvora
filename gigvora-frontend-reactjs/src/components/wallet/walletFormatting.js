export function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

export function formatCompactCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    return formatCurrency(amount, currency);
  }
}

export function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  } catch (error) {
    return String(value);
  }
}

export function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return String(value);
  }
}

export function statusTone(status) {
  const normalized = String(status ?? '').toLowerCase();
  if (['active', 'ready', 'settled', 'approved', 'ok', 'app_store_ready'].includes(normalized)) {
    return 'positive';
  }
  if (['pending', 'scheduled', 'processing', 'review', 'app_store_review'].includes(normalized)) {
    return 'info';
  }
  if (['inactive', 'disabled', 'archived', 'expired'].includes(normalized)) {
    return 'neutral';
  }
  if (['failed', 'error', 'declined', 'blocked', 'critical'].includes(normalized)) {
    return 'negative';
  }
  return 'warning';
}

export function formatStatus(value) {
  if (!value) {
    return '—';
  }
  return String(value)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
