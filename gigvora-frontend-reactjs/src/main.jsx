import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import { SessionProvider } from './context/SessionContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const isStandaloneAdminProfile = import.meta.env.VITE_STANDALONE_ADMIN_PROFILE === 'true';

if (!googleClientId) {
  // eslint-disable-next-line no-console
  console.warn('VITE_GOOGLE_CLIENT_ID is not configured. Google login will be disabled.');
}

async function bootstrap() {
  const { default: AppComponent } = isStandaloneAdminProfile
    ? await import('./pages/admin/AdminProfileManagementPage.jsx')
    : await import('./App.jsx');

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <GoogleOAuthProvider clientId={googleClientId}>
          <LanguageProvider>
            <SessionProvider>
              <AppComponent />
            </SessionProvider>
          </LanguageProvider>
        </GoogleOAuthProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
}

bootstrap();
