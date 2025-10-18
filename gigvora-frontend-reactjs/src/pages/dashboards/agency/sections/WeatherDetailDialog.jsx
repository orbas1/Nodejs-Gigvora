import { Fragment, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatAbsolute } from '../../../../utils/date.js';

function buildForecastUrl(coordinates) {
  const latitude = Number(coordinates?.latitude);
  const longitude = Number(coordinates?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  const latFixed = latitude.toFixed(4);
  const lonFixed = longitude.toFixed(4);
  return `https://www.windy.com/${latFixed}/${lonFixed}?${latFixed},${lonFixed},7`; // reliable public viewer
}

export default function WeatherDetailDialog({ open, onClose, weather, location, coordinates, lastUpdated, onEdit }) {
  const observedAt = weather?.observedAt || lastUpdated || null;
  const provider = weather?.provider || 'Open-Meteo';
  const forecastUrl = useMemo(() => buildForecastUrl(coordinates), [coordinates]);
  const latitude = Number(coordinates?.latitude);
  const longitude = Number(coordinates?.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  const handleEdit = () => {
    onClose?.();
    onEdit?.();
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-4xl bg-white p-6 text-left shadow-xl transition-all">
                <button
                  type="button"
                  className="absolute right-4 top-4 rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">Close weather</span>
                </button>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Dialog.Title className="text-xl font-semibold text-slate-900">Weather</Dialog.Title>
                    <p className="text-sm font-semibold text-slate-500">{location || 'Set location'}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Temperature</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">
                        {Number.isFinite(Number(weather?.temperatureC))
                          ? `${Number(weather.temperatureC).toFixed(0)}°C`
                          : '—'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {Number.isFinite(Number(weather?.temperatureF))
                          ? `${Number(weather.temperatureF).toFixed(0)}°F`
                          : ''}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Wind</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">
                        {Number.isFinite(Number(weather?.windSpeedKph))
                          ? `${Number(weather.windSpeedKph).toFixed(0)} km/h`
                          : '—'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {Number.isFinite(Number(weather?.windSpeedMph))
                          ? `${Number(weather.windSpeedMph).toFixed(0)} mph`
                          : ''}
                        {weather?.windDirection ? ` • ${weather.windDirection}` : ''}
                      </p>
                    </div>
                  </div>

                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Provider</dt>
                      <dd className="mt-1 text-slate-700">{provider}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Observed</dt>
                      <dd className="mt-1 text-slate-700">{observedAt ? formatAbsolute(observedAt, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Latitude</dt>
                      <dd className="mt-1 text-slate-700">{hasCoordinates ? `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? 'N' : 'S'}` : '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Longitude</dt>
                      <dd className="mt-1 text-slate-700">{hasCoordinates ? `${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? 'E' : 'W'}` : '—'}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-3">
                    {forecastUrl ? (
                      <a
                        href={forecastUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
                      >
                        Open forecast
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ) : null}
                    {onEdit ? (
                      <button
                        type="button"
                        onClick={handleEdit}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        Edit weather
                      </button>
                    ) : null}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
