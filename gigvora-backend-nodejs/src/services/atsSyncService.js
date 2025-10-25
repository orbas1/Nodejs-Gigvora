import { Op } from 'sequelize';
import {
  sequelize,
  ProviderWorkspace,
  WorkspaceIntegration,
  WorkspaceIntegrationSyncRun,
} from '../models/index.js';

const CONNECTED_STATUS = 'connected';
const ATS_CATEGORY = 'ats';

function computeNextSyncAt(frequency, fromDate = new Date()) {
  const base = fromDate instanceof Date ? fromDate : new Date();
  if (Number.isNaN(base.getTime())) {
    return null;
  }
  switch (frequency) {
    case 'hourly':
      return new Date(base.getTime() + 60 * 60 * 1000);
    case 'daily':
      return new Date(base.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

async function resolveWorkspaceIdsForOwner(ownerId) {
  const numericOwnerId = Number(ownerId);
  if (!Number.isInteger(numericOwnerId) || numericOwnerId <= 0) {
    return [];
  }

  const workspaces = await ProviderWorkspace.findAll({
    where: { ownerId: numericOwnerId },
    attributes: ['id'],
    order: [['id', 'ASC']],
  });

  return workspaces.map((workspace) => workspace.id);
}

export async function recordOrderMilestoneSync({
  ownerId,
  orderId,
  orderNumber = null,
  status,
  previousStatus = null,
  actorId = null,
  metadata = {},
}) {
  const workspaceIds = await resolveWorkspaceIdsForOwner(ownerId);
  if (!workspaceIds.length) {
    return { attempted: 0, successes: 0 };
  }

  const integrations = await WorkspaceIntegration.findAll({
    where: {
      workspaceId: { [Op.in]: workspaceIds },
      category: ATS_CATEGORY,
      status: CONNECTED_STATUS,
    },
    order: [['id', 'ASC']],
  });

  if (!integrations.length) {
    return { attempted: 0, successes: 0 };
  }

  let successes = 0;
  await sequelize.transaction(async (transaction) => {
    for (const integration of integrations) {
      const startedAt = new Date();
      const finishedAt = new Date();

      await WorkspaceIntegrationSyncRun.create(
        {
          integrationId: integration.id,
          status: 'success',
          trigger: 'company_order_status',
          triggeredById: actorId ?? null,
          startedAt,
          finishedAt,
          recordsProcessed: 1,
          notes: `Order ${orderNumber ?? orderId} advanced to ${status}.`,
          metadata: {
            orderId,
            orderNumber: orderNumber ?? null,
            status,
            previousStatus: previousStatus ?? null,
            ...metadata,
          },
        },
        { transaction },
      );

      await integration.update(
        {
          lastSyncedAt: finishedAt,
          lastSyncStatus: 'success',
          status: CONNECTED_STATUS,
          nextSyncAt: computeNextSyncAt(integration.syncFrequency, finishedAt),
        },
        { transaction },
      );

      successes += 1;
    }
  });

  return { attempted: integrations.length, successes };
}

export default { recordOrderMilestoneSync };
