import { describe, expect, it } from 'vitest';
import {
  formatStatus,
  formatPercent,
  formatCurrency,
  formatDateForDisplay,
  formatDateForInput,
  formatBytes,
  parseNumber,
  parseTagInput,
  validateCreateForm,
} from '../DeliveryOperationsSection.jsx';

describe('DeliveryOperationsSection helpers', () => {
  it('normalises status labels into title case', () => {
    expect(formatStatus('in_progress')).toBe('In Progress');
    expect(formatStatus('')).toBe('Unknown');
  });

  it('formats percentages, currency, and dates consistently', () => {
    expect(formatPercent('42.4')).toBe('42%');
    expect(formatCurrency(12000, 'USD')).toMatch(/12,000/);
    expect(formatDateForDisplay('2024-04-10T00:00:00.000Z')).toMatch(/Apr/);
    expect(formatDateForInput('2024-04-10T00:00:00.000Z')).toBe('2024-04-10');
  });

  it('formats bytes and parses numeric fields defensively', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(parseNumber('123')).toBe(123);
    expect(parseNumber('not-a-number')).toBeNull();
  });

  it('parses tag input across comma, slash, and hash delimiters', () => {
    expect(parseTagInput('alpha, beta/#gamma')).toEqual(['alpha', 'beta', 'gamma']);
    expect(parseTagInput(['focus', '  retention  '])).toEqual(['focus', 'retention']);
  });

  it('validates project creation forms with actionable feedback', () => {
    const invalid = validateCreateForm({
      title: '  ',
      description: 'Too short',
      budgetAllocated: '-10',
      startDate: '2024-04-10',
      dueDate: '2024-04-05',
      progressPercent: '120',
      workspaceUrl: 'not-a-url',
      coverImageUrl: 'also-bad',
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toMatchObject({
      title: expect.any(String),
      description: expect.any(String),
      budgetAllocated: expect.any(String),
      dueDate: expect.any(String),
      progressPercent: expect.any(String),
      workspaceUrl: expect.any(String),
      coverImageUrl: expect.any(String),
    });

    const valid = validateCreateForm({
      title: 'New project launch',
      description: 'Plan, execute, and launch the new workspace for the client.',
      budgetAllocated: '15000',
      startDate: '2024-04-01',
      dueDate: '2024-04-15',
      progressPercent: '25',
      workspaceUrl: 'https://workspace.example.com/project',
      coverImageUrl: 'https://cdn.example.com/project-cover.png',
    });

    expect(valid.valid).toBe(true);
    expect(valid.errors).toEqual({});
  });
});
