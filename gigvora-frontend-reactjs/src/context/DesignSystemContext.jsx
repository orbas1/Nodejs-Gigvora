import { createContext, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, useTheme } from './ThemeProvider.tsx';
import {
  ComponentTokenProvider,
  ComponentTokenHydrator,
  useComponentTokenContext,
} from './ComponentTokenContext.jsx';

const DesignSystemContext = createContext(null);

function DesignSystemBridge({ children }) {
  const theme = useTheme();
  const componentContext = useComponentTokenContext();

  const themeSnapshot = useMemo(
    () => ({
      mode: theme.mode,
      preference: theme.preference,
      accent: theme.accent,
      density: theme.density,
      tokens: theme.tokens,
      cssVariables: theme.cssVariables,
    }),
    [theme],
  );

  const value = useMemo(
    () => ({
      theme,
      themeTokens: theme.tokens,
      themeCssVariables: theme.cssVariables,
      themeSnapshot,
      componentTokens: componentContext.tokens,
      componentVersion: componentContext.version,
      componentStatus: componentContext.status,
      refreshComponentTokens: componentContext.refresh,
    }),
    [componentContext, theme, themeSnapshot],
  );

  return <DesignSystemContext.Provider value={value}>{children}</DesignSystemContext.Provider>;
}

DesignSystemBridge.propTypes = {
  children: PropTypes.node.isRequired,
};

export function DesignSystemProvider({
  children,
  autoHydrateTokens = false,
  componentTokens = {},
  componentTokenLoader,
  themeId,
  ...themeProps
}) {
  const ProviderComponent = autoHydrateTokens ? ComponentTokenHydrator : ComponentTokenProvider;
  const providerProps = autoHydrateTokens
    ? { themeId, autoLoad: true, loader: componentTokenLoader }
    : { tokens: componentTokens };

  return (
    <ThemeProvider {...themeProps}>
      <ProviderComponent {...providerProps}>
        <DesignSystemBridge>{children}</DesignSystemBridge>
      </ProviderComponent>
    </ThemeProvider>
  );
}

DesignSystemProvider.propTypes = {
  children: PropTypes.node.isRequired,
  autoHydrateTokens: PropTypes.bool,
  componentTokens: PropTypes.object,
  componentTokenLoader: PropTypes.func,
  themeId: PropTypes.string,
};

export function useDesignSystem() {
  const context = useContext(DesignSystemContext);
  if (!context) {
    throw new Error('useDesignSystem must be used within a DesignSystemProvider');
  }
  return context;
}

export default DesignSystemContext;
