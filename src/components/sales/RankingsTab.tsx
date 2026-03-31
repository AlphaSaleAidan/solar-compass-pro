import { Trophy, Medal, Award, Ticket, Users } from 'lucide-react';

const RankingsTab = () => {
  // Rankings will be populated from real platform data
  // For now, show empty state until real sales reps are onboarded
  const rankings: { rank: number; name: string; deals: number; installs: number; revenue: number; ticketBonus: string }[] = [];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-asp-yellow" />
        <h2 className="text-lg font-black text-foreground">Company Rankings</h2>
      </div>

      {/* Ticket Bonus Info - always visible as reference */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-asp-yellow/10 border border-asp-yellow/25 rounded-xl p-4 text-center">
          <div className="text-sm font-bold text-asp-yellow">Top 1-3</div>
          <div className="text-2xl font-black text-asp-yellow">200%</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Ticket className="w-3 h-3 text-muted-foreground" />
            <div className="text-[10px] text-muted-foreground">Ticket Earning</div>
          </div>
        </div>
        <div className="bg-primary/10 border border-primary/25 rounded-xl p-4 text-center">
          <div className="text-sm font-bold text-primary">Top 4-10</div>
          <div className="text-2xl font-black text-primary">100%</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Ticket className="w-3 h-3 text-muted-foreground" />
            <div className="text-[10px] text-muted-foreground">Ticket Earning</div>
          </div>
        </div>
        <div className="bg-asp-blue/10 border border-asp-blue/25 rounded-xl p-4 text-center">
          <div className="text-sm font-bold text-asp-blue">Top 11-20</div>
          <div className="text-2xl font-black text-asp-blue">50%</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Ticket className="w-3 h-3 text-muted-foreground" />
            <div className="text-[10px] text-muted-foreground">Ticket Earning</div>
          </div>
        </div>
      </div>

      {rankings.length === 0 ? (
        <div className="bg-bg2 border border-border rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-bold">No rankings data yet</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Rankings will populate as sales reps close deals and complete installs on the platform.</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {rankings.length >= 3 && (
            <div className="flex gap-4 items-end justify-center mb-6">
              {[rankings[1], rankings[0], rankings[2]].map((r, i) => {
                const heights = ['h-32', 'h-40', 'h-28'];
                const colors = ['bg-gray-400', 'bg-asp-yellow', 'bg-orange-400'];
                const icons = [Medal, Trophy, Award];
                const Icon = icons[i];
                return (
                  <div key={r.rank} className="flex flex-col items-center gap-2 w-36">
                    <Icon className={`w-8 h-8 ${i === 1 ? 'text-asp-yellow' : i === 0 ? 'text-gray-400' : 'text-orange-400'}`} />
                    <div className="text-sm font-extrabold text-foreground">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.deals} deals · {r.installs} installs</div>
                    <div className={`w-full ${heights[i]} ${colors[i]} rounded-t-lg flex items-center justify-center`}>
                      <div className="text-center">
                        <div className="text-lg font-black text-black">${(r.revenue / 1000).toFixed(0)}K</div>
                        <div className="text-[9px] font-bold text-black/60 uppercase">Revenue</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Table */}
          <div className="bg-bg2 border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-bg3">
                  {['Rank', 'Name', 'Deals', 'Installs', 'Revenue', 'Ticket Bonus'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] text-muted-foreground font-extrabold tracking-[1.5px] uppercase border-b border-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rankings.map((r) => (
                  <tr key={r.rank} className={`hover:bg-white/[0.015] transition-colors ${r.rank <= 3 ? 'bg-asp-yellow/[0.03]' : ''}`}>
                    <td className="px-4 py-3 border-b border-border">
                      <span className={`text-sm font-black ${r.rank <= 3 ? 'text-asp-yellow' : 'text-foreground'}`}>#{r.rank}</span>
                    </td>
                    <td className="px-4 py-3 border-b border-border text-sm font-bold text-foreground">{r.name}</td>
                    <td className="px-4 py-3 border-b border-border text-sm text-muted-foreground">{r.deals}</td>
                    <td className="px-4 py-3 border-b border-border text-sm text-muted-foreground">{r.installs}</td>
                    <td className="px-4 py-3 border-b border-border text-sm font-bold text-primary">${r.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 border-b border-border">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        r.ticketBonus === '200%' ? 'bg-asp-yellow/15 text-asp-yellow border-asp-yellow/30' :
                        r.ticketBonus === '100%' ? 'bg-primary/15 text-primary border-primary/30' :
                        'bg-asp-blue/15 text-asp-blue border-asp-blue/30'
                      }`}>
                        {r.ticketBonus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default RankingsTab;
