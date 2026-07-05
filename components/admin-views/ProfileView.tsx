'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Shield, Clock, MonitorSmartphone, Mail, Phone, Settings, Save, Upload, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

interface ProfileViewProps {
  role: 'admin' | 'super-admin';
}

export function ProfileView({ role }: ProfileViewProps) {
  const isSuperAdmin = role === 'super-admin';
  const roleTitle = isSuperAdmin ? 'Super Administrator' : 'Administrator';
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayAvatar = avatarPreview || user?.avatar;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      toast.success('Avatar updated successfully');
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSave = () => {
    toast.success('Profile updated successfully');
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader 
        title="My Profile" 
        description="Manage your account settings, security, and preferences."
        breadcrumbs={[
          { label: isSuperAdmin ? 'Super Admin' : 'Admin', href: `/${role}/dashboard` },
          { label: 'Profile' }
        ]}
        showSearch={false}
        actions={
          isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="w-4 h-4 mr-2" /> Save Profile
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          )
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>
            <CardContent className="p-6 relative pt-0">
              <div className="absolute -top-12 left-6 border-4 border-white dark:border-slate-950 rounded-full bg-slate-100 dark:bg-slate-800 h-24 w-24 flex items-center justify-center shadow-sm">
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-slate-400" />
                  )}
                </div>
                <button onClick={triggerUpload} className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-10 cursor-pointer">
                  <Upload className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                />
              </div>
              
              <div className="pt-14 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{user?.name || 'User Profile'}</h2>
                <p className="text-sm text-slate-500 mt-1">{roleTitle}</p>
                <div className="mt-4 flex gap-2">
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none dark:bg-blue-900/30 dark:text-blue-400">
                    ID: {user?.id?.slice(0, 8).toUpperCase() || 'N/A'}
                  </Badge>
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:bg-emerald-900/10">Active Status</Badge>
                </div>
              </div>
              
              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{user?.phone || 'Not Provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Role: {user?.role || roleTitle}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="w-full justify-start border-b border-slate-200 dark:border-slate-800 rounded-none bg-transparent h-auto p-0 space-x-6">
              <TabsTrigger value="personal" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3">
                Personal Details
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3">
                Security
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3">
                Activity Log
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="personal" className="mt-0 outline-none space-y-6">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle>Edit Information</CardTitle>
                    <CardDescription>Update your personal and contact details.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="full-name">Full Name</Label>
                        <Input id="full-name" defaultValue={user?.name || ''} className="bg-slate-50 dark:bg-slate-900/50" />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" defaultValue={user?.email || ''} readOnly className="bg-slate-100 dark:bg-slate-900 cursor-not-allowed" />
                      </div>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-4" onClick={() => toast.success('Profile updated successfully')}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="mt-0 outline-none space-y-6">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2 max-w-md">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" className="bg-slate-50 dark:bg-slate-900/50" />
                    </div>
                    <div className="space-y-2 max-w-md">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" className="bg-slate-50 dark:bg-slate-900/50" />
                    </div>
                    <div className="space-y-2 max-w-md">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input id="confirm-password" type="password" className="bg-slate-50 dark:bg-slate-900/50" />
                    </div>
                    <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 mt-4">Update Password</Button>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Two-Factor Authentication
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">Secure Your Account</h4>
                      <p className="text-sm text-slate-500 mt-1 max-w-md">Add an extra layer of security to your account. Once enabled, you&apos;ll be prompted to enter a code from an authenticator app.</p>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-0 outline-none space-y-6">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <CardTitle>Recent Sessions</CardTitle>
                    <CardDescription>Review active sessions across your devices.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      <div className="p-6 flex items-start gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 rounded-lg shrink-0">
                          <MonitorSmartphone className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Current Session</h4>
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2 py-0">Current</Badge>
                          </div>
                          <p suppressHydrationWarning className="text-sm text-slate-500 mt-1">Logged in: {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Just now'}</p>
                          <p className="text-xs text-slate-400 mt-1">Active right now</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
