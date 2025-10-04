import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  Settings, 
  User, 
  Lock, 
  Bell, 
  Building, 
  Calendar, 
  Shield, 
  Save,
  Info,
  RefreshCw,
  Bot,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

// Profile settings schema
const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

// Password settings schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string().min(8, { message: 'Please confirm your password' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Notification settings schema
const notificationFormSchema = z.object({
  documentUpdates: z.boolean(),
  documentSignatures: z.boolean(),
  complianceDeadlines: z.boolean(),
  systemAnnouncements: z.boolean(),
  emailNotifications: z.boolean(),
});

// Company settings schema
const companyFormSchema = z.object({
  companyName: z.string().min(2, { message: 'Company name is required' }),
  industry: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
});

// AI assistant settings schema
const aiSettingsFormSchema = z.object({
  enableAIAssistant: z.boolean(),
  useCompanyData: z.boolean(),
  suggestImprovements: z.boolean(),
  checkCompliance: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type CompanyFormValues = z.infer<typeof companyFormSchema>;
type AISettingsFormValues = z.infer<typeof aiSettingsFormSchema>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();
  const { toast } = useToast();

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      documentUpdates: true,
      documentSignatures: true,
      complianceDeadlines: true,
      systemAnnouncements: false,
      emailNotifications: true,
    },
  });

  // Company form
  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      companyName: 'Your Company Name',
      industry: '',
      address: '',
      phone: '',
      website: '',
    },
  });

  // AI settings form
  const aiSettingsForm = useForm<AISettingsFormValues>({
    resolver: zodResolver(aiSettingsFormSchema),
    defaultValues: {
      enableAIAssistant: true,
      useCompanyData: true,
      suggestImprovements: true,
      checkCompliance: true,
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!user) throw new Error('Not authenticated');
      return await apiRequest('PUT', `/api/users/${user.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      if (!user) throw new Error('Not authenticated');
      return await apiRequest('POST', '/api/user/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Password change failed',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    },
  });

  // Update notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      if (!user) throw new Error('Not authenticated');
      return await apiRequest('PUT', '/api/user/notifications', data);
    },
    onSuccess: () => {
      toast({
        title: 'Notification settings updated',
        description: 'Your notification preferences have been saved',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update notification settings',
        variant: 'destructive',
      });
    },
  });

  // Update company settings mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormValues) => {
      return await apiRequest('PUT', '/api/settings/company', data);
    },
    onSuccess: () => {
      toast({
        title: 'Company settings updated',
        description: 'Company information has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update company settings',
        variant: 'destructive',
      });
    },
  });

  // Update AI settings mutation
  const updateAISettingsMutation = useMutation({
    mutationFn: async (data: AISettingsFormValues) => {
      return await apiRequest('PUT', '/api/settings/ai', data);
    },
    onSuccess: () => {
      toast({
        title: 'AI settings updated',
        description: 'AI assistant settings have been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update AI settings',
        variant: 'destructive',
      });
    },
  });

  // Sign out from all devices mutation
  const signOutAllMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/user/signout-all');
    },
    onSuccess: () => {
      toast({
        title: 'Signed out successfully',
        description: 'You have been signed out from all devices',
      });
      // Optionally redirect to login page
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: 'Sign out failed',
        description: error.message || 'Failed to sign out from all devices',
        variant: 'destructive',
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate(data);
  };

  const onNotificationsSubmit = (data: NotificationFormValues) => {
    updateNotificationsMutation.mutate(data);
  };

  const onCompanySubmit = (data: CompanyFormValues) => {
    updateCompanyMutation.mutate(data);
  };

  const onAISettingsSubmit = (data: AISettingsFormValues) => {
    updateAISettingsMutation.mutate(data);
  };

  const handleSignOutAll = () => {
    if (window.confirm('Are you sure you want to sign out from all devices? This will end all your active sessions.')) {
      signOutAllMutation.mutate();
    }
  };

  return (
    <DashboardLayout pageTitle="Settings">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500">Manage your account and application preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center">
            <Bot className="h-4 w-4 mr-2" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Username</FormLabel>
                    <Input value={user?.username || ''} disabled className="bg-slate-50" />
                    <p className="text-sm text-slate-500 mt-1">
                      Username cannot be changed
                    </p>
                  </div>

                  <div>
                    <FormLabel>Role</FormLabel>
                    <div className="mt-1">
                      <Badge className={
                        user?.role === 'admin' ? 'bg-primary-100 text-primary-800' :
                        user?.role === 'compliance_officer' ? 'bg-warning-100 text-warning-800' : 
                        'bg-slate-100 text-slate-800'
                      }>
                        {user?.role === 'admin' ? 'Administrator' : 
                         user?.role === 'compliance_officer' ? 'Compliance Officer' : 'Employee'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Contact an administrator to change your role
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="mt-4"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Password must be at least 8 characters long
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="mt-4"
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Change Password
                  </Button>
                </form>
              </Form>

              <Separator className="my-8" />

              <div>
                <h3 className="text-lg font-medium mb-4">Login Sessions</h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-md bg-slate-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Current Session</h4>
                        <p className="text-sm text-slate-500 mt-1">
                          Last activity: Just now
                        </p>
                        <p className="text-sm text-slate-500">
                          IP Address: 192.168.1.1
                        </p>
                      </div>
                      <Badge className="bg-success-100 text-success-800">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={handleSignOutAll}
                  disabled={signOutAllMutation.isPending}
                >
                  {signOutAllMutation.isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Sign Out From All Devices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-base font-medium">Notification Types</h3>
                    
                    <FormField
                      control={notificationForm.control}
                      name="documentUpdates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Document Updates</FormLabel>
                            <FormDescription>
                              Receive notifications when documents are created or updated
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="documentSignatures"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Signature Requests</FormLabel>
                            <FormDescription>
                              Get notified when a document requires your signature
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="complianceDeadlines"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Compliance Deadlines</FormLabel>
                            <FormDescription>
                              Receive reminders about upcoming compliance deadlines
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="systemAnnouncements"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">System Announcements</FormLabel>
                            <FormDescription>
                              Receive updates about system changes and new features
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-base font-medium">Delivery Methods</h3>
                    
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Notifications</FormLabel>
                            <FormDescription>
                              Receive notifications via email in addition to in-app alerts
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="mt-4"
                    disabled={updateNotificationsMutation.isPending}
                  >
                    {updateNotificationsMutation.isPending ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Notification Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Settings */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Company Settings
              </CardTitle>
              <CardDescription>
                Manage your company information used in compliance documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...companyForm}>
                <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-6">
                  <FormField
                    control={companyForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be used in all documents generated by the system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={companyForm.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Healthcare, Finance, Technology" />
                        </FormControl>
                        <FormDescription>
                          Used for AI-assisted compliance recommendations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={companyForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Address</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter your company's full address"
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. +1 (555) 123-4567" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companyForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. https://example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {(user?.role === 'admin' || user?.role === 'compliance_officer') ? (
                    <Button 
                      type="submit" 
                      className="mt-4"
                      disabled={updateCompanyMutation.isPending}
                    >
                      {updateCompanyMutation.isPending ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Company Settings
                    </Button>
                  ) : (
                    <div className="mt-4 p-3 bg-slate-50 rounded-md flex items-start">
                      <Info className="h-5 w-5 text-slate-400 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-600">
                        You need administrator or compliance officer privileges to change company settings.
                        Contact your administrator if you need to update this information.
                      </p>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Assistant Settings */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="h-5 w-5 mr-2" />
                AI Assistant Settings
              </CardTitle>
              <CardDescription>
                Configure how the AI compliance assistant works for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...aiSettingsForm}>
                <form onSubmit={aiSettingsForm.handleSubmit(onAISettingsSubmit)} className="space-y-6">
                  <FormField
                    control={aiSettingsForm.control}
                    name="enableAIAssistant"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable AI Assistant</FormLabel>
                          <FormDescription>
                            Use AI to help with compliance document creation and management
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="pl-4 border-l-2 border-slate-200 space-y-4">
                    <FormField
                      control={aiSettingsForm.control}
                      name="useCompanyData"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Use Company Data</FormLabel>
                            <FormDescription>
                              Allow AI to use your company information to personalize documents
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!aiSettingsForm.watch("enableAIAssistant")}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={aiSettingsForm.control}
                      name="suggestImprovements"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Suggest Improvements</FormLabel>
                            <FormDescription>
                              Have AI suggest improvements for your compliance documents
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!aiSettingsForm.watch("enableAIAssistant")}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={aiSettingsForm.control}
                      name="checkCompliance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Check Compliance</FormLabel>
                            <FormDescription>
                              Automatically check documents for compliance issues
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!aiSettingsForm.watch("enableAIAssistant")}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="p-4 border rounded-md bg-slate-50 flex items-start">
                    <Info className="h-5 w-5 text-slate-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-600">
                      <p className="mb-2">AI processing is performed securely and in compliance with data protection regulations.</p>
                      <p>All information is encrypted during processing and not retained beyond the necessary period.</p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="mt-4"
                    disabled={updateAISettingsMutation.isPending}
                  >
                    {updateAISettingsMutation.isPending ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save AI Settings
                  </Button>
                </form>
              </Form>

              <Separator className="my-8" />

              <div>
                <h3 className="text-lg font-medium mb-4">AI System Status</h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-md bg-slate-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-success-500 mr-1" />
                          <h4 className="font-medium">AI Assistant</h4>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          AI system is operational
                        </p>
                      </div>
                      <Badge className="bg-success-100 text-success-800">
                        Online
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-md bg-slate-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-success-500 mr-1" />
                          <h4 className="font-medium">Compliance Models</h4>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          Last updated: 2 days ago
                        </p>
                      </div>
                      <Badge className="bg-success-100 text-success-800">
                        Up to Date
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
