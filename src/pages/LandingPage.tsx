import { useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  Zap, Shield, ShieldCheck, TrendingUp, Users, CheckCircle, ArrowRight,
  Sun, BarChart3, FileText, Phone, Star, ChevronDown,
  Building2, Handshake, Clock, DollarSign, Eye, Lock,
  Activity, Percent, ArrowUpRight, ClipboardList
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// CinematicBackground is now global in App.tsx — no need to import here

gsap.registerPlugin(ScrollTrigger);

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
  { label: 'Concierge Service', value: '24/7', suffix: '', icon: TrendingUp },
  { label: 'Battery Requirement', value: '100', suffix: '%', icon: Shield },
  { label: 'Year Service Contract', value: '5', suffix: '', icon: Users },
  { label: 'Platform Any Installer', value: '1', suffix: '', icon: Activity },
];

/* ─── Features ────────────────────────────────────────────────────────── */
const features = [
  {
    icon: Sun,
    title: 'Aurora Integrated',
    desc: 'Aurora-powered design proposals with real satellite data, shading analysis, and instant system sizing.',
  },
  {
    icon: Shield,
    title: 'Risk Reduction Tools',
    desc: 'Comprehensive risk mitigation stack that protects all parties and eliminates project abandonment.',
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

/* ─── Animated counter hook ───────────────────────────────────────────── */
function useCountUp(target: string, duration = 1.5) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView || !ref.current) return;
    const isNum = /^\d+$/.test(target);
    if (!isNum) {
      ref.current.textContent = target;
      return;
    }
    const end = parseInt(target);
    const obj = { val: 0 };
    gsap.to(obj, {
      val: end,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) ref.current.textContent = Math.round(obj.val).toString();
      },
    });
  }, [isInView, target, duration]);

  return ref;
}

/* ─── Counter stat display ────────────────────────────────────────────── */
const CounterStat = ({ value, suffix, label }: { value: string; suffix: string; label: string }) => {
  const ref = useCountUp(value);
  return (
    <div className="text-center">
      <div className="text-[clamp(2rem,4vw,3.5rem)] font-black text-white tracking-tight leading-none mb-1">
        <span ref={ref}>0</span><span className="text-primary">{suffix}</span>
      </div>
      <div className="text-[11px] text-white/30 font-medium uppercase tracking-[0.15em]">{label}</div>
    </div>
  );
};

