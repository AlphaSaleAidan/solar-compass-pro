import { useState, useRef, useCallback, useMemo } from 'react';
import { Dices, Ticket, Sparkles, Package, DollarSign, QrCode, Palmtree, ShoppingBag, Trash2, Star } from 'lucide-react';
import { SPIN_PRIZES, SPIN_TIERS, TICKET_EARNING_RULES, REP_STATS } from '@/data/mockData';

interface InventoryItem {
  name: string;
  icon: string;
  value: number;
  tier: string;
  sellValue: number;
}

const ShopSpin = () => {
  const [tickets, setTickets] = useState(REP_STATS.ticketBalance);
  const [selectedTier, setSelectedTier] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<typeof SPIN_PRIZES[0] | null>(null);
  const [alphaCash, setAlphaCash] = useState(2450);
  const [cashBonuses, setCashBonuses] = useState([
    { id: 1, amount: 85, redeemed: false, label: 'Cash Bonus $85' },
    { id: 2, amount: 50, redeemed: false, label: 'Cash Bonus $50' },
  ]);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { name: 'ASP T-Shirt', icon: '👕', value: 40, tier: 'normal', sellValue: 25 },
    { name: 'ASP Hat', icon: '🧢', value: 25, tier: 'normal', sellValue: 15 },
    { name: 'AirPods', icon: '🎧', value: 120, tier: 'golden', sellValue: 80 },
    { name: 'ASP Hoodie', icon: '🧥', value: 65, tier: 'normal', sellValue: 40 },
  ]);
  const trackRef = useRef<HTMLDivElement>(null);
  const trackItemsRef = useRef<typeof SPIN_PRIZES>([]);

  const tierMap: Record<string, string[]> = {
    'Normal Spin': ['normal'],
    'Golden Spin': ['normal', 'golden'],
    'Alpha Spin': ['normal', 'golden', 'alpha'],
    'Super Alpha Spin': ['normal', 'golden', 'alpha', 'super_alpha'],
  };

  const tier = SPIN_TIERS[selectedTier];
  const eligiblePrizes = SPIN_PRIZES.filter((p) => tierMap[tier.name]?.includes(p.tier));

  const getWeightedPrizes = useCallback(() => {
    if (tier.name === 'Super Alpha Spin') return eligiblePrizes;
    return eligiblePrizes.flatMap(p => {
      if (p.value >= 400) return [p];
      if (p.value >= 200) return [p, p];
      return [p, p, p, p];
    });
  }, [tier.name, eligiblePrizes]);

  // Build track items and store in ref
  const buildTrackItems = useCallback(() => {
    const items: typeof SPIN_PRIZES = [];
    for (let i = 0; i < 60; i++) {
      items.push(eligiblePrizes[i % eligiblePrizes.length]);
    }
    trackItemsRef.current = items;
    return items;
  }, [eligiblePrizes]);

  const trackItems = useMemo(() => buildTrackItems(), [buildTrackItems]);

  const spin = useCallback(() => {
    if (spinning || tickets < tier.tickets) return;
    setTickets((t) => t - tier.tickets);
    setSpinning(true);
    setWonPrize(null);

    const weightedPrizes = getWeightedPrizes();
    const winner = weightedPrizes[Math.floor(Math.random() * weightedPrizes.length)];
    const winIndex = 35 + Math.floor(Math.random() * 10);

    // Update the ref AND force re-render by updating state
    const newTrackItems = [...trackItemsRef.current];
    newTrackItems[winIndex] = winner;
    trackItemsRef.current = newTrackItems;

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
      // Add to inventory
      setInventory(prev => [...prev, {
        name: winner.name,
        icon: winner.icon,
        value: winner.value,
        tier: winner.tier,
        sellValue: Math.round(winner.value * 0.6),
      }]);
      // Add cash bonuses to cash bonus section
      if (winner.name.startsWith('Cash Bonus')) {
        setCashBonuses(prev => [...prev, {
          id: Date.now(),
          amount: winner.value,
          redeemed: false,
          label: winner.name,
        }]);
      }
    }, 4200);
  }, [spinning, tickets, tier, getWeightedPrizes]);

  const sellItem = (index: number) => {
    const item = inventory[index];
    setAlphaCash(prev => prev + item.sellValue);
    setInventory(prev => prev.filter((_, i) => i !== index));
  };

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

  const displayTrackItems = trackItemsRef.current.length > 0 ? trackItemsRef.current : trackItems;

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
          {displayTrackItems.map((item, i) => (
            <div
              key={`${i}-${item.name}`}
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
              ~${wonPrize.value} value · Added to Inventory
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

      {/* ═══════ INVENTORY SECTION ═══════ */}
      <div className="mt-5 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Your Inventory</h4>
          </div>
        </div>

        {/* Alpha Cash Balance */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/25 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-[10px] text-primary font-bold tracking-wider uppercase">Alpha Cash Balance</div>
                <div className="text-2xl font-black text-primary">${alphaCash.toLocaleString()}</div>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground text-right">
              Earn by selling items<br/>or winning cash bonuses
            </div>
          </div>
        </div>

        {/* Cash Bonuses */}
        {cashBonuses.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <QrCode className="w-3.5 h-3.5 text-asp-yellow" />
              <span className="text-[10px] font-bold text-asp-yellow tracking-wider uppercase">Cash Bonuses</span>
            </div>
            <div className="space-y-1.5">
              {cashBonuses.map((cb) => (
                <div key={cb.id} className="flex items-center justify-between py-2 px-3 bg-asp-yellow/5 border border-asp-yellow/15 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-asp-yellow" />
                    <span className="text-xs font-bold text-foreground">{cb.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-asp-yellow">${cb.amount}</span>
                    {!cb.redeemed ? (
                      <button className="px-2 py-1 bg-asp-yellow/15 border border-asp-yellow/30 rounded text-[9px] font-bold text-asp-yellow hover:bg-asp-yellow/25 transition-colors flex items-center gap-1">
                        <QrCode className="w-3 h-3" /> Show QR
                      </button>
                    ) : (
                      <span className="text-[9px] text-muted-foreground font-bold">Redeemed</span>
                    )}
                  </div>
                </div>
              ))}
              <div className="text-[9px] text-muted-foreground px-1">One-time QR code — manager scans to verify payment</div>
            </div>
          </div>
        )}

        {/* Owned Items */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Owned Items</span>
          </div>
          {inventory.length > 0 ? (
            <div className="space-y-1.5">
              {inventory.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-bg3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-foreground">{item.name}</span>
                      <div className="text-[9px] text-muted-foreground">~${item.value} value</div>
                    </div>
                  </div>
                  <button
                    onClick={() => sellItem(i)}
                    className="px-2.5 py-1 bg-primary/10 border border-primary/25 rounded text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Sell for ${item.sellValue}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-4 bg-bg3 rounded-lg">No items yet — spin to win!</div>
          )}
        </div>

        {/* Mystery Vacations */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Palmtree className="w-3.5 h-3.5 text-asp-green" />
            <span className="text-[10px] font-bold text-asp-green tracking-wider uppercase">Mystery Vacations</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-asp-yellow/10 to-asp-yellow/5 border border-asp-yellow/20 rounded-xl p-4 text-center">
              <Palmtree className="w-8 h-8 text-asp-yellow mx-auto mb-2" />
              <div className="text-sm font-black text-foreground">Mystery Vacation I</div>
              <div className="text-[10px] text-muted-foreground mb-2">Destination revealed upon purchase!</div>
              <div className="text-lg font-black text-asp-yellow mb-2">$5,000</div>
              <div className="text-[9px] text-muted-foreground mb-2">Alpha Cash</div>
              <button
                disabled={alphaCash < 5000}
                className="w-full py-2 bg-asp-yellow/15 border border-asp-yellow/30 rounded-lg text-xs font-bold text-asp-yellow hover:bg-asp-yellow/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {alphaCash >= 5000 ? 'Redeem Vacation' : `Need $${(5000 - alphaCash).toLocaleString()} more`}
              </button>
            </div>
            <div className="bg-gradient-to-br from-asp-purple/10 to-asp-purple/5 border border-asp-purple/20 rounded-xl p-4 text-center">
              <Star className="w-8 h-8 text-asp-purple mx-auto mb-2" />
              <div className="text-sm font-black text-foreground">Mystery Vacation II</div>
              <div className="text-[10px] text-muted-foreground mb-2">Premium destination — the ultimate reward!</div>
              <div className="text-lg font-black text-asp-purple mb-2">$10,000</div>
              <div className="text-[9px] text-muted-foreground mb-2">Alpha Cash</div>
              <button
                disabled={alphaCash < 10000}
                className="w-full py-2 bg-asp-purple/15 border border-asp-purple/30 rounded-lg text-xs font-bold text-asp-purple hover:bg-asp-purple/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {alphaCash >= 10000 ? 'Redeem Vacation' : `Need $${(10000 - alphaCash).toLocaleString()} more`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopSpin;
