import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  user_name: string;
  deals_count: number;
  installs_count: number;
  revenue: number;
  rank?: number;
  ticketBonus?: string;
}

function assignTicketBonus(rank: number): string {
  if (rank <= 3) return '200%';
  if (rank <= 10) return '100%';
  return '50%';
}

export const useLeaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    const { data } = await supabase
      .from('leaderboard')
      .select('*')
      .order('revenue', { ascending: false });

    if (data) {
      const ranked = (data as any[]).map((e, i) => ({
        id: e.id,
        user_id: e.user_id,
        user_name: e.user_name,
        deals_count: e.deals_count || 0,
        installs_count: e.installs_count || 0,
        revenue: Number(e.revenue) || 0,
        rank: i + 1,
        ticketBonus: assignTicketBonus(i + 1),
      }));
      setEntries(ranked);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLeaderboard]);

  // Called when a deal is marked clean — increments deals for the rep
  const recordCleanDeal = useCallback(async (repUserId: string, repName: string, dealRevenue: number) => {
    // Try to upsert: increment deals_count and revenue
    const { data: existing } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('user_id', repUserId)
      .maybeSingle();

    if (existing) {
      await supabase.from('leaderboard').update({
        deals_count: (existing as any).deals_count + 1,
        revenue: Number((existing as any).revenue) + dealRevenue,
        user_name: repName,
      }).eq('user_id', repUserId);
    } else {
      await supabase.from('leaderboard').insert({
        user_id: repUserId,
        user_name: repName,
        deals_count: 1,
        installs_count: 0,
        revenue: dealRevenue,
      });
    }
  }, []);

  // Called when an install completes
  const recordInstall = useCallback(async (repUserId: string) => {
    const { data: existing } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('user_id', repUserId)
      .maybeSingle();

    if (existing) {
      await supabase.from('leaderboard').update({
        installs_count: (existing as any).installs_count + 1,
      }).eq('user_id', repUserId);
    }
  }, []);

  return { entries, loading, recordCleanDeal, recordInstall, refetch: fetchLeaderboard };
};
