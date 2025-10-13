import {
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { formatRelativeTime, formatAbsolute } from '../../../../utils/date.js';

function formatCurrency(value, currency = 'USD') {
  if (value == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${value}`;
  }
}

function formatPercent(value, digits = 1) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(digits)}%`;
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return new Intl.NumberFormat('en-US').format(Number(value));
}

function EventList({ title, icon: Icon, items, emptyMessage }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        {Icon ? <Icon className="h-5 w-5 text-blue-500" /> : null}
        <span>{title}</span>
      </div>
      <div className="space-y-2">
        {items?.length ? (
          items.map((item, index) => (
            <div
              key={`${item.title ?? item.name ?? 'event'}-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
            >
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-slate-800">{item.title ?? item.name}</p>
                {item.subtitle ? <p className="text-xs text-slate-500">{item.subtitle}</p> : null}
                {item.date ? (
                  <p className="text-xs text-slate-500">
                    {item.dateLabel ?? 'Scheduled'}: {formatAbsolute(item.date, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                ) : null}
                {item.meta ? <p className="text-xs text-slate-500">{item.meta}</p> : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PartnershipsInsightsSection({ partnerships = {}, calendar = {} }) {
  const summary = partnerships.summary ?? {};
  const management = partnerships.management ?? {};
  const analytics = partnerships.analytics ?? {};
  const calendars = partnerships.calendars ?? {};
  const excellence = partnerships.excellence ?? {};
  const portals = partnerships.portals ?? {};
  const mandatePerformance = partnerships.mandatePerformance ?? {};
  const commercialOperations = partnerships.commercialOperations ?? {};
  const issueResolution = partnerships.issueResolution ?? {};

  const workload = calendar.workload ?? {};
  const upcomingFallback = calendar.upcoming ?? [];

  const personalEvents = calendars.personal?.upcoming?.length
    ? calendars.personal.upcoming
    : upcomingFallback.map((event) => ({
        title: event.label,
        date: event.date,
        meta: event.stage,
      }));

  const sharedCalendars = calendars.shared ?? [];
  const availabilitySlots = calendars.availability?.slots ?? [];

  return (
    <div className="space-y-10">
      <section
        id="client-management"
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Client management</h3>
            <p className="text-sm text-slate-600">
              Manage retainers, success fees, contracts, and hiring mandates from one command center.
            </p>
          </div>
          <BuildingOfficeIcon className="h-6 w-6 text-blue-500" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Retainer value</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatCurrency(management.totals?.retainerValue)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Active contracts</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatNumber(management.totals?.activeContracts)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Avg success fee</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatPercent(management.totals?.successFeeAverage)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Mandates in flight</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatNumber(management.totals?.mandatesInFlight)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <EventList
            title="Upcoming retainers & renewals"
            icon={CurrencyDollarIcon}
            items={management.retainers?.map((retainer) => ({
              title: retainer.clientName,
              subtitle: `${formatCurrency(retainer.retainerAmount, retainer.currency)} • ${retainer.billingCadence ?? 'monthly'}`,
              date: retainer.renewalDate,
              meta: retainer.status?.replaceAll('_', ' '),
            }))}
            emptyMessage="No upcoming retainer renewals scheduled."
          />

          <EventList
            title="Success fee triggers"
            icon={ChartBarIcon}
            items={management.successFees?.map((fee) => ({
              title: fee.clientName,
              subtitle: `${formatPercent(fee.percentage)} • ${fee.trigger}`,
              date: fee.lastPlacementAt,
              meta: fee.projectedPayout != null ? `Projected: ${formatCurrency(fee.projectedPayout)}` : null,
            }))}
            emptyMessage="No success fee arrangements captured."
          />

          <EventList
            title="Top client contacts"
            icon={UsersIcon}
            items={(summary.topContacts ?? []).map((contact) => ({
              title: contact.name,
              subtitle: contact.company ?? contact.email,
              date: contact.lastInteractionAt,
              meta: contact.lastInteractionAt ? `Last touch ${formatRelativeTime(contact.lastInteractionAt)}` : null,
            }))}
            emptyMessage="Add client touchpoints to spotlight your key relationships."
          />
        </div>
      </section>

      <section
        id="performance-analytics"
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Performance analytics</h3>
            <p className="text-sm text-slate-600">
              Track placement rates, velocity, conversion ratios, and revenue impact across mandates.
            </p>
          </div>
          <PresentationChartLineIcon className="h-6 w-6 text-blue-500" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Placement rate</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatPercent(analytics.totals?.placementRate)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Time to submit</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {analytics.totals?.timeToSubmit != null ? `${analytics.totals.timeToSubmit} days` : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Interview → offer</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {analytics.totals?.interviewToOffer != null ? `${analytics.totals.interviewToOffer} days` : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Revenue</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatCurrency(analytics.totals?.revenue)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pipeline value</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatCurrency(analytics.totals?.pipelineValue)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Conversion ratios</h4>
            <div className="space-y-2">
              {[
                { label: 'Submission → interview', value: analytics.ratios?.submissionToInterview },
                { label: 'Interview → offer', value: analytics.ratios?.interviewToOffer },
                { label: 'Offer → placement', value: analytics.ratios?.offerToPlacement },
              ].map((ratio) => (
                <div
                  key={ratio.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                >
                  <span>{ratio.label}</span>
                  <span className="font-semibold text-slate-800">{formatPercent(ratio.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Revenue breakdown</h4>
            <div className="space-y-2">
              {analytics.revenueBreakdown?.length ? (
                analytics.revenueBreakdown.map((entry) => (
                  <div
                    key={entry.label}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                  >
                    <span>{entry.label}</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(entry.value)}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No revenue data captured in this window.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <EventList
            title="Sector performance"
            icon={ChartBarIcon}
            items={analytics.sectorBreakdown?.map((sector) => ({
              title: sector.sector,
              subtitle: `${formatNumber(sector.activeMandates)} active mandates`,
              meta: `Revenue ${formatCurrency(sector.revenue)}`,
            }))}
            emptyMessage="Add industry tags to mandates to see sector coverage."
          />
          <EventList
            title="Trendline"
            icon={PresentationChartLineIcon}
            items={analytics.trendline?.map((point) => ({
              title: point.period,
              subtitle: `${formatNumber(point.placements)} placements`,
              meta: `Revenue ${formatCurrency(point.revenue)}`,
            }))}
            emptyMessage="Trend data will appear once campaigns accumulate a few weeks of activity."
          />
        </div>
      </section>

      <section
        id="calendar-availability"
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Calendar & availability</h3>
            <p className="text-sm text-slate-600">
              Coordinate personal calendars, client-ready timelines, and availability broadcasts.
            </p>
          </div>
          <CalendarDaysIcon className="h-6 w-6 text-blue-500" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Interviews this week</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatNumber(workload.interviewsThisWeek ?? calendars.workload?.interviews ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Offers pending</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatNumber(workload.offersPending ?? calendars.workload?.offers ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Prep sessions</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatNumber(workload.prepSessions ?? calendars.workload?.prepSessions ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Broadcast availability</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatNumber(calendars.availability?.totalHours ?? 0)} hrs</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <EventList
            title="Personal schedule"
            icon={CalendarDaysIcon}
            items={personalEvents.map((event) => ({
              title: event.title,
              date: event.date,
              meta: event.meta ?? event.stage ?? null,
              subtitle: event.subtitle ?? null,
            }))}
            emptyMessage="Add interviews or client sessions to see them here."
          />

          <div className="lg:col-span-1 space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Shared client calendars</h4>
            <div className="space-y-2">
              {sharedCalendars.length ? (
                sharedCalendars.map((entry, index) => (
                  <div
                    key={`${entry.clientName ?? 'shared'}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-800">{entry.clientName}</p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-500">
                      {(entry.events ?? []).slice(0, 4).map((event, idx) => (
                        <li key={`${event.title}-${idx}`}>
                          {event.title} • {event.startAt ? formatRelativeTime(event.startAt) : 'TBD'}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Share a client calendar to surface joint milestones.
                </div>
              )}
            </div>
          </div>

          <EventList
            title="Availability slots"
            icon={UsersIcon}
            items={availabilitySlots.map((slot, index) => ({
              title: slot.title,
              date: slot.startAt,
              meta: slot.hostName ? `${slot.hostName} • ${slot.channel}` : slot.channel,
              subtitle: slot.clientName ?? null,
            }))}
            emptyMessage="No broadcast availability set for this window."
          />
        </div>
      </section>

      <section
        id="client-partnership-excellence"
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Client partnership excellence</h3>
            <p className="text-sm text-slate-600">
              Deliver transparency with shared dashboards, milestone updates, and ROI storytelling.
            </p>
          </div>
          <SparklesIcon className="h-6 w-6 text-blue-500" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <EventList
            title="Engagement dashboards"
            icon={BuildingOfficeIcon}
            items={excellence.dashboards?.map((entry) => ({
              title: entry.clientName,
              subtitle: `${formatNumber(entry.activeMandates ?? 0)} active mandates • ${formatCurrency(entry.retainerAmount)}`,
              meta: `Health: ${(entry.health ?? 'on_track').replaceAll('_', ' ')}`,
              date: entry.updatedAt,
              dateLabel: 'Last update',
            }))}
            emptyMessage="Publish a client-facing dashboard to surface engagement health."
          />

          <EventList
            title="Milestone updates"
            icon={ChartBarIcon}
            items={excellence.milestones?.map((milestone, index) => ({
              title: milestone.name,
              subtitle: milestone.clientName,
              date: milestone.completedAt ?? milestone.dueDate,
              dateLabel: milestone.completedAt ? 'Completed' : 'Due',
              meta: milestone.impactScore != null ? `Impact score ${formatNumber(milestone.impactScore)}` : milestone.status,
            }))}
            emptyMessage="Track milestones to keep clients aligned on progress."
          />

          <EventList
            title="ROI narratives"
            icon={SparklesIcon}
            items={excellence.roiNarratives?.map((entry, index) => ({
              title: entry.name,
              subtitle: entry.clientName,
              date: entry.completedAt ?? entry.dueDate,
              meta: entry.narrative,
            }))}
            emptyMessage="Document ROI wins to power renewal conversations."
          />
        </div>
      </section>

      <section
        id="client-portals"
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Client portals</h3>
            <p className="text-sm text-slate-600">
              Invite clients into secure portals for shortlists, feedback, interview readiness, and offer strategy.
            </p>
          </div>
          <GlobeAltIcon className="h-6 w-6 text-blue-500" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Active portals</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(portals.totals?.active)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Invites pending</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(portals.totals?.invitesPending)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Adoption rate</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatPercent(portals.totals?.adoptionRate ?? null)}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <EventList
            title="Portal branding"
            icon={GlobeAltIcon}
            items={portals.brandingLibrary?.map((portal, index) => ({
              title: portal.clientName,
              subtitle: `${portal.theme} theme` + (portal.customDomain ? ` • ${portal.customDomain}` : ''),
              meta: `${portal.primaryColor} / ${portal.secondaryColor}`,
            }))}
            emptyMessage="No portal branding captured yet. Configure colors and themes per client."
          />

          <EventList
            title="Audit trail"
            icon={ShieldCheckIcon}
            items={portals.auditLog?.map((log) => ({
              title: log.clientName,
              subtitle: log.description,
              date: log.occurredAt,
              meta: `${log.eventType}${log.actorName ? ` • ${log.actorName}` : ''}`,
            }))}
            emptyMessage="Portal activity will appear as clients collaborate."
          />
        </div>
      </section>

      <section
        id="mandate-performance-dashboards"
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Mandate performance dashboards</h3>
            <p className="text-sm text-slate-600">
              Measure submissions, interviews, offers, placements, and quality metrics per mandate.
            </p>
          </div>
          <PresentationChartLineIcon className="h-6 w-6 text-blue-500" />
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Submissions</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(mandatePerformance.totals?.submissions)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Interviews</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(mandatePerformance.totals?.interviews)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Offers</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(mandatePerformance.totals?.offers)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Placements</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(mandatePerformance.totals?.placements)}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Mandate roster</h4>
            <div className="space-y-2">
              {mandatePerformance.mandates?.length ? (
                mandatePerformance.mandates.slice(0, 10).map((mandate) => (
                  <div
                    key={mandate.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                  >
                    <p className="font-semibold text-slate-800">{mandate.title}</p>
                    <p className="text-xs text-slate-500">{mandate.clientName} • {mandate.status}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Pipeline {formatCurrency(mandate.pipelineValue)} • Forecast {formatCurrency(mandate.forecastRevenue)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Diversity {formatPercent(mandate.diversitySlatePct)} • Quality {formatPercent(mandate.qualityScore, 1)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No mandate performance data available yet.
                </div>
              )}
            </div>
          </div>

          <EventList
            title="Exportable reports"
            icon={ChartBarIcon}
            items={mandatePerformance.reports?.map((report, index) => ({
              title: report.name,
              subtitle: report.clientName,
              meta: `${(report.format ?? 'pdf').toUpperCase()} export` + (report.generatedAt ? ` • ${formatRelativeTime(report.generatedAt)}` : ''),
            }))}
            emptyMessage="Generate a report to share mandate outcomes."
          />
        </div>
      </section>

      <section
        id="commercial-operations"
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Commercial operations</h3>
            <p className="text-sm text-slate-600">
              Manage retainers, milestones, invoices, and commissions with finance-ready documentation.
            </p>
          </div>
          <CurrencyDollarIcon className="h-6 w-6 text-blue-500" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Outstanding invoices</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatCurrency(commercialOperations.invoices?.totals?.outstanding)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Overdue</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatCurrency(commercialOperations.invoices?.totals?.overdue)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Paid this quarter</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatCurrency(commercialOperations.invoices?.totals?.paidThisQuarter)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <EventList
            title="Retainer schedule"
            icon={CurrencyDollarIcon}
            items={commercialOperations.retainers?.map((entry) => ({
              title: entry.clientName,
              date: entry.renewalDate,
              dateLabel: 'Renewal',
              subtitle: `${formatCurrency(entry.retainerAmount, entry.currency)} • ${entry.billingCadence}`,
            }))}
            emptyMessage="No retainer billing schedule captured."
          />

          <EventList
            title="Upcoming invoices"
            icon={ChartBarIcon}
            items={commercialOperations.invoices?.upcoming?.map((invoice) => ({
              title: invoice.clientName,
              subtitle: invoice.invoiceNumber,
              date: invoice.dueDate,
              meta: `${formatCurrency(invoice.amount, invoice.currency)} • ${invoice.status}`,
            }))}
            emptyMessage="All invoices are settled or not yet scheduled."
          />

          <EventList
            title="Commission splits"
            icon={UsersIcon}
            items={commercialOperations.commissions?.map((commission, index) => ({
              title: commission.partnerName,
              subtitle: commission.clientName,
              meta: `${formatPercent(commission.percentage)} • ${formatCurrency(commission.amount)}`,
            }))}
            emptyMessage="No partner commission splits logged."
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-700">Accounting integrations</h4>
          <div className="flex flex-wrap gap-2">
            {commercialOperations.integrations?.length ? (
              commercialOperations.integrations.map((integration) => (
                <span
                  key={integration.provider}
                  className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
                >
                  {integration.provider} • {integration.status}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">
                Connect an accounting integration to sync invoices automatically.
              </span>
            )}
          </div>
        </div>
      </section>

      <section
        id="issue-resolution-desk"
        className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Issue resolution desk</h3>
            <p className="text-sm text-slate-600">
              Address candidate withdrawals, offer renegotiations, and conflicts with structured playbooks.
            </p>
          </div>
          <ShieldCheckIcon className="h-6 w-6 text-blue-500" />
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Open cases</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(issueResolution.totals?.openCases)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Awaiting client</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(issueResolution.totals?.awaitingClient)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Resolved this quarter</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(issueResolution.totals?.resolvedThisQuarter)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Avg resolution time</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {issueResolution.totals?.avgResolutionHours != null
                ? `${issueResolution.totals.avgResolutionHours} hrs`
                : '—'}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <EventList
            title="Active cases"
            icon={ShieldCheckIcon}
            items={issueResolution.cases?.map((item) => ({
              title: item.caseType,
              subtitle: item.clientName,
              date: item.openedAt,
              dateLabel: 'Opened',
              meta: `${item.status}${item.playbookUsed ? ` • ${item.playbookUsed}` : ''}`,
            }))}
            emptyMessage="No open issue cases. You're running smoothly."
          />

          <EventList
            title="Escalations"
            icon={UsersIcon}
            items={issueResolution.escalations?.map((entry, index) => ({
              title: entry.caseType,
              subtitle: entry.status,
              date: entry.occurredAt,
              dateLabel: 'Escalated',
              meta: entry.escalatedTo,
            }))}
            emptyMessage="No escalations triggered this period."
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-700">Playbook utilization</h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {issueResolution.playbooks?.length ? (
              issueResolution.playbooks.map((playbook) => (
                <div
                  key={playbook.name}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                >
                  <p className="font-semibold text-slate-800">{playbook.name}</p>
                  <p className="text-xs text-slate-500">Used {formatNumber(playbook.usageCount)} times</p>
                  {playbook.lastUsedAt ? (
                    <p className="text-xs text-slate-500">Last used {formatRelativeTime(playbook.lastUsedAt)}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-4">
                Activate a playbook to document how issues are resolved.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
