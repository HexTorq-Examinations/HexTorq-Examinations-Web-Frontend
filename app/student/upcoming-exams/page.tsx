'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Bell, FileText, ChevronRight, MonitorPlay, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useExamStore } from '@/store/examStore';
import { api } from '@/lib/api';
import { getTemporalStatus, hasCompletedMapping } from '@/lib/examMappingStatus';
import { useServerClock } from '@/hooks/useServerClock';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isSameMonth, addMonths, subMonths, format, differenceInCalendarDays,
} from 'date-fns';

const formatCountdown = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

interface AttemptStatus {
  hasActiveAttempt: boolean;
  answeredCount: number;
  totalQuestions: number;
}

interface StudentExamCard {
  id: string;
  mappingId: string;
  title: string;
  subject: string;
  code: string;
  dateObj: Date;
  startDateTime: Date;
  date: string;
  time: string;
  endTime: string;
  duration: string;
  marks: number;
  questions: number;
  answeredCount: number;
  remainingQuestions: number;
  progress: number;
  assignedBy: string;
  status: 'active' | 'upcoming';
  maxViolations: number;
  calculatorEnabled: boolean;
  isTestExam: boolean;
  hasActiveAttempt: boolean;
}

export default function StudentUpcomingExams() {
  const router = useRouter();
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<StudentExamCard | null>(null);
  const { myMappings, examHistory, fetchMyMappings, fetchExamHistory } = useExamStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [attemptStatus, setAttemptStatus] = useState<Record<string, AttemptStatus>>({});
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => new Date());
  // Server-synced clock — a student's device clock being wrong/skewed must
  // never hide an exam that's actually active (or show one that isn't).
  const serverNow = useServerClock();
  const now = serverNow ?? new Date();

  useEffect(() => {
    fetchMyMappings();
    fetchExamHistory();
    api.get('/messages/notifications').then(({ data }) => setNotifications(data)).catch(() => {});
  }, [fetchMyMappings, fetchExamHistory]);

  const activeMappings = myMappings.filter(m => getTemporalStatus(m, now) === 'active' && !hasCompletedMapping(m, examHistory));
  const upcomingMappings = myMappings.filter(m => getTemporalStatus(m, now) === 'upcoming' && !hasCompletedMapping(m, examHistory));

  const toExamCard = (m: typeof myMappings[number], temporalStatus: 'active' | 'upcoming'): StudentExamCard => {
    const startDateTime = new Date(m.startAt || `${m.date}T${m.startTime}:00`);
    const progress = attemptStatus[m.examId];
    const totalQuestions = progress?.totalQuestions ?? m.examQuestionCount ?? 0;
    const answeredCount = progress?.answeredCount ?? 0;
    return {
      id: m.examId,
      mappingId: m.id || m.examId,
      title: m.examTitle || 'Exam',
      subject: m.examSubject || '',
      code: `EXM-${(m.examId || '').toUpperCase()}`,
      dateObj: new Date(m.date),
      startDateTime,
      date: new Date(m.date).toLocaleDateString(),
      time: m.startTime,
      endTime: m.endTime || '',
      duration: m.examDuration ? `${m.examDuration} mins` : `${m.startTime} - ${m.endTime}`,
      marks: m.examTotalMarks || 0,
      questions: totalQuestions,
      answeredCount,
      remainingQuestions: Math.max(0, totalQuestions - answeredCount),
      progress: totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0,
      assignedBy: 'System Admin',
      status: temporalStatus,
      maxViolations: m.examMaxViolations || 5,
      calculatorEnabled: !!m.examCalculatorEnabled,
      isTestExam: !!m.examIsTest,
      hasActiveAttempt: !!progress?.hasActiveAttempt,
    };
  };

  const activeExams = activeMappings.map((m) => toExamCard(m, 'active')).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  const upcomingExams = upcomingMappings.map((m) => toExamCard(m, 'upcoming')).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  const scheduledExams = [...activeExams, ...upcomingExams];

  const activeExamIds = activeMappings.map((m) => m.examId).sort().join('|');
  useEffect(() => {
    let cancelled = false;
    const ids = activeExamIds ? activeExamIds.split('|') : [];
    if (ids.length === 0) {
      return () => { cancelled = true; };
    }
    Promise.all(
      ids.map((examId) =>
        api.get(`/exams/${examId}/my-attempt`).then(({ data }) => [examId, data] as const)
      )
    ).then((entries) => {
      if (!cancelled) setAttemptStatus(Object.fromEntries(entries));
    }).catch(() => {
      if (!cancelled) setAttemptStatus({});
    });
    return () => { cancelled = true; };
  }, [activeExamIds]);

  const nextExam = upcomingExams[0];
  const unreadCount = notifications.filter((n) => n.unread).length;
  const daysRemaining = nextExam ? Math.max(0, differenceInCalendarDays(nextExam.dateObj, now)) : 0;

  const metrics = [
    { title: 'Active Now', value: activeExams.length.toString(), icon: PlayCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Total Upcoming Exams', value: upcomingExams.length.toString(), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Next Exam Date', value: nextExam ? format(nextExam.dateObj, 'MMM d') : '—', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Days Remaining', value: nextExam ? daysRemaining.toString() : '—', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'New Notifications', value: unreadCount.toString(), icon: Bell, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth));
    const end = endOfWeek(endOfMonth(calendarMonth));
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const examDatesInMonth = scheduledExams.filter((e) => isSameMonth(e.dateObj, calendarMonth));
  const selectedDateExams = scheduledExams.filter((e) => isSameDay(e.dateObj, selectedCalendarDate));

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Upcoming Exams"
        description="View all scheduled examinations assigned to you."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Upcoming Exams' }]}
        showSearch={false}
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-4 rounded-xl ${stat.bg} dark:bg-opacity-20`}>
                <stat.icon className={`w-8 h-8 ${stat.color} dark:text-opacity-80`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Main Content (70%) */}
        <div className="lg:col-span-8 space-y-6">
          {activeExams.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Active now</h2>
                <Badge className="border-0 bg-emerald-100 text-emerald-700">{activeExams.length} running</Badge>
              </div>
              {activeExams.map((exam) => (
                <Card key={exam.id} className="border-emerald-200 bg-emerald-50/50 shadow-md dark:border-emerald-900 dark:bg-emerald-950/20">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge className="border-0 bg-emerald-600 text-white">ACTIVE NOW</Badge>
                          {exam.subject && <Badge className="border-0 bg-blue-100 text-blue-700">{exam.subject}</Badge>}
                          {exam.isTestExam && <Badge className="border-0 bg-amber-100 text-amber-700">TEST EXAM</Badge>}
                        </div>
                        <h3 className="truncate text-2xl font-bold text-slate-900 dark:text-slate-100">{exam.title}</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          Window: {exam.time} - {exam.endTime} · Answered {exam.answeredCount}/{exam.questions}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:min-w-[220px]">
                        <Button className="h-12 bg-emerald-600 text-base font-bold text-white hover:bg-emerald-700" onClick={() => router.push(`/exam?id=${exam.id}`)}>
                          <PlayCircle className="mr-2 h-5 w-5" /> {exam.hasActiveAttempt ? 'Resume Exam' : 'Start Exam'}
                        </Button>
                        <Button variant="outline" onClick={() => router.push(`/student/system-check?examId=${exam.id}`)}>
                          <MonitorPlay className="mr-2 h-4 w-4" /> System Check
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {upcomingExams.length === 0 ? (
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm border-dashed text-center">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{activeExams.length ? 'No Later Upcoming Exams' : 'No Upcoming Exams'}</h3>
                  <p className="text-slate-500 max-w-sm">{activeExams.length ? 'Your current exam is shown above. Later scheduled exams will appear here.' : "You don't have any scheduled examinations at the moment. Enjoy your free time!"}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Scheduled next</h2>
              {upcomingExams.map((exam) => (
                <Card key={exam.id} className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:border-blue-300 dark:hover:border-blue-800 transition-colors">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {exam.subject && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">{exam.subject}</Badge>}
                          {exam.isTestExam && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">TEST EXAM</Badge>}
                          <Badge variant="outline" className="text-slate-500 font-mono">{exam.code}</Badge>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{exam.title}</h3>
                        <p className="text-slate-500 mt-1">Assigned by {exam.assignedBy}</p>
                      </div>
                      <div className="text-left md:text-right">
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center md:justify-end gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {exam.date}
                        </div>
                        <div className="text-slate-500 font-medium flex items-center md:justify-end gap-2 mt-1">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {exam.time} ({exam.duration})
                        </div>
                      </div>
                    </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 py-4 border-y border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Total Marks</p>
                      <p className="font-medium mt-1">{exam.marks}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Questions</p>
                      <p className="font-medium mt-1">{exam.questions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Duration</p>
                      <p className="font-medium mt-1">{exam.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Starts In</p>
                      <p className="font-mono font-bold mt-1 text-blue-600 tabular-nums">
                        {formatCountdown(exam.startDateTime.getTime() - now.getTime())}
                      </p>
                    </div>
                  </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => { setSelectedExam(exam); setInstructionsOpen(true); }}
                      >
                        <FileText className="mr-2 h-4 w-4" /> Exam Instructions
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full sm:w-auto sm:ml-auto text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => router.push(`/student/system-check?examId=${exam.id}`)}
                      >
                        <MonitorPlay className="mr-2 h-4 w-4" /> System Check
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar (30%) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Real calendar, current month, real exam dates highlighted */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">{format(calendarMonth, 'MMMM yyyy')}</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalendarMonth((m) => subMonths(m, 1))}>
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalendarMonth((m) => addMonths(m, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2 font-medium text-slate-500">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {calendarDays.map((day) => {
                  const inMonth = isSameMonth(day, calendarMonth);
                  const isToday = isSameDay(day, new Date());
                  const hasExam = examDatesInMonth.some((e) => isSameDay(e.dateObj, day));
                  return (
                    <button
                      type="button"
                      key={day.toISOString()}
                      onClick={() => { setSelectedCalendarDate(day); if (!inMonth) setCalendarMonth(day); }}
                      aria-label={`${format(day, 'MMMM d')}${hasExam ? ', exam scheduled' : ''}`}
                      aria-pressed={isSameDay(day, selectedCalendarDate)}
                      className={`p-2 rounded-lg relative ${!inMonth ? 'text-slate-300 dark:text-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'} ${isToday ? 'bg-blue-600 text-white font-bold shadow-sm' : hasExam ? 'bg-blue-100 text-blue-700 font-bold' : ''} ${isSameDay(day, selectedCalendarDate) ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                    >
                      {day.getDate()}
                      {hasExam && (
                        <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-blue-600'}`}></span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 border-t pt-4">
                <p className="mb-3 text-sm font-semibold">{format(selectedCalendarDate, 'EEEE, MMMM d')}</p>
                {selectedDateExams.length ? <div className="space-y-2">{selectedDateExams.map(exam => (
                  <button key={exam.mappingId} type="button" onClick={() => { setSelectedExam(exam); setInstructionsOpen(true); }} className="w-full rounded-lg border border-blue-100 bg-blue-50 p-3 text-left hover:border-blue-300">
                    <span className="flex items-center gap-2 font-semibold text-slate-900">{exam.title}{exam.status === 'active' && <Badge className="bg-emerald-100 text-emerald-700">ACTIVE</Badge>}{exam.isTestExam && <Badge className="bg-amber-100 text-amber-700">TEST</Badge>}</span>
                    <span className="mt-1 block text-xs text-slate-600">{exam.time} · {exam.duration} · {exam.marks} marks</span>
                  </button>
                ))}</div> : <p className="text-sm text-slate-500">No exams scheduled for this date.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Real notifications */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Important Announcements</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-slate-400">No announcements right now.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.slice(0, 3).map((n) => (
                    <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${n.unread ? 'bg-red-500' : 'bg-slate-300'}`}></span>
                        {n.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Exam Instructions Modal */}
      {selectedExam && (
        <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedExam.title}</DialogTitle>
              <DialogDescription>Exam Code: {selectedExam.code}{selectedExam.subject ? ` · ${selectedExam.subject}` : ''}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <div><p className="font-semibold text-slate-900 dark:text-slate-100">Duration</p><p>{selectedExam.duration}</p></div>
                <div><p className="font-semibold text-slate-900 dark:text-slate-100">Total Marks</p><p>{selectedExam.marks}</p></div>
                <div><p className="font-semibold text-slate-900 dark:text-slate-100">Questions</p><p>{selectedExam.questions}</p></div>
                <div><p className="font-semibold text-slate-900 dark:text-slate-100">Assigned By</p><p>{selectedExam.assignedBy}</p></div>
                <div><p className="font-semibold text-slate-900 dark:text-slate-100">Violations</p><p>Auto-submit at {selectedExam.maxViolations}</p></div>
                <div><p className="font-semibold text-slate-900 dark:text-slate-100">Calculator</p><p>{selectedExam.calculatorEnabled ? 'Allowed' : 'Not allowed'}</p></div>
              </div>
              <ul className="list-disc list-inside space-y-2">
                <li>Ensure you are in a quiet, well-lit environment.</li>
                <li>Tab switching, window minimizing, or fullscreen exit will be recorded as violations.</li>
                <li>The exam is auto-submitted when {selectedExam.maxViolations} violations are reached.</li>
                <li>Do not use any unauthorized materials or devices.</li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInstructionsOpen(false)}>Close</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setInstructionsOpen(false); router.push(`/student/system-check?examId=${selectedExam.id}`); }}>
                Proceed to System Check
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
