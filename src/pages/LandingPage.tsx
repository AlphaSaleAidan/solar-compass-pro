import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  Zap, Shield, TrendingUp, Users, CheckCircle, ArrowRight,
  Sun, BarChart3, FileText, Phone, Star, ChevronDown,
  Building2, Handshake, Clock, DollarSign, Eye, Lock
} from 'lucide-react';

/* ─── Animated Section Wrapper ────────────────────────────────────────── */
const FadeInSection = ({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Floating Particle Background ────────────────────────────────────── */
const ParticleField = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 30 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: Math.random() * 4 + 1,
          height: Math.random() * 4 + 1,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          background: `rgba(0, 212, 200, ${Math.random() * 0.3 + 0.05})`,
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: Math.random() * 4 + 3,
          repeat: Infinity,
          delay: Math.random() * 3,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

/* ─── Glowing Orb ─────────────────────────────────────────────────────── */
const GlowOrb = ({ className }: { className?: string }) => (
  <motion.div
    className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`}
    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
  />
);

/* ─── Milestone Data ──────────────────────────────────────────────────── */
const milestones = [
  { id: 'M1', name: 'SOW Confirmed', pct: '15%', icon: FileText, desc: 'Statement of Work locked in — installer and financier aligned.' },
  { id: 'M2', name: 'Permit + Materials', pct: '20%', icon: Shield, desc: 'Permits filed, materials ordered — project officially in motion.' },
  { id: 'M3', name: 'Install Scheduled', pct: '15%', icon: Clock, desc: 'Installation date confirmed with homeowner and crew.' },
  { id: 'M4', name: 'Install Complete', pct: '20%', icon: Sun, desc: 'Panels on the roof, system physically installed.' },
  { id: 'M5', name: 'Utility Inspection', pct: '20%', icon: Eye, desc: 'City/utility inspection passed — system code-compliant.' },
  { id: 'M6', name: 'PTO Granted', pct: '10%', icon: Zap, desc: 'Permission to Operate — system is live and generating power.' },
];

/* ─── Stats ───────────────────────────────────────────────────────────── */
const stats = [
  { label: 'Fund Release Milestones', value: '7', icon: TrendingUp },
  { label: 'Risk Mitigation Rate', value: '99%', icon: Shield },
  { label: 'Portal Platforms', value: '4', icon: Users },
  { label: 'Real-Time Sync', value: '24/7', icon: BarChart3 },
];

/* ─── Features ────────────────────────────────────────────────────────── */
const features = [
  {
    icon: Sun,
    title: 'Solar Sales Intelligence',
    desc: 'Aurora-powered design proposals with real satellite data, shading analysis, and instant system sizing for every rooftop.',
  },
  {
    icon: Shield,
    title: 'Risk Mitigation Engine',
    desc: 'Milestone-gated fund releases protect financiers, incentivize installers, and eliminate project abandonment risk.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Pipeline Visibility',
    desc: 'Every stakeholder — sales rep, ops, installer, financier — sees their projects in real time. No more spreadsheet chaos.',
  },
  {
    icon: Handshake,
    title: 'Socioeconomic Alignment',
    desc: 'Every system is designed so each party benefits themselves first, which automatically benefits the entire ecosystem.',
  },
  {
    icon: Lock,
    title: 'QC-Gated Progression',
    desc: 'Backend Ops reviews every deal before it enters the pipeline. Only clean, verified projects move forward.',
  },
  {
    icon: DollarSign,
    title: 'Transparent Fund Tracking',
    desc: 'Financiers see exactly where every dollar goes. Milestone-by-milestone fund release with full audit trail.',
  },
];

/* ─── Portal Cards ────────────────────────────────────────────────────── */
const portals = [
  {
    name: 'Sales Rep Portal',
    tag: 'ASP',
    color: 'from-cyan-500/20 to-cyan-500/5',
    border: 'border-cyan-500/20',
    desc: 'Create projects, sync Aurora data, convert leads, run welcome calls, submit site surveys.',
    features: ['Aurora Sync', 'Lead Conversion', 'Welcome Calls', 'Site Surveys'],
  },
  {
    name: 'Backend Ops Portal',
    tag: 'ASP',
    color: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/20',
    desc: 'QC review deals, manage pipeline, track milestones, coordinate between all parties.',
    features: ['QC Review', 'Pipeline Management', 'Milestone Tracking', 'Cross-Portal Sync'],
  },
  {
    name: 'Installer Portal',
    tag: 'ASP+',
    color: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/20',
    desc: 'View assigned projects, upload completion photos, track payments, submit tickets.',
    features: ['Project Queue', 'Photo Uploads', 'Payment Tracking', 'Ticket System'],
  },
  {
    name: 'Financier Portal',
    tag: 'ASP+',
    color: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/20',
    desc: 'Monitor funded projects, review milestones, approve fund releases, track ROI.',
    features: ['Fund Monitoring', 'Milestone Approval', 'Risk Dashboard', 'ROI Analytics'],
  },
];

/* ═══════════════════════════════════════════════════════════════════════ */
/*                           LANDING PAGE                                 */
/* ═══════════════════════════════════════════════════════════════════════ */

const LandingPage = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-[hsl(220,30%,4%)] text-white overflow-x-hidden">

      {/* ─── Navigation ─────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[hsl(220,30%,4%)]/80 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" />
            </div>
            <span className="text-lg font-black tracking-tight">
              Alpha Sale <span className="text-primary">Pro</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#portals" className="hover:text-white transition-colors">Portals</a>
            <a href="#milestones" className="hover:text-white transition-colors">Process</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-bold text-white/70 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-bold bg-primary text-black rounded-lg hover:bg-primary/90 transition-all active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ─── Hero Section ───────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-16">
        <ParticleField />
        <GlowOrb className="w-[600px] h-[600px] bg-primary/20 -top-40 -right-40" />
        <GlowOrb className="w-[400px] h-[400px] bg-blue-500/10 bottom-20 -left-20" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 text-center max-w-5xl mx-auto px-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8"
          >
            <Zap className="w-3 h-3" /> Texas Solar Sales Infrastructure
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-6"
          >
            Solar Sales.
            <br />
            <span className="bg-gradient-to-r from-primary via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Optimized.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Alpha Sale Pro is the operating system for solar sales organizations.
            We connect sales reps, backend ops, installers, and financiers
            on one platform — with milestone-gated fund releases that eliminate risk
            and align every party's incentives.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="group px-8 py-3.5 bg-primary text-black font-bold rounded-xl text-sm hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2"
            >
              Start Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="px-8 py-3.5 border border-white/10 text-white/70 font-bold rounded-xl text-sm hover:bg-white/5 transition-all"
            >
              See How It Works
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* ─── Stats Bar ──────────────────────────────────────────────── */}
      <section className="relative border-y border-white/5 bg-[hsl(222,25%,6%)]">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <FadeInSection key={s.label} delay={i * 0.1} className="text-center">
              <s.icon className="w-5 h-5 text-primary mx-auto mb-3" />
              <div className="text-3xl md:text-4xl font-black text-white mb-1">{s.value}</div>
              <div className="text-xs text-white/40 font-medium uppercase tracking-wider">{s.label}</div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ─── About Section ──────────────────────────────────────────── */}
      <section id="about" className="relative py-32">
        <GlowOrb className="w-[500px] h-[500px] bg-blue-500/10 top-20 -left-40" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeInSection>
              <div className="text-xs text-primary font-bold uppercase tracking-[0.2em] mb-4">Who We Are</div>
              <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
                Built for the{' '}
                <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                  solar ecosystem
                </span>
              </h2>
              <p className="text-white/50 leading-relaxed mb-6">
                Alpha Sale Pro is a Texas-based solar sales organization and risk mitigation
                platform. We built ASP because we saw the same problem everywhere: disconnected
                systems, misaligned incentives, and zero transparency between the parties that
                make solar projects happen.
              </p>
              <p className="text-white/50 leading-relaxed">
                Our platform is designed around <span className="text-white font-semibold">socioeconomic optimization</span> —
                every system and solution motivates all parties to act in a manner that benefits
                the ecosystem by benefitting themselves first. When sales reps, ops teams,
                installers, and financiers all win, customers get better outcomes.
              </p>
            </FadeInSection>

            <FadeInSection delay={0.2}>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-[hsl(222,25%,8%)] to-[hsl(222,25%,5%)] border border-white/5 p-8 flex flex-col justify-center">
                  <div className="space-y-6">
                    {[
                      { icon: Building2, label: 'Solar Sales Org', desc: 'Texas-based, scaling nationwide' },
                      { icon: Shield, label: 'Risk Mitigation', desc: 'Milestone-gated fund releases' },
                      { icon: Users, label: '4-Portal Platform', desc: 'Sales · Ops · Installer · Financier' },
                      { icon: Handshake, label: 'Aligned Incentives', desc: 'Everyone wins by design' },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <item.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{item.label}</div>
                          <div className="text-xs text-white/40">{item.desc}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                {/* Decorative glow behind card */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent -z-10 blur-xl scale-110" />
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ─── Features Section ───────────────────────────────────────── */}
      <section id="features" className="relative py-32 bg-[hsl(222,25%,5%)]">
        <GlowOrb className="w-[500px] h-[500px] bg-primary/10 top-40 -right-40" />
        <div className="max-w-7xl mx-auto px-6">
          <FadeInSection className="text-center mb-20">
            <div className="text-xs text-primary font-bold uppercase tracking-[0.2em] mb-4">What We Do</div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              Everything solar teams need.{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">Nothing they don't.</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              One platform connecting every stakeholder in the solar project lifecycle — from first knock to PTO.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FadeInSection key={f.title} delay={i * 0.08}>
                <div className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all duration-300 h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Portals Section ────────────────────────────────────────── */}
      <section id="portals" className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <FadeInSection className="text-center mb-20">
            <div className="text-xs text-primary font-bold uppercase tracking-[0.2em] mb-4">Platform Architecture</div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              Four portals.{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">One ecosystem.</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              ASP and ASP+ portals give every stakeholder their own optimized workspace, all connected in real time.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-2 gap-6">
            {portals.map((p, i) => (
              <FadeInSection key={p.name} delay={i * 0.1}>
                <div className={`relative p-8 rounded-2xl bg-gradient-to-br ${p.color} border ${p.border} hover:scale-[1.02] transition-all duration-300`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-0.5 text-[10px] font-black rounded bg-white/10 text-white/60">{p.tag}</span>
                    <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  </div>
                  <p className="text-sm text-white/40 mb-6 leading-relaxed">{p.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {p.features.map(feat => (
                      <span key={feat} className="px-3 py-1 text-[11px] font-medium rounded-full bg-white/5 text-white/50 border border-white/5">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Milestone Process ──────────────────────────────────────── */}
      <section id="milestones" className="relative py-32 bg-[hsl(222,25%,5%)]">
        <GlowOrb className="w-[600px] h-[600px] bg-primary/10 -bottom-40 left-1/2 -translate-x-1/2" />
        <div className="max-w-5xl mx-auto px-6">
          <FadeInSection className="text-center mb-20">
            <div className="text-xs text-primary font-bold uppercase tracking-[0.2em] mb-4">How We Help</div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              Milestone-gated.{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">Risk-eliminated.</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Funds are released only when verifiable milestones are completed. Every party is protected. Every dollar is tracked.
            </p>
          </FadeInSection>

          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />

            {milestones.map((m, i) => (
              <FadeInSection key={m.id} delay={i * 0.1}>
                <div className={`relative flex items-start gap-8 mb-12 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Timeline dot */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-[hsl(222,25%,5%)] z-10" />

                  {/* Content */}
                  <div className={`ml-16 md:ml-0 md:w-[calc(50%-40px)] ${i % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8'}`}>
                    <div className={`inline-flex items-center gap-2 mb-2 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                      <span className="text-xs font-black text-primary">{m.id}</span>
                      <span className="text-xs text-white/30">•</span>
                      <span className="text-xs font-bold text-white/50">{m.pct} fund release</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{m.name}</h3>
                    <p className="text-sm text-white/40">{m.desc}</p>
                  </div>
                </div>
              </FadeInSection>
            ))}

            {/* Final milestone: M7 bonus */}
            <FadeInSection delay={0.6}>
              <div className="relative flex items-start gap-8 md:flex-row">
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-primary to-cyan-300 border-2 border-[hsl(222,25%,5%)] z-10" />
                <div className="ml-16 md:ml-0 md:w-[calc(50%-40px)] md:pr-8 md:text-right">
                  <div className="inline-flex items-center gap-2 md:flex-row-reverse">
                    <span className="text-xs font-black text-primary">M7</span>
                    <span className="text-xs text-white/30">•</span>
                    <span className="text-xs font-bold text-amber-400/80">+5% Performance Bonus</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Customer Satisfaction</h3>
                  <p className="text-sm text-white/40">30-day post-PTO review. Clean project = bonus release. Everyone is incentivized for quality.</p>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ────────────────────────────────────────────── */}
      <section className="relative py-32">
        <GlowOrb className="w-[800px] h-[400px] bg-primary/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <FadeInSection>
            <h2 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              Ready to{' '}
              <span className="bg-gradient-to-r from-primary via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                optimize
              </span>
              ?
            </h2>
            <p className="text-lg text-white/40 max-w-xl mx-auto mb-10">
              Join the platform that aligns every stakeholder in solar.
              Sales reps, ops teams, installers, and financiers — all on one system.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="group px-10 py-4 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2"
              >
                Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="px-10 py-4 border border-white/10 text-white/70 font-bold rounded-xl hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <Phone className="w-4 h-4" /> Contact Us
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[hsl(222,25%,3%)]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="text-sm font-bold text-white/60">
                Alpha Sale <span className="text-primary/80">Pro</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-white/30">
              <span>© {new Date().getFullYear()} Alpha Sale Pro</span>
              <span>•</span>
              <span>Texas, USA</span>
              <span>•</span>
              <a href="mailto:info@alphasale.co" className="hover:text-primary transition-colors">info@alphasale.co</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
