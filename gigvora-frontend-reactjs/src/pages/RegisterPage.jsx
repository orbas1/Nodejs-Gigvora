import PageHeader from '../components/PageHeader.jsx';
import SignUpForm from '../components/access/SignUpForm.jsx';

export default function RegisterPage() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(219,234,254,0.55),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -right-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Join the community"
          title="Create your Gigvora profile"
          description="Share a few details so we can tailor the experience to your goals across freelancing, career growth, and collaboration."
        />
        <SignUpForm />
      </div>
    </section>
  );
}
