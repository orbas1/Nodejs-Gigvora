import { createContext, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

const lightNavigationTheme = {
  tone: 'light',
  button: {
    base: 'text-slate-600 hover:text-slate-900 focus-visible:ring-accent focus-visible:ring-offset-white',
    open: 'text-slate-900',
    icon: 'text-slate-400',
    iconOpen: 'text-slate-900',
  },
  panel: {
    container: 'border-slate-200 bg-white/95',
    heading: 'text-slate-400',
    description: 'text-slate-600',
    item: 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900',
    itemHeading: 'text-slate-900',
    itemDescription: 'text-slate-500',
    itemIcon: 'text-accent group-hover:text-accent-strong',
    divider: 'border-slate-200/60',
  },
};

const darkNavigationTheme = {
  tone: 'dark',
  button: {
    base: 'text-slate-200 hover:text-white focus-visible:ring-accent focus-visible:ring-offset-slate-900',
    open: 'text-white',
    icon: 'text-slate-400',
    iconOpen: 'text-white',
  },
  panel: {
    container: 'border-slate-700 bg-slate-900/95',
    heading: 'text-slate-400',
    description: 'text-slate-300',
    item: 'border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white',
    itemHeading: 'text-white',
    itemDescription: 'text-slate-400',
    itemIcon: 'text-accent group-hover:text-accent-strong',
    divider: 'border-white/10',
  },
};

const NavigationThemeContext = createContext(lightNavigationTheme);

export function NavigationThemeProvider({ value, children }) {
  const theme = useMemo(() => {
    if (!value) {
      return lightNavigationTheme;
    }
    return {
      tone: value.tone ?? lightNavigationTheme.tone,
      button: {
        ...lightNavigationTheme.button,
        ...(value.button ?? {}),
      },
      panel: {
        ...lightNavigationTheme.panel,
        ...(value.panel ?? {}),
      },
    };
  }, [value]);

  return <NavigationThemeContext.Provider value={theme}>{children}</NavigationThemeContext.Provider>;
}

NavigationThemeProvider.propTypes = {
  value: PropTypes.shape({
    tone: PropTypes.string,
    button: PropTypes.shape({
      base: PropTypes.string,
      open: PropTypes.string,
      icon: PropTypes.string,
      iconOpen: PropTypes.string,
    }),
    panel: PropTypes.shape({
      container: PropTypes.string,
      heading: PropTypes.string,
      description: PropTypes.string,
      item: PropTypes.string,
      itemHeading: PropTypes.string,
      itemDescription: PropTypes.string,
      itemIcon: PropTypes.string,
      divider: PropTypes.string,
    }),
  }),
  children: PropTypes.node.isRequired,
};

NavigationThemeProvider.defaultProps = {
  value: lightNavigationTheme,
};

export function useNavigationTheme() {
  return useContext(NavigationThemeContext);
}

export { lightNavigationTheme, darkNavigationTheme };

export default NavigationThemeContext;
