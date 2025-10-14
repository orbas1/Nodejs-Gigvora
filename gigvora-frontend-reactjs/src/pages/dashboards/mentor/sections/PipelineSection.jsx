import MentorBookingPipeline from '../../../../components/mentor/MentorBookingPipeline.jsx';

export default function PipelineSection({ bookings, segments }) {
  return (
    <div className="space-y-6">
      <MentorBookingPipeline bookings={bookings} segments={segments} />
      <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Automation tips</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Sync paid invoices to the Finance hub for clearer mentor earnings reporting.</li>
          <li>Automate pre-work reminders 48 hours before each mentorship session.</li>
          <li>Enable Explorer instant booking to auto-confirm 1:1 sessions against your published availability.</li>
        </ul>
      </section>
    </div>
  );
}
