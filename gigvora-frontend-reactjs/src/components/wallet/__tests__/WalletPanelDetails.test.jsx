import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import FundingSourcesPanel from '../panels/FundingSourcesPanel.jsx';
import EscrowPanel from '../panels/EscrowPanel.jsx';
import LedgerPanel from '../panels/LedgerPanel.jsx';
import TransferMovesPanel from '../panels/TransferMovesPanel.jsx';
import TransferRulesPanel from '../panels/TransferRulesPanel.jsx';

const createUser = () => userEvent.setup();

describe('Wallet detailed panels', () => {
  describe('FundingSourcesPanel', () => {
    it('renders available sources, sorts them, and forwards actions', async () => {
      const onCreate = vi.fn();
      const onEdit = vi.fn();
      const onMakePrimary = vi.fn();
      const user = createUser();

      const sources = [
        {
          id: 'source-1',
          label: 'Primary Bank',
          type: 'bank_account',
          provider: 'Atlas Bank',
          lastFour: '1234',
          connectedAt: '2024-02-01T00:00:00.000Z',
          isPrimary: true,
          limitAmount: 5000,
          currencyCode: 'USD',
        },
        {
          id: 'source-2',
          label: 'Backup Card',
          type: 'card',
          provider: 'Visa',
          lastFour: '4242',
          connectedAt: '2024-02-10T00:00:00.000Z',
          limitAmount: 2000,
          currencyCode: 'USD',
          requiresManualReview: true,
        },
        {
          id: 'source-3',
          label: 'Local Bank',
          type: 'bank_account',
          provider: 'Metro Bank',
          lastFour: '9876',
          connectedAt: '2024-01-12T00:00:00.000Z',
          limitAmount: 1500,
          currencyCode: 'USD',
        },
      ];

      render(
        <FundingSourcesPanel
          sources={sources}
          primaryId="source-1"
          onCreate={onCreate}
          onEdit={onEdit}
          onMakePrimary={onMakePrimary}
        />,
      );

      await user.click(screen.getByRole('button', { name: /add source/i }));
      expect(onCreate).toHaveBeenCalled();

      expect(screen.getByText(/review/i)).toBeInTheDocument();

      const headings = screen.getAllByRole('heading', { level: 4 });
      expect(headings[0]).toHaveTextContent('Primary Bank');

      await user.click(screen.getByRole('button', { name: /set backup card/i }));
      expect(onMakePrimary).toHaveBeenCalledWith(expect.objectContaining({ id: 'source-2' }));

      await user.click(screen.getByRole('button', { name: /edit backup card/i }));
      expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'source-2' }));
    });

    it('shows an empty state when no sources exist', () => {
      render(
        <FundingSourcesPanel
          sources={[]}
          primaryId={null}
          onCreate={vi.fn()}
          onEdit={vi.fn()}
        />,
      );

      expect(screen.getByText(/connect a payout method/i)).toBeInTheDocument();
    });
  });

  describe('EscrowPanel', () => {
    it('lists escrow accounts sorted by balance and exposes selection callbacks', async () => {
      const onSelectAccount = vi.fn();
      const user = createUser();

      const accounts = [
        {
          id: 'escrow-1',
          name: 'Client reserve',
          status: 'active',
          currentBalance: 3200,
          heldBalance: 800,
          currencyCode: 'USD',
          accountType: 'reserve',
          updatedAt: '2024-02-20T00:00:00.000Z',
        },
        {
          id: 'escrow-2',
          name: 'Launch fund',
          status: 'pending',
          currentBalance: 1200,
          heldBalance: 100,
          currencyCode: 'USD',
          accountType: 'reserve',
          updatedAt: '2024-02-21T00:00:00.000Z',
        },
      ];

      render(<EscrowPanel accounts={accounts} onSelectAccount={onSelectAccount} />);

      const buttons = screen.getAllByRole('button', { name: /escrow account/i });
      expect(buttons[0]).toHaveAccessibleName(/client reserve/i);

      await user.click(screen.getByRole('button', { name: /client reserve/i }));
      expect(onSelectAccount).toHaveBeenCalledWith(accounts[0]);
    });
  });

  describe('LedgerPanel', () => {
    it('renders ledger entries sorted by newest first and emits selections', async () => {
      const onSelect = vi.fn();
      const user = createUser();

      const entries = [
        {
          id: 'entry-1',
          entryType: 'credit',
          reference: 'Invoice 55',
          amount: 250,
          currencyCode: 'USD',
          balanceAfter: 500,
          occurredAt: '2024-02-22T09:00:00.000Z',
        },
        {
          id: 'entry-2',
          entryType: 'debit',
          reference: 'Invoice 54',
          amount: 100,
          currencyCode: 'USD',
          balanceAfter: 250,
          occurredAt: '2024-02-19T09:00:00.000Z',
        },
      ];

      render(
        <LedgerPanel
          entries={entries}
          summary={{ ledgerIntegrity: 'ready' }}
          onSelectEntry={onSelect}
        />,
      );

      const ledgerButtons = screen.getAllByRole('button', { name: /ledger entry/i });
      expect(ledgerButtons[0]).toHaveAccessibleName(/invoice 55/i);

      await user.click(screen.getByRole('button', { name: /invoice 55/i }));
      expect(onSelect).toHaveBeenCalledWith(entries[0]);
    });
  });

  describe('TransferMovesPanel', () => {
    it('supports scheduling, keeps newest first, and viewing transfers', async () => {
      const onCreate = vi.fn();
      const onSelectTransfer = vi.fn();
      const user = createUser();

      const transfers = [
        {
          id: 'transfer-1',
          transferType: 'payout',
          amount: 480,
          currencyCode: 'USD',
          status: 'pending',
          fundingSource: { label: 'Atlas Bank' },
          scheduledAt: '2024-02-25T12:00:00.000Z',
        },
        {
          id: 'transfer-2',
          transferType: 'payout',
          amount: 200,
          currencyCode: 'USD',
          status: 'scheduled',
          fundingSource: { label: 'Atlas Bank' },
          scheduledAt: '2024-02-20T12:00:00.000Z',
        },
      ];

      render(
        <TransferMovesPanel
          transfers={transfers}
          onCreate={onCreate}
          onSelectTransfer={onSelectTransfer}
        />,
      );

      const transferButtons = screen.getAllByRole('button', { name: /transfer/i });
      expect(transferButtons[0]).toHaveAccessibleName(/25 feb/i);

      await user.click(screen.getByRole('button', { name: /^schedule$/i }));
      expect(onCreate).toHaveBeenCalled();

      await user.click(transferButtons[0]);
      expect(onSelectTransfer).toHaveBeenCalledWith(transfers[0]);
    });
  });

  describe('TransferRulesPanel', () => {
    it('offers controls to manage transfer rules with active rules leading', async () => {
      const onCreate = vi.fn();
      const onEdit = vi.fn();
      const onArchive = vi.fn();
      const onRestore = vi.fn();
      const onRemove = vi.fn();
      const user = createUser();

      const rules = [
        {
          id: 'rule-1',
          name: 'Weekly payout',
          transferType: 'payout',
          cadence: 'weekly',
          thresholdAmount: 500,
          currencyCode: 'USD',
          executionDay: 5,
          fundingSource: { label: 'Atlas Bank' },
          status: 'active',
        },
        {
          id: 'rule-2',
          name: 'Paused reserve',
          transferType: 'escrow_reserve',
          cadence: 'monthly',
          thresholdAmount: 750,
          currencyCode: 'USD',
          executionDay: null,
          fundingSource: { label: 'Atlas Bank' },
          status: 'paused',
        },
      ];

      render(
        <TransferRulesPanel
          rules={rules}
          onCreate={onCreate}
          onEdit={onEdit}
          onArchive={onArchive}
          onRestore={onRestore}
          onRemove={onRemove}
        />,
      );

      const ruleHeadings = screen.getAllByRole('heading', { level: 4 });
      expect(ruleHeadings[0]).toHaveTextContent('Weekly payout');

      await user.click(screen.getByRole('button', { name: /new rule/i }));
      expect(onCreate).toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: /pause weekly payout/i }));
      expect(onArchive).toHaveBeenCalledWith(rules[0]);

      await user.click(screen.getByRole('button', { name: /resume paused reserve/i }));
      expect(onRestore).toHaveBeenCalledWith(rules[1]);

      await user.click(screen.getByRole('button', { name: /remove paused reserve/i }));
      expect(onRemove).toHaveBeenCalledWith(rules[1]);

      await user.click(screen.getByRole('button', { name: /edit weekly payout/i }));
      expect(onEdit).toHaveBeenCalledWith(rules[0]);
    });
  });
});
