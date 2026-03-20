import { PROJECTS, MILESTONES } from '@/data/mockData';

const Pipeline = () => {
  const statusColors: Record<string, string> = {
    active: 'bg-asp-green/15 text-asp-green border-asp-green/30',
    delayed: 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30',
    on_hold: 'bg-asp-red/15 text-asp-red border-asp-red/30',
    completed: 'bg-primary/15 text-primary border-primary/30',
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white">📊 Pipeline Overview</h2>
        <span className="text-xs text-muted-foreground">{PROJECTS.length} active projects</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PROJECTS.map((p) => (
          <div key={p.id} className="bg-bg2 border border-border rounded-xl overflow-hidden hover:border-border2 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-200">
            {/* Milestone strip */}
            <div className="flex gap-px h-1">
              {Array.from({ length: p.totalMilestones }).map((_, i) => (
                <div key={i} className={`flex-1 ${i < p.currentMilestone ? 'bg-primary' : i === p.currentMilestone ? 'bg-primary/40' : 'bg-border'}`} />
              ))}
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-base font-extrabold text-white">{p.customerName}</div>
                  <div className="text-[10px] text-muted-foreground font-bold tracking-wider">{p.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-primary">${(p.contractValue / 1000).toFixed(1)}K</div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase border ${statusColors[p.status]}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 mb-3 text-xs text-muted-foreground">
                <div>⚡ <strong className="text-foreground">{p.systemSize}</strong></div>
                <div>🔋 <strong className="text-foreground">{p.battery || 'None'}</strong></div>
                <div>📍 <strong className="text-foreground">{p.address.split(',')[1]?.trim()}</strong></div>
                <div>💰 <strong className="text-foreground">${p.soldPPW}/W</strong></div>
              </div>

              {/* Current milestone */}
              <div className="bg-bg3 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] text-muted-foreground font-bold tracking-wide uppercase">Current Stage</span>
                  <span className="text-xs font-extrabold text-primary">{p.stage}</span>
                </div>
                <div className="flex gap-1">
                  {MILESTONES.map((_, i) => (
                    <div
                      key={i}
                      className={`h-5 w-7 rounded flex items-center justify-center text-[9px] font-extrabold ${
                        i < p.currentMilestone ? 'bg-primary text-primary-foreground' : i === p.currentMilestone ? 'bg-primary/20 text-primary border border-primary' : 'bg-bg4 text-muted-foreground'
                      }`}
                    >
                      M{i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer info */}
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>📧 {p.email} · 📱 {p.phone}</div>
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                <div className="text-[11px] text-muted-foreground">
                  <strong className="text-foreground">{p.repName}</strong> · Rep
                </div>
                <div className="text-[11px] text-muted-foreground text-right">
                  <strong className="text-foreground">{p.installerName}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pipeline;
