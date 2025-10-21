import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import MegaMenu from '../MegaMenu.jsx';
import RoleSwitcher from '../RoleSwitcher.jsx';

function renderWithRouter(ui) {
  return render(ui, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });
}

describe('MegaMenu', () => {
  const DummyIcon = () => <svg data-testid="dummy-icon" />;
  const item = {
    id: 'networking',
    label: 'Networking',
    description: 'Tools for rotation-led sessions',
    sections: [
      {
        title: 'Launch',
        items: [
          {
            name: 'Session planner',
            description: 'Schedule and configure rotations',
            to: '/networking/planner',
            icon: DummyIcon,
          },
        ],
      },
      {
        title: 'Engage',
        items: [
          {
            name: 'Connection CRM',
            description: 'Log matches and follow-ups',
            to: '/networking/crm',
            icon: DummyIcon,
          },
        ],
      },
    ],
  };

  it('opens the menu and reveals section links', async () => {
    const user = userEvent.setup();
    renderWithRouter(<MegaMenu item={item} />);

    expect(screen.queryByText('Session planner')).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /networking/i }));
    });

    expect(await screen.findByText('Session planner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /connection crm/i })).toHaveAttribute('href', '/networking/crm');
  });
});

describe('RoleSwitcher', () => {
  const options = [
    { key: 'founder', label: 'Founder', to: '/founder', timelineEnabled: true },
    { key: 'agency', label: 'Agency', to: '/agency', timelineEnabled: false },
  ];

  it('renders active role and allows switching', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RoleSwitcher options={options} currentKey="founder" />);

    expect(screen.getByRole('button', { name: /founder/i })).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /founder/i }));
    });
    const agencyOption = await screen.findByRole('menuitem', { name: /agency/i });
    expect(agencyOption).toHaveAttribute('href', '/agency');
    const founderOption = await screen.findByRole('menuitem', { name: /founder/i });
    expect(within(founderOption).getByText(/timeline/i)).toBeInTheDocument();
  });
});
