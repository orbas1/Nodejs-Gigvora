import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';

export default function SkillManagerDrawer({ open, skills = [], onClose, onSave, saving }) {
  const [draft, setDraft] = useState(skills);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (open) {
      setDraft(skills);
      setInput('');
    }
  }, [open, skills]);

  const handleAdd = () => {
    const value = input.trim();
    if (!value) {
      return;
    }
    setDraft((prev) => Array.from(new Set([...prev, value])));
    setInput('');
  };

  const handleRemove = (skill) => {
    setDraft((prev) => prev.filter((item) => item !== skill));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) {
      return;
    }
    await onSave({ skills: draft });
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={saving ? () => {} : onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="pointer-events-auto w-screen max-w-md bg-white shadow-2xl">
                <form onSubmit={handleSubmit} className="flex h-full flex-col">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">Skills</Dialog.Title>
                  </div>
                  <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    <div className="flex flex-wrap gap-2">
                      {draft.length === 0 ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">No skills</span>
                      ) : (
                        draft.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemove(skill)}
                              className="text-slate-400 transition hover:text-slate-600"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder="Add skill"
                        className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAdd}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                        disabled={!input.trim()}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                      disabled={saving}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
