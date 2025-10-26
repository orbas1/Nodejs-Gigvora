import PasswordReset from '../components/access/PasswordReset.jsx';

export default function ForgotPasswordPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]"
        aria-hidden="true"
      />
      <div className="absolute -bottom-24 left-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-6">
        <PasswordReset />
      </div>
    </section>
  );
}
