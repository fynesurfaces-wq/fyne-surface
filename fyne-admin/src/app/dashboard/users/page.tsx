'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { del, get, getApiError, getFieldErrors, patch, post } from '@/lib/api';
import { qk } from '@/lib/queries';
import { useAuth } from '@/providers/AuthProvider';
import { ROLE_LABEL } from '@/lib/access';
import type { ListResponse, Role, User } from '@/lib/types';
import { formatDate, initials } from '@/lib/utils';
import { DataTable, FilterSelect, defaultTableState, type Column, type TableState } from '@/components/data-table/DataTable';
import { Badge, RoleBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Field, Input, Select } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Overlay';
import { PageHeader } from '@/components/ui/misc';

const createSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z
    .string()
    .min(10, 'At least 10 characters')
    .max(128)
    .regex(/[a-z]/, 'Add a lowercase letter')
    .regex(/[A-Z]/, 'Add an uppercase letter')
    .regex(/[0-9]/, 'Add a number'),
  role: z.enum(['admin', 'editor']),
});
type CreateValues = z.infer<typeof createSchema>;

const ROLE_HELP: Record<'admin' | 'editor', string> = {
  admin: 'Manages products, collections & customers; can view orders. Cannot manage staff.',
  editor: 'Can create and edit products & collections only. No orders or customer data.',
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [table, setTable] = useState<TableState>(() => defaultTableState());
  const [role, setRole] = useState('');
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<User | null>(null);

  const queryParams = { ...table, q: table.q || undefined, role: role || undefined };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.users(queryParams),
    queryFn: () => get<ListResponse<User>>('/admin/users', { params: queryParams }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => patch(`/admin/users/${id}/role`, { role }),
    onSuccess: (_, v) => { toast.success(`Role changed to ${ROLE_LABEL[v.role]}`); invalidate(); },
    onError: (e) => toast.error(getApiError(e).message),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => patch(`/admin/users/${id}/status`, { isActive }),
    onSuccess: (_, v) => { toast.success(v.isActive ? 'User activated' : 'User deactivated and signed out'); invalidate(); },
    onError: (e) => toast.error(getApiError(e).message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/admin/users/${id}`),
    onSuccess: () => { toast.success('User deleted'); invalidate(); setToDelete(null); },
    onError: (e) => toast.error(getApiError(e).message),
  });

  const isLocked = (u: User) => u.role === 'superadmin' || u._id === me?._id;

  const columns: Column<User>[] = [
    {
      id: 'user',
      header: 'User',
      sortKey: 'name',
      hideable: false,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${u.isActive ? 'bg-primary-50 text-primary-700' : 'bg-muted text-muted-foreground'}`}>
            {initials(u.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">
              {u.name} {u._id === me?._id && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      sortKey: 'role',
      cell: (u) =>
        isLocked(u) ? (
          <RoleBadge role={u.role} />
        ) : (
          <Select
            aria-label={`Role for ${u.name}`}
            value={u.role}
            disabled={roleMutation.isPending}
            onChange={(e) => roleMutation.mutate({ id: u._id, role: e.target.value as Role })}
            containerClassName="w-32"
            className="h-8 text-xs"
          >
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
          </Select>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (u) =>
        isLocked(u) ? (
          <Badge tone="green" dot>Active</Badge>
        ) : (
          <button
            onClick={() => statusMutation.mutate({ id: u._id, isActive: !u.isActive })}
            disabled={statusMutation.isPending}
            title={u.isActive ? 'Click to deactivate' : 'Click to activate'}
            className="rounded-full focus-visible:outline-none focus-visible:shadow-ring"
          >
            <Badge tone={u.isActive ? 'green' : 'gray'} dot>{u.isActive ? 'Active' : 'Deactivated'}</Badge>
          </button>
        ),
    },
    { id: 'lastLogin', header: 'Last login', sortKey: 'lastLoginAt', cell: (u) => <span className="whitespace-nowrap text-xs">{u.lastLoginAt ? formatDate(u.lastLoginAt, true) : 'Never'}</span> },
    { id: 'created', header: 'Added', sortKey: 'createdAt', defaultHidden: true, cell: (u) => <span className="text-xs">{formatDate(u.createdAt)}{u.createdBy ? ` by ${u.createdBy.name}` : ''}</span> },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      hideable: false,
      className: 'w-16 text-right',
      cell: (u) =>
        isLocked(u) ? (
          <Lock className="ml-auto h-4 w-4 text-gray-300" aria-label="Protected account" />
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-danger-50 hover:text-danger" aria-label={`Delete ${u.name}`} onClick={() => setToDelete(u)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="User Management"
        description="Invite staff and control what they can access."
        actions={<Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setCreating(true)}>Add user</Button>}
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(['superadmin', 'admin', 'editor'] as Role[]).map((r) => (
          <div key={r} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-card">
            <ShieldCheck className={`mt-0.5 h-5 w-5 ${r === 'superadmin' ? 'text-purple-600' : r === 'admin' ? 'text-primary' : 'text-info'}`} />
            <div>
              <p className="text-sm font-semibold text-ink">{ROLE_LABEL[r]}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{r === 'superadmin' ? 'Full access, including staff management.' : ROLE_HELP[r as 'admin' | 'editor']}</p>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        storageKey="users"
        columns={columns}
        data={data?.data}
        pagination={data?.pagination}
        rowKey={(u) => u._id}
        state={table}
        onStateChange={setTable}
        isLoading={isLoading}
        isFetching={isFetching}
        searchPlaceholder="Search name or email…"
        toolbar={
          <FilterSelect label="Role" value={role} onChange={(v) => { setRole(v); setTable((t) => ({ ...t, page: 1 })); }}>
            <option value="">All roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
          </FilterSelect>
        }
      />

      <CreateUserModal open={creating} onClose={() => setCreating(false)} onCreated={invalidate} />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete._id)}
        loading={deleteMutation.isPending}
        title="Delete user?"
        message={<><strong className="text-ink">{toDelete?.name}</strong> ({toDelete?.email}) will lose access immediately. Consider deactivating instead to keep their history.</>}
      />
    </>
  );
}

function CreateUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [show, setShow] = useState(false);
  const { register, handleSubmit, reset, setError, watch, formState: { errors } } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', email: '', password: '', role: 'editor' },
  });
  const role = watch('role');

  const mutation = useMutation({
    mutationFn: (v: CreateValues) => post<{ data: User }>('/admin/users', v),
    onSuccess: ({ data }) => {
      toast.success(`${data.name} added as ${ROLE_LABEL[data.role]}`);
      onCreated();
      reset();
      onClose();
    },
    onError: (err) => {
      const e = getApiError(err);
      if (e.code === 'DUPLICATE_KEY') return setError('email', { message: 'A user with this email already exists' });
      const fields = getFieldErrors(err);
      if (fields.length) fields.forEach((f) => setError(f.field as keyof CreateValues, { message: f.message }));
      else toast.error(e.message);
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Add user"
      description="They can sign in immediately with these credentials."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button type="submit" form="user-form" loading={mutation.isPending}>Create user</Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="u-name" required error={errors.name?.message}>
          <Input id="u-name" autoComplete="off" invalid={!!errors.name} {...register('name')} />
        </Field>
        <Field label="Email" htmlFor="u-email" required error={errors.email?.message}>
          <Input id="u-email" type="email" autoComplete="off" invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field label="Temporary password" htmlFor="u-pass" required error={errors.password?.message} hint="10+ characters with upper & lower case letters and a number.">
          <div className="relative">
            <Input id="u-pass" type={show ? 'text' : 'password'} autoComplete="new-password" className="pr-10" invalid={!!errors.password} {...register('password')} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Role" htmlFor="u-role" required hint={ROLE_HELP[role]}>
          <Select id="u-role" {...register('role')}>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
