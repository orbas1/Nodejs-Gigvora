import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import SearchCommandPalette from '../SearchCommandPalette.jsx';
import { buildPaletteEntries } from '../SearchCommandPalette.jsx';

vi.mock('@headlessui/react', () => {
  const renderChild = (child) => (typeof child === 'function' ? child({}) : child);
  const Dialog = ({ children, onClose }) => (
    <div role="dialog" aria-modal="true">
      <button type="button" onClick={() => onClose?.(false)}>
        Close
      </button>
      {children}
    </div>
  );
  Dialog.Panel = ({ children, onKeyDown }) => (
    <div role="group" onKeyDown={onKeyDown}>
      {renderChild(children)}
    </div>
  );
  const Transition = ({ children }) => <>{renderChild(children)}</>;
  Transition.Root = ({ children }) => <>{renderChild(children)}</>;
  Transition.Child = ({ children }) => <>{renderChild(children)}</>;
  return { Dialog, Transition };
});

describe('buildPaletteEntries', () => {
  it('creates sections with filtered entries', () => {
    const { sections, entries } = buildPaletteEntries({
      savedSearches: [{ id: 1, name: 'Design Leads', query: 'Design', category: 'job' }],
      recentSearches: [
        { id: 'r-1', category: 'gig', query: 'React', performedAt: '2024-01-01T00:00:00.000Z' },
      ],
      suggestions: [
        { id: 's-1', title: 'Join the build guild', subtitle: 'Projects', category: 'project' },
      ],
      trendingTopics: [
        { id: 't-1', title: 'AI Ethics', summary: 'Governance conversations', category: 'job' },
      ],
      categories: [
        { id: 'job', label: 'Jobs' },
        { id: 'project', label: 'Projects' },
      ],
      query: 'ai',
      activeCategory: 'job',
    });

    expect(sections).toHaveLength(1);
    expect(entries.map((entry) => entry.title)).toEqual(['AI Ethics']);
  });
});

describe('SearchCommandPalette', () => {
  function Wrapper(props) {
    const [query, setQuery] = useState('');
    return <SearchCommandPalette {...props} query={query} onQueryChange={setQuery} />;
  }

  it('renders explorer data and fires selection callback', async () => {
    const user = userEvent.setup();
    const onSelectEntry = vi.fn();

    render(
      <Wrapper
        isOpen
        onSelectEntry={onSelectEntry}
        savedSearches={[{ id: 1, name: 'Design Leads', query: 'design leaders', category: 'job' }]}
        recentSearches={[{ id: 'r-1', category: 'gig', query: 'React mentors', performedAt: new Date().toISOString() }]}
        suggestions={[{ id: 's-1', title: 'Launchpad Sprint', subtitle: 'Launchpad', category: 'launchpad' }]}
        trendingTopics={[{ id: 't-1', title: 'AI Ethics', summary: 'Governance conversations', category: 'job' }]}
        categories={[
          { id: 'job', label: 'Jobs', placeholder: 'Search roles' },
          { id: 'project', label: 'Projects', placeholder: 'Search projects' },
        ]}
        activeCategory="job"
      />,
    );

    expect(screen.getByText(/design leads/i)).toBeInTheDocument();
    expect(screen.getByText(/react mentors/i)).toBeInTheDocument();
    expect(screen.getByText(/launchpad sprint/i)).toBeInTheDocument();
    expect(screen.getByText(/ai ethics/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /design leads/i }));
    expect(onSelectEntry).toHaveBeenCalledWith(expect.objectContaining({ type: 'saved-search' }));
    onSelectEntry.mockReset();

    await user.type(screen.getByRole('textbox'), 'project');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelectEntry).toHaveBeenCalledWith(expect.objectContaining({ type: 'category', data: expect.objectContaining({ id: 'project' }) }));
  });

  it('shows empty state when no matches remain', async () => {
    const user = userEvent.setup();
    render(
      <Wrapper
        isOpen
        savedSearches={[{ id: 1, name: 'Design Leads', query: 'design leaders', category: 'job' }]}
        recentSearches={[]}
        suggestions={[]}
        trendingTopics={[]}
        categories={[{ id: 'job', label: 'Jobs' }]}
        activeCategory="job"
      />,
    );

    await user.type(screen.getByRole('textbox'), 'zzzz');
    expect(screen.getByText(/no matches/i)).toBeInTheDocument();
  });
});
