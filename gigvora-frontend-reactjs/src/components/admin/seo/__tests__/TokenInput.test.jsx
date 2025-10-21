import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import TokenInput from '../TokenInput.jsx';

function ControlledTokenInput({ initialTokens = [], ...props }) {
  const [tokens, setTokens] = useState(initialTokens);
  return (
    <TokenInput
      label="Keywords"
      tokens={tokens}
      onTokensChange={setTokens}
      {...props}
    />
  );
}

describe('TokenInput', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup({ applyAcceptDefaultUnhandledRejections: false });
  });

  it('adds tokens from keyboard input', async () => {
    render(<ControlledTokenInput initialTokens={['alpha']} />);
    const input = screen.getByRole('textbox');

    await act(async () => {
      await user.type(input, 'beta{enter}');
    });

    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
  });

  it('prevents duplicate tokens', async () => {
    render(<ControlledTokenInput initialTokens={['alpha']} />);
    const input = screen.getByRole('textbox');

    await act(async () => {
      await user.type(input, 'alpha{enter}');
    });

    expect(screen.getAllByText('alpha')).toHaveLength(1);
  });

  it('removes tokens with the dismiss control', async () => {
    render(<ControlledTokenInput initialTokens={['alpha', 'beta']} />);

    const alphaChip = screen.getByText('alpha').closest('span');
    const removeButton = within(alphaChip).getByRole('button', { name: /remove alpha/i });

    await act(async () => {
      await user.click(removeButton);
    });

    expect(screen.queryByText('alpha')).not.toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
  });

  it('enforces the maximum token limit', async () => {
    render(<ControlledTokenInput maxTokens={2} />);
    const input = screen.getByRole('textbox');

    await act(async () => {
      await user.type(input, 'first{enter}');
    });
    await act(async () => {
      await user.type(input, 'second{enter}');
    });
    await act(async () => {
      await user.type(input, 'third{enter}');
    });

    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.queryByText('third')).not.toBeInTheDocument();
  });
});
