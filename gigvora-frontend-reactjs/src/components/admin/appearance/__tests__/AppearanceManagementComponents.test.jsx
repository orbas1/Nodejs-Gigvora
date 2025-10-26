import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AssetLibrary from '../AssetLibrary.jsx';
import LayoutManager from '../LayoutManager.jsx';
import ThemeEditor from '../ThemeEditor.jsx';

const themes = [
  { id: 'theme-1', name: 'Slate', slug: 'slate', isDefault: true, tokens: { colors: {} } },
  { id: 'theme-2', name: 'Ocean', slug: 'ocean', isDefault: false, tokens: { colors: {} } },
];

const assets = [
  {
    id: 'asset-1',
    label: 'Logo',
    type: 'logo_light',
    status: 'active',
    url: 'https://cdn/logo.svg',
    allowedRoles: ['admin'],
  },
];

describe('admin appearance components', () => {
  let confirmSpy;

  beforeEach(() => {
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  it('creates and deletes assets via the asset library', async () => {
    const onCreateAsset = vi.fn().mockResolvedValue();
    const onDeleteAsset = vi.fn().mockResolvedValue();
    const onUpdateAsset = vi.fn().mockResolvedValue();
    const onNotify = vi.fn();

    render(
      <AssetLibrary
        assets={assets}
        themes={themes}
        onCreateAsset={onCreateAsset}
        onUpdateAsset={onUpdateAsset}
        onDeleteAsset={onDeleteAsset}
        onNotify={onNotify}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Upload/i }));

    const modal = await screen.findByRole('dialog');
    const modalUtils = within(modal);

    fireEvent.change(modalUtils.getByLabelText(/Label/i), { target: { value: 'Hero image' } });
    fireEvent.change(modalUtils.getByLabelText(/Type/i), { target: { value: 'hero' } });
    fireEvent.change(modalUtils.getByLabelText(/Theme/i), { target: { value: 'theme-1' } });
    fireEvent.change(modalUtils.getByLabelText(/Status/i), { target: { value: 'active' } });
    fireEvent.change(modalUtils.getByLabelText(/Image URL/i), { target: { value: 'https://cdn/hero.jpg' } });
    fireEvent.change(modalUtils.getByLabelText(/Alt text/i), { target: { value: 'Homepage hero' } });

    fireEvent.click(modalUtils.getByRole('button', { name: /Save/i }));

    await waitFor(() => expect(onCreateAsset).toHaveBeenCalled());
    expect(onNotify).toHaveBeenCalledWith('Asset added', 'success');

    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
    await waitFor(() => expect(onDeleteAsset).toHaveBeenCalledWith('asset-1'));
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith('Asset removed', 'success'));
  });

  it('walks the layout wizard and publishes a layout', async () => {
    const onCreateLayout = vi.fn().mockResolvedValue();
    const onUpdateLayout = vi.fn();
    const onPublishLayout = vi.fn().mockResolvedValue();
    const onDeleteLayout = vi.fn().mockResolvedValue();
    const onNotify = vi.fn();

    const layouts = [
      {
        id: 'layout-1',
        name: 'Dashboard default',
        slug: 'dashboard-default',
        page: 'dashboard',
        status: 'draft',
        version: 1,
        theme: themes[0],
      },
    ];

    render(
      <LayoutManager
        layouts={layouts}
        themes={themes}
        onCreateLayout={onCreateLayout}
        onUpdateLayout={onUpdateLayout}
        onPublishLayout={onPublishLayout}
        onDeleteLayout={onDeleteLayout}
        onNotify={onNotify}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^New$/i }));

    const modal = await screen.findByRole('dialog');
    const modalUtils = within(modal);

    fireEvent.change(modalUtils.getByLabelText(/Name/i), { target: { value: 'Marketing hero' } });
    fireEvent.change(modalUtils.getByLabelText(/^Key$/i), { target: { value: 'marketing-hero' } });

    fireEvent.click(modalUtils.getByRole('button', { name: /Next/i }));

    fireEvent.click(modalUtils.getByRole('button', { name: /Save/i }));

    await waitFor(() => expect(onCreateLayout).toHaveBeenCalled());
    expect(onNotify).toHaveBeenCalledWith('Layout created', 'success');

    fireEvent.click(screen.getByRole('button', { name: /Publish/i }));

    await waitFor(() => expect(onPublishLayout).toHaveBeenCalledWith('layout-1', expect.any(Object)));
    expect(onNotify).toHaveBeenCalledWith('Layout published', 'success');
  });

  it('creates, activates, and deletes themes', async () => {
    const onCreateTheme = vi.fn().mockResolvedValue();
    const onUpdateTheme = vi.fn();
    const onActivateTheme = vi.fn().mockResolvedValue();
    const onDeleteTheme = vi.fn().mockResolvedValue();
    const onNotify = vi.fn();

    render(
      <ThemeEditor
        themes={themes}
        onCreateTheme={onCreateTheme}
        onUpdateTheme={onUpdateTheme}
        onActivateTheme={onActivateTheme}
        onDeleteTheme={onDeleteTheme}
        onNotify={onNotify}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^New$/i }));

    const modal = await screen.findByRole('dialog');
    const modalUtils = within(modal);

    fireEvent.change(modalUtils.getByLabelText(/Name/i), { target: { value: 'Aurora' } });
    fireEvent.change(modalUtils.getByLabelText(/Key/i), { target: { value: 'aurora' } });

    fireEvent.click(modalUtils.getByRole('button', { name: /Save/i }));

    await waitFor(() => expect(onCreateTheme).toHaveBeenCalled());
    expect(onNotify).toHaveBeenCalledWith('Theme created', 'success');

    const liveButton = screen
      .getAllByRole('button', { name: /^Live$/i })
      .find((button) => !button.disabled);
    expect(liveButton).toBeDefined();
    fireEvent.click(liveButton);
    await waitFor(() => expect(onActivateTheme).toHaveBeenCalledWith('theme-2'));
    expect(onNotify).toHaveBeenCalledWith('Theme made live', 'success');

    const deleteButton = screen.getByRole('button', { name: /Delete theme Ocean/i });
    fireEvent.click(deleteButton);
    await waitFor(() => expect(onDeleteTheme).toHaveBeenCalledWith('theme-2'));
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith('Theme removed', 'success'));
  });
});
