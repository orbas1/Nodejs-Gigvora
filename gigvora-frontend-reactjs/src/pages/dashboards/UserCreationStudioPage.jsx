import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import CreationStudioWorkspace from '../../components/creationStudio/CreationStudioWorkspace.jsx';
import { evaluateCreationAccess } from '../../components/creationStudio/config.js';

const menuSections = [
  {
    label: 'Studio',
    items: [
      {
        id: 'studio-launch',
        name: 'Launch',
        sectionId: 'creation-studio-launch',
      },
      {
        id: 'studio-archive',
        name: 'Archive',
        sectionId: 'creation-studio-archive',
      },
    ],
  },
];

export default function UserCreationStudioPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const access = useMemo(() => evaluateCreationAccess(session), [session]);

  const startFresh = searchParams.get('create') === '1';
  const initialItemParam = searchParams.get('item');
  const initialItemId = initialItemParam && !Number.isNaN(Number(initialItemParam)) ? Number(initialItemParam) : null;

  const handleMenuSelect = (itemId, item) => {
    if (item?.href) {
      navigate(item.href);
      return;
    }
    const targetId = item?.sectionId ?? itemId;
    if (targetId === 'creation-studio-archive' && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('creation-studio:open-archive'));
    }
    if (targetId && typeof document !== 'undefined') {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  let bodyContent = (
    <CreationStudioWorkspace
      ownerId={access.ownerId}
      hasAccess={access.hasAccess}
      startFresh={startFresh}
      initialItemId={initialItemId}
    />
  );

  if (!isAuthenticated || !access.ownerId) {
    bodyContent = (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 text-center text-sm text-slate-600 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Sign in required</h2>
        <p className="mt-2 text-slate-600">Sign in with an eligible account to access the creation studio.</p>
      </div>
    );
  } else if (!access.hasAccess) {
    bodyContent = (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 text-center text-sm text-slate-600 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Creation studio unavailable</h2>
        <p className="mt-2 text-slate-600">
          Your account doesn&apos;t have creation studio access yet. Ask an administrator to enable creator permissions.
        </p>
      </div>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="user"
      title="Studio"
      subtitle="Launch new work"
      menuSections={menuSections}
      availableDashboards={[{ id: 'user', label: 'User', href: '/dashboard/user' }]}
      onMenuItemSelect={handleMenuSelect}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{bodyContent}</div>
    </DashboardLayout>
  );
}
