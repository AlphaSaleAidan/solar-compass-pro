import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RepStatsData {
  yearlyPaidOut: number;
  pendingPipeline: number;
  installCount: number;
  monthlyAppointments: number;
  avgRating: number;
  todaysAppointments: AppointmentData[];
  // Performance metrics from appointment outcomes
  totalSits: number;
  totalCloses: number;
  creditFails: number;
  creditPassed: number;
  nonClosed: number;
}

export interface AppointmentData {
  id: string;
  customer_name: string;
  address: string;
  phone: string;
  email: string;
  appointment_date: string;
  appointment_time: string;
  high_bill: number;
  low_bill: number;
  all_electric: boolean;
  stars: number;
  setter: string;
  closer: string | null;
  status: string;
  outcome: string | null;
  closer_notes: string;
}

const DEFAULT_STATS: RepStatsData = {
  yearlyPaidOut: 0,
  pendingPipeline: 0,
  installCount: 0,
  monthlyAppointments: 0,
  avgRating: 0,
  todaysAppointments: [],
  totalSits: 0,
  totalCloses: 0,
  creditFails: 0,
  creditPassed: 0,
  nonClosed: 0,
};

export const useRepStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<RepStatsData>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;
  const isDemo = user?.isDemo;

  useEffect(() => {
    if (!userId || isDemo) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        // Fetch appointments for this user (this month + today)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const today = now.toISOString().split('T')[0];

        const { data: appointments } = await supabase
          .from('appointments')
          .select('*')
          .eq('rep_id', userId);

        // Monthly appointments
        const monthlyAppts = (appointments || []).filter(a => a.appointment_date >= startOfMonth);
        const avgRating = monthlyAppts.length > 0
          ? monthlyAppts.reduce((sum, a) => sum + (a.stars || 0), 0) / monthlyAppts.length
          : 0;

        // Today's appointments
        const todaysAppts = (appointments || []).filter(a => a.appointment_date === today);

        // Performance metrics from all appointment outcomes
        const allAppts = appointments || [];
        const totalSits = allAppts.filter(a => a.outcome).length;
        const totalCloses = allAppts.filter(a => a.outcome === 'closed').length;
        const creditFails = allAppts.filter(a => a.outcome === 'credit_fail').length;
        const creditPassed = allAppts.filter(a => a.outcome === 'closed' || a.outcome === 'credit_pass').length;
        const nonClosed = allAppts.filter(a => a.outcome === 'no_close' || a.outcome === 'no_sit').length;

        // Fetch projects for pipeline and install count
        const { data: projects } = await supabase
          .from('projects')
          .select('current_milestone, contract_value, system_price, price_per_watt, system_size')
          .eq('sales_rep_id', userId);

        const installCount = (projects || []).filter(p => (p.current_milestone || 0) >= 5).length;

        // Pending pipeline = sum of potential commissions for non-completed projects
        const pendingPipeline = (projects || []).reduce((sum, p) => {
          if ((p.current_milestone || 0) < 7) {
            const watts = (p.system_size || 0) * 1000;
            const ppw = p.price_per_watt || 0;
            const redline = 2.35;
            const commission = (ppw - redline) * watts;
            return sum + Math.max(0, commission * 0.6);
          }
          return sum;
        }, 0);

        // Yearly paid out = sum of fund releases for this user's projects
        const { data: fundReleases } = await supabase
          .from('fund_releases')
          .select('amount, project_id');

        const userProjectIds = (projects || []).map(() => ''); // We need project IDs
        // Re-fetch with IDs
        const { data: projectsWithId } = await supabase
          .from('projects')
          .select('id')
          .eq('sales_rep_id', userId);

        const projectIds = (projectsWithId || []).map(p => p.id);
        const yearlyPaidOut = (fundReleases || [])
          .filter(fr => projectIds.includes(fr.project_id))
          .reduce((sum, fr) => sum + Number(fr.amount), 0);

        setStats({
          yearlyPaidOut,
          pendingPipeline: Math.round(pendingPipeline),
          installCount,
          monthlyAppointments: monthlyAppts.length,
          avgRating: Math.round(avgRating * 10) / 10,
          todaysAppointments: todaysAppts.map(a => ({
            id: a.id,
            customer_name: a.customer_name,
            address: a.address,
            phone: a.phone || '',
            email: a.email || '',
            appointment_date: a.appointment_date,
            appointment_time: a.appointment_time,
            high_bill: Number(a.high_bill) || 0,
            low_bill: Number(a.low_bill) || 0,
            all_electric: a.all_electric || false,
            stars: a.stars || 0,
            setter: a.setter || '',
            closer: a.closer,
            status: a.status || 'scheduled',
            outcome: a.outcome,
            closer_notes: a.closer_notes || '',
          })),
          totalSits,
          totalCloses,
          creditFails,
          creditPassed,
          nonClosed,
        });
      } catch (err) {
        console.error('Error fetching rep stats:', err);
      }
      setLoading(false);
    };

    fetchStats();

    // Subscribe to appointment changes for live updates
    const channel = supabase
      .channel('rep-stats-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, isDemo]);

  return { stats, loading };
};
