import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { 
  Car, 
  Loader2, 
  Lock, 
  Mail, 
  Key, 
  Shield, 
  BarChart3, 
  Users, 
  Box, 
  ArrowRight, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';

// ==================================================
// Validation Schema
// ==================================================
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Lock scrolling and override body background on mount
  useEffect(() => {
    document.body.classList.add('overflow-hidden', 'h-screen', 'max-h-screen', 'bg-slate-950');
    document.documentElement.classList.add('overflow-hidden', 'h-screen', 'max-h-screen', 'bg-slate-950');

    return () => {
      document.body.classList.remove('overflow-hidden', 'h-screen', 'max-h-screen', 'bg-slate-950');
      document.documentElement.classList.remove('overflow-hidden', 'h-screen', 'max-h-screen', 'bg-slate-950');
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleQuickFill = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
    toast.info(`Filled credentials for ${email.split('@')[0]}`);
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      
      const response = await api.post('/auth/login', data);
      
      // Save token and set user in store
      localStorage.setItem('accessToken', response.data.data.accessToken);
      setUser(response.data.data.user);
      
      toast.success('Welcome back!', {
        description: `Logged in as ${response.data.data.user.name}`,
      });
      
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error('Authentication failed', {
        description: error.response?.data?.message || 'Invalid email or password',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-950 font-sans text-white relative overflow-hidden select-none">
      
      {/* 1. LEFT SIDE: Branded Marketing Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-slate-900/20 border-r border-white/5 relative overflow-hidden h-full">
        
        {/* Glow Effects */}
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-655/10 blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute -bottom-40 right-[-10%] h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[180px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        
        {/* Header Logo */}
        <div className="flex items-center gap-3.5 relative z-10 animate-fade-in">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/35 hover:scale-105 transition-transform duration-300">
            <Car className="h-6 w-6" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">AutoERP</span>
        </div>

        {/* Feature Highlights Grid */}
        <div className="max-w-2xl my-auto relative z-10 space-y-12 pr-6">
          <div className="space-y-5 animate-slide-in-left">
            <h2 className="text-5xl font-black text-white tracking-tight leading-tight">
              Workshop management,<br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                reimagined
              </span>
            </h2>
            <p className="text-base text-slate-400 leading-relaxed max-w-lg">
              Streamline your workshop operations with intelligent tracking, real-time analytics, and seamless coordination.
            </p>
          </div>

          {/* Wider feature cards grid */}
          <div className="grid grid-cols-2 gap-5 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="p-7 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md space-y-3 hover:bg-white/10 hover:border-white/10 hover:scale-[1.02] transition-all duration-300 group cursor-pointer shadow-sm min-h-[140px] flex flex-col justify-center">
              <div className="text-indigo-400 group-hover:scale-110 transition-transform duration-300"><BarChart3 className="w-6 h-6" /></div>
              <h4 className="text-sm font-bold text-white">Real-time Analytics</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Track inventory and sales performance with live insights</p>
            </div>
            
            <div className="p-7 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md space-y-3 hover:bg-white/10 hover:border-white/10 hover:scale-[1.02] transition-all duration-300 group cursor-pointer shadow-sm min-h-[140px] flex flex-col justify-center">
              <div className="text-indigo-400 group-hover:scale-110 transition-transform duration-300"><Users className="w-6 h-6" /></div>
              <h4 className="text-sm font-bold text-white">Team Collaboration</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Manage staff roles and access control permissions seamlessly</p>
            </div>

            <div className="p-7 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md space-y-3 hover:bg-white/10 hover:border-white/10 hover:scale-[1.02] transition-all duration-300 group cursor-pointer shadow-sm min-h-[140px] flex flex-col justify-center">
              <div className="text-indigo-400 group-hover:scale-110 transition-transform duration-300"><Shield className="w-6 h-6" /></div>
              <h4 className="text-sm font-bold text-white">Enterprise Security</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Bank-grade encryption protecting all checkout operations</p>
            </div>

            <div className="p-7 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md space-y-3 hover:bg-white/10 hover:border-white/10 hover:scale-[1.02] transition-all duration-300 group cursor-pointer shadow-sm min-h-[140px] flex flex-col justify-center">
              <div className="text-indigo-400 group-hover:scale-110 transition-transform duration-300"><Box className="w-6 h-6" /></div>
              <h4 className="text-sm font-bold text-white">Smart Inventory</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Automated low-stock warnings and compatible vehicle tracking</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-slate-500 relative z-10 animate-fade-in">
          <span>&copy; {new Date().getFullYear()} AutoERP</span>
          <span className="flex items-center gap-1.5 font-medium text-emerald-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </span>
        </div>
      </div>

      {/* 2. RIGHT SIDE: Clean Sign In Form */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-16 relative h-full overflow-hidden">
        
        {/* Top-Right Live Clock & Date */}
        <div className="absolute top-8 right-12 flex flex-col items-end select-none leading-none animate-fade-in">
          <span className="text-base font-black text-white tracking-wide">
            {currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
          </span>
          <span className="text-[10px] font-bold text-slate-500 mt-2">
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-[420px] space-y-8 animate-slide-in-right">
          
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-white tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-400">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Address */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 tracking-wide" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="block w-full rounded-xl border border-white/5 bg-white/5 py-3 px-4 text-white placeholder-slate-655 backdrop-blur-sm transition-all focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                placeholder="name@company.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 tracking-wide" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="block w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-4 pr-12 text-white placeholder-slate-655 backdrop-blur-sm transition-all focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-350"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Sign In Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-650 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="pt-2 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block text-center">
              Quick Test Sign In
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@cardecor.com', 'admin123')}
                className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg py-3 text-xs text-indigo-300 font-semibold transition-colors cursor-pointer"
              >
                <Key className="w-4.5 h-4.5" /> Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manager@cardecor.com', 'manager123')}
                className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg py-3 text-xs text-indigo-300 font-semibold transition-colors cursor-pointer"
              >
                <Key className="w-4.5 h-4.5" /> Manager
              </button>
            </div>
          </div>

          {/* Secure login divider */}
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <span className="relative bg-slate-950 px-3 text-[9px] uppercase font-bold tracking-wider text-slate-500">
              Secure login
            </span>
          </div>

          {/* Security details */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <Shield className="w-4 h-4" />
            <span>Protected by enterprise-grade security</span>
          </div>

        </div>
      </div>
    </div>
  );
}
