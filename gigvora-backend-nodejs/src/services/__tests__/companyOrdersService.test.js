import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const workflowModuleUrl = new URL('../projectGigManagementWorkflowService.js', import.meta.url);
const modelsModuleUrl = new URL('../../models/projectGigManagementModels.js', import.meta.url);
const atsSyncModuleUrl = new URL('../atsSyncService.js', import.meta.url);

const mockOverview = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDetail = jest.fn();
const mockAddTimelineEvent = jest.fn();
const mockUpdateTimelineEvent = jest.fn();
const mockCreateMessage = jest.fn();
const mockCreateEscrow = jest.fn();
const mockUpdateEscrow = jest.fn();

await jest.unstable_mockModule(workflowModuleUrl.pathname, () => ({
  __esModule: true,
  getProjectGigManagementOverview: mockOverview,
  createGigOrder: mockCreate,
  updateGigOrder: mockUpdate,
  getGigOrderDetail: mockDetail,
  addGigTimelineEvent: mockAddTimelineEvent,
  updateGigTimelineEvent: mockUpdateTimelineEvent,
  createGigOrderMessage: mockCreateMessage,
  createGigOrderEscrowCheckpoint: mockCreateEscrow,
  updateGigOrderEscrowCheckpoint: mockUpdateEscrow,
}));

const mockRecordMilestone = jest.fn();
await jest.unstable_mockModule(atsSyncModuleUrl.pathname, () => ({
  __esModule: true,
  recordOrderMilestoneSync: mockRecordMilestone,
}));

const mockGigOrderFindByPk = jest.fn();
const mockGigOrderUpdate = jest.fn();
const mockGigTimelineFindByPk = jest.fn();
const mockGigSubmissionFindByPk = jest.fn();

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({
  __esModule: true,
  GigOrder: { findByPk: mockGigOrderFindByPk, update: mockGigOrderUpdate },
  GigTimelineEvent: { findByPk: mockGigTimelineFindByPk },
  GigSubmission: { findByPk: mockGigSubmissionFindByPk },
}));

const serviceModule = await import('../companyOrdersService.js');

describe('companyOrdersService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-05T10:00:00Z'));
    jest.clearAllMocks();
    mockRecordMilestone.mockResolvedValue({ attempted: 1, successes: 1 });
    mockGigOrderFindByPk.mockResolvedValue({
      id: 44,
      ownerId: 7,
      status: 'requirements',
      metadata: { atsIntegration: {} },
      update: jest.fn().mockResolvedValue(),
    });
    mockGigOrderUpdate.mockResolvedValue([1]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('updates company orders and synchronises ATS milestones', async () => {
    mockUpdate.mockResolvedValue({
      id: 44,
      orderNumber: 'ORD-9',
      status: 'in_delivery',
      progressPercent: 55,
    });

    await serviceModule.updateCompanyOrder({
      ownerId: 7,
      orderId: 44,
      payload: { status: 'in_delivery', atsExternalId: 'ATS-42' },
      accessContext: { canManage: true, permissions: [] },
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      7,
      44,
      expect.objectContaining({
        status: 'in_delivery',
        atsExternalId: 'ATS-42',
        atsLastStatus: 'in_delivery',
        atsLastSyncedAt: expect.any(String),
      }),
    );
    expect(mockRecordMilestone).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: 7, orderId: 44, status: 'in_delivery' }),
    );
    expect(mockAddTimelineEvent).toHaveBeenCalledWith(
      7,
      44,
      expect.objectContaining({ eventType: 'milestone' }),
      expect.any(Object),
    );
  });

  it('escalates breached orders and stamps SLA metadata', async () => {
    mockOverview.mockResolvedValue({
      summary: {},
      purchasedGigs: {
        orders: [
          {
            id: 90,
            orderNumber: 'ORD-90',
            vendorName: 'Northwind',
            ownerId: 7,
            status: 'in_delivery',
            dueAt: '2025-01-01T12:00:00Z',
            metadata: {},
          },
        ],
      },
    });

    mockCreateMessage.mockResolvedValue({ id: 1 });

    await serviceModule.getCompanyOrdersDashboard({
      ownerId: 7,
      accessContext: { canManage: true, permissions: [] },
    });

    expect(mockGigOrderUpdate).toHaveBeenCalledWith(
      { slaEscalatedAt: expect.any(String), slaStatus: 'breached', metadata: expect.any(Object) },
      { where: { id: 90, ownerId: 7 } },
    );
  });
});
