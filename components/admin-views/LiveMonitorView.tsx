'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Activity, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock, Maximize2, Minimize2, MonitorPlay, PanelLeftClose, PanelLeftOpen, RefreshCcw, UserCheck, Users } from 'lucide-react';
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

interface LoggedInStudent {
  userId: string;
  registerNumber: string;
  name: string;
  email: string;
  status: string;
  isLoggedIn: boolean;
  activeSessionCount: number;
  lastLoginAt: string | null;
  currentSessionStartedAt: string | null;
  sessionExpiresAt: string | null;
}

interface LoginClassroom {
  classId: string;
  className: string;
  departmentName: string;
  schoolName: string;
  batchName: string;
  totalStudents: number;
  loggedInStudents: number;
  offlineStudents: number;
  students: LoggedInStudent[];
}

interface LoginPayload {
  serverNow: string;
  totalClasses: number;
  totalStudents: number;
  loggedInStudents: number;
  classrooms: LoginClassroom[];
}

interface LiveMonitorSocketMessage {
  type: 'live-monitor:connected' | 'live-monitor:update' | 'live-monitor:error';
  serverNow?: string;
  live?: LivePayload;
  logins?: LoginPayload;
  message?: string;
}

const statusStyle: Record<LiveStudent['status'], string> = {
  NOT_STARTED: 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
  IN_PROGRESS: 'border-blue-300 bg-blue-50 text-blue-900 ring-1 ring-blue-200 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-100 dark:ring-blue-800',
  COMPLETED: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100',
  TERMINATED: 'border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100',
  FINALIZING: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100',
  RESET: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
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

const buildLiveMonitorSocketUrl = (token: string) => {
  const apiBase = String(process.env.NEXT_PUBLIC_API_URL || api.defaults.baseURL || '').replace(/\/$/, '');
  const url = new URL(apiBase);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = url.pathname.replace(/\/api\/?$/, '/ws/live-monitor');
  url.searchParams.set('token', token);
  return url.toString();
};

function SeatGroup({
  title,
  count,
  tone,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  tone: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
      >
        <span className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          <span className="font-bold text-slate-900 dark:text-slate-100">{title}</span>
        </span>
        <Badge className={tone}>{count}</Badge>
      </button>
      {expanded && (
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {count > 0 ? children : <p className="col-span-full py-6 text-center text-sm text-slate-500">No students in this group.</p>}
        </div>
      )}
    </section>
  );
}

export function LiveMonitorView({ role }: { role: 'admin' | 'super-admin' }) {
  const isSuperAdmin = role === 'super-admin';
  const token = useAuthStore((state) => state.token);
  const [data, setData] = useState<LivePayload>({ serverNow: new Date().toISOString(), exams: [] });
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);
  const [mode, setMode] = useState<'exams' | 'logins'>('exams');
  const [loginData, setLoginData] = useState<LoginPayload>({ serverNow: new Date().toISOString(), totalClasses: 0, totalStudents: 0, loggedInStudents: 0, classrooms: [] });
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'fallback'>('fallback');
  const [wallMode, setWallMode] = useState(false);
  // In wall mode the exam/classroom picker is collapsed by default so the
  // student seat grid gets the full screen — it's still reachable via the
  // collapse/expand toggle, just not competing with the seats for space.
  const [wallSidebarOpen, setWallSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    writing: true,
    finished: true,
    violations: true,
    notStarted: true,
    loggedIn: true,
    notLoggedIn: true,
  });

  const load = async () => {
    setIsLoading(true);
    try {
      const [{ data: payload }, { data: loginPayload }] = await Promise.all([
        api.get<LivePayload>('/results/live'),
        api.get<LoginPayload>('/results/live-logins'),
      ]);
      setData(payload);
      setLoginData(loginPayload);
      setSelectedExamId((current) => current && payload.exams.some((exam) => exam.examId === current) ? current : payload.exams[0]?.examId || null);
      setSelectedClassId((current) => current && loginPayload.classrooms.some((classroom) => classroom.classId === current) ? current : loginPayload.classrooms[0]?.classId || null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const [{ data: payload }, { data: loginPayload }] = await Promise.all([
          api.get<LivePayload>('/results/live', { silent: true }),
          api.get<LoginPayload>('/results/live-logins', { silent: true }),
        ]);
        if (cancelled) return;
        setData(payload);
        setLoginData(loginPayload);
        setSelectedExamId((current) => current && payload.exams.some((exam) => exam.examId === current) ? current : payload.exams[0]?.examId || null);
        setSelectedClassId((current) => current && loginPayload.classrooms.some((classroom) => classroom.classId === current) ? current : loginPayload.classrooms[0]?.classId || null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    const interval = setInterval(run, socketStatus === 'connected' ? 30000 : 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [socketStatus]);

  useEffect(() => {
    if (!token || typeof window === 'undefined') {
      return;
    }

    let closedByEffect = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let socket: WebSocket | null = null;

    const connect = () => {
      setSocketStatus('connecting');
      socket = new WebSocket(buildLiveMonitorSocketUrl(token));

      socket.onopen = () => {
        socket?.send(JSON.stringify({ type: 'live-monitor:subscribe', mode: 'both' }));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as LiveMonitorSocketMessage;
          if (message.type === 'live-monitor:connected') {
            setSocketStatus('connected');
            return;
          }
          if (message.type === 'live-monitor:update') {
            setSocketStatus('connected');
            if (message.live) {
              setData(message.live);
              setSelectedExamId((current) => current && message.live!.exams.some((exam) => exam.examId === current) ? current : message.live!.exams[0]?.examId || null);
            }
            if (message.logins) {
              setLoginData(message.logins);
              setSelectedClassId((current) => current && message.logins!.classrooms.some((classroom) => classroom.classId === current) ? current : message.logins!.classrooms[0]?.classId || null);
            }
          }
        } catch {
          // Ignore malformed socket payloads and keep the existing data visible.
        }
      };

      socket.onerror = () => {
        setSocketStatus('fallback');
      };

      socket.onclose = () => {
        if (closedByEffect) return;
        setSocketStatus('fallback');
        retryTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, [token]);

  const selectedExam = data.exams.find((exam) => exam.examId === selectedExamId) || data.exams[0];
  const selectedMapping = selectedExam?.mappings.find((mapping) => mapping.mappingId === selectedMappingId) || selectedExam?.mappings[0];
  const selectedClassroom = loginData.classrooms.find((classroom) => classroom.classId === selectedClassId) || loginData.classrooms[0];

  const totals = useMemo(() => data.exams.reduce((out, exam) => ({
    exams: out.exams + 1,
    mapped: out.mapped + exam.totalMappedStudents,
    active: out.active + exam.activeStudents,
    completed: out.completed + exam.completedStudents,
    violations: out.violations + exam.violationCount,
  }), { exams: 0, mapped: 0, active: 0, completed: 0, violations: 0 }), [data.exams]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((current) => ({ ...current, [key]: !(current[key] ?? true) }));
  };

  const enterWallMode = async () => {
    setWallMode(true);
    setWallSidebarOpen(false);
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen can be blocked by browser/user settings; the wall layout still opens.
    }
  };

  const exitWallMode = async () => {
    setWallMode(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // Ignore browser fullscreen exit failures.
    }
  };

  const renderExamSeat = (student: LiveStudent, index: number) => {
    const progress = student.totalQuestions > 0 ? Math.round((student.answeredCount / student.totalQuestions) * 100) : 0;
    return (
      <div key={student.userId} className={`rounded-2xl border p-4 shadow-sm ${statusStyle[student.status] || statusStyle.NOT_STARTED}`}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-slate-950/80">
            <MonitorPlay className="h-5 w-5" />
          </div>
          <Badge variant="outline" className="bg-white/70 dark:bg-slate-950/70 dark:text-slate-100">Seat {index + 1}</Badge>
        </div>
        <div className="min-h-[72px]">
          <p className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{student.registerNumber}</p>
          <p className="mt-1 line-clamp-2 font-bold text-slate-950 dark:text-slate-50">{student.name}</p>
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
          <div className="rounded-lg bg-white/70 p-2 dark:bg-slate-950/60"><Clock className="mb-1 h-3.5 w-3.5" />{student.status === 'IN_PROGRESS' ? `Ends ${formatTime(student.expiresAt)}` : formatTime(student.endedAt || student.startedAt)}</div>
          <div className={`rounded-lg p-2 ${student.violationsCount > 0 ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-100' : 'bg-white/70 dark:bg-slate-950/60'}`}><AlertTriangle className="mb-1 h-3.5 w-3.5" />{student.violationsCount} violation{student.violationsCount === 1 ? '' : 's'}</div>
        </div>
        {!!student.violationsCount && (
          <div className="mt-3 rounded-lg border border-red-200 bg-white/80 p-2 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100">
            <p className="font-semibold">Latest violation</p>
            <p className="mt-1 line-clamp-2">{student.violations?.at(-1)?.description || student.violations?.at(-1)?.type || 'Violation recorded'}</p>
          </div>
        )}
      </div>
    );
  };

  const renderLoginSeat = (student: LoggedInStudent, index: number) => (
    <div key={student.userId} className={`rounded-2xl border p-4 shadow-sm ${student.isLoggedIn ? 'border-emerald-300 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-800' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-slate-950/80">
          <UserCheck className={`h-5 w-5 ${student.isLoggedIn ? 'text-emerald-600' : 'text-slate-400'}`} />
        </div>
        <Badge variant="outline" className="bg-white/70 dark:bg-slate-950/70 dark:text-slate-100">Seat {index + 1}</Badge>
      </div>
      <div className="min-h-[78px]">
        <p className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{student.registerNumber}</p>
        <p className="mt-1 line-clamp-2 font-bold text-slate-950 dark:text-slate-50">{student.name}</p>
        <p className="mt-1 text-xs">{student.isLoggedIn ? 'Logged in' : 'Not logged in yet'}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white/70 p-2 dark:bg-slate-950/60"><Clock className="mb-1 h-3.5 w-3.5" />Last login {formatTime(student.lastLoginAt)}</div>
        <div className="rounded-lg bg-white/70 p-2 dark:bg-slate-950/60"><Activity className="mb-1 h-3.5 w-3.5" />{student.activeSessionCount} active session{student.activeSessionCount === 1 ? '' : 's'}</div>
      </div>
      {student.isLoggedIn && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-white/80 p-2 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">
          Session from {formatTime(student.currentSessionStartedAt)} to {formatTime(student.sessionExpiresAt)}
        </p>
      )}
    </div>
  );

  const examSeatGroups = selectedMapping ? {
    violations: selectedMapping.students.filter((student) => student.status === 'TERMINATED' || student.violationsCount > 0),
    writing: selectedMapping.students.filter((student) => ['IN_PROGRESS', 'FINALIZING'].includes(student.status) && student.violationsCount === 0),
    finished: selectedMapping.students.filter((student) => student.status === 'COMPLETED' && student.violationsCount === 0),
    notStarted: selectedMapping.students.filter((student) => ['NOT_STARTED', 'RESET'].includes(student.status)),
  } : null;

  const loginSeatGroups = selectedClassroom ? {
    loggedIn: selectedClassroom.students.filter((student) => student.isLoggedIn),
    notLoggedIn: selectedClassroom.students.filter((student) => !student.isLoggedIn),
  } : null;

  return (
    <div className={wallMode ? 'fixed inset-0 z-[200] space-y-5 overflow-auto bg-slate-100 p-4 pb-10 dark:bg-slate-950' : 'space-y-6 pb-10'}>
      {wallMode ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setWallSidebarOpen((v) => !v)}>
              {wallSidebarOpen ? <PanelLeftClose className="mr-2 h-4 w-4" /> : <PanelLeftOpen className="mr-2 h-4 w-4" />}
              {wallSidebarOpen ? 'Collapse' : 'Expand'}
            </Button>
            <Badge
              variant="outline"
              className={socketStatus === 'connected'
                ? 'h-9 rounded-lg border-emerald-200 bg-emerald-50 px-3 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
                : 'h-9 rounded-lg border-amber-200 bg-amber-50 px-3 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'}
            >
              {socketStatus === 'connected' ? 'Realtime WS' : socketStatus === 'connecting' ? 'Connecting WS' : 'API fallback'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={load} disabled={isLoading}><RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />Refresh</Button>
            <Button size="sm" variant="outline" onClick={exitWallMode}><Minimize2 className="mr-2 h-4 w-4" />Exit wall mode</Button>
          </div>
        </div>
      ) : (
        <>
      <PageHeader
        title="Live Exam Monitor"
        description="Monitor running exams and logged-in students by classroom."
        breadcrumbs={[{ label: isSuperAdmin ? 'Super Admin' : 'Admin', href: `/${role}/dashboard` }, { label: 'Live Monitor' }]}
        showSearch={false}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={socketStatus === 'connected'
                ? 'h-10 rounded-lg border-emerald-200 bg-emerald-50 px-3 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
                : 'h-10 rounded-lg border-amber-200 bg-amber-50 px-3 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'}
            >
              {socketStatus === 'connected' ? 'Realtime WS' : socketStatus === 'connecting' ? 'Connecting WS' : 'API fallback'}
            </Badge>
            <Button variant="outline" onClick={wallMode ? exitWallMode : enterWallMode}>
              {wallMode ? <Minimize2 className="mr-2 h-4 w-4" /> : <Maximize2 className="mr-2 h-4 w-4" />}
              {wallMode ? 'Exit wall mode' : 'Fullscreen wall mode'}
            </Button>
            <Button variant="outline" onClick={load} disabled={isLoading}><RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />Refresh</Button>
          </div>
        )}
      />

      <div className="flex flex-wrap gap-3">
        <Button variant={mode === 'exams' ? 'default' : 'outline'} onClick={() => setMode('exams')}>
          <MonitorPlay className="mr-2 h-4 w-4" /> Live Exams
        </Button>
        <Button variant={mode === 'logins' ? 'default' : 'outline'} onClick={() => setMode('logins')}>
          <UserCheck className="mr-2 h-4 w-4" /> Logged-in Students
        </Button>
      </div>

      {mode === 'exams' ? <div className="grid gap-4 md:grid-cols-5">
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
      </div> : <div className="grid gap-4 md:grid-cols-4">
        {([
          { title: 'Classrooms', value: loginData.totalClasses, Icon: MonitorPlay, color: 'text-blue-600', bg: 'bg-blue-100' },
          { title: 'Total Students', value: loginData.totalStudents, Icon: Users, color: 'text-slate-600', bg: 'bg-slate-100' },
          { title: 'Logged In', value: loginData.loggedInStudents, Icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { title: 'Offline', value: Math.max(0, loginData.totalStudents - loginData.loggedInStudents), Icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
        ] satisfies Array<{ title: string; value: number; Icon: LucideIcon; color: string; bg: string }>).map(({ title, value, Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="flex items-center gap-3 p-5">
              <div className={`rounded-xl p-3 ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">{title}</p><p className="text-2xl font-bold">{value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>}
        </>
      )}

      {mode === 'logins' ? (
        loginData.classrooms.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-20 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h2 className="text-xl font-bold">No classrooms found</h2>
              <p className="mt-2 text-slate-500">Students will appear here once classes are available.</p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-6 ${wallMode && !wallSidebarOpen ? '' : 'xl:grid-cols-[320px_1fr]'}`}>
            {(!wallMode || wallSidebarOpen) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Classrooms</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {loginData.classrooms.map((classroom) => (
                  <button
                    key={classroom.classId}
                    type="button"
                    onClick={() => setSelectedClassId(classroom.classId)}
                    className={`w-full rounded-xl border p-4 text-left transition hover:border-blue-300 ${selectedClassroom?.classId === classroom.classId ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}
                  >
                    <p className="font-bold">{classroom.className}</p>
                    <p className="mt-1 text-xs text-slate-500">{classroom.departmentName} · {classroom.schoolName}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded bg-emerald-50 p-2"><b>{classroom.loggedInStudents}</b><span className="block text-slate-500">online</span></div>
                      <div className="rounded bg-slate-50 p-2"><b>{classroom.offlineStudents}</b><span className="block text-slate-500">offline</span></div>
                      <div className="rounded bg-blue-50 p-2"><b>{classroom.totalStudents}</b><span className="block text-slate-500">total</span></div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
            )}

            <Card>
              <CardHeader className="border-b">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>{selectedClassroom?.className || 'Classroom Login Status'}</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">{selectedClassroom ? `${selectedClassroom.batchName} · ${selectedClassroom.schoolName}` : 'Select a classroom'} · Last updated {formatTime(loginData.serverNow)}</p>
                  </div>
                  {selectedClassroom && (
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-emerald-100 text-emerald-700">{selectedClassroom.loggedInStudents} logged in</Badge>
                      <Badge className="bg-slate-100 text-slate-700">{selectedClassroom.offlineStudents} offline</Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5">
                {!selectedClassroom ? (
                  <p className="py-10 text-center text-slate-500">Select a classroom to view live login seats.</p>
                ) : (
                  <div className="space-y-4">
                    <SeatGroup title="Logged in students" count={loginSeatGroups?.loggedIn.length || 0} tone="bg-emerald-100 text-emerald-700" expanded={expandedGroups.loggedIn ?? true} onToggle={() => toggleGroup('loggedIn')}>
                      {loginSeatGroups?.loggedIn.map((student, index) => renderLoginSeat(student, index))}
                    </SeatGroup>
                    <SeatGroup title="Not logged in yet" count={loginSeatGroups?.notLoggedIn.length || 0} tone="bg-slate-100 text-slate-700" expanded={expandedGroups.notLoggedIn ?? true} onToggle={() => toggleGroup('notLoggedIn')}>
                      {loginSeatGroups?.notLoggedIn.map((student, index) => renderLoginSeat(student, (loginSeatGroups?.loggedIn.length || 0) + index))}
                    </SeatGroup>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      ) : data.exams.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <MonitorPlay className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-xl font-bold">No exams are running right now</h2>
            <p className="mt-2 text-slate-500">When a mapped exam enters its scheduled window, it will appear here automatically.</p>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid gap-6 ${wallMode && !wallSidebarOpen ? '' : 'xl:grid-cols-[320px_1fr]'}`}>
          {(!wallMode || wallSidebarOpen) && (
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
          )}

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
                <div className="space-y-4">
                  <SeatGroup title="Writing now" count={examSeatGroups?.writing.length || 0} tone="bg-blue-100 text-blue-700" expanded={expandedGroups.writing ?? true} onToggle={() => toggleGroup('writing')}>
                    {examSeatGroups?.writing.map((student, index) => renderExamSeat(student, index))}
                  </SeatGroup>
                  <SeatGroup title="Finished" count={examSeatGroups?.finished.length || 0} tone="bg-emerald-100 text-emerald-700" expanded={expandedGroups.finished ?? true} onToggle={() => toggleGroup('finished')}>
                    {examSeatGroups?.finished.map((student, index) => renderExamSeat(student, (examSeatGroups?.writing.length || 0) + index))}
                  </SeatGroup>
                  <SeatGroup title="Violations / terminated" count={examSeatGroups?.violations.length || 0} tone="bg-red-100 text-red-700" expanded={expandedGroups.violations ?? true} onToggle={() => toggleGroup('violations')}>
                    {examSeatGroups?.violations.map((student, index) => renderExamSeat(student, (examSeatGroups?.writing.length || 0) + (examSeatGroups?.finished.length || 0) + index))}
                  </SeatGroup>
                  <SeatGroup title="Not started students" count={examSeatGroups?.notStarted.length || 0} tone="bg-slate-100 text-slate-700" expanded={expandedGroups.notStarted ?? true} onToggle={() => toggleGroup('notStarted')}>
                    {examSeatGroups?.notStarted.map((student, index) => renderExamSeat(student, (examSeatGroups?.writing.length || 0) + (examSeatGroups?.finished.length || 0) + (examSeatGroups?.violations.length || 0) + index))}
                  </SeatGroup>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
