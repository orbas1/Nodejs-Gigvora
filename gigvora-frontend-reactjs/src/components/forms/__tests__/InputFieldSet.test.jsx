import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputFieldSet from '../InputFieldSet.jsx';

describe('InputFieldSet', () => {
  it('renders label, optional indicator, helper text, and prefix/suffix affordances', async () => {
    const user = userEvent.setup();

    render(
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
    render(
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

    render(
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
    await user.type(textarea, 'Future ready');
    expect(screen.getByText('12/100')).toBeInTheDocument();
  });
});
