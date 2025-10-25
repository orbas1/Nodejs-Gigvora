function normaliseWindow(window = {}) {
  const start = window.start ? new Date(window.start) : new Date();
  const end = window.end ? new Date(window.end) : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1_000);
  return { start, end };
}

function clampToWindow(slot, window) {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  if (end <= window.start || start >= window.end) {
    return null;
  }
  return {
    start: new Date(Math.max(start.getTime(), window.start.getTime())),
    end: new Date(Math.min(end.getTime(), window.end.getTime())),
    title: slot.title ?? null,
  };
}

function parseIcsBusy(icsString) {
  if (typeof icsString !== 'string' || !icsString.trim()) {
    return [];
  }
  const lines = icsString.split(/\r?\n/);
  const windows = [];
  let current = null;
  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (line === 'BEGIN:VEVENT') {
      current = {};
    } else if (line === 'END:VEVENT' && current?.DTSTART && current?.DTEND) {
      windows.push({ start: current.DTSTART, end: current.DTEND, title: current.SUMMARY ?? null });
      current = null;
    } else if (current) {
      const [key, value] = line.split(':');
      if (key && value) {
        current[key.toUpperCase()] = value;
      }
    }
  });
  return windows
    .map((window) => {
      const normalise = (value) => {
        if (!value) return null;
        const normalized = value.endsWith('Z') ? value : `${value}Z`;
        return new Date(
          normalized.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'),
        );
      };
      const start = normalise(window.DTSTART ?? window.start);
      const end = normalise(window.DTEND ?? window.end);
      if (!start || !end) {
        return null;
      }
      return { start, end, title: window.SUMMARY ?? window.title ?? null };
    })
    .filter(Boolean);
}

function extractBusyWindows(integration, window) {
  const metadata = integration.metadata ?? {};
  if (Array.isArray(metadata.busyWindows)) {
    return metadata.busyWindows.map((slot) => ({
      start: slot.start,
      end: slot.end,
      title: slot.title ?? null,
    }));
  }
  if (integration.provider === 'ics' && typeof metadata.ics === 'string') {
    return parseIcsBusy(metadata.ics);
  }
  if (Array.isArray(metadata.recurringSlots)) {
    return metadata.recurringSlots.map((slot) => ({
      start: slot.start,
      end: slot.end,
      title: slot.title ?? null,
    }));
  }
  return [];
}

export async function fetchAvailabilityForIntegration({ integration, window }) {
  const range = normaliseWindow(window);
  const busySlots = extractBusyWindows(integration, range);
  return busySlots
    .map((slot) => clampToWindow(slot, range))
    .filter(Boolean);
}

export default {
  fetchAvailabilityForIntegration,
};

