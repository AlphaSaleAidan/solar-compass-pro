import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';
import type {
  ProjectMilestoneState,
  SharedTicket,
  FinancierUpdate,
  FinancierUpload,
  ProjectMessage,
} from '@/contexts/ProjectStore';
import type { Project, SellProject } from '@/data/mockData';
import { inferState, type ProjectState } from '@/lib/projectStateMachine';
import { useQueryClient } from '@tanstack/react-query';

// This store provides the SAME interface as ProjectStore but reads/writes Supabase
// It is used for all non-demo (production) users.

interface ProjectStoreActions {
  acceptDeal: (projectId: string, updatedUsage?: number) => void;
  toggleChecklist: (projectId: string, checklistItemId: string, done: boolean) => void;
  uploadFile: (projectId: string, checklistItemId: string, fileName: string) => void;
  setTextEntry: (projectId: string, checklistItemId: string, text: string) => void;
  setDateEntry: (projectId: string, checklistItemId: string, date: string) => void;
  approveMilestone: (projectId: string, milestoneIndex: number) => void;
  submitMilestoneForQC: (projectId: string, milestoneIndex: number) => void;
  approveFundRelease: (projectId: string, milestoneIndex: number) => void;
  releaseFund: (projectId: string, milestoneIndex: number) => void;
  setOpsNotes: (projectId: string, milestoneIndex: number, notes: string) => void;
  getMilestoneState: (projectId: string) => ProjectMilestoneState;
  isMilestoneReady: (projectId: string, milestoneIndex: number, actor?: string) => boolean;
  getProjectsForInstaller: (installerName: string) => Project[];
  getProjectsForRep: (repName: string) => Project[];
  getAllActiveProjects: () => Project[];
  createTicket: (ticket: Omit<SharedTicket, 'id'>) => void;
  addTicketMessage: (ticketId: string, message: { sender: string; role: string; text: string; time: string }) => void;
  resolveTicket: (ticketId: string) => void;
  getTicketsForProject: (projectId: string) => SharedTicket[];
  addFinancierUpdate: (projectId: string, text: string, author: string) => void;
  addFinancierUpload: (projectId: string, fileName: string, type: 'document' | 'photo', uploadedBy: string) => void;
  addProjectMessage: (projectId: string, message: ProjectMessage) => void;
  addSellProject: (project: SellProject) => void;
  updateSellProject: (project: SellProject) => void;
  markSellProjectClean: (projectId: string) => void;
  markSellProjectDirty: (projectId: string, notes: string) => void;
  getSellProjectsPendingApproval: () => SellProject[];
  getSellProjectsClean: () => SellProject[];
}

interface ProjectStoreState {
  projects: Project[];
  qcQueue: Project[];
  milestoneStates: Record<string, ProjectMilestoneState>;
  tickets: SharedTicket[];
  financierUpdates: Record<string, FinancierUpdate[]>;
  financierUploads: Record<string, FinancierUpload[]>;
  projectMessages: Record<string, ProjectMessage[]>;
  sellProjects: SellProject[];
}

type ProjectStoreContextType = ProjectStoreState & ProjectStoreActions;

const SupabaseProjectStoreContext = createContext<ProjectStoreContextType | null>(null);

const createDefaultMilestoneState = (): ProjectMilestoneState => ({
  checklistDone: {},
  uploads: {},
  textEntries: {},
  dateEntries: {},
  fundStatus: {},
  opsNotes: {},
  installerSubmitted: {},
});

