import { useState, useRef, useCallback, useMemo, useEffect, useLayoutEffect } from 'react';
import { Dices, Ticket, Sparkles, Package, DollarSign, QrCode, Palmtree, ShoppingBag, Trash2, Star } from 'lucide-react';
import { SPIN_PRIZES, SPIN_TIERS, TICKET_EARNING_RULES } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/hooks/useGamification';

const ShopSpin = () => {
  const { user } = useAuth();
  const isDemo = user?.isDemo;
  const gamification = useGamification();

  // Demo-only state fallbacks
  const [demoTickets, setDemoTickets] = useState(7);
  const [demoAlphaCash, setDemoAlphaCash] = useState(2450);
  const [demoCashBonuses, setDemoCashBonuses] = useState([
    { id: 1, amount: 85, redeemed: false, label: 'Cash Drop $85' },
    { id: 2, amount: 50, redeemed: false, label: 'Cash Drop $50' },
  ]);
  const [demoInventory, setDemoInventory] = useState([
    { id: 'd1', name: 'ASP Stealth Tee', icon: '🖤', value: 40, tier: 'normal', sellValue: 25 },
    { id: 'd2', name: 'ASP Snapback', icon: '⚡', value: 25, tier: 'normal', sellValue: 15 },
    { id: 'd3', name: 'AirPods Pro', icon: '🎯', value: 150, tier: 'golden', sellValue: 100 },
    { id: 'd4', name: 'ASP Elite Hoodie', icon: '👑', value: 65, tier: 'normal', sellValue: 40 },
  ]);

  const tickets = isDemo ? demoTickets : gamification.state.tickets;
  const alphaCash = isDemo ? demoAlphaCash : gamification.state.alpha_cash;
  const cashBonuses = isDemo ? demoCashBonuses : [];
  const inventoryItems = isDemo
    ? demoInventory.map(i => ({ id: i.id, item_name: i.name, item_value: i.value, icon: i.icon, tier: i.tier, sellValue: i.sellValue }))
    : gamification.inventory.map(i => ({ id: i.id, item_name: i.item_name, item_value: i.item_value, icon: '🎁', tier: 'normal', sellValue: Math.round(i.item_value * 0.6) }));

  const [selectedTier, setSelectedTier] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<typeof SPIN_PRIZES[0] | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // ── Deterministic track state ──────────────────────────────────────
  // Instead of using a ref + key remount (which causes race conditions),
  // we use state for the track items and a separate trigger for animation.
  const [trackItems, setTrackItems] = useState<typeof SPIN_PRIZES>([]);
  const [animationTarget, setAnimationTarget] = useState<{
    offset: number;
    triggered: boolean;
  } | null>(null);
  const chosenPrizeRef = useRef<typeof SPIN_PRIZES[0] | null>(null);

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

  // Build initial track when tier changes
  useEffect(() => {
    const items: typeof SPIN_PRIZES = [];
    for (let i = 0; i < 60; i++) {
      items.push(eligiblePrizes[i % eligiblePrizes.length]);
    }
    setTrackItems(items);
    // Reset track position when tier changes
    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = 'translateX(0)';
    }
  }, [selectedTier]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Animation effect — fires AFTER React renders the new track items ──
  useLayoutEffect(() => {
    if (!animationTarget || animationTarget.triggered) return;

    const track = trackRef.current;
    if (!track) return;
    const container = track.parentElement;
    if (!container) return;

    const LANDING_INDEX = 40;
    const children = track.children;
    const targetEl = children[LANDING_INDEX] as HTMLElement | undefined;
    if (!targetEl) return;

    const containerWidth = container.clientWidth;
    const pointerX = containerWidth / 2;
    const targetCenter = targetEl.offsetLeft + targetEl.offsetWidth / 2;
    const offset = targetCenter - pointerX;

    // Reset position instantly
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';

    // Force layout recalc then animate
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    track.offsetHeight;

    requestAnimationFrame(() => {
      if (trackRef.current) {
        trackRef.current.style.transition = 'transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)';
        trackRef.current.style.transform = `translateX(-${offset}px)`;
      }
    });

    setAnimationTarget(prev => prev ? { ...prev, triggered: true } : null);
  }, [animationTarget, trackItems]);

  const LANDING_INDEX = 40;

  const spin = useCallback(async () => {
    if (spinning || tickets < tier.tickets) return;

    // Deduct tickets
    if (isDemo) {
      setDemoTickets(t => t - tier.tickets);
    } else {
      await gamification.spendTickets(tier.tickets);
    }

    setSpinning(true);
    setWonPrize(null);

    // Pick the winning prize
    const weightedPrizes = getWeightedPrizes();
    const chosenPrize = weightedPrizes[Math.floor(Math.random() * weightedPrizes.length)];
    chosenPrizeRef.current = chosenPrize;

    // Build a new randomised track with the winning prize placed at LANDING_INDEX
    const newItems: typeof SPIN_PRIZES = [];
    for (let i = 0; i < 60; i++) {
      if (i === LANDING_INDEX) {
        newItems.push(chosenPrize);
      } else {
        // Randomise surrounding items for visual variety (exclude the chosen prize's neighbors)
        const pool = eligiblePrizes.filter(p => p.name !== chosenPrize.name);
        newItems.push(pool.length > 0 ? pool[i % pool.length] : eligiblePrizes[i % eligiblePrizes.length]);
      }
    }
    // Place some copies of the winning prize nearby so it doesn't look suspicious
    const nearbySlots = [LANDING_INDEX - 7, LANDING_INDEX - 3, LANDING_INDEX + 4, LANDING_INDEX + 8];
    nearbySlots.forEach(slot => {
      if (slot >= 0 && slot < 60 && slot !== LANDING_INDEX) {
        newItems[slot] = chosenPrize;
      }
    });

    // Set the track items (triggers re-render), then trigger animation
    setTrackItems(newItems);
    setAnimationTarget({ offset: 0, triggered: false });

    // Award prize after animation completes
    setTimeout(async () => {
      const prize = chosenPrizeRef.current;
      if (!prize) return;

      setSpinning(false);
      setWonPrize(prize);

      // Add to inventory
      if (isDemo) {
        setDemoInventory(prev => [...prev, {
          id: `d-${Date.now()}`,
          name: prize.name,
          icon: prize.icon,
          value: prize.value,
          tier: prize.tier,
          sellValue: Math.round(prize.value * 0.6),
        }]);
        if (prize.name.includes('Cash Drop')) {
          setDemoCashBonuses(prev => [...prev, {
            id: Date.now(),
            amount: prize.value,
            redeemed: false,
            label: prize.name,
          }]);
        }
      } else {
        await gamification.addInventoryItem(prize.name, prize.value);
        if (prize.name.includes('Cash Drop') || prize.name.startsWith('Cash Bonus')) {
          await gamification.addCashBonus(prize.value);
        }
      }
    }, 4200);
  }, [spinning, tickets, tier, getWeightedPrizes, eligiblePrizes, isDemo, gamification]);

  const sellItem = async (itemId: string, sellValue: number) => {
    if (isDemo) {
      const idx = demoInventory.findIndex(i => i.id === itemId);
      if (idx >= 0) {
        setDemoAlphaCash(prev => prev + sellValue);
        setDemoInventory(prev => prev.filter((_, i) => i !== idx));
      }
    } else {
      await gamification.sellInventoryItem(itemId, sellValue);
    }
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

  // Streak boost display
  const boostPct = isDemo ? 0 : Math.round(gamification.getStreakBoost() * 100);

  return (
    <div className="bg-bg2 border border-border rounded-xl p-5 animate-fade-in-up stagger-2">
      <div className="flex items-center gap-2.5 mb-1">
        <Dices className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-black text-foreground">ASP Rewards Shop</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Spend tickets to spin for prizes. Higher tiers unlock better rewards!
        {boostPct > 0 && (
          <span className="ml-2 text-asp-blue font-bold">🔥 +{boostPct}% ticket boost active!</span>
        )}
      </p>

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
      <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-b from-bg3 to-bg2 h-[120px]">
        {/* Gradient edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-bg3 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-bg3 to-transparent" />
        {/* Center indicator */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[3px] bg-primary z-20 -translate-x-1/2 shadow-[0_0_16px_hsl(177,100%,41%),0_0_32px_hsl(177,100%,41%/0.3)]">
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-primary text-sm">▼</span>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-primary text-sm">▲</span>
        </div>
        <div ref={trackRef} className="flex items-center gap-2 h-full py-2 will-change-transform">
          {trackItems.map((item, i) => (
            <div
              key={`${i}-${item.name}`}
              className={`shrink-0 w-[100px] h-[100px] rounded-xl flex flex-col items-center justify-center gap-1.5 border-2 backdrop-blur-sm ${itemTierColors[item.tier]} hover:scale-105 transition-transform`}
            >
              <span className="text-3xl leading-none drop-shadow-lg">{item.icon}</span>
              <span className="text-[10px] font-bold text-center leading-tight px-1.5 text-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 flex items-center gap-4">
        <div className="px-4 py-2.5 bg-asp-yellow/10 border border-asp-yellow/25 rounded-xl flex items-center gap-2">
          <span className="text-2xl font-black text-asp-yellow">{tickets}</span>
          <span className="text-[11px] text-muted-foreground leading-tight">Tickets<br/>Available</span>
        </div>
        <button
          onClick={spin}
          disabled={spinning || tickets < tier.tickets}
          className={`flex-1 py-4 rounded-xl text-sm font-black tracking-wide flex items-center justify-center gap-2 transition-all duration-200 ${
            spinning
              ? 'bg-bg3 text-primary border-2 border-primary animate-pulse'
              : 'bg-gradient-to-br from-primary to-teal2 text-primary-foreground hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,212,200,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none'
          }`}
        >
          <Dices className="w-5 h-5" />
          {spinning ? 'Spinning...' : `SPIN (${tier.tickets} ticket${tier.tickets > 1 ? 's' : ''})`}
        </button>
      </div>

      {/* Win Banner */}
      {wonPrize && (
        <div className="mt-4 p-4 rounded-xl border-2 border-primary bg-gradient-to-r from-primary/10 to-primary/5 flex items-center gap-3.5 animate-scale-in">
          <span className="text-5xl drop-shadow-lg">{wonPrize.icon}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-asp-yellow" />
              <span className="text-lg font-black text-foreground">{wonPrize.name}</span>
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
          {boostPct > 0 && (
            <div className="flex items-center justify-between py-1.5 px-3 bg-asp-blue/10 border border-asp-blue/20 rounded-md">
              <span className="text-xs text-asp-blue font-bold">🔥 Streak Boost Active</span>
              <span className="text-xs font-bold text-asp-blue">+{boostPct}% all tickets</span>
            </div>
          )}
        </div>
      </div>

      {/* INVENTORY SECTION */}
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
                <div className="text-2xl font-black text-primary">${Math.round(alphaCash).toLocaleString()}</div>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground text-right">
              Earn by selling items<br/>or winning cash drops
            </div>
          </div>
        </div>

        {/* Cash Bonuses */}
        {cashBonuses.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <QrCode className="w-3.5 h-3.5 text-asp-yellow" />
              <span className="text-[10px] font-bold text-asp-yellow tracking-wider uppercase">Cash Drops</span>
            </div>
            <div className="space-y-1.5">
              {cashBonuses.map((cb: any) => (
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
            </div>
          </div>
        )}

        {/* Owned Items */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Owned Items</span>
          </div>
          {inventoryItems.length > 0 ? (
            <div className="space-y-1.5">
              {inventoryItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-bg3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon || '🎁'}</span>
                    <div>
                      <span className="text-xs font-bold text-foreground">{item.item_name}</span>
                      <div className="text-[9px] text-muted-foreground">~${item.item_value} value</div>
                    </div>
                  </div>
                  <button
                    onClick={() => sellItem(item.id, item.sellValue)}
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