const LandingPage = () => {
  const heroRef = useRef(null);
  const landingRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.95]);

  // Global scroll progress for top bar
  const { scrollYProgress: globalProgress } = useScroll();
  const progressWidth = useTransform(globalProgress, [0, 1], ['0%', '100%']);

  /* ─── GSAP ScrollTrigger animations ──────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax text reveals for section headers
      gsap.utils.toArray<HTMLElement>('.gsap-section-title').forEach((el) => {
        gsap.fromTo(el,
          { y: 60, opacity: 0, filter: 'blur(8px)' },
          {
            y: 0, opacity: 1, filter: 'blur(0px)',
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 50%', toggleActions: 'play none none none' },
          }
        );
      });

      // Staggered card reveals
      gsap.utils.toArray<HTMLElement>('.gsap-stagger-container').forEach((container) => {
        const cards = container.querySelectorAll('.gsap-stagger-item');
        if (!cards.length) return;
        gsap.fromTo(cards,
          { y: 50, opacity: 0, scale: 0.95 },
          {
            y: 0, opacity: 1, scale: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: container, start: 'top 80%', toggleActions: 'play none none none' },
          }
        );
      });

      // (Milestone progress line removed — section no longer exists)
    }, landingRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={landingRef} className="min-h-screen text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Cinematic background is now global in App.tsx */}

      {/* ─── Scroll Progress ──────────────────────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-cyan-400 to-blue-500 z-[60] origin-left"
        style={{ width: progressWidth }}
      />

      {/* ─── Navigation ─────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 pt-3 sm:pt-4">
          <div className="flex items-center justify-between h-12 sm:h-14 px-3 sm:px-6 rounded-2xl backdrop-blur-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <span className="text-[15px] font-black tracking-tight">
                Alpha Sale <span className="text-primary">Pro</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-white/40">
              {['about', 'features', 'customers'].map((s) => (
                <a
                  key={s}
                  href={`#${s}`}
                  onClick={scrollTo(s)}
                  className="hover:text-white transition-colors duration-300 capitalize"
                >
                  {s}
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
          className="relative z-10 text-center max-w-5xl mx-auto px-4 sm:px-6"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-medium mb-10 backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Solar Risk Mitigation Platform
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
            complete risk mitigation, zero gaps.
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
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gsap-stagger-container">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`py-12 gsap-stagger-item ${i < 3 ? 'md:border-r border-white/[0.04]' : ''}`}
                >
                  <CounterStat value={s.value} suffix={s.suffix} label={s.label} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── About Section ──────────────────────────────────────────── */}
      <section id="about" className="relative py-32 lg:py-40 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <RevealSection>
              <div className="text-[11px] text-primary font-bold uppercase tracking-[0.25em] mb-6">Who We Are</div>
              <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black leading-[1.05] tracking-[-0.03em] gsap-section-title mb-8">
                Built for the{' '}
                <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                  solar ecosystem
                </span>
              </h2>
              <div className="space-y-5 text-[15px] text-white/40 leading-relaxed font-light">
                <p>
                  Alpha Sale Pro is a solar risk mitigation platform with an internal sales structure
                  and lead origination engine. We built ASP because we saw the same problem everywhere:
                  disconnected systems, misaligned incentives, and zero transparency.
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
                  { icon: Building2, label: 'Internal Sales Structure', desc: 'Lead Origination', color: 'text-primary' },
                  { icon: Shield, label: 'Risk Mitigation', desc: 'Comprehensive protection stack', color: 'text-blue-400' },
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
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <RevealSection className="text-center mb-20">
            <div className="text-[11px] text-primary font-bold uppercase tracking-[0.25em] mb-6">What We Do</div>
            <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black leading-[1.05] tracking-[-0.03em] gsap-section-title mb-6">
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

          <StaggerReveal className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 gsap-stagger-container">
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

      {/* Portals section removed — competitive sensitivity */}

      {/* Social proof metrics removed — will reconnect when real data is available */}

      {/* ─── How We Help Customers ─────────────────────────────────── */}
      <section id="customers" className="relative py-32 lg:py-40 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <RevealSection className="text-center mb-20">
            <div className="text-[11px] text-primary font-bold uppercase tracking-[0.25em] mb-6">For Homeowners</div>
            <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black leading-[1.05] tracking-[-0.03em] gsap-section-title mb-6">
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
                desc: 'Funds are held in protected escrow. Installers get paid only when verified work is completed.',
                highlight: 'Zero risk of abandonment',
                color: 'text-primary',
              },
              {
                icon: Star,
                title: 'Vetted Installer Network',
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

      {/* Milestone timeline removed — competitive sensitivity */}

      {/* ─── Financier Section ──────────────────────────────────────── */}
      <section className="relative py-32 lg:py-40 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <RevealSection>
              <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-[0.25em] mb-6">For Financiers</div>
              <h2 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black leading-[1.05] tracking-[-0.03em] gsap-section-title mb-8">
                Fund solar with{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-primary bg-clip-text text-transparent">
                  confidence.
                </span>
              </h2>
              <div className="space-y-5 text-[15px] text-white/40 leading-relaxed font-light mb-10">
                <p>
                  The industry average default rate on residential solar is ~18%.
                  ASP's comprehensive risk reduction stack — protected escrow, mandatory battery storage,
                  installer scoring, and 5-year service contracts — reduces defaults by up to 30%.
                </p>
                <p>
                  Real-time visibility into every funded project — from permit filing to PTO —
                  with structured verification controls and a full audit trail.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Risk Reduction Stack
                </h3>
                <div className="space-y-3 relative">
                  {[
                    { label: 'Mandatory Battery Storage', Icon: Zap, desc: '100% of installs include battery — higher home value, grid independence' },
                    { label: 'Vetted Installer Network', Icon: ShieldCheck, desc: 'Every installer is performance-scored and continuously monitored' },
                    { label: '5-Year Service Contract', Icon: ClipboardList, desc: 'Post-install concierge: cleaning, monitoring, rate optimization' },
                    { label: 'Real-Time Project Tracking', Icon: Activity, desc: 'Every stakeholder sees live status — no black boxes' },
                    { label: 'Aurora-Verified Designs', Icon: Sun, desc: 'Satellite data + shading analysis ensures optimal system sizing' },
                    { label: 'Escrow-Protected Funding', Icon: Lock, desc: 'Funds released only on verified work completion — zero risk of abandonment' },
                  ].map((m, i) => (
                    <motion.div
                      key={m.label}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.06, duration: 0.6 }}
                      className="flex items-center gap-4 group p-3 rounded-xl hover:bg-white/[0.02] transition-colors duration-300"
                    >
                      <div className="w-11 h-11 rounded-lg bg-emerald-400/[0.06] flex items-center justify-center shrink-0 group-hover:bg-emerald-400/[0.1] transition-colors duration-300">
                        <m.Icon className="w-5 h-5 text-emerald-400/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white/70">{m.label}</div>
                        <div className="text-xs text-white/25 font-light">{m.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ────────────────────────────────────────────── */}
      <section className="relative py-32 lg:py-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
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
              See how the sausage is made.
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
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
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
