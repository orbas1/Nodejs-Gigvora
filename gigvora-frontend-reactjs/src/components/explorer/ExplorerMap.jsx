import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import PropTypes from 'prop-types';
import useDebounce from '../../hooks/useDebounce.js';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const DEFAULT_VIEW_STATE = {
  latitude: 51.509865,
  longitude: -0.118092,
  zoom: 4.2,
};

function resolveInitialView(items) {
  const firstWithGeo = items.find((item) => item.geo?.lat && item.geo?.lng);
  if (firstWithGeo) {
    return {
      latitude: Number.parseFloat(firstWithGeo.geo.lat),
      longitude: Number.parseFloat(firstWithGeo.geo.lng),
      zoom: 7,
    };
  }
  return DEFAULT_VIEW_STATE;
}

export default function ExplorerMap({ items, onViewportChange, className = '' }) {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState(() => resolveInitialView(items));
  const [pendingBounds, setPendingBounds] = useState(null);
  const debouncedBounds = useDebounce(pendingBounds, 400);

  useEffect(() => {
    if (debouncedBounds && onViewportChange) {
      onViewportChange(debouncedBounds);
    }
  }, [debouncedBounds, onViewportChange]);

  useEffect(() => {
    setViewState((previous) => ({ ...previous, ...resolveInitialView(items) }));
  }, [items]);

  const markers = useMemo(
    () =>
      items
        .filter((item) => item.geo?.lat && item.geo?.lng)
        .map((item) => ({
          id: item.id,
          latitude: Number.parseFloat(item.geo.lat),
          longitude: Number.parseFloat(item.geo.lng),
          label: item.title ?? item.name ?? 'Opportunity',
          category: item.category,
          subtitle:
            item.organization ?? item.track ?? item.location ?? item.employmentType ?? item.duration ?? item.status ?? '',
        })),
    [items],
  );

  const handleMove = useCallback((event) => {
    setViewState(event.viewState);
  }, []);

  const handleMoveEnd = useCallback(() => {
    if (!mapRef.current) {
      return;
    }
    const bounds = mapRef.current.getMap().getBounds();
    setPendingBounds({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex h-[520px] w-full flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white text-center text-sm text-slate-500 ${className}`}
      >
        <p className="max-w-sm">
          Map view requires a Mapbox access token. Provide <code className="rounded bg-slate-100 px-1">VITE_MAPBOX_ACCESS_TOKEN</code>{' '}
          in your environment configuration to enable geographic filtering and nearby insights.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-white ${className}`}>
      <Map
        ref={mapRef}
        reuseMaps
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/light-v11"
        style={{ width: '100%', height: '100%' }}
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
        {...viewState}
      >
        <NavigationControl position="top-left" showCompass showZoom visualizePitch />
        {markers.map((marker) => (
          <Marker key={marker.id} latitude={marker.latitude} longitude={marker.longitude} anchor="bottom">
            <div className="group flex flex-col items-center">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-soft">
                {marker.category?.charAt(0)?.toUpperCase() ?? '•'}
              </span>
              <div className="pointer-events-none mt-1 w-40 rounded-2xl border border-slate-200 bg-white p-3 text-left text-xs text-slate-600 opacity-0 shadow-soft transition group-hover:opacity-100">
                <p className="font-semibold text-slate-900">{marker.label}</p>
                {marker.subtitle ? <p className="mt-1 truncate text-xs text-slate-500">{marker.subtitle}</p> : null}
              </div>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}

ExplorerMap.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      geo: PropTypes.shape({
        lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        lng: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
      title: PropTypes.string,
      name: PropTypes.string,
      category: PropTypes.string,
      organization: PropTypes.string,
      track: PropTypes.string,
      location: PropTypes.string,
      employmentType: PropTypes.string,
      duration: PropTypes.string,
      status: PropTypes.string,
    }),
  ).isRequired,
  onViewportChange: PropTypes.func,
  className: PropTypes.string,
};

ExplorerMap.defaultProps = {
  onViewportChange: undefined,
  className: '',
};
