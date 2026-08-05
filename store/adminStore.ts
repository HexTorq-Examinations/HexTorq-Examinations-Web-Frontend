import { create } from 'zustand';
import { Student, Question, Exam, ExamMapping, Result } from '@/types/admin';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface AdminState {
  students: Student[];
  questions: Question[];
  exams: Exam[];
  examMappings: ExamMapping[];
  results: Result[];
  isLoading: boolean;

  // Students — scoped to a Class
  fetchStudents: (classId: string) => Promise<void>;
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  importStudentsFromFile: (file: File, classId: string) => Promise<number>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  sendStudentPasswordReset: (id: string) => Promise<void>;

  // Exams
  fetchExams: () => Promise<void>;
  addExam: (exam: Omit<Exam, 'id'>) => Promise<void>;
  updateExam: (id: string, exam: Partial<Exam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  duplicateExam: (id: string) => Promise<void>;

  // Questions — scoped to an Exam (no shared question bank)
  fetchQuestions: (examId: string) => Promise<void>;
  addQuestion: (examId: string, data: Question) => Promise<void>;
  addQuestions: (examId: string, data: Question[]) => Promise<void>;
  importQuestionsFromFile: (examId: string, file: File, meta: { subject: string; marks?: number; difficulty?: string; type?: string }) => Promise<number>;
  updateQuestion: (examId: string, id: string, data: Partial<Question>) => Promise<void>;
  deleteQuestion: (examId: string, id: string) => Promise<void>;

  // Exam Mappings — assigns an Exam to a Class with a date/time/hall
  fetchExamMappings: (filter?: { examId?: string; classId?: string }) => Promise<void>;
  addExamMapping: (mapping: Omit<ExamMapping, 'id'> & { confirmOverlap?: boolean }) => Promise<void>;
  updateExamMapping: (id: string, mapping: Partial<ExamMapping> & { confirmOverlap?: boolean }) => Promise<void>;
  deleteExamMapping: (id: string) => Promise<void>;

  // Results
  fetchResults: () => Promise<void>;
  publishResult: (id: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  students: [],
  questions: [],
  exams: [],
  examMappings: [],
  results: [],
  isLoading: false,

  // Students
  fetchStudents: async (classId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/students', { params: { classId } });
      set({ students: data });
    } finally {
      set({ isLoading: false });
    }
  },
  addStudent: async (studentData) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/students', studentData);
      set((state) => ({ students: [data, ...state.students] }));
      toast.success('Student Added Successfully');
    } finally {
      set({ isLoading: false });
    }
  },
  importStudentsFromFile: async (file, classId) => {
    set({ isLoading: true });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('classId', classId);
    try {
      const { data } = await api.post('/students/import', formData);
      set((state) => ({ students: [...data.students, ...state.students] }));
      toast.success(`${data.students.length} Students Imported Successfully`);

      if (data.errors && data.errors.length > 0) {
        const err = new Error('Some students could not be imported due to duplicate records.');
        (err as any).rowErrors = data.errors;
        throw err;
      }
      return data.students.length;
    } finally {
      set({ isLoading: false });
    }
  },
  updateStudent: async (id, data) => {
    set({ isLoading: true });
    try {
      const { data: updated } = await api.patch(`/students/${id}`, data);
      set((state) => ({
        students: state.students.map((s) => (s.id === id ? updated : s)),
      }));
      toast.success('Student Updated Successfully');
    } finally {
      set({ isLoading: false });
    }
  },
  deleteStudent: async (id) => {
    set({ isLoading: true });
    try {
      await api.delete(`/students/${id}`);
      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
      }));
      toast.success('Student Deleted Successfully');
    } finally {
      set({ isLoading: false });
    }
  },
  sendStudentPasswordReset: async (id) => {
    const { data } = await api.post(`/students/${id}/password-reset`);
    toast.success(data.message || 'Password reset email sent');
  },

  // Exams
  fetchExams: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/exams');
      set({ exams: data });
    } finally {
      set({ isLoading: false });
    }
  },
  addExam: async (examData) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/exams', examData);
      set((state) => ({ exams: [data, ...state.exams] }));
      toast.success('Exam Created Successfully');
    } finally {
      set({ isLoading: false });
    }
  },
  updateExam: async (id, data) => {
    set({ isLoading: true });
    try {
      const { data: updated } = await api.patch(`/exams/${id}`, data);
      set((state) => ({
        exams: state.exams.map((e) => (e.id === id ? updated : e)),
      }));
      toast.success('Exam Updated Successfully');
    } finally {
      set({ isLoading: false });
    }
  },
  deleteExam: async (id) => {
    set({ isLoading: true });
    try {
      await api.delete(`/exams/${id}`);
      set((state) => ({
        exams: state.exams.filter((e) => e.id !== id),
      }));
      toast.success('Exam Deleted Successfully');
    } finally {
      set({ isLoading: false });
    }
  },
  duplicateExam: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post(`/exams/${id}/duplicate`);
      set((state) => ({ exams: [data, ...state.exams] }));
      toast.success('New draft exam version created');
    } finally {
      set({ isLoading: false });
    }
  },

  // Questions
  fetchQuestions: async (examId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/exams/${examId}/questions`);
      set({ questions: data });
    } finally {
      set({ isLoading: false });
    }
  },
  addQuestion: async (examId, questionData) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post(`/exams/${examId}/questions`, questionData);
      set((state) => ({ questions: [data, ...state.questions] }));
      toast.success('Question Added Successfully');
    } finally {
      set({ isLoading: false });
    }
  },
  addQuestions: async (examId, questionsData) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post(`/exams/${examId}/questions/bulk`, { questions: questionsData });
      set((state) => ({ questions: [...data, ...state.questions] }));
      toast.success(`${data.length} Questions Added Successfully`);
    } finally {
      set({ isLoading: false });
    }
  },
  importQuestionsFromFile: async (examId, file, meta) => {
    set({ isLoading: true });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', meta.subject);
    if (meta.marks !== undefined) formData.append('marks', String(meta.marks));
    if (meta.difficulty) formData.append('difficulty', meta.difficulty);
    if (meta.type) formData.append('type', meta.type);

    try {
      const { data } = await api.post(`/exams/${examId}/questions/import`, formData);
      set((state) => ({ questions: [...data, ...state.questions] }));
      toast.success(`${data.length} Questions Imported Successfully`);
      return data.length;
    } finally {
      set({ isLoading: false });
    }
  },
  updateQuestion: async (examId, id, data) => {
    set({ isLoading: true });
    try {
      const { data: updated } = await api.patch(`/exams/${examId}/questions/${id}`, data);
      set((state) => ({
        questions: state.questions.map((q) => (q.id === id ? updated : q)),
      }));
      toast.success('Question Updated Successfully');
    } finally {
      set({ isLoading: false });
    }
  },
  deleteQuestion: async (examId, id) => {
    set({ isLoading: true });
    try {
      await api.delete(`/exams/${examId}/questions/${id}`);
      set((state) => ({
        questions: state.questions.filter((q) => q.id !== id),
      }));
      toast.success('Question Deleted Successfully');
    } finally {
      set({ isLoading: false });
    }
  },

  // Exam Mappings
  fetchExamMappings: async (filter) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/exam-mappings', { params: filter });
      set({ examMappings: data });
    } finally {
      set({ isLoading: false });
    }
  },
  addExamMapping: async (mappingData) => {
    set({ isLoading: true });
    try {
      await api.post('/exam-mappings', mappingData);
      await Promise.all([get().fetchExams(), get().fetchExamMappings()]);
      toast.success('Exam Mapped Successfully');
    } finally {
      set({ isLoading: false });
    }
  },
  updateExamMapping: async (id, data) => {
    set({ isLoading: true });
    try {
      const { data: updated } = await api.patch(`/exam-mappings/${id}`, data);
      await Promise.all([get().fetchExams(), get().fetchExamMappings()]);
      const extended = updated?.attemptsExtended || 0;
      const reopened = updated?.attemptsReopened || 0;
      if (reopened > 0) {
        toast.success(`Exam Mapping Updated — ${reopened} student(s) who had already submitted can now resume, ${extended} still-active attempt(s) extended`);
      } else if (extended > 0) {
        toast.success(`Exam Mapping Updated — ${extended} active attempt(s) extended`);
      } else {
        toast.success('Exam Mapping Updated Successfully');
      }
    } finally {
      set({ isLoading: false });
    }
  },
  deleteExamMapping: async (id) => {
    set({ isLoading: true });
    try {
      await api.delete(`/exam-mappings/${id}`);
      await Promise.all([get().fetchExams(), get().fetchExamMappings()]);
      toast.success('Exam Mapping Removed Successfully');
    } finally {
      set({ isLoading: false });
    }
  },

  // Results
  fetchResults: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/results');
      set({ results: data });
    } finally {
      set({ isLoading: false });
    }
  },
  publishResult: async (id) => {
    set({ isLoading: true });
    try {
      const { data: updated } = await api.post(`/results/${id}/publish`);
      set((state) => ({
        results: state.results.map((r) => (r.id === id ? updated : r)),
      }));
      toast.success('Result Published Successfully');
    } finally {
      set({ isLoading: false });
    }
  },
}));
