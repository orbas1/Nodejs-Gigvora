import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DesignSystemProvider, useDesignSystem } from '../DesignSystemContext.jsx';

function wrapperFactory() {
  return ({ children }) => (
    <DesignSystemProvider disablePersistence autoHydrateTokens={false}>
      {children}
    </DesignSystemProvider>
  );
}

describe('DesignSystemProvider', () => {
  it('merges theme and component token contexts', () => {
    const { result } = renderHook(() => useDesignSystem(), {
      wrapper: wrapperFactory(),
    });

    expect(result.current.theme.mode).toBe('light');
    expect(result.current.themeTokens.spacingPx.md).toBeGreaterThan(0);
    expect(result.current.themeCssVariables['--gv-color-accent']).toBeDefined();
    expect(result.current.themeSnapshot.mode).toBe('light');
    expect(result.current.themeSnapshot.cssVariables['--gv-color-accent']).toBeDefined();
    expect(result.current.componentTokens.buttonSuite).toBeDefined();
  });
});
