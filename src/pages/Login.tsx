import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Server,
  Lock,
  ArrowRight,
  Sparkles,
  Moon,
  Sun,
  Loader2,
  AlertCircle,
  Mail
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/auth/useAuthStore";
import { authService } from "@/services/api/authService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Assets
import heroImage from "@/assets/hero-dashboard.jpg";
import navLogo from "@/assets/logo.png";

interface LoginFormData {
  email: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get theme and auth state
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, _hasHydrated, setAuth, setLoading, setError } = useAuthStore();
  const from = location.state?.from?.pathname || '/dashboard';
  
  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Form state
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    console.log('Login redirect check:', {
      isAuthenticated,
      isLoading,
      hasFormDataEmail: !!formData.email,
      _hasHydrated,
      from,
      currentPath: window.location.pathname
    });
    
    // Only redirect if we're certain the user is authenticated
    // and we're not in the middle of a login attempt
    // and hydration is complete
    // and we're not already at the login page (prevent redirect loop)
    if (isAuthenticated && !isLoading && !formData.email && _hasHydrated && from !== '/login') {
      console.log('Already authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from, isLoading, formData.email, _hasHydrated]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setIsLoading(true);
  setErrorState(null);
  
  try {
    console.log('Sending login request with:', formData);
    const response = await authService.login(formData);
    console.log('Login response:', response);
    
    if (!response.data) {
      throw new Error('No data received in response');
    }

    const { user, accessToken, refreshToken } = response.data;
    const tokens = { accessToken, refreshToken };
    
    if (!user || !accessToken) {
      throw new Error('Invalid response format: missing user or access token');
    }

    console.log('Setting auth with:', { user, tokens });
    setAuth(user, tokens);
    
    toast({
      title: "Login successful",
      description: `Welcome back, ${user.fName || 'User'}!`,
    });
    
    navigate(from, { replace: true });
  } catch (error: any) {
    console.error('Login error details:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    
    const errorMessage = error.response?.data?.message || error.message || "Login failed";
    setErrorState(errorMessage);
    
    toast({
      title: "Login failed",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
    setIsLoading(false);
  }  
};

  return (
    <div className="min-h-screen bg-background relative">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full"
            onClick={toggleTheme}
          >
            <motion.div
              animate={{ rotate: theme === "dark" ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {theme === "dark" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </motion.div>
          </Button>
        </motion.div>
      </div>

      {/* Gradient background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-gold-gradient opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[40rem] h-[40rem] rounded-full bg-primary/30 opacity-10 blur-3xl" />
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Hero panel */}
        <div className="hidden lg:flex relative items-center justify-center p-12">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gold-gradient opacity-10" />
          <div className="relative max-w-xl space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center space-x-3 rounded-full px-4 py-2 glass-card">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Modern IT Services Platform
                </span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold text-foreground">
                Secure Access to
                <span className="block text-transparent bg-clip-text bg-gold-gradient">
                  Xrt-tech Admin
                </span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage users, plans, support, and analytics with
                enterprise-grade security and performance.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Shield, label: "Secure" },
                  { icon: Server, label: "Scalable" },
                  { icon: Lock, label: "SSO Ready" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="glass-card p-4 rounded-xl flex items-center space-x-3"
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-sm text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Auth form */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <Card className="w-full max-w-md glass-card">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex justify-center">
                <div className="p-1.5 bg-gradient-to-br from-primary/10 to-transparent rounded-xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_25px_-5px_rgba(0,0,0,0.3)]">
                  <img 
                    src={navLogo} 
                    alt="Xrt-tech" 
                    className="w-44 rounded-lg object-contain shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold text-foreground">
                  Welcome back
                </h2>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <p className="text-sm text-muted-foreground">
                  Sign in to manage your Xrt-tech dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="pl-10"
                      placeholder="you@xrt-tech.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  By continuing you agree to our Terms and Privacy Policy.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;