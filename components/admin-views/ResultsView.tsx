'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileBarChart, Trophy, TrendingUp, AlertTriangle, Download, Eye, Share2 } from 'lucide-react';
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
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAdminStore } from '@/store/adminStore';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/SkeletonTable';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { sanitizeQuestionOptions, simplifyImportedDateOption } from '@/lib/questionOptions';

interface ResultsViewProps {
  role: 'admin' | 'super-admin';
}

interface ResultsAnalytics {
  totalStudents: number;
  overallPassRate: number;
  averageScorePercent: number;
  needsAttention: number;
  subjectPerformance: { subject: string; average: number; highest: number }[];
  gradeDistribution: { name: string; value: number; color: string }[];
}

interface AttemptSummary { id: string; studentName: string; registerNumber?: string; classId?: string; className?: string; status: string; score: number; violationsCount: number; }
interface AttemptDetail extends AttemptSummary {
  exam: { title: string; totalMarks: number };
  student: { name: string; registerNumber?: string };
  violations: { type: string; description: string; timestamp?: number }[];
  questions: { id: string; text: string; options: string[]; correctAnswer: string; selectedAnswer?: string; marks: number }[];
  manuallyEvaluated?: boolean;
  evaluationReason?: string | null;
  startedAt?: string;
  expiresAt?: string | null;
  endedAt?: string | null;
  actions?: { id: string; action: string; reason: string; createdAt: string }[];
}

