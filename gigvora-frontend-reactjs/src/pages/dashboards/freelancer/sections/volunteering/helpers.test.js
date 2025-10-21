import {
  DEFAULT_APPLICATION,
  DEFAULT_CONTRACT,
  DEFAULT_RESPONSE,
  DEFAULT_SPEND,
  fromDateInput,
  formatCurrency,
  formatDate,
  formatHours,
  parseAttachmentList,
  parseSkills,
  serialiseAttachments,
  serialiseSkills,
  toDateInput,
} from './helpers.js';
import { describe, expect, it } from 'vitest';

function buildFormatter(options) {
  return new Intl.DateTimeFormat('en-US', options);
}

describe('volunteering helpers', () => {
  it('provides default object shapes that can be cloned safely', () => {
    expect(structuredClone(DEFAULT_APPLICATION)).toMatchObject({
      remoteFriendly: true,
      status: 'draft',
    });
    expect(structuredClone(DEFAULT_RESPONSE)).toMatchObject({
      status: 'awaiting_reply',
      attachments: [],
    });
    expect(structuredClone(DEFAULT_CONTRACT)).toMatchObject({
      currencyCode: 'USD',
      status: 'pending',
    });
    expect(structuredClone(DEFAULT_SPEND)).toMatchObject({
      category: 'other',
      currencyCode: 'USD',
    });
  });

  it('normalises ISO dates for date inputs', () => {
    const isoTimestamp = '2024-01-15T12:30:00.000Z';
    expect(toDateInput(isoTimestamp)).toBe('2024-01-15');
    expect(toDateInput('invalid-date')).toBe('');
    expect(toDateInput(null)).toBe('');
  });

  it('converts date input values back to ISO strings in UTC', () => {
    expect(fromDateInput('2024-01-15')).toBe('2024-01-15T00:00:00.000Z');
    expect(fromDateInput('')).toBeNull();
    expect(fromDateInput('not-a-date')).toBeNull();
  });

  it('formats dates for display with graceful fallbacks', () => {
    const isoDate = '2024-01-15T00:00:00.000Z';
    const expected = buildFormatter({ month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(isoDate));
    expect(formatDate(isoDate)).toBe(expected);
    expect(formatDate('')).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('formats currencies according to locale, falling back to sensible defaults', () => {
    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 2,
    });
    expect(formatCurrency('1234.5', 'GBP')).toBe(currencyFormatter.format(1234.5));
    const usdFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    });
    expect(formatCurrency('not-a-number')).toBe(usdFormatter.format(0));
  });

  it('formats hour totals with at most one decimal place', () => {
    expect(formatHours(12)).toBe('12 hrs');
    expect(formatHours(3.333)).toBe('3.3 hrs');
    expect(formatHours('invalid')).toBe('0 hrs');
  });

  it('serialises and parses skill collections reliably', () => {
    const serialised = serialiseSkills([' Strategy ', 'Leadership']);
    expect(serialised).toBe('Strategy, Leadership');
    expect(parseSkills(serialised)).toEqual(['Strategy', 'Leadership']);
    expect(parseSkills(['Growth', 'Mentoring '])).toEqual(['Growth', 'Mentoring']);
    expect(parseSkills('')).toEqual([]);
  });

  it('serialises and parses attachment references with trimming', () => {
    const attachments = [' https://example.com/brief.pdf ', 'https://example.com/link'];
    const serialised = serialiseAttachments(attachments);
    expect(serialised).toBe('https://example.com/brief.pdf\nhttps://example.com/link');
    expect(parseAttachmentList(serialised)).toEqual([
      'https://example.com/brief.pdf',
      'https://example.com/link',
    ]);
    expect(parseAttachmentList([' https://a ', ''])).toEqual(['https://a']);
    expect(parseAttachmentList('')).toEqual([]);
  });
});
