import { useState } from 'react';
import { DollarSign, BarChart3, Wrench, Calendar, Star, Flame, Ticket, TrendingUp, XCircle, CheckCircle, UserX, ChevronDown, ChevronUp, MapPin, Phone, Mail, Camera, FileText } from 'lucide-react';
import { REP_STATS, APPOINTMENTS } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/hooks/useGamification';
import { useRepStats } from '@/hooks/useRepStats';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { calculateCommission } from '@/lib/commissionCalc';

const RepStats = () => {
  const { user } = useAuth();
  const isDemo = user?.isDemo;
  const gamification = useGamification();
  const { stats: liveStats } = useRepStats();
  const store = useDataSource();
  const [expandedAppt, setExpandedAppt] = useState<string | null>(null);
  const [showPipelineBreakdown, setShowPipelineBreakdown] = useState(false);

  // Calculate pipeline deals with commissions (same formula as Pipeline/Commissions tabs)
  // Used for BOTH demo and production to ensure pending pipeline always matches Commissions tab
  const pipelineDeals = store.projects
    .map(p => {
      const comm = calculateCommission(p);
      return {
        id: p.id,
        customerName: p.customerName,
        systemSize: p.systemSize,
        yourCommission: comm.yourCommission,
        status: comm.status,
        stage: p.stage,
      };
    })
    .filter(d => d.status !== 'paid'); // Only pending/processing deals

  const calculatedPendingPipeline = pipelineDeals.reduce((sum, d) => sum + Math.max(0, d.yourCommission), 0);

  // Use demo data for demo users, live data for production — but ALWAYS use calculatedPendingPipeline
  // so it matches the Commissions tab exactly
  const yearlyPaidOut = isDemo ? REP_STATS.yearlyPaidOut : liveStats.yearlyPaidOut;
  const pendingPipeline = Math.round(calculatedPendingPipeline);
  const installCount = isDemo ? REP_STATS.installCount : liveStats.installCount;
  const monthlyAppointments = isDemo ? REP_STATS.monthlyAppointments : liveStats.monthlyAppointments;
  const avgRating = isDemo ? REP_STATS.avgRating : liveStats.avgRating;
  const streak = isDemo ? REP_STATS.dealStreak : gamification.state.streak_days;

  // Performance metrics
  const totalSits = isDemo ? REP_STATS.totalSits : liveStats.totalSits;
  const totalCloses = isDemo ? REP_STATS.totalCloses : liveStats.totalCloses;
  const creditFails = isDemo ? REP_STATS.creditFails : liveStats.creditFails;
  const creditPassed = isDemo ? REP_STATS.creditPassed : liveStats.creditPassed;
  const nonClosed = isDemo ? REP_STATS.nonClosed : liveStats.nonClosed;

  const closingPct = totalSits > 0 ? Math.round(((totalCloses + creditFails) / totalSits) * 100) : 0;
  const totalDeals = creditPassed + creditFails + nonClosed;
  const creditPassedPct = totalDeals > 0 ? Math.round((creditPassed / totalDeals) * 100) : 0;
  const creditFailPct = totalDeals > 0 ? Math.round((creditFails / totalDeals) * 100) : 0;
  const nonClosedPct = totalDeals > 0 ? Math.round((nonClosed / totalDeals) * 100) : 0;

  // Today's appointments
  const today = new Date().toISOString().split('T')[0];
  const todaysAppts = isDemo
    ? APPOINTMENTS.filter(a => a.date === today || a.date === '2026-03-28')
    : liveStats.todaysAppointments;

  const getStarCount = (appt: any) => {
    if (isDemo) {
      const criteria = [appt.gotBill, appt.gotContact, appt.bothHomeowners, appt.meterPhoto, appt.billOver250];
      return criteria.filter(Boolean).length;
    }
    return appt.stars || 0;
  };

  const streakStages = [
    { label: '+50% Tickets', threshold: 1, boost: '50%' },
    { label: '+100% Tickets', threshold: 2, boost: '100%' },
    { label: '+200% Tickets', threshold: 3, boost: '200%' },
  ];
  const activeStage = streak >= 3 ? 2 : streak >= 2 ? 1 : streak >= 1 ? 0 : -1;

  return (
    <div className="space-y-3 portal-section-enter stagger-1">
      {/* Streak Bar */}
      <div className="bg-bg2/80 backdrop-blur-sm border border-border rounded-xl p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative">
            <Flame className="w-7 h-7 text-asp-blue" fill="hsl(var(--blue))" />
            <span className="absolute -top-1 -right-2 text-xs font-black text-white bg-asp-blue rounded-full w-5 h-5 flex items-center justify-center">{streak}</span>
          </div>
          <div>
            <div className="text-sm font-black text-foreground">Deal Streak</div>
            <div className="text-[10px] text-muted-foreground">Sell every day to keep your streak!</div>
          </div>
        </div>
        <div className="flex gap-1 items-center">
          {streakStages.map((stage, i) => (
            <div key={i} className="flex-1 relative">
              <div className={`h-3 rounded-full transition-all duration-500 ${
                i <= activeStage
                  ? 'bg-gradient-to-r from-asp-blue to-primary shadow-[0_0_10px_hsl(var(--blue)/0.4)]'
                  : 'bg-bg4'
              }`} />
              <div className={`text-[9px] font-bold mt-1 text-center ${i <= activeStage ? 'text-asp-blue' : 'text-muted-foreground'}`}>
                {stage.label}
              </div>
              <div className={`text-[8px] text-center ${i <= activeStage ? 'text-primary' : 'text-muted-foreground/50'}`}>
                {stage.threshold}+ day{stage.threshold > 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yearly Paid Out */}
      <div className="bg-bg2/80 backdrop-blur-sm border border-border rounded-xl p-4 flex items-center gap-3 stat-card-hover transition-all duration-300">
        <DollarSign className="w-5 h-5 text-asp-green" />
        <div className="flex-1">
          <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">Yearly Paid Out</div>
          <div className="text-xl font-black text-asp-green">${yearlyPaidOut.toLocaleString()}</div>
        </div>
      </div>

      {/* Pending Pipeline — with dropdown */}
      <div className="bg-bg2/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden stat-card-hover transition-all duration-300">
        <div
          className="p-4 flex items-center gap-3 cursor-pointer hover:bg-bg3/30 transition-colors"
          onClick={() => setShowPipelineBreakdown(!showPipelineBreakdown)}
        >
          <BarChart3 className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">Pending Pipeline</div>
            <div className="text-xl font-black text-primary">${pendingPipeline.toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-bold">{pipelineDeals.length} deal{pipelineDeals.length !== 1 ? 's' : ''}</span>
            {showPipelineBreakdown ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
        {showPipelineBreakdown && (
          <div className="px-4 pb-4 animate-fade-in-up">
            <div className="border-t border-border pt-3 space-y-1.5">
              {pipelineDeals.length > 0 ? pipelineDeals.map(deal => (
                <div key={deal.id} className="flex items-center justify-between py-2 px-3 bg-bg3 rounded-lg">
                  <div>
                    <div className="text-xs font-bold text-foreground">{deal.customerName}</div>
                    <div className="text-[10px] text-muted-foreground">{deal.systemSize} · {deal.stage}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-primary">
                      ${Math.max(0, deal.yourCommission).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className={`text-[9px] font-bold uppercase ${deal.status === 'pending' ? 'text-asp-yellow' : 'text-asp-blue'}`}>
                      {deal.status}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-xs text-muted-foreground text-center py-3">No pending deals</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Installs */}
      <div className="bg-bg2/80 backdrop-blur-sm border border-border rounded-xl p-4 flex items-center gap-3 stat-card-hover transition-all duration-300">
        <Wrench className="w-5 h-5 text-asp-yellow" />
        <div className="flex-1">
          <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">Installs</div>
          <div className="text-xl font-black text-asp-yellow">{installCount}</div>
        </div>
      </div>

      {/* Monthly Appointments */}
      <div className="bg-bg2/80 backdrop-blur-sm border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">Monthly Appointments</div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-foreground">{monthlyAppointments}</span>
          <span className="text-xs text-muted-foreground">this month</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Avg Rating:</span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(avgRating) ? 'text-asp-yellow fill-asp-yellow' : 'text-muted-foreground/30'}`} />
            ))}
            <span className="text-sm font-bold text-asp-yellow ml-1">{avgRating || '—'}</span>
          </div>
        </div>
      </div>

      {/* Next Incoming Appointments Today */}
      <div className="bg-bg2/80 backdrop-blur-sm border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <div className="text-[10px] text-primary font-bold tracking-[1.5px] uppercase">Next Appointments Today</div>
        </div>
        {todaysAppts.length > 0 ? (
          <div className="space-y-2">
            {todaysAppts.map((a: any) => {
              const starCount = getStarCount(a);
              const apptId = a.id?.toString();
              const isExpanded = expandedAppt === apptId;
              const name = isDemo ? a.name : a.customer_name;
              const time = isDemo ? a.time : a.appointment_time;
              const address = a.address;
              const phone = a.phone;
              const email = a.email;
              const highBill = isDemo ? a.highBill : a.high_bill;
              const lowBill = isDemo ? a.lowBill : a.low_bill;
              const closerNotes = isDemo ? a.closerNotes : a.closer_notes;

              return (
                <div key={apptId} className="bg-bg3 rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-bg4/50 transition-colors"
                    onClick={() => setExpandedAppt(isExpanded ? null : apptId)}
                  >
                    <div>
                      <div className="text-sm font-bold text-foreground">{name}</div>
                      <div className="text-[10px] text-muted-foreground">{time}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < starCount ? 'text-asp-yellow fill-asp-yellow' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-border animate-fade-in-up space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" /> {address}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" /> {phone}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3" /> {email}
                        </div>
                        <div className="text-muted-foreground">
                          Bills: <span className="text-asp-red font-bold">${highBill}</span> / <span className="text-asp-green font-bold">${lowBill}</span>
                        </div>
                      </div>
                      {closerNotes && (
                        <div className="text-[10px] text-muted-foreground bg-bg4 rounded px-2 py-1">
                          <strong className="text-foreground">Notes:</strong> {closerNotes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-2">No appointments today</div>
        )}
      </div>

      {/* Closing Metrics */}
      <div className="bg-bg2/80 backdrop-blur-sm border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">Performance Metrics</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-bg3 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-black text-primary">{closingPct}%</div>
            <div className="text-[9px] text-muted-foreground font-bold uppercase">Closing %</div>
            <div className="text-[8px] text-muted-foreground">Sit-to-Close (CF = close)</div>
          </div>
          <div className="bg-bg3 rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-asp-green" />
              <span className="text-lg font-black text-asp-green">{creditPassedPct}%</span>
            </div>
            <div className="text-[9px] text-muted-foreground font-bold uppercase">Credit Passed</div>
          </div>
          <div className="bg-bg3 rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-asp-red" />
              <span className="text-lg font-black text-asp-red">{creditFailPct}%</span>
            </div>
            <div className="text-[9px] text-muted-foreground font-bold uppercase">Credit Fails</div>
          </div>
          <div className="bg-bg3 rounded-lg px-3 py-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <UserX className="w-3.5 h-3.5 text-asp-blue" />
              <span className="text-lg font-black text-asp-blue">{nonClosedPct}%</span>
            </div>
            <div className="text-[9px] text-muted-foreground font-bold uppercase">Non-Closed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepStats;
