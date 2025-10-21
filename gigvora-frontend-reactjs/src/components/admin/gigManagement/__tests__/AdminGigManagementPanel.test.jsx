import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminGigManagementPanel from '../AdminGigManagementPanel.jsx';
import useProjectGigManagement from '../../../../hooks/useProjectGigManagement.js';

vi.mock('../../../../hooks/useProjectGigManagement.js');

describe('AdminGigManagementPanel', () => {
  const setupMock = (overrides = {}) => {
    const actions = {
      updateWorkspace: vi.fn().mockResolvedValue(),
      createProject: vi.fn().mockResolvedValue(),
      createGigOrder: vi.fn().mockResolvedValue(),
      updateGigOrder: vi.fn().mockResolvedValue(),
      addAsset: vi.fn().mockResolvedValue(),
    };

    useProjectGigManagement.mockReturnValue({
      data: {
        access: { canManage: true },
        summary: {
          totalProjects: 4,
          activeProjects: 2,
          budgetInPlay: 250000,
          gigsInDelivery: 3,
          assetsSecured: 8,
        },
        summaryUpdatedAt: '2024-07-02T12:00:00Z',
        fromCache: false,
        board: {
          lanes: [
            { status: 'planning', projects: [{ id: 1, title: 'Kickoff' }] },
          ],
          metrics: { averageProgress: 55, atRisk: 1, completed: 2 },
        },
        projects: [
          {
            id: 1,
            title: 'Gig Launch',
            workspace: {
              status: 'in_progress',
              riskLevel: 'medium',
              progressPercent: 65,
              nextMilestone: 'Kickoff call',
              nextMilestoneDueAt: '2024-07-20',
            },
          },
        ],
        purchasedGigs: {
          orders: [
            {
              id: 5,
              orderNumber: 'ORD-5',
              vendorName: 'Studio X',
              status: 'in_delivery',
              progressPercent: 45,
              dueAt: '2024-07-25',
              amount: 12000,
              currency: 'USD',
            },
          ],
          stats: { totalOrders: 5, active: 2, completed: 3, averageProgress: 60 },
          reminders: [
            {
              type: 'delivery_due',
              orderId: 5,
              orderNumber: 'ORD-5',
              dueAt: '2024-07-25',
              status: 'pending',
            },
          ],
        },
        assets: {
          items: [
            {
              id: 'asset-1',
              projectId: 1,
              label: 'Brand deck',
              category: 'Design',
              storageUrl: 'https://example.com/deck.pdf',
              permissionLevel: 'restricted',
              sizeBytes: 2048,
            },
          ],
          summary: {
            total: 8,
            restricted: 2,
            watermarkCoverage: 80,
            storageBytes: 1024 * 1024,
          },
          brandAssets: [
            { id: 'kit', label: 'Brand kit', category: 'Logo', storageUrl: 'https://example.com/kit.zip' },
          ],
        },
        templates: [
          {
            id: 'tmpl-1',
            name: 'Launch playbook',
            category: 'Marketing',
            summary: 'End-to-end launch readiness plan.',
            durationWeeks: 6,
            recommendedBudgetMin: 5000,
            recommendedBudgetMax: 15000,
            toolkit: ['Slack', 'Figma'],
          },
        ],
        storytelling: {
          achievements: [
            { title: '100 interviews', bullet: 'Secured 100 candidate interviews this quarter', type: 'metric' },
          ],
          quickExports: { digest: ['3 active projects', '2 due this week'] },
        },
        ...overrides.data,
      },
      loading: false,
      error: null,
      actions: { ...actions, ...(overrides.actions ?? {}) },
      reload: vi.fn(),
    });

    return { actions };
  };

  it('navigates sections and opens drawers', async () => {
    const user = userEvent.setup();
    const { actions } = setupMock();

    render(<AdminGigManagementPanel userId={42} />);

    expect(await screen.findByText(/board/i)).toBeInTheDocument();
    expect(screen.getByText(/250,000/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /^projects$/i })[0]);
    await user.click(screen.getByRole('button', { name: /new/i }));
    expect(await screen.findByRole('dialog', { name: /new project/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await user.click(screen.getByText('Gig Launch'));
    expect(await screen.findByRole('dialog', { name: /gig launch/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(actions.updateWorkspace).toHaveBeenCalled());

    await user.click(screen.getAllByRole('button', { name: /^orders$/i })[0]);
    await user.click(screen.getByRole('button', { name: /new/i }));
    expect(await screen.findByRole('heading', { name: /new order/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await user.click(screen.getByText(/ord-5/i));
    expect(await screen.findByRole('dialog', { name: /ord-5/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close/i }));

    await user.click(screen.getAllByRole('button', { name: /^assets$/i })[0]);
    const assetsSection = screen.getByText(/workspace files/i).closest('section');
    expect(assetsSection).not.toBeNull();
    await user.click(within(assetsSection).getByRole('button', { name: /^add$/i }));
    expect(await screen.findByRole('heading', { name: /add asset/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await user.click(screen.getAllByRole('button', { name: /^templates$/i })[0]);
    await user.click(screen.getByRole('button', { name: /^use$/i }));
    expect(await screen.findByRole('heading', { name: /new order/i })).toBeInTheDocument();
  });
});
