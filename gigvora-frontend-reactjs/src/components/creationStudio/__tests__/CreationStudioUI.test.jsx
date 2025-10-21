import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import CreationStudioItemList from '../CreationStudioItemList.jsx';
import CreationStudioSummary from '../CreationStudioSummary.jsx';
import TypeGallery from '../panels/TypeGallery.jsx';
import ItemShelf from '../panels/ItemShelf.jsx';
import PreviewDrawer from '../panels/PreviewDrawer.jsx';
import ChipInput from '../wizard/components/ChipInput.jsx';
import DocumentOutlineEditor from '../wizard/components/DocumentOutlineEditor.jsx';
import FaqList from '../wizard/components/FaqList.jsx';
import PackageTierForm from '../wizard/components/PackageTierForm.jsx';
import AccessStep from '../wizard/steps/AccessStep.jsx';
import DetailsStep from '../wizard/steps/DetailsStep.jsx';
import MediaStep from '../wizard/steps/MediaStep.jsx';
import OverviewStep from '../wizard/steps/OverviewStep.jsx';
import StudioLayout from '../layout/StudioLayout.jsx';

describe('Creation Studio UI building blocks', () => {
  it('renders an archive list with actions', async () => {
    const onSelectItem = vi.fn();
    const onArchiveItem = vi.fn();
    const items = [
      {
        id: 'draft-1',
        title: 'Launch blueprint',
        type: 'gig',
        status: 'draft',
        visibility: 'public',
        updatedAt: '2024-07-01T00:00:00.000Z',
      },
    ];

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreationStudioItemList
          items={items}
          summary={{ drafts: 1, scheduled: 0, published: 0, byType: { gig: 1 } }}
          catalog={[{ type: 'gig', label: 'Gig' }]}
          onSelectItem={onSelectItem}
          onArchiveItem={onArchiveItem}
          onCreateNew={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Launch blueprint')).toBeInTheDocument();
    const row = screen.getByText('Launch blueprint').closest('tr');
    await user.click(within(row).getByRole('button', { name: /open/i }));
    expect(onSelectItem).toHaveBeenCalledWith('draft-1');

    await user.click(within(row).getByRole('button', { name: /archive/i }));
    expect(onArchiveItem).toHaveBeenCalledWith('draft-1');
  });

  it('summarises studio metrics', () => {
    render(
      <MemoryRouter>
        <CreationStudioSummary
          data={{
            summary: { drafts: 2, scheduled: 1, published: 5, byType: { gig: 4, job: 4 } },
            items: [
              { id: '1', title: 'Gig A', status: 'draft', type: 'gig', updatedAt: new Date().toISOString() },
            ],
            catalog: [{ type: 'gig', label: 'Gig' }],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/drafts/i).nextSibling).toHaveTextContent('2');
    expect(screen.getByText(/scheduled/i).nextSibling).toHaveTextContent('1');
    expect(screen.getByRole('link', { name: /open/i })).toHaveAttribute('href', '/dashboard/user/creation-studio');
  });

  it('allows a creator to pick a template', async () => {
    const onSelectType = vi.fn();
    const user = userEvent.setup();
    render(
      <TypeGallery
        activeTypeId="gig"
        onSelectType={onSelectType}
        types={[
          { id: 'gig', name: 'Gig', tagline: 'Package a service', icon: () => null },
          { id: 'job', name: 'Job', tagline: 'Post a role', icon: () => null },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: /job/i }));
    expect(onSelectType).toHaveBeenCalledWith('job');
  });

  it('filters and manages shelf items', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const onOpenItem = vi.fn();
    const onPreviewItem = vi.fn();
    const onStartNew = vi.fn();
    const onRefresh = vi.fn();

    render(
      <ItemShelf
        items={[
          { id: '1', title: 'Gig launch', status: 'draft', type: 'gig', visibility: 'public', updatedAt: '2024-07-01T00:00:00Z' },
        ]}
        loading={false}
        filters={{ status: null, type: null }}
        onFilterChange={onFilterChange}
        onOpenItem={onOpenItem}
        onPreviewItem={onPreviewItem}
        onStartNew={onStartNew}
        onRefresh={onRefresh}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/status/i), 'draft');
    expect(onFilterChange).toHaveBeenCalledWith({ status: 'draft' });

    await user.click(screen.getByRole('button', { name: /peek/i }));
    expect(onPreviewItem).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(onOpenItem).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /^refresh$/i }));
    expect(onRefresh).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /^new$/i }));
    expect(onStartNew).toHaveBeenCalled();
  });

  it('shows preview content inside a drawer', async () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();
    const item = {
      id: 'draft-1',
      type: 'gig',
      title: 'Launch blueprint',
      status: 'draft',
      summary: 'Quick summary',
      description: 'Detailed plan',
      deliverables: ['Checklist'],
      metadata: {
        packages: [{ id: 'basic', name: 'Basic', price: '$200', features: ['One session'] }],
        faqs: [{ id: 'faq-1', question: 'What is included?', answer: 'Checklist' }],
      },
    };

    const user = userEvent.setup();
    render(
      <PreviewDrawer open item={item} onClose={onClose} onEdit={onEdit} />,
    );

    expect(await screen.findByRole('dialog')).toHaveTextContent('Launch blueprint');
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(item);
  });

  it('supports chip entry interactions', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ChipInput label="Tags" values={['alpha']} onChange={onChange} placeholder="Add" />,
    );

    await user.type(screen.getByPlaceholderText('Add'), 'beta{enter}');
    expect(onChange).toHaveBeenCalledWith(['alpha', 'beta']);

    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('manages document sections', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DocumentOutlineEditor sections={[]} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: /add section/i }));
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ heading: '', summary: '' })]),
    );
  });

  it('allows FAQ management', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<FaqList faqs={[]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /add faq/i }));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ question: '', answer: '' }),
    ]);
  });

  it('edits package tiers and features', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PackageTierForm
        packages={[
          { id: 'basic', name: 'Basic', price: '', deliveryTime: '', features: [] },
        ]}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByPlaceholderText('Add feature'), 'Audit{enter}');
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ features: ['Audit'] }),
    ]);
  });

  it('handles role access permissions', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <AccessStep
        draft={{ visibility: 'private', roleAccess: [], permissions: [] }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /freelancer/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ roleAccess: ['freelancer'] }));

    const row = screen
      .getAllByRole('row')
      .find((entry) => entry.textContent?.includes('Freelancer'));
    expect(row).toBeTruthy();
    await user.click(within(row).getAllByRole('checkbox')[0]);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ permissions: expect.arrayContaining([expect.objectContaining({ role: 'freelancer', canView: true })]) }),
    );
  });

  it('collects detailed settings', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DetailsStep
        draft={{ description: '', deliverables: [], metadata: {} }}
        onChange={onChange}
        typeConfig={{ features: {} }}
      />,
    );

    await user.type(screen.getByLabelText(/description/i), 'Full description');
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).toHaveProperty('description');
  });

  it('lets creators attach media assets', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <MediaStep
        draft={{ heroImageUrl: '', heroVideoUrl: '', thumbnailUrl: '', assets: [] }}
        onChange={onChange}
        typeConfig={{ features: {} }}
      />,
    );

    await user.type(screen.getByPlaceholderText('Label'), 'Mood board');
    await user.type(screen.getByPlaceholderText('https://asset'), 'https://example.com');
    await user.click(screen.getByRole('button', { name: /add asset/i }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        assets: expect.arrayContaining([expect.objectContaining({ label: 'Mood board', url: 'https://example.com' })]),
      }),
    );
  });

  it('captures overview basics', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <OverviewStep
        draft={{ type: 'gig', title: '', summary: '', status: 'draft', visibility: 'private', format: 'async', tags: [], audienceSegments: [] }}
        onChange={onChange}
        typeConfig={{ name: 'Gig', tagline: 'Package a service' }}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/status/i), 'published');
    expect(onChange).toHaveBeenCalledWith({ status: 'published' });
  });

  it('lays out gallery and shelf regions', () => {
    render(
      <StudioLayout
        gallery={<div data-testid="gallery">Gallery</div>}
        shelf={<div data-testid="shelf">Shelf</div>}
        footer={<div data-testid="footer">Footer</div>}
      />,
    );

    expect(screen.getByTestId('gallery')).toBeInTheDocument();
    expect(screen.getByTestId('shelf')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});

