import { Trophy, Medal, Award, Ticket, Loader2 } from 'lucide-react';
import { useLeaderboard, LeaderboardEntry } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { RANKINGS } from '@/data/mockData';

const RankingsTab = () => {
  const { user } = useAuth();
  const isDemo = user?.isDemo;
  const { entries, loading } = useLeaderboard();

  // Use mock data for demo, live data for production
  const rankings: LeaderboardEntry[] = isDemo
    ? RANKINGS.map((r, i) => ({
        id: `demo-${i}`,
        user_id: `demo-${i}`,
        user_name: r.name,
        deals_count: r.deals,
        installs_count: r.installs,
        revenue: r.revenue,
        rank: r.rank,
        ticketBonus: r.ticketBonus,
      }))
    : entries;

  if (loading && !isDemo) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const podiumEntries = rankings.length >= 3
    ? [rankings[1], rankings[0], rankings[2]]
    : rankings.slice(0, 3);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-asp-yellow" />
        <h2 className="text-lg font-black text-foreground">Company Rankings</h2>
        {!isDemo && (
          <span className="ml-auto text-[10px] text-muted-foreground font-medium bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
          </span>
        )}
      </div>

      {/* Top 3 Podium */}
      {podiumEntries.length >= 3 && (
        <div className="flex gap-4 items-end justify-center mb-6">
          {podiumEntries.map((r, i) => {
            const heights = ['h-32', 'h-40', 'h-28'];
            const colors = ['bg-gray-400', 'bg-asp-yellow', 'bg-orange-400'];
            const icons = [Medal, Trophy, Award];
            const Icon = icons[i];
            return (
              <div key={r.user_id} className="flex flex-col items-center gap-2 w-36">
                <Icon className={`w-8 h-8 ${i === 1 ? 'text-asp-yellow' : i === 0 ? 'text-gray-400' : 'text-orange-400'}`} />
                <div className="text-sm font-extrabold text-foreground truncate max-w-full">{r.user_name}</div>
                <div className="text-xs text-muted-foreground">{r.deals_count} deals · {r.installs_count} installs</div>
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

      {/* Ticket Bonus Info */}
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

      {/* Empty state */}
      {rankings.length === 0 && !isDemo && (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No rankings yet</p>
          <p className="text-xs mt-1">Rankings update in real-time when deals are approved clean</p>
        </div>
      )}

      {/* Full Table */}
      {rankings.length > 0 && (
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
              {rankings.map((r) => {
                const rank = r.rank || 0;
                const isCurrentUser = r.user_id === user?.id;
                return (
                  <tr key={r.user_id} className={`hover:bg-white/[0.015] transition-colors ${rank <= 3 ? 'bg-asp-yellow/[0.03]' : ''} ${isCurrentUser ? 'ring-1 ring-inset ring-primary/30' : ''}`}>
                    <td className="px-4 py-3 border-b border-border">
                      <span className={`text-sm font-black ${rank <= 3 ? 'text-asp-yellow' : 'text-foreground'}`}>#{rank}</span>
                    </td>
                    <td className="px-4 py-3 border-b border-border text-sm font-bold text-foreground">
                      {r.user_name}
                      {isCurrentUser && <span className="ml-1.5 text-[9px] text-primary font-extrabold">(YOU)</span>}
                    </td>
                    <td className="px-4 py-3 border-b border-border text-sm text-muted-foreground">{r.deals_count}</td>
                    <td className="px-4 py-3 border-b border-border text-sm text-muted-foreground">{r.installs_count}</td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RankingsTab;
