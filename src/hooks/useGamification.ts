import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface GamificationState {
  puzzle_pieces: number;
  puzzle_cycle: number;
  puzzle_prize_index: number;
  streak_days: number;
  streak_last_deal_date: string | null;
  tickets: number;
  alpha_cash: number;
  cash_bonuses: number;
}

export interface InventoryItem {
  id: string;
  item_name: string;
  item_value: number;
  won_at: string;
  sold: boolean;
}

const DEFAULT_STATE: GamificationState = {
  puzzle_pieces: 0,
  puzzle_cycle: 0,
  puzzle_prize_index: 0,
  streak_days: 0,
  streak_last_deal_date: null,
  tickets: 0,
  alpha_cash: 0,
  cash_bonuses: 0,
};

// Puzzle prizes — $200-400 average value, cycling through
export const PUZZLE_PRIZES = [
  { name: '$400 Dinner Card', icon: '🍽️', value: 400 },
  { name: 'Meta Ray-Bans', icon: '😎', value: 300 },
  { name: 'Apple Watch SE', icon: '⌚', value: 250 },
  { name: 'Yeti Cooler Bundle', icon: '🧊', value: 350 },
];

// Fixed 3-day puzzle cycle — epoch is April 1, 2026 at 00:01 local time
const PUZZLE_EPOCH = new Date(2026, 3, 1, 0, 1, 0, 0).getTime(); // Month is 0-indexed
const CYCLE_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in ms

export const getCurrentPuzzleCycle = () => {
  const now = Date.now();
  return Math.floor((now - PUZZLE_EPOCH) / CYCLE_DURATION_MS);
};

export const getNextCycleReset = () => {
  const cycle = getCurrentPuzzleCycle();
  return new Date(PUZZLE_EPOCH + (cycle + 1) * CYCLE_DURATION_MS);
};

export const getSecondsUntilReset = () => {
  return Math.max(0, Math.floor((getNextCycleReset().getTime() - Date.now()) / 1000));
};

