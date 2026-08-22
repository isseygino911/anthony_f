import { useCallback, useEffect, useState } from 'react';
import { getContactSubmissions, updateContactSubmission } from '../../api/admin';
import { EmptyState, ErrorMessage } from '../../components/layout/AsyncState';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Textarea } from '../../components/ui/textarea';
import { cn } from '../../lib/utils';
import type {
  ContactSubmission,
  ContactSubmissionStatus,
  ContactTopic,
  ContactTopicSummary,
} from '../../types';

const STATUS_OPTIONS: (ContactSubmissionStatus | 'all')[] = ['all', 'new', 'in_progress', 'closed'];

const STATUS_LABEL: Record<ContactSubmissionStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  closed: 'Closed',
};

const STATUS_VARIANT: Record<ContactSubmissionStatus, 'warning' | 'default' | 'secondary'> = {
  new: 'warning',
  in_progress: 'default',
  closed: 'secondary',
};

export function ContactSubmissions() {
  const [items, setItems] = useState<ContactSubmission[] | null>(null);
  const [summary, setSummary] = useState<ContactTopicSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<ContactTopic | 'all'>('all');
  const [status, setStatus] = useState<ContactSubmissionStatus | 'all'>('all');
  const [selected, setSelected] = useState<ContactSubmission | null>(null);

  const load = useCallback(() => {
    setItems(null);
    setError(null);
    getContactSubmissions({
      topic: topic === 'all' ? undefined : topic,
      status: status === 'all' ? undefined : status,
      page: 1,
      pageSize: 100,
    })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setSummary(res.summary);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load contact submissions'),
      );
  }, [topic, status]);

  useEffect(load, [load]);

  // The dialog edits a submission in place; refetching keeps the list, the
  // filtered total and the category tallies consistent with what was saved.
  function handleUpdated(updated: ContactSubmission) {
    setSelected(updated);
    load();
  }

  const totalNew = summary.reduce((sum, entry) => sum + entry.new, 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contact</h1>
        {items !== null && (
          <span className="text-sm text-muted-foreground">
            {total} message{total === 1 ? '' : 's'}
            {totalNew > 0 && ` · ${totalNew} unread`}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Everything sent through the storefront contact forms, grouped by what the sender was asking
        about.
      </p>

      {/* Category tabs — counts come from the server summary, which covers
          every topic regardless of the active filter. */}
      <div className="flex flex-wrap gap-2">
        <TopicTab
          label="All"
          count={summary.reduce((sum, entry) => sum + entry.total, 0)}
          unread={totalNew}
          active={topic === 'all'}
          onClick={() => setTopic('all')}
        />
        {summary.map((entry) => (
          <TopicTab
            key={entry.topic}
            label={entry.label}
            count={entry.total}
            unread={entry.new}
            active={topic === entry.topic}
            onClick={() => setTopic(entry.topic)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={(value) => setStatus(value as ContactSubmissionStatus | 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option === 'all' ? 'All statuses' : STATUS_LABEL[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <ErrorMessage message={error} />}
      {items === null && !error && <Skeleton className="h-64 w-full" />}
      {items !== null && items.length === 0 && <EmptyState message="No messages here yet." />}

      {items !== null && items.length > 0 && (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Received</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{topicLabel(item.topic, summary)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-sm truncate text-muted-foreground">
                      {item.message}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setSelected(item)}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                className="flex flex-col gap-2 rounded-md border border-border p-4 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{item.name}</span>
                  <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {topicLabel(item.topic, summary)} · {new Date(item.created_at).toLocaleDateString()}
                </span>
                <span className="line-clamp-2 text-sm text-muted-foreground">{item.message}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <SubmissionDialog
        submission={selected}
        onClose={() => setSelected(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}

function topicLabel(topic: ContactTopic, summary: ContactTopicSummary[]) {
  return summary.find((entry) => entry.topic === topic)?.label ?? topic;
}

function TopicTab({
  label,
  count,
  unread,
  active,
  onClick,
}: {
  label: string;
  count: number;
  unread: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors',
        active
          ? 'border-transparent bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
      <span className="text-[11px] opacity-70">{count}</span>
      {unread > 0 && !active && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
    </button>
  );
}

function SubmissionDialog({
  submission,
  onClose,
  onUpdated,
}: {
  submission: ContactSubmission | null;
  onClose: () => void;
  onUpdated: (updated: ContactSubmission) => void;
}) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the draft whenever a different submission is opened, so notes typed
  // for one enquiry can never be saved onto another.
  useEffect(() => {
    setNotes(submission?.admin_notes ?? '');
    setError(null);
  }, [submission]);

  if (!submission) return null;

  async function save(fields: { status?: ContactSubmissionStatus; adminNotes?: string }) {
    if (!submission) return;
    setSaving(true);
    setError(null);
    try {
      onUpdated(await updateContactSubmission(submission.id, fields));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{submission.name}</DialogTitle>
        </DialogHeader>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Field label="Email">
            <a href={`mailto:${submission.email}`} className="text-brand hover:underline">
              {submission.email}
            </a>
          </Field>
          <Field label="Phone">{submission.phone ?? '—'}</Field>
          <Field label="Company">{submission.company ?? '—'}</Field>
          <Field label="Received">{new Date(submission.created_at).toLocaleString()}</Field>
        </dl>

        <div className="flex flex-col gap-1.5">
          <Label>Message</Label>
          <p className="whitespace-pre-wrap rounded-md border border-border p-4 text-sm">
            {submission.message}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="submission-status">Status</Label>
          <Select
            value={submission.status}
            onValueChange={(value) => save({ status: value as ContactSubmissionStatus })}
          >
            <SelectTrigger id="submission-status" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABEL) as ContactSubmissionStatus[]).map((option) => (
                <SelectItem key={option} value={option}>
                  {STATUS_LABEL[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="submission-notes">Internal notes</Label>
          <Textarea
            id="submission-notes"
            rows={4}
            maxLength={5000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Only visible to admins."
          />
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="flex gap-2">
          <Button
            type="button"
            disabled={saving || notes === (submission.admin_notes ?? '')}
            onClick={() => save({ adminNotes: notes })}
          >
            {saving ? 'Saving…' : 'Save notes'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
