import { render, screen } from '@testing-library/react';
import OperationsHQSection from '../OperationsHQSection.jsx';
import ProfileShowcaseSection from '../ProfileShowcaseSection.jsx';
import ProjectLabSection from '../ProjectLabSection.jsx';
import WorkspaceSettingsSection from '../WorkspaceSettingsSection.jsx';

vi.mock('../../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: vi.fn(() => ({ session: null })),
}));

describe('Freelancer dashboard sections fallback rendering', () => {
  it('surfaces membership actions in Operations HQ', () => {
    render(<OperationsHQSection />);

    expect(screen.getByText(/Operations core/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /request access/i })[0]).toBeInTheDocument();
  });

  it('shows hero showcase narrative with module list', () => {
    render(<ProfileShowcaseSection />);

    expect(screen.getByText(/Bring enterprise clarity/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Spotlight: Lumina Health transformation/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Gallery: Delivery artefacts/i)).toBeInTheDocument();
    expect(screen.getByText(/Operations keynote reel/i)).toBeInTheDocument();
  });

  it('lists project blueprints and creation controls', () => {
    render(<ProjectLabSection />);

    expect(screen.getByText(/Enterprise discovery & handoff/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer experience refresh/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create blueprint/i })).toBeInTheDocument();
  });

  it('renders workspace feature toggles and personalization options', () => {
    render(<WorkspaceSettingsSection />);

    expect(screen.getByText(/Collaboration suite/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Theme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notification digest/i)).toBeInTheDocument();
  });
});
