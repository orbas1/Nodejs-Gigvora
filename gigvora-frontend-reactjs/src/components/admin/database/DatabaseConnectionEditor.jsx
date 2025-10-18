import { useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DIALECT_OPTIONS = [
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'mssql', label: 'SQL Server' },
  { value: 'sqlite', label: 'SQLite' },
];

const SSL_MODE_OPTIONS = [
  { value: 'require', label: 'Require (default)' },
  { value: 'prefer', label: 'Prefer' },
  { value: 'verify-ca', label: 'Verify CA' },
  { value: 'verify-full', label: 'Verify full' },
  { value: 'disable', label: 'Disable' },
];

const DEFAULT_FORM = {
  name: '',
  description: '',
  environment: 'production',
  role: 'primary',
  dialect: 'postgres',
  host: '',
  port: 5432,
  database: '',
  username: '',
  password: '',
  sslMode: 'require',
  allowedRolesInput: '',
  isPrimary: true,
  readOnly: false,
  options: {
    poolMin: '',
    poolMax: '',
    idleTimeoutMs: '',
    connectionTimeoutMs: '',
    maxLifetimeMs: '',
    replicaLagThresholdMs: '',
  },
};

function normaliseAllowedRolesInput(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return '';
  }
  return roles.join(', ');
}

