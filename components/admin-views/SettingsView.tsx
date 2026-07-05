'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings as SettingsIcon, Shield, Bell, HardDrive, Palette, FileText, Save, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface SettingsViewProps {
  role: 'admin' | 'super-admin';
}

export function SettingsView({ role }: SettingsViewProps) {
  const isSuperAdmin = role === 'super-admin';

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader 
        title="System Settings" 
        description="Manage application preferences, rules, and system configurations."
        breadcrumbs={[
          { label: isSuperAdmin ? 'Super Admin' : 'Admin', href: `/${role}/dashboard` },
          { label: 'Settings' }
        ]}
        showSearch={false}
        actions={
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Tabs defaultValue="general" orientation="vertical" className="col-span-12 flex flex-col md:flex-row gap-6">
          
          {/* Vertical Tabs List */}
          <div className="md:w-64 shrink-0">
            <TabsList className="flex flex-col h-auto bg-transparent space-y-1">
              <TabsTrigger value="general" className="justify-start px-4 py-2.5 w-full data-[selected]:bg-white dark:data-[selected]:bg-slate-900 data-[selected]:shadow-sm">
                <SettingsIcon className="w-4 h-4 mr-2" /> General
              </TabsTrigger>
              <TabsTrigger value="exam-rules" className="justify-start px-4 py-2.5 w-full data-[selected]:bg-white dark:data-[selected]:bg-slate-900 data-[selected]:shadow-sm">
                <FileText className="w-4 h-4 mr-2" /> Exam Rules
              </TabsTrigger>
              <TabsTrigger value="theme" className="justify-start px-4 py-2.5 w-full data-[selected]:bg-white dark:data-[selected]:bg-slate-900 data-[selected]:shadow-sm">
                <Palette className="w-4 h-4 mr-2" /> Theme
              </TabsTrigger>
              <TabsTrigger value="notifications" className="justify-start px-4 py-2.5 w-full data-[selected]:bg-white dark:data-[selected]:bg-slate-900 data-[selected]:shadow-sm">
                <Bell className="w-4 h-4 mr-2" /> Notifications
              </TabsTrigger>
              
              {isSuperAdmin && (
                <>
                  <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Super Admin</div>
                  <TabsTrigger value="security" className="justify-start px-4 py-2.5 w-full data-[selected]:bg-white dark:data-[selected]:bg-slate-900 data-[selected]:shadow-sm text-amber-600 dark:text-amber-500">
                    <Shield className="w-4 h-4 mr-2" /> Security
                  </TabsTrigger>
                  <TabsTrigger value="backup" className="justify-start px-4 py-2.5 w-full data-[selected]:bg-white dark:data-[selected]:bg-slate-900 data-[selected]:shadow-sm text-purple-600 dark:text-purple-500">
                    <HardDrive className="w-4 h-4 mr-2" /> Backup & Recovery
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          {/* Tab Contents */}
          <div className="flex-1">
            
            {/* General Settings */}
            <TabsContent value="general" className="mt-0 outline-none">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle>General Information</CardTitle>
                  <CardDescription>Update basic platform information and localization.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-2">
                    <Label htmlFor="platform-name">Platform Name</Label>
                    <Input id="platform-name" defaultValue="Enterprise Assessment" className="max-w-md bg-slate-50 dark:bg-slate-900/50" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input id="support-email" defaultValue="support@enterprise.edu" className="max-w-md bg-slate-50 dark:bg-slate-900/50" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="timezone">Default Timezone</Label>
                    <select id="timezone" className="max-w-md flex h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-900/50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300">
                      <option>UTC (Coordinated Universal Time)</option>
                      <option>EST (Eastern Standard Time)</option>
                      <option>PST (Pacific Standard Time)</option>
                    </select>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-4" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Exam Rules */}
            <TabsContent value="exam-rules" className="mt-0 outline-none">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle>Global Exam Rules</CardTitle>
                  <CardDescription>Configure default rules applied to all new examinations.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Strict Fullscreen Mode</Label>
                      <p className="text-sm text-slate-500">Automatically submit exam if fullscreen is exited 3 times.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Disable Copy/Paste</Label>
                      <p className="text-sm text-slate-500">Prevent clipboard operations during active exams.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Require Camera/Microphone</Label>
                      <p className="text-sm text-slate-500">Mandatory hardware check before starting an exam.</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="grid gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Label htmlFor="grace-period">Grace Period (Minutes)</Label>
                    <Input id="grace-period" type="number" defaultValue="5" className="max-w-[150px] bg-slate-50 dark:bg-slate-900/50" />
                    <p className="text-xs text-slate-500">Time allowed after exam deadline before auto-submission.</p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-4" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Rules</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Theme Settings */}
            <TabsContent value="theme" className="mt-0 outline-none">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize the visual style of the platform.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <Label>Interface Theme</Label>
                    <div className="grid grid-cols-3 gap-4 max-w-md">
                      <div className="border-2 border-blue-600 rounded-lg p-2 cursor-pointer">
                        <div className="bg-slate-100 h-20 rounded mb-2"></div>
                        <p className="text-center text-sm font-medium">Light</p>
                      </div>
                      <div className="border-2 border-transparent hover:border-slate-200 rounded-lg p-2 cursor-pointer">
                        <div className="bg-slate-950 h-20 rounded mb-2"></div>
                        <p className="text-center text-sm font-medium">Dark</p>
                      </div>
                      <div className="border-2 border-transparent hover:border-slate-200 rounded-lg p-2 cursor-pointer flex flex-col">
                        <div className="flex-1 rounded mb-2 overflow-hidden flex">
                          <div className="bg-slate-100 flex-1"></div>
                          <div className="bg-slate-950 flex-1"></div>
                        </div>
                        <p className="text-center text-sm font-medium">System</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Label>Primary Brand Color</Label>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 ring-2 ring-blue-600 ring-offset-2 cursor-pointer"></div>
                      <div className="w-8 h-8 rounded-full bg-emerald-600 cursor-pointer"></div>
                      <div className="w-8 h-8 rounded-full bg-purple-600 cursor-pointer"></div>
                      <div className="w-8 h-8 rounded-full bg-slate-900 cursor-pointer"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="mt-0 outline-none">
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Control how and when alerts are delivered.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-slate-500">Receive daily summaries via email.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">System Alerts</Label>
                      <p className="text-sm text-slate-500">In-app popups for critical events.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Exam Submissions</Label>
                      <p className="text-sm text-slate-500">Notify when an exam is fully submitted by a batch.</p>
                    </div>
                    <Switch />
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-4" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Preferences</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security (Super Admin Only) */}
            {isSuperAdmin && (
              <TabsContent value="security" className="mt-0 outline-none">
                <Card className="border-amber-200 dark:border-amber-900/50 shadow-sm">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-t-lg">
                    <CardTitle className="text-amber-800 dark:text-amber-500 flex items-center gap-2">
                      <Shield className="w-5 h-5" /> Security & Access Control
                    </CardTitle>
                    <CardDescription>Manage strict platform security parameters.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Enforce 2FA</Label>
                        <p className="text-sm text-slate-500">Require Two-Factor Authentication for all Admin accounts.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">IP Whitelisting</Label>
                        <p className="text-sm text-slate-500">Restrict admin access to specific IP ranges.</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="grid gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Label htmlFor="session-timeout">Session Timeout (Minutes)</Label>
                      <Input id="session-timeout" type="number" defaultValue="30" className="max-w-[150px] bg-slate-50 dark:bg-slate-900/50" />
                    </div>
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white mt-4" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Update Security Policy</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Backup (Super Admin Only) */}
            {isSuperAdmin && (
              <TabsContent value="backup" className="mt-0 outline-none">
                <Card className="border-purple-200 dark:border-purple-900/50 shadow-sm">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-t-lg">
                    <CardTitle className="text-purple-800 dark:text-purple-400 flex items-center gap-2">
                      <HardDrive className="w-5 h-5" /> System Backups
                    </CardTitle>
                    <CardDescription>Configure automated database and file backups.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">Last Backup</h4>
                        <p className="text-sm text-slate-500 mt-1">Today at 02:00 AM (1.2 GB)</p>
                      </div>
                      <Button variant="outline" className="shrink-0"><Download className="mr-2 h-4 w-4" /> Download Latest</Button>
                    </div>
                    
                    <div className="space-y-4 pt-2">
                      <div className="grid gap-2">
                        <Label>Automated Backup Frequency</Label>
                        <select className="max-w-md flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300">
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Include Media Files</Label>
                          <p className="text-sm text-slate-500">Backup student uploads and generated PDFs.</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white mt-4">Run Manual Backup Now</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

          </div>
        </Tabs>
      </div>
    </div>
  );
}
