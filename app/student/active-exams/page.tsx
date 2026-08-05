'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, Clock, FileText, CheckCircle2, ChevronRight, AlertCircle, Activity, MonitorPlay } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { useExamStore } from '@/store/examStore';
import { api } from '@/lib/api';
import { getTemporalStatus, hasCompletedMapping } from '@/lib/examMappingStatus';
import { useServerClock } from '@/hooks/useServerClock';
import { Badge } from '@/components/ui/badge';

interface AttemptStatus {
  hasActiveAttempt: boolean;
  answeredCount: number;
  totalQuestions: number;
}

export default function StudentActiveExams() {
  const router = useRouter();
  const { status, examId, examHistory, myMappings, fetchExamHistory, fetchMyMappings } = useExamStore();
  const [attemptStatus, setAttemptStatus] = useState<Record<string, AttemptStatus>>({});

  useEffect(() => {
    fetchMyMappings();
    fetchExamHistory();
  }, [fetchMyMappings, fetchExamHistory]);

  // Server-synced clock — a student's device clock being wrong/skewed must
  // never hide an exam that's actually active (or show one that isn't).
  const serverNow = useServerClock();
  const now = serverNow ?? new Date();
  const activeMappings = myMappings.filter(
    (m) => getTemporalStatus(m, now) === 'active' && !hasCompletedMapping(m, examHistory)
  );

  // Read-only progress snapshot per active exam — does not create an attempt.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      activeMappings.map((m) =>
        api.get(`/exams/${m.examId}/my-attempt`).then(({ data }) => [m.examId, data] as const)
      )
    ).then((entries) => {
      if (cancelled) return;
      setAttemptStatus(Object.fromEntries(entries));
    });
    return () => { cancelled = true; };
  }, [myMappings.length, examHistory.length]);

  const allActiveExams = activeMappings.map((m) => {
    const progress = attemptStatus[m.examId];
    const totalQuestions = progress?.totalQuestions ?? m.examQuestionCount ?? 0;
    const answered = progress?.answeredCount ?? 0;
    return {
      id: m.examId,
      title: m.examTitle || 'Exam',
      subject: m.examSubject || '',
      startedTime: m.startTime,
      remainingTime: `Until ${m.endTime}`,
      questionsAnswered: answered,
      questionsRemaining: Math.max(0, totalQuestions - answered),
      totalQuestions,
      progress: totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0,
      isTestExam: !!m.examIsTest,
    };
  });

  // Filter out the exam if it's currently marked as completed or terminated in the store
  const activeExams = allActiveExams.filter(
    (exam) => !(examId === exam.id && (status === 'COMPLETED' || status === 'TERMINATED'))
  );

  const hasActive = activeExams.length > 0;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Active Exams"
        description="Continue your ongoing examination."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Active Exams' }]}
        showSearch={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Main Content (70%) */}
        <div className="lg:col-span-8 space-y-6">
          {!hasActive ? (
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm border-dashed text-center">
              <CardContent className="py-24">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 blur-2xl rounded-full"></div>
                    <div className="relative w-24 h-24 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center">
                      <MonitorPlay className="h-10 w-10 text-slate-300" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-4">Relax!</h3>
                  <p className="text-slate-500 max-w-sm">There are no ongoing exams at the moment. You'll see your running examinations here.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Top Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardContent className="p-4 flex flex-col justify-center h-full">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Running Exam</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate" title={activeExams[0].title}>{activeExams[0].title}</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardContent className="p-4 flex flex-col justify-center h-full">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> Time Left
                    </p>
                    <p className="font-bold text-amber-700 dark:text-amber-500 text-lg">{activeExams[0].remainingTime}</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardContent className="p-4 flex flex-col justify-center h-full">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Q</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">{activeExams[0].questionsAnswered + 1} <span className="text-slate-400 text-sm font-normal">/ {activeExams[0].totalQuestions}</span></p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardContent className="p-4 flex flex-col justify-center h-full">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Progress</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-500 text-lg">{activeExams[0].progress}%</p>
                  </CardContent>
                </Card>
              </div>

              {/* Active Exam Card */}
              {activeExams.map((exam) => (
                <Card key={exam.id} className="border-blue-200 dark:border-blue-900 shadow-md overflow-hidden relative">
                  {/* Progress bar at the very top edge */}
                  <Progress value={exam.progress} className="h-1.5 w-full rounded-none bg-blue-100 dark:bg-blue-950" />

                  <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
                      <div className="space-y-4 flex-1">
                        <div>
                          {exam.subject && <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">{exam.subject}</p>}
                          <h3 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-slate-100">{exam.title}{exam.isTestExam && <Badge className="bg-amber-100 text-amber-700">TEST EXAM</Badge>}</h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Started At</p>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{exam.startedTime}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Remaining Time</p>
                            <p className="font-bold text-amber-600">{exam.remainingTime}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Answered</p>
                            <p className="font-semibold text-emerald-600">{exam.questionsAnswered}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Remaining</p>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{exam.questionsRemaining}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 min-w-[200px]">
                        <Button
                          className="w-full h-12 text-md font-bold bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 shadow-lg"
                          onClick={() => router.push(`/exam?id=${exam.id}`)}
                        >
                          <PlayCircle className="mr-2 h-5 w-5" /> {attemptStatus[exam.id]?.hasActiveAttempt ? 'Resume Exam' : 'Start Exam'}
                        </Button>
                        <Button variant="outline" className="w-full h-12 text-slate-700 dark:text-slate-300">
                          <FileText className="mr-2 h-4 w-4" /> View Instructions
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar (30%) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 border-b border-blue-100 dark:border-blue-900/50 flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800 dark:text-blue-500">Live Status</h3>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Proctoring Active</p>
                  <p className="text-xs text-slate-500">Tab switches and fullscreen exits are being monitored.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Network Stable</p>
                  <p className="text-xs text-slate-500">Connected to exam server.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Button variant="outline" className="w-full justify-start text-slate-600 dark:text-slate-400">
                <AlertCircle className="mr-2 h-4 w-4 text-amber-500" /> Report Technical Issue
              </Button>
              <Button variant="outline" className="w-full justify-start text-slate-600 dark:text-slate-400">
                <FileText className="mr-2 h-4 w-4 text-blue-500" /> Exam Guidelines
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
