import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientPanel from '../ClientPanel.jsx';
import ColumnDrawer from '../ColumnDrawer.jsx';
import KanbanColumn from '../KanbanColumn.jsx';
import {
  buildTagString,
  buildTelHref,
  classNames,
  formatCurrency,
  formatDate,
  formatRelative,
  isValidHexColor,
  normalizeExternalUrl,
  parseTags,
  toDateInputValue,
} from '../utils.js';

describe('clientKanban utils', () => {
  it('normalizes urls and rejects unsupported protocols', () => {
    expect(normalizeExternalUrl('example.com')).toMatch(/^https:\/\/example.com/);
    expect(normalizeExternalUrl('ftp://example.com')).toBe('');
    expect(normalizeExternalUrl('')).toBe('');
  });

  it('sanitizes tel hrefs', () => {
    expect(buildTelHref('+1 (555) 123-4567')).toBe('tel:+15551234567');
    expect(buildTelHref('abc')).toBe('');
  });

  it('validates hex colors and allows css variables', () => {
    expect(isValidHexColor('#123abc')).toBe(true);
    expect(isValidHexColor('var(--accent)')).toBe(true);
    expect(isValidHexColor('#zzzzzz')).toBe(false);
  });

  it('provides robust formatting helpers', () => {
    expect(classNames('a', false, 'b')).toBe('a b');
    expect(formatCurrency(1200, 'USD')).toContain('$1,200');
    expect(formatDate('2024-01-01')).toBeTruthy();
    expect(formatRelative(new Date(Date.now() + 3600 * 1000))).toContain('hour');
    expect(toDateInputValue('2024-01-02')).toBe('2024-01-02');
    expect(parseTags('a, b , c')).toEqual(['a', 'b', 'c']);
    expect(buildTagString(['a', 'b'])).toBe('a, b');
  });
});

describe('ClientPanel', () => {
  const baseClients = [
    {
      id: 1,
      name: 'Acme Co',
      tier: 'gold',
      healthStatus: 'healthy',
      primaryContactEmail: 'team@acme.test',
      primaryContactName: 'Taylor Reed',
      primaryContactPhone: '+1 (222) 222-1111',
      websiteUrl: 'acme.test',
      annualContractValue: 75000,
      tags: ['priority'],
      notes: 'Important renewal in Q4',
    },
    {
      id: 2,
      name: 'Beta LLC',
      tier: 'silver',
      healthStatus: 'monitor',
      primaryContactEmail: 'hello@beta.test',
      primaryContactName: 'Jordan Lane',
      primaryContactPhone: '+1 333 333 3333',
      websiteUrl: 'https://beta.test',
      annualContractValue: 32000,
    },
  ];

  it('filters clients by query and exposes contact details', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ClientPanel open clients={baseClients} onSelect={onSelect} activeClientId={1} onCreate={vi.fn()} onEdit={vi.fn()} />,
    );

    const emailLink = await screen.findByRole('link', { name: 'team@acme.test' });
    expect(emailLink).toHaveAttribute('href', 'mailto:team%40acme.test');

    const phoneLink = screen.getByRole('link', { name: '+1 (222) 222-1111' });
    expect(phoneLink).toHaveAttribute('href', 'tel:+12222221111');

    const websiteLink = screen.getByRole('link', { name: 'acme.test' });
    expect(websiteLink).toHaveAttribute('href', 'https://acme.test/');

    const search = screen.getByPlaceholderText('Search');
    await user.type(search, 'beta');

    const betaEntries = await screen.findAllByText('Beta LLC');
    expect(betaEntries.length).toBeGreaterThan(0);
    expect(screen.queryByText('Acme Co')).not.toBeInTheDocument();

    const betaButtons = screen.getAllByRole('button', { name: /Beta LLC/ });
    await user.click(betaButtons[0]);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
  });
});

describe('ColumnDrawer', () => {
  it('validates inputs before submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ColumnDrawer open mode="create" onSubmit={onSubmit} onClose={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Column name is required.')).toBeInTheDocument();

    const nameField = await screen.findByLabelText('Name');
    const limitField = await screen.findByLabelText('Limit');
    const colorField = await screen.findByLabelText('Accent color');

    await user.type(nameField, 'In progress');
    await user.type(limitField, '-5');
    await user.type(colorField, '#zzzzzz');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Work limit must be a positive whole number.')).toBeInTheDocument();
    expect(screen.getByText('Use a valid hex value (e.g. #2563eb).')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits sanitized payload and closes drawer', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    const onClose = vi.fn();
    render(
      <ColumnDrawer
        open
        mode="edit"
        initialValue={{ name: 'Doing', wipLimit: 3, color: '#2563eb' }}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );

    const nameInput = await screen.findByLabelText('Name');
    const limitInput = await screen.findByLabelText('Limit');
    const colorInput = await screen.findByLabelText('Accent color');

    await user.clear(nameInput);
    await user.type(nameInput, 'Doing Updated');
    await user.clear(limitInput);
    await user.type(limitInput, '4');
    await user.clear(colorInput);
    await user.type(colorInput, '#123abc');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Doing Updated', wipLimit: 4, color: '#123abc' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe('KanbanColumn', () => {
  it('renders cards with controls and triggers handlers', async () => {
    const user = userEvent.setup();
    const column = {
      id: 1,
      name: 'Backlog',
      wipLimit: 5,
      color: '#2563eb',
      cards: [
        { id: 1, title: 'Kickoff', priority: 'high' },
        { id: 2, title: 'Discovery', priority: 'medium' },
      ],
    };
    const handlers = {
      onAddCard: vi.fn(),
      onEditColumn: vi.fn(),
      onDeleteColumn: vi.fn(),
      onOpenCard: vi.fn(),
      onEditCard: vi.fn(),
      onDeleteCard: vi.fn(),
      onDragStart: vi.fn(),
      onDragEnd: vi.fn(),
      onCardDrop: vi.fn(),
    };

    render(<KanbanColumn column={column} {...handlers} />);

    expect(screen.getByLabelText('Backlog column')).toBeInTheDocument();
    expect(screen.getByText('Limit 5')).toBeInTheDocument();

    await user.click(screen.getAllByLabelText('Add card')[0]);
    expect(handlers.onAddCard).toHaveBeenCalledWith(column);

    const columnSection = screen.getByTestId('kanban-column-1');
    fireEvent.drop(columnSection, { dataTransfer: { dropEffect: 'move' } });
    expect(handlers.onCardDrop).toHaveBeenCalledWith(expect.any(Object), column);
  });

  it('shows empty state when no cards are available', async () => {
    const user = userEvent.setup();
    const column = { id: 2, name: 'QA', cards: [], color: null };
    const onAddCard = vi.fn();
    render(<KanbanColumn column={column} onAddCard={onAddCard} />);

    expect(screen.getByText('No cards yet')).toBeInTheDocument();
    await user.click(screen.getByText('New'));
    expect(onAddCard).toHaveBeenCalledWith(column);
  });
});
