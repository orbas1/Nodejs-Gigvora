import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import JobApplicationWorkspaceLayout from '../JobApplicationWorkspaceLayout.jsx';

vi.mock('../panels/OverviewPanel.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="overview-panel">Overview content</div>,
}));

vi.mock('../panels/ApplicationsPanel.jsx', () => ({
  __esModule: true,
  default: (props) => <div data-testid="applications-panel">Applications {props.applications.length}</div>,
}));

vi.mock('../panels/InterviewsPanel.jsx', () => ({
  __esModule: true,
  default: (props) => <div data-testid="interviews-panel">Interviews {props.interviews.length}</div>,
}));

vi.mock('../panels/FavouritesPanel.jsx', () => ({
  __esModule: true,
  default: (props) => <div data-testid="favourites-panel">Favourites {props.favourites.length}</div>,
}));

vi.mock('../panels/ResponsesPanel.jsx', () => ({
  __esModule: true,
  default: (props) => <div data-testid="responses-panel">Responses {props.responses.length}</div>,
}));

describe('JobApplicationWorkspaceLayout', () => {
  const workspace = {
    summary: {
      totalApplications: 3,
      activeApplications: 2,
      interviewsScheduled: 1,
      favourites: 4,
      pendingResponses: 5,
    },
    applications: [{ id: 'app-1' }, { id: 'app-2' }],
    interviews: [{ id: 'int-1' }],
    favourites: [{ id: 'fav-1' }, { id: 'fav-2' }],
    responses: [{ id: 'res-1' }],
  };

  it('renders navigation counts and overview panel by default', () => {
    const onChangeView = vi.fn();
    render(
      <JobApplicationWorkspaceLayout
        workspace={workspace}
        activeView="overview"
        onChangeView={onChangeView}
        onCreateApplication={vi.fn()}
        onEditApplication={vi.fn()}
        onArchiveApplication={vi.fn()}
        onCreateInterview={vi.fn()}
        onEditInterview={vi.fn()}
        onDeleteInterview={vi.fn()}
        onCreateFavourite={vi.fn()}
        onEditFavourite={vi.fn()}
        onDeleteFavourite={vi.fn()}
        onCreateResponse={vi.fn()}
        onEditResponse={vi.fn()}
        onDeleteResponse={vi.fn()}
      />,
    );

    expect(screen.getByTestId('overview-panel')).toBeInTheDocument();
    const appsButton = screen.getByRole('button', { name: /apps/i });
    expect(appsButton).toHaveTextContent('Apps');
    expect(appsButton).toHaveTextContent('2');
  });

  it('renders the requested panel and emits view changes', async () => {
    const user = userEvent.setup();
    const onChangeView = vi.fn();

    render(
      <JobApplicationWorkspaceLayout
        workspace={workspace}
        activeView="apps"
        onChangeView={onChangeView}
        onCreateApplication={vi.fn()}
        onEditApplication={vi.fn()}
        onArchiveApplication={vi.fn()}
        onCreateInterview={vi.fn()}
        onEditInterview={vi.fn()}
        onDeleteInterview={vi.fn()}
        onCreateFavourite={vi.fn()}
        onEditFavourite={vi.fn()}
        onDeleteFavourite={vi.fn()}
        onCreateResponse={vi.fn()}
        onEditResponse={vi.fn()}
        onDeleteResponse={vi.fn()}
      />,
    );

    expect(screen.getByTestId('applications-panel')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /saved/i }));
    expect(onChangeView).toHaveBeenCalledWith('saved');
  });

  it('displays an action error when provided', () => {
    render(
      <JobApplicationWorkspaceLayout
        workspace={workspace}
        activeView="overview"
        onChangeView={vi.fn()}
        onCreateApplication={vi.fn()}
        onEditApplication={vi.fn()}
        onArchiveApplication={vi.fn()}
        onCreateInterview={vi.fn()}
        onEditInterview={vi.fn()}
        onDeleteInterview={vi.fn()}
        onCreateFavourite={vi.fn()}
        onEditFavourite={vi.fn()}
        onDeleteFavourite={vi.fn()}
        onCreateResponse={vi.fn()}
        onEditResponse={vi.fn()}
        onDeleteResponse={vi.fn()}
        actionError={{ message: 'Something went wrong' }}
      />,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
