import { useState } from 'react';
import { DollarSign, BarChart3, Wrench, Calendar, Star, Flame, Ticket, TrendingUp, XCircle, CheckCircle, UserX, ChevronDown, ChevronUp, MapPin, Phone, Mail, Camera, FileText } from 'lucide-react';
import { REP_STATS, APPOINTMENTS } from '@/data/mockData';

const RepStats = () => {
  const [expandedAppt, setExpandedAppt] = useState<number | null>(null);

  const stats = [
    { label: 'Yearly Paid Out', value: `$${REP_STATS.yearlyPaidOut.toLocaleString()}`, icon: DollarSign, color: 'text-asp-green' },
    { label: 'Pending Pipeline', value: `$${REP_STATS.pendingPipeline.toLocaleString()}`, icon: BarChart3, color: 'text-primary' },
    { label: 'Installs', value: REP_STATS.installCount.toString(), icon: Wrench, color: 'text-asp-yellow' },
  ];

  const today = new Date().toISOString().split('T')[0];
  const todaysAppts = APPOINTMENTS.filter(a => a.date === today || a.date === '2026-03-28');
  const getStarCount = (appt: typeof APPOINTMENTS[0]) => {
    const criteria = [appt.gotBill, appt.gotContact, appt.bothHomeowners, appt.meterPhoto, appt.billOver250];
    return criteria.filter(Boolean).length;
  };

  const closingPct = REP_STATS.totalSits > 0 ? Math.round(((REP_STATS.totalCloses + REP_STATS.creditFails) / REP_STATS.totalSits) * 100) : 0;
  const totalDeals = REP_STATS.creditPassed + REP_STATS.creditFails + REP_STATS.nonClosed;
  const creditPassedPct = totalDeals > 0 ? Math.round((REP_STATS.creditPassed / totalDeals) * 100) : 0;
  const creditFailPct = totalDeals > 0 ? Math.round((REP_STATS.creditFails / totalDeals) * 100) : 0;
  const nonClosedPct = totalDeals > 0 ? Math.round((REP_STATS.nonClosed / totalDeals) * 100) : 0;

  const streak = REP_STATS.dealStreak;
  const streakStages = [
    { label: '+50% Tickets', threshold: 1, boost: '50%' },
    { label: '+100% Tickets', threshold: 2, boost: '100%' },
    { label: '+200% Tickets', threshold: 3, boost: '200%' },
  ];
  const activeStage = streak >= 3 ? 2 : streak >= 2 ? 1 : streak >= 1 ? 0 : -1;

  return (
    <div className="space-y-3 animate-fade-in-up stagger-1">
      {/* Streak Bar */}
      <div className="bg-bg2 border border-border rounded-xl p-4">
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

      {/* Main Stats */}
      {stats.map((s) => (
        <div key={s.label} className="bg-bg2 border border-border rounded-xl p-4 flex items-center gap-3">
          <s.icon className={`w-5 h-5 ${s.color}`} />
          <div className="flex-1">
            <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">{s.label}</div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
          </div>
        </div>
      ))}

      {/* Monthly Appointments */}
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">Monthly Appointments</div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-foreground">{REP_STATS.monthlyAppointments}</span>
          <span className="text-xs text-muted-foreground">this month</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Avg Rating:</span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(REP_STATS.avgRating) ? 'text-asp-yellow fill-asp-yellow' : 'text-muted-foreground/30'}`} />
            ))}
            <span className="text-sm font-bold text-asp-yellow ml-1">{REP_STATS.avgRating}</span>
          </div>
        </div>
      </div>

      {/* Next Incoming Appointments Today — CLICKABLE */}
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <div className="text-[10px] text-primary font-bold tracking-[1.5px] uppercase">Next Appointments Today</div>
        </div>
        {todaysAppts.length > 0 ? (
          <div className="space-y-2">
            {todaysAppts.map((a) => {
              const starCount = getStarCount(a);
              const isExpanded = expandedAppt === a.id;
              return (
                <div key={a.id} className="bg-bg3 rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-bg4/50 transition-colors"
                    onClick={() => setExpandedAppt(isExpanded ? null : a.id)}
                  >
                    <div>
                      <div className="text-sm font-bold text-foreground">{a.name}</div>
                      <div className="text-[10px] text-muted-foreground">{a.time}</div>
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
                          <MapPin className="w-3 h-3" /> {a.address}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" /> {a.phone}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3" /> {a.email}
                        </div>
                        <div className="text-muted-foreground">
                          Bills: <span className="text-asp-red font-bold">${a.highBill}</span> / <span className="text-asp-green font-bold">${a.lowBill}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px]">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <FileText className="w-3 h-3" /> Bill: {a.billPhoto ? <span className="text-asp-green">Uploaded</span> : <span className="text-asp-red">Missing</span>}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Camera className="w-3 h-3" /> Meter: {a.meterPhoto ? <span className="text-asp-green">Yes</span> : <span className="text-asp-red">No</span>}
                        </div>
                      </div>
                      {a.closerNotes && (
                        <div className="text-[10px] text-muted-foreground bg-bg4 rounded px-2 py-1">
                          <strong className="text-foreground">Notes:</strong> {a.closerNotes}
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
      <div className="bg-bg2 border border-border rounded-xl p-4">
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
