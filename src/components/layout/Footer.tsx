import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeNewsletter } from '../../api/newsletter';
import { useTheme } from '../../hooks/useTheme';

const STUDIO_LINKS = [
  { label: 'Collection', to: '/products' },
  { label: 'Custom Tool', to: '/custom-neon' },
  { label: 'Process', to: '/#process' },
  { label: 'Safety & Care', to: '/resources' },
];

export function Footer() {
  const { theme } = useTheme();
  const social = theme?.social_links;
  const hasSocial = social && (social.instagram || social.pinterest || social.behance);

  return (
    <footer className="border-t border-border bg-background py-24">
      <div className="container">
        <div className="grid grid-cols-1 gap-20 md:grid-cols-4">
          <div className="col-span-1 space-y-8 md:col-span-2">
            <h2 className="font-display text-2xl uppercase tracking-[0.4em] text-brand">
              {theme?.brand_name ?? 'Storefront'}
            </h2>
            <p className="max-w-sm text-muted-foreground">
              A boutique light studio dedicated to the craft of neon. Based in the heart of the creative district,
              serving global visionaries.
            </p>
            {hasSocial && (
              <div className="flex gap-6 pt-4">
                {social?.instagram && (
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground/40 transition-colors hover:text-brand"
                  >
                    Instagram
                  </a>
                )}
                {social?.pinterest && (
                  <a
                    href={social.pinterest}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground/40 transition-colors hover:text-brand"
                  >
                    Pinterest
                  </a>
                )}
                {social?.behance && (
                  <a
                    href={social.behance}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground/40 transition-colors hover:text-brand"
                  >
                    Behance
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h4 className="font-label text-xs uppercase tracking-widest text-foreground">Studio</h4>
            <nav className="flex flex-col gap-4">
              {STUDIO_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-8">
            <h4 className="font-label text-xs uppercase tracking-widest text-foreground">Newsletter</h4>
            <NewsletterForm />
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              &copy; {new Date().getFullYear()} {theme?.brand_name ?? 'Storefront'} Studio
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'loading' || status === 'done') return;
    setStatus('loading');
    try {
      await subscribeNewsletter(email);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return <p className="border-b border-border pb-2 text-sm text-foreground">You&apos;re on the list.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="border-b border-border pb-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        aria-label="Email address"
        className="w-full border-none bg-transparent p-0 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus-visible:outline-none"
      />
      {status === 'error' && <p className="pt-2 text-xs text-destructive">Something went wrong — try again.</p>}
    </form>
  );
}
