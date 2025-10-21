import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SavedSearchList from '../SavedSearchList.jsx';

describe('SavedSearchList', () => {
  it('sorts saved searches alphabetically and handles interactions', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onDelete = vi.fn();

    const savedSearches = [
      { id: 2, name: 'Zeta ops', category: 'jobs', query: 'ops' },
      { id: 1, name: 'Alpha design', category: 'gigs', query: 'design' },
    ];

    render(
      <SavedSearchList
        savedSearches={savedSearches}
        onApply={onApply}
        onDelete={onDelete}
        loading={false}
        canManageServerSearches
        activeSearchId={1}
      />,
    );

    const applyButton = screen.getByRole('button', { name: /alpha design/i });
    await user.click(applyButton);
    expect(onApply).toHaveBeenCalledWith(savedSearches[1]);

    const item = applyButton.closest('li');
    expect(item).not.toBeNull();
    await user.click(within(item).getByRole('button', { name: /delete saved search/i }));
    expect(onDelete).toHaveBeenCalledWith(savedSearches[1]);
  });
});
