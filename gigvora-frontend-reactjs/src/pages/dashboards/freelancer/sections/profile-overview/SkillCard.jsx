export default function SkillCard({ skills = [], onManage }) {
  const topSkills = skills.slice(0, 8);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Skills</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {topSkills.length === 0 ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Add skills</span>
            ) : (
              topSkills.map((skill) => (
                <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {skill}
                </span>
              ))
            )}
            {skills.length > topSkills.length ? (
              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-400">+{skills.length - topSkills.length}</span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onManage}
          className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          Skills
        </button>
      </div>
    </div>
  );
}
