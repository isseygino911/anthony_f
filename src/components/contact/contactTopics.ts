import type { ContactTopic } from '../../types';

/**
 * Per-surface configuration for the reusable ContactForm. Everything that
 * differs between "Become a Luma Light Installer" and "Speak with a
 * Designer" lives here — the form component itself has no per-topic
 * branching, so adding a third contact surface is one entry in this map
 * plus the matching `topic` enum value on the server (see the server's
 * 036_create_contact_submissions.js and contact.service.js TOPICS).
 */
export interface ContactTopicConfig {
  /** Heading shown above the form and in the dialog its trigger opens. */
  title: string;
  /** One line setting expectations before the visitor starts typing. */
  description: string;
  /** Placeholder for the message field — the main per-topic steer. */
  messagePlaceholder: string;
  /** Contractors are asked for a business name; design enquiries are not. */
  showCompany: boolean;
  submitLabel: string;
  /** Confirmation copy once the message is away. */
  successTitle: string;
  successBody: string;
}

export const CONTACT_TOPICS: Record<ContactTopic, ContactTopicConfig> = {
  installer: {
    title: 'Become a Luma Light Installer',
    description:
      'Tell us about your business and we will get back to you with dealer pricing, training and technical support.',
    messagePlaceholder:
      'What kind of work do you do, what areas do you cover, and roughly how many installs a year?',
    showCompany: true,
    submitLabel: 'Apply to partner',
    successTitle: 'Application received',
    successBody:
      'Thanks — our partnerships team will review your details and be in touch about dealer pricing and training.',
  },
  designer: {
    title: 'Speak with a Designer',
    description:
      'Share what you have in mind and one of our designers will come back to you with ideas and a quote.',
    messagePlaceholder:
      'What are you looking to create? Include size, colours, where it will hang and any deadline you have.',
    showCompany: false,
    submitLabel: 'Send to a designer',
    successTitle: 'Message sent',
    successBody: 'Thanks — a designer will read this and reply to you by email shortly.',
  },
};
