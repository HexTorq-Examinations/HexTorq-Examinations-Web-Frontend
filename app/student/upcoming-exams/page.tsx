'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Bell, FileText, ChevronRight, MonitorPlay } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useExamStore } from '@/store/examStore';

export default function StudentUpcomingExams() {
  const router = useRouter();
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const { myMappings, examHistory, fetchMyMappings, fetchExamHistory } = useExamStore();

  useEffect(() => {
    fetchMyMappings();
    fetchExamHistory();
  }, [fetchMyMappings, fetchExamHistory]);

  const upcomingExams = myMappings
    .filter(m => m.status !== 'Completed' && m.status !== 'Cancelled' && !(examHistory || []).some(h => h.examId === m.examId))
    .map(m => ({
    id: m.examId,
    mappingId: m.id,
    title: m.examTitle || 'Exam',
    subject: '',
    code: `EXM-${(m.examId || '').toUpperCase()}`,
    date: new Date(m.date).toLocaleDateString(),
    time: m.startTime,
    duration: `${m.startTime} - ${m.endTime}`,
    marks: 0,
    questions: 0,
    assignedBy: 'System Admin',
    status: m.status,
  }));

  // Sort the upcoming exams by nearest date
  const sortedExams = [...upcomingExams].sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime());
  const nextExam = sortedExams[0];
  
  let nextExamDate = 'N/A';
  let daysRemaining = '0';
  if (nextExam) {
    const nextDate = new Date(`${nextExam.date} ${nextExam.time}`);
    nextExamDate = nextDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const diffTime = Math.abs(nextDate.getTime() - new Date().getTime());
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24)).toString();
  }

  const metrics = [
    { title: 'Total Upcoming Exams', value: upcomingExams.length.toString(), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Next Exam Date', value: nextExamDate, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Days Remaining', value: daysRemaining, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'New Notifications', value: '0', icon: Bell, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

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
          {upcomingExams.length === 0 ? (
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm border-dashed text-center">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">No Upcoming Exams</h3>
                  <p className="text-slate-500 max-w-sm">You don't have any scheduled examinations at the moment. Enjoy your free time!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            upcomingExams.map((exam) => (
              <Card key={exam.id} className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:border-blue-300 dark:hover:border-blue-800 transition-colors">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">{exam.subject}</Badge>
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
                      <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Status</p>
                      <p className="font-medium mt-1 text-emerald-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        {exam.status}
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
            ))
          )}
        </div>

        {/* Right Sidebar (30%) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Calendar placeholder */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">October 2026</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4 rotate-180" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2 font-medium text-slate-500">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {/* Mock calendar days */}
                <div className="p-2 text-slate-300">27</div><div className="p-2 text-slate-300">28</div><div className="p-2 text-slate-300">29</div><div className="p-2 text-slate-300">30</div>
                <div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">1</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">2</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">3</div>
                <div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">4</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">5</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">6</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">7</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">8</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">9</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">10</div>
                <div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">11</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">12</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">13</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">14</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">15</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">16</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">17</div>
                <div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">18</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">19</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">20</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">21</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">22</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">23</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">24</div>
                <div className="p-2 rounded-lg bg-blue-600 text-white font-bold cursor-pointer shadow-sm relative">25<span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span></div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">26</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">27</div><div className="p-2 rounded-lg bg-blue-100 text-blue-700 font-bold cursor-pointer relative">28<span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></span></div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">29</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">30</div><div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">31</div>
              </div>
            </CardContent>
          </Card>

          {/* Important Announcements */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Important Announcements</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                    Updated Browser Requirements
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">Ensure you are using the latest version of Chrome or Edge for the secure browser to function properly.</p>
                </div>
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                    CS302 Time Change
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">The database management exam has been moved from 10 AM to 2 PM on Oct 28.</p>
                </div>
              </div>
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
              <DialogDescription>Exam Code: {selectedExam.code} · {selectedExam.subject}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <div><p className="font-semibold text-slate-900 dark:text-slate-100">Duration</p><p>{selectedExam.duration}</p></div>
                <div><p className="font-semibold text-slate-900 dark:text-slate-100">Total Marks</p><p>{selectedExam.marks}</p></div>
                <div><p className="font-semibold text-slate-900 dark:text-slate-100">Questions</p><p>{selectedExam.questions}</p></div>
                <div><p className="font-semibold text-slate-900 dark:text-slate-100">Assigned By</p><p>{selectedExam.assignedBy}</p></div>
              </div>
              <ul className="list-disc list-inside space-y-2">
                <li>Ensure you are in a quiet, well-lit environment.</li>
                <li>Camera and microphone must remain active throughout the exam.</li>
                <li>Tab switching, window minimizing, or fullscreen exit will be recorded as violations.</li>
                <li>Maximum 3 violations are allowed before the exam is auto-submitted.</li>
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
