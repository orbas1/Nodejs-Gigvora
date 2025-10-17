export default function IdentityDetailsForm({
  values,
  onFieldChange,
  idOptions = [],
  countryOptions = [],
}) {
  const safeIdOptions = idOptions.length ? idOptions : [];
  const safeCountryOptions = countryOptions.length ? countryOptions : [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="identity-full-name" className="text-sm font-semibold text-slate-800">
            Full name
          </label>
          <input
            id="identity-full-name"
            name="fullName"
            value={values.fullName ?? ''}
            onChange={(event) => onFieldChange('fullName', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="Name as shown on ID"
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="identity-dob" className="text-sm font-semibold text-slate-800">
            Date of birth
          </label>
          <input
            id="identity-dob"
            type="date"
            name="dateOfBirth"
            value={values.dateOfBirth ?? ''}
            onChange={(event) => onFieldChange('dateOfBirth', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="identity-id-type" className="text-sm font-semibold text-slate-800">
            ID type
          </label>
          <select
            id="identity-id-type"
            name="typeOfId"
            value={values.typeOfId ?? ''}
            onChange={(event) => onFieldChange('typeOfId', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="" disabled>
              Select type
            </option>
            {safeIdOptions.map((option) => (
              <option key={option.value ?? option.label} value={option.value ?? option.label}>
                {option.label ?? option.value}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="identity-id-last4" className="text-sm font-semibold text-slate-800">
            ID last four
          </label>
          <input
            id="identity-id-last4"
            name="idNumberLast4"
            value={values.idNumberLast4 ?? ''}
            onChange={(event) => onFieldChange('idNumberLast4', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="1234"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="identity-issuing-country" className="text-sm font-semibold text-slate-800">
            Issued in
          </label>
          <select
            id="identity-issuing-country"
            name="issuingCountry"
            value={values.issuingCountry ?? ''}
            onChange={(event) => onFieldChange('issuingCountry', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="" disabled>
              Select country
            </option>
            {safeCountryOptions.map((option) => (
              <option key={option.value ?? option.label} value={option.value ?? option.label}>
                {option.label ?? option.value}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="identity-issued-at" className="text-sm font-semibold text-slate-800">
            Issued on
          </label>
          <input
            id="identity-issued-at"
            type="date"
            name="issuedAt"
            value={values.issuedAt ?? ''}
            onChange={(event) => onFieldChange('issuedAt', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="identity-expires-at" className="text-sm font-semibold text-slate-800">
            Expires on
          </label>
          <input
            id="identity-expires-at"
            type="date"
            name="expiresAt"
            value={values.expiresAt ?? ''}
            onChange={(event) => onFieldChange('expiresAt', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="identity-country" className="text-sm font-semibold text-slate-800">
            Residence
          </label>
          <select
            id="identity-country"
            name="country"
            value={values.country ?? ''}
            onChange={(event) => onFieldChange('country', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="" disabled>
              Select country
            </option>
            {safeCountryOptions.map((option) => (
              <option key={`res-${option.value ?? option.label}`} value={option.value ?? option.label}>
                {option.label ?? option.value}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="identity-address-line1" className="text-sm font-semibold text-slate-800">
            Street
          </label>
          <input
            id="identity-address-line1"
            name="addressLine1"
            value={values.addressLine1 ?? ''}
            onChange={(event) => onFieldChange('addressLine1', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="Line 1"
            autoComplete="address-line1"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="identity-address-line2" className="text-sm font-semibold text-slate-800">
            Unit
          </label>
          <input
            id="identity-address-line2"
            name="addressLine2"
            value={values.addressLine2 ?? ''}
            onChange={(event) => onFieldChange('addressLine2', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            placeholder="Line 2"
            autoComplete="address-line2"
          />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="identity-city" className="text-sm font-semibold text-slate-800">
            City
          </label>
          <input
            id="identity-city"
            name="city"
            value={values.city ?? ''}
            onChange={(event) => onFieldChange('city', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            autoComplete="address-level2"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="identity-state" className="text-sm font-semibold text-slate-800">
            Region
          </label>
          <input
            id="identity-state"
            name="state"
            value={values.state ?? ''}
            onChange={(event) => onFieldChange('state', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            autoComplete="address-level1"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="identity-postal" className="text-sm font-semibold text-slate-800">
            Postal code
          </label>
          <input
            id="identity-postal"
            name="postalCode"
            value={values.postalCode ?? ''}
            onChange={(event) => onFieldChange('postalCode', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            autoComplete="postal-code"
          />
        </div>
      </div>
    </div>
  );
}
