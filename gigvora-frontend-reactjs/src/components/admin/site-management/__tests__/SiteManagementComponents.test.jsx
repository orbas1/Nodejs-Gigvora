import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SiteNavigationManager from '../SiteNavigationManager.jsx';
import SitePageEditorDrawer from '../SitePageEditorDrawer.jsx';
import SitePagesTable from '../SitePagesTable.jsx';
import SiteSettingsForm from '../SiteSettingsForm.jsx';

beforeAll(() => {
  vi.spyOn(window, 'confirm').mockImplementation(() => true);
});

afterAll(() => {
  window.confirm.mockRestore();
});

async function findDrawerForm(headingText) {
  const heading = await screen.findByRole('heading', { name: headingText });
  const form = heading.closest('form');
  expect(form).not.toBeNull();
  return form;
}

async function actAndAwait(callback) {
  await act(async () => {
    await callback();
  });
}

describe('SiteNavigationManager', () => {
  it('creates, updates, and deletes links', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    const navigation = [
      { id: '1', menuKey: 'primary', label: 'Home', url: 'https://gigvora.com/' },
    ];

    render(
      <SiteNavigationManager
        navigation={navigation}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    await actAndAwait(() => user.click(screen.getByRole('button', { name: 'Add link' })));
    const createDialog = await findDrawerForm('New link');

    const createLabelInput = within(createDialog).getByLabelText('Label');
    await actAndAwait(() => user.clear(createLabelInput));
    await actAndAwait(() => user.type(createLabelInput, 'Docs'));
    const createUrlInput = within(createDialog).getByLabelText('URL');
    await actAndAwait(() => user.clear(createUrlInput));
    await actAndAwait(() => user.type(createUrlInput, 'https://docs.gigvora.com'));

    await actAndAwait(() => user.click(within(createDialog).getByRole('button', { name: 'Save link' })));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Docs', url: 'https://docs.gigvora.com' }),
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'New link' })).not.toBeInTheDocument();
    });

    const homeItem = screen.getByText('Home').closest('li');
    expect(homeItem).not.toBeNull();

    await actAndAwait(() => user.click(within(homeItem).getByRole('button', { name: 'Edit' })));
    const editDialog = await findDrawerForm('Edit link');
    const editLabelInput = within(editDialog).getByLabelText('Label');
    await actAndAwait(() => user.clear(editLabelInput));
    await actAndAwait(() => user.type(editLabelInput, 'Homepage'));
    await actAndAwait(() => user.click(within(editDialog).getByRole('button', { name: 'Save link' })));

    await waitFor(() => {
      expect(onUpdate.mock.calls.length).toBeGreaterThan(0);
    });
    const updateCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1];
    expect(updateCall[0]).toBeTruthy();
    expect(updateCall[1]).toEqual(expect.objectContaining({ label: 'Homepage' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Edit link' })).not.toBeInTheDocument();
    });

    await actAndAwait(() => user.click(within(homeItem).getByRole('button', { name: 'Remove' })));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('1');
    });
  });
});

describe('SitePageEditorDrawer', () => {
  it('normalises features and allowed roles on save', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <SitePageEditorDrawer
        open
        mode="edit"
        page={{
          id: 'pg1',
          title: 'Growth',
          slug: 'growth',
          featureHighlights: ['Speed'],
          allowedRoles: ['marketing'],
        }}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );

    const drawer = await findDrawerForm('Edit landing page');
    const highlightsInput = within(drawer).getByRole('textbox', { name: /Feature highlights/i });
    await actAndAwait(() => user.clear(highlightsInput));
    await actAndAwait(() => user.type(highlightsInput, 'Fast onboarding'));
    const rolesInput = within(drawer).getByRole('textbox', { name: /Allowed roles/i });
    await actAndAwait(() => user.clear(rolesInput));
    await actAndAwait(() => user.type(rolesInput, 'admin, marketing'));

    await actAndAwait(() => user.click(within(drawer).getByRole('button', { name: 'Save page' })));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          featureHighlights: ['Fast onboarding'],
          allowedRoles: ['admin', 'marketing'],
        }),
      );
    });
  });
});

describe('SitePagesTable', () => {
  it('emits actions for rows', async () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onPreview = vi.fn();
    const user = userEvent.setup();

    const pages = [
      {
        id: 'pg1',
        title: 'Growth',
        slug: 'growth',
        status: 'published',
        updatedAt: '2024-04-01T00:00:00.000Z',
      },
    ];

    render(
      <SitePagesTable
        pages={pages}
        stats={{ published: 1, draft: 0 }}
        onCreateClick={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
        onPreview={onPreview}
      />,
    );

    await actAndAwait(() => user.click(screen.getByRole('button', { name: 'New page' })));
    expect(onCreate).toHaveBeenCalled();

    await actAndAwait(() => user.click(screen.getByRole('button', { name: 'Edit' })));
    expect(onEdit).toHaveBeenCalledWith(pages[0]);

    await actAndAwait(() => user.click(screen.getByRole('button', { name: 'Delete' })));
    expect(onDelete).toHaveBeenCalledWith(pages[0]);

    await actAndAwait(() => user.click(screen.getByRole('button', { name: 'Preview' })));
    expect(onPreview).toHaveBeenCalledWith(pages[0]);
  });
});

describe('SiteSettingsForm', () => {
  it('propagates field, footer, and action changes', async () => {
    const onChange = vi.fn();
    const onSave = vi.fn();
    const onReset = vi.fn();
    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(
      <SiteSettingsForm
        value={{
          siteName: 'Gigvora',
          footer: {
            links: [
              { id: '1', label: 'Docs', url: 'https://docs.gigvora.com', orderIndex: 0 },
            ],
          },
        }}
        dirty
        onChange={onChange}
        onSave={onSave}
        onReset={onReset}
        onRefresh={onRefresh}
      />,
    );

    const siteNameInput = screen.getByLabelText('Site name');
    await actAndAwait(() => user.clear(siteNameInput));
    await actAndAwait(() => user.type(siteNameInput, 'Gigvora HQ'));

    await actAndAwait(() => user.click(screen.getByRole('button', { name: 'Footer' })));

    const footerLabelInput = screen.getByLabelText('Label');
    await actAndAwait(() => user.clear(footerLabelInput));
    await actAndAwait(() => user.type(footerLabelInput, 'Support'));

    expect(onChange).toHaveBeenCalled();

    const previousCalls = onChange.mock.calls.length;
    await actAndAwait(() => user.click(screen.getByRole('button', { name: 'Add' })));

    await waitFor(() => {
      expect(onChange.mock.calls.length).toBeGreaterThan(previousCalls);
    });

    const latestCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(latestCall[0]).toEqual(['footer', 'links']);
    expect(Array.isArray(latestCall[1])).toBe(true);
    expect(latestCall[1]).toHaveLength(2);

    await actAndAwait(() => user.click(screen.getByRole('button', { name: 'Save' })));
    expect(onSave).toHaveBeenCalled();
  });
});
