import { Outlet } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import MessagingDock from '../components/messaging/MessagingDock.jsx';
import PolicyAcknowledgementBanner from '../components/policy/PolicyAcknowledgementBanner.jsx';
import useSession from '../hooks/useSession.js';

export default function MainLayout() {
  const { isAuthenticated } = useSession();

  return (
    <>
      <div className="relative min-h-screen bg-gradient-to-b from-white via-white to-surfaceMuted text-slate-900">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_60%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/4 bg-[radial-gradient(circle_at_top_right,_rgba(219,234,254,0.7),_transparent_65%)] lg:block" />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          {!isAuthenticated ? <Footer /> : null}
        </div>
      </div>
      <MessagingDock />
      <PolicyAcknowledgementBanner />
    </>
  );
}
