'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { Activity, AlertTriangle, CheckCircle2, Clock, MonitorPlay, RefreshCcw, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface LiveStudent {
  userId: string;
  attemptId: string | null;
  registerNumber: string;
  name: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'TERMINATED' | 'FINALIZING' | 'RESET';
  answeredCount: number;
  totalQuestions: number;
  violationsCount: number;
  violations?: { type?: string; description?: string; timestamp?: number | string }[];
  score: number | null;
  startedAt: string | null;
  endedAt: string | null;
  expiresAt: string | null;
}

interface LiveMapping {
  mappingId: string;
  classId: string;
  className: string;
  startAt: string;
  endAt: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  terminatedStudents: number;
  notStartedStudents: number;
  violationCount: number;
  students: LiveStudent[];
}

interface LiveExam {
  examId: string;
  title: string;
  subject: string;
  duration: number;
  totalMarks: number;
  questionCount: number;
  totalMappedStudents: number;
  activeStudents: number;
  completedStudents: number;
  terminatedStudents: number;
  violationCount: number;
  mappings: LiveMapping[];
}

interface LivePayload {
  serverNow: string;
  exams: LiveExam[];
}

const statusStyle: Record<LiveStudent['status'], string> = {
  NOT_STARTED: 'border-slate-200 bg-white text-slate-700',
  IN_PROGRESS: 'border-blue-300 bg-blue-50 text-blue-900 ring-1 ring-blue-200',
  COMPLETED: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  TERMINATED: 'border-red-300 bg-red-50 text-red-900',
  FINALIZING: 'border-amber-300 bg-amber-50 text-amber-900',
  RESET: 'border-slate-300 bg-slate-100 text-slate-700',
};

const statusLabel: Record<LiveStudent['status'], string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'Writing',
  COMPLETED: 'Finished',
  TERMINATED: 'Terminated',
  FINALIZING: 'Submitting',
  RESET: 'Reset',
};

