'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, CheckCircle2, Plus, MoreVertical, Edit, Trash2, Globe, Phone, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import { useSuperAdminStore, Organization } from '@/store/superAdminStore';
import { ExportMenu } from '@/components/common/ExportMenu';

const ORG_EXPORT_COLUMNS = ['Name', 'Code', 'Domain', 'Admin Email', 'Status', 'Plan', 'Timezone', 'Admins', 'Students'];

export default function OrganizationsPage() {
  const { organizations, fetchOrganizations, addOrganization, updateOrganization, deleteOrganization } = useSuperAdminStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', adminEmail: '', domain: '', timezone: 'Asia/Kolkata' });

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const stats = [
    { title: 'Total Organizations', value: organizations.length.toString(), icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Active', value: organizations.filter(o => o.status === 'Active').length.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Total Admins', value: '6', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Total Students', value: organizations.reduce((s, o) => s + (o.studentsCount || 0), 0).toLocaleString(), icon: Users, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const handleAdd = async () => {
    if (!form.name || !form.code || !form.adminEmail) {
      toast.error('Please fill in all required fields');
      return;
    }
    await addOrganization({ ...form, plan: 'Basic', status: 'Active' });
    setForm({ name: '', code: '', adminEmail: '', domain: '', timezone: 'Asia/Kolkata' });
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteOrganization(id);
  };

  const handleToggleStatus = async (org: Organization) => {
    await updateOrganization(org.id, { status: org.status === 'Active' ? 'Inactive' : 'Active' });
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Organizations"
        description="Manage institutions and organizations registered on the platform."
        breadcrumbs={[
          { label: 'Super Admin', href: '/super-admin/dashboard' },
          { label: 'Organizations' }
        ]}
        showSearch={false}
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              exportKey="organizations"
              endpoint="/organizations/export"
              columns={ORG_EXPORT_COLUMNS}
              filename="organizations"
              disabled={organizations.length === 0}
            />
            <Button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add Organization
            </Button>
          </div>
        }
      />

      {/* Stats */}
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
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Admins</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{org.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Globe className="h-3 w-3" />{org.domain}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{org.code}</span></TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{org.adminEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell><span className="font-medium">N/A</span></TableCell>
                  <TableCell><span className="font-medium">{(org.studentsCount || 0).toLocaleString()}</span></TableCell>
                  <TableCell>
                    <Badge variant="outline" className={org.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}>
                      {org.status}
                    </Badge>
                  </TableCell>
                  <TableCell><span className="text-xs font-mono">{org.timezone}</span></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleStatus(org)} className="cursor-pointer">
                          <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                          <span>{org.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4 text-blue-600" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(org.id)} className="cursor-pointer text-red-600 focus:text-red-700">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
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

      {/* Add Organization Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Organization Name *</Label>
              <Input placeholder="e.g. NorthState University" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Organization Code *</Label>
              <Input placeholder="e.g. NSU-001" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Admin Email *</Label>
              <Input type="email" placeholder="admin@org.edu" value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Website Domain</Label>
                <Input placeholder="org.edu" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>IANA Timezone *</Label>
              <Input placeholder="Asia/Kolkata" value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">Add Organization</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
