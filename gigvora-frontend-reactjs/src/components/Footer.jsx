import { Link } from 'react-router-dom';
import { LOGO_URL } from '../constants/branding.js';

const footerLinks = [
  { label: 'About', to: '/about' },
  { label: 'Support', to: '/support' },
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/90">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-12 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center text-slate-600">
          <img src={LOGO_URL} alt="Gigvora" className="h-11 w-auto" />
        </div>
        <p className="text-slate-500">&copy; {new Date().getFullYear()} Gigvora. Crafted for modern talent ecosystems.</p>
        <nav className="flex flex-wrap items-center gap-4">
          {footerLinks.map((item) => (
            <Link key={item.label} to={item.to} className="transition hover:text-accent">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
