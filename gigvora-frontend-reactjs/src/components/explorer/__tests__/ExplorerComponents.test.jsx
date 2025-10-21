import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ExplorerFilterDrawer from '../ExplorerFilterDrawer.jsx';
import ExplorerManagementPanel from '../ExplorerManagementPanel.jsx';
import { act } from 'react';

vi.mock('@headlessui/react', () => {
  const renderChild = (child) => (typeof child === 'function' ? child({}) : child);
  const Dialog = ({ children }) => <div>{children}</div>;
  Dialog.Panel = ({ children }) => <div>{children}</div>;
  Dialog.Title = ({ children }) => <div>{children}</div>;
  Dialog.Description = ({ children }) => <div>{children}</div>;
  const Transition = ({ children }) => <>{renderChild(children)}</>;
  Transition.Root = ({ children }) => <>{renderChild(children)}</>;
  Transition.Child = ({ children }) => <>{renderChild(children)}</>;
  return { Dialog, Transition };
});

vi.mock('../../../services/explorerData.js', () => {
  const fetchExplorerRecords = vi.fn(async () => ({
    items: [
      {
        id: 'rec-1',
        title: 'Senior Product Designer',
        summary: 'Lead complex experience overhauls.',
        status: 'draft',
        location: 'Remote',
        employmentType: 'Full-time',
      },
    ],
  }));
  const createExplorerRecord = vi.fn(async () => ({ id: 'rec-2' }));
  const updateExplorerRecord = vi.fn(async () => ({}));
  const deleteExplorerRecord = vi.fn(async () => ({}));
  return {
    fetchExplorerRecords,
    createExplorerRecord,
    updateExplorerRecord,
    deleteExplorerRecord,
  };
});

vi.mock('../DataStatus.jsx', () => ({
  default: ({ items, children, emptyMessage }) => (items?.length ? children : <div>{emptyMessage}</div>),
}));

const { fetchExplorerRecords, createExplorerRecord, deleteExplorerRecord } = await import('../../../services/explorerData.js');

describe('Explorer components', () => {
  it('applies and resets filters in drawer', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onReset = vi.fn();

    render(
      <ExplorerFilterDrawer
        category="jobs"
        isOpen
        onClose={vi.fn()}
        filters={{ employmentTypes: ['Full-time'], updatedWithin: '7d', isRemote: true }}
        facets={{
          employmentType: { 'Full-time': 12, Contract: 4 },
          durationCategory: { short_term: 3 },
          geoCity: { London: 5 },
        }}
        onApply={onApply}
        onReset={onReset}
      />,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /contract/i }));
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /on-site/i }));
    });
    await act(async () => {
      await user.click(screen.getByLabelText(/last 90 days/i));
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /apply filters/i }));
    });

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        employmentTypes: expect.arrayContaining(['Full-time', 'Contract']),
        isRemote: false,
        updatedWithin: '90d',
      }),
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /reset/i }));
    });
    expect(onReset).toHaveBeenCalled();
  });

  it('loads and manages explorer records', async () => {
    const user = userEvent.setup();
    const onMutate = vi.fn();

    render(
      <MemoryRouter>
        <ExplorerManagementPanel
          category="jobs"
          categoryLabel="Jobs"
          isOpen
          onClose={vi.fn()}
          onMutate={onMutate}
        />
      </MemoryRouter>,
    );

    await waitFor(() => expect(fetchExplorerRecords).toHaveBeenCalledWith('jobs', expect.any(Object)));
    await act(async () => {
      await fetchExplorerRecords.mock.results[0].value;
    });
    // ensure data load flushes before mutating
    const recordHeading = await screen.findByText(/senior product designer/i);
    const recordCard = recordHeading.closest('article');
    expect(recordCard).not.toBeNull();
    const deleteControl = within(recordCard).getByRole('button', { name: /delete/i });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /new job/i }));
    });

    await act(async () => {
      await user.type(screen.getByLabelText(/title/i), 'Growth Lead');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(/^status$/i), 'draft');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(/summary/i), 'Drive expansion initiatives.');
    });
    await act(async () => {
      await user.type(screen.getByLabelText(/^description$/i), 'Partner with squads to deliver growth.');
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /create record/i }));
    });

    await waitFor(() => expect(createExplorerRecord).toHaveBeenCalled());
    expect(onMutate).toHaveBeenCalled();

    await act(async () => {
      await user.click(deleteControl);
    });
    await waitFor(() => expect(deleteExplorerRecord).toHaveBeenCalledWith('jobs', 'rec-1'));
  });
});
