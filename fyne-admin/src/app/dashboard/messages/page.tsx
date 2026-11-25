'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, getApiError, patch } from '@/lib/api';
import type { ListResponse } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/misc';
import { EmptyState } from '@/components/ui/misc';

type MessageStatus = 'new' | 'read' | 'replied';
type ContactMessage = { _id: string; name: string; email?: string; phone?: string; subject?: string; message: string; status: MessageStatus; createdAt: string };
const STATUSES: MessageStatus[] = ['new', 'read', 'replied'];

export default function ContactMessagesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const queryParams = { page, limit: 20, status: status || undefined, q: q.trim() || undefined, sort: '-createdAt' };
  const queryKey = ['contact-messages', queryParams];
  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => get<ListResponse<ContactMessage>>('/admin/contact-messages', { params: queryParams }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
  const update = useMutation({
    mutationFn: ({ id, next }: { id: string; next: MessageStatus }) => patch<{ data: ContactMessage }>(`/admin/contact-messages/${id}`, { status: next }),
    onSuccess: () => { toast.success('Message status updated'); qc.invalidateQueries({ queryKey: ['contact-messages'] }); },
    onError: (error) => toast.error(getApiError(error).message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del(`/admin/contact-messages/${id}`),
    onSuccess: () => { toast.success('Message deleted'); qc.invalidateQueries({ queryKey: ['contact-messages'] }); },
    onError: (error) => toast.error(getApiError(error).message),
  });

  return <>
    <PageHeader title="Contact Messages" description="Review and manage enquiries submitted through the storefront contact form." />
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <input value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="Search name, email or message…" aria-label="Search contact messages" className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary sm:max-w-sm" />
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter by status" className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary">
          <option value="">All statuses</option>{STATUSES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
        </select>
      </div>
      {isLoading ? <p className="p-8 text-sm text-muted-foreground">Loading messages…</p> : data?.data.length ? <>
        <ul className="divide-y divide-border">
          {data.data.map((message) => <li key={message._id} className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-ink">{message.name}</h2><span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-primary-800">{message.status}</span><time className="text-xs text-muted-foreground">{formatDate(message.createdAt, true)}</time></div>
                <p className="mt-2 text-sm font-medium text-ink">{message.subject || 'General enquiry'}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-soft">{message.message}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {message.email && <a className="hover:text-primary" href={`mailto:${message.email}`}>{message.email}</a>}
                  {message.phone && <a className="hover:text-primary" href={`tel:${message.phone.replace(/[^+\d]/g, '')}`}>{message.phone}</a>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select value={message.status} onChange={(event) => update.mutate({ id: message._id, next: event.target.value as MessageStatus })} aria-label={`Status for ${message.name}`} className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary" disabled={update.isPending}>
                  {STATUSES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
                </select>
                <button type="button" onClick={() => { if (window.confirm('Delete this contact message?')) remove.mutate(message._id); }} aria-label={`Delete message from ${message.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-danger-200 hover:bg-danger-50 hover:text-danger" disabled={remove.isPending}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </li>)}
        </ul>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span>{isFetching ? 'Refreshing…' : `${data.pagination.total} message${data.pagination.total === 1 ? '' : 's'}`}</span>
          <div className="flex items-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={!data.pagination.hasPrevPage || isFetching} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40">Previous</button><span>Page {data.pagination.page} of {Math.max(1, data.pagination.totalPages)}</span><button type="button" onClick={() => setPage((current) => current + 1)} disabled={!data.pagination.hasNextPage || isFetching} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40">Next</button></div>
        </div>
      </> : <EmptyState icon={<Mail className="h-5 w-5" />} title="No contact messages" description="Website enquiries will appear here when someone submits the contact form." />}
    </section>
  </>;
}
