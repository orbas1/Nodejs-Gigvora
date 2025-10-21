import DataStatus from '../../components/DataStatus.jsx';

export function CommunityPulseSection({ loading, error, fromCache, lastUpdated, onRefresh, statusLabel }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <DataStatus
          loading={loading}
          error={error}
          fromCache={fromCache}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
          statusLabel={statusLabel}
        />
      </div>
    </section>
  );
}
