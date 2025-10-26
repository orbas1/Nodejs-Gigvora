import {
  SystemStatusIncident,
  SystemStatusService,
} from '../models/index.js';

function mapService(serviceInstance) {
  if (!serviceInstance) {
    return null;
  }

  const plain =
    typeof serviceInstance.toPublicObject === 'function'
      ? serviceInstance.toPublicObject({ includeIncident: false })
      : serviceInstance;

  return {
    id: plain.id,
    name: plain.name,
    status: plain.status,
    impact: plain.impact ?? null,
    eta: plain.eta ?? null,
    confidence:
      plain.confidence == null || Number.isNaN(Number(plain.confidence))
        ? null
        : Number.parseFloat(plain.confidence),
    sortOrder: plain.sortOrder ?? 0,
  };
}

function mapIncident(incidentInstance) {
  if (!incidentInstance) {
    return null;
  }

  const plain =
    typeof incidentInstance.toPublicObject === 'function'
      ? incidentInstance.toPublicObject({ includeServices: true })
      : incidentInstance;

  const maintenanceWindow =
    plain.maintenanceSummary || plain.maintenanceStartsAt || plain.maintenanceEndsAt
      ? {
          summary: plain.maintenanceSummary ?? null,
          startsAt: plain.maintenanceStartsAt ?? null,
          endsAt: plain.maintenanceEndsAt ?? null,
          timezone: plain.maintenanceTimezone ?? null,
        }
      : null;

  const services = Array.isArray(plain.services) ? plain.services.map(mapService).filter(Boolean) : [];

  return {
    id: plain.id,
    reference: plain.reference ?? null,
    status: plain.status,
    headline: plain.headline,
    description: plain.description ?? null,
    maintenanceWindow,
    statusPageUrl: plain.statusPageUrl ?? null,
    updatedAt: plain.updatedAt ?? null,
    metadata: plain.metadata && typeof plain.metadata === 'object' ? plain.metadata : null,
    services,
  };
}

export async function getLatestSystemStatusIncident({ includeServices = true } = {}) {
  const include = includeServices
    ? [
        {
          model: SystemStatusService,
          as: 'services',
          separate: true,
          order: [
            ['sortOrder', 'ASC'],
            ['id', 'ASC'],
          ],
        },
      ]
    : [];

  const incident = await SystemStatusIncident.findOne({
    order: [
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ],
    include,
  });

  return mapIncident(incident);
}

export async function getSystemStatusIncidentByReference(reference, { includeServices = true } = {}) {
  if (!reference) {
    return null;
  }

  const include = includeServices
    ? [
        {
          model: SystemStatusService,
          as: 'services',
          separate: true,
          order: [
            ['sortOrder', 'ASC'],
            ['id', 'ASC'],
          ],
        },
      ]
    : [];

  const incident = await SystemStatusIncident.findOne({
    where: { reference },
    include,
    order: [
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });

  return mapIncident(incident);
}

export function serialiseSystemStatusIncident(incidentInstance) {
  return mapIncident(incidentInstance);
}

export default {
  getLatestSystemStatusIncident,
  getSystemStatusIncidentByReference,
  serialiseSystemStatusIncident,
};
