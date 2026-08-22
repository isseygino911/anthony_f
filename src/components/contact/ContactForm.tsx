import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { submitContactForm } from '../../api/contact';
import { ApiError } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import type { ContactTopic } from '../../types';
import { ErrorMessage } from '../layout/AsyncState';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { CONTACT_TOPICS } from './contactTopics';

interface ContactFormProps {
  topic: ContactTopic;
  /** Called after a successful send — lets a dialog host close itself. */
  onSent?: () => void;
  /** Hides the heading/description when the host already renders them. */
  hideHeading?: boolean;
}

/**
 * The single contact form behind every "get in touch" surface on the
 * storefront. Content comes from CONTACT_TOPICS[topic]; the only structural
 * difference between surfaces is whether the company field is shown.
 *
 * Sending requires an account, so a signed-out visitor gets a sign-in prompt
 * instead of a form they would only be rejected for submitting. The link
 * carries the current location in router state, matching RequireAuth, so
 * logging in returns them to the page they were reading.
 */
export function ContactForm({ topic, onSent, hideHeading = false }: ContactFormProps) {
  const config = CONTACT_TOPICS[topic];
  const { user, loading } = useAuth();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Prefill from the account once it resolves — these are the details we
  // already know, and the visitor stays free to overwrite them (a contractor
  // often wants replies at a business address, not their login one).
  useEffect(() => {
    if (!user) return;
    setName((current) => current || user.name);
    setEmail((current) => current || user.email);
  }, [user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await submitContactForm({ topic, name, email, phone, company, message });
      setSent(true);
      onSent?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send your message');
    } finally {
      setSubmitting(false);
    }
  }

  const heading = hideHeading ? null : (
    <div className="flex flex-col gap-2">
      <h2 className="font-display text-2xl uppercase leading-none tracking-normal">{config.title}</h2>
      <p className="text-sm text-muted-foreground">{config.description}</p>
    </div>
  );

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        {heading}
        <div className="rounded-md border border-border p-5 text-sm text-muted-foreground">
          <p>Please sign in so we know who to reply to and can keep this enquiry with your account.</p>
          <Button asChild className="mt-4">
            <Link to="/login" state={{ from: location }}>
              Sign in to continue
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-border p-5">
        <p className="font-semibold">{config.successTitle}</p>
        <p className="text-sm text-muted-foreground">{config.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {heading}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            required
            maxLength={255}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-phone">Phone</Label>
          <Input
            id="contact-phone"
            type="tel"
            required
            maxLength={50}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {config.showCompany && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-company">Company</Label>
            <Input
              id="contact-company"
              maxLength={255}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          required
          rows={5}
          maxLength={5000}
          placeholder={config.messagePlaceholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {error && <ErrorMessage message={error} />}

      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? 'Sending…' : config.submitLabel}
      </Button>
    </form>
  );
}
