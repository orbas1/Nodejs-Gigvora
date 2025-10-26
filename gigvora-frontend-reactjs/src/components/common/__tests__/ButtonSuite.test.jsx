import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ButtonSuite from '../ButtonSuite.jsx';
import { ComponentTokenProvider } from '../../../context/ComponentTokenContext.jsx';

function IconMock({ label }) {
  return <svg aria-hidden focusable="false" data-testid={label} />;
}

function renderWithTokens(ui, { tokens } = {}) {
  return render(<ComponentTokenProvider tokens={tokens}>{ui}</ComponentTokenProvider>);
}

describe('ButtonSuite', () => {
  it('renders variants with icons and responds to clicks', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderWithTokens(
      <ButtonSuite
        variant="primary"
        leadingIcon={<IconMock label="leading" />}
        trailingIcon={<IconMock label="trailing" />}
        onClick={onClick}
      >
        Save changes
      </ButtonSuite>,
    );

    const button = screen.getByRole('button', { name: /save changes/i });
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(screen.getByTestId('leading')).toBeInTheDocument();
    expect(screen.getByTestId('trailing')).toBeInTheDocument();

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner, disables button, and surfaces accessible label', () => {
    renderWithTokens(
      <ButtonSuite loading loadingLabel="Submitting">
        Submit
      </ButtonSuite>,
    );

    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/submitting/i)).toBeInTheDocument();
  });

  it('supports group layout utilities for horizontal and vertical stacks', () => {
    const { rerender } = renderWithTokens(
      <ButtonSuite.Group>
        <ButtonSuite size="sm">Primary</ButtonSuite>
        <ButtonSuite variant="ghost">Ghost</ButtonSuite>
      </ButtonSuite.Group>,
    );

    const group = screen.getByText(/primary/i).closest('div');
    expect(group).toHaveClass('flex');

    rerender(
      <ButtonSuite.Group orientation="vertical" align="end" wrap={false}>
        <ButtonSuite size="sm">Primary</ButtonSuite>
        <ButtonSuite variant="ghost">Ghost</ButtonSuite>
      </ButtonSuite.Group>,
    );

    const updatedGroup = screen.getByText(/primary/i).closest('div');
    expect(updatedGroup).toHaveAttribute('class', expect.stringContaining('flex-col'));
    expect(updatedGroup).toHaveAttribute('class', expect.stringContaining('items-end'));
    expect(updatedGroup).not.toHaveAttribute('class', expect.stringContaining('flex-wrap'));
  });

  it('adopts override tokens from the provider', () => {
    renderWithTokens(<ButtonSuite>Schedule</ButtonSuite>, {
      tokens: {
        buttonSuite: {
          variants: { primary: { class: 'bg-magenta-600 text-white' } },
        },
      },
    });

    expect(screen.getByRole('button', { name: /schedule/i })).toHaveClass('bg-magenta-600');
  });
});
