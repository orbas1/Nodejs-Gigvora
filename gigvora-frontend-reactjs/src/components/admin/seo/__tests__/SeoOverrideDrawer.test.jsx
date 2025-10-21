import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SeoOverrideDrawer from '../SeoOverrideDrawer.jsx';

describe('SeoOverrideDrawer', () => {
  let user;

  const pasteJson = async (input, value) => {
    await act(async () => {
      input.focus();
      fireEvent.paste(input, {
        clipboardData: {
          getData: (type) => (type === 'text/plain' || type === 'text' ? value : ''),
          types: ['text/plain'],
        },
      });
      fireEvent.change(input, { target: { value } });
    });
  };

  beforeEach(() => {
    user = userEvent.setup({ applyAcceptDefaultUnhandledRejections: false });
  });

  it('normalises the payload before saving', async () => {
    const handleSave = vi.fn();

    render(
      <SeoOverrideDrawer
        open
        onSave={handleSave}
        onClose={() => {}}
        existingPaths={['/existing']}
      />,
    );

    const pathInput = screen.getByLabelText('Path or canonical URL');
    await act(async () => {
      await user.clear(pathInput);
      await user.type(pathInput, 'enterprise');
      const titleInput = screen.getByLabelText('Meta title');
      await user.type(titleInput, 'Enterprise plan');
    });

    const structuredDataInput = screen.getByLabelText('Structured data (JSON-LD)');
    await act(async () => {
      await user.clear(structuredDataInput);
    });
    await pasteJson(structuredDataInput, '{"@type":"SoftwareApplication"}');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Save override' }));
    });

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalled();
    });

    const payload = handleSave.mock.calls[0][0];
    expect(payload.path).toBe('/enterprise');
    expect(payload.title).toBe('Enterprise plan');
    expect(payload.structuredData).toEqual({
      customJson: {
        '@type': 'SoftwareApplication',
      },
    });
  });

  it('prevents saving when structured data JSON is invalid', async () => {
    const handleSave = vi.fn();

    render(<SeoOverrideDrawer open onSave={handleSave} onClose={() => {}} />);

    const structuredDataInput = screen.getByLabelText('Structured data (JSON-LD)');
    await act(async () => {
      await user.clear(structuredDataInput);
    });
    await pasteJson(structuredDataInput, '{"broken":');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Save override' }));
    });

    expect(
      await screen.findByText('Structured data JSON is invalid.'),
    ).toBeInTheDocument();
    expect(handleSave).not.toHaveBeenCalled();
  });
});
