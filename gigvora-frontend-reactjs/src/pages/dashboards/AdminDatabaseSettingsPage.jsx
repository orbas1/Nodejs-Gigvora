import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import useSession from '../../hooks/useSession.js';
import DatabaseConnectionList from '../../components/admin/database/DatabaseConnectionList.jsx';
import DatabaseConnectionEditor from '../../components/admin/database/DatabaseConnectionEditor.jsx';
import { ADMIN_DASHBOARD_MENU_SECTIONS } from '../../constants/adminDashboardMenu.js';
import { DATABASE_STATUS_STYLES } from '../../constants/databaseStatusStyles.js';
import {
  listDatabaseConnections,
  getDatabaseConnection,
  createDatabaseConnection,
  updateDatabaseConnection,
  deleteDatabaseConnection,
  testDatabaseConnection,
} from '../../services/databaseSettings.js';
import { deriveAdminAccess } from '../../utils/adminAccess.js';

const AVAILABLE_DASHBOARDS = ['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter'];

function buildErrorMessage(error) {
  if (!error) {
    return '';
  }
  if (error.body?.message) {
    return error.body.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error encountered. Please try again.';
}

export default function AdminDatabaseSettingsPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const { hasAdminAccess } = useMemo(() => deriveAdminAccess(session), [session]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connections, setConnections] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ environment: '', role: '', status: '' });
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [editorMode, setEditorMode] = useState('create');
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorTesting, setEditorTesting] = useState(false);
  const [editorStatus, setEditorStatus] = useState('');
  const [editorError, setEditorError] = useState('');

  const loadConnections = useCallback(async () => {
    if (!hasAdminAccess) {
      setConnections([]);
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await listDatabaseConnections();
      setConnections(Array.isArray(response?.items) ? response.items : []);
      setSummary(response?.summary ?? null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [hasAdminAccess]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const environmentOptions = useMemo(() => {
    return Array.from(new Set(connections.map((connection) => connection.environment).filter(Boolean))).sort();
  }, [connections]);

  const roleOptions = useMemo(() => {
    return Array.from(new Set(connections.map((connection) => connection.role).filter(Boolean))).sort();
  }, [connections]);

  const statusSummary = useMemo(() => summary?.byStatus ?? {}, [summary]);

  const handleMenuItemSelect = useCallback(
    (itemId, item) => {
      if (item?.href) {
        navigate(item.href);
        return;
      }
      const targetId = item?.sectionId ?? item?.targetId ?? itemId;
      if (targetId && typeof document !== 'undefined') {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [navigate],
  );

  const resetEditorToCreate = useCallback(() => {
    setEditorMode('create');
    setSelectedConnection(null);
    setEditorStatus('');
    setEditorError('');
  }, []);

  const handleFiltersChange = useCallback((nextFilters) => {
    setFilters(nextFilters);
  }, []);

  const handleSelectConnection = useCallback(
    async (connection) => {
      if (!connection) {
        resetEditorToCreate();
        return;
      }

      setEditorMode('edit');
      setEditorStatus('');
      setEditorError('');
      try {
        const detail = await getDatabaseConnection(connection.id, { includeSecret: true });
        setSelectedConnection(detail);
      } catch (err) {
        setEditorError(buildErrorMessage(err));
        setSelectedConnection({ ...connection, password: '' });
      }
    },
    [resetEditorToCreate],
  );

  const handleCreateConnection = useCallback(() => {
    resetEditorToCreate();
  }, [resetEditorToCreate]);

  const handleSubmit = useCallback(
    async (payload) => {
      setEditorSaving(true);
      setEditorError('');
      setEditorStatus('');
      try {
        if (editorMode === 'edit' && selectedConnection?.id) {
          const response = await updateDatabaseConnection(selectedConnection.id, payload);
          setEditorStatus('Connection updated successfully.');
          await loadConnections();
          try {
            const detail = await getDatabaseConnection(response.id, { includeSecret: true });
            setSelectedConnection(detail);
          } catch (detailError) {
            setEditorError(buildErrorMessage(detailError));
          }
        } else {
          await createDatabaseConnection(payload);
          setEditorStatus('Connection created successfully.');
          await loadConnections();
          resetEditorToCreate();
        }
      } catch (err) {
        setEditorError(buildErrorMessage(err));
      } finally {
        setEditorSaving(false);
      }
    },
    [editorMode, selectedConnection, loadConnections, resetEditorToCreate],
  );

  const handleTestConnection = useCallback(
    async (payload = {}) => {
      setEditorTesting(true);
      setEditorError('');
      setEditorStatus('');
      try {
        let effectivePayload = { ...payload };
        if (!effectivePayload.connectionId && selectedConnection?.id) {
          effectivePayload.connectionId = selectedConnection.id;
        }

        if (
          effectivePayload.connectionId &&
          (!effectivePayload.host || !effectivePayload.username || !effectivePayload.database || !effectivePayload.password)
        ) {
          const detail = await getDatabaseConnection(effectivePayload.connectionId, { includeSecret: true });
          effectivePayload = {
            ...detail,
            ...effectivePayload,
            password: effectivePayload.password || detail.password,
          };
          setSelectedConnection(detail);
          setEditorMode('edit');
        }

        if (!effectivePayload.password) {
          throw new Error('Password is required to test this connection.');
        }

        const requiredFields = ['host', 'port', 'database', 'username', 'dialect', 'environment', 'role'];
        const missing = requiredFields.filter((field) => !effectivePayload[field]);
        if (missing.length > 0) {
          throw new Error(`Missing required fields: ${missing.join(', ')}.`);
        }

        const testPayload = {
          connectionId: effectivePayload.connectionId,
          name: effectivePayload.name,
          environment: effectivePayload.environment,
          role: effectivePayload.role,
          dialect: effectivePayload.dialect,
          host: effectivePayload.host,
          port: effectivePayload.port,
          database: effectivePayload.database,
          username: effectivePayload.username,
          password: effectivePayload.password,
          sslMode: effectivePayload.sslMode,
          options: effectivePayload.options,
        };

        const result = await testDatabaseConnection(testPayload);
        const statusMeta = DATABASE_STATUS_STYLES[result.status] ?? DATABASE_STATUS_STYLES.unknown;
        setEditorStatus(`Test completed: ${statusMeta.label}.`);
        if (result.error) {
          setEditorError(result.error);
        }
        if (result.connection) {
          const preservedPassword = effectivePayload.password ?? selectedConnection?.password ?? '';
          setSelectedConnection({ ...result.connection, password: preservedPassword });
        }
        await loadConnections();
      } catch (err) {
        setEditorError(buildErrorMessage(err));
      } finally {
        setEditorTesting(false);
      }
    },
    [selectedConnection, loadConnections],
  );

  const handleDeleteConnection = useCallback(
    async (connection) => {
      if (!connection?.id) {
        return;
      }
      const confirmed = window.confirm(
        `Delete connection “${connection.name}”? This will revoke access for any services using this profile.`,
      );
      if (!confirmed) {
        return;
      }
      try {
        await deleteDatabaseConnection(connection.id);
        setEditorStatus('Connection removed.');
        if (selectedConnection?.id === connection.id) {
          resetEditorToCreate();
        }
        await loadConnections();
      } catch (err) {
        setEditorError(buildErrorMessage(err));
      }
    },
    [selectedConnection, resetEditorToCreate, loadConnections],
  );

  const listErrorMessage = buildErrorMessage(error);

  if (!hasAdminAccess) {
    return (
      <DashboardLayout
        currentDashboard="admin"
        title="Database settings"
        subtitle="Provision primary clusters, rotate credentials, and monitor connection health."
        menuSections={ADMIN_DASHBOARD_MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="admin-database-settings"
        onMenuItemSelect={handleMenuItemSelect}
      >
        <AccessDeniedPanel
          role="admin"
          availableDashboards={AVAILABLE_DASHBOARDS.filter((dashboard) => dashboard !== 'admin')}
          onNavigate={(href) => navigate(href)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Database settings"
      subtitle="Provision primary clusters, rotate credentials, and monitor connection health."
      menuSections={ADMIN_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem="admin-database-settings"
      onMenuItemSelect={handleMenuItemSelect}
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {listErrorMessage ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {listErrorMessage}
            </div>
          ) : null}
          <DatabaseConnectionList
            connections={connections}
            loading={loading}
            selectedId={selectedConnection?.id ?? null}
            onSelect={handleSelectConnection}
            onDelete={handleDeleteConnection}
            onTest={(connection) => handleTestConnection({ connectionId: connection.id })}
            onRefresh={loadConnections}
            onCreateNew={handleCreateConnection}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            environmentOptions={environmentOptions}
            roleOptions={roleOptions}
          />
        </div>
        <div className="xl:col-span-1">
          <DatabaseConnectionEditor
            mode={editorMode}
            connection={selectedConnection}
            onSubmit={handleSubmit}
            onTest={handleTestConnection}
            onCancel={resetEditorToCreate}
            saving={editorSaving}
            testing={editorTesting}
            statusMessage={editorStatus}
            errorMessage={editorError}
          />
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status overview</p>
            <ul className="mt-3 space-y-2">
              {Object.entries({
                healthy: 'Healthy',
                warning: 'Slow',
                error: 'Error',
                unknown: 'Unknown',
              }).map(([key, label]) => (
                <li key={key} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {summary ? summary.byStatus?.[key] ?? 0 : statusSummary[key] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
