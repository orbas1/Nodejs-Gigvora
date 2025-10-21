import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-map-gl', () => {
  const MockMap = ({ children, ...props }) => (
    <div data-testid="map" data-props={JSON.stringify(props)}>
      {children}
    </div>
  );
  const Marker = ({ children }) => <div data-testid="marker">{children}</div>;
  const NavigationControl = () => <div data-testid="navigation" />;
  return { __esModule: true, default: MockMap, Marker, NavigationControl };
});

const importMap = async () => {
  const module = await import('../ExplorerMap.jsx');
  return module.default;
};

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe('ExplorerMap', () => {
  it('renders a fallback when no Mapbox token is configured', async () => {
    vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', '');
    const ExplorerMap = await importMap();

    render(<ExplorerMap items={[]} onViewportChange={vi.fn()} />);

    expect(
      screen.getByText(/requires a Mapbox access token/i),
    ).toBeInTheDocument();
  });

  it('renders markers when a token is provided', async () => {
    vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', 'token');
    const ExplorerMap = await importMap();

    render(
      <ExplorerMap
        items={[
          { id: '1', geo: { lat: '51.5', lng: '-0.1' }, title: 'Opportunity', category: 'job' },
        ]}
      />,
    );

    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.getByTestId('marker')).toBeInTheDocument();
  });
});
