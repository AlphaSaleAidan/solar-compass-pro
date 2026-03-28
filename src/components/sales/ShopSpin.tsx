import { useState, useRef, useCallback } from 'react';
import { Dices, Ticket, Trophy, Sparkles } from 'lucide-react';
import { SPIN_PRIZES, SPIN_TIERS, TICKET_EARNING_RULES, REP_STATS } from '@/data/mockData';

const ShopSpin = () => {
  const [tickets, setTickets] = useState(REP_STATS.ticketBalance);
  const [selectedTier, setSelectedTier] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<typeof SPIN_PRIZES[0] | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const tierMap: Record<string, string[]> = {
    'Normal Spin': ['normal'],
    'Golden Spin': ['normal', 'golden'],
    'Alpha Spin': ['normal', 'golden', 'alpha'],
    'Super Alpha Spin': ['normal', 'golden', 'alpha', 'super_alpha'],
  };

  const tier = SPIN_TIERS[selectedTier];
  const eligiblePrizes = SPIN_PRIZES.filter((p) => tierMap[tier.name]?.includes(p.tier));

  // Weight prizes: for non-Super Alpha, drastically reduce $400+ items
  const getWeightedPrizes = () => {
    if (tier.name === 'Super Alpha Spin') return eligiblePrizes;
    return eligiblePrizes.flatMap(p => {
      if (p.value >= 400) return [p]; // 1x weight for expensive
      if (p.value >= 200) return [p, p]; // 2x
      return [p, p, p, p]; // 4x weight for cheap items
    });
  };

  const weightedPrizes = getWeightedPrizes();

  const trackItems: typeof SPIN_PRIZES = [];
  for (let i = 0; i < 60; i++) {
    trackItems.push(eligiblePrizes[i % eligiblePrizes.length]);
  }

  const spin = useCallback(() => {
    if (spinning || tickets < tier.tickets) return;
    setTickets((t) => t - tier.tickets);
    setSpinning(true);
    setWonPrize(null);

    // Pick winner from weighted pool
    const winner = weightedPrizes[Math.floor(Math.random() * weightedPrizes.length)];
    const winIndex = 35 + Math.floor(Math.random() * 10);
    // Replace the track item at winIndex with the winner
    trackItems[winIndex] = winner;

    const itemWidth = 102;
    const offset = winIndex * itemWidth - 200 + Math.random() * 60;

    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = 'translateX(0)';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (trackRef.current) {
            trackRef.current.style.transition = 'transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)';
            trackRef.current.style.transform = `translateX(-${offset}px)`;
          }
        });
      });
    }

    setTimeout(() => {
      setSpinning(false);
      setWonPrize(winner);
    }, 4200);
  }, [spinning, tickets, tier, trackItems, weightedPrizes]);

  const tierColors: Record<string, string> = {
    gray: 'bg-gray-500/15 border-gray-500/30 text-gray-400',
    yellow: 'bg-asp-yellow/12 border-asp-yellow/35 text-asp-yellow',
    teal: 'bg-primary/12 border-primary/30 text-primary',
    purple: 'bg-asp-purple/12 border-asp-purple/30 text-asp-purple',
  };

  const itemTierColors: Record<string, string> = {
    normal: 'bg-gray-500/15 border-gray-500/30',
    golden: 'bg-asp-yellow/12 border-asp-yellow/35',
    alpha: 'bg-primary/12 border-primary/30',
    super_alpha: 'bg-asp-purple/12 border-asp-purple/30',
  };

  return (
    <div className="bg-bg2 border border-border rounded-xl p-5 animate-fade-in-up stagger-2">
      <div className="flex items-center gap-2.5 mb-1">
        <Dices className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-black text-foreground">ASP Rewards Shop</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-5">Spend tickets to spin for prizes. Higher tiers unlock better rewards!</p>

      {/* Spin Tier Selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {SPIN_TIERS.map((t, i) => (
          <button
            key={t.name}
            onClick={() => !spinning && setSelectedTier(i)}
            className={`px-3 py-2 rounded-lg text-[11px] font-bold border transition-all duration-150 flex items-center gap-1 ${
              selectedTier === i ? tierColors[t.color] + ' shadow-lg' : 'bg-bg3 border-border text-muted-foreground hover:border-border2'
            }`}
          >
            {t.name} ({t.tickets} <Ticket className="w-3 h-3 inline" />)
          </button>
        ))}
      </div>

      {/* Spin Track */}
      <div className="relative overflow-hidden rounded-lg border-2 border-border2 bg-bg3 h-[110px]">
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, hsl(220, 22%, 11%), transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(270deg, hsl(220, 22%, 11%), transparent)' }} />
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary z-20 -translate-x-1/2 shadow-[0_0_12px_hsl(177,100%,41%)]">
          <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-primary text-xs">▼</span>
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-primary text-xs">▲</span>
        </div>
        <div ref={trackRef} className="flex items-center gap-1.5 h-full py-1.5 will-change-transform">
          {trackItems.map((item, i) => (
            <div
              key={i}
              className={`shrink-0 w-24 h-[90px] rounded-lg flex flex-col items-center justify-center gap-1 border-[1.5px] ${itemTierColors[item.tier]}`}
            >
              <span className="text-2xl leading-none">{item.icon}</span>
              <span className="text-[10px] font-bold text-center leading-tight px-1 text-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 flex items-center gap-4">
        <div className="px-4 py-2 bg-asp-yellow/10 border border-asp-yellow/25 rounded-lg flex items-center gap-2">
          <span className="text-xl font-black text-asp-yellow">{tickets}</span>
          <span className="text-[11px] text-muted-foreground leading-tight">Tickets<br/>Available</span>
        </div>
        <button
          onClick={spin}
          disabled={spinning || tickets < tier.tickets}
          className={`flex-1 py-3.5 rounded-lg text-sm font-black tracking-wide flex items-center justify-center gap-2 transition-all duration-200 ${
            spinning
              ? 'bg-bg3 text-primary border border-primary'
              : 'bg-gradient-to-br from-primary to-teal2 text-primary-foreground hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,212,200,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none'
          }`}
        >
          <Dices className="w-4 h-4" />
          {spinning ? 'Spinning...' : `SPIN (${tier.tickets} ticket${tier.tickets > 1 ? 's' : ''})`}
        </button>
      </div>

      {/* Win Banner */}
      {wonPrize && (
        <div className="mt-4 p-4 rounded-lg border border-primary bg-primary/5 flex items-center gap-3.5 animate-scale-in">
          <span className="text-4xl">{wonPrize.icon}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-asp-yellow" />
              <span className="text-base font-black text-foreground">{wonPrize.name}</span>
            </div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-primary mt-0.5">
              ~${wonPrize.value} value
            </div>
          </div>
        </div>
      )}

      {/* Ticket Earning Rules */}
      <div className="mt-5 pt-4 border-t border-border">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Ticket className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">How to Earn Tickets</h4>
        </div>
        <div className="space-y-1.5">
          {TICKET_EARNING_RULES.map((r) => (
            <div key={r.action} className="flex items-center justify-between py-1.5 px-3 bg-bg3 rounded-md">
              <span className="text-xs text-foreground">{r.action}</span>
              <span className="text-xs font-bold text-primary flex items-center gap-1">+{r.tickets} <Ticket className="w-3 h-3" /></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopSpin;