export const useGamification = () => {
  const { user } = useAuth();
  const [state, setState] = useState<GamificationState>(DEFAULT_STATE);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;
  const isDemo = user?.isDemo;

  // Fetch or initialize gamification state
  useEffect(() => {
    if (!userId || isDemo) {
      setLoading(false);
      return;
    }

    const fetchState = async () => {
      // Try to get existing state
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching gamification state:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const loadedState: GamificationState = {
          puzzle_pieces: data.puzzle_pieces,
          puzzle_cycle: data.puzzle_cycle,
          puzzle_prize_index: data.puzzle_prize_index,
          streak_days: data.streak_days,
          streak_last_deal_date: data.streak_last_deal_date,
          tickets: data.tickets,
          alpha_cash: Number(data.alpha_cash),
          cash_bonuses: Number(data.cash_bonuses),
        };

        // Auto-reset puzzle if we're in a new 3-day cycle
        const currentCycle = getCurrentPuzzleCycle();
        if (currentCycle !== loadedState.puzzle_cycle) {
          loadedState.puzzle_pieces = 0;
          loadedState.puzzle_cycle = currentCycle;
          // Persist the reset
          await supabase
            .from('user_gamification')
            .update({ puzzle_pieces: 0, puzzle_cycle: currentCycle })
            .eq('user_id', userId);
        }

        setState(loadedState);
      } else {
        // Initialize new user with current cycle
        const currentCycle = getCurrentPuzzleCycle();
        const { error: insertError } = await supabase
          .from('user_gamification')
          .insert({ user_id: userId, puzzle_cycle: currentCycle });
        if (insertError) console.error('Error initializing gamification:', insertError);
        setState(prev => ({ ...prev, puzzle_cycle: currentCycle }));
      }
      setLoading(false);
    };

    const fetchInventory = async () => {
      const { data } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .eq('sold', false)
        .order('won_at', { ascending: false });

      if (data) setInventory(data);
    };

    fetchState();
    fetchInventory();
  }, [userId, isDemo]);

  // Persist state changes to DB
  const updateState = useCallback(async (updates: Partial<GamificationState>) => {
    const newState = { ...state, ...updates };
    setState(newState);

    if (!userId || isDemo) return;

    await supabase
      .from('user_gamification')
      .update(updates)
      .eq('user_id', userId);
  }, [state, userId, isDemo]);

  // Get streak ticket boost multiplier
  const getStreakBoost = useCallback(() => {
    if (state.streak_days >= 3) return 2.0; // 200% boost = 3x multiplier
    if (state.streak_days >= 2) return 1.0; // 100% boost = 2x multiplier
    if (state.streak_days >= 1) return 0.5; // 50% boost = 1.5x multiplier
    return 0;
  }, [state.streak_days]);

  // Earn tickets with streak boost applied
  const earnTickets = useCallback(async (baseAmount: number) => {
    const boost = getStreakBoost();
    const boosted = Math.round(baseAmount * (1 + boost));
    await updateState({ tickets: state.tickets + boosted });
    return boosted;
  }, [state.tickets, getStreakBoost, updateState]);

  // Record a deal — updates puzzle + streak
  const recordDeal = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const newPieces = state.puzzle_pieces + 1;
    let prizeWon: typeof PUZZLE_PRIZES[0] | null = null;

    const updates: Partial<GamificationState> = {};

    // Streak logic
    const lastDeal = state.streak_last_deal_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (lastDeal === today) {
      // Already counted today, don't increment streak again
    } else if (lastDeal === yesterday) {
      updates.streak_days = state.streak_days + 1;
    } else {
      updates.streak_days = 1;
    }
    updates.streak_last_deal_date = today;

    // Puzzle logic
    if (newPieces >= 4) {
      // Completed puzzle! Award prize
      prizeWon = PUZZLE_PRIZES[state.puzzle_prize_index % PUZZLE_PRIZES.length];
      updates.puzzle_pieces = 0;
      updates.puzzle_cycle = state.puzzle_cycle + 1;
      updates.puzzle_prize_index = (state.puzzle_prize_index + 1) % PUZZLE_PRIZES.length;

      // Add prize to rewards table
      if (userId && !isDemo) {
        await supabase.from('rewards').insert({
          user_id: userId,
          reward_type: 'puzzle_prize',
          reward_name: prizeWon.name,
          reward_value: prizeWon.value,
        });
      }
    } else {
      updates.puzzle_pieces = newPieces;
    }

    // Earn deal tickets (base 2, boosted by streak)
    const boost = getStreakBoost();
    const baseTickets = 2;
    const boostedTickets = Math.round(baseTickets * (1 + boost));
    updates.tickets = (state.tickets) + boostedTickets;

    await updateState(updates);
    return { prizeWon, boostedTickets };
  }, [state, userId, isDemo, updateState, getStreakBoost]);

  // Spend tickets
  const spendTickets = useCallback(async (amount: number) => {
    if (state.tickets < amount) return false;
    await updateState({ tickets: state.tickets - amount });
    return true;
  }, [state.tickets, updateState]);

  // Add inventory item
  const addInventoryItem = useCallback(async (itemName: string, itemValue: number) => {
    if (!userId || isDemo) {
      setInventory(prev => [...prev, { id: `local-${Date.now()}`, item_name: itemName, item_value: itemValue, won_at: new Date().toISOString(), sold: false }]);
      return;
    }

    const { data } = await supabase
      .from('user_inventory')
      .insert({ user_id: userId, item_name: itemName, item_value: itemValue })
      .select()
      .single();

    if (data) setInventory(prev => [data, ...prev]);
  }, [userId, isDemo]);

  // Sell inventory item for Alpha Cash
  const sellInventoryItem = useCallback(async (itemId: string, sellValue: number) => {
    const newCash = state.alpha_cash + sellValue;
    await updateState({ alpha_cash: newCash });

    if (!userId || isDemo) {
      setInventory(prev => prev.filter(i => i.id !== itemId));
      return;
    }

    await supabase
      .from('user_inventory')
      .update({ sold: true, sold_at: new Date().toISOString() })
      .eq('id', itemId);

    setInventory(prev => prev.filter(i => i.id !== itemId));
  }, [state.alpha_cash, userId, isDemo, updateState]);

  // Add cash bonus
  const addCashBonus = useCallback(async (amount: number) => {
    await updateState({ cash_bonuses: state.cash_bonuses + amount });
  }, [state.cash_bonuses, updateState]);

  return {
    state,
    inventory,
    loading,
    earnTickets,
    spendTickets,
    recordDeal,
    addInventoryItem,
    sellInventoryItem,
    addCashBonus,
    updateState,
    getStreakBoost,
    currentPuzzlePrize: PUZZLE_PRIZES[state.puzzle_prize_index % PUZZLE_PRIZES.length],
  };
};
