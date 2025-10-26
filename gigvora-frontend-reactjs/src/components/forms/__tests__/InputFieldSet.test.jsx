import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import InputFieldSet from '../InputFieldSet.jsx';
import { ComponentTokenProvider } from '../../../context/ComponentTokenContext.jsx';

describe('InputFieldSet', () => {
  function renderWithTokens(ui, { tokens } = {}) {
    return render(<ComponentTokenProvider tokens={tokens}>{ui}</ComponentTokenProvider>);
  }

  it('renders label, optional indicator, helper text, and prefix/suffix affordances', async () => {
    const user = userEvent.setup();

    renderWithTokens(
      <InputFieldSet
        label="Website"
        name="website"
        helperText="Use a secure https link."
        prefix="https://"
        suffix=".com"
        leadingVisual={<span data-testid="leading">🌐</span>}
        trailingVisual={<span data-testid="trailing">↗</span>}
      />,
    );

    expect(screen.getByText('Website')).toBeInTheDocument();
    expect(screen.getByText(/optional/i)).toBeInTheDocument();
    expect(screen.getByText(/use a secure/i)).toBeInTheDocument();
    expect(screen.getByText('https://')).toBeInTheDocument();
    expect(screen.getByText('.com')).toBeInTheDocument();
    expect(screen.getByTestId('leading')).toBeInTheDocument();
    expect(screen.getByTestId('trailing')).toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: /website/i });
    await user.type(input, 'gigvora');
    expect(input).toHaveValue('gigvora');
  });

  it('surfaces error state with accessible messaging and aria-invalid', () => {
    renderWithTokens(
      <InputFieldSet
        label="Email"
        name="email"
        required
        status="error"
        error="Enter a valid company email"
        helperText="We will share updates here."
      />,
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/valid company email/i)).toBeInTheDocument();
    expect(screen.getByText(/share updates/i)).toBeInTheDocument();
  });

  it('supports multiline entries with character counter feedback', async () => {
    const user = userEvent.setup();

    renderWithTokens(
      <InputFieldSet
        label="Overview"
        name="overview"
        multiline
        rows={3}
        maxLength={100}
        showCounter
      />,
    );

    const textarea = screen.getByRole('textbox', { name: /overview/i });
    await act(async () => {
      await user.type(textarea, 'Future ready');
    });
    expect(screen.getByText('12/100')).toBeInTheDocument();
  });

  it('applies provider overrides to shell styling', () => {
    renderWithTokens(
      <InputFieldSet label="Name" name="name" />, {
        tokens: {
          inputFieldSet: {
            shell: 'rounded-lg border-2 border-emerald-300',
          },
        },
      },
    );

    const wrapper = screen.getByRole('textbox', { name: /name/i }).closest('div');
    expect(wrapper).toHaveClass('border-emerald-300');
  });
});
