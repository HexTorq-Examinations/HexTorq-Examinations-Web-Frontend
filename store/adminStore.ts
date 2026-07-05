import { create } from 'zustand';
import { Student, Question, Exam, Schedule, Result } from '@/types/admin';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface AdminState {
  students: Student[];
  questions: Question[];
  exams: Exam[];
  schedules: Schedule[];
  results: Result[];
  isLoading: boolean;

  // Students
  fetchStudents: () => Promise<void>;
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  importStudentsFromFile: (file: File) => Promise<number>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  // Exams
  fetchExams: () => Promise<void>;
  addExam: (exam: Omit<Exam, 'id'>) => Promise<void>;
  updateExam: (id: string, exam: Partial<Exam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;

  // Questions
  fetchQuestions: () => Promise<void>;
  addQuestion: (data: Question) => Promise<void>;
  addQuestions: (data: Question[]) => Promise<void>;
  importQuestionsFromFile: (file: File, meta: { subject: string; marks?: number; difficulty?: string; type?: string }) => Promise<number>;
  updateQuestion: (id: string, data: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;

  // Schedules
  fetchSchedules: () => Promise<void>;
  addSchedule: (schedule: Omit<Schedule, 'id'>) => Promise<void>;
  updateSchedule: (id: string, schedule: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  // Results
  fetchResults: () => Promise<void>;
  publishResult: (id: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  students: [],
  questions: [],
  exams: [],
  schedules: [],
  results: [],
  isLoading: false,

  // Students
  fetchStudents: async () => {
    set({ isLoading: true });
    const { data } = await api.get('/students');
    set({ students: data, isLoading: false });
  },
  addStudent: async (studentData) => {
    set({ isLoading: true });
    const { data } = await api.post('/students', studentData);
    set((state) => ({ students: [data, ...state.students], isLoading: false }));
    toast.success('Student Added Successfully');
  },
  importStudentsFromFile: async (file) => {
    set({ isLoading: true });
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/students/import', formData);
      set((state) => ({ students: [...data, ...state.students], isLoading: false }));
      toast.success(`${data.length} Students Imported Successfully`);
      return data.length;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },
  updateStudent: async (id, data) => {
    set({ isLoading: true });
    const { data: updated } = await api.patch(`/students/${id}`, data);
    set((state) => ({
      students: state.students.map((s) => (s.id === id ? updated : s)),
      isLoading: false,
    }));
    toast.success('Student Updated Successfully');
  },
  deleteStudent: async (id) => {
    set({ isLoading: true });
    await api.delete(`/students/${id}`);
    set((state) => ({
      students: state.students.filter((s) => s.id !== id),
      isLoading: false,
    }));
    toast.success('Student Deleted Successfully');
  },

  // Exams
  fetchExams: async () => {
    set({ isLoading: true });
    const { data } = await api.get('/exams');
    set({ exams: data, isLoading: false });
  },
  addExam: async (examData) => {
    set({ isLoading: true });
    const { data } = await api.post('/exams', examData);
    set((state) => ({ exams: [data, ...state.exams], isLoading: false }));
    toast.success('Exam Created Successfully');
  },
  updateExam: async (id, data) => {
    set({ isLoading: true });
    const { data: updated } = await api.patch(`/exams/${id}`, data);
    set((state) => ({
      exams: state.exams.map((e) => (e.id === id ? updated : e)),
      isLoading: false,
    }));
    toast.success('Exam Updated Successfully');
  },
  deleteExam: async (id) => {
    set({ isLoading: true });
    await api.delete(`/exams/${id}`);
    set((state) => ({
      exams: state.exams.filter((e) => e.id !== id),
      isLoading: false,
    }));
    toast.success('Exam Deleted Successfully');
  },

  // Questions
  fetchQuestions: async () => {
    set({ isLoading: true });
    const { data } = await api.get('/questions');
    set({ questions: data, isLoading: false });
  },
  addQuestion: async (questionData) => {
    set({ isLoading: true });
    const { data } = await api.post('/questions', questionData);
    set((state) => ({ questions: [data, ...state.questions], isLoading: false }));
    toast.success('Question Added Successfully');
  },
  addQuestions: async (questionsData) => {
    set({ isLoading: true });
    const { data } = await api.post('/questions/bulk', { questions: questionsData });
    set((state) => ({ questions: [...data, ...state.questions], isLoading: false }));
    toast.success(`${data.length} Questions Added Successfully`);
  },
  importQuestionsFromFile: async (file, meta) => {
    set({ isLoading: true });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', meta.subject);
    if (meta.marks !== undefined) formData.append('marks', String(meta.marks));
    if (meta.difficulty) formData.append('difficulty', meta.difficulty);
    if (meta.type) formData.append('type', meta.type);

    try {
      const { data } = await api.post('/questions/import', formData);
      set((state) => ({ questions: [...data, ...state.questions], isLoading: false }));
      toast.success(`${data.length} Questions Imported Successfully`);
      return data.length;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },
  updateQuestion: async (id, data) => {
    set({ isLoading: true });
    const { data: updated } = await api.patch(`/questions/${id}`, data);
    set((state) => ({
      questions: state.questions.map((q) => (q.id === id ? updated : q)),
      isLoading: false,
    }));
    toast.success('Question Updated Successfully');
  },
  deleteQuestion: async (id) => {
    set({ isLoading: true });
    await api.delete(`/questions/${id}`);
    set((state) => ({
      questions: state.questions.filter((q) => q.id !== id),
      isLoading: false,
    }));
    toast.success('Question Deleted Successfully');
  },

  // Schedules
  fetchSchedules: async () => {
    set({ isLoading: true });
    const { data } = await api.get('/schedules');
    set({ schedules: data, isLoading: false });
  },
  addSchedule: async (scheduleData) => {
    set({ isLoading: true });
    const { data } = await api.post('/schedules', scheduleData);
    set((state) => ({ schedules: [data, ...state.schedules], isLoading: false }));
    toast.success('Schedule Created Successfully');
  },
  updateSchedule: async (id, data) => {
    set({ isLoading: true });
    const { data: updated } = await api.patch(`/schedules/${id}`, data);
    set((state) => ({
      schedules: state.schedules.map((s) => (s.id === id ? updated : s)),
      isLoading: false,
    }));
    toast.success('Schedule Updated Successfully');
  },
  deleteSchedule: async (id) => {
    set({ isLoading: true });
    await api.delete(`/schedules/${id}`);
    set((state) => ({
      schedules: state.schedules.filter((s) => s.id !== id),
      isLoading: false,
    }));
    toast.success('Schedule Cancelled Successfully');
  },

  // Results
  fetchResults: async () => {
    set({ isLoading: true });
    const { data } = await api.get('/results');
    set({ results: data, isLoading: false });
  },
  publishResult: async (id) => {
    set({ isLoading: true });
    const { data: updated } = await api.post(`/results/${id}/publish`);
    set((state) => ({
      results: state.results.map((r) => (r.id === id ? updated : r)),
      isLoading: false,
    }));
    toast.success('Result Published Successfully');
  },
}));
