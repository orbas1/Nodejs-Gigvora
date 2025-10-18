import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import CreationStudioWorkspace from '../../components/creationStudio/CreationStudioWorkspace.jsx';
import DataStatus from '../../components/DataStatus.jsx';

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

  const userId = useMemo(() => {
    if (!session) {
      return null;
    }
    return session.userId ?? session.user?.id ?? session.id ?? null;
  }, [session]);

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

  if (!isAuthenticated || !userId) {
    return <DataStatus status="error" message="Sign in to access the creation studio." />;
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
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CreationStudioWorkspace
          userId={userId}
          startFresh={startFresh}
          initialItemId={initialItemId}
        />
      </div>
    </DashboardLayout>
  );
}
