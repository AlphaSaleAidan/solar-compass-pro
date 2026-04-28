/**
 * ASP Scheduled Jobs
 * 
 * Cron tasks that run on the Railway backend.
 */

import cron from 'node-cron';
import { supabase } from '../config/supabase';

export function startCronJobs() {
  console.log('⏰ Starting cron jobs...');

  // ── Streak Reset: Daily at midnight CT ──────────────
  // Resets gamification streaks for users who didn't close a deal
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Running streak reset...');
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('user_gamification')
        .update({ streak_days: 0 })
        .not('streak_last_deal_date', 'in', `(${today},${yesterday})`)
        .gt('streak_days', 0)
        .select('user_id');

      console.log(`✅ Reset ${data?.length || 0} streaks`, error ? `Error: ${error.message}` : '');
    } catch (err) {
      console.error('❌ Streak reset failed:', err);
    }
  }, { timezone: 'America/Chicago' });

  // ── Stale Project Check: Daily at 8am CT ────────────
  // Flags projects that haven't progressed in 7+ days
  cron.schedule('0 8 * * *', async () => {
    console.log('🔍 Checking for stale projects...');
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const { data: stale } = await supabase
        .from('projects')
        .select('id, customer_name, current_milestone, updated_at')
        .eq('status', 'in_pipeline')
        .lt('updated_at', sevenDaysAgo);

      if (stale && stale.length > 0) {
        console.log(`⚠️  ${stale.length} stale projects found`);
        // Future: send notification to backend ops
        for (const p of stale) {
          await supabase.from('project_activity_log').insert({
            project_id: p.id,
            event_type: 'STALE_WARNING',
            details: {
              days_stale: Math.floor((Date.now() - new Date(p.updated_at).getTime()) / 86400000),
              milestone: p.current_milestone,
            },
          });
        }
      }
    } catch (err) {
      console.error('❌ Stale check failed:', err);
    }
  }, { timezone: 'America/Chicago' });

  // ── Aurora Sync Retry: Every 4 hours ────────────────
  // Retries failed Aurora syncs
  cron.schedule('0 */4 * * *', async () => {
    console.log('🔄 Checking for pending Aurora syncs...');
    try {
      const { data: pending } = await supabase
        .from('sell_projects')
        .select('id, aurora_data')
        .eq('aurora_synced', false)
        .not('aurora_data', 'is', null);

      if (pending && pending.length > 0) {
        console.log(`📡 ${pending.length} pending Aurora syncs — will retry when API is connected`);
      }
    } catch (err) {
      console.error('❌ Aurora sync retry failed:', err);
    }
  });

  // ── Leaderboard Refresh: Every hour ─────────────────
  cron.schedule('0 * * * *', async () => {
    try {
      // Recalculate leaderboard from actual data
      const { data: projects } = await supabase
        .from('projects')
        .select('sales_rep_id, contract_value, current_milestone')
        .not('sales_rep_id', 'is', null);

      if (!projects) return;

      // Aggregate by rep
      const repStats: Record<string, { deals: number; installs: number; revenue: number }> = {};
      for (const p of projects) {
        const rep = p.sales_rep_id;
        if (!repStats[rep]) repStats[rep] = { deals: 0, installs: 0, revenue: 0 };
        repStats[rep].deals++;
        repStats[rep].revenue += p.contract_value || 0;
        if (p.current_milestone >= 4) repStats[rep].installs++;
      }

      // Batch upsert leaderboard in one call
      const rows = Object.entries(repStats).map(([userId, stats]) => ({
        user_id: userId,
        deals_count: stats.deals,
        installs_count: stats.installs,
        revenue: stats.revenue,
        updated_at: new Date().toISOString(),
      }));
      if (rows.length > 0) {
        await supabase.from('leaderboard').upsert(rows, { onConflict: 'user_id' });
      }
    } catch (err) {
      console.error('❌ Leaderboard refresh failed:', err);
    }
  });

  console.log('✅ Cron jobs started: streak-reset, stale-check, aurora-retry, leaderboard-refresh');
}
