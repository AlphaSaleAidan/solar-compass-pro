import { useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  Zap, Shield, TrendingUp, Users, CheckCircle, ArrowRight,
  Sun, BarChart3, FileText, Phone, Star, ChevronDown,
  Building2, Handshake, Clock, DollarSign, Eye, Lock,
  Activity, Percent, ArrowUpRight
} from 'lucide-react';
import CinematicBackground from '@/components/landing/CinematicBackground';

/* ─── Smooth scroll helper ────────────────────────────────────────────── */
const scrollTo = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* ─── Section reveal animation ────────────────────────────────────────── */
const RevealSection = ({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Staggered children reveal ───────────────────────────────────────── */
const StaggerReveal = ({ children, className = '', staggerDelay = 0.08, baseDelay = 0 }: {
  children: React.ReactNode; className?: string; staggerDelay?: number; baseDelay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay, delayChildren: baseDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const staggerChild = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── Glass card component ────────────────────────────────────────────── */
const GlassCard = ({ children, className = '', hover = true }: {
  children: React.ReactNode; className?: string; hover?: boolean;
}) => (
  <motion.div
    className={`relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm ${hover ? 'hover:border-white/[0.12] hover:bg-white/[0.04]' : ''} transition-all duration-500 ${className}`}
    whileHover={hover ? { y: -4, transition: { duration: 0.3 } } : {}}
  >
    {children}
  </motion.div>
);

/* ─── Milestone Data ──────────────────────────────────────────────────── */
const milestones = [
  { id: 'M1', name: 'SOW Confirmed', pct: '15%', icon: FileText, desc: 'Statement of Work locked — installer and financier aligned.' },
  { id: 'M2', name: 'Permit + Materials', pct: '20%', icon: Shield, desc: 'Permits filed, materials ordered — project in motion.' },
  { id: 'M3', name: 'Install Scheduled', pct: '15%', icon: Clock, desc: 'Installation date confirmed with homeowner and crew.' },
  { id: 'M4', name: 'Install Complete', pct: '20%', icon: Sun, desc: 'Panels on the roof, system physically installed.' },
  { id: 'M5', name: 'Utility Inspection', pct: '20%', icon: Eye, desc: 'City/utility inspection passed — system code-compliant.' },
  { id: 'M6', name: 'PTO Granted', pct: '10%', icon: Zap, desc: 'Permission to Operate — system live and generating.' },
];

/* ─── Stats ───────────────────────────────────────────────────────────── */
const stats = [
  { label: 'Milestone Gates', value: '7', suffix: '', icon: TrendingUp },
  { label: 'Risk Mitigation', value: '99', suffix: '%', icon: Shield },
  { label: 'Live Portals', value: '4', suffix: '', icon: Users },
  { label: 'Real-Time Sync', value: '24/7', suffix: '', icon: Activity },
];

/* ─── Features ────────────────────────────────────────────────────────── */
const features = [
  {
    icon: Sun,
    title: 'Solar Intelligence',
    desc: 'Aurora-powered design proposals with real satellite data, shading analysis, and instant system sizing.',
  },
  {
    icon: Shield,
    title: 'Risk Engine',
    desc: 'Milestone-gated fund releases protect financiers, incentivize installers, and eliminate project abandonment.',
  },
  {
    icon: BarChart3,
    title: 'Pipeline Visibility',
    desc: 'Every stakeholder sees their projects in real time. No more spreadsheet chaos.',
  },
  {
    icon: Handshake,
    title: 'Aligned Incentives',
    desc: 'Every system is designed so each party benefits themselves first, benefitting the entire ecosystem.',
  },
  {
    icon: Lock,
    title: 'QC-Gated Progression',
    desc: 'Backend Ops reviews every deal before it enters the pipeline. Only verified projects advance.',
  },
  {
    icon: DollarSign,
    title: 'Fund Transparency',
    desc: 'Financiers see exactly where every dollar goes. Milestone-by-milestone with full audit trail.',
  },
];

/* ─── Portal Cards ────────────────────────────────────────────────────── */
const portals = [
  {
    name: 'Sales Rep',
    tag: 'ASP',
    accent: 'from-cyan-400/20 via-cyan-400/5 to-transparent',
    border: 'hover:border-cyan-400/20',
    glow: 'rgba(0,212,200,0.08)',
    desc: 'Create projects, sync Aurora data, convert leads, run welcome calls.',
    features: ['Aurora Sync', 'Lead Conversion', 'Welcome Calls', 'Site Surveys'],
  },
  {
    name: 'Backend Ops',
    tag: 'ASP',
    accent: 'from-blue-400/20 via-blue-400/5 to-transparent',
    border: 'hover:border-blue-400/20',
    glow: 'rgba(56,189,248,0.08)',
    desc: 'QC review deals, manage pipeline, track milestones, coordinate all parties.',
    features: ['QC Review', 'Pipeline Mgmt', 'Milestone Tracking', 'Cross-Portal Sync'],
  },
  {
    name: 'Installer',
    tag: 'ASP+',
    accent: 'from-amber-400/20 via-amber-400/5 to-transparent',
    border: 'hover:border-amber-400/20',
    glow: 'rgba(251,191,36,0.08)',
    desc: 'View assigned projects, upload completion photos, track payments.',
    features: ['Project Queue', 'Photo Uploads', 'Payment Tracking', 'Ticket System'],
  },
  {
    name: 'Financier',
    tag: 'ASP+',
    accent: 'from-emerald-400/20 via-emerald-400/5 to-transparent',
    border: 'hover:border-emerald-400/20',
    glow: 'rgba(52,211,153,0.08)',
    desc: 'Monitor funded projects, review milestones, approve releases, track ROI.',
    features: ['Fund Monitoring', 'Milestone Approval', 'Risk Dashboard', 'ROI Analytics'],
  },
];

/* ═══════════════════════════════════════════════════════════════════════ */
/*                           LANDING PAGE                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

const LandingPage = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.95]);

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Cinematic scroll-reactive background */}
      <CinematicBackground />

      {/* ─── Navigation ─────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-auto max-w-[1400px] px-6 pt-4">
          <div className="flex items-center justify-between h-14 px-6 rounded-2xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <span className="text-[15px] font-black tracking-tight">
                Alpha Sale <span className="text-primary">Pro</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-white/40">
              {['about', 'features', 'portals', 'customers', 'milestones'].map((s) => (
                <a
                  key={s}
                  href={`#${s}`}
                  onClick={scrollTo(s)}
                  className="hover:text-white transition-colors duration-300 capitalize"
                >
                  {s === 'milestones' ? 'Process' : s}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-[13px] font-semibold text-white/50 hover:text-white transition-colors duration-300"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 text-[13px] font-bold bg-white text-black rounded-xl hover:bg-white/90 transition-all duration-300 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ─── Hero Section ───────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Hero horizontal accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-[45%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent origin-center"
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 text-center max-w-5xl mx-auto px-6"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-medium mb-10 backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Texas Solar Sales Infrastructure
          </motion.div>

          {/* Oversized heading */}
          <motion.h1
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.4, duration: 1 }}
            className="text-[clamp(3rem,8vw,7rem)] font-black leading-[0.92] tracking-[-0.04em] mb-8"
          >
            Solar Sales.
            <br />
            <span className="bg-gradient-to-r from-primary via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Optimized.
            </span>
          </motion.h1>

          {/* Sub text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-base md:text-lg text-white/35 max-w-xl mx-auto mb-12 leading-relaxed font-light"
          >
            The operating system for solar sales organizations.
            Sales reps, ops, installers, and financiers — one platform,
            milestone-gated fund releases, zero risk.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="group relative px-8 py-3.5 bg-white text-black font-bold rounded-xl text-sm transition-all duration-300 active:scale-95 flex items-center gap-2 overflow-hidden"
            >
              <span className="relative z-10">Start Free</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
            <a
              href="#features"
              onClick={scrollTo('features')}
              className="px-8 py-3.5 border border-white/[0.08] text-white/50 font-medium rounded-xl text-sm hover:bg-white/[0.03] hover:border-white/[0.15] hover:text-white/70 transition-all duration-300"
            >
              See How It Works
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-medium text-white/20 uppercase tracking-[0.2em]">Scroll</span>
            <ChevronDown className="w-4 h-4 text-white/15" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Stats Bar ──────────────────────────────────────────────── */}
      <section className="relative">
        <div className="border-y border-white/[0.04]">
          <div className="max-w-[1400px] mx-auto px-6">
            <StaggerReveal className="grid grid-cols-2 md:grid-cols-4">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  variants={staggerChild}
                  className={`py-12 text-center ${i < 3 ? 'md:border-r border-white/[0.04]' : ''}`}
                >
                  <div className="text-[clamp(2rem,4vw,3.5rem)] font-black text-white tracking-tight leading-none mb-1">
                    {s.value}<span className="text-primary">{s.suffix}</span>
                  </div>
                  <div className="text-[11px] text-white/30 font-medium uppercase tracking-[0.15em]">{s.label}</div>
                </motion.div>
              ))}
            </StaggerReveal>
          </div>
        </div>
      </section>

      {/* ─── About Section ──────────────────────────────────────────── */}
      <section id="about" className="relative py-32 lg:py-40 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <RevealSection>
              <div className="text-[11px] text-primary font-bold uppercase tracking-[0.25em] mb-6">Who We Are</div>
              <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black leading-[1.05] tracking-[-0.03em] mb-8">
                Built for the{' '}
                <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                  solar ecosystem
                </span>
              </h2>
              <div className="space-y-5 text-[15px] text-white/40 leading-relaxed font-light">
                <p>
                  Alpha Sale Pro is a Texas-based solar sales organization and risk mitigation
                  platform. We built ASP because we saw the same problem everywhere: disconnected
                  systems, misaligned incentives, and zero transparency.
                </p>
                <p>
                  Our platform is engineered around <span className="text-white/70 font-medium">socioeconomic optimization</span> —
                  every solution motivates all parties to act in a manner that benefits
                  the ecosystem by benefitting themselves first.
                </p>
              </div>
            </RevealSection>

            <RevealSection delay={0.15}>
              <div className="space-y-4">
                {[
                  { icon: Building2, label: 'Solar Sales Org', desc: 'Texas-based, scaling nationwide', color: 'text-primary' },
                  { icon: Shield, label: 'Risk Mitigation', desc: 'Milestone-gated fund releases', color: 'text-blue-400' },
                  { icon: Users, label: '4-Portal Platform', desc: 'Sales · Ops · Installer · Financier', color: 'text-violet-400' },
                  { icon: Handshake, label: 'Aligned Incentives', desc: 'Everyone wins by design', color: 'text-emerald-400' },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <GlassCard className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                          <item.icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white/90">{item.label}</div>
                          <div className="text-xs text-white/30 font-light">{item.desc}</div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ─── Features Section ───────────────────────────────────────── */}
      <section id="features" className="relative py-32 lg:py-40 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <RevealSection className="text-center mb-20">
            <div className="text-[11px] text-primary font-bold uppercase tracking-[0.25em] mb-6">What We Do</div>
            <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black leading-[1.05] tracking-[-0.03em] mb-6">
              Everything solar teams need.
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                Nothing they don't.
              </span>
            </h2>
            <p className="text-[15px] text-white/30 max-w-lg mx-auto font-light">
              One platform connecting every stakeholder in the solar project lifecycle.
            </p>
          </RevealSection>

          <StaggerReveal className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <motion.div key={f.title} variants={staggerChild}>
                <GlassCard className="p-7 h-full group">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors duration-500">
                    <f.icon className="w-5 h-5 text-primary/80 group-hover:text-primary transition-colors duration-500" />
                  </div>
                  <h3 className="text-[15px] font-bold text-white/90 mb-2">{f.title}</h3>
                  <p className="text-sm text-white/30 leading-relaxed font-light">{f.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ─── Portals Section ────────────────────────────────────────── */}
      <section id="portals" className="relative py-32 lg:py-40">
        <div className="max-w-[1400px] mx-auto px-6">
          <RevealSection className="text-center mb-20">
            <div className="text-[11px] text-primary font-bold uppercase tracking-[0.25em] mb-6">Platform Architecture</div>
            <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black leading-[1.05] tracking-[-0.03em] mb-6">
              Four portals.{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">One ecosystem.</span>
            </h2>
            <p className="text-[15px] text-white/30 max-w-lg mx-auto font-light">
              Every stakeholder gets their own optimized workspace, connected in real time.
            </p>
          </RevealSection>

          <StaggerReveal className="grid md:grid-cols-2 gap-5">
            {portals.map((p) => (
              <motion.div key={p.name} variants={staggerChild}>
                <GlassCard className={`relative p-8 overflow-hidden ${p.border}`}>
                  {/* Accent glow */}
                  <div
                    className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] pointer-events-none"
                    style={{ background: p.glow }}
                  />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-white/[0.06] text-white/50 tracking-wider">
                        {p.tag}
                      </span>
                      <h3 className="text-lg font-bold text-white/90">{p.name}</h3>
                    </div>
                    <p className="text-sm text-white/30 mb-6 leading-relaxed font-light">{p.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {p.features.map(feat => (
                        <span key={feat} className="px-3 py-1 text-[11px] font-medium rounded-lg bg-white/[0.03] text-white/40 border border-white/[0.05]">
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ─── How We Help Customers ─────────────────────────────────── */}
      <section id="customers" className="relative py-32 lg:py-40 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <RevealSection className="text-center mb-20">
            <div className="text-[11px] text-primary font-bold uppercase tracking-[0.25em] mb-6">For Homeowners</div>
            <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black leading-[1.05] tracking-[-0.03em] mb-6">
              Solar made{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">simple & safe.</span>
            </h2>
            <p className="text-[15px] text-white/30 max-w-lg mx-auto font-light">
              Going solar shouldn't feel like a gamble. ASP protects your investment at every step.
            </p>
          </RevealSection>

          <StaggerReveal className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Shield,
                title: 'Investment Protected',
                desc: 'Funds are held in milestone-gated escrow. Installers get paid only when verified work is completed.',
                highlight: 'Zero risk of abandonment',
                color: 'text-primary',
              },
              {
                icon: Star,
                title: 'Vetted Installers',
                desc: 'Every installer is performance-scored. We route your project to top crews with proven track records.',
                highlight: '100% battery storage',
                color: 'text-amber-400',
              },
              {
                icon: Phone,
                title: '5-Year Service',
                desc: 'After your system goes live, ASP stays. Panel cleaning, monitoring, rate optimization — included.',
                highlight: 'Post-PTO care included',
                color: 'text-emerald-400',
              },
            ].map((item) => (
              <motion.div key={item.title} variants={staggerChild}>
                <GlassCard className="p-8 h-full group">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-6 group-hover:bg-white/[0.06] transition-all duration-500">
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white/90 mb-3">{item.title}</h3>
                  <p className="text-sm text-white/30 leading-relaxed mb-5 font-light">{item.desc}</p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary/70">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {item.highlight}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </StaggerReveal>
        </div>
      </section>

      {/* ─── Milestone Process — Horizontal Timeline ────────────────── */}
      <section id="milestones" className="relative py-32 lg:py-40">
        <div className="max-w-[1400px] mx-auto px-6">
          <RevealSection className="text-center mb-20">
            <div className="text-[11px] text-primary font-bold uppercase tracking-[0.25em] mb-6">The Process</div>
            <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black leading-[1.05] tracking-[-0.03em] mb-6">
              Milestone-gated.{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">Risk-eliminated.</span>
            </h2>
            <p className="text-[15px] text-white/30 max-w-lg mx-auto font-light">
              Funds are released only when verifiable milestones are completed. Every party is protected.
            </p>
          </RevealSection>

          {/* Timeline */}
          <div className="relative max-w-4xl mx-auto">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent md:-translate-x-px" />

            {milestones.map((m, i) => (
              <RevealSection key={m.id} delay={i * 0.08}>
                <div className={`relative flex items-start gap-8 mb-10 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Timeline dot */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary/80 border-2 border-[rgb(4,6,18)] z-10 shadow-[0_0_12px_rgba(0,212,200,0.3)]" />

                  {/* Content */}
                  <div className={`ml-16 md:ml-0 md:w-[calc(50%-32px)] ${i % 2 === 0 ? 'md:pr-10 md:text-right' : 'md:pl-10'}`}>
                    <div className={`inline-flex items-center gap-2.5 mb-2 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                      <span className="text-xs font-black text-primary">{m.id}</span>
                      <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">{m.pct} release</span>
                    </div>
                    <h3 className="text-base font-bold text-white/85 mb-1">{m.name}</h3>
                    <p className="text-sm text-white/30 font-light">{m.desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}

            {/* M7 Bonus */}
            <RevealSection delay={0.5}>
              <div className="relative flex items-start gap-8 md:flex-row">
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-primary to-cyan-300 border-2 border-[rgb(4,6,18)] z-10 shadow-[0_0_20px_rgba(0,212,200,0.4)]" />
                <div className="ml-16 md:ml-0 md:w-[calc(50%-32px)] md:pr-10 md:text-right">
                  <div className="inline-flex items-center gap-2.5 md:flex-row-reverse">
                    <span className="text-xs font-black text-amber-400">M7</span>
                    <span className="text-[10px] font-bold text-amber-400/60 uppercase tracking-wider">+5% Bonus</span>
                  </div>
                  <h3 className="text-base font-bold text-white/85 mb-1">Customer Satisfaction</h3>
                  <p className="text-sm text-white/30 font-light">30-day post-PTO review. Clean project = bonus release.</p>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ─── Financier Section ──────────────────────────────────────── */}
      <section className="relative py-32 lg:py-40 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <RevealSection>
              <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-[0.25em] mb-6">For Financiers</div>
              <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black leading-[1.05] tracking-[-0.03em] mb-8">
                Fund solar with{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-primary bg-clip-text text-transparent">
                  confidence.
                </span>
              </h2>
              <div className="space-y-5 text-[15px] text-white/40 leading-relaxed font-light mb-10">
                <p>
                  The industry average default rate on residential solar is ~18%.
                  ASP's milestone-gated escrow, mandatory battery storage,
                  installer scoring, and 5-year service contracts reduce defaults by up to 30%.
                </p>
                <p>
                  Real-time visibility into every funded project — from permit filing to PTO —
                  with milestone-by-milestone fund release controls and a full audit trail.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '30%', label: 'Default Reduction', icon: Shield },
                  { value: '100%', label: 'Battery Attach', icon: Sun },
                  { value: '7', label: 'Checkpoints', icon: CheckCircle },
                  { value: '5yr', label: 'Service Coverage', icon: Clock },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.7 }}
                  >
                    <GlassCard className="p-4" hover={false}>
                      <stat.icon className="w-4 h-4 text-emerald-400/70 mb-2" />
                      <div className="text-2xl font-black text-white tracking-tight">{stat.value}</div>
                      <div className="text-[10px] text-white/30 font-medium uppercase tracking-wider">{stat.label}</div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </RevealSection>

            <RevealSection delay={0.15}>
              <GlassCard className="p-8 overflow-hidden relative" hover={false}>
                {/* Accent glow */}
                <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] bg-emerald-400/[0.06] pointer-events-none" />
                <h3 className="text-base font-bold text-white/80 mb-6 flex items-center gap-2 relative">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Fund Release Flow
                </h3>
                <div className="space-y-3 relative">
                  {[
                    { milestone: 'M1 — SOW Confirmed', pct: '15%', desc: 'Contract signed, installer assigned' },
                    { milestone: 'M2 — Permit + Materials', pct: '20%', desc: 'Permits filed, materials ordered' },
                    { milestone: 'M3 — Install Scheduled', pct: '15%', desc: 'Installation date locked' },
                    { milestone: 'M4 — Install Complete', pct: '20%', desc: 'Photos verified, panels installed' },
                    { milestone: 'M5 — Inspection Passed', pct: '20%', desc: 'Utility inspection approved' },
                    { milestone: 'M6 — PTO Granted', pct: '10%', desc: 'System live and generating' },
                  ].map((m, i) => (
                    <motion.div
                      key={m.milestone}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.06, duration: 0.6 }}
                      className="flex items-center gap-4 group p-3 rounded-xl hover:bg-white/[0.02] transition-colors duration-300"
                    >
                      <div className="w-11 h-11 rounded-lg bg-emerald-400/[0.06] flex items-center justify-center shrink-0 group-hover:bg-emerald-400/[0.1] transition-colors duration-300">
                        <span className="text-xs font-black text-emerald-400">{m.pct}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white/70">{m.milestone}</div>
                        <div className="text-xs text-white/25 font-light">{m.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-white/[0.04] flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-gradient-to-r from-amber-400/[0.08] to-primary/[0.08] flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-400/80">M7 — Speed Bonus (+5%)</div>
                    <div className="text-xs text-white/25 font-light">PTO within 35 days = bonus release (paid by ASP)</div>
                  </div>
                </div>
              </GlassCard>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ────────────────────────────────────────────── */}
      <section className="relative py-32 lg:py-40">
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <RevealSection>
            {/* Decorative line */}
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mx-auto mb-12" />

            <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-black leading-[1.05] tracking-[-0.03em] mb-6">
              Ready to{' '}
              <span className="bg-gradient-to-r from-primary via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                optimize
              </span>
              ?
            </h2>
            <p className="text-base text-white/30 max-w-md mx-auto mb-12 font-light">
              Join the platform that aligns every stakeholder in solar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="group px-10 py-4 bg-white text-black font-bold rounded-xl text-sm transition-all duration-300 active:scale-95 flex items-center gap-2 hover:shadow-[0_0_40px_rgba(0,212,200,0.15)]"
              >
                Get Started <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="px-10 py-4 border border-white/[0.08] text-white/50 font-medium rounded-xl text-sm hover:bg-white/[0.03] transition-all duration-300 flex items-center gap-2"
              >
                <Phone className="w-4 h-4" /> Contact Us
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="text-sm font-bold text-white/40">
                Alpha Sale <span className="text-primary/60">Pro</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-white/20 font-light">
              <span>© {new Date().getFullYear()} Alpha Sale Pro</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span>Texas, USA</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <a href="mailto:info@alphasale.co" className="hover:text-primary/60 transition-colors duration-300">info@alphasale.co</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
