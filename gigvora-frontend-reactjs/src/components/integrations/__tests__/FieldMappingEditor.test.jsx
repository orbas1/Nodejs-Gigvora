import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FieldMappingEditor from '../FieldMappingEditor.jsx';

describe('FieldMappingEditor', () => {
  it('renders an empty state and allows adding a new mapping row', () => {
    const onChange = vi.fn();

    render(<FieldMappingEditor value={[]} onChange={onChange} templates={[]} />);

    expect(screen.getByText('No mappings defined yet.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add mapping/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [nextValue] = onChange.mock.calls[0];
    expect(Array.isArray(nextValue)).toBe(true);
    expect(nextValue).toHaveLength(1);
    expect(nextValue[0]).toMatchObject({ externalObject: '', localObject: '', mapping: {} });
  });

  it('loads template rows when available', () => {
    const onChange = vi.fn();

    render(
      <FieldMappingEditor
        value={[]}
        onChange={onChange}
        templates={[
          {
            id: 'template-map',
            externalObject: 'Account',
            localObject: 'Client',
            mapping: { email: 'Email__c' },
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /load template/i }));

    expect(onChange).toHaveBeenCalledWith([
      {
        id: 'template-map',
        externalObject: 'Account',
        localObject: 'Client',
        mapping: { email: 'Email__c' },
      },
    ]);
  });
});
