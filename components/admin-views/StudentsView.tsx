'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Users, GraduationCap, ClipboardCheck, UserPlus, MoreVertical, Edit, Trash2, Eye, Plus, UploadCloud, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminStore } from '@/store/adminStore';
import { Student } from '@/types/admin';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/SkeletonTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StudentFormModal } from './modals/StudentFormModal';
import { FileImportStudentsModal } from './modals/FileImportStudentsModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface StudentsViewProps {
  role: 'admin' | 'super-admin';
  classId: string;
  className?: string;
  onBack?: () => void;
  breadcrumbs?: { label: string; href?: string; onClick?: () => void }[];
}

export function StudentsView({ role, classId, className, onBack, breadcrumbs }: StudentsViewProps) {
  const isSuperAdmin = role === 'super-admin';
  const { students, isLoading, fetchStudents, deleteStudent, sendStudentPasswordReset } = useAdminStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [accommodationFilter, setAccommodationFilter] = useState('all');
  const pageSize = 10;

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (classId) fetchStudents(classId);
  }, [classId, fetchStudents]);

  const handleAdd = () => {
    setStudentToEdit(null);
    setEditModalOpen(true);
  };

  // Filtering
  const filteredStudents = students.filter(s => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [s.name, s.registerNumber, s.email, s.phone]
      .some(value => (value || '').toLowerCase().includes(query));
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const hasAccommodation = (s.extraTimeMinutes || 0) > 0 || !!s.accessibilityNotes?.trim();
    const matchesAccommodation = accommodationFilter === 'all'
      || (accommodationFilter === 'yes' ? hasAccommodation : !hasAccommodation);
    return matchesSearch && matchesStatus && matchesAccommodation;
  });

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, accommodationFilter]);

  const handleExport = () => {
    if (filteredStudents.length === 0) return toast.error('There are no students to export');
    const safe = (value: unknown) => {
      let text = String(value ?? '');
      if (/^[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const rows = [
      ['Register Number', 'Name', 'Email', 'Phone', 'Status', 'Extra Time Minutes', 'Accessibility Notes'],
      ...filteredStudents.map(s => [s.registerNumber, s.name, s.email, s.phone, s.status, s.extraTimeMinutes || 0, s.accessibilityNotes || '']),
    ];
    const blob = new Blob(['\uFEFF' + rows.map(row => row.map(safe).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-${className || classId}-${new Date().toISOString().slice(0, 10)}.csv`.replace(/[^a-z0-9._-]/gi, '-');
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${filteredStudents.length} student${filteredStudents.length === 1 ? '' : 's'} exported`);
  };

  // Pagination
  const totalRecords = filteredStudents.length;
  const startIndex = (currentPage - 1) * pageSize;
  const currentStudents = filteredStudents.slice(startIndex, startIndex + pageSize);

  const stats = [
    { title: 'Total Students', value: students.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Active Students', value: students.filter(s => s.status === 'Active').length, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Suspended', value: students.filter(s => s.status === 'Suspended').length, icon: ClipboardCheck, color: 'text-red-600', bg: 'bg-red-100' },
    { 
      title: 'New Registrations (24h)', 
      value: students.filter(s => {
        if (!s.createdAt) return false;
        const createdDate = new Date(s.createdAt);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return createdDate >= oneDayAgo;
      }).length, 
      icon: UserPlus, 
      color: 'text-amber-600', 
      bg: 'bg-amber-100' 
    },
  ];

  const handleEdit = (student: Student) => {
    setStudentToEdit(student);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setStudentToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (studentToDelete) {
      await deleteStudent(studentToDelete);
      setDeleteConfirmOpen(false);
      setStudentToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={className ? `Students — ${className}` : 'Student Management'}
        description="Manage student records, assignments, and profiles."
        breadcrumbs={breadcrumbs || [
          { label: isSuperAdmin ? 'Super Admin' : 'Admin', href: `/${role}/dashboard` },
          { label: 'Students' }
        ]}
        showSearch={true}
        onSearch={setSearchTerm}
        onFilter={() => setShowFilters(value => !value)}
        onExport={handleExport}
        actions={
          <div className="flex gap-3">
            {onBack && (
              <Button onClick={onBack} variant="outline">
                Back to Classes
              </Button>
            )}
            <Button onClick={() => setImportModalOpen(true)} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950">
              <UploadCloud className="w-4 h-4 mr-2" /> Import File
            </Button>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Student
            </Button>
          </div>
        }
      />

      {showFilters && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
            <div className="w-full sm:w-56">
              <label className="mb-2 block text-sm font-medium" htmlFor="student-status-filter">Status</label>
              <Select value={statusFilter} onValueChange={value => value && setStatusFilter(value)}>
                <SelectTrigger id="student-status-filter"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem><SelectItem value="Suspended">Suspended</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-64">
              <label className="mb-2 block text-sm font-medium" htmlFor="student-accommodation-filter">Accommodation</label>
              <Select value={accommodationFilter} onValueChange={value => value && setAccommodationFilter(value)}>
                <SelectTrigger id="student-accommodation-filter"><SelectValue placeholder="Select accommodation" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All students</SelectItem><SelectItem value="yes">Has accommodation</SelectItem><SelectItem value="no">No accommodation</SelectItem></SelectContent>
              </Select>
            </div>
            <Button type="button" variant="ghost" onClick={() => { setStatusFilter('all'); setAccommodationFilter('all'); }}>Clear filters</Button>
            <span className="text-sm text-slate-500 sm:ml-auto" aria-live="polite">{filteredStudents.length} result{filteredStudents.length === 1 ? '' : 's'}</span>
          </CardContent>
        </Card>
      )}
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Table Area */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4"><SkeletonTable rows={5} cols={7} /></div>
          ) : currentStudents.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Register No</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Name</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Contact</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentStudents.map((student) => (
                  <TableRow key={student.id} className="border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">{student.registerNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{student.name}</span>
                        <span className="text-xs text-slate-500">{student.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{student.phone}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={`
                          ${student.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : ''}
                          ${student.status === 'Inactive' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : ''}
                          ${student.status === 'Suspended' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : ''}
                          font-medium border-0
                        `}
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 focus:outline-none">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4 text-slate-500" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(student)}>
                            <Edit className="mr-2 h-4 w-4 text-blue-500" /> Edit Student
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => sendStudentPasswordReset(student.id!)}>
                            <KeyRound className="mr-2 h-4 w-4 text-amber-500" /> Send Password Reset
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950" onClick={() => handleDeleteClick(student.id!)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState 
              title="No students found" 
              description={searchTerm ? `No students match your search "${searchTerm}".` : "There are currently no students registered in the system."}
              actionLabel={searchTerm ? "Clear Search" : "Add Student"}
              onAction={() => searchTerm ? setSearchTerm('') : setEditModalOpen(true)}
            />
          )}
        </div>
        
        <Pagination 
          currentPage={currentPage}
          pageSize={pageSize}
          totalRecords={totalRecords}
          onPageChange={setCurrentPage}
        />
      </Card>

      <StudentFormModal
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setTimeout(() => setStudentToEdit(null), 200);
        }}
        studentToEdit={studentToEdit}
        classId={classId}
      />

      <FileImportStudentsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        classId={classId}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Student"
        description="Are you sure you want to delete this student record? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
