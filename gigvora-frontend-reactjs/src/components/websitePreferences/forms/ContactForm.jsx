import FormField from '../components/FormField.jsx';

export default function ContactForm({ contact, onChange, canEdit }) {
  const handleChange = (next) => {
    onChange({ ...contact, ...next });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Contact</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField label="Email">
          <input
            type="email"
            value={contact.email}
            onChange={(event) => handleChange({ email: event.target.value })}
            disabled={!canEdit}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </FormField>
        <FormField label="Phone">
          <input
            type="tel"
            value={contact.phone}
            onChange={(event) => handleChange({ phone: event.target.value })}
            disabled={!canEdit}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </FormField>
        <FormField label="Location">
          <input
            type="text"
            value={contact.location}
            onChange={(event) => handleChange({ location: event.target.value })}
            disabled={!canEdit}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </FormField>
        <FormField label="Booking link">
          <input
            type="url"
            value={contact.bookingLink}
            onChange={(event) => handleChange({ bookingLink: event.target.value })}
            disabled={!canEdit}
            placeholder="https://cal.com/..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </FormField>
        <FormField label="Form recipient">
          <input
            type="email"
            value={contact.formRecipient}
            onChange={(event) => handleChange({ formRecipient: event.target.value })}
            disabled={!canEdit}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </FormField>
        <FormField label="Availability note">
          <textarea
            rows={3}
            value={contact.availabilityNote}
            onChange={(event) => handleChange({ availabilityNote: event.target.value })}
            disabled={!canEdit}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </FormField>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm">
        <span className="font-medium text-slate-700">Contact form</span>
        <button
          type="button"
          onClick={() => handleChange({ showForm: !contact.showForm })}
          disabled={!canEdit}
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
            contact.showForm
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          {contact.showForm ? 'Enabled' : 'Disabled'}
        </button>
      </div>
    </div>
  );
}
