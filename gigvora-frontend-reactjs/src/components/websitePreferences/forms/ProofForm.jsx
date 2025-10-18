import FormField from '../components/FormField.jsx';
import { ensureArray } from '../defaults.js';
import { createLocalId } from '../utils.js';

export default function ProofForm({ testimonials, gallery, onTestimonialsChange, onGalleryChange, canEdit }) {
  const testimonialItems = ensureArray(testimonials.items);
  const galleryItems = ensureArray(gallery.items);

  const updateTestimonial = (id, key, value) => {
    const nextItems = testimonialItems.map((item) => (item.id === id ? { ...item, [key]: value } : item));
    onTestimonialsChange({ items: nextItems });
  };

  const addTestimonial = () => {
    const nextItems = [
      ...testimonialItems,
      {
        id: createLocalId('testimonial'),
        name: 'Client',
        title: '',
        company: '',
        quote: '',
        avatarUrl: '',
      },
    ];
    onTestimonialsChange({ items: nextItems });
  };

  const removeTestimonial = (id) => {
    const nextItems = testimonialItems.filter((item) => item.id !== id);
    onTestimonialsChange({ items: nextItems });
  };

  const updateGallery = (id, key, value) => {
    const nextItems = galleryItems.map((item) => (item.id === id ? { ...item, [key]: value } : item));
    onGalleryChange({ items: nextItems });
  };

  const addGalleryItem = () => {
    const nextItems = [
      ...galleryItems,
      {
        id: createLocalId('gallery'),
        title: 'New visual',
        caption: '',
        imageUrl: '',
      },
    ];
    onGalleryChange({ items: nextItems });
  };

  const removeGalleryItem = (id) => {
    const nextItems = galleryItems.filter((item) => item.id !== id);
    onGalleryChange({ items: nextItems });
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Testimonials</h3>
          <button
            type="button"
            onClick={addTestimonial}
            disabled={!canEdit}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200"
          >
            Add quote
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {testimonialItems.length ? (
            testimonialItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Name">
                    <input
                      type="text"
                      value={item.name || ''}
                      onChange={(event) => updateTestimonial(item.id, 'name', event.target.value)}
                      disabled={!canEdit}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </FormField>
                  <FormField label="Role">
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(event) => updateTestimonial(item.id, 'title', event.target.value)}
                      disabled={!canEdit}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </FormField>
                  <FormField label="Company">
                    <input
                      type="text"
                      value={item.company || ''}
                      onChange={(event) => updateTestimonial(item.id, 'company', event.target.value)}
                      disabled={!canEdit}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </FormField>
                  <FormField label="Headshot URL">
                    <input
                      type="url"
                      value={item.avatarUrl || ''}
                      onChange={(event) => updateTestimonial(item.id, 'avatarUrl', event.target.value)}
                      disabled={!canEdit}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </FormField>
                </div>
                <FormField label="Quote">
                  <textarea
                    rows={3}
                    value={item.quote || ''}
                    onChange={(event) => updateTestimonial(item.id, 'quote', event.target.value)}
                    disabled={!canEdit}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                </FormField>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeTestimonial(item.id)}
                    disabled={!canEdit}
                    className="text-rose-500 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
              Collect praise from clients or collaborators.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Gallery</h3>
          <button
            type="button"
            onClick={addGalleryItem}
            disabled={!canEdit}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200"
          >
            Add visual
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {galleryItems.length ? (
            galleryItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Title">
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(event) => updateGallery(item.id, 'title', event.target.value)}
                      disabled={!canEdit}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </FormField>
                  <FormField label="Caption">
                    <input
                      type="text"
                      value={item.caption || ''}
                      onChange={(event) => updateGallery(item.id, 'caption', event.target.value)}
                      disabled={!canEdit}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </FormField>
                  <FormField label="Image URL">
                    <input
                      type="url"
                      value={item.imageUrl || ''}
                      onChange={(event) => updateGallery(item.id, 'imageUrl', event.target.value)}
                      disabled={!canEdit}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </FormField>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeGalleryItem(item.id)}
                    disabled={!canEdit}
                    className="text-rose-500 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
              Feature visuals or case study snapshots.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
