'use client';

import { useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, CalendarCheck, FileText, ChevronRight, Download } from 'lucide-react';
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
import { useExamStore } from '@/store/examStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function StudentCompletedExams() {
  const { examHistory, fetchExamHistory } = useExamStore();

  useEffect(() => {
    fetchExamHistory();
  }, [fetchExamHistory]);

  const completedExams = (examHistory || []).map((h) => ({
    id: h.examId,
    title: h.examTitle || 'Unknown Exam',
    subject: h.examSubject || 'Unknown',
    date: new Date(h.date).toLocaleDateString(),
    duration: h.examDuration ? `${(h.examDuration / 60).toFixed(1)} Hours` : '-',
    status: h.status === 'TERMINATED' ? 'Terminated' : 'Submitted',
    isPublished: h.resultStatus === 'Published',
  }));

  const handleViewDetails = async (examId: string, title: string, isPublished: boolean) => {
    if (!isPublished) {
      toast.info('Results for this exam have not been published yet.');
      return;
    }
    try {
      const { data } = await api.get(`/exams/${examId}/scorecard.pdf`, { responseType: 'blob' });
      const href = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = `${title}-scorecard.pdf`;
      anchor.click();
      URL.revokeObjectURL(href);
    } catch {
      toast.error('Unable to download the scorecard right now.');
    }
  };

  const totalHours = completedExams.reduce((sum, e) => sum + (parseFloat(e.duration) || 0), 0);

  const metrics = [
    { title: 'Completed Exams', value: completedExams.length.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Total Hours Spent', value: totalHours.toFixed(1), icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Last Exam Date', value: completedExams[0]?.date || '-', icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  const hasCompleted = completedExams.length > 0;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader 
        title="Completed Exams" 
        description="View examinations that you have successfully submitted."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Completed Exams' }]}
        showSearch={false}
      />
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          {!hasCompleted ? (
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm border-dashed text-center">
              <CardContent className="py-24">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">No Completed Exams</h3>
                  <p className="text-slate-500 max-w-sm">Your completed examinations will appear here once you successfully submit them.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                      <TableHead>Exam</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedExams.map((exam) => (
                      <TableRow key={exam.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                          {exam.title}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {exam.subject}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {exam.date}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {exam.duration}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900">
                            {exam.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                            onClick={() => handleViewDetails(exam.id, exam.title, exam.isPublished)}
                          >
                            <FileText className="mr-2 h-4 w-4" /> {exam.isPublished ? 'Details' : 'Pending'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar (30%) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
            <CardContent className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <Download className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Download All Submissions</h3>
              <p className="text-sm text-slate-500 mb-4">Get a ZIP file containing the proof of submission for all your completed exams.</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Generate Archive
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
