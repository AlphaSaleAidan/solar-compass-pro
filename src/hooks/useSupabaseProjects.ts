import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateMockAuroraData, type ProjectStatus } from '@/lib/sopEngine';
import type { Tables, TablesInsert, TablesUpdate, Json } from '@/integrations/supabase/types';

type DBProject = Tables<'projects'>;
type DBProjectInsert = TablesInsert<'projects'>;
type DBProjectUpdate = TablesUpdate<'projects'>;

export function useSupabaseProjects() {
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all projects the user can see
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      console.error('Error fetching projects:', fetchError);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();

    // Real-time subscription
    const channel = supabase
      .channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProjects(prev => [payload.new as DBProject, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setProjects(prev => prev.map(p => p.id === (payload.new as DBProject).id ? payload.new as DBProject : p));
        } else if (payload.eventType === 'DELETE') {
          setProjects(prev => prev.filter(p => p.id !== (payload.old as DBProject).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchProjects]);

  // Create a new project (Sales Rep SOP Step 1)
  const createProject = useCallback(async (data: {
    customerName: string;
    email?: string;
    phone?: string;
    address: string;
    city?: string;
    state?: string;
    zip?: string;
    highBill?: number;
    lowBill?: number;
  }) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const insert: DBProjectInsert = {
      customer_name: data.customerName,
      customer_email: data.email || null,
      customer_phone: data.phone || null,
      address: data.address,
      city: data.city || null,
      state: data.state || 'TX',
      zip: data.zip || null,
      sales_rep_id: userData.user.id,
      status: 'new',
      credit_status: 'pending',
    };

    const { data: project, error } = await supabase
      .from('projects')
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    return project;
  }, []);

  // Sync from Aurora (SOP 1.1 Step 5 → 1.2 Step 2)
  const syncFromAurora = useCallback(async (projectId: string, highBill: number = 250, lowBill: number = 100) => {
    const auroraData = generateMockAuroraData(highBill, lowBill);

    const update: DBProjectUpdate = {
      aurora_synced_at: new Date().toISOString(),
      aurora_data: auroraData as unknown as Json,
      system_size: auroraData.system_size,
      panel_count: auroraData.panel_count,
      battery: auroraData.battery,
      financier: auroraData.financier,
      monthly_payment: auroraData.monthly_payment,
      annual_production: auroraData.annual_production,
      price_per_watt: auroraData.price_per_watt,
      escalation_rate: auroraData.escalation_rate,
      contract_value: auroraData.contract_value,
      adders: auroraData.adders as unknown as Json,
      status: 'aurora_synced' as ProjectStatus,
    };

    const { data, error } = await supabase
      .from('projects')
      .update(update)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  // Convert to Sale (SOP 1.2 Step 3)
  const convertToSale = useCallback(async (projectId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .update({ status: 'converted' as ProjectStatus })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  // Send Documents (SOP 1.2 Step 4)
  const sendDocuments = useCallback(async (projectId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .update({
        documents_sent: true,
        status: 'documents_sent' as ProjectStatus,
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  // Complete Welcome Call (SOP 1.3)
  const completeWelcomeCall = useCallback(async (
    projectId: string,
    answers: { questionId: number; answer: string; correct?: boolean }[],
    flags: string[]
  ) => {
    const { data, error } = await supabase
      .from('projects')
      .update({
        welcome_call_completed: true,
        welcome_call_data: { answers, flags, completed_at: new Date().toISOString() } as unknown as Record<string, unknown>,
        status: 'welcome_call_done' as ProjectStatus,
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  // Complete Site Survey (SOP 1.4)
  const completeSiteSurvey = useCallback(async (
    projectId: string,
    photos: Record<string, string[]>
  ) => {
    const { data, error } = await supabase
      .from('projects')
      .update({
        site_survey_completed: true,
        site_survey_data: { photos, completed_at: new Date().toISOString() } as unknown as Record<string, unknown>,
        status: 'site_survey_done' as ProjectStatus,
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  // Submit for Final Approval (SOP 1.5)
  const submitForApproval = useCallback(async (projectId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .update({
        submitted_for_approval: true,
        approval_status: 'pending',
        status: 'submitted_for_approval' as ProjectStatus,
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  // Mark Clean (SOP 2.2) — Backend Ops
  const markClean = useCallback(async (projectId: string, installerOrgId?: string, financierOrgId?: string) => {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('projects')
      .update({
        approval_status: 'clean',
        status: 'approved_clean' as ProjectStatus,
        approved_by: userData?.user?.id || null,
        approved_at: new Date().toISOString(),
        installer_org_id: installerOrgId || null,
        financier_org_id: financierOrgId || null,
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;

    // Auto-create milestones M1-M7 for the pipeline
    if (data) {
      await createMilestones(projectId, data.contract_value || 0);

      // Move to pipeline
      await supabase
        .from('projects')
        .update({ status: 'in_pipeline' as ProjectStatus, current_milestone: 1 })
        .eq('id', projectId);
    }

    return data;
  }, []);

  // Mark Dirty (SOP 2.2) — Backend Ops
  const markDirty = useCallback(async (projectId: string, notes: string) => {
    const { data, error } = await supabase
      .from('projects')
      .update({
        approval_status: 'dirty',
        dirty_notes: notes,
        status: 'marked_dirty' as ProjectStatus,
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  // Resubmit after dirty (Sales Rep)
  const resubmitForApproval = useCallback(async (projectId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .update({
        submitted_for_approval: true,
        approval_status: 'pending',
        dirty_notes: null,
        status: 'submitted_for_approval' as ProjectStatus,
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  // Create M1-M7 milestones for a newly approved project
  const createMilestones = useCallback(async (projectId: string, contractValue: number) => {
    const milestones = [
      { milestone_number: 1, milestone_name: 'SOW Confirmed', fund_amount: Math.round(contractValue * 0.15) },
      { milestone_number: 2, milestone_name: 'Permit + Materials Ordered', fund_amount: Math.round(contractValue * 0.20) },
      { milestone_number: 3, milestone_name: 'Install Scheduled', fund_amount: Math.round(contractValue * 0.15) },
      { milestone_number: 4, milestone_name: 'Install Complete', fund_amount: Math.round(contractValue * 0.20) },
      { milestone_number: 5, milestone_name: 'Utility Inspection Passed', fund_amount: Math.round(contractValue * 0.20) },
      { milestone_number: 6, milestone_name: 'PTO Granted', fund_amount: Math.round(contractValue * 0.10) },
      { milestone_number: 7, milestone_name: 'Speed Bonus (35-Day PTO)', fund_amount: Math.round(contractValue * 0.05) },
    ];

    const { error } = await supabase
      .from('project_milestones')
      .insert(milestones.map(m => ({ ...m, project_id: projectId })));

    if (error) console.error('Error creating milestones:', error);
  }, []);

  // Update project fields
  const updateProject = useCallback(async (projectId: string, updates: DBProjectUpdate) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }, []);

  // Filter helpers
  const getProjectsByStatus = useCallback((statuses: ProjectStatus[]) => {
    return projects.filter(p => statuses.includes(p.status as ProjectStatus));
  }, [projects]);

  const getPendingApproval = useCallback(() => {
    return projects.filter(p => p.status === 'submitted_for_approval');
  }, [projects]);

  const getPipelineProjects = useCallback(() => {
    return projects.filter(p => p.status === 'in_pipeline' || p.status === 'completed');
  }, [projects]);

  const getSalesRepProjects = useCallback((salesRepId: string) => {
    return projects.filter(p => p.sales_rep_id === salesRepId);
  }, [projects]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    syncFromAurora,
    convertToSale,
    sendDocuments,
    completeWelcomeCall,
    completeSiteSurvey,
    submitForApproval,
    markClean,
    markDirty,
    resubmitForApproval,
    updateProject,
    getProjectsByStatus,
    getPendingApproval,
    getPipelineProjects,
    getSalesRepProjects,
  };
}
