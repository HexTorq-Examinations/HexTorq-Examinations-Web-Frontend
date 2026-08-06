'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardCheck, PlayCircle, CalendarClock, Edit3, MoreVertical, Settings, Eye, Copy, Trash2, Send, Users, Edit, Plus, ListChecks, MonitorPlay } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
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
import { Exam } from '@/types/admin';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/SkeletonTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ExamFormModal } from './modals/ExamFormModal';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StudentExamPreview, type PreviewExam } from './StudentExamPreview';
import { sanitizeQuestionOptions } from '@/lib/questionOptions';
import { ExportMenu } from '@/components/common/ExportMenu';

const EXAM_EXPORT_COLUMNS = ['Title', 'Subject', 'Status', 'Duration (min)', 'Total Marks', 'Passing Marks', 'Questions', 'Mappings', 'Version', 'Test Exam'];

interface ExamsViewProps {
  role: 'admin' | 'super-admin';
}

export function ExamsView({ role }: ExamsViewProps) {
  const isSuperAdmin = role === 'super-admin';
  const router = useRouter();
  const { exams, isLoading, fetchExams, deleteExam, updateExam, duplicateExam } = useAdminStore();
  const [preview, setPreview] = useState<(Exam & { questions: { id: string; text: string; options: string[]; correctAnswer: number; marks: number }[] }) | null>(null);
  const [studentPreview, setStudentPreview] = useState<PreviewExam | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  // Closed exams are done, and test exams are for trying things out — keep
  // the default list focused on what's actually active instead of piling up
  // every exam ever run, especially with duplicate/versioned copies.
  const [examTab, setExamTab] = useState<'active' | 'test' | 'archived'>('active');

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => { setCurrentPage(1); }, [examTab]);

  const handleAdd = () => {
    setExamToEdit(null);
    setEditModalOpen(true);
  };

  const testCount = exams.filter((e) => e.isTestExam).length;
  const archivedCount = exams.filter((e) => !e.isTestExam && e.status === 'Closed').length;

  // Filtering
  const filteredExams = exams.filter(e => {
    const matchesTab = examTab === 'test' ? !!e.isTestExam
      : examTab === 'archived' ? (!e.isTestExam && e.status === 'Closed')
      : (!e.isTestExam && e.status !== 'Closed');
    return matchesTab && (
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Pagination
  const totalRecords = filteredExams.length;
  const startIndex = (currentPage - 1) * pageSize;
  const currentExams = filteredExams.slice(startIndex, startIndex + pageSize);

  const stats = [
    { title: 'Total Exams', value: exams.length, icon: ClipboardCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Published', value: exams.filter(e => e.status === 'Published').length, icon: PlayCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Closed', value: exams.filter(e => e.status === 'Closed').length, icon: CalendarClock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Drafts', value: exams.filter(e => e.status === 'Draft').length, icon: Edit3, color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  const handleEdit = (exam: Exam) => {
    setExamToEdit(exam);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setExamToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (examToDelete) {
      await deleteExam(examToDelete);
      setDeleteConfirmOpen(false);
      setExamToDelete(null);
    }
  };

  const handleDuplicate = async (exam: Exam) => {
    if (exam.id) await duplicateExam(exam.id);
  };

  const handlePreview = async (exam: Exam) => {
    if (!exam.id) return;
    const { data } = await api.get(`/exams/${exam.id}/preview`);
    setPreview({ ...data, questions: (data.questions || []).map(sanitizeQuestionOptions) });
  };

  const handleStudentPreview = async (exam: Exam) => {
    if (!exam.id) return;
    const { data } = await api.get(`/exams/${exam.id}/preview`);
    setStudentPreview({ ...data, questions: (data.questions || []).map(sanitizeQuestionOptions) });
  };

  const handleManageQuestions = (exam: Exam) => {
    router.push(`/${role}/exams/questions?examId=${exam.id}`);
  };

  const handlePublish = async (exam: Exam) => {
    if (exam.id) {
      if (!exam.questionCount) {
        toast.error('Add questions before publishing this exam');
        return;
      }
      await updateExam(exam.id, { status: 'Published' });
      toast.success(`Exam ${exam.title} published`);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader 
        title="Exam Management" 
        description="Create, configure, and monitor examinations."
        breadcrumbs={[
          { label: isSuperAdmin ? 'Super Admin' : 'Admin', href: `/${role}/dashboard` },
          { label: 'Exams' }
        ]}
        showSearch={true}
        onSearch={setSearchTerm}
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              exportKey="exams"
              endpoint="/exams/export"
              columns={EXAM_EXPORT_COLUMNS}
              filename="exams"
              disabled={exams.length === 0}
            />
            <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Create Exam
            </Button>
          </div>
        }
      />

      <Tabs value={examTab} onValueChange={(v) => setExamTab(v as 'active' | 'test' | 'archived')}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="test">Test Exams{testCount > 0 ? ` (${testCount})` : ''}</TabsTrigger>
          <TabsTrigger value="archived">Archived{archivedCount > 0 ? ` (${archivedCount})` : ''}</TabsTrigger>
        </TabsList>
      </Tabs>

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

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4"><SkeletonTable rows={5} cols={7} /></div>
          ) : currentExams.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Exam Details</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Subject</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Duration</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Mappings</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentExams.map((exam) => (
                  <TableRow key={exam.id} className="border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">{exam.title}{exam.isTestExam && <Badge className="border-0 bg-amber-100 text-amber-700">TEST</Badge>}</span>
                        <span className="text-xs text-slate-500">{exam.questionCount || 0} Questions • {exam.totalMarks} Marks</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{exam.subject}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{exam.duration} mins</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Users className="w-3.5 h-3.5" /> {exam.mappingCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`
                          ${exam.status === 'Published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : ''}
                          ${exam.status === 'Closed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : ''}
                          ${exam.status === 'Draft' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : ''}
                          font-medium border-0
                        `}
                      >
                        {exam.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 focus:outline-none">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {exam.status === 'Draft' && (
                            <DropdownMenuItem className="cursor-pointer text-emerald-600 focus:text-emerald-600" onClick={() => handlePublish(exam)}>
                              <Send className="mr-2 h-4 w-4" /> Publish Exam
                            </DropdownMenuItem>
                          )}
                          {exam.status === 'Published' && (
                            <>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => updateExam(exam.id!, { status: 'Draft' })}>
                                Unpublish Exam
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => updateExam(exam.id!, { status: 'Closed' })}>
                                Close Exam
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handlePreview(exam)}>
                            <Eye className="mr-2 h-4 w-4 text-slate-500" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleStudentPreview(exam)}>
                            <MonitorPlay className="mr-2 h-4 w-4 text-emerald-600" /> Student Portal Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(exam)}>
                            <Edit className="mr-2 h-4 w-4 text-blue-500" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleManageQuestions(exam)}>
                            <ListChecks className="mr-2 h-4 w-4 text-purple-500" /> Manage Questions
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleDuplicate(exam)}>
                            <Copy className="mr-2 h-4 w-4 text-indigo-500" /> {exam.publishedAt ? 'Create Correction Version' : 'Duplicate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(exam)}>
                            <Settings className="mr-2 h-4 w-4 text-slate-500" /> Configure Rules
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950" onClick={() => handleDeleteClick(exam.id!)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Exam
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
              title="No exams found" 
              description={searchTerm ? `No exams match your search "${searchTerm}".` : "There are currently no exams in the system."}
              actionLabel={searchTerm ? "Clear Search" : "Create Exam"}
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

      <ExamFormModal 
        open={editModalOpen} 
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setTimeout(() => setExamToEdit(null), 200);
        }}
        examToEdit={examToEdit}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Exam"
        description="Are you sure you want to delete this exam? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
      />

      <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{preview?.title} — Preview</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <p className="text-sm text-slate-500">Version {preview?.version || 1} · {preview?.duration} minutes · {preview?.totalMarks} marks</p>
            {preview?.questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <p className="font-semibold">{index + 1}. {question.text} <span className="text-xs text-slate-500">({question.marks} marks)</span></p>
                <div className="mt-3 space-y-1 text-sm">{question.options.map((option, optionIndex) => <p key={optionIndex} className={optionIndex === question.correctAnswer ? 'text-emerald-600 font-medium' : 'text-slate-600'}>{String.fromCharCode(65 + optionIndex)}. {option}</p>)}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {studentPreview && <StudentExamPreview key={studentPreview.id} exam={studentPreview} onClose={() => setStudentPreview(null)} />}
    </div>
  );
}
