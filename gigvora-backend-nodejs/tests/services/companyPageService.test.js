import { describe, beforeEach, it, expect } from '@jest/globals';
import { CompanyPageSection, ProviderWorkspace, User } from '../../src/models/index.js';
import {
  createCompanyPage,
  updateCompanyPage,
  replacePageSections,
} from '../../src/services/companyPageService.js';

describe('companyPageService', () => {
  let workspace;
  let owner;

  beforeEach(async () => {
    owner = await User.create({
      firstName: 'Owner',
      lastName: 'Pages',
      email: `owner-pages-${Date.now()}@example.com`,
      password: 'hashed-password',
      userType: 'company',
    });

    workspace = await ProviderWorkspace.create({
      ownerId: owner.id,
      name: 'Pages Workspace',
      slug: `pages-${Date.now()}`,
      type: 'company',
      timezone: 'UTC',
      defaultCurrency: 'USD',
    });
  });

  it('creates pages with sections and supports updates with slug regeneration', async () => {
    const page = await createCompanyPage({
      workspaceId: workspace.id,
      title: 'Acme Brand Story',
      headline: 'Build with heart',
      summary: 'Human-first storytelling to attract talent.',
      blueprint: 'employer_brand',
      visibility: 'private',
      sections: [
        {
          variant: 'hero',
          title: 'Hero',
          headline: 'Hello world',
          body: 'Welcome to our hiring story',
        },
      ],
      collaborators: [
        { collaboratorEmail: 'brand@gigvora.test', role: 'viewer', status: 'accepted' },
      ],
      actorId: owner.id,
    });

    expect(page.slug).toMatch(/acme-brand-story/);
    expect(page.sections).toHaveLength(1);

    const updated = await updateCompanyPage({
      workspaceId: workspace.id,
      pageId: page.id,
      title: 'Acme Brand Story Extended',
      headline: 'Build with heart and craft',
      visibility: 'public',
      status: 'published',
      actorId: owner.id,
    });

    expect(updated.slug).toMatch(/acme-brand-story-extended/);
    expect(updated.visibility).toBe('public');
    expect(updated.status).toBe('published');

    const replaced = await replacePageSections({
      workspaceId: workspace.id,
      pageId: page.id,
      sections: [
        {
          variant: 'story_block',
          title: 'Mission',
          headline: 'Mission and values',
          body: 'We help independent talent thrive.',
          orderIndex: 0,
        },
        {
          variant: 'metrics_grid',
          title: 'Highlights',
          content: { metrics: [{ label: 'Placements', value: '120+' }] },
          orderIndex: 1,
        },
      ],
      actorId: owner.id,
    });

    expect(replaced.sections).toHaveLength(2);
    expect(replaced.sections[0]).toMatchObject({ variant: 'story_block', orderIndex: 0 });
    expect(replaced.sections[1]).toMatchObject({ variant: 'metrics_grid', orderIndex: 1 });

    const persistedSections = await CompanyPageSection.findAll({ where: { pageId: page.id } });
    expect(persistedSections).toHaveLength(2);
  });
});
