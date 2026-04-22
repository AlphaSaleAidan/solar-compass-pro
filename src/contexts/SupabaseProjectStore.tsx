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
import { logAuditEvent } from '@/lib/auditLog';
import { useQueryClient } from '@tanstack/react-query';
import {
  onDealConvertedToSale,
  onMilestoneChecklistUpdated,
  onMilestoneOpsApproved,
  onFundReleaseApproved,
  onQcApproved,
} from '@/lib/pipelineEvents';

// This store provides the SAME interface as ProjectStore but reads/writes Supabase
// It is used for all non-demo (production) users.

// Organization ID for AlphaSale — used when creating project records
const ORG_ID_CONST = '2017e2ba-30d3-4fc4-bd19-f59937ec9d37';

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
  dataReady?: boolean;
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
  opsApproved: {},
  dualApproval: {},
});

// Map a Supabase project row to the UI Project interface
function mapDbProjectToUI(row: any): Project {
  // Actual Supabase columns: customer_name, address, status, current_milestone, total_milestones,
  // system_size (numeric), battery, ppw, contract_value, system_cost, financier, monthly_payment,
  // usage_kwh, offset_pct, rep_id, sell_project_id, organization_id, roof_type,
  // installer_id, installer_company_id, financier_company_id, install_scheduled, permit_submitted
  const systemSizeNum = Number(row.system_size) || 0;
  const systemCost = Number(row.system_cost) || 0;
  const contractValue = Number(row.contract_value) || systemCost * 1.65;
  return {
    id: row.id,
    customerName: row.customer_name || 'Unknown',
    address: row.address || '',
    email: '',
    phone: '',
    status: row.status === 'completed' ? 'completed' : row.status === 'on_hold' ? 'on_hold' : row.status === 'delayed' ? 'delayed' : 'active',
    currentMilestone: row.current_milestone || 0,
    totalMilestones: row.total_milestones || 7,
    systemSize: systemSizeNum ? `${systemSizeNum} kW` : '0 kW',
    battery: row.battery || 'None',
    soldPPW: Number(row.ppw) || (systemSizeNum > 0 ? contractValue / (systemSizeNum * 1000) : 4.0),
    contractValue,
    projectCost: systemCost,
    interestRate: 2.99,
    loanTerms: '25 year @ 2.99%',
    repName: '',
    installerName: '',
    addedDate: row.created_at?.split('T')[0] || '',
    stage: MILESTONE_SOPS[row.current_milestone || 0]?.name || 'New',
    adders: [],
    siteSurveyPhotos: [],
    permitStatus: row.permit_submitted ? 'submitted' : 'pending',
    roofCondition: row.roof_type === 'tile' ? 'minor_damage' : 'good',
    roofIssues: [],
    annualUsage: Number(row.usage_kwh) || 0,
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
      creditPassed: true,
      financeDocsSigned: true,
      welcomeCallCompleted: false,
      siteSurveyDone: false,
      aspOnboarding: false,
    },
    // Keep raw DB id + sell_project_id for mutations
    _dbId: row.id,
    _sellProjectId: row.sell_project_id,
  } as Project & { _dbId: string; _sellProjectId?: string };
}

