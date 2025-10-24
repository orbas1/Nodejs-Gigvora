export const HOME_GRADIENTS = {
  hero: {
    background: 'relative overflow-hidden bg-slate-950 text-white',
    overlays: [
      'absolute left-1/4 top-[-10%] h-72 w-72 rounded-full bg-accent/40 blur-3xl',
      'absolute bottom-[-15%] right-[-10%] h-[28rem] w-[28rem] rounded-full bg-accentDark/30 blur-3xl',
      'absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent',
    ],
    tickerFades: {
      start: 'pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-slate-950 via-slate-950/50 to-transparent',
      end: 'pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-slate-950 via-slate-950/50 to-transparent',
    },
  },
  communityPulse: {
    background: 'relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-16 text-white',
    overlay: 'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_55%)]',
  },
};

export const COMMUNITY_FALLBACK_SUMMARIES = [
  'Founder AMA recaps, beta invites, and weekend build threads are trending right now.',
  'Product squads are showcasing launch retros, retrospectives, and open co-build sessions.',
  'Mentor drop-ins, portfolio feedback, and fresh gig highlights are fuelling today’s energy.',
  'Agency ops teams are sharing hiring wins, revenue milestones, and trust centre updates.',
];
