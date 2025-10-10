import { Link } from 'react-router-dom';

const footerLinks = [
  { label: 'About', to: '/about' },
  { label: 'Support', to: '/support' },
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
        <p className="text-white/50">&copy; {new Date().getFullYear()} Gigvora. Crafted for modern talent ecosystems.</p>
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