function parseInteger(value) {
  if (value === '' || value == null) {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export default function DatabaseConnectionEditor({
  mode = 'create',
  connection = null,
  onSubmit,
  onTest,
  onCancel,
  saving = false,
  testing = false,
  statusMessage = '',
  errorMessage = '',
}) {
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [validationError, setValidationError] = useState('');
  const isEditMode = mode === 'edit' && connection;

  useEffect(() => {
    if (isEditMode) {
      setFormState({
        name: connection.name ?? '',
        description: connection.description ?? '',
        environment: connection.environment ?? 'production',
        role: connection.role ?? 'primary',
        dialect: connection.dialect ?? 'postgres',
        host: connection.host ?? '',
        port: connection.port ?? 5432,
        database: connection.database ?? '',
        username: connection.username ?? '',
        password: '',
        sslMode: connection.sslMode ?? 'require',
        allowedRolesInput: normaliseAllowedRolesInput(connection.allowedRoles ?? []),
        isPrimary: Boolean(connection.isPrimary),
        readOnly: Boolean(connection.readOnly),
        options: {
          poolMin: connection.options?.poolMin ?? '',
          poolMax: connection.options?.poolMax ?? '',
          idleTimeoutMs: connection.options?.idleTimeoutMs ?? '',
          connectionTimeoutMs: connection.options?.connectionTimeoutMs ?? '',
          maxLifetimeMs: connection.options?.maxLifetimeMs ?? '',
          replicaLagThresholdMs: connection.options?.replicaLagThresholdMs ?? '',
        },
      });
      setValidationError('');
    } else {
      setFormState(DEFAULT_FORM);
      setValidationError('');
    }
  }, [isEditMode, connection]);

  const allowedRoles = useMemo(() => {
    return formState.allowedRolesInput
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }, [formState.allowedRolesInput]);

  const handleChange = (field) => (event) => {
    const { value, type, checked } = event.target;
    setFormState((previous) => ({
      ...previous,
      [field]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleOptionsChange = (field) => (event) => {
    const { value } = event.target;
    setFormState((previous) => ({
      ...previous,
      options: {
        ...previous.options,
        [field]: value,
      },
    }));
  };

  const buildPayload = () => {
    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim(),
      environment: formState.environment.trim(),
      role: formState.role.trim(),
      dialect: formState.dialect,
      host: formState.host.trim(),
      port: parseInteger(formState.port),
      database: formState.database.trim(),
      username: formState.username.trim(),
      sslMode: formState.sslMode,
      allowedRoles,
      isPrimary: Boolean(formState.isPrimary),
      readOnly: Boolean(formState.readOnly),
      options: {
        poolMin: parseInteger(formState.options.poolMin),
        poolMax: parseInteger(formState.options.poolMax),
        idleTimeoutMs: parseInteger(formState.options.idleTimeoutMs),
        connectionTimeoutMs: parseInteger(formState.options.connectionTimeoutMs),
        maxLifetimeMs: parseInteger(formState.options.maxLifetimeMs),
        replicaLagThresholdMs: parseInteger(formState.options.replicaLagThresholdMs),
      },
    };

    if (formState.password && formState.password.trim().length > 0) {
      payload.password = formState.password.trim();
    }

    return payload;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setValidationError('');

    const payload = buildPayload();
    const missing = [];
    if (!payload.name) missing.push('name');
    if (!payload.environment) missing.push('environment');
    if (!payload.role) missing.push('role');
    if (!payload.host) missing.push('host');
    if (!payload.port) missing.push('port');
    if (!payload.database) missing.push('database');
    if (!payload.username) missing.push('username');
    if (!isEditMode && !formState.password) missing.push('password');

    if (missing.length > 0) {
      setValidationError(`Please provide: ${missing.join(', ')}.`);
      return;
    }

    if (typeof onSubmit === 'function') {
      onSubmit(payload, { resetPassword: Boolean(formState.password) });
    }
  };

  const handleTest = async () => {
    setValidationError('');
    const payload = buildPayload();
    if (!payload.password && !isEditMode) {
      setValidationError('Password is required to test a new connection.');
      return;
    }
    if (typeof onTest === 'function') {
      onTest({
        ...payload,
        connectionId: isEditMode ? connection?.id : undefined,
        password: formState.password || connection?.password,
      });
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {isEditMode ? 'Edit connection' : 'Create connection'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Provide connection details for your primary database or analytics replicas.
            </p>
          </div>
          {statusMessage ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              <CheckCircleIcon className="h-4 w-4" />
              {statusMessage}
            </span>
          ) : null}
        </div>

        {validationError ? (
          <div className="mt-4 inline-flex w-full items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>{validationError}</span>
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mt-4 inline-flex w-full items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="dbName" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Connection name
            </label>
            <input
              id="dbName"
              value={formState.name}
              onChange={handleChange('name')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dbEnvironment" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Environment
            </label>
            <input
              id="dbEnvironment"
              value={formState.environment}
              onChange={handleChange('environment')}
              placeholder="production"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dbRole" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role
            </label>
            <input
              id="dbRole"
              value={formState.role}
              onChange={handleChange('role')}
              placeholder="primary, replica, analytics"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dbDialect" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Dialect
            </label>
            <select
              id="dbDialect"
              value={formState.dialect}
              onChange={handleChange('dialect')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {DIALECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="dbHost" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Host
            </label>
            <input
              id="dbHost"
              value={formState.host}
              onChange={handleChange('host')}
              placeholder="db.gigvora.internal"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dbPort" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Port
            </label>
            <input
              id="dbPort"
              type="number"
              min="1"
              value={formState.port}
              onChange={handleChange('port')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dbDatabase" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Database name
            </label>
            <input
              id="dbDatabase"
              value={formState.database}
              onChange={handleChange('database')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dbUsername" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Username
            </label>
            <input
              id="dbUsername"
              value={formState.username}
              onChange={handleChange('username')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dbPassword" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Password
            </label>
            <input
              id="dbPassword"
              type="password"
              value={formState.password}
              onChange={handleChange('password')}
              placeholder={isEditMode ? 'Leave blank to keep current secret' : ''}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dbSslMode" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              SSL mode
            </label>
            <select
              id="dbSslMode"
              value={formState.sslMode}
              onChange={handleChange('sslMode')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {SSL_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="dbAllowedRoles" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Allowed roles
            </label>
            <input
              id="dbAllowedRoles"
              value={formState.allowedRolesInput}
              onChange={handleChange('allowedRolesInput')}
              placeholder="admin, analytics, reporting"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <p className="text-xs text-slate-500">Comma separated list of roles allowed to consume this connection.</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="dbDescription" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </label>
            <textarea
              id="dbDescription"
              value={formState.description}
              onChange={handleChange('description')}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={formState.isPrimary}
              onChange={handleChange('isPrimary')}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            />
            Mark as primary connection
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={formState.readOnly}
              onChange={handleChange('readOnly')}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            />
            Connection is read-only
          </label>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connection pool (optional)</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="poolMin" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Minimum connections
              </label>
              <input
                id="poolMin"
                type="number"
                min="0"
                value={formState.options.poolMin}
                onChange={handleOptionsChange('poolMin')}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="poolMax" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Maximum connections
              </label>
              <input
                id="poolMax"
                type="number"
                min="1"
                value={formState.options.poolMax}
                onChange={handleOptionsChange('poolMax')}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="idleTimeout" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Idle timeout (ms)
              </label>
              <input
                id="idleTimeout"
                type="number"
                min="0"
                value={formState.options.idleTimeoutMs}
                onChange={handleOptionsChange('idleTimeoutMs')}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="connectionTimeout" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Connection timeout (ms)
              </label>
              <input
                id="connectionTimeout"
                type="number"
                min="0"
                value={formState.options.connectionTimeoutMs}
                onChange={handleOptionsChange('connectionTimeoutMs')}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="maxLifetime" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Max lifetime (ms)
              </label>
              <input
                id="maxLifetime"
                type="number"
                min="0"
                value={formState.options.maxLifetimeMs}
                onChange={handleOptionsChange('maxLifetimeMs')}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="replicaLag" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Replica lag threshold (ms)
              </label>
              <input
                id="replicaLag"
                type="number"
                min="0"
                value={formState.options.replicaLagThresholdMs}
                onChange={handleOptionsChange('replicaLagThresholdMs')}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
          {isEditMode ? 'Save changes' : 'Create connection'}
        </button>
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || saving}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {testing ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : null}
          Test connection
        </button>
        {isEditMode ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