const formatTime = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function LiveMonitorView({ role }: { role: 'admin' | 'super-admin' }) {
  const isSuperAdmin = role === 'super-admin';
  const [data, setData] = useState<LivePayload>({ serverNow: new Date().toISOString(), exams: [] });
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const { data: payload } = await api.get<LivePayload>('/results/live');
      setData(payload);
      setSelectedExamId((current) => current && payload.exams.some((exam) => exam.examId === current) ? current : payload.exams[0]?.examId || null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const { data: payload } = await api.get<LivePayload>('/results/live');
        if (cancelled) return;
        setData(payload);
        setSelectedExamId((current) => current && payload.exams.some((exam) => exam.examId === current) ? current : payload.exams[0]?.examId || null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    const interval = setInterval(run, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const selectedExam = data.exams.find((exam) => exam.examId === selectedExamId) || data.exams[0];
  const selectedMapping = selectedExam?.mappings.find((mapping) => mapping.mappingId === selectedMappingId) || selectedExam?.mappings[0];

  const totals = useMemo(() => data.exams.reduce((out, exam) => ({
    exams: out.exams + 1,
    mapped: out.mapped + exam.totalMappedStudents,
    active: out.active + exam.activeStudents,
    completed: out.completed + exam.completedStudents,
    violations: out.violations + exam.violationCount,
  }), { exams: 0, mapped: 0, active: 0, completed: 0, violations: 0 }), [data.exams]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Live Exam Monitor"
        description="Monitor currently running exams by exam, class mapping, and student seat."
        breadcrumbs={[{ label: isSuperAdmin ? 'Super Admin' : 'Admin', href: `/${role}/dashboard` }, { label: 'Live Monitor' }]}
        showSearch={false}
        actions={<Button variant="outline" onClick={load} disabled={isLoading}><RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />Refresh</Button>}
      />

      <div className="grid gap-4 md:grid-cols-5">
        {([
          { title: 'Running Exams', value: totals.exams, Icon: MonitorPlay, color: 'text-blue-600', bg: 'bg-blue-100' },
          { title: 'Mapped Students', value: totals.mapped, Icon: Users, color: 'text-slate-600', bg: 'bg-slate-100' },
          { title: 'Writing Now', value: totals.active, Icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { title: 'Finished', value: totals.completed, Icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-100' },
          { title: 'Violations', value: totals.violations, Icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
        ] satisfies Array<{ title: string; value: number; Icon: LucideIcon; color: string; bg: string }>).map(({ title, value, Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="flex items-center gap-3 p-5">
              <div className={`rounded-xl p-3 ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">{title}</p><p className="text-2xl font-bold">{value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.exams.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <MonitorPlay className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-xl font-bold">No exams are running right now</h2>
            <p className="mt-2 text-slate-500">When a mapped exam enters its scheduled window, it will appear here automatically.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Running exams</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.exams.map((exam) => (
                  <button
                    key={exam.examId}
                    type="button"
                    onClick={() => {
                      setSelectedExamId(exam.examId);
                      setSelectedMappingId(exam.mappings[0]?.mappingId || null);
                    }}
                    className={`w-full rounded-xl border p-4 text-left transition hover:border-blue-300 ${selectedExam?.examId === exam.examId ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}
                  >
                    <p className="font-bold text-slate-900">{exam.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{exam.subject} · {exam.mappings.length} class mapping{exam.mappings.length > 1 ? 's' : ''}</p>
                    <div className="mt-3 flex gap-2 text-xs">
                      <Badge className="bg-emerald-100 text-emerald-700">{exam.activeStudents} writing</Badge>
                      <Badge className="bg-purple-100 text-purple-700">{exam.completedStudents} finished</Badge>
                      {exam.violationCount > 0 && <Badge className="bg-red-100 text-red-700">{exam.violationCount} violations</Badge>}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {selectedExam && (
              <Card>
                <CardHeader><CardTitle className="text-base">Active mappings</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {selectedExam.mappings.map((mapping) => (
                    <button
                      key={mapping.mappingId}
                      type="button"
                      onClick={() => setSelectedMappingId(mapping.mappingId)}
                      className={`w-full rounded-xl border p-4 text-left transition hover:border-emerald-300 ${selectedMapping?.mappingId === mapping.mappingId ? 'border-emerald-500 bg-emerald-50' : 'bg-white'}`}
                    >
                      <p className="font-bold">{mapping.className}</p>
                      <p className="mt-1 text-xs text-slate-500">{mapping.startTime} - {mapping.endTime} · {mapping.totalStudents} seats</p>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded bg-blue-50 p-2"><b>{mapping.activeStudents}</b><span className="block text-slate-500">writing</span></div>
                        <div className="rounded bg-emerald-50 p-2"><b>{mapping.completedStudents}</b><span className="block text-slate-500">done</span></div>
                        <div className="rounded bg-red-50 p-2"><b>{mapping.violationCount}</b><span className="block text-slate-500">viol.</span></div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{selectedMapping?.className || 'Classroom'}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">{selectedExam?.title} · Last updated {formatTime(data.serverNow)}</p>
                </div>
                {selectedMapping && (
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-100 text-blue-700">{selectedMapping.activeStudents} writing</Badge>
                    <Badge className="bg-emerald-100 text-emerald-700">{selectedMapping.completedStudents} finished</Badge>
                    <Badge className="bg-slate-100 text-slate-700">{selectedMapping.notStartedStudents} not started</Badge>
                    {selectedMapping.terminatedStudents > 0 && <Badge className="bg-red-100 text-red-700">{selectedMapping.terminatedStudents} terminated</Badge>}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {!selectedMapping ? (
                <p className="py-10 text-center text-slate-500">Select a running exam mapping to view the live classroom.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {selectedMapping.students.map((student, index) => {
                    const progress = student.totalQuestions > 0 ? Math.round((student.answeredCount / student.totalQuestions) * 100) : 0;
                    return (
                      <div key={student.userId} className={`rounded-2xl border p-4 shadow-sm ${statusStyle[student.status] || statusStyle.NOT_STARTED}`}>
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                            <MonitorPlay className="h-5 w-5" />
                          </div>
                          <Badge variant="outline" className="bg-white/70">Seat {index + 1}</Badge>
                        </div>
                        <div className="min-h-[72px]">
                          <p className="font-mono text-xs font-semibold text-slate-500">{student.registerNumber}</p>
                          <p className="mt-1 line-clamp-2 font-bold text-slate-950">{student.name}</p>
                          <p className="mt-1 text-xs">{statusLabel[student.status] || student.status}</p>
                        </div>
                        <div className="mt-4">
                          <div className="mb-1 flex justify-between text-xs">
                            <span>Answered</span>
                            <b>{student.answeredCount}/{student.totalQuestions}</b>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-white/70 p-2"><Clock className="mb-1 h-3.5 w-3.5" />{student.status === 'IN_PROGRESS' ? `Ends ${formatTime(student.expiresAt)}` : formatTime(student.endedAt || student.startedAt)}</div>
                          <div className={`rounded-lg p-2 ${student.violationsCount > 0 ? 'bg-red-100 text-red-800' : 'bg-white/70'}`}><AlertTriangle className="mb-1 h-3.5 w-3.5" />{student.violationsCount} violation{student.violationsCount === 1 ? '' : 's'}</div>
                        </div>
                        {!!student.violationsCount && (
                          <div className="mt-3 rounded-lg border border-red-200 bg-white/80 p-2 text-xs text-red-800">
                            <p className="font-semibold">Latest violation</p>
                            <p className="mt-1 line-clamp-2">{student.violations?.at(-1)?.description || student.violations?.at(-1)?.type || 'Violation recorded'}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
