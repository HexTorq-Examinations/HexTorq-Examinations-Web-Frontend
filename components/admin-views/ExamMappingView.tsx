'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, CalendarPlus, MapPin, Archive } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { ExamMapping } from '@/types/admin';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/SkeletonTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ExamMappingFormModal } from './modals/ExamMappingFormModal';

export function ExamMappingView() {
  const { exams, examMappings, isLoading, fetchExams, fetchExamMappings, deleteExamMapping } = useAdminStore();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [mappingToEdit, setMappingToEdit] = useState<ExamMapping | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchExamMappings();
  }, [fetchExams, fetchExamMappings]);

  const selectedExam = exams.find((e) => e.id === selectedExamId) || null;
  const publishedExams = exams.filter((exam) => exam.status === 'Published');

  // A mapping older than 30 days past its own end time is "done" — keep the
  // table focused on what's current instead of piling up every exam ever run.
  const RECENT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
  const isRecentMapping = (mapping: ExamMapping) => Date.now() - new Date(mapping.endAt).getTime() < RECENT_WINDOW_MS;
  const archivedCount = examMappings.filter((m) => !isRecentMapping(m)).length;
  const visibleMappings = showArchived ? examMappings : examMappings.filter(isRecentMapping);

  const handleMap = (examId: string) => {
    setSelectedExamId(examId);
    setMappingToEdit(null);
    setFormOpen(true);
  };

  const handleEdit = (mapping: ExamMapping) => {
    setSelectedExamId(mapping.examId);
    setMappingToEdit(mapping);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setMappingToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (mappingToDelete) {
      await deleteExamMapping(mappingToDelete);
      setDeleteConfirmOpen(false);
      setMappingToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Exam Mapping"
        description="Assign exams to classes with a date, time, and hall — this is what schedules the exam for real students."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Exam Mapping' }]}
        showSearch={false}
      />

      {/* Exams available to map */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Exams</h3>
          {publishedExams.length === 0 ? (
            <p className="text-sm text-slate-500">No published exams are available. Add all questions and publish an exam before mapping it to a class.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {publishedExams.map((exam) => (
                <div key={exam.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{exam.title}</p>
                    <p className="text-xs text-slate-500">{exam.subject} • {exam.mappingCount || 0} mapping{exam.mappingCount === 1 ? '' : 's'}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleMap(exam.id!)} className="shrink-0">
                    <CalendarPlus className="w-3.5 h-3.5 mr-1.5" /> Map
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing mappings */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Scheduled Mappings</h3>
          {archivedCount > 0 && (
            <Button size="sm" variant="outline" onClick={() => setShowArchived((v) => !v)}>
              <Archive className="w-3.5 h-3.5 mr-1.5" />
              {showArchived ? 'Hide archived' : `Show archived (${archivedCount})`}
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4"><SkeletonTable rows={5} cols={6} /></div>
          ) : visibleMappings.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Exam</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Class</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Date</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Time</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Hall</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMappings.map((mapping) => (
                  <TableRow key={mapping.id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">{mapping.examTitle}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{mapping.className}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{new Date(mapping.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{mapping.startTime} - {mapping.endTime}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {mapping.hall}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium border-0 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                        {mapping.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 focus:outline-none">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(mapping)}>
                            <Edit className="mr-2 h-4 w-4 text-blue-500" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950" onClick={() => handleDeleteClick(mapping.id!)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Remove
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
              title="No exam mappings yet"
              description="Map an exam to a class above to schedule it for real students."
            />
          )}
        </div>
      </Card>

      <ExamMappingFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setTimeout(() => { setMappingToEdit(null); setSelectedExamId(''); }, 200);
        }}
        exam={selectedExam}
        mappingToEdit={mappingToEdit}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Remove Exam Mapping"
        description="Are you sure you want to remove this mapping? Students in this class will no longer see the exam."
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
