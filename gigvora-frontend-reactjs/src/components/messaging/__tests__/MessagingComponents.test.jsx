import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import MessagesInbox from '../MessagesInbox.jsx';
import ConversationView from '../ConversationView.jsx';
import MessagingWorkspace from '../MessagingWorkspace.jsx';

const SAMPLE_THREADS = [
  {
    id: '1',
    title: 'Archie White',
    preview: 'Thanks for connecting with me.',
    unread: true,
    starred: true,
    meta: 'Partnerships · Vecta Search',
    lastActivityAt: '2024-04-10T10:00:00Z',
    messages: [
      {
        id: 'm-1',
        body: 'Thanks for connecting with me.',
        author: { id: '1', name: 'Archie White' },
        createdAt: '2024-04-10T10:00:00Z',
      },
    ],
  },
  {
    id: '2',
    title: 'Jamila Thomas',
    preview: 'Really enjoyed your pitch deck! Let’s sync soon.',
    unread: false,
    starred: false,
    meta: 'Talent Partner · Blackriver Group',
    lastActivityAt: '2024-04-09T12:00:00Z',
    messages: [
      {
        id: 'm-2',
        body: 'Really enjoyed your pitch deck! Let’s sync soon.',
        author: { id: '2', name: 'Jamila Thomas' },
        createdAt: '2024-04-09T12:00:00Z',
      },
    ],
  },
];

describe('MessagesInbox', () => {
  it('invokes selection, search, and filter callbacks', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    const handleSearch = vi.fn();
    const handleFilter = vi.fn();

    render(
      <MessagesInbox
        threads={SAMPLE_THREADS}
        selectedThreadId="1"
        onSelectThread={handleSelect}
        onSearchChange={handleSearch}
        onFilterChange={handleFilter}
        filter="all"
        searchTerm=""
      />,
    );

    const listItems = await screen.findAllByRole('listitem');
    expect(listItems).toHaveLength(2);

    await user.type(screen.getByPlaceholderText(/Search messages/i), 'arch');
    expect(handleSearch).toHaveBeenCalled();
    const searchValues = handleSearch.mock.calls.map(([value]) => value);
    expect(searchValues.join('')).toBe('arch');

    await user.click(screen.getByRole('button', { name: /Unread/i }));
    expect(handleFilter).toHaveBeenCalledWith('unread');

    await screen.findByTestId('thread-2');
    await user.click(screen.getByTestId('thread-2'));
    expect(handleSelect).toHaveBeenCalledWith('2');
  });
});

describe('ConversationView', () => {
  it('renders placeholder when no thread selected', () => {
    render(<ConversationView thread={null} composerValue="" onComposerChange={() => {}} />);
    expect(screen.getByText(/Select a conversation/)).toBeInTheDocument();
  });

  it('renders messages and triggers send handler', async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    function Harness() {
      const [composer, setComposer] = useState('');
      return (
        <ConversationView
          actorId="you"
          thread={SAMPLE_THREADS[0]}
          messages={SAMPLE_THREADS[0].messages}
          composerValue={composer}
          onComposerChange={setComposer}
          onSendMessage={(body) => handleSend(body)}
        />
      );
    }

    await act(async () => {
      render(<Harness />);
    });

    await user.type(screen.getByPlaceholderText(/Write a message/i), 'Hello there');
    await user.click(screen.getByRole('button', { name: /Send/i }));

    await waitFor(() => {
      expect(handleSend).toHaveBeenCalledWith('Hello there');
    });
  });
});

describe('MessagingWorkspace', () => {
  it('selects threads and relays send events with thread id', async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn(() => Promise.resolve());

    await act(async () => {
      render(<MessagingWorkspace actorId="you" threads={SAMPLE_THREADS} onSendMessage={handleSend} />);
    });

    const composer = screen.getByPlaceholderText(/Write a message/i);
    await user.type(composer, 'Great to connect!');
    await user.click(screen.getByRole('button', { name: /Send/i }));

    await waitFor(() => {
      expect(handleSend).toHaveBeenCalledWith('1', 'Great to connect!');
    });

    await screen.findByTestId('thread-2');
    await user.click(screen.getByTestId('thread-2'));
    await user.clear(composer);
    await user.type(composer, 'See you soon');
    await user.click(screen.getByRole('button', { name: /Send/i }));

    await waitFor(() => {
      const [, secondCall] = handleSend.mock.calls;
      expect(secondCall).toEqual(['2', 'See you soon']);
    });
  });

  it('filters unread threads when toggled', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<MessagingWorkspace actorId="you" threads={SAMPLE_THREADS} />);
    });

    await screen.findAllByRole('listitem');

    await user.click(screen.getByRole('button', { name: /Unread/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
  });
});