function mapDbSellProjectToUI(row: any): SellProject {
  // Actual sell_projects columns: id, rep_id, organization_id, first_name, last_name, email, phone, address,
  // high_bill, low_bill, all_electric, credit_status, aurora_synced, aurora_data,
  // converted_to_sale, qc_initial_approved, approval_status, checklist,
  // docs_sent, all_docs_signed, dirty_notes, welcome_call_complete, welcome_call_answers,
  // site_survey_complete, site_survey_data, final_submitted, created_at, updated_at
  const creditStatus = row.credit_status === 'passed' ? 'credit_passed' 
    : row.credit_status === 'credit_pass' ? 'credit_passed'
    : row.credit_status === 'credit_fail' ? 'credit_fail'
    : row.credit_status || 'new';
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email || '',
    phone: row.phone || '',
    address: row.address || '',
    highBill: Number(row.high_bill) || 0,
    lowBill: Number(row.low_bill) || 0,
    allElectric: row.all_electric || false,
    creditStatus,
    createdAt: row.created_at?.split('T')[0] || '',
    checklist: { creditPassed: creditStatus === 'credit_passed', financeDocsSigned: false, welcomeCallCompleted: row.welcome_call_complete || false, siteSurveyDone: row.site_survey_complete || false, aspOnboarding: false },
    documents: [],
    surveyPhotos: [],
    auroraSynced: row.aurora_synced || false,
    auroraData: row.aurora_data || undefined,
    convertedToSale: row.converted_to_sale || false,
    welcomeCallComplete: row.welcome_call_complete || false,
    welcomeCallAnswers: row.welcome_call_answers || undefined,
    siteSurveyPhotos: undefined,
    siteSurveyComplete: row.site_survey_complete || false,
    submittedForApproval: row.final_submitted || false,
    approvalStatus: row.approval_status || 'pending',
    approvalNotes: row.dirty_notes || undefined,
    welcomeCallRecordingUrl: undefined,
    qcInitialApproved: row.qc_initial_approved || false,
    documentsSigned: row.all_docs_signed || false,
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
  // Pipeline event actor — fire-and-forget, never blocks UI
  const actor = { userId: user?.id || '', role: user?.role || 'sales_rep', name: user?.name || 'Unknown' };
  const [projects, setProjects] = useState<Project[]>([]);
  const [dataReady, setDataReady] = useState(false);
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
      setDataReady(true);
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
        // Actual schema: ONE row per project with JSONB columns:
        // checklist_done (Record<itemId, bool>), installer_submitted (Record<milestoneIdx, bool>),
        // ops_approved (Record<milestoneIdx, bool>), fund_status (Record<milestoneIdx, string>),
        // ops_notes (Record<milestoneIdx, string>)
        data.forEach((row: any) => {
          const proj = projects.find(p => (p as any)._dbId === row.project_id);
          const key = proj?.id || row.project_id;
          if (!states[key]) states[key] = createDefaultMilestoneState();
          const ms = states[key];
          if (row.checklist_done) Object.assign(ms.checklistDone, row.checklist_done);
          // fund_status is a JSONB object: { "0": "released", "1": "pending", ... }
          if (row.fund_status && typeof row.fund_status === 'object') {
            Object.entries(row.fund_status).forEach(([idx, status]) => {
              ms.fundStatus[Number(idx)] = status as any;
            });
          }
          // ops_notes is a JSONB object: { "0": "notes...", ... }
          if (row.ops_notes && typeof row.ops_notes === 'object') {
            Object.entries(row.ops_notes).forEach(([idx, note]) => {
              ms.opsNotes[Number(idx)] = note as string;
            });
          }
          // installer_submitted is JSONB: { "0": true, "1": true, ... }
          if (row.installer_submitted && typeof row.installer_submitted === 'object') {
            Object.assign(ms.installerSubmitted, row.installer_submitted);
          }
          // ops_approved is JSONB: { "0": true, ... }
          if (row.ops_approved && typeof row.ops_approved === 'object') {
            if (!ms.opsApproved) ms.opsApproved = {};
            Object.assign(ms.opsApproved, row.ops_approved);
          }
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
    if (user?.id) logAuditEvent({ action: 'converted_to_sale', actorId: user.id, projectId: dbId });
    onDealConvertedToSale(actor, projectId, dbId).catch(() => {});
  }, [projects, user]);

  // ──────────────────────────────────────────────────────────────
  // Helper: upsert a single JSONB column on the milestone_states row for this project.
  // The actual table has ONE ROW per project with JSONB columns:
  //   checklist_done, installer_submitted, ops_approved, fund_status, ops_notes
  // No milestone_index column, no uploads/text_entries/date_entries columns.
  // ──────────────────────────────────────────────────────────────
  const patchMilestoneState = useCallback(async (dbProjectId: string, updates: Record<string, any>) => {
    const { data: existing } = await supabase
      .from('milestone_states')
      .select('id')
      .eq('project_id', dbProjectId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase.from('milestone_states').update(updates).eq('project_id', dbProjectId);
      if (error) console.error('patchMilestoneState update failed:', error.message);
    } else {
      const { error } = await supabase.from('milestone_states').insert({ project_id: dbProjectId, ...updates });
      if (error) console.error('patchMilestoneState insert failed:', error.message);
    }
  }, []);

  const toggleChecklist = useCallback(async (projectId: string, checklistItemId: string, done: boolean) => {
    const dbId = getDbId(projectId);
    const state = milestoneStates[projectId] || createDefaultMilestoneState();
    const newChecklist = { ...state.checklistDone, [checklistItemId]: done };
    
    await patchMilestoneState(dbId, { checklist_done: newChecklist });
    onMilestoneChecklistUpdated(actor, dbId, { milestone_index: 0, checklist_item_id: checklistItemId, checked: done }).catch(() => {});

    // Optimistic update
    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), checklistDone: newChecklist },
    }));
  }, [milestoneStates, projects, patchMilestoneState]);

  const uploadFile = useCallback(async (projectId: string, checklistItemId: string, fileName: string) => {
    const dbId = getDbId(projectId);
    const state = milestoneStates[projectId] || createDefaultMilestoneState();
    const newUploads = { ...state.uploads, [checklistItemId]: [...(state.uploads[checklistItemId] || []), fileName] };
    const newChecklist = { ...state.checklistDone, [checklistItemId]: true };

    // uploads are stored in checklist_done JSONB (no separate uploads column)
    await patchMilestoneState(dbId, { checklist_done: newChecklist });

    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), uploads: newUploads, checklistDone: newChecklist },
    }));
  }, [milestoneStates, projects, patchMilestoneState]);

  const setTextEntry = useCallback(async (projectId: string, checklistItemId: string, text: string) => {
    const dbId = getDbId(projectId);
    const state = milestoneStates[projectId] || createDefaultMilestoneState();
    const newEntries = { ...state.textEntries, [checklistItemId]: text };

    // text entries stored locally — no text_entries column exists; mark checklist item done
    const newChecklist = { ...state.checklistDone, [checklistItemId]: true };
    await patchMilestoneState(dbId, { checklist_done: newChecklist });

    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), textEntries: newEntries, checklistDone: newChecklist },
    }));
  }, [milestoneStates, projects, patchMilestoneState]);

  const setDateEntry = useCallback(async (projectId: string, checklistItemId: string, date: string) => {
    const dbId = getDbId(projectId);
    const state = milestoneStates[projectId] || createDefaultMilestoneState();
    const newEntries = { ...state.dateEntries, [checklistItemId]: date };
    const newChecklist = { ...state.checklistDone, [checklistItemId]: true };

    await patchMilestoneState(dbId, { checklist_done: newChecklist });

    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), dateEntries: newEntries, checklistDone: newChecklist },
    }));
  }, [milestoneStates, projects, patchMilestoneState]);

  const submitMilestoneForQC = useCallback(async (projectId: string, milestoneIndex: number) => {
    const dbId = getDbId(projectId);
    const state = milestoneStates[projectId] || createDefaultMilestoneState();
    const newSubmitted = { ...state.installerSubmitted, [milestoneIndex]: true };
    await patchMilestoneState(dbId, { installer_submitted: newSubmitted });
    setMilestoneStates(prev => {
      const s = prev[projectId] || createDefaultMilestoneState();
      return { ...prev, [projectId]: { ...s, installerSubmitted: newSubmitted } };
    });
    if (user?.id) logAuditEvent({ action: 'milestone_submitted', actorId: user.id, projectId: dbId, details: { milestoneIndex } });
    onQcApproved(actor, dbId).catch(() => {});
  }, [user, milestoneStates, patchMilestoneState]);

  const approveMilestone = useCallback(async (projectId: string, milestoneIndex: number) => {
    const dbId = getDbId(projectId);
    const newMilestone = milestoneIndex + 1;
    const state = milestoneStates[projectId] || createDefaultMilestoneState();
    
    await supabase.from('projects').update({ current_milestone: newMilestone }).eq('id', dbId);
    
    const newOpsApproved = { ...state.opsApproved, [milestoneIndex]: true };
    const newFundStatus = { ...state.fundStatus, [milestoneIndex]: 'pending' };
    await patchMilestoneState(dbId, { ops_approved: newOpsApproved, fund_status: newFundStatus });

    // If Install Completed milestone (index 4) is approved, update leaderboard installs
    if (milestoneIndex === 4) {
      const project = projects.find(p => p.id === projectId);
      const repId = (project as any)?._dbId ? undefined : undefined; // rep_id from project
      // Try to get rep_id from the project's DB record
      const { data: projRow } = await supabase.from('projects').select('rep_id').eq('id', dbId).maybeSingle();
      if (projRow?.rep_id) {
        const { data: existing } = await supabase
          .from('leaderboard')
          .select('*')
          .eq('user_id', projRow.rep_id)
          .maybeSingle();
        if (existing) {
          await supabase.from('leaderboard').update({
            installs_count: (existing as any).installs_count + 1,
          }).eq('user_id', projRow.rep_id);
        }
      }
    }

    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, currentMilestone: newMilestone, stage: MILESTONE_SOPS[newMilestone]?.name || 'Completed' } : p));
    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), opsApproved: newOpsApproved, fundStatus: newFundStatus },
    }));
    if (user?.id) logAuditEvent({ action: 'milestone_ops_approved', actorId: user.id, projectId: dbId, details: { milestoneIndex, newMilestone } });
    onMilestoneOpsApproved(actor, dbId, milestoneIndex).catch(() => {});
  }, [projects, user, milestoneStates, patchMilestoneState]);

  const approveFundRelease = useCallback(async (projectId: string, milestoneIndex: number) => {
    const dbId = getDbId(projectId);
    const state = milestoneStates[projectId] || createDefaultMilestoneState();
    const newFundStatus = { ...state.fundStatus, [milestoneIndex]: 'approved' };
    await patchMilestoneState(dbId, { fund_status: newFundStatus });

    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), fundStatus: newFundStatus },
    }));
    if (user?.id) logAuditEvent({ action: 'fund_approved', actorId: user.id, projectId: dbId, details: { milestoneIndex } });
    onFundReleaseApproved(actor, dbId, { fund_release_id: `${dbId}-m${milestoneIndex}` }).catch(() => {});
  }, [projects, user, milestoneStates, patchMilestoneState]);

  const releaseFund = useCallback(async (projectId: string, milestoneIndex: number) => {
    const dbId = getDbId(projectId);
    const proj = projects.find(p => p.id === projectId);
    const sop = MILESTONE_SOPS[milestoneIndex];
    const amount = (proj?.projectCost || 0) * (sop?.fundPercent || 0) / 100;
    const state = milestoneStates[projectId] || createDefaultMilestoneState();

    const newFundStatus = { ...state.fundStatus, [milestoneIndex]: 'released' };
    await patchMilestoneState(dbId, { fund_status: newFundStatus });

    // fund_releases table: milestone_index (integer), amount, released_by
    await supabase.from('fund_releases').insert({
      project_id: dbId,
      milestone_index: milestoneIndex,
      amount,
      released_by: user?.id,
    });

    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), fundStatus: newFundStatus },
    }));
    if (user?.id) logAuditEvent({ action: 'fund_released', actorId: user.id, projectId: dbId, details: { milestoneIndex, amount, percent: sop?.fundPercent } });
  }, [projects, user, milestoneStates, patchMilestoneState]);

  const setOpsNotes = useCallback(async (projectId: string, milestoneIndex: number, notes: string) => {
    const dbId = getDbId(projectId);
    const state = milestoneStates[projectId] || createDefaultMilestoneState();
    const newOpsNotes = { ...state.opsNotes, [milestoneIndex]: notes };
    await patchMilestoneState(dbId, { ops_notes: newOpsNotes });

    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || createDefaultMilestoneState()), opsNotes: { ...(prev[projectId]?.opsNotes || {}), [milestoneIndex]: notes } },
    }));
  }, [projects, milestoneStates, patchMilestoneState]);

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
    // Actual columns: rep_id, organization_id, first_name, last_name, email, phone, address,
    // high_bill, low_bill, all_electric, credit_status (NOT created_by)
    const { error } = await supabase.from('sell_projects').insert({
      rep_id: user?.id || null,
      organization_id: ORG_ID_CONST,
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
    if (error) console.error('addSellProject failed:', error.message);
    if (user?.id) logAuditEvent({ action: 'sell_project_created', actorId: user.id, details: { firstName: project.firstName, lastName: project.lastName } });
  }, [user]);

  const updateSellProject = useCallback(async (project: SellProject) => {
    const dbId = getSellDbId(project.id);
    // Column names must match the actual Supabase schema exactly
    const { error } = await supabase.from('sell_projects').update({
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
      site_survey_complete: project.siteSurveyComplete,
      docs_sent: project.checklist?.financeDocsSigned || false,
      all_docs_signed: project.documentsSigned || false,
      approval_status: project.approvalStatus,
      dirty_notes: project.approvalNotes || null,
      qc_initial_approved: project.qcInitialApproved,
      final_submitted: project.submittedForApproval || false,
      site_survey_data: project.siteSurveyData as any || null,
    }).eq('id', dbId);
    if (error) console.error('updateSellProject failed:', error.message, 'dbId:', dbId);
  }, [sellProjects]);

  const markSellProjectClean = useCallback(async (projectId: string) => {
    const dbId = getSellDbId(projectId);
    await supabase.from('sell_projects').update({ approval_status: 'clean' }).eq('id', dbId);
    
    // Create a project from the sell_project
    const sp = sellProjects.find(p => p.id === projectId);
    if (sp) {
      const createdByUserId = (sp as any).createdBy || user?.id;
      
      // Actual projects table columns: customer_name, address, status, current_milestone,
      // system_size (numeric), battery, system_cost, contract_value, ppw, financier, usage_kwh, rep_id, sell_project_id, organization_id
      const systemSize = parseFloat(sp.auroraData?.systemSize || '0');
      const systemCost = systemSize * 1000 * 2.35;
      const { data: newProj, error: projErr } = await supabase.from('projects').insert({
        customer_name: `${sp.firstName} ${sp.lastName}`,
        address: sp.address,
        status: 'active' as any,
        current_milestone: 0,
        total_milestones: 7,
        system_size: systemSize,
        battery: sp.auroraData?.battery || 'None',
        system_cost: systemCost,
        contract_value: Math.round(systemCost * 1.65),
        ppw: systemSize > 0 ? Math.round(systemCost * 1.65 / (systemSize * 1000) * 100) / 100 : 0,
        financier: sp.auroraData?.financier || 'TBD',
        monthly_payment: sp.auroraData?.monthlyPayment || '',
        usage_kwh: (sp.highBill || 200) * 12,
        rep_id: createdByUserId,
        sell_project_id: getSellDbId(projectId),
        organization_id: ORG_ID_CONST,
      }).select('id').single();
      if (projErr) console.error('markSellProjectClean project insert failed:', projErr.message);

      // Create milestone_states row for this project so milestone operations work immediately
      if (newProj?.id) {
        await supabase.from('milestone_states').insert({
          project_id: newProj.id,
          checklist_done: {},
          installer_submitted: {},
          ops_approved: {},
          fund_status: {},
          ops_notes: {},
        });
      }

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
    if (user?.id) logAuditEvent({ action: 'qc_marked_clean', actorId: user.id, sellProjectId: dbId, details: { projectName: sp ? `${sp.firstName} ${sp.lastName}` : projectId } });
  }, [sellProjects, user]);

  const markSellProjectDirty = useCallback(async (projectId: string, notes: string) => {
    const dbId = getSellDbId(projectId);
    await supabase.from('sell_projects').update({ approval_status: 'dirty', dirty_notes: notes }).eq('id', dbId);
    setSellProjects(prev => prev.map(p => p.id === projectId ? { ...p, approvalStatus: 'dirty' as const, approvalNotes: notes } : p));
    if (user?.id) logAuditEvent({ action: 'qc_marked_dirty', actorId: user.id, sellProjectId: dbId, details: { notes } });
  }, [sellProjects, user]);

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

  const rejectProject = useCallback(async (projectId: string, reason: string, rejectedBy: string, rejectedByRole: 'installer' | 'financier' | 'ops') => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const now = new Date().toISOString();
    setRejectedProjects(prev => [...prev, {
      project,
      reason,
      rejectedBy,
      rejectedByRole,
      rejectedAt: now,
      originalInstaller: project.installerName,
      originalFinancier: 'ASP Capital',
    }]);
    // Persist status change to Supabase
    await supabase.from('projects').update({ status: 'rejected' }).eq('id', projectId);
    // Log the rejection in activity log
    await supabase.from('project_activity_log').insert({
      project_id: projectId,
      action_type: 'project_rejected',
      actor_name: rejectedBy,
      actor_role: rejectedByRole,
      portal: rejectedByRole === 'ops' ? 'operations' : rejectedByRole,
      description: `Project rejected: ${reason}`,
      metadata: { reason, original_installer: project.installerName },
    });
  }, [projects]);

  const reassignProject = useCallback(async (projectId: string, field: 'installer' | 'financier', newValue: string) => {
    setRejectedProjects(prev => prev.filter(r => r.project.id !== projectId));
    const updateFields: Record<string, string> = { status: 'active' };
    if (field === 'installer') {
      updateFields.installer_name = newValue;
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, installerName: newValue, status: 'active' } : p));
    }
    // Persist reassignment to Supabase
    await supabase.from('projects').update(updateFields).eq('id', projectId);
    await supabase.from('project_activity_log').insert({
      project_id: projectId,
      action_type: 'project_reassigned',
      actor_name: 'System',
      actor_role: 'ops',
      portal: 'operations',
      description: `Project reassigned: ${field} changed to ${newValue}`,
      metadata: { field, new_value: newValue },
    });
  }, []);

  const getRejectedProjects = useCallback(() => rejectedProjects, [rejectedProjects]);

  const isMilestoneLocked = useCallback((projectId: string, milestoneIndex: number): boolean => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return true;
    return milestoneIndex > project.currentMilestone;
  }, [projects]);

  const value: ProjectStoreContextType = {
    projects, qcQueue, milestoneStates, tickets, financierUpdates, financierUploads, projectMessages, sellProjects,
    rejectedProjects, dataReady,
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
