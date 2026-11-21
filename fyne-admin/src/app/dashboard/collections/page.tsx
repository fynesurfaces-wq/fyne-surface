'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import { del, get, getApiError } from '@/lib/api';
import { qk } from '@/lib/queries';
import { P } from '@/lib/access';
import { useAuth } from '@/providers/AuthProvider';
import type { Collection, ListResponse } from '@/lib/types';
import { DataTable, defaultTableState, type Column, type TableState } from '@/components/data-table/DataTable';
import { ActiveBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader, Thumb } from '@/components/ui/misc';
import { CollectionFormModal } from '@/features/collections/CollectionFormModal';

function CollectionsView() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [table, setTable] = useState<TableState>(() => defaultTableState({ sort: 'sortOrder' }));
  const [editing, setEditing] = useState<Collection | null | undefined>(undefined); // undefined = closed, null = new
  const [toDelete, setToDelete] = useState<Collection | null>(null);

  const queryParams = { ...table, q: table.q || undefined };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.collections(queryParams),
    queryFn: () => get<ListResponse<Collection>>('/admin/collections', { params: queryParams }),
    placeholderData: keepPreviousData,
  });

  // Deep link from global search: ?edit=<id>
  useEffect(() => {
    const id = params.get('edit');
    if (!id) return;
    get<{ data: Collection }>(`/admin/collections/${id}`).then((r) => setEditing(r.data)).catch(() => toast.error('Collection not found'));
  }, [params]);

  const close = () => {
    setEditing(undefined);
    if (params.get('edit')) router.replace(pathname);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/admin/collections/${id}`),
    onSuccess: () => {
      toast.success('Collection deleted');
      qc.invalidateQueries({ queryKey: ['collections'] });
      setToDelete(null);
    },
    onError: (err) => {
      const e = getApiError(err);
      toast.error(e.code === 'COLLECTION_NOT_EMPTY' ? e.message : e.message || 'Delete failed');
      setToDelete(null);
    },
  });

  const columns: Column<Collection>[] = [
    { id: 'cover', header: 'Cover', hideable: false, className: 'w-20', cell: (c) => <Thumb src={c.coverImage?.url} alt={c.name} size={48} /> },
    {
      id: 'name',
      header: 'Collection',
      sortKey: 'name',
      hideable: false,
      cell: (c) => (
        <div>
          <p className="font-medium text-ink">{c.name}</p>
          <p className="text-xs text-muted-foreground">/collections/{c.slug}</p>
        </div>
      ),
    },
    {
      id: 'products',
      header: 'Products',
      cell: (c) => (
        <span className="tabular-nums">
          <span className="font-medium text-ink">{c.productCount ?? 0}</span>
          {c.productCount !== c.activeProductCount && <span className="text-muted-foreground"> ({c.activeProductCount} active)</span>}
        </span>
      ),
    },
    { id: 'order', header: 'Sort', sortKey: 'sortOrder', cell: (c) => <span className="tabular-nums">{c.sortOrder}</span> },
    { id: 'status', header: 'Status', cell: (c) => <ActiveBadge active={c.isActive} /> },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      hideable: false,
      className: 'w-24 text-right',
      cell: (c) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {can(P.COLLECTIONS_UPDATE) && (
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${c.name}`} onClick={() => setEditing(c)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can(P.COLLECTIONS_DELETE) && (
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-danger-50 hover:text-danger" aria-label={`Delete ${c.name}`} onClick={() => setToDelete(c)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Collections"
        description="Organise products into collections like “1.2mtr & Above” or “Bushes Collection”."
        actions={can(P.COLLECTIONS_CREATE) && <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing(null)}>Add collection</Button>}
      />
      <DataTable
        storageKey="collections"
        columns={columns}
        data={data?.data}
        pagination={data?.pagination}
        rowKey={(c) => c._id}
        state={table}
        onStateChange={setTable}
        isLoading={isLoading}
        isFetching={isFetching}
        searchPlaceholder="Search collections…"
        onRowClick={can(P.COLLECTIONS_UPDATE) ? (c) => setEditing(c) : undefined}
        empty={{
          icon: <FolderTree className="h-5 w-5" />,
          title: table.q ? 'No collections match' : 'No collections yet',
          description: table.q ? undefined : 'Create a collection before adding products.',
          action: !table.q && can(P.COLLECTIONS_CREATE) ? <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing(null)}>Add collection</Button> : undefined,
        }}
      />
      <CollectionFormModal open={editing !== undefined} collection={editing} onClose={close} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete._id)}
        loading={deleteMutation.isPending}
        title="Delete collection?"
        message={
          toDelete?.productCount ? (
            <>
              <strong className="text-ink">{toDelete.name}</strong> still has {toDelete.productCount} product(s). Move or delete them first — the server will refuse to delete a non-empty collection.
            </>
          ) : (
            <><strong className="text-ink">{toDelete?.name}</strong> will be permanently deleted.</>
          )
        }
      />
    </>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense>
      <CollectionsView />
    </Suspense>
  );
}
