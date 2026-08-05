'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Plus, ListPlus, UploadCloud } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { Question } from '@/types/admin';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/SkeletonTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { QuestionFormModal } from './modals/QuestionFormModal';
import { BulkQuestionEntryModal } from './modals/BulkQuestionEntryModal';
import { FileImportQuestionsModal } from './modals/FileImportQuestionsModal';
import { ExportMenu } from '@/components/common/ExportMenu';

const QUESTION_EXPORT_COLUMNS = ['Question', 'Type', 'Subject', 'Difficulty', 'Marks', 'Options', 'Correct Answer', 'Explanation'];

interface ExamQuestionsViewProps {
  examId: string;
  role: 'admin' | 'super-admin';
}

export function ExamQuestionsView({ examId, role }: ExamQuestionsViewProps) {
  const { exams, questions, isLoading, fetchExams, fetchQuestions, deleteQuestion } = useAdminStore();

  const [formOpen, setFormOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  const exam = exams.find((e) => e.id === examId);

  useEffect(() => {
    if (exams.length === 0) fetchExams();
    if (examId) fetchQuestions(examId);
  }, [examId, exams.length, fetchExams, fetchQuestions]);

  const handleAdd = () => {
    setQuestionToEdit(null);
    setFormOpen(true);
  };

  const handleEdit = (q: Question) => {
    setQuestionToEdit(q);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setQuestionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (questionToDelete) {
      await deleteQuestion(examId, questionToDelete);
      setDeleteConfirmOpen(false);
      setQuestionToDelete(null);
    }
  };

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={exam ? `Questions — ${exam.title}` : 'Exam Questions'}
        description="Author questions directly against this exam. Questions here are not shared with any other exam."
        breadcrumbs={[
          { label: role === 'super-admin' ? 'Super Admin' : 'Admin', href: `/${role}/dashboard` },
          { label: 'Exams', href: `/${role}/exams` },
          { label: 'Questions' },
        ]}
        showSearch={false}
        actions={
          <div className="flex gap-3">
            <ExportMenu
              exportKey="questions"
              endpoint={`/exams/${examId}/questions/export`}
              columns={QUESTION_EXPORT_COLUMNS}
              filename={`questions-${exam?.title || examId}`}
              disabled={questions.length === 0}
            />
            <Button onClick={() => setImportOpen(true)} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950">
              <UploadCloud className="w-4 h-4 mr-2" /> Import File
            </Button>
            <Button onClick={() => setBulkOpen(true)} variant="outline">
              <ListPlus className="w-4 h-4 mr-2" /> Bulk Entry
            </Button>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
          </div>
        }
      />

      {exam && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between text-sm">
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{questions.length}</span>
              <span className="text-slate-500"> questions added</span>
            </div>
            <div>
              <span className={`font-semibold ${totalMarks === exam.totalMarks ? 'text-emerald-600' : 'text-amber-600'}`}>{totalMarks}</span>
              <span className="text-slate-500"> / {exam.totalMarks} marks</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4"><SkeletonTable rows={5} cols={5} /></div>
        ) : questions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {questions.map((q) => (
              <div key={q.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{q.text}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[10px]">{q.type === 'Multiple Choice' ? 'MCQ' : q.type}</Badge>
                    <span className={`text-xs font-semibold ${q.difficulty === 'Easy' ? 'text-emerald-600' : q.difficulty === 'Medium' ? 'text-amber-600' : 'text-red-600'}`}>{q.difficulty}</span>
                    <span className="text-xs text-slate-500">{q.marks} marks</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 focus:outline-none shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleEdit(q)}>
                      <Edit className="mr-2 h-4 w-4 text-blue-500" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950" onClick={() => handleDeleteClick(q.id!)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              title="No questions yet"
              description="Add questions to this exam one at a time, in bulk, or by importing a spreadsheet."
              actionLabel="Add Question"
              onAction={handleAdd}
            />
          </div>
        )}
      </Card>

      <QuestionFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setTimeout(() => setQuestionToEdit(null), 200);
        }}
        questionToEdit={questionToEdit}
        examId={examId}
      />

      <BulkQuestionEntryModal open={bulkOpen} onOpenChange={setBulkOpen} examId={examId} />

      <FileImportQuestionsModal
        open={importOpen}
        onOpenChange={setImportOpen}
        examId={examId}
        defaultSubject={exam?.subject}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
