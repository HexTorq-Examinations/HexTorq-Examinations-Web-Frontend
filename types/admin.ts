import { z } from 'zod';

export const BatchSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Batch name is required'),
  createdAt: z.string().optional(),
  schoolCount: z.coerce.number().optional(),
});
export type Batch = z.infer<typeof BatchSchema>;

export const SchoolSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'School name is required'),
  batchId: z.string().min(1),
  createdAt: z.string().optional(),
  departmentCount: z.coerce.number().optional(),
});
export type School = z.infer<typeof SchoolSchema>;

export const DepartmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Department name is required'),
  schoolId: z.string().min(1),
  createdAt: z.string().optional(),
  classCount: z.coerce.number().optional(),
});
export type Department = z.infer<typeof DepartmentSchema>;

export const ClassSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Class name is required'),
  departmentId: z.string().min(1),
  createdAt: z.string().optional(),
  studentCount: z.coerce.number().optional(),
});
export type SchoolClass = z.infer<typeof ClassSchema>;

export const StudentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  registerNumber: z.string().min(3, 'Register number is required'),
  classId: z.string().min(1, 'Class is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  phone: z.string().min(10, 'Valid phone number is required'),
  status: z.enum(['Active', 'Inactive', 'Suspended']).default('Active'),
  extraTimeMinutes: z.coerce.number().int().min(0).max(1440).default(0),
  accessibilityNotes: z.string().max(1000).optional().or(z.literal('')),
  createdAt: z.string().optional(),
});
export type Student = z.infer<typeof StudentSchema>;

export const QuestionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(5, 'Question text is required'),
  subject: z.string().min(2, 'Subject is required'),
  type: z.enum(['Multiple Choice', 'True/False', 'Descriptive']).default('Multiple Choice'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
  marks: z.coerce.number().min(1, 'Marks must be at least 1'),
  options: z.array(z.string()).default([]),
  correctAnswer: z.coerce.number().default(0),
  explanation: z.string().optional(),
  examId: z.string().optional(),
});
export type Question = z.infer<typeof QuestionSchema>;

// Exams are pure content now — no dates, no student linkage. Scheduling for
// real students happens separately via ExamMapping.
export const ExamSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Exam title is required'),
  subject: z.string().min(2, 'Subject is required'),
  description: z.string().optional(),
  duration: z.coerce.number().min(10, 'Minimum 10 minutes required'),
  totalMarks: z.coerce.number().min(10, 'Total marks required'),
  passingMarks: z.coerce.number().min(1, 'Passing marks required'),
  status: z.enum(['Draft', 'Published', 'Closed']).default('Draft'),
  version: z.coerce.number().optional(),
  versionGroupId: z.string().optional(),
  parentExamId: z.string().optional(),
  publishedAt: z.string().optional(),
  closedAt: z.string().optional(),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  negativeMarking: z.boolean().default(false),
  questionCount: z.coerce.number().optional(),
  mappingCount: z.coerce.number().optional(),
});
export type Exam = z.infer<typeof ExamSchema>;

// Maps an Exam to a Class with its own date/time — this is what actually
// schedules the exam for real students. One exam can have many mappings.
export const ExamMappingSchema = z.object({
  id: z.string().optional(),
  examId: z.string().min(1, 'Exam is required'),
  examTitle: z.string().optional(),
  examSubject: z.string().optional(),
  examDuration: z.coerce.number().optional(),
  examTotalMarks: z.coerce.number().optional(),
  examQuestionCount: z.coerce.number().optional(),
  classId: z.string().min(1, 'Class is required'),
  className: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  timezone: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  hall: z.string().default('Virtual'),
  status: z.enum(['Scheduled', 'In Progress', 'Completed', 'Cancelled']).default('Scheduled'),
  graceMinutes: z.coerce.number().min(0).default(0),
});
export type ExamMapping = z.infer<typeof ExamMappingSchema>;

export const ResultSchema = z.object({
  id: z.string().optional(),
  examId: z.string(),
  examName: z.string(),
  totalStudents: z.coerce.number(),
  publishedDate: z.string(),
  status: z.enum(['Published', 'Pending Evaluation', 'In Progress']),
});
export type Result = z.infer<typeof ResultSchema>;
