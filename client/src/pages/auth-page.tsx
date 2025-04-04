import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>('login');
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Authentication Forms */}
      <div className="w-full md:w-1/2 p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-2">
              <div className="h-10 w-10 rounded-md bg-primary-600 flex items-center justify-center mr-2">
                <CheckCircle className="text-white" size={24} />
              </div>
              <h1 className="text-2xl font-bold">ComplianceAI</h1>
            </div>
            <p className="text-slate-600 max-w-sm">
              Streamline your regulatory compliance with AI-powered document management
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="w-full md:w-1/2 bg-slate-800 text-white p-8 hidden md:flex flex-col justify-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-bold mb-6">Simplify Compliance Management</h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center mr-4 mt-1">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Intelligent Document Creation</h3>
                <p className="text-slate-300">
                  Generate compliance documents using AI with customizable templates
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center mr-4 mt-1">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Secure Digital Signatures</h3>
                <p className="text-slate-300">
                  Sign and verify documents with built-in digital signature system
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center mr-4 mt-1">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Comprehensive Audit Trails</h3>
                <p className="text-slate-300">
                  Maintain complete chain of custody for all compliance documents
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center mr-4 mt-1">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Automated Compliance Alerts</h3>
                <p className="text-slate-300">
                  Stay on top of deadlines with intelligent reminders and notifications
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