// Map a Supabase project row to the UI Project interface
function mapDbProjectToUI(row: any): Project {
  return {
    id: row.project_code || row.id,
    customerName: row.customer_name,
    address: row.address || '',
    email: row.customer_email || '',
    phone: row.customer_phone || '',
    status: row.status === 'completed' ? 'completed' : row.status === 'on_hold' ? 'on_hold' : 'active',
    currentMilestone: row.current_milestone || 0,
    totalMilestones: 7,
    systemSize: row.system_size ? `${row.system_size} kW` : '0 kW',
    battery: row.battery || 'None',
    soldPPW: row.price_per_watt || 4.25,
    contractValue: row.contract_value || 0,
    projectCost: row.project_cost || 0,
    interestRate: row.escalation_rate || 2.99,
    loanTerms: '25 year @ 2.99%',
    repName: row.rep_name || '',
    installerName: row.installer_company || '',
    addedDate: row.created_at?.split('T')[0] || '',
    stage: MILESTONE_SOPS[row.current_milestone || 0]?.name || 'New',
    adders: Array.isArray(row.adders) ? row.adders : [],
    siteSurveyPhotos: [],
    permitStatus: 'pending',
    roofCondition: row.roof_condition || 'good',
    roofIssues: [],
    annualUsage: row.annual_production || 0,
    documentsSignedCount: 0,
    totalDocuments: 6,
    dates: {
      submitted: row.created_at?.split('T')[0] || '',
      siteSurvey: null,
      sowConfirmed: null,
      permitSubmitted: null,
      lastHOContact: row.updated_at?.split('T')[0] || '',
    },
    milestoneDetails: [],
    checklist: {
      creditPassed: row.credit_status === 'passed',
      financeDocsSigned: row.documents_sent || false,
      welcomeCallCompleted: row.welcome_call_completed || false,
      siteSurveyDone: row.site_survey_completed || false,
      aspOnboarding: false,
    },
    welcomeCallRecordingUrl: row.welcome_call_recording_url || undefined,
    // Keep raw DB id for mutations
    _dbId: row.id,
  } as Project & { _dbId: string };
}

function mapDbSellProjectToUI(row: any): SellProject {
  return {
    id: row.project_code || row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email || '',
    phone: row.phone || '',
    address: row.address || '',
    highBill: Number(row.high_bill) || 0,
    lowBill: Number(row.low_bill) || 0,
    allElectric: row.all_electric || false,
    creditStatus: row.credit_status === 'credit_pass' ? 'credit_passed' : row.credit_status === 'credit_fail' ? 'credit_fail' : 'new',
    createdAt: row.created_at?.split('T')[0] || '',
    checklist: { creditPassed: row.credit_status === 'credit_pass', financeDocsSigned: false, welcomeCallCompleted: row.welcome_call_complete || false, siteSurveyDone: row.site_survey_complete || false, aspOnboarding: false },
    documents: [],
    surveyPhotos: [],
    auroraSynced: row.aurora_synced || false,
    auroraData: row.aurora_data || undefined,
    convertedToSale: row.converted_to_sale || false,
    welcomeCallComplete: row.welcome_call_complete || false,
    welcomeCallAnswers: row.welcome_call_answers || undefined,
    siteSurveyPhotos: row.site_survey_photos || undefined,
    siteSurveyComplete: row.site_survey_complete || false,
    submittedForApproval: row.submitted_for_approval || false,
    approvalStatus: row.approval_status || 'pending',
    approvalNotes: row.rejection_reason || undefined,
    welcomeCallRecordingUrl: row.welcome_call_recording_url || undefined,
    qcInitialApproved: row.qc_initial_approved || false,
    documentsSigned: row.documents_signed || false,
    _dbId: row.id,
    lifecycleState: inferState({
      firstName: row.first_name,
      lastName: row.last_name,
      creditStatus: row.credit_status === 'passed' ? 'passed' : row.credit_status,
      auroraSynced: row.aurora_synced || false,
      auroraData: row.aurora_data,
      convertedToSale: row.converted_to_sale || false,
      qcInitialApproved: row.qc_initial_approved || false,
      approvalStatus: row.approval_status === 'rejected' ? 'rejected' : undefined,
    }) as ProjectState,
  } as SellProject & { _dbId: string };
}

