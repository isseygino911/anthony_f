import { type ReactNode, useState } from 'react';
import type { ContactTopic } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ContactForm } from './ContactForm';
import { CONTACT_TOPICS } from './contactTopics';

interface ContactDialogProps {
  topic: ContactTopic;
  /** The button/link that opens the dialog — rendered as the trigger as-is. */
  children: ReactNode;
}

/**
 * Opens the reusable ContactForm in a dialog, so a call-to-action can be
 * answered without navigating away from the page that prompted it.
 *
 * The dialog deliberately stays open after a successful send: the form
 * swaps itself for its confirmation message, which is the only feedback the
 * visitor gets (the app has no toast system), so closing it automatically
 * would hide that the message went through.
 */
export function ContactDialog({ topic, children }: ContactDialogProps) {
  const [open, setOpen] = useState(false);
  const config = CONTACT_TOPICS[topic];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{config.description}</p>
        <ContactForm topic={topic} hideHeading />
      </DialogContent>
    </Dialog>
  );
}
