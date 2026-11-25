'use client';

import { Suspense, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, getApiError } from '@/lib/api';
import { P } from '@/lib/access';
import { useAuth } from '@/providers/AuthProvider';
import type { ListResponse } from '@/lib/types';
import { DataTable, defaultTableState, type Column, type TableState } from '@/components/data-table/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader, Thumb } from '@/components/ui/misc';
import { ContentEditorModal } from '@/features/content/ContentEditorModal';

interface Article { _id: string; title: string; slug: string; excerpt?: string; coverImage?: { url: string; alt?: string }; status: 'draft' | 'published'; publishedAt?: string; updatedAt: string; tags?: string[] }

function ContentView() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [table, setTable] = useState<TableState>(() => defaultTableState({ limit: 20 }));
  const [modal, setModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [toDelete, setToDelete] = useState<Article | null>(null);
  const params = useMemo(() => ({ ...table, type: 'blog_post' }), [table]);
  const { data, isLoading, isFetching } = useQuery({ queryKey: ['blog-admin', params], queryFn: () => get<ListResponse<Article>>('/admin/content', { params }) });
  const remove = useMutation({
    mutationFn: (id: string) => del(`/admin/content/${id}`),
    onSuccess: () => { toast.success('Article deleted'); qc.invalidateQueries({ queryKey: ['blog-admin'] }); setToDelete(null); },
    onError: (error) => toast.error(getApiError(error).message),
  });
  const columns: Column<Article>[] = [
    { id: 'cover', header: 'Cover', hideable: false, className: 'w-16', cell: (article) => <Thumb src={article.coverImage?.url} alt={article.title} size={46} /> },
    { id: 'title', header: 'Article', sortKey: 'title', hideable: false, cell: (article) => <div className="min-w-[200px]"><p className="font-medium text-ink">{article.title}</p><p className="mt-0.5 text-xs text-muted-foreground">/blog/{article.slug}</p></div> },
    { id: 'status', header: 'Status', cell: (article) => <Badge tone={article.status === 'published' ? 'green' : 'gray'} dot>{article.status}</Badge> },
    { id: 'published', header: 'Published', sortKey: 'publishedAt', cell: (article) => article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-IN') : '—' },
    { id: 'updated', header: 'Updated', sortKey: 'updatedAt', cell: (article) => new Date(article.updatedAt).toLocaleDateString('en-IN') },
    { id: 'actions', header: <span className="sr-only">Actions</span>, hideable: false, className: 'w-24 text-right', cell: (article) => <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>{can(P.CONTENT_WRITE) && <Button variant="ghost" size="icon" aria-label={`Edit ${article.title}`} onClick={() => setModal({ open: true, id: article._id })}><Pencil className="h-4 w-4" /></Button>}{can(P.CONTENT_WRITE) && <Button variant="ghost" size="icon" aria-label={`Delete ${article.title}`} onClick={() => setToDelete(article)}><Trash2 className="h-4 w-4" /></Button>}</div> },
  ];
  const close = () => setModal({ open: false, id: null });

  return <>
    <PageHeader title="Blog Management" description="Create, edit and publish articles on the FYNE Journal." actions={can(P.CONTENT_WRITE) && <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal({ open: true, id: null })}>New article</Button>} />
    <DataTable storageKey="blog-posts" columns={columns} data={data?.data} pagination={data?.pagination} rowKey={(article) => article._id} state={table} onStateChange={setTable} isLoading={isLoading} isFetching={isFetching} searchPlaceholder="Search articles…" onRowClick={can(P.CONTENT_WRITE) ? (article) => setModal({ open: true, id: article._id }) : undefined} empty={{ icon: <FileText className="h-5 w-5" />, title: 'No blog articles yet', description: 'Create a draft, add a cover image and publish it to show it on the storefront.' }} />
    <ContentEditorModal open={modal.open} contentId={modal.id} onClose={close} />
    <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => toDelete && remove.mutate(toDelete._id)} loading={remove.isPending} title="Delete article?" message={<><strong className="text-ink">{toDelete?.title}</strong> will be removed from the blog and storefront.</>} />
  </>;
}

export default function BlogAdminPage() { return <Suspense><ContentView /></Suspense>; }
