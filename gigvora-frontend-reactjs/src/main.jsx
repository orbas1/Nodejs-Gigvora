import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import { SessionProvider } from './context/SessionContext.jsx';
import { MessagingProvider } from './context/MessagingContext.jsx';
import { NavigationChromeProvider } from './context/NavigationChromeContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { ThemeProvider } from './context/ThemeProvider.tsx';
import { DesignSystemProvider } from './context/DesignSystemContext.jsx';
import { DataFetchingProvider } from './context/DataFetchingLayer.jsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const isStandaloneAdminProfile = import.meta.env.VITE_STANDALONE_ADMIN_PROFILE === 'true';

if (!googleClientId) {
  // eslint-disable-next-line no-console
  console.warn('VITE_GOOGLE_CLIENT_ID is not configured. Google login will be disabled.');
}

async function bootstrap() {
  try {
    const { default: AppComponent } = isStandaloneAdminProfile
      ? await import('./pages/admin/AdminProfileManagementPage.jsx')
      : await import('./App.jsx');

    const container = document.getElementById('root');
    if (!container) {
      throw new Error('Unable to find application root element with id "root".');
    }

    const root = ReactDOM.createRoot(container);

    const OAuthProvider = googleClientId
      ? GoogleOAuthProvider
      : ({ children }) => <>{children}</>;

    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <OAuthProvider clientId={googleClientId}>
            <NavigationChromeProvider>
              <LanguageProvider>
                <SessionProvider>
                  <DesignSystemProvider>
                    <ThemeProvider>
                      <DataFetchingProvider>
                        <MessagingProvider>
                          <AppComponent />
                        </MessagingProvider>
                      </DataFetchingProvider>
                    </ThemeProvider>
                  </DesignSystemProvider>
                </SessionProvider>
              </LanguageProvider>
            </NavigationChromeProvider>
          </OAuthProvider>
        </BrowserRouter>
      </React.StrictMode>,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to bootstrap Gigvora web application', error);
  }
}

bootstrap();
