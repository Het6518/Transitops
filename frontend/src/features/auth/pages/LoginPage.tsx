import { motion } from 'framer-motion';
import { Bus, Shield, Zap, BarChart3 } from 'lucide-react';
import { LoginForm } from '../components/LoginForm';

const features = [
  { icon: Bus, label: 'Fleet Management', desc: 'Real-time vehicle tracking' },
  { icon: Zap, label: 'Live Operations', desc: 'Instant dispatch & routing' },
  { icon: BarChart3, label: 'Analytics', desc: 'Data-driven insights' },
  { icon: Shield, label: 'Secure & Reliable', desc: 'Enterprise-grade security' },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: branding ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Animated glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-violet-500/15 rounded-full blur-3xl animate-pulse-slow delay-1000" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-glow">
              <Bus className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight">TransitOps</span>
              <div className="text-xs text-indigo-300/70 font-medium tracking-widest uppercase">
                Enterprise Platform
              </div>
            </div>
          </motion.div>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Smart Transport
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Operations Hub
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              Manage your entire transport ecosystem — fleet, routes, drivers, and
              analytics — in one powerful platform built for enterprise scale.
            </p>

            {/* Feature badges */}
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              {features.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3"
                >
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{label}</div>
                    <div className="text-slate-500 text-xs">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-slate-600 text-sm"
          >
            © {new Date().getFullYear()} TransitOps. Built for the Odoo Hackathon.
          </motion.div>
        </div>
      </div>

      {/* ── Right panel: login form ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Bus className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">TransitOps</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-1">Welcome back</h2>
            <p className="text-muted-foreground text-sm">
              Sign in to your TransitOps account
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="mb-6 p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Demo credentials:</span>
            <br />
            Admin: <code className="text-foreground">admin@transitops.com</code> /
            <code className="text-foreground"> Admin@123</code>
          </div>

          {/* Form */}
          <LoginForm />

          {/* Terms */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            By signing in you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
