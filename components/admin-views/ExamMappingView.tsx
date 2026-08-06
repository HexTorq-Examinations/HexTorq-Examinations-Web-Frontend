'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Pagination } from '@/components/common/Pagination';
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
import { MoreVertical, Edit, Trash2, CalendarPlus, MapPin, Search } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { ExamMapping, Exam } from '@/types/admin';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/SkeletonTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ExamMappingFormModal } from './modals/ExamMappingFormModal';
import { ExportMenu } from '@/components/common/ExportMenu';

const MAPPING_EXPORT_COLUMNS = ['Exam', 'Class', 'Date', 'Start Time', 'End Time', 'Timezone', 'Hall', 'Status', 'Grace (min)'];
const PAGE_SIZE = 10;

type ListTab = 'active' | 'test' | 'archived';

// A mapping is "done" once its exam window (including grace) has actually
// passed — not a calendar-day buffer, the real end of the scheduled window.
const isMappingArchived = (mapping: ExamMapping) => {
  if (!mapping.endAt) return false;
  const deadline = new Date(mapping.endAt).getTime() + (mapping.graceMinutes || 0) * 60 * 1000;
  return Date.now() > deadline;
};

export function ExamMappingView() {
  const { exams, examMappings, isLoading, fetchExams, fetchExamMappings, deleteExamMapping } = useAdminStore();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [mappingToEdit, setMappingToEdit] = useState<ExamMapping | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<string | null>(null);

  const [examTab, setExamTab] = useState<'active' | 'test'>('active');
  const [examPage, setExamPage] = useState(1);

  const [mappingTab, setMappingTab] = useState<ListTab>('active');
  const [mappingSearch, setMappingSearch] = useState('');
  const [mappingPage, setMappingPage] = useState(1);

  useEffect(() => {
    fetchExams();
    fetchExamMappings();
  }, [fetchExams, fetchExamMappings]);

  const selectedExam = exams.find((e) => e.id === selectedExamId) || null;
  const publishedExams = exams.filter((exam) => exam.status === 'Published');

  const examsByTab = publishedExams.filter((exam) => (examTab === 'test' ? !!exam.isTestExam : !exam.isTestExam));
  const examTestCount = publishedExams.filter((exam) => exam.isTestExam).length;
  const examTotalRecords = examsByTab.length;
  const examStartIndex = (examPage - 1) * PAGE_SIZE;
  const currentExams = examsByTab.slice(examStartIndex, examStartIndex + PAGE_SIZE);

  const mappingsByTab = examMappings.filter((m) => {
    if (mappingTab === 'test') return !!m.examIsTest;
    if (mappingTab === 'archived') return !m.examIsTest && isMappingArchived(m);
    return !m.examIsTest && !isMappingArchived(m);
  });
  const mappingTestCount = examMappings.filter((m) => m.examIsTest).length;
  const mappingArchivedCount = examMappings.filter((m) => !m.examIsTest && isMappingArchived(m)).length;
  const filteredMappings = mappingsByTab.filter((m) =>
    !mappingSearch
    || m.examTitle?.toLowerCase().includes(mappingSearch.toLowerCase())
    || m.className?.toLowerCase().includes(mappingSearch.toLowerCase())
  );
  const mappingTotalRecords = filteredMappings.length;
  const mappingStartIndex = (mappingPage - 1) * PAGE_SIZE;
  const currentMappings = filteredMappings.slice(mappingStartIndex, mappingStartIndex + PAGE_SIZE);

  useEffect(() => { setExamPage(1); }, [examTab]);
  useEffect(() => { setMappingPage(1); }, [mappingTab, mappingSearch]);

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

  const renderExamCard = (exam: Exam) => (
    <div key={exam.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{exam.title}</p>
        <p className="text-xs text-slate-500">{exam.subject} • {exam.mappingCount || 0} mapping{exam.mappingCount === 1 ? '' : 's'}</p>
      </div>
      <Button size="sm" variant="outline" onClick={() => handleMap(exam.id!)} className="shrink-0">
        <CalendarPlus className="w-3.5 h-3.5 mr-1.5" /> Map
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Exam Mapping"
        description="Assign exams to classes with a date, time, and hall — this is what schedules the exam for real students."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Exam Mapping' }]}
        showSearch={false}
        actions={
          <ExportMenu
            exportKey="exam-mappings"
            endpoint="/exam-mappings/export"
            columns={MAPPING_EXPORT_COLUMNS}
            filename="exam-mappings"
            disabled={examMappings.length === 0}
          />
        }
      />

      {/* Exams available to map */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <Tabs value={examTab} onValueChange={(v) => setExamTab(v as 'active' | 'test')}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Exams</h3>
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="test">Test Exams{examTestCount > 0 ? ` (${examTestCount})` : ''}</TabsTrigger>
              </TabsList>
            </div>
            {(['active', 'test'] as const).map((tab) => (
              <TabsContent key={tab} value={tab}>
                {examsByTab.length === 0 ? (
                  <p className="text-sm text-slate-500 mt-2">
                    {tab === 'test' ? 'No test exams are available to map.' : 'No published exams are available. Add all questions and publish an exam before mapping it to a class.'}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
                      {currentExams.map(renderExamCard)}
                    </div>
                    <Pagination currentPage={examPage} totalRecords={examTotalRecords} pageSize={PAGE_SIZE} onPageChange={setExamPage} />
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Existing mappings */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 pt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Scheduled Mappings</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={mappingSearch}
                onChange={(e) => setMappingSearch(e.target.value)}
                placeholder="Search exam or class..."
                className="pl-8"
              />
            </div>
          </div>
          <Tabs value={mappingTab} onValueChange={(v) => setMappingTab(v as ListTab)}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="test">Test Exams{mappingTestCount > 0 ? ` (${mappingTestCount})` : ''}</TabsTrigger>
              <TabsTrigger value="archived">Archived{mappingArchivedCount > 0 ? ` (${mappingArchivedCount})` : ''}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="overflow-x-auto mt-4">
          {isLoading ? (
            <div className="p-4"><SkeletonTable rows={5} cols={6} /></div>
          ) : currentMappings.length > 0 ? (
            <>
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
                  {currentMappings.map((mapping) => (
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
              <Pagination currentPage={mappingPage} totalRecords={mappingTotalRecords} pageSize={PAGE_SIZE} onPageChange={setMappingPage} />
            </>
          ) : (
            <EmptyState
              title={mappingTab === 'archived' ? 'No archived mappings' : mappingTab === 'test' ? 'No test exam mappings' : 'No exam mappings yet'}
              description={mappingTab === 'active' ? 'Map an exam to a class above to schedule it for real students.' : 'Nothing here yet.'}
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
