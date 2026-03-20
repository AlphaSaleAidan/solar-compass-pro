import { RANKINGS } from '@/data/mockData';

const RankingsTab = () => {
  return (
    <div className="space-y-5 animate-fade-in-up">
      <h2 className="text-lg font-black text-white">🏆 Company Rankings</h2>

      {/* Top 3 Podium */}
      <div className="flex gap-4 items-end justify-center mb-6">
        {[RANKINGS[1], RANKINGS[0], RANKINGS[2]].map((r, i) => {
          const heights = ['h-32', 'h-40', 'h-28'];
          const colors = ['bg-gray-400', 'bg-asp-yellow', 'bg-orange-400'];
          const medals = ['🥈', '🥇', '🥉'];
          const order = [1, 0, 2];
          return (
            <div key={r.rank} className="flex flex-col items-center gap-2 w-36">
              <span className="text-3xl">{medals[i]}</span>
              <div className="text-sm font-extrabold text-white">{r.name}</div>
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

      {/* Ticket Bonus Info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-asp-yellow/10 border border-asp-yellow/25 rounded-xl p-4 text-center">
          <div className="text-sm font-bold text-asp-yellow">Top 1-3</div>
          <div className="text-2xl font-black text-asp-yellow">200%</div>
          <div className="text-[10px] text-muted-foreground">Ticket Earning</div>
        </div>
        <div className="bg-primary/10 border border-primary/25 rounded-xl p-4 text-center">
          <div className="text-sm font-bold text-primary">Top 4-10</div>
          <div className="text-2xl font-black text-primary">100%</div>
          <div className="text-[10px] text-muted-foreground">Ticket Earning</div>
        </div>
        <div className="bg-asp-blue/10 border border-asp-blue/25 rounded-xl p-4 text-center">
          <div className="text-sm font-bold text-asp-blue">Top 11-20</div>
          <div className="text-2xl font-black text-asp-blue">50%</div>
          <div className="text-[10px] text-muted-foreground">Ticket Earning</div>
        </div>
      </div>

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
            {RANKINGS.map((r) => (
              <tr key={r.rank} className={`hover:bg-white/[0.015] transition-colors ${r.rank <= 3 ? 'bg-asp-yellow/[0.03]' : ''}`}>
                <td className="px-4 py-3 border-b border-border">
                  <span className={`text-sm font-black ${r.rank <= 3 ? 'text-asp-yellow' : 'text-foreground'}`}>#{r.rank}</span>
                </td>
                <td className="px-4 py-3 border-b border-border text-sm font-bold text-white">{r.name}</td>
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
    </div>
  );
};

export default RankingsTab;