export const SupabaseProjectStoreProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [qcQueue, setQcQueue] = useState<Project[]>([]);
  const [milestoneStates, setMilestoneStates] = useState<Record<string, ProjectMilestoneState>>({});
  const [tickets, setTickets] = useState<SharedTicket[]>([]);
  const [financierUpdates, setFinancierUpdates] = useState<Record<string, FinancierUpdate[]>>({});
  const [financierUploads, setFinancierUploads] = useState<Record<string, FinancierUpload[]>>({});
  const [projectMessages, setProjectMessages] = useState<Record<string, ProjectMessage[]>>({});
  const [sellProjects, setSellProjects] = useState<SellProject[]>([]);

  // Load projects from Supabase
  useEffect(() => {
    if (!user || user.isDemo) return;
    const fetchProjects = async () => {
      const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (data) setProjects(data.map(mapDbProjectToUI));
    };
    fetchProjects();

    // Realtime subscription
    const channel = supabase.channel('prod-projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchProjects())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Load sell_projects
  useEffect(() => {
    if (!user || user.isDemo) return;
    const fetchSellProjects = async () => {
      const { data } = await supabase.from('sell_projects').select('*').order('created_at', { ascending: false });
      if (data) setSellProjects(data.map(mapDbSellProjectToUI));
    };
    fetchSellProjects();

    const channel = supabase.channel('prod-sell-projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sell_projects' }, () => fetchSellProjects())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Load milestone states for all projects
  useEffect(() => {
    if (!user || user.isDemo || projects.length === 0) return;
    const fetchStates = async () => {
      const { data } = await supabase.from('milestone_states').select('*');
      if (data) {
        const states: Record<string, ProjectMilestoneState> = {};
        data.forEach((row: any) => {
          const proj = projects.find(p => (p as any)._dbId === row.project_id);
          const key = proj?.id || row.project_id;
          if (!states[key]) states[key] = createDefaultMilestoneState();
          const ms = states[key];
          if (row.checklist_done) Object.assign(ms.checklistDone, row.checklist_done);
          if (row.uploads) Object.assign(ms.uploads, row.uploads);
          if (row.text_entries) Object.assign(ms.textEntries, row.text_entries);
          if (row.date_entries) Object.assign(ms.dateEntries, row.date_entries);
          if (row.fund_status) ms.fundStatus[row.milestone_index] = row.fund_status as any;
          if (row.ops_notes) ms.opsNotes[row.milestone_index] = row.ops_notes;
        });
        setMilestoneStates(states);
      }
    };
    fetchStates();

    const channel = supabase.channel('prod-milestone-states')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'milestone_states' }, () => fetchStates())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, projects]);

  // Load tickets
  useEffect(() => {
    if (!user || user.isDemo) return;
    const fetchTickets = async () => {
      const { data: ticketRows } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
      if (!ticketRows) return;
      
      const mapped: SharedTicket[] = [];
      for (const t of ticketRows) {
        const { data: msgs } = await supabase.from('ticket_messages').select('*').eq('ticket_id', t.id).order('created_at');
        mapped.push({
          id: t.id,
          projectId: t.project_id || '',
          subject: t.subject,
          priority: t.priority as any,
          status: t.status as any,
          createdAt: t.created_at?.split('T')[0] || '',
          createdBy: t.created_by_role || 'unknown',
          createdByRole: t.created_by_role || 'ops',
          messages: (msgs || []).map((m: any) => ({
            sender: m.sender_name || 'User',
            role: m.sender_role || 'ops',
            text: m.message,
            time: new Date(m.created_at).toLocaleString(),
          })),
        });
      }
      setTickets(mapped);
    };
    fetchTickets();

    const channel = supabase.channel('prod-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => fetchTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Load financier updates
  useEffect(() => {
    if (!user || user.isDemo) return;
    const fetch = async () => {
      const { data } = await supabase.from('financier_updates').select('*').order('created_at');
      if (data) {
        const grouped: Record<string, FinancierUpdate[]> = {};
        data.forEach((row: any) => {
          const pid = row.project_id;
          if (!grouped[pid]) grouped[pid] = [];
          grouped[pid].push({ id: row.id, projectId: pid, text: row.text, author: row.sender_name, timestamp: new Date(row.created_at).toLocaleString() });
        });
        setFinancierUpdates(grouped);
      }
    };
    fetch();

    const channel = supabase.channel('prod-fin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financier_updates' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Load project messages
  useEffect(() => {
    if (!user || user.isDemo) return;
    const fetch = async () => {
      const { data } = await supabase.from('project_messages').select('*').order('created_at');
      if (data) {
        const grouped: Record<string, ProjectMessage[]> = {};
        data.forEach((row: any) => {
          const pid = row.project_id;
          if (!grouped[pid]) grouped[pid] = [];
          grouped[pid].push({ sender: row.sender_name, role: row.sender_role, text: row.message, time: new Date(row.created_at).toLocaleString() });
        });
        setProjectMessages(grouped);
      }
    };
    fetch();
  }, [user]);

  // ========== Actions (write to Supabase) ==========

  const getDbId = (projectId: string): string => {
    const proj = projects.find(p => p.id === projectId);
    return (proj as any)?._dbId || projectId;
  };

  const getSellDbId = (projectId: string): string => {
    const sp = sellProjects.find(p => p.id === projectId);
    return (sp as any)?._dbId || projectId;
  };

  const acceptDeal = useCallback(async (projectId: string, updatedUsage?: number) => {
    // In production, this is handled by creating a project from a QC item
    // For now, update the project status
    const dbId = getDbId(projectId);
    await supabase.from('projects').update({ status: 'in_pipeline' as any, current_milestone: 0 }).eq('id', dbId);
  }, [projects]);

  const toggleChecklist = useCallback(async (projectId: string, checklistItemId: string, done: boolean) => {
    const dbId = getDbId(projectId);
    const state = milestoneStates[projectId] || createDefaultMilestoneState();
    const newChecklist = { ...state.checklistDone, [checklistItemId]: done };
    
    // Determine milestone index from checklist item id
    const milestoneIndex = MILESTONE_SOPS.findIndex(sop => sop.checklist.some(c => c.id === checklistItemId));
    if (milestoneIndex === -1) return;

    await supabase.from('milestone_states').upsert({
      project_id: dbId,
      milestone_index: milestoneIndex,
      checklist_done: newChecklist,
    }, { onConflict: 'project_id,milestone_index' });

    // Optimistic update
    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), checklistDone: newChecklist },
    }));
  }, [milestoneStates, projects]);

  const uploadFile = useCallback(async (projectId: string, checklistItemId: string, fileName: string) => {
    const dbId = getDbId(projectId);
    const state = milestoneStates[projectId] || createDefaultMilestoneState();
    const newUploads = { ...state.uploads, [checklistItemId]: [...(state.uploads[checklistItemId] || []), fileName] };
    const newChecklist = { ...state.checklistDone, [checklistItemId]: true };

    const milestoneIndex = MILESTONE_SOPS.findIndex(sop => sop.checklist.some(c => c.id === checklistItemId));
    if (milestoneIndex === -1) return;

    await supabase.from('milestone_states').upsert({
      project_id: dbId,
      milestone_index: milestoneIndex,
      uploads: newUploads,
      checklist_done: newChecklist,
    }, { onConflict: 'project_id,milestone_index' });

    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), uploads: newUploads, checklistDone: newChecklist },
    }));
  }, [milestoneStates, projects]);

  const setTextEntry = useCallback(async (projectId: string, checklistItemId: string, text: string) => {
    const dbId = getDbId(projectId);
    const state = milestoneStates[projectId] || createDefaultMilestoneState();
    const newEntries = { ...state.textEntries, [checklistItemId]: text };

    const milestoneIndex = MILESTONE_SOPS.findIndex(sop => sop.checklist.some(c => c.id === checklistItemId));
    if (milestoneIndex === -1) return;

    await supabase.from('milestone_states').upsert({
      project_id: dbId,
      milestone_index: milestoneIndex,
      text_entries: newEntries,
    }, { onConflict: 'project_id,milestone_index' });

    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), textEntries: newEntries },
    }));
  }, [milestoneStates, projects]);

  const setDateEntry = useCallback(async (projectId: string, checklistItemId: string, date: string) => {
    const dbId = getDbId(projectId);
    const state = milestoneStates[projectId] || createDefaultMilestoneState();
    const newEntries = { ...state.dateEntries, [checklistItemId]: date };
    const newChecklist = { ...state.checklistDone, [checklistItemId]: true };

    const milestoneIndex = MILESTONE_SOPS.findIndex(sop => sop.checklist.some(c => c.id === checklistItemId));
    if (milestoneIndex === -1) return;

    await supabase.from('milestone_states').upsert({
      project_id: dbId,
      milestone_index: milestoneIndex,
      date_entries: newEntries,
      checklist_done: newChecklist,
    }, { onConflict: 'project_id,milestone_index' });

    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), dateEntries: newEntries, checklistDone: newChecklist },
    }));
  }, [milestoneStates, projects]);

  const submitMilestoneForQC = useCallback(async (projectId: string, milestoneIndex: number) => {
    const dbId = getDbId(projectId);
    await supabase.from('milestone_states').upsert({
      project_id: dbId,
      milestone_index: milestoneIndex,
      installer_submitted: true,
    }, { onConflict: 'project_id,milestone_index' });
    setMilestoneStates(prev => {
      const state = prev[projectId] || createDefaultMilestoneState();
      return { ...prev, [projectId]: { ...state, installerSubmitted: { ...state.installerSubmitted, [milestoneIndex]: true } } };
    });
  }, [user]);

  const approveMilestone = useCallback(async (projectId: string, milestoneIndex: number) => {
    const dbId = getDbId(projectId);
    const newMilestone = milestoneIndex + 1;
    
    await supabase.from('projects').update({ current_milestone: newMilestone }).eq('id', dbId);
    await supabase.from('milestone_states').upsert({
      project_id: dbId,
      milestone_index: milestoneIndex,
      fund_status: 'pending',
      approved_by: user?.id,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'project_id,milestone_index' });

    // If Install Completed milestone (index 4) is approved, update leaderboard installs
    if (milestoneIndex === 4) {
      const project = projects.find(p => p.id === projectId);
      const repId = (project as any)?.salesRepId || (project as any)?.sales_rep_id;
      if (repId) {
        const { data: existing } = await supabase
          .from('leaderboard')
          .select('*')
          .eq('user_id', repId)
          .maybeSingle();
        if (existing) {
          await supabase.from('leaderboard').update({
            installs_count: (existing as any).installs_count + 1,
          }).eq('user_id', repId);
        }
      }
    }

    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, currentMilestone: newMilestone, stage: MILESTONE_SOPS[newMilestone]?.name || 'Completed' } : p));
    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), fundStatus: { ...(prev[projectId]?.fundStatus || {}), [milestoneIndex]: 'pending' } },
    }));
  }, [projects, user]);

  const approveFundRelease = useCallback(async (projectId: string, milestoneIndex: number) => {
    const dbId = getDbId(projectId);
    await supabase.from('milestone_states').upsert({
      project_id: dbId,
      milestone_index: milestoneIndex,
      fund_status: 'approved',
    }, { onConflict: 'project_id,milestone_index' });

    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), fundStatus: { ...(prev[projectId]?.fundStatus || {}), [milestoneIndex]: 'approved' } },
    }));
  }, [projects]);

  const releaseFund = useCallback(async (projectId: string, milestoneIndex: number) => {
    const dbId = getDbId(projectId);
    const proj = projects.find(p => p.id === projectId);
    const sop = MILESTONE_SOPS[milestoneIndex];
    const amount = (proj?.projectCost || 0) * (sop?.fundPercent || 0) / 100;

    await supabase.from('milestone_states').upsert({
      project_id: dbId,
      milestone_index: milestoneIndex,
      fund_status: 'released',
      fund_released_at: new Date().toISOString(),
    }, { onConflict: 'project_id,milestone_index' });

    await supabase.from('fund_releases').insert({
      project_id: dbId,
      milestone: sop?.id || `M${milestoneIndex + 1}`,
      amount,
      percent: sop?.fundPercent || 0,
      approved_by: user?.id,
    });

    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), fundStatus: { ...(prev[projectId]?.fundStatus || {}), [milestoneIndex]: 'released' } },
    }));
  }, [projects, user]);

  const setOpsNotes = useCallback(async (projectId: string, milestoneIndex: number, notes: string) => {
    const dbId = getDbId(projectId);
    await supabase.from('milestone_states').upsert({
      project_id: dbId,
      milestone_index: milestoneIndex,
      ops_notes: notes,
    }, { onConflict: 'project_id,milestone_index' });

    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), opsNotes: { ...(prev[projectId]?.opsNotes || {}), [milestoneIndex]: notes } },
    }));
  }, [projects]);

  const getMilestoneState = useCallback((projectId: string): ProjectMilestoneState => {
    return milestoneStates[projectId] || createDefaultMilestoneState();
  }, [milestoneStates]);

  const isMilestoneReady = useCallback((projectId: string, milestoneIndex: number, actor?: string): boolean => {
    const state = getMilestoneState(projectId);
    const sop = MILESTONE_SOPS[milestoneIndex];
    if (!sop) return false;
    const items = actor ? sop.checklist.filter(c => c.actor === actor) : sop.checklist;
    return items.every(item => state.checklistDone[item.id]);
  }, [getMilestoneState]);

  const getProjectsForInstaller = useCallback((installerName: string) => {
    return projects.filter(p => p.installerName === installerName);
  }, [projects]);

  const getProjectsForRep = useCallback((repName: string) => {
    return projects.filter(p => p.repName === repName);
  }, [projects]);

  const getAllActiveProjects = useCallback(() => projects, [projects]);

  // Ticket actions
  const createTicket = useCallback(async (ticket: Omit<SharedTicket, 'id'>) => {
    const { data } = await supabase.from('tickets').insert({
      project_id: getDbId(ticket.projectId) || null,
      subject: ticket.subject,
      priority: ticket.priority as any,
      status: ticket.status as any,
      created_by: user?.id || '',
      created_by_role: ticket.createdByRole,
      project_code: ticket.projectId,
      customer_name: '',
    }).select().single();

    if (data && ticket.messages?.length) {
      for (const msg of ticket.messages) {
        await supabase.from('ticket_messages').insert({
          ticket_id: data.id,
          sender_id: user?.id || '',
          sender_name: msg.sender,
          sender_role: msg.role,
          message: msg.text,
        });
      }
    }
  }, [user, projects]);

  const addTicketMessage = useCallback(async (ticketId: string, message: { sender: string; role: string; text: string; time: string }) => {
    await supabase.from('ticket_messages').insert({
      ticket_id: ticketId,
      sender_id: user?.id || '',
      sender_name: message.sender,
      sender_role: message.role,
      message: message.text,
    });
  }, [user]);

  const resolveTicket = useCallback(async (ticketId: string) => {
    await supabase.from('tickets').update({ status: 'resolved' as any, resolved_at: new Date().toISOString() }).eq('id', ticketId);
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t));
  }, []);

  const getTicketsForProject = useCallback((projectId: string) => {
    return tickets.filter(t => t.projectId === projectId);
  }, [tickets]);

  // Financier actions
  const addFinancierUpdate = useCallback(async (projectId: string, text: string, author: string) => {
    const dbId = getDbId(projectId);
    await supabase.from('financier_updates').insert({
      project_id: dbId,
      sender_name: author,
      role: user?.role || 'financier',
      text,
    });
  }, [user, projects]);

  const addFinancierUpload = useCallback((_projectId: string, _fileName: string, _type: 'document' | 'photo', _uploadedBy: string) => {
    // Handled via storage uploads directly
  }, []);

  const addProjectMessage = useCallback(async (projectId: string, message: ProjectMessage) => {
    const dbId = getDbId(projectId);
    await supabase.from('project_messages').insert({
      project_id: dbId,
      sender_id: user?.id || null,
      sender_name: message.sender,
      sender_role: message.role,
      message: message.text,
    });
  }, [user, projects]);

  // Sell project actions
  const addSellProject = useCallback(async (project: SellProject) => {
    await supabase.from('sell_projects').insert({
      created_by: user?.id || '',
      first_name: project.firstName,
      last_name: project.lastName,
      email: project.email,
      phone: project.phone,
      address: project.address,
      high_bill: project.highBill,
      low_bill: project.lowBill,
      all_electric: project.allElectric,
      credit_status: project.creditStatus === 'credit_passed' ? 'credit_pass' : project.creditStatus === 'credit_fail' ? 'credit_fail' : 'pending',
    });
  }, [user]);

  const updateSellProject = useCallback(async (project: SellProject) => {
    const dbId = getSellDbId(project.id);
    await supabase.from('sell_projects').update({
      first_name: project.firstName,
      last_name: project.lastName,
      email: project.email,
      phone: project.phone,
      address: project.address,
      high_bill: project.highBill,
      low_bill: project.lowBill,
      all_electric: project.allElectric,
      aurora_synced: project.auroraSynced,
      aurora_data: project.auroraData as any,
      converted_to_sale: project.convertedToSale,
      welcome_call_complete: project.welcomeCallComplete,
      welcome_call_answers: project.welcomeCallAnswers as any,
      site_survey_photos: project.siteSurveyPhotos as any,
      site_survey_complete: project.siteSurveyComplete,
      submitted_for_approval: project.submittedForApproval,
      documents_sent: project.checklist?.financeDocsSigned || false,
      approval_status: project.approvalStatus,
      rejection_reason: project.approvalNotes,
      qc_initial_approved: project.qcInitialApproved,
      documents_signed: project.documentsSigned,
      welcome_call_recording_url: project.welcomeCallRecordingUrl,
    }).eq('id', dbId);
  }, [sellProjects]);

  const markSellProjectClean = useCallback(async (projectId: string) => {
    const dbId = getSellDbId(projectId);
    await supabase.from('sell_projects').update({ approval_status: 'clean' }).eq('id', dbId);
    
    // Create a project from the sell_project
    const sp = sellProjects.find(p => p.id === projectId);
    if (sp) {
      const createdByUserId = (sp as any).createdBy || user?.id;
      
      await supabase.from('projects').insert({
        customer_name: `${sp.firstName} ${sp.lastName}`,
        customer_email: sp.email,
        customer_phone: sp.phone,
        address: sp.address,
        status: 'in_pipeline' as any,
        current_milestone: 0,
        sales_rep_id: createdByUserId,
        rep_name: user?.name,
        sell_project_id: getSellDbId(projectId),
        organization_id: 'alphasale',
      });

      // Update leaderboard for the sales rep who created this deal
      const dealRevenue = Number((sp as any).auroraData?.systemPrice) || Number((sp as any).auroraData?.contractValue) || 0;
      
      // Get the rep's name from their profile
      let repName = user?.name || 'Unknown';
      if (createdByUserId && createdByUserId !== user?.id) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', createdByUserId).maybeSingle();
        if (profile) repName = profile.full_name;
      }

      // Upsert leaderboard entry
      const { data: existing } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', createdByUserId)
        .maybeSingle();

      if (existing) {
        await supabase.from('leaderboard').update({
          deals_count: (existing as any).deals_count + 1,
          revenue: Number((existing as any).revenue) + dealRevenue,
          user_name: repName,
        }).eq('user_id', createdByUserId);
      } else {
        await supabase.from('leaderboard').insert({
          user_id: createdByUserId,
          user_name: repName,
          deals_count: 1,
          installs_count: 0,
          revenue: dealRevenue,
        });
      }
    }

    setSellProjects(prev => prev.map(p => p.id === projectId ? { ...p, approvalStatus: 'clean' as const } : p));
  }, [sellProjects, user]);

  const markSellProjectDirty = useCallback(async (projectId: string, notes: string) => {
    const dbId = getSellDbId(projectId);
    await supabase.from('sell_projects').update({ approval_status: 'dirty', rejection_reason: notes }).eq('id', dbId);
    setSellProjects(prev => prev.map(p => p.id === projectId ? { ...p, approvalStatus: 'dirty' as const, approvalNotes: notes } : p));
  }, [sellProjects]);

  const getSellProjectsPendingApproval = useCallback(() => {
    return sellProjects.filter(p => p.approvalStatus === 'pending');
  }, [sellProjects]);

  const getSellProjectsClean = useCallback(() => {
    return sellProjects.filter(p => p.approvalStatus === 'clean');
  }, [sellProjects]);

  // ─── Delete actions (cross-portal sync) ───────────────────────────
  const deleteProject = useCallback(async (projectId: string) => {
    // Delete from Supabase
    const tables = [
      'milestone_states', 'project_milestones', 'project_messages',
      'project_documents', 'project_checklist_items', 'project_activity_log',
      'financier_updates', 'site_surveys', 'fund_releases',
    ] as const;
    for (const table of tables) {
      await supabase.from(table).delete().eq('project_id', projectId);
    }
    await supabase.from('projects').delete().eq('id', projectId);
    // Sync in-memory state
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setQcQueue(prev => prev.filter(p => p.id !== projectId));
    setMilestoneStates(prev => { const next = { ...prev }; delete next[projectId]; return next; });
    setTickets(prev => prev.filter(t => t.projectId !== projectId));
    setFinancierUpdates(prev => { const next = { ...prev }; delete next[projectId]; return next; });
    setFinancierUploads(prev => { const next = { ...prev }; delete next[projectId]; return next; });
    setProjectMessages(prev => { const next = { ...prev }; delete next[projectId]; return next; });
  }, []);

  const deleteSellProject = useCallback(async (projectId: string) => {
    const dbId = getSellDbId(projectId);
    await supabase.from('sell_projects').delete().eq('id', dbId);
    setSellProjects(prev => prev.filter(p => p.id !== projectId));
  }, [sellProjects]);

  // ─── Rejection & Reassignment (mirrors ProjectStore) ────────────────
  const [rejectedProjects, setRejectedProjects] = useState<Array<{
    project: typeof projects[0];
    reason: string;
    rejectedBy: string;
    rejectedByRole: 'installer' | 'financier' | 'ops';
    rejectedAt: string;
    originalInstaller: string;
    originalFinancier: string;
  }>>([]);

  const rejectProject = useCallback((projectId: string, reason: string, rejectedBy: string, rejectedByRole: 'installer' | 'financier' | 'ops') => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    setRejectedProjects(prev => [...prev, {
      project,
      reason,
      rejectedBy,
      rejectedByRole,
      rejectedAt: new Date().toISOString(),
      originalInstaller: project.installerName,
      originalFinancier: 'ASP Capital',
    }]);
    // TODO: persist to Supabase `rejected_projects` table when created
    // await supabase.from('rejected_projects').insert({ project_id: projectId, reason, rejected_by: rejectedBy, ... });
  }, [projects]);

  const reassignProject = useCallback((projectId: string, field: 'installer' | 'financier', newValue: string) => {
    setRejectedProjects(prev => prev.filter(r => r.project.id !== projectId));
    if (field === 'installer') {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, installerName: newValue } : p));
    }
    // TODO: persist reassignment to Supabase
    // await supabase.from('projects').update({ installer_name: newValue }).eq('id', projectId);
  }, []);

  const getRejectedProjects = useCallback(() => rejectedProjects, [rejectedProjects]);

  const isMilestoneLocked = useCallback((projectId: string, milestoneIndex: number): boolean => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return true;
    return milestoneIndex > project.currentMilestone;
  }, [projects]);

  const value: ProjectStoreContextType = {
    projects, qcQueue, milestoneStates, tickets, financierUpdates, financierUploads, projectMessages, sellProjects,
    rejectedProjects,
    acceptDeal, toggleChecklist, uploadFile, setTextEntry, setDateEntry, approveMilestone, submitMilestoneForQC, approveFundRelease,
    releaseFund, setOpsNotes, getMilestoneState, isMilestoneReady, getProjectsForInstaller, getProjectsForRep,
    getAllActiveProjects, createTicket, addTicketMessage, resolveTicket, getTicketsForProject,
    addFinancierUpdate, addFinancierUpload, addProjectMessage, deleteProject, deleteSellProject,
    addSellProject, updateSellProject,
    markSellProjectClean, markSellProjectDirty, getSellProjectsPendingApproval, getSellProjectsClean,
    rejectProject, reassignProject, getRejectedProjects, isMilestoneLocked,
  };

  return (
    <SupabaseProjectStoreContext.Provider value={value}>
      {children}
    </SupabaseProjectStoreContext.Provider>
  );
};

export const useSupabaseProjectStore = () => {
  const ctx = useContext(SupabaseProjectStoreContext);
  if (!ctx) throw new Error('useSupabaseProjectStore must be used within SupabaseProjectStoreProvider');
  return ctx;
};
