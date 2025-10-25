import '../src/index.css';
import { LanguageProvider } from '../src/context/LanguageContext.jsx';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const decorators = [
  (Story) => (
    <LanguageProvider>
      <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
        <Story />
      </div>
    </LanguageProvider>
  ),
];
