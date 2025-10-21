import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import CompanyPageQuickCreateCard from '../CompanyPageQuickCreateCard.jsx';
import CompanyPageList from '../CompanyPageList.jsx';
import CompanyPageEditorDrawer from '../CompanyPageEditorDrawer.jsx';

describe('Company page quick create', () => {
  it('validates inputs and sends create payload', async () => {
    const handleCreate = vi.fn().mockResolvedValue();
    render(
      <CompanyPageQuickCreateCard
        blueprints={[{ id: 'employer_brand', name: 'Employer brand' }]}
        visibilityOptions={[{ value: 'private', label: 'Private draft' }]}
        onCreate={handleCreate}
      />,
    );

    const form = screen.getByLabelText('Page title').closest('form');
    fireEvent.submit(form);
    await screen.findByText(/Title and headline are required/i);

    fireEvent.change(screen.getByLabelText('Page title'), { target: { value: 'Culture hub' } });
    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'Life at Gigvora' } });
    fireEvent.change(screen.getByLabelText('Audience tags'), { target: { value: 'Hiring, Culture' } });
    fireEvent.submit(screen.getByText('Create page'));

    await waitFor(() => expect(handleCreate).toHaveBeenCalled());
    expect(handleCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Culture hub',
        headline: 'Life at Gigvora',
        tags: ['Hiring', 'Culture'],
      }),
    );
  });
});

describe('Company page list', () => {
  it('displays pages and surfaces action handlers', () => {
    const handleSelect = vi.fn();
    const handlePublish = vi.fn();
    const handleArchive = vi.fn();
    const handleDelete = vi.fn();

    render(
      <CompanyPageList
        pages={[
          {
            id: 'page-1',
            title: 'Culture hub',
            slug: 'culture',
            status: 'draft',
            visibility: 'private',
            analytics: { conversionRate: 47.6 },
          },
        ]}
        onSelect={handleSelect}
        onPublish={handlePublish}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />,
    );

    fireEvent.click(screen.getByText('Culture hub'));
    expect(handleSelect).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Publish/i }));
    expect(handlePublish).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Archive/i }));
    expect(handleArchive).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
    expect(handleDelete).toHaveBeenCalled();
  });
});

describe('Company page editor drawer', () => {
  const page = {
    id: 'page-1',
    title: 'Culture hub',
    slug: 'culture',
    headline: 'Life at Gigvora',
    summary: 'Our story',
    blueprint: 'employer_brand',
    visibility: 'private',
    status: 'draft',
    heroImageUrl: 'https://cdn.test/hero.png',
    scheduledFor: '2024-05-15T10:00:00.000Z',
    seo: { title: 'SEO title', description: 'SEO description' },
    sections: [{ id: 'section-1', title: 'Hero', variant: 'hero', orderIndex: 0 }],
    collaborators: [{ id: 'collab-1', collaboratorEmail: 'taylor@gigvora.test', role: 'editor', status: 'invited' }],
  };

  it('saves basics, sections, and collaborators', async () => {
    const handleBasics = vi.fn().mockResolvedValue();
    const handleSections = vi.fn().mockResolvedValue();
    const handleCollaborators = vi.fn().mockResolvedValue();

    render(
      <CompanyPageEditorDrawer
        open
        page={page}
        onClose={vi.fn()}
        onSaveBasics={handleBasics}
        onSaveSections={handleSections}
        onSaveCollaborators={handleCollaborators}
      />,
    );

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Culture HQ' } });
    fireEvent.click(screen.getByRole('button', { name: /Save basics/i }));
    await waitFor(() => expect(handleBasics).toHaveBeenCalled());
    expect(handleBasics).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Culture HQ',
        scheduledFor: '2024-05-15T10:00:00.000Z',
      }),
    );

    fireEvent.click(screen.getByRole('tab', { name: /Sections/i }));
    fireEvent.click(screen.getByRole('button', { name: /Add section/i }));
    fireEvent.click(screen.getByRole('button', { name: /Save sections/i }));
    await waitFor(() => expect(handleSections).toHaveBeenCalled());
    expect(handleSections.mock.calls[0][0]).toHaveLength(2);

    fireEvent.click(screen.getByRole('tab', { name: /Collaborators/i }));
    fireEvent.click(screen.getByRole('button', { name: /Invite collaborator/i }));
    const collaboratorsPanel = screen.getByRole('tabpanel', { name: /Collaborators/i });
    const emailInputs = within(collaboratorsPanel).getAllByLabelText('Email');
    fireEvent.change(emailInputs[emailInputs.length - 1], { target: { value: 'new@gigvora.test' } });
    fireEvent.click(screen.getByRole('button', { name: /Save collaborators/i }));
    await waitFor(() => expect(handleCollaborators).toHaveBeenCalled());
    expect(handleCollaborators.mock.calls[0][0]).toHaveLength(2);
  });
});
