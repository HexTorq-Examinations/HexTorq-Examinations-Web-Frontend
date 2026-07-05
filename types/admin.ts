import { z } from 'zod';

export const StudentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  registerNumber: z.string().min(3, 'Register number is required'),
  department: z.string().min(2, 'Department is required'),
  semester: z.string().min(1, 'Semester is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  phone: z.string().min(10, 'Valid phone number is required'),
  status: z.enum(['Active', 'Inactive', 'Suspended']).default('Active'),
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
});
export type Question = z.infer<typeof QuestionSchema>;

export const ExamSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Exam title is required'),
  subject: z.string().min(2, 'Subject is required'),
  description: z.string().optional(),
  duration: z.coerce.number().min(10, 'Minimum 10 minutes required'),
  totalMarks: z.coerce.number().min(10, 'Total marks required'),
  passingMarks: z.coerce.number().min(1, 'Passing marks required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['Draft', 'Scheduled', 'Active', 'Completed']).default('Draft'),
  assigned: z.coerce.number().default(0),
  questions: z.array(z.string()).default([]),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  negativeMarking: z.boolean().default(false),
});
export type Exam = z.infer<typeof ExamSchema>;

export const ScheduleSchema = z.object({
  id: z.string().optional(),
  examId: z.string().min(1, 'Exam is required'),
  examName: z.string().optional(),
  batch: z.string().min(1, 'Batch is required'),
  department: z.string().min(1, 'Department is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  hall: z.string().default('Virtual'),
  status: z.enum(['Scheduled', 'In Progress', 'Completed', 'Cancelled']).default('Scheduled'),
});
export type Schedule = z.infer<typeof ScheduleSchema>;

export const ResultSchema = z.object({
  id: z.string().optional(),
  examId: z.string(),
  examName: z.string(),
  totalStudents: z.coerce.number(),
  publishedDate: z.string(),
  status: z.enum(['Published', 'Pending Evaluation', 'In Progress']),
});
export type Result = z.infer<typeof ResultSchema>;
