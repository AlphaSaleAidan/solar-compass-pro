import { REP_STATS } from '@/data/mockData';

const RepStats = () => {
  const stats = [
    { label: 'Yearly Paid Out', value: `$${REP_STATS.yearlyPaidOut.toLocaleString()}`, icon: '💰', color: 'text-asp-green' },
    { label: 'Pending Pipeline', value: `$${REP_STATS.pendingPipeline.toLocaleString()}`, icon: '📊', color: 'text-primary' },
    { label: 'Installs', value: REP_STATS.installCount.toString(), icon: '🔧', color: 'text-asp-yellow' },
  ];

  return (
    <div className="space-y-3 animate-fade-in-up stagger-1">
      {stats.map((s) => (
        <div key={s.label} className="bg-bg2 border border-border rounded-xl p-4 flex items-center gap-3">
          <span className="text-xl">{s.icon}</span>
          <div className="flex-1">
            <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase">{s.label}</div>
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
          </div>
        </div>
      ))}
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase mb-1">📅 Monthly Appointments</div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-white">{REP_STATS.monthlyAppointments}</span>
          <span className="text-xs text-muted-foreground">this month</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Avg Rating:</span>
          <span className="text-sm font-bold text-asp-yellow">{'⭐'.repeat(Math.floor(REP_STATS.avgRating))} {REP_STATS.avgRating}</span>
        </div>
      </div>
    </div>
  );
};

export default RepStats;
