import AdminMobileAppManagementPanel from '../dashboards/admin/AdminMobileAppManagementPanel.jsx';

export default function AdminMobileAppManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50/40 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <AdminMobileAppManagementPanel standalone />
      </div>
    </div>
  );
}
