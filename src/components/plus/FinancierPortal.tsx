import { useState } from 'react';
import { PROJECTS, MILESTONE_NAMES } from '@/data/mockData';
import { Shield, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronRight, BarChart3, Lock, Zap, Target, PieChart, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const ESCROW_MILESTONES = [
  { name: 'SOW Confirmed', percent: 15 },
  { name: 'Permit + Materials', percent: 20 },
  { name: 'Install Scheduled', percent: 15 },
  { name: 'Install Complete', percent: 20 },
  { name: 'Utility Inspection', percent: 20 },
  { name: 'PTO Granted', percent: 10 },
];

const DEFAULT_LAYERS = [
  { name: 'Utility Bill Verification', desc: 'Real savings confirmed before pipeline entry', active: true },
  { name: '80% True Offset Cap', desc: 'Undersized deals rejected at origination', active: true },
  { name: 'Installer Performance Scoring', desc: 'Only high-scoring network installers receive deals', active: true },
  { name: 'Milestone-Gated Payments', desc: 'No capital moves without ASP-verified completion', active: true },
  { name: 'Distributed Rep Commissions', desc: 'Reps invested through PTO — not just the close', active: true },
  { name: 'Ticket Resolution System', desc: 'Issues gate next milestone — 72hr resolution or escalation', active: true },
  { name: 'Battery-First Design', desc: '100% storage attachment improves satisfaction', active: true },
];

const FinancierPortal = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'portfolio' | 'escrow' | 'risk'>('overview');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const totalPortfolio = PROJECTS.reduce((s, p) => s + p.contractValue, 0);
  const totalFunded = PROJECTS.reduce((s, p) => s + Math.round(p.contractValue * (p.currentMilestone / p.totalMilestones)), 0);
  const activeProjects = PROJECTS.filter(p => p.status === 'active').length;
  const defaultRate = 5.2;
  const previousDefaultRate = 18;
  const avgDaysToPTO = 24;
  const cancelRate = 7;

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-5">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Portfolio', value: `$${(totalPortfolio / 1000000).toFixed(2)}M`, icon: DollarSign, color: 'text-primary', sub: `${PROJECTS.length} projects` },
                { label: 'Capital Deployed', value: `$${(totalFunded / 1000000).toFixed(2)}M`, icon: TrendingUp, color: 'text-[hsl(var(--green))]', sub: `${Math.round((totalFunded / totalPortfolio) * 100)}% deployed` },
                { label: 'Default Rate', value: `${defaultRate}%`, icon: Shield, color: 'text-[hsl(var(--green))]', sub: `↓ from ${previousDefaultRate}%` },
                { label: 'Avg Days to PTO', value: `${avgDaysToPTO}d`, icon: Clock, color: 'text-[hsl(var(--blue))]', sub: `Target: 26d` },
              ].map((s, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">{s.label}</span>
                  </div>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Before vs After */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> ASP Impact — Before vs After
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Default Rate', before: '18%', after: `${defaultRate}%`, improvement: `${Math.round(((previousDefaultRate - defaultRate) / previousDefaultRate) * 100)}%`, good: true },
                  { label: 'Days to PTO', before: '60d', after: `${avgDaysToPTO}d`, improvement: `${Math.round(((60 - avgDaysToPTO) / 60) * 100)}%`, good: true },
                  { label: 'Cancel Rate', before: '20%', after: `${cancelRate}%`, improvement: `${Math.round(((20 - cancelRate) / 20) * 100)}%`, good: true },
                ].map((m, i) => (
                  <div key={i} className="bg-muted rounded-xl p-4 text-center">
                    <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-3">{m.label}</div>
                    <div className="flex items-center justify-center gap-3">
                      <div>
                        <div className="text-lg font-bold text-[hsl(var(--red))]/60 line-through">{m.before}</div>
                      </div>
                      <ArrowDownRight className="w-4 h-4 text-[hsl(var(--green))]" />
                      <div>
                        <div className="text-lg font-black text-[hsl(var(--green))]">{m.after}</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-[hsl(var(--green))] mt-2 flex items-center justify-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> {m.improvement} improvement
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Escrow Summary */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[hsl(var(--yellow))]" /> Escrow Fund Status
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-muted rounded-xl p-4">
                  <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-1">In Escrow</div>
                  <div className="text-xl font-black text-[hsl(var(--yellow))]">${((totalPortfolio - totalFunded) / 1000).toFixed(0)}K</div>
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <div className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mb-1">Released</div>
                  <div className="text-xl font-black text-[hsl(var(--green))]">${(totalFunded / 1000).toFixed(0)}K</div>
                </div>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-[hsl(var(--green))] rounded-full transition-all" style={{ width: `${(totalFunded / totalPortfolio) * 100}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                <span>0%</span>
                <span>{Math.round((totalFunded / totalPortfolio) * 100)}% deployed</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        );

      case 'portfolio':
        return (
          <div className="space-y-3">
            {PROJECTS.map(p => {
              const isExpanded = expandedProject === p.id;
              const funded = Math.round(p.contractValue * (p.currentMilestone / p.totalMilestones));
              const remaining = p.contractValue - funded;

              return (
                <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  {/* Milestone strip */}
                  <div className="flex gap-px h-1.5">
                    {Array.from({ length: p.totalMilestones }).map((_, i) => (
                      <div key={i} className={`flex-1 ${i < p.currentMilestone ? 'bg-primary' : i === p.currentMilestone ? 'bg-primary/40' : 'bg-border'}`} />
                    ))}
                  </div>
                  <div onClick={() => setExpandedProject(isExpanded ? null : p.id)} className="px-5 py-4 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-4">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <div>
                        <div className="text-sm font-bold text-card-foreground">{p.customerName}</div>
                        <div className="text-[10px] text-muted-foreground">{p.id} · {p.address.split(',').slice(-2).join(',')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-black text-primary">${(p.contractValue / 1000).toFixed(1)}K</div>
                        <div className="text-[10px] text-muted-foreground">{p.loanTerms}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        p.status === 'active' ? 'bg-[hsl(var(--green))]/10 text-[hsl(var(--green))] border-[hsl(var(--green))]/25' :
                        p.status === 'delayed' ? 'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))] border-[hsl(var(--yellow))]/25' :
                        p.status === 'on_hold' ? 'bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] border-[hsl(var(--red))]/25' :
                        'bg-primary/10 text-primary border-primary/25'
                      }`}>{p.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border px-5 py-4 space-y-4">
                      {/* Fund Release */}
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Escrow Release Schedule</h4>
                        <div className="grid grid-cols-7 gap-2">
                          {ESCROW_MILESTONES.map((m, i) => {
                            const amount = Math.round(p.contractValue * (m.percent / 100));
                            const released = i < p.currentMilestone;
                            return (
                              <div key={i} className={`rounded-xl p-3 text-center border ${
                                released ? 'bg-[hsl(var(--green))]/5 border-[hsl(var(--green))]/20' : 'bg-muted border-border'
                              }`}>
                                <div className={`text-xs font-extrabold ${released ? 'text-[hsl(var(--green))]' : 'text-muted-foreground'}`}>M{i + 1}</div>
                                <div className={`text-xs font-black ${released ? 'text-[hsl(var(--green))]' : 'text-card-foreground'}`}>${(amount / 1000).toFixed(1)}K</div>
                                <div className="text-[8px] text-muted-foreground">{m.percent}%</div>
                                {released && <CheckCircle className="w-3 h-3 text-[hsl(var(--green))] mx-auto mt-1" />}
                              </div>
                            );
                          })}
                          <div className={`rounded-xl p-3 text-center border bg-[hsl(var(--yellow))]/5 border-[hsl(var(--yellow))]/20`}>
                            <div className="text-xs font-extrabold text-[hsl(var(--yellow))]">M7</div>
                            <div className="text-xs font-black text-[hsl(var(--yellow))]">+5%</div>
                            <div className="text-[8px] text-muted-foreground">Speed</div>
                            <Zap className="w-3 h-3 text-[hsl(var(--yellow))] mx-auto mt-1" />
                          </div>
                        </div>
                      </div>
                      {/* Financial Breakdown */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-muted rounded-xl p-3">
                          <div className="text-[10px] text-muted-foreground">Contract Value</div>
                          <div className="text-sm font-black text-card-foreground">${p.contractValue.toLocaleString()}</div>
                        </div>
                        <div className="bg-muted rounded-xl p-3">
                          <div className="text-[10px] text-muted-foreground">System Cost</div>
                          <div className="text-sm font-black text-card-foreground">${p.projectCost.toLocaleString()}</div>
                        </div>
                        <div className="bg-muted rounded-xl p-3">
                          <div className="text-[10px] text-muted-foreground">Interest Rate</div>
                          <div className="text-sm font-black text-primary">{p.interestRate}%</div>
                        </div>
                        <div className="bg-muted rounded-xl p-3">
                          <div className="text-[10px] text-muted-foreground">Terms</div>
                          <div className="text-sm font-black text-card-foreground">{p.loanTerms}</div>
                        </div>
                      </div>
                      {/* Capital Status */}
                      <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-muted-foreground">Capital Released</span>
                          <span className="text-sm font-black text-[hsl(var(--green))]">${funded.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-muted-foreground">In Escrow</span>
                          <span className="text-sm font-black text-[hsl(var(--yellow))]">${remaining.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-[hsl(var(--green))] rounded-full" style={{ width: `${(funded / p.contractValue) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'escrow':
        return (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[hsl(var(--yellow))]" /> Milestone-Gated Capital Structure
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Funds held in ASP-managed escrow. 7 milestone gates — each requires documented ASP verification before release.</p>
              <div className="grid grid-cols-7 gap-3">
                {ESCROW_MILESTONES.map((m, i) => (
                  <div key={i} className="bg-muted rounded-xl p-4 text-center border border-border">
                    <div className="text-base font-black text-primary mb-1">M{i + 1}</div>
                    <div className="text-lg font-black text-card-foreground">{m.percent}%</div>
                    <div className="text-[9px] text-muted-foreground mt-1 leading-tight">{m.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-Project Escrow */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border text-sm font-extrabold text-card-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[hsl(var(--green))]" /> Escrow by Project
              </div>
              {PROJECTS.map(p => {
                const funded = Math.round(p.contractValue * (p.currentMilestone / p.totalMilestones));
                const pct = Math.round((funded / p.contractValue) * 100);
                return (
                  <div key={p.id} className="px-5 py-3.5 border-b border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-bold text-card-foreground">{p.customerName}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{p.id}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[hsl(var(--green))] font-bold">${funded.toLocaleString()} released</span>
                        <span className="text-xs text-muted-foreground">/ ${p.contractValue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-[hsl(var(--green))] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'risk':
        return (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-card-foreground mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> 7-Layer Default Reduction Stack
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Active from origination. Target: 30% default reduction from day one.</p>
              <div className="space-y-3">
                {DEFAULT_LAYERS.map((layer, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3 bg-muted rounded-xl border border-border">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-card-foreground">{layer.name}</div>
                      <div className="text-[10px] text-muted-foreground">{layer.desc}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--green))]" />
                      <span className="text-[10px] font-bold text-[hsl(var(--green))]">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Risk Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Portfolio Health</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Active', count: PROJECTS.filter(p => p.status === 'active').length, color: 'bg-[hsl(var(--green))]' },
                    { label: 'Delayed', count: PROJECTS.filter(p => p.status === 'delayed').length, color: 'bg-[hsl(var(--yellow))]' },
                    { label: 'On Hold', count: PROJECTS.filter(p => p.status === 'on_hold').length, color: 'bg-[hsl(var(--red))]' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                        <span className="text-xs text-card-foreground">{s.label}</span>
                      </div>
                      <span className="text-sm font-black text-card-foreground">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-3">Risk Flags</h4>
                <div className="space-y-3">
                  {PROJECTS.filter(p => p.status === 'delayed' || p.status === 'on_hold').map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <AlertTriangle className={`w-3 h-3 ${p.status === 'delayed' ? 'text-[hsl(var(--yellow))]' : 'text-[hsl(var(--red))]'}`} />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-card-foreground">{p.customerName}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">{p.stage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Section Nav */}
      <div className="flex gap-1.5">
        {([
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'portfolio', label: 'Portfolio', icon: DollarSign },
          { key: 'escrow', label: 'Escrow', icon: Lock },
          { key: 'risk', label: 'Risk Stack', icon: Shield },
        ] as const).map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSection === s.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-card-foreground hover:bg-muted/80'
            }`}
          >
            <s.icon className="w-3.5 h-3.5" /> {s.label}
          </button>
        ))}
      </div>

      {renderSection()}
    </div>
  );
};

export default FinancierPortal;
