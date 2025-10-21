import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AccessRestricted from '../AccessRestricted.jsx';
import DataStatus from '../DataStatus.jsx';
import TagInput from '../TagInput.jsx';
import SocialAuthButton from '../SocialAuthButton.jsx';
import WorkspaceTemplatesSection from '../WorkspaceTemplatesSection.jsx';
import RoleGate from '../access/RoleGate.jsx';
import useRoleAccess from '../../hooks/useRoleAccess.js';

vi.mock('../../hooks/useRoleAccess.js', () => ({
  default: vi.fn(),
}));

const mockedUseRoleAccess = vi.mocked(useRoleAccess);

describe('Core experience components', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-22T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders access restriction call to action', async () => {
    render(
      <MemoryRouter>
        <AccessRestricted
          title="Upgrade required"
          description="Request elevated permissions to access this surface."
          badge="Restricted"
          actionLabel="Contact support"
          actionHref="/support"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Upgrade required')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', '/support');
  });

  it('displays data status metadata and triggers refresh callbacks', async () => {
    const handleRefresh = vi.fn();
    render(
      <DataStatus
        loading={false}
        fromCache={false}
        lastUpdated={new Date('2024-05-22T10:00:00Z')}
        onRefresh={handleRefresh}
      />,
    );

    expect(screen.getByText(/Updated/)).toHaveTextContent('Updated 2 hours ago');
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });

  it('normalises tag additions, blocks duplicates, and supports removal', async () => {
    const handleChange = vi.fn();

    function Wrapper() {
      const [tags, setTags] = useState(['Design']);
      return (
        <TagInput
          label="Skills"
          items={tags}
          onChange={(next) => {
            setTags(next);
            handleChange(next);
          }}
          placeholder="Add skill"
        />
      );
    }

    render(<Wrapper />);

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(screen.getByPlaceholderText('Add skill'), 'Strategy{enter}');
    expect(handleChange).toHaveBeenLastCalledWith(['Design', 'Strategy']);
    expect(screen.getAllByRole('button', { name: /Remove/ })).toHaveLength(2);

    await user.type(screen.getByPlaceholderText('Add skill'), 'design{enter}');
    expect(handleChange).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Remove Design' }));
    expect(handleChange).toHaveBeenLastCalledWith(['Strategy']);
    expect(screen.getByText('Strategy')).toBeInTheDocument();
  });

  it('surfaces social login providers with hardened buttons', async () => {
    const handleClick = vi.fn();
    render(<SocialAuthButton provider="linkedin" onClick={handleClick} />);

    const button = screen.getByRole('button', { name: /continue with linkedin/i });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('routes unauthorised members through the role gate experience', () => {
    mockedUseRoleAccess.mockReturnValue({
      hasAccess: false,
      isAuthenticated: true,
      session: { id: 'user-1' },
      allowedRoles: ['admin'],
      matchedRole: null,
    });

    render(
      <MemoryRouter>
        <RoleGate allowedRoles={['admin']} featureName="admin dashboard">
          <div>Should not render</div>
        </RoleGate>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Access restricted/i)).toBeInTheDocument();
    expect(screen.queryByText('Should not render')).not.toBeInTheDocument();
  });

  it('renders selected workspace template summary and handles interactions', async () => {
    const onCategoryChange = vi.fn();
    const onSelectTemplate = vi.fn();

    render(
      <WorkspaceTemplatesSection
        categories={[{ slug: 'ops', name: 'Operations', templateCount: 1 }]}
        templates={[
          {
            id: 1,
            slug: 'ops-blueprint',
            name: 'Ops Blueprint',
            tagline: 'Deliver calm client projects',
            industry: 'operations',
          },
        ]}
        selectedTemplate={{
          slug: 'ops-blueprint',
          name: 'Ops Blueprint',
          category: { name: 'Operations', slug: 'ops' },
          description: 'A templated delivery playbook.',
          requirementChecklist: ['Kick-off call'],
          onboardingSequence: [{ step: 'Kick-off', owner: 'PM' }],
          deliverables: ['Discovery report'],
          metrics: [{ name: 'NPS', target: 65, unit: 'pts' }],
          stages: [{ id: 'stage-1', stageType: 'Briefing', title: 'Scoping', description: 'Align objectives.' }],
          resources: [{ id: '1', title: 'Brief template', resourceType: 'Doc' }],
        }}
        onCategoryChange={onCategoryChange}
        onSelectTemplate={onSelectTemplate}
      />,
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: /Operations/ }));
    expect(onCategoryChange).toHaveBeenCalledWith('ops');

    await user.click(screen.getByRole('button', { name: /Ops Blueprint/ }));
    expect(onSelectTemplate).toHaveBeenCalledWith('ops-blueprint');
    expect(screen.getByText('A templated delivery playbook.')).toBeInTheDocument();
  });
});
