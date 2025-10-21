import { getAdDashboardSnapshot, listPlacements, getPlacementsForSurface } from '../services/adService.js';

function parseSurfaces(req) {
  const { surface, surfaces } = req.query ?? {};
  let resolved = [];
  if (Array.isArray(surfaces)) {
    resolved = surfaces.flatMap((value) => `${value}`.split(',').map((part) => part.trim()));
  } else if (typeof surfaces === 'string') {
    resolved = surfaces.split(',').map((value) => value.trim());
  } else if (surface) {
    resolved = `${surface}`
      .split(',')
      .map((value) => value.trim());
  }

  const unique = [];
  const seen = new Set();
  resolved
    .filter(Boolean)
    .forEach((entry) => {
      const key = entry.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(entry);
      }
    });

  return unique;
}

function parseContext(req) {
  const { context } = req.query ?? {};
  if (!context) {
    return undefined;
  }
  if (typeof context === 'object') {
    return context;
  }
  try {
    const parsed = JSON.parse(context);
    return parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch (error) {
    return undefined;
  }
}

function parseDate(value) {
  if (!value) {
    return new Date();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

export async function dashboard(req, res) {
  const surfaces = parseSurfaces(req);
  const context = parseContext(req) ?? {};
  const bypassCache = `${req.query?.bypassCache ?? ''}`.toLowerCase() === 'true';
  const result = await getAdDashboardSnapshot({ surfaces, context, bypassCache });
  res.json(result);
}

export async function placements(req, res) {
  const surfaces = parseSurfaces(req);
  const status = req.query?.status ?? undefined;
  const now = parseDate(req.query?.now);

  if (surfaces.length === 1) {
    const [surface] = surfaces;
    const result = await getPlacementsForSurface(surface, { status, now });
    res.json({ surface, placements: result });
    return;
  }

  const result = await listPlacements({ surfaces, status, now });
  res.json({ placements: result });
}

export default {
  dashboard,
  placements,
};
