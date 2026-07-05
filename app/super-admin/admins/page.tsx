'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserPlus, UserCheck, Clock, Search, Filter, Download, MoreVertical, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import { useSuperAdminStore, AdminUser } from '@/store/superAdminStore';

export default function AdminsPage() {
  const { admins, fetchAdmins, addAdmin, updateAdmin, deleteAdmin, organizations, fetchOrganizations } = useSuperAdminStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAdmins();
    fetchOrganizations();
  }, [fetchAdmins, fetchOrganizations]);
  const [addOpen, setAddOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', employeeId: '', role: 'Admin' as 'Admin' | 'Super Admin', organizationId: '' });

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { title: 'Total Admins', value: admins.length.toString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Active Admins', value: admins.filter(a => a.status === 'Active').length.toString(), icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'New This Month', value: '2', icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Avg. Daily Logins', value: '8.5', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const openAdd = () => {
    setForm({ name: '', email: '', phone: '', employeeId: '', role: 'Admin', organizationId: '' });
    setEditAdmin(null);
    setAddOpen(true);
  };

  const openEdit = (admin: AdminUser) => {
    setForm({
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      employeeId: admin.employeeId,
      role: admin.role,
      organizationId: admin.organizationId || '',
    });
    setEditAdmin(admin);
    setAddOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    if (form.role === 'Admin' && !form.organizationId) { toast.error('Please select an organization for this Admin'); return; }

    if (editAdmin) {
      await updateAdmin(editAdmin.id, form);
    } else {
      await addAdmin({
        ...form,
        employeeId: form.employeeId || `EMP-${Math.floor(Math.random() * 1000)}`,
        status: 'Active'
      });
    }
    setAddOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    await deleteAdmin(deleteId);
    setDeleteId(null);
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    await updateAdmin(admin.id, { status: admin.status === 'Active' ? 'Inactive' : 'Active' });
  };

  const handleExport = () => {
    const csv = ['Name,Employee ID,Email,Phone,Status', ...admins.map(a => `${a.name},${a.employeeId},${a.email},${a.phone},${a.status}`)].join('\n');
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.setAttribute('download', 'admins.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success('Export downloaded');
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Admin Management"
        description="Manage system administrators and their permissions."
        breadcrumbs={[
          { label: 'Super Admin', href: '/super-admin/dashboard' },
          { label: 'Admins' }
        ]}
        showSearch={false}
        actions={
          <Button onClick={openAdd} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Admin
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-4 rounded-xl ${s.bg} dark:bg-opacity-20`}>
                <s.icon className={`w-8 h-8 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Search admins..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 dark:bg-slate-900/50"
              />
            </div>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="w-[200px]">Admin Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400">No admins found matching your search.</TableCell>
                </TableRow>
              ) : filtered.map((admin) => (
                <TableRow key={admin.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{admin.name}</TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">{admin.employeeId}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-900 dark:text-slate-100">{admin.email}</span>
                      <span className="text-xs text-slate-500">{admin.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400">{admin.role}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400 text-sm">{admin.organizationName || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={admin.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}>
                      {admin.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{admin.lastLogin}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(admin)} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4 text-blue-600" /><span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(admin)} className="cursor-pointer">
                          <UserCheck className="mr-2 h-4 w-4 text-emerald-600" />
                          <span>{admin.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteId(admin.id)} className="cursor-pointer text-red-600 focus:text-red-700">
                          <Trash2 className="mr-2 h-4 w-4" /><span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">Showing {filtered.length} of {admins.length} entries</p>
      </div>

      {/* Add/Edit Admin Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editAdmin ? 'Edit Admin' : 'Add New Admin'}</DialogTitle>
            <DialogDescription>Fill in the admin details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input placeholder="e.g. Alice Smith" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input type="email" placeholder="admin@exam.edu" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+1 555-0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input placeholder="EMP-001" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={(val) => setForm(f => ({ ...f, role: (val || 'Admin') as 'Admin' | 'Super Admin' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === 'Admin' && (
              <div className="space-y-2">
                <Label>Organization *</Label>
                <Select value={form.organizationId} onValueChange={(val) => setForm(f => ({ ...f, organizationId: val || '' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {organizations.length === 0 && (
                  <p className="text-xs text-amber-600">No organizations yet — create one first under Organizations.</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white">
              {editAdmin ? 'Save Changes' : 'Add Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Admin</DialogTitle>
            <DialogDescription>Are you sure you want to remove this admin? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
