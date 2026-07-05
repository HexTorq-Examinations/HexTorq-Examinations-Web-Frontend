'use client';

import { useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, PlayCircle, CheckCircle2, Bell, Clock, ChevronRight, FileText, Monitor, User, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useExamStore } from '@/store/examStore';
import { useMessagingStore } from '@/store/messagingStore';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { examHistory, fetchExamHistory, myMappings, fetchMyMappings } = useExamStore();
  const { conversations, unreadTotal, fetchConversations, fetchUnreadTotal } = useMessagingStore();

  useEffect(() => {
    fetchMyMappings();
    fetchExamHistory();
    fetchConversations();
    fetchUnreadTotal();
  }, [fetchMyMappings, fetchExamHistory, fetchConversations, fetchUnreadTotal]);

  const upcomingMappings = myMappings.filter(m => new Date(`${m.date}T${m.startTime}`) > new Date() && !(examHistory || []).some(h => h.examId === m.examId));
  // Sort upcoming by nearest date first
  upcomingMappings.sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

  const activeMappings = myMappings.filter(m => m.status === 'In Progress' && !(examHistory || []).some(h => h.examId === m.examId));
  const completedCount = (examHistory || []).length;
  const upcomingCount = upcomingMappings.length;
  const activeCount = activeMappings.length;

  const nextExam = upcomingMappings[0];
  
  const stats = [
    { title: 'Upcoming Exams', value: upcomingCount.toString(), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Active Exams', value: activeCount.toString(), icon: PlayCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Completed Exams', value: completedCount.toString(), icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Notifications', value: unreadTotal.toString(), icon: Bell, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader 
        title="Student Dashboard" 
        description="Your central hub for all examination activities."
        breadcrumbs={[{ label: 'Student', href: '/student/dashboard' }, { label: 'Dashboard' }]}
        showSearch={false}
      />


      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
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
        <div className="lg:col-span-8 space-y-8">
          
          {/* Next Exam Countdown */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-blue-600">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">Up Next</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {nextExam ? nextExam.examTitle : 'No upcoming exams'}
                  </h3>
                  {nextExam && (
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> 
                      Starts on {new Date(nextExam.date).toLocaleDateString()} at {nextExam.startTime}
                    </p>
                  )}
                </div>
                {nextExam && (
                  <Link href="/student/upcoming-exams">
                    <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
                      View Details <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Exams Summary */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-bold">Upcoming Examinations</CardTitle>
              <Link href="/student/upcoming-exams" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingMappings.slice(0, 3).map((mapping) => (
                  <div key={mapping.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-blue-600">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{mapping.examTitle}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">EXAM</span>
                          <span>{new Date(mapping.date).toLocaleDateString()} • {mapping.startTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingMappings.length === 0 && (
                  <div className="p-4 text-sm text-slate-500">
                    No upcoming exams found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-bold">Recent Notifications</CardTitle>
              <Link href="/student/notifications" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {conversations.filter(c => c.lastMessage).slice(0, 3).map((conv) => (
                  <div key={conv.id} className="p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${conv.unreadCount > 0 ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">{conv.name || conv.participants.map(p => p.name).join(', ')}</h4>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">{conv.lastMessage?.text}</p>
                      <span className="text-xs text-slate-400 mt-2 block">{new Date(conv.lastMessage?.createdAt!).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {conversations.filter(c => c.lastMessage).length === 0 && (
                  <div className="p-4 text-sm text-slate-500">
                    No recent notifications.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar (30%) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Actions */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link href="/student/active-exams">
                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer group text-center h-full">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Start Exam</span>
                </div>
              </Link>
              <Link href="/student/system-check">
                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer group text-center h-full">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">System Check</span>
                </div>
              </Link>
              <Link href="#">
                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer group text-center h-full">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-full group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Instructions</span>
                </div>
              </Link>
              <Link href="/student/profile">
                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer group text-center h-full">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-full group-hover:scale-110 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">My Profile</span>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 border-b border-amber-100 dark:border-amber-900/50 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800 dark:text-amber-500">Important Updates</h3>
            </div>
            <CardContent className="p-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Mandatory System Check</h4>
                <p className="text-xs text-slate-500 mt-1">All candidates must complete the system check at least 24 hours before their scheduled exam.</p>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800"></div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Updated ID Policy</h4>
                <p className="text-xs text-slate-500 mt-1">Please ensure your college ID is clearly visible to the webcam during the verification process.</p>
              </div>
            </CardContent>
          </Card>

          {/* Exam Tips */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Pro Tip</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ensure you are in a quiet, well-lit room. Close all unauthorized background applications before starting the secure browser to avoid automatic violations.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
