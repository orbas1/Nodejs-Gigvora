import {
  sequelize,
  FeedbackPulseSnapshot,
  FeedbackPulseTheme,
  FeedbackPulseHighlight,
  SystemStatusIncident,
  SystemStatusService,
} from '../models/index.js';
import { serialiseSystemStatusIncident } from './systemStatusService.js';

function normaliseNumber(value) {
  if (value == null) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function mapTheme(themeInstance) {
  if (!themeInstance) {
    return null;
  }

  const plain =
    typeof themeInstance.toPublicObject === 'function'
      ? themeInstance.toPublicObject({ includeSnapshot: false })
      : themeInstance;

  return {
    id: plain.id,
    name: plain.name,
    score: normaliseNumber(plain.score),
    change: normaliseNumber(plain.change),
    position: plain.position ?? 0,
  };
}

function mapHighlight(highlightInstance) {
  if (!highlightInstance) {
    return null;
  }

  const plain =
    typeof highlightInstance.toPublicObject === 'function'
      ? highlightInstance.toPublicObject({ includeSnapshot: false })
      : highlightInstance;

  return {
    id: plain.id,
    quote: plain.quote,
    persona: plain.persona ?? null,
    team: plain.team ?? null,
    channel: plain.channel ?? null,
    sentiment: plain.sentiment ?? 'neutral',
    driver: plain.driver ?? null,
    submittedAt: plain.submittedAt ?? null,
  };
}

function mapSnapshot(snapshotInstance) {
  if (!snapshotInstance) {
    return null;
  }

  const plain =
    typeof snapshotInstance.toPublicObject === 'function'
      ? snapshotInstance.toPublicObject({ includeAssociations: true })
      : snapshotInstance;

  const themes = Array.isArray(plain.themes) ? plain.themes.map(mapTheme).filter(Boolean) : [];
  const highlights = Array.isArray(plain.highlights) ? plain.highlights.map(mapHighlight).filter(Boolean) : [];
  const systemStatus = plain.systemStatusIncident
    ? serialiseSystemStatusIncident({ ...plain.systemStatusIncident })
    : null;

  return {
    id: plain.id,
    reference: plain.reference ?? null,
    timeframe: plain.timeframe,
    overallScore: normaliseNumber(plain.overallScore) ?? 0,
    scoreChange: normaliseNumber(plain.scoreChange) ?? 0,
    responseRate: normaliseNumber(plain.responseRate) ?? 0,
    responseDelta: normaliseNumber(plain.responseDelta) ?? 0,
    sampleSize:
      plain.sampleSize == null || Number.isNaN(Number.parseInt(plain.sampleSize, 10))
        ? null
        : Number.parseInt(plain.sampleSize, 10),
    lastUpdated: plain.lastUpdated ?? plain.updatedAt ?? null,
    alerts: plain.alerts ?? {
      unresolved: plain.alertsUnresolved ?? 0,
      critical: plain.alertsCritical ?? 0,
      acknowledged: plain.alertsAcknowledged ?? 0,
    },
    themes,
    highlights,
    systemStatus,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

async function loadAvailableTimeframes() {
  const rows = await FeedbackPulseSnapshot.findAll({
    attributes: [[sequelize.fn('DISTINCT', sequelize.col('timeframe')), 'timeframe']],
    raw: true,
    order: [['timeframe', 'ASC']],
  });

  return rows
    .map((row) => row.timeframe)
    .filter((value) => typeof value === 'string' && value.trim().length > 0);
}

export async function getFeedbackPulseSnapshot({ timeframe, includeSystemStatus = true } = {}) {
  const requestedTimeframe = typeof timeframe === 'string' && timeframe.trim().length ? timeframe.trim() : null;

  const include = [
    {
      model: FeedbackPulseTheme,
      as: 'themes',
      separate: true,
      order: [
        ['position', 'ASC'],
        ['id', 'ASC'],
      ],
    },
    {
      model: FeedbackPulseHighlight,
      as: 'highlights',
      separate: true,
      order: [
        ['submittedAt', 'DESC'],
        ['id', 'DESC'],
      ],
    },
  ];

  if (includeSystemStatus) {
    include.push({
      model: SystemStatusIncident,
      as: 'systemStatusIncident',
      include: [
        {
          model: SystemStatusService,
          as: 'services',
          separate: true,
          order: [
            ['sortOrder', 'ASC'],
            ['id', 'ASC'],
          ],
        },
      ],
    });
  }

  const buildOptions = (timeframeFilter) => ({
    where: timeframeFilter ? { timeframe: timeframeFilter } : undefined,
    order: [
      ['lastUpdated', 'DESC'],
      ['id', 'DESC'],
    ],
    include,
  });

  let snapshot = await FeedbackPulseSnapshot.findOne(buildOptions(requestedTimeframe));

  if (!snapshot && requestedTimeframe) {
    snapshot = await FeedbackPulseSnapshot.findOne(buildOptions(null));
  }

  const availableTimeframes = await loadAvailableTimeframes();

  return {
    requestedTimeframe,
    timeframe: snapshot?.timeframe ?? null,
    availableTimeframes,
    snapshot: mapSnapshot(snapshot),
  };
}

export default {
  getFeedbackPulseSnapshot,
};
