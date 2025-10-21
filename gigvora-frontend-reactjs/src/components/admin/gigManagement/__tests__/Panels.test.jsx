import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectsPanel from '../ProjectsPanel.jsx';
import GigOrdersPanel from '../GigOrdersPanel.jsx';
import AssetsPanel from '../AssetsPanel.jsx';
import TemplatesPanel from '../TemplatesPanel.jsx';
import WorkspaceShell from '../WorkspaceShell.jsx';
import WorkspaceOverview from '../WorkspaceOverview.jsx';

describe('Gig management panels', () => {
  it('invokes project callbacks', async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn();
    const handleSelect = vi.fn();

    render(
      <ProjectsPanel
        projects={[
          {
            id: 1,
            title: 'Launch plan',
            workspace: {
              status: 'in_progress',
              riskLevel: 'medium',
              progressPercent: 45,
              nextMilestone: 'QA review',
              nextMilestoneDueAt: '2024-07-15',
            },
          },
        ]}
        board={{ lanes: [], metrics: {} }}
        canManage
        onCreate={handleCreate}
        onSelect={handleSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: /new/i }));
    expect(handleCreate).toHaveBeenCalled();

    await user.click(screen.getByText(/launch plan/i));
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it('filters orders by status and emits selection', async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn();
    const handleSelect = vi.fn();

    render(
      <GigOrdersPanel
        orders={[
          { id: 1, orderNumber: 'ORD-1', vendorName: 'Vendor A', status: 'in_delivery', progressPercent: 50, dueAt: null, amount: 1000, currency: 'USD' },
          { id: 2, orderNumber: 'ORD-2', vendorName: 'Vendor B', status: 'completed', progressPercent: 100, dueAt: null, amount: 2000, currency: 'USD' },
        ]}
        reminders={[{ type: 'delivery_due', orderId: 1 }]}
        stats={{ totalOrders: 2, active: 1, completed: 1 }}
        canManage
        onCreate={handleCreate}
        onSelect={handleSelect}
      />,
    );

    expect(screen.getByText(/ord-1/i)).toBeInTheDocument();
    expect(screen.queryByText(/ord-2/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /all/i }));
    expect(screen.getByText(/ord-2/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /new/i }));
    expect(handleCreate).toHaveBeenCalled();

    await user.click(screen.getByText(/ord-1/i));
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it('provides asset stats and add control', async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();

    render(
      <AssetsPanel
        assets={{
          items: [],
          summary: { total: 0, restricted: 0, watermarkCoverage: 0, storageBytes: 0 },
          brandAssets: [],
        }}
        projects={[]}
        canManage
        onAdd={handleAdd}
      />,
    );

    expect(screen.getByText(/no workspace assets/i)).toBeInTheDocument();
    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeDisabled();
  });

  it('renders templates and handles use action', async () => {
    const user = userEvent.setup();
    const handleUse = vi.fn();

    render(
      <TemplatesPanel
        templates={[{ id: 't1', name: 'Launch playbook', category: 'Marketing', summary: 'Plan', durationWeeks: 6, recommendedBudgetMin: 1000, recommendedBudgetMax: 5000 }]}
        onUse={handleUse}
      />,
    );

    await user.click(screen.getByRole('button', { name: /use/i }));
    expect(handleUse).toHaveBeenCalledWith(expect.objectContaining({ id: 't1' }));
  });

  it('switches workspace shell sections', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <WorkspaceShell
        sections={[
          { id: 'overview', label: 'Overview' },
          { id: 'projects', label: 'Projects' },
        ]}
        activeSection="overview"
        onSectionChange={handleChange}
      >
        <p>Content</p>
      </WorkspaceShell>,
    );

    const desktopNavButton = screen
      .getAllByRole('button', { name: /^projects$/i })
      .find((button) => button.parentElement?.className?.includes('sm:flex'));

    expect(desktopNavButton).toBeDefined();
    await user.click(desktopNavButton);
    expect(handleChange).toHaveBeenCalledWith('projects');
  });

  it('displays overview metrics and storytelling', () => {
    render(
      <WorkspaceOverview
        summary={{ totalProjects: 3, activeProjects: 2, budgetInPlay: 150000, gigsInDelivery: 4, assetsSecured: 6 }}
        boardMetrics={{ averageProgress: 60, atRisk: 1, completed: 2 }}
        vendorStats={{ totalOrders: 6, active: 3, completed: 3, averageProgress: 55 }}
        reminders={[]}
        storytelling={{ achievements: [{ title: 'Milestone hit', bullet: 'First enterprise launch', type: 'highlight' }], quickExports: { digest: ['3 shipped', '1 blocked'] } }}
      />,
    );

    expect(screen.getByText(/150,000/i)).toBeInTheDocument();
    expect(screen.getByText(/milestone hit/i)).toBeInTheDocument();
  });
});
