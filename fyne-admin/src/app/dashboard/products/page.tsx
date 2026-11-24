'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { del, get, getErrorMessage } from '@/lib/api';
import { qk } from '@/lib/queries';
import { P } from '@/lib/access';
import { useAuth } from '@/providers/AuthProvider';
import type { ListResponse, Product } from '@/lib/types';
import { cn, formatINR } from '@/lib/utils';
import { DataTable, FilterSelect, defaultTableState, type Column, type TableState } from '@/components/data-table/DataTable';
import { ActiveBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader, Thumb } from '@/components/ui/misc';
import { ProductFormModal } from '@/features/products/ProductFormModal';
import { useCollectionOptions } from '@/features/collections/useCollectionOptions';

type StockStatus = '' | 'in_stock' | 'low_stock' | 'out_of_stock';

function ProductsView() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [table, setTable] = useState<TableState>(() => defaultTableState());
  const [status, setStatus] = useState(params.get('isActive') ?? '');
  const [collection, setCollection] = useState(params.get('collection') ?? '');
  const [stockStatus, setStockStatus] = useState<StockStatus>((params.get('stockStatus') as StockStatus) ?? '');
  const [modal, setModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const { data: collections = [] } = useCollectionOptions();

  // Deep links: ?edit=<id> (from search / dashboard), ?stockStatus=low_stock (from alerts)
  useEffect(() => {
    const edit = params.get('edit');
    if (edit) setModal({ open: true, id: edit });
    const s = params.get('stockStatus') as StockStatus | null;
    if (s) setStockStatus(s);
  }, [params]);

  const closeModal = useCallback(() => {
    setModal({ open: false, id: null });
    if (params.get('edit')) router.replace(pathname);
  }, [params, pathname, router]);

  const filters = useMemo(() => ({ isActive: status || undefined, collection: collection || undefined, stockStatus: stockStatus || undefined }), [status, collection, stockStatus]);
  const queryParams = { ...table, q: table.q || undefined, ...filters };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.products(queryParams),
    queryFn: () => get<ListResponse<Product>>('/admin/products', { params: queryParams }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success('Product deleted');
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setToDelete(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const setFilter = (fn: () => void) => { fn(); setTable((t) => ({ ...t, page: 1 })); };
  const canEdit = can(P.PRODUCTS_UPDATE);

  const columns: Column<Product>[] = [
    {
      id: 'image',
      header: 'Image',
      hideable: false,
      className: 'w-16',
      cell: (p) => <Thumb src={p.thumbnail ?? p.images?.[0]?.url} alt={p.name || p.sku} size={44} />,
    },
    {
      id: 'name',
      header: 'Name',
      sortKey: 'name',
      hideable: false,
      cell: (p) => (
        <div className="min-w-[180px]">
          <p className="font-medium text-ink">{p.name || p.sku}</p>
          {p.isFeatured && <span className="text-[11px] font-medium text-secondary">★ Featured</span>}
        </div>
      ),
    },
    { id: 'sku', header: 'SKU', sortKey: 'sku', cell: (p) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-ink-soft">{p.sku}</code> },
    { id: 'collection', header: 'Collection', cell: (p) => <span className="whitespace-nowrap">{typeof p.collection === 'object' ? p.collection?.name : '—'}</span> },
    { id: 'price', header: 'Price', sortKey: 'price', headerClassName: 'text-right', className: 'text-right font-medium tabular-nums text-ink', cell: (p) => formatINR(p.price) },
    {
      id: 'stock',
      header: 'Stock',
      sortKey: 'stock',
      cell: (p) => (
        <span
          className={cn(
            'inline-flex min-w-[44px] items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums',
            p.inventoryStatus === 'out_of_stock' && 'bg-danger-50 text-danger',
            p.inventoryStatus === 'low_stock' && 'bg-secondary-50 text-secondary-700',
            p.inventoryStatus === 'in_stock' && 'bg-primary-50 text-primary-700'
          )}
          title={p.inventoryStatus?.replace(/_/g, ' ')}
        >
          {p.stock}
        </span>
      ),
    },
    { id: 'status', header: 'Status', cell: (p) => <ActiveBadge active={p.isActive} /> },
    { id: 'updated', header: 'Updated', sortKey: 'updatedAt', defaultHidden: true, cell: (p) => new Date(p.updatedAt).toLocaleDateString('en-IN') },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      hideable: false,
      className: 'w-24 text-right',
      cell: (p) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {canEdit && (
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${p.name || p.sku}`} onClick={() => setModal({ open: true, id: p._id })}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can(P.PRODUCTS_DELETE) && (
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-danger-50 hover:text-danger" aria-label={`Delete ${p.name || p.sku}`} onClick={() => setToDelete(p)}>
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
        title="Products"
        description="Manage your artificial plants, trees and bush packs."
        actions={
          can(P.PRODUCTS_CREATE) && (
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal({ open: true, id: null })} disabled={!collections.length} title={!collections.length ? 'Create a collection first' : undefined}>
              Add product
            </Button>
          )
        }
      />

      <DataTable
        storageKey="products"
        columns={columns}
        data={data?.data}
        pagination={data?.pagination}
        rowKey={(p) => p._id}
        state={table}
        onStateChange={setTable}
        isLoading={isLoading}
        isFetching={isFetching}
        searchPlaceholder="Search name, SKU or tag…"
        onRowClick={canEdit ? (p) => setModal({ open: true, id: p._id }) : undefined}
        toolbar={
          <>
            <FilterSelect label="Status" value={status} onChange={(v) => setFilter(() => setStatus(v))}>
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Draft</option>
            </FilterSelect>
            <FilterSelect label="Collection" value={collection} onChange={(v) => setFilter(() => setCollection(v))}>
              <option value="">All collections</option>
              {collections.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </FilterSelect>
            <FilterSelect label="Inventory" value={stockStatus} onChange={(v) => setFilter(() => setStockStatus(v as StockStatus))}>
              <option value="">All inventory</option>
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
            </FilterSelect>
            {(status || collection || stockStatus) && (
              <button
                className="text-sm font-medium text-primary hover:text-primary-700"
                onClick={() => setFilter(() => { setStatus(''); setCollection(''); setStockStatus(''); if (params.toString()) router.replace(pathname); })}
              >
                Clear filters
              </button>
            )}
          </>
        }
        empty={{
          icon: <Package className="h-5 w-5" />,
          title: table.q || status || collection || stockStatus ? 'No products match' : 'No products yet',
          description: table.q || status || collection || stockStatus ? 'Try a different search or clear the filters.' : 'Add your first product to start selling.',
          action: !table.q && can(P.PRODUCTS_CREATE) ? <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal({ open: true, id: null })}>Add product</Button> : undefined,
        }}
      />

      <ProductFormModal open={modal.open} productId={modal.id} onClose={closeModal} />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete._id)}
        loading={deleteMutation.isPending}
        title="Delete product?"
        message={
          <>
            <strong className="text-ink">{toDelete?.name || toDelete?.sku}</strong> ({toDelete?.sku}) will be permanently removed along with its images. Past orders keep their copy.
            <span className="mt-2 block text-muted-foreground">Tip: set it to <em>Draft</em> instead to hide it without deleting.</span>
          </>
        }
      />
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsView />
    </Suspense>
  );
}
