import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ComponentTokenProvider, ComponentTokenHydrator, useComponentTokens } from '../ComponentTokenContext.jsx';

function ButtonVariantProbe() {
  const { tokens } = useComponentTokens('buttonSuite');
  return <div data-testid="variant-class" data-class={tokens.variants.primary.class} />;
}

function HydratorProbe() {
  const { tokens, status } = useComponentTokens('buttonSuite');
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="class">{tokens.variants.primary.class}</span>
    </div>
  );
}

describe('ComponentTokenContext', () => {
  it('merges override tokens from provider', () => {
    render(
      <ComponentTokenProvider
        tokens={{
          buttonSuite: { variants: { primary: { class: 'bg-lime-600 text-white' } } },
        }}
      >
        <ButtonVariantProbe />
      </ComponentTokenProvider>,
    );

    expect(screen.getByTestId('variant-class').dataset.class).toBe('bg-lime-600 text-white');
  });

  it('hydrates tokens from a remote loader', async () => {
    const loader = vi.fn().mockResolvedValue({
      componentProfiles: [
        {
          componentKey: 'buttonSuite',
          definition: {
            variants: { primary: { class: 'bg-amber-500 text-white' } },
          },
          metadata: { version: '2025.03' },
        },
      ],
    });

    render(
      <ComponentTokenHydrator autoLoad loader={loader}>
        <HydratorProbe />
      </ComponentTokenHydrator>,
    );

    expect(screen.getByTestId('status').textContent).toBe('loading');

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('ready');
    });

    expect(loader).toHaveBeenCalled();
    expect(screen.getByTestId('class').textContent).toContain('bg-amber-500');
  });
});
