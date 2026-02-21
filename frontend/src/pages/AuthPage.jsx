import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Zap, ArrowRight, Truck, Route, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import { useToast } from '../components/ui/Toast.jsx';

const roleOptions = [
  { value: 'manager', label: 'Fleet Manager' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'safety_officer', label: 'Safety Officer' },
  { value: 'analyst', label: 'Analyst' },
];

const features = [
  { icon: Truck, title: 'Vehicle Tracking', desc: 'Real-time fleet monitoring and driver management' },
  { icon: Route, title: 'Trip Management', desc: 'Intelligent trip lifecycle from dispatch to delivery' },
  { icon: BarChart3, title: 'Analytics & Reports', desc: 'Advanced expense and maintenance insights' },
];

// Floating dot animation component
function FloatingDot({ delay, size, x, y }) {
  return (
    <motion.div
      className="absolute rounded-full bg-brand-400/20"
      style={{ width: size, height: size, left: x, top: y }}
      animate={{
        y: [0, -20, 0],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'manager' });
  const [errors, setErrors] = useState({});
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear field error on change
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!isLogin && !form.name.trim()) newErrors.name = 'Full name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Enter a valid email address';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors below');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password });
        toast.success('Welcome back!', { title: 'Signed In' });
        navigate('/');
      } else {
        await register(form);
        toast.success('Please check your email to verify your account.', { title: 'Account Created' });
        setIsLogin(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        {/* Floating dots */}
        <FloatingDot delay={0} size={8} x="15%" y="25%" />
        <FloatingDot delay={1} size={12} x="75%" y="20%" />
        <FloatingDot delay={2} size={6} x="60%" y="65%" />
        <FloatingDot delay={0.5} size={10} x="30%" y="75%" />
        <FloatingDot delay={1.5} size={8} x="85%" y="45%" />
        <FloatingDot delay={2.5} size={14} x="20%" y="50%" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <motion.div
                className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 10, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Zap className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold text-white">FleetFlow</h1>
            </div>
            <p className="text-xl text-white/80 leading-relaxed max-w-md mb-12">
              Modular Fleet & Logistics Management System built for speed, clarity, and control.
            </p>

            {/* Feature cards */}
            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.2, duration: 0.5 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-white/20">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                    <p className="text-xs text-white/60 mt-0.5">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">FleetFlow</span>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login-header' : 'register-header'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-surface-900">
                  {isLogin ? 'Welcome back' : 'Create an account'}
                </h2>
                <p className="text-surface-500 mt-1.5">
                  {isLogin
                    ? 'Sign in to access your fleet dashboard'
                    : 'Get started with your fleet management'}
                </p>
                {isLogin && (
                  <p className="text-xs text-surface-400 mt-2 bg-surface-100 rounded-lg px-3 py-2">
                    🚛 <strong>Drivers:</strong> Your login credentials are provided by your fleet manager when they add you to the system.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-surface-200 p-8">
            {/* Tab Toggle */}
            <div className="flex bg-surface-100 rounded-xl p-1 mb-8">
              {['Sign In', 'Sign Up'].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => { setIsLogin(i === 0); setErrors({}); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer relative
                    ${(i === 0 ? isLogin : !isLogin)
                      ? 'text-surface-900'
                      : 'text-surface-500 hover:text-surface-700'
                    }`}
                >
                  {(i === 0 ? isLogin : !isLogin) && (
                    <motion.div
                      layoutId="auth-tab"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      name="name"
                      label="Full Name"
                      placeholder="John Doe"
                      icon={User}
                      value={form.name}
                      onChange={handleChange}
                      error={errors.name}
                    />
                  </motion.div>
                )}
                <Input
                  name="email"
                  type="email"
                  label="Email Address"
                  placeholder="you@company.com"
                  icon={Mail}
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                />
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="••••••••"
                    icon={Lock}
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-surface-400 hover:text-surface-700 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Select
                      name="role"
                      label="Role"
                      options={roleOptions}
                      value={form.role}
                      onChange={handleChange}
                    />
                  </motion.div>
                )}

                <Button
                  type="submit"
                  loading={loading}
                  iconRight={ArrowRight}
                  className="w-full"
                  size="lg"
                >
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Button>
              </motion.form>
            </AnimatePresence>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-xs text-surface-400">OR</span>
              </div>
            </div>

            {/* Google sign-in */}
            <button
              onClick={() => window.location.href = 'http://localhost:5000/api/v1/auth/google'}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-surface-200 
                         text-surface-700 text-sm font-medium hover:bg-surface-50 hover:border-surface-300 
                         transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-surface-400 mt-6">
            By continuing, you agree to FleetFlow's Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
