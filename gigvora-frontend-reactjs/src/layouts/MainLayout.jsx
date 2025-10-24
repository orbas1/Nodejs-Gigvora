import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import MessagingDock from '../components/messaging/MessagingDock.jsx';
import PolicyAcknowledgementBanner from '../components/policy/PolicyAcknowledgementBanner.jsx';
import useSession from '../hooks/useSession.js';
import ChatwootWidget from '../components/support/ChatwootWidget.jsx';
import SupportLauncher from '../components/support/SupportLauncher.jsx';
import { LayoutProvider, useLayout } from '../context/LayoutContext.jsx';
import AppErrorBoundary from '../components/routing/AppErrorBoundary.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';

function ShellErrorFallback({ error, onRetry }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-16">
      <div className="max-w-lg rounded-3xl border border-rose-200 bg-rose-50 px-6 py-8 text-rose-700 shadow-soft">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm">
          {error?.message ?? 'The workspace shell failed to render. Try again or reach out to support if the issue persists.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
          >
            Try again
          </button>
          <a
            href="/support"
            className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:text-rose-800"
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}

ShellErrorFallback.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  onRetry: PropTypes.func.isRequired,
};

ShellErrorFallback.defaultProps = {
  error: null,
};

function LayoutChrome() {
  const { isAuthenticated } = useSession();
  const { isDesktop } = useLayout();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <div className="gv-shell-background">
        <div className="gv-shell-overlay-primary" />
        {isDesktop ? <div className="gv-shell-overlay-desktop" /> : null}
        <div className="relative z-10 flex min-h-screen flex-col">
          <Header />
          <main id="main-content" className="flex-1" tabIndex={-1}>
            <AppErrorBoundary fallback={ShellErrorFallback}>
              <Outlet />
            </AppErrorBoundary>
          </main>
          {!isAuthenticated ? <Footer /> : null}
        </div>
      </div>
      {isAuthenticated ? <MessagingDock /> : null}
      <PolicyAcknowledgementBanner />
      {isAuthenticated ? <ChatwootWidget /> : null}
      <SupportLauncher />
    </>
  );
}

export default function MainLayout() {
  return (
    <ToastProvider>
      <LayoutProvider>
        <LayoutChrome />
      </LayoutProvider>
    </ToastProvider>
  );
}
