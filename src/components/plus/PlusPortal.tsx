import { PROJECTS, MILESTONES } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

const PlusPortal = () => {
  const { user } = useAuth();
  const isFinancier = user?.role === 'financier';

  const totalCV = PROJECTS.reduce((s, p) => s + p.contractValue, 0);
  const activeCount = PROJECTS.filter((p) => p.status === 'active').length;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase mb-1.5">📊 Total Projects</div>
          <div className="text-2xl font-black text-foreground">{PROJECTS.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase mb-1.5">✅ Active</div>
          <div className="text-2xl font-black text-primary">{activeCount}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase mb-1.5">💰 Total Value</div>
          <div className="text-2xl font-black text-primary">${(totalCV / 1000000).toFixed(2)}M</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-[10px] text-muted-foreground font-bold tracking-[1.5px] uppercase mb-1.5">📅 Avg Days to PTO</div>
          <div className="text-2xl font-black text-foreground">28d</div>
        </div>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PROJECTS.map((p) => {
          const statusColors: Record<string, string> = {
            active: 'bg-green-100 text-green-700 border-green-200',
            delayed: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            on_hold: 'bg-red-100 text-red-700 border-red-200',
            completed: 'bg-teal-100 text-teal-700 border-teal-200',
          };

          return (
            <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              {/* Milestone strip */}
              <div className="flex gap-px h-1">
                {Array.from({ length: p.totalMilestones }).map((_, i) => (
                  <div key={i} className={`flex-1 ${i < p.currentMilestone ? 'bg-primary' : i === p.currentMilestone ? 'bg-primary/40' : 'bg-border'}`} />
                ))}
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-base font-extrabold text-card-foreground">{p.customerName}</div>
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
                  <div>⚡ <strong className="text-card-foreground">{p.systemSize}</strong></div>
                  <div>🔋 <strong className="text-card-foreground">{p.battery || 'None'}</strong></div>
                  <div>📍 <strong className="text-card-foreground">{p.address.split(',')[1]?.trim()}</strong></div>
                  <div>📋 Permit: <strong className="text-card-foreground capitalize">{p.permitStatus}</strong></div>
                </div>

                {/* Milestone tracker */}
                <div className="bg-muted rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] text-muted-foreground font-bold tracking-wide uppercase">Current Stage</span>
                    <span className="text-xs font-extrabold text-primary">{p.stage}</span>
                  </div>
                  <div className="flex gap-1">
                    {MILESTONES.map((m, i) => (
                      <div
                        key={i}
                        className={`h-5 flex-1 rounded flex items-center justify-center text-[8px] font-extrabold ${
                          i < p.currentMilestone ? 'bg-primary text-primary-foreground' : i === p.currentMilestone ? 'bg-primary/20 text-primary border border-primary' : 'bg-muted text-muted-foreground border border-border'
                        }`}
                        title={m}
                      >
                        M{i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>📄 Documents: {p.documentsSignedCount}/{p.totalDocuments} signed</span>
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(p.documentsSignedCount / p.totalDocuments) * 100}%` }} />
                  </div>
                </div>

                {isFinancier && (
                  <div className="bg-primary/5 border border-primary/15 rounded-lg p-2.5 mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Funded</span>
                      <span className="font-bold text-primary">${Math.round(p.contractValue * (p.currentMilestone / p.totalMilestones)).toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-gradient-to-r from-teal2 to-primary rounded-full" style={{ width: `${(p.currentMilestone / p.totalMilestones) * 100}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                  <div className="text-[11px] text-muted-foreground">
                    Rep: <strong className="text-card-foreground">{p.repName}</strong>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Installer: <strong className="text-card-foreground">{p.installerName}</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlusPortal;
