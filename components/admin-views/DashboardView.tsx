'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, GraduationCap, ClipboardCheck, Activity, Database, CalendarIcon, BarChart2, Bell, CheckCircle2, Clock, CalendarDays, CheckSquare, ShieldCheck, Cpu } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { useAdminStore } from '@/store/adminStore';
import { useSuperAdminStore } from '@/store/superAdminStore';
import { api } from '@/lib/api';

interface DashboardViewProps {
  role: 'admin' | 'super-admin';
}

interface ActivityItem {
  title: string;
  desc: string;
  time: string;
  type: 'create' | 'publish' | 'user' | 'alert';
}

interface OverviewData {
  examTrends: { name: string; created: number; completed: number }[];
  examStatusDistribution: { name: string; value: number; color: string }[];
  studentGrowth: { name: string; active: number; new: number }[];
  recentActivity: ActivityItem[];
  upcomingExams: { name: string; time: string; enrolled: number }[];
  pendingTasks: { task: string; status: string }[];
}

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

export function DashboardView({ role }: DashboardViewProps) {
  const isSuperAdmin = role === 'super-admin';
  const { students, exams, questions, results, fetchStudents, fetchExams, fetchQuestions, fetchResults } = useAdminStore();
  const { admins, fetchAdmins } = useSuperAdminStore();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  useEffect(() => {
    fetchStudents();
    fetchExams();
    fetchQuestions();
    fetchResults();
    if (isSuperAdmin) fetchAdmins();
  }, [fetchStudents, fetchExams, fetchQuestions, fetchResults, fetchAdmins, isSuperAdmin]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingOverview(true);
    api.get('/dashboard/overview')
      .then(({ data }) => { if (!cancelled) setOverview(data); })
      .finally(() => { if (!cancelled) setIsLoadingOverview(false); });
    return () => { cancelled = true; };
  }, []);

  // Shared stats
  const stats = [
    ...(isSuperAdmin ? [{ title: 'Total Admins', value: admins.length.toString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' }] : []),
    { title: 'Total Students', value: students.length.toLocaleString(), icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Total Exams', value: exams.length.toLocaleString(), icon: ClipboardCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Active Exams', value: exams.filter(e => e.status === 'Active').length.toString(), icon: Activity, color: 'text-pink-600', bg: 'bg-pink-100' },
    { title: 'Question Bank', value: questions.length.toLocaleString(), icon: Database, color: 'text-orange-600', bg: 'bg-orange-100' },
    { title: 'Scheduled Exams', value: exams.filter(e => e.status === 'Scheduled').length.toString(), icon: CalendarIcon, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Published Results', value: results.length.toLocaleString(), icon: BarChart2, color: 'text-teal-600', bg: 'bg-teal-100' },
  ];

  const examTrends = overview?.examTrends || [];
  const examStatusData = overview?.examStatusDistribution || [];
  const studentGrowthData = overview?.studentGrowth || [];
  const recentActivity = overview?.recentActivity || [];
  const upcomingExams = overview?.upcomingExams || [];
  const pendingTasks = overview?.pendingTasks || [];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={`${isSuperAdmin ? 'Super ' : ''}Admin Dashboard`}
        description="Platform overview, system health metrics, and quick insights."
        breadcrumbs={[
          { label: isSuperAdmin ? 'Super Admin' : 'Admin', href: `/${isSuperAdmin ? 'super-admin' : 'admin'}/dashboard` },
          { label: 'Dashboard' }
        ]}
        showSearch={false}
      />



      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Exams Created Area Chart */}
        <div className="lg:col-span-8">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold">System Overview: Exams Trends</CardTitle>
              <CardDescription>Monthly creation and completion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {isLoadingOverview ? (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">Loading...</div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={examTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} allowDecimals={false} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Area type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCreated)" name="Exams Created" />
                    <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" name="Exams Completed" />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam Status Distribution Pie Chart */}
        <div className="lg:col-span-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Exam Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="h-[250px] w-full">
                {isLoadingOverview ? (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">Loading...</div>
                ) : examStatusData.every(d => d.value === 0) ? (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">No exams yet</div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={examStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {examStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Growth Bar Chart */}
        <div className="lg:col-span-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Student Growth</CardTitle>
              <CardDescription>Registrations by quarter, this year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                {isLoadingOverview ? (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">Loading...</div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentGrowthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Bar dataKey="new" fill="#60a5fa" name="New Registrations" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="active" fill="#3b82f6" name="Total Students (cumulative)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Timeline */}
        <div className="lg:col-span-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Recent Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOverview ? (
                <div className="text-slate-400 text-sm">Loading...</div>
              ) : recentActivity.length === 0 ? (
                <div className="text-slate-400 text-sm">No recent activity yet.</div>
              ) : (
              <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 space-y-6">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="pl-6 relative">
                    <div className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 ${
                      activity.type === 'create' ? 'bg-blue-500' :
                      activity.type === 'publish' ? 'bg-emerald-500' :
                      activity.type === 'alert' ? 'bg-amber-500' : 'bg-purple-500'
                    }`} />
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{activity.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{activity.desc}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">{timeAgo(activity.time)}</span>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Exams & Pending Tasks */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Upcoming Exams */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-500" /> Upcoming Exams
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingOverview ? (
                <div className="p-4 text-slate-400 text-sm">Loading...</div>
              ) : upcomingExams.length === 0 ? (
                <div className="p-4 text-slate-400 text-sm">No upcoming exams scheduled.</div>
              ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingExams.map((exam, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{exam.name}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(exam.time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{exam.enrolled} Students</span>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-500" /> Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingOverview ? (
                <div className="text-slate-400 text-sm">Loading...</div>
              ) : pendingTasks.length === 0 ? (
                <div className="text-slate-400 text-sm">Nothing pending — all caught up.</div>
              ) : (
                pendingTasks.map((t, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-4 h-4 rounded border border-slate-300 dark:border-slate-700 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.task}</p>
                      <span className={`text-[10px] font-semibold tracking-wider uppercase ${t.status === 'High Priority' ? 'text-red-500' : t.status === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>{t.status}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