export function ResultsView({ role }: ResultsViewProps) {
  const isSuperAdmin = role === 'super-admin';
  const { results, isLoading, fetchResults, publishResult } = useAdminStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [analytics, setAnalytics] = useState<ResultsAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [attemptsOpen, setAttemptsOpen] = useState(false);
  const [attemptsTitle, setAttemptsTitle] = useState('Student Attempts');
  const [attemptDetail, setAttemptDetail] = useState<AttemptDetail | null>(null);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    let cancelled = false;
    api.get('/results/analytics')
      .then(({ data }) => { if (!cancelled) setAnalytics(data); })
      .finally(() => { if (!cancelled) setIsLoadingAnalytics(false); });
    return () => { cancelled = true; };
  }, []);

  const barData = analytics?.subjectPerformance || [];
  const pieData = analytics?.gradeDistribution || [];
  const hasGrades = pieData.some((d) => d.value > 0);

  const handlePublishAll = () => {
    results.filter(r => r.status !== 'Published' && r.canPublish).forEach(r => {
      if (r.id) publishResult(r.id);
    });
  };

  const openAttempts = async (examId: string, classId?: string, title = 'Student Attempts') => {
    const { data } = await api.get('/results/attempts', { params: { examId, classId } });
    setAttempts(data);
    setAttemptsTitle(title);
    setAttemptsOpen(true);
  };

  const openAttempt = async (id: string) => {
    const { data } = await api.get(`/results/attempts/${id}`);
    setAttemptDetail({
      ...data,
      questions: (data.questions || []).map((question: AttemptDetail['questions'][number]) => ({
        ...sanitizeQuestionOptions(question),
        correctAnswer: simplifyImportedDateOption(question.correctAnswer),
        selectedAnswer: question.selectedAnswer ? simplifyImportedDateOption(question.selectedAnswer) : question.selectedAnswer,
      })),
    });
    setAttemptsOpen(false);
  };

  const actionWithReason = async (action: 'regrade' | 'reset' | 'extend' | 'evaluate') => {
    if (!attemptDetail) return;
    const reason = window.prompt(`Reason for ${action}:`);
    if (!reason) return;
    if (action === 'evaluate') {
      const score = Number(window.prompt('New score:'));
      if (!Number.isFinite(score)) return;
      await api.patch(`/results/attempts/${attemptDetail.id}/evaluate`, { score, reason });
    } else if (action === 'extend') {
      const minutes = Number(window.prompt('Extension minutes:'));
      if (!Number.isFinite(minutes) || minutes <= 0) return;
      await api.post(`/results/attempts/${attemptDetail.id}/extend`, { minutes, reason });
    } else {
      await api.post(`/results/attempts/${attemptDetail.id}/${action}`, { reason });
    }
    await openAttempt(attemptDetail.id);
    await fetchResults();
  };

  const download = async (url: string, filename: string) => {
    const { data } = await api.get(url, { responseType: 'blob' });
    const href = URL.createObjectURL(data);
    const anchor = document.createElement('a');
    anchor.href = href; anchor.download = filename; anchor.click();
    URL.revokeObjectURL(href);
  };

  // Filtering
  const filteredResults = results.filter(r => 
    r.examName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.examId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalRecords = filteredResults.length;
  const startIndex = (currentPage - 1) * pageSize;
  const currentResults = filteredResults.slice(startIndex, startIndex + pageSize);

  const stats = [
    { title: 'Total Results', value: results.length, icon: FileBarChart, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Overall Pass Rate', value: `${analytics?.overallPassRate ?? 0}%`, icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Average Score', value: `${analytics?.averageScorePercent ?? 0}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Needs Attention', value: analytics?.needsAttention ?? 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader 
        title="Results & Analytics" 
        description="Review exam performance, generate result sheets, and analyze statistics."
        breadcrumbs={[
          { label: isSuperAdmin ? 'Super Admin' : 'Admin', href: `/${role}/dashboard` },
          { label: 'Results' }
        ]}
        showSearch={true}
        onSearch={setSearchTerm}
        actions={
          <Button onClick={handlePublishAll} className="bg-teal-600 hover:bg-teal-700 text-white">
            <Share2 className="w-4 h-4 mr-2" /> Publish Results
          </Button>
        }
      />
      
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

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Subject Performance Averages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-70 w-full mt-4">
              {isLoadingAnalytics ? (
                <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">Loading...</div>
              ) : barData.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">No completed exams yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="average" name="Average Score %" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                    <Bar dataKey="highest" name="Highest Score %" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-70">
            {isLoadingAnalytics ? (
              <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">Loading...</div>
            ) : !hasGrades ? (
              <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">No completed exams yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center text-xs text-slate-600">
                      <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: item.color }} />
                      {item.name} ({item.value})
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Table Area */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Exam Results Registry</h3>
          <Button variant="outline" size="sm" className="h-8 shadow-sm" onClick={() => download('/results/export/all.csv', 'all-results.csv')}>
            <Download className="w-4 h-4 mr-2" /> Download All
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4"><SkeletonTable rows={5} cols={5} /></div>
          ) : currentResults.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Exam Name</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Candidates</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Date Published</TableHead>
                  <TableHead className="font-semibold text-slate-900 dark:text-slate-200">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentResults.map((result) => (
                  <React.Fragment key={result.id}>
                    <TableRow className="border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">{result.examName}{result.isTestExam && <Badge className="bg-amber-100 text-amber-700">TEST</Badge>}</span>
                          <span className="text-xs text-slate-500">ID: {result.examId}</span>
                          {!!result.mappingSummaries?.length && <span className="mt-1 text-xs text-blue-600">{result.mappingSummaries.length} mapped class{result.mappingSummaries.length > 1 ? 'es' : ''}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400 font-medium">
                        {result.totalStudents} Evaluated
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {result.status === 'Published' ? new Date(result.publishedDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={`
                            ${result.status === 'Published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : ''}
                            ${result.status === 'Pending Evaluation' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : ''}
                            ${result.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : ''}
                            font-medium border-0
                          `}
                        >
                          {result.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openAttempts(result.examId, undefined, `${result.examName} — All Attempts`)}><Eye className="w-4 h-4 mr-1" /> All Attempts</Button>
                          <Button variant="outline" size="sm" onClick={() => download(`/results/${result.id}/export.csv`, `${result.examName}.csv`)}><Download className="w-4 h-4" /></Button>
                        {result.status === 'Pending Evaluation' ? (
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => publishResult(result.id!)}
                            disabled={isLoading || !result.canPublish}
                            title={result.publishBlockedReason || 'Publish result'}
                          >
                            <Share2 className="w-4 h-4 mr-1.5" /> {result.canPublish ? 'Publish' : 'Exam not ended'}
                          </Button>
                        ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                    {!!result.mappingSummaries?.length && (
                      <TableRow className="bg-slate-50/70 dark:bg-slate-900/40 hover:bg-slate-50/70">
                        <TableCell colSpan={5} className="p-0">
                          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                            {result.mappingSummaries.map((mapping) => (
                              <button
                                key={mapping.mappingId}
                                type="button"
                                onClick={() => openAttempts(result.examId, mapping.classId, `${result.examName} — ${mapping.className}`)}
                                className="rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:bg-slate-950"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{mapping.className}</p>
                                    <p className="mt-1 text-xs text-slate-500">{mapping.startTime || '-'} - {mapping.endTime || '-'} · {mapping.assignedStudents} assigned</p>
                                  </div>
                                  {mapping.active > 0 && <Badge className="bg-blue-100 text-blue-700">{mapping.active} active</Badge>}
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                                  <div><p className="text-slate-500">Evaluated</p><p className="mt-1 font-bold">{mapping.evaluated}</p></div>
                                  <div><p className="text-slate-500">Avg</p><p className="mt-1 font-bold">{mapping.averageScorePercent}%</p></div>
                                  <div><p className="text-slate-500">Pass</p><p className="mt-1 font-bold">{mapping.passRate}%</p></div>
                                </div>
                                <p className="mt-3 text-xs text-blue-600">View class attempts</p>
                              </button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState 
              title="No results found" 
              description={searchTerm ? `No results match your search "${searchTerm}".` : "There are currently no exam results available."}
              actionLabel={searchTerm ? "Clear Search" : undefined}
              onAction={searchTerm ? () => setSearchTerm('') : undefined}
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

      <Dialog open={attemptsOpen} onOpenChange={setAttemptsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{attemptsTitle}</DialogTitle></DialogHeader>
          <div className="space-y-2">{attempts.map((attempt) => <button key={attempt.id} onClick={() => openAttempt(attempt.id)} className="w-full border rounded-lg p-3 flex justify-between text-left hover:bg-slate-50"><span><b>{attempt.studentName}</b><br/><span className="text-xs text-slate-500">{attempt.registerNumber} · {attempt.className || 'Class'} · {attempt.violationsCount} violations</span></span><span>{attempt.score} · {attempt.status}</span></button>)}</div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!attemptDetail} onOpenChange={(open) => { if (!open) setAttemptDetail(null); }}>
        <DialogContent className="!h-[88vh] !w-[80vw] !max-w-[80vw] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0 gap-0">
          <div className="flex items-start justify-between border-b px-6 py-4 pr-14">
            <DialogHeader><DialogTitle>{attemptDetail?.student.name} — {attemptDetail?.exam.title}</DialogTitle><p className="text-xs text-slate-500">Attempt {attemptDetail?.id}</p></DialogHeader>
            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => actionWithReason('evaluate')}>Manual Score</Button>
              <Button size="sm" variant="outline" onClick={() => actionWithReason('regrade')}>Regrade</Button>
              <Button size="sm" variant="outline" disabled={attemptDetail?.status !== 'IN_PROGRESS'} onClick={() => actionWithReason('extend')}>Extend</Button>
              <Button size="sm" variant="outline" disabled={!attemptDetail || !['COMPLETED', 'TERMINATED'].includes(attemptDetail.status)} onClick={() => actionWithReason('reset')}>Reset</Button>
              <Button size="sm" onClick={() => download(`/results/attempts/${attemptDetail?.id}/response.pdf`, `${attemptDetail?.student.registerNumber || 'student'}-response.pdf`)}><Download className="mr-2 h-4 w-4" />Download response PDF</Button>
            </div>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-[230px_1fr] overflow-hidden">
            <aside className="border-r bg-slate-50 p-5 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Score</p><p className="mt-1 text-2xl font-bold">{attemptDetail?.score} / {attemptDetail?.exam.totalMarks}</p>
              <div className="mt-5 space-y-3 text-slate-600">
                <p><b>Status:</b> {attemptDetail?.status}</p>
                <p><b>Register no:</b> {attemptDetail?.student.registerNumber || '—'}</p>
                <p><b>Questions:</b> {attemptDetail?.questions.length || 0}</p>
                <p><b>Violations:</b> {attemptDetail?.violations?.length || 0}</p>
                <p><b>Manual evaluation:</b> {attemptDetail?.manuallyEvaluated ? 'Yes' : 'No'}</p>
                {attemptDetail?.evaluationReason && <p><b>Evaluation reason:</b> {attemptDetail.evaluationReason}</p>}
              </div>
              {!!attemptDetail?.actions?.length && (
                <div className="mt-6 border-t pt-4">
                  <p className="mb-2 font-semibold">Admin actions</p>
                  <div className="space-y-2 text-xs text-slate-600">
                    {attemptDetail.actions.slice(0, 5).map((action) => (
                      <div key={action.id} className="rounded-lg border bg-white p-2">
                        <p className="font-semibold text-slate-800">{action.action.replaceAll('_', ' ')}</p>
                        <p className="mt-1">{action.reason}</p>
                        <p className="mt-1 text-slate-500">{new Date(action.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6 border-t pt-4"><p className="mb-2 font-semibold">Legend</p><p className="text-emerald-700">Green: correct selection</p><p className="text-red-700">Red: incorrect selection</p><p className="text-slate-500">Grey: unanswered</p></div>
            </aside>
            <main className="overflow-y-auto p-6">
              <div className="mx-auto max-w-4xl space-y-4">
                {!!attemptDetail?.violations?.length && <section className="rounded-xl border border-amber-200 bg-amber-50 p-5"><h3 className="font-semibold text-amber-900">Violation history ({attemptDetail.violations.length})</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{attemptDetail.violations.map((violation, index) => <div key={`${violation.timestamp || index}-${index}`} className="rounded-lg border border-amber-200 bg-white p-3"><p className="font-semibold text-amber-800">Violation {index + 1}: {violation.type.replaceAll('_', ' ')}</p><p className="mt-1 text-slate-700">{violation.description}</p>{violation.timestamp && <p className="mt-1 text-xs text-slate-500">{new Date(violation.timestamp).toLocaleString()}</p>}</div>)}</div></section>}
                {attemptDetail?.questions.map((question, index) => {
                const answered = !!question.selectedAnswer; const correct = question.selectedAnswer === question.correctAnswer;
                return <section key={question.id} className="rounded-xl border bg-white p-5 text-sm">
                  <div className="flex justify-between gap-4"><h3 className="text-base font-semibold">{index + 1}. {question.text}</h3><Badge variant="outline">{question.marks} marks</Badge></div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">{question.options?.map((option, optionIndex) => {
                    const selected = option === question.selectedAnswer; const isCorrect = option === question.correctAnswer;
                    return <div key={optionIndex} className={`rounded-lg border p-3 ${selected && correct ? 'border-emerald-400 bg-emerald-50' : selected ? 'border-red-400 bg-red-50' : isCorrect ? 'border-emerald-300 bg-emerald-50/50' : 'bg-slate-50'}`}><b className="mr-2">{String.fromCharCode(65 + optionIndex)}.</b>{option}{selected && <span className="ml-2 text-xs font-semibold">Student selected</span>}</div>;
                  })}</div>
                  {!answered && <p className="mt-3 rounded bg-slate-100 p-2 text-slate-500">Student did not answer this question.</p>}
                </section>;
              })}</div>
            </main>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
