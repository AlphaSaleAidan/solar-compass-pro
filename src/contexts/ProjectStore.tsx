import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';
import type { Project, SellProject, CustomerChecklist } from '@/data/mockData';

// Per-project milestone tracking state
export interface ProjectMilestoneState {
  checklistDone: Record<string, boolean>;
  uploads: Record<string, string[]>;
  textEntries: Record<string, string>;
  dateEntries: Record<string, string>;
  fundStatus: Record<number, 'none' | 'pending' | 'approved' | 'released'>;
  opsNotes: Record<number, string>;
}

// Shared ticket type
export interface SharedTicket {
  id: string;
  projectId: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  createdBy: string;
  createdByRole: string;
  messages: { sender: string; role: string; text: string; time: string }[];
}

// Per-project financier update
export interface FinancierUpdate {
  id: string;
  projectId: string;
  text: string;
  author: string;
  timestamp: string;
}

// Per-project financier upload
export interface FinancierUpload {
  projectId: string;
  fileName: string;
  type: 'document' | 'photo';
  uploadedAt: string;
  uploadedBy: string;
}

// Per-project communication message
export interface ProjectMessage {
  sender: string;
  role: string;
  text: string;
  time: string;
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
  loading: boolean;
}

interface ProjectStoreActions {
  acceptDeal: (projectId: string, updatedUsage?: number) => void;
  toggleChecklist: (projectId: string, checklistItemId: string, done: boolean) => void;
  uploadFile: (projectId: string, checklistItemId: string, fileName: string) => void;
  setTextEntry: (projectId: string, checklistItemId: string, text: string) => void;
  setDateEntry: (projectId: string, checklistItemId: string, date: string) => void;
  approveMilestone: (projectId: string, milestoneIndex: number) => void;
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

type ProjectStoreContextType = ProjectStoreState & ProjectStoreActions;

const ProjectStoreContext = createContext<ProjectStoreContextType | null>(null);

const createDefaultMilestoneState = (): ProjectMilestoneState => ({
  checklistDone: {},
  uploads: {},
  textEntries: {},
  dateEntries: {},
  fundStatus: {},
  opsNotes: {},
});

// ── Supabase ↔ UI type mappers ──

const SELL_STATUSES = ['new', 'credit_check', 'aurora_synced', 'converted', 'documents_sent', 'welcome_call_done', 'site_survey_done', 'submitted_for_approval', 'approved_clean', 'marked_dirty'];
const PIPELINE_STATUSES = ['in_pipeline', 'completed'];

function mapDbToSellProject(row: any): SellProject {
  const names = (row.customer_name || '').split(' ');
  const firstName = names[0] || '';
  const lastName = names.slice(1).join(' ') || '';
  const status = row.status as string;
  const creditMap: Record<string, string> = { pending: 'new', passed: 'credit_passed', failed: 'credit_fail' };

  return {
    id: row.id,
    firstName,
    lastName,
    email: row.customer_email || '',
    phone: row.customer_phone || '',
    address: [row.address, row.city, row.state, row.zip].filter(Boolean).join(', '),
    highBill: 0,
    lowBill: 0,
    allElectric: true,
    creditStatus: (creditMap[row.credit_status] || 'new') as any,
    createdAt: row.created_at?.split('T')[0] || '',
    checklist: {
      creditPassed: row.credit_status === 'passed',
      financeDocsSigned: row.documents_sent || false,
      welcomeCallCompleted: row.welcome_call_completed || false,
      siteSurveyDone: row.site_survey_completed || false,
      aspOnboarding: false,
    },
    documents: [
      { name: 'ASP Agreement', sent: row.documents_sent || false, signed: row.documents_sent || false },
      { name: 'Installer Contract', sent: row.documents_sent || false, signed: false },
      { name: 'Loan Authorization', sent: false, signed: false },
      { name: 'Welcome Call Email', sent: false, signed: false },
    ],
    surveyPhotos: [],
    auroraSynced: ['aurora_synced', 'converted', 'documents_sent', 'welcome_call_done', 'site_survey_done', 'submitted_for_approval', 'approved_clean', 'marked_dirty'].includes(status),
    auroraData: row.aurora_data ? {
      systemSize: row.system_size ? `${row.system_size} kW` : (row.aurora_data as any)?.systemSize || '',
      battery: row.battery || (row.aurora_data as any)?.battery || '',
      financier: row.financier || (row.aurora_data as any)?.financier || '',
      monthlyPayment: row.monthly_payment ? `$${row.monthly_payment}` : (row.aurora_data as any)?.monthlyPayment || '',
      adders: ((row.adders as any[]) || []).map((a: any) => typeof a === 'string' ? a : `${a.name} ($${(a.cost / 100).toLocaleString()})`),
    } : undefined,
    convertedToSale: ['converted', 'documents_sent', 'welcome_call_done', 'site_survey_done', 'submitted_for_approval', 'approved_clean', 'marked_dirty'].includes(status),
    welcomeCallComplete: row.welcome_call_completed || false,
    welcomeCallAnswers: row.welcome_call_data ? (row.welcome_call_data as any)?.answers : undefined,
    siteSurveyPhotos: row.site_survey_data ? (row.site_survey_data as any)?.photos : undefined,
    siteSurveyComplete: row.site_survey_completed || false,
    submittedForApproval: row.submitted_for_approval || false,
    approvalStatus: status === 'approved_clean' ? 'clean' : status === 'marked_dirty' ? 'dirty' : row.submitted_for_approval ? 'pending' : undefined,
    approvalNotes: row.dirty_notes || undefined,
  };
}

function mapDbToProject(row: any): Project {
  const systemSize = row.system_size ? `${row.system_size} kW` : '0 kW';
  const watts = (row.system_size || 0) * 1000;
  const adders = ((row.adders as any[]) || []).map((a: any) => typeof a === 'string' ? { name: a, cost: 0 } : { name: a.name || a, cost: a.cost || 0 });
  const adderTotal = adders.reduce((s, a) => s + a.cost, 0);
  const projectCost = watts * 2.35 + adderTotal;

  return {
    id: row.id,
    customerName: row.customer_name || '',
    address: [row.address, row.city, row.state, row.zip].filter(Boolean).join(', '),
    email: row.customer_email || '',
    phone: row.customer_phone || '',
    status: row.status === 'completed' ? 'completed' : 'active',
    currentMilestone: row.current_milestone || 0,
    totalMilestones: 7,
    systemSize,
    battery: row.battery || 'None',
    soldPPW: Number(row.price_per_watt) || 4.25,
    contractValue: Number(row.contract_value) || 0,
    projectCost,
    interestRate: Number(row.escalation_rate) || 2.99,
    loanTerms: `25 year @ ${row.escalation_rate || 2.99}%`,
    repName: row.rep_name || '',
    installerName: '',
    addedDate: row.created_at?.split('T')[0] || '',
    stage: MILESTONE_SOPS[row.current_milestone || 0]?.name || 'Contract Signed',
    adders,
    siteSurveyPhotos: [],
    permitStatus: 'pending',
    roofCondition: 'good',
    roofIssues: [],
    annualUsage: Number(row.annual_production) || 0,
    documentsSignedCount: row.documents_sent ? 6 : 0,
    totalDocuments: 6,
    dates: {
      submitted: row.created_at?.split('T')[0] || '',
      siteSurvey: row.site_survey_completed ? row.updated_at?.split('T')[0] : null,
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
  };
}

// Map SellProject status to DB status
function sellProjectToDbStatus(sp: SellProject): string {
  if (sp.approvalStatus === 'clean') return 'approved_clean';
  if (sp.approvalStatus === 'dirty') return 'marked_dirty';
  if (sp.submittedForApproval) return 'submitted_for_approval';
  if (sp.siteSurveyComplete) return 'site_survey_done';
  if (sp.welcomeCallComplete) return 'welcome_call_done';
  if (sp.documents?.every(d => d.sent)) return 'documents_sent';
  if (sp.convertedToSale) return 'converted';
  if (sp.auroraSynced) return 'aurora_synced';
  if (sp.creditStatus === 'credit_passed') return 'credit_check';
  return 'new';
}

export const ProjectStoreProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  // State - start empty, only real DB data
  const [projects, setProjects] = useState<Project[]>([]);
  const [qcQueue, setQcQueue] = useState<Project[]>([]);
  const [sellProjects, setSellProjects] = useState<SellProject[]>([]);
  const [loading, setLoading] = useState(true);

  const [milestoneStates, setMilestoneStates] = useState<Record<string, ProjectMilestoneState>>({});

  const [tickets, setTickets] = useState<SharedTicket[]>([]);
  const [financierUpdates, setFinancierUpdates] = useState<Record<string, FinancierUpdate[]>>({});
  const [financierUploads, setFinancierUploads] = useState<Record<string, FinancierUpload[]>>({});
  const [projectMessages, setProjectMessages] = useState<Record<string, ProjectMessage[]>>({});

  // ── Fetch real data from Supabase ──
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setQcQueue([]);
      setSellProjects([]);
      setMilestoneStates({});
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        setLoading(false);
        return;
      }

      const dbSellProjects: SellProject[] = [];
      const dbPipelineProjects: Project[] = [];
      const dbQcProjects: Project[] = [];
      const newMilestoneStates: Record<string, ProjectMilestoneState> = {};

      (data || []).forEach(row => {
        if (PIPELINE_STATUSES.includes(row.status)) {
          const proj = mapDbToProject(row);
          dbPipelineProjects.push(proj);
          // Build milestone state from current_milestone
          const state = createDefaultMilestoneState();
          for (let i = 0; i < (row.current_milestone || 0); i++) {
            state.fundStatus[i] = 'released';
            const sop = MILESTONE_SOPS[i];
            if (sop) sop.checklist.forEach(item => { state.checklistDone[item.id] = true; });
          }
          newMilestoneStates[proj.id] = state;
        } else {
          dbSellProjects.push(mapDbToSellProject(row));
        }
      });

      setSellProjects(dbSellProjects);
      setProjects(dbPipelineProjects);
      setQcQueue(dbQcProjects);
      setMilestoneStates(newMilestoneStates);
      setLoading(false);
    };

    fetchProjects();
  }, [user]);

  const getMilestoneState = useCallback((projectId: string): ProjectMilestoneState => {
    return milestoneStates[projectId] || createDefaultMilestoneState();
  }, [milestoneStates]);

  const updateMilestoneState = useCallback((projectId: string, updater: (prev: ProjectMilestoneState) => ProjectMilestoneState) => {
    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: updater(prev[projectId] || createDefaultMilestoneState()),
    }));
  }, []);

  const acceptDeal = useCallback((projectId: string, updatedUsage?: number) => {
    const deal = qcQueue.find(p => p.id === projectId);
    if (!deal) return;
    const acceptedProject: Project = {
      ...deal,
      annualUsage: updatedUsage || deal.annualUsage,
      status: 'active',
      currentMilestone: 0,
      stage: 'QC Approved',
    };
    setQcQueue(prev => prev.filter(p => p.id !== projectId));
    setProjects(prev => [...prev, acceptedProject]);
    setMilestoneStates(prev => ({ ...prev, [projectId]: createDefaultMilestoneState() }));
  }, [qcQueue]);

  const toggleChecklist = useCallback((projectId: string, checklistItemId: string, done: boolean) => {
    updateMilestoneState(projectId, prev => ({
      ...prev, checklistDone: { ...prev.checklistDone, [checklistItemId]: done },
    }));
  }, [updateMilestoneState]);

  const uploadFile = useCallback((projectId: string, checklistItemId: string, fileName: string) => {
    updateMilestoneState(projectId, prev => ({
      ...prev,
      uploads: { ...prev.uploads, [checklistItemId]: [...(prev.uploads[checklistItemId] || []), fileName] },
      checklistDone: { ...prev.checklistDone, [checklistItemId]: true },
    }));
  }, [updateMilestoneState]);

  const setTextEntry = useCallback((projectId: string, checklistItemId: string, text: string) => {
    updateMilestoneState(projectId, prev => ({
      ...prev, textEntries: { ...prev.textEntries, [checklistItemId]: text },
    }));
  }, [updateMilestoneState]);

  const setDateEntry = useCallback((projectId: string, checklistItemId: string, date: string) => {
    updateMilestoneState(projectId, prev => ({
      ...prev,
      dateEntries: { ...prev.dateEntries, [checklistItemId]: date },
      checklistDone: { ...prev.checklistDone, [checklistItemId]: true },
    }));
  }, [updateMilestoneState]);

  const approveMilestone = useCallback((projectId: string, milestoneIndex: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const newMilestone = milestoneIndex + 1;
      const sop = MILESTONE_SOPS[newMilestone];
      return { ...p, currentMilestone: newMilestone, stage: sop ? sop.name : 'Completed' };
    }));
    updateMilestoneState(projectId, prev => ({
      ...prev, fundStatus: { ...prev.fundStatus, [milestoneIndex]: 'pending' },
    }));
    supabase.from('projects').update({ current_milestone: milestoneIndex + 1 }).eq('id', projectId).then();
  }, [updateMilestoneState]);

  const approveFundRelease = useCallback((projectId: string, milestoneIndex: number) => {
    updateMilestoneState(projectId, prev => ({
      ...prev, fundStatus: { ...prev.fundStatus, [milestoneIndex]: 'approved' },
    }));
  }, [updateMilestoneState]);

  const releaseFund = useCallback((projectId: string, milestoneIndex: number) => {
    updateMilestoneState(projectId, prev => ({
      ...prev, fundStatus: { ...prev.fundStatus, [milestoneIndex]: 'released' },
    }));
  }, [updateMilestoneState]);

  const setOpsNotes = useCallback((projectId: string, milestoneIndex: number, notes: string) => {
    updateMilestoneState(projectId, prev => ({
      ...prev, opsNotes: { ...prev.opsNotes, [milestoneIndex]: notes },
    }));
  }, [updateMilestoneState]);

  const isMilestoneReady = useCallback((projectId: string, milestoneIndex: number, actor?: string): boolean => {
    const state = getMilestoneState(projectId);
    const sop = MILESTONE_SOPS[milestoneIndex];
    if (!sop) return false;
    const items = actor ? sop.checklist.filter(c => c.actor === actor) : sop.checklist;
    return items.every(item => state.checklistDone[item.id]);
  }, [getMilestoneState]);

  const getProjectsForInstaller = useCallback((installerName: string) => projects.filter(p => p.installerName === installerName), [projects]);
  const getProjectsForRep = useCallback((repName: string) => projects.filter(p => p.repName === repName), [projects]);
  const getAllActiveProjects = useCallback(() => projects, [projects]);

  // Ticket actions
  const createTicket = useCallback((ticket: Omit<SharedTicket, 'id'>) => {
    const newId = `SS-${String(tickets.length + 1).padStart(3, '0')}`;
    setTickets(prev => [{ ...ticket, id: newId }, ...prev]);
  }, [tickets.length]);

  const addTicketMessage = useCallback((ticketId: string, message: { sender: string; role: string; text: string; time: string }) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, messages: [...t.messages, message] } : t));
  }, []);

  const resolveTicket = useCallback((ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t));
  }, []);

  const getTicketsForProject = useCallback((projectId: string) => tickets.filter(t => t.projectId === projectId), [tickets]);

  const addFinancierUpdate = useCallback((projectId: string, text: string, author: string) => {
    const update: FinancierUpdate = { id: `FU-${Date.now()}`, projectId, text, author, timestamp: new Date().toLocaleString() };
    setFinancierUpdates(prev => ({ ...prev, [projectId]: [...(prev[projectId] || []), update] }));
  }, []);

  const addFinancierUpload = useCallback((projectId: string, fileName: string, type: 'document' | 'photo', uploadedBy: string) => {
    const upload: FinancierUpload = { projectId, fileName, type, uploadedAt: new Date().toLocaleString(), uploadedBy };
    setFinancierUploads(prev => ({ ...prev, [projectId]: [...(prev[projectId] || []), upload] }));
  }, []);

  const addProjectMessage = useCallback((projectId: string, message: ProjectMessage) => {
    setProjectMessages(prev => ({ ...prev, [projectId]: [...(prev[projectId] || []), message] }));
  }, []);

  // ── Sell project actions (Supabase-backed) ──

  const addSellProject = useCallback(async (project: SellProject) => {
    setSellProjects(prev => [project, ...prev]);
    const { error } = await supabase.from('projects').insert({
      id: project.id,
      customer_name: `${project.firstName} ${project.lastName}`.trim(),
      customer_email: project.email || null,
      customer_phone: project.phone || null,
      address: project.address,
      status: 'new' as any,
      credit_status: 'pending' as any,
      sales_rep_id: user?.id || null,
      rep_name: user?.name || null,
      adders: [] as any,
      escalation_rate: 2.99,
    });
    if (error) console.error('Error inserting project:', error);
  }, [user]);

  const updateSellProject = useCallback(async (project: SellProject) => {
    setSellProjects(prev => prev.map(p => p.id === project.id ? project : p));
    const dbStatus = sellProjectToDbStatus(project);
    const update: Record<string, any> = {
      status: dbStatus,
      credit_status: project.creditStatus === 'credit_passed' ? 'passed' : project.creditStatus === 'credit_fail' ? 'failed' : 'pending',
      documents_sent: project.documents?.every(d => d.sent) || false,
      welcome_call_completed: project.welcomeCallComplete || false,
      welcome_call_data: project.welcomeCallAnswers ? { answers: project.welcomeCallAnswers } : null,
      site_survey_completed: project.siteSurveyComplete || false,
      site_survey_data: project.siteSurveyPhotos ? { photos: project.siteSurveyPhotos } : null,
      submitted_for_approval: project.submittedForApproval || false,
      approval_status: project.approvalStatus || null,
      dirty_notes: project.approvalNotes || null,
    };
    if (project.auroraData) {
      update.aurora_data = project.auroraData;
      update.system_size = parseFloat(project.auroraData.systemSize) || null;
      update.battery = project.auroraData.battery || null;
      update.financier = project.auroraData.financier || null;
      update.monthly_payment = parseFloat(project.auroraData.monthlyPayment?.replace('$', '') || '') || null;
    }
    const { error } = await supabase.from('projects').update(update).eq('id', project.id);
    if (error) console.error('Error updating project:', error);
  }, []);

  const markSellProjectClean = useCallback(async (projectId: string) => {
    setSellProjects(prev => prev.map(p => p.id === projectId ? { ...p, approvalStatus: 'clean' as const } : p));
    await supabase.from('projects').update({
      status: 'approved_clean' as any,
      approval_status: 'clean',
      approved_at: new Date().toISOString(),
    }).eq('id', projectId);

    const sp = sellProjects.find(p => p.id === projectId);
    if (sp) {
      const newProject: Project = {
        id: projectId,
        customerName: `${sp.firstName} ${sp.lastName}`,
        address: sp.address,
        email: sp.email,
        phone: sp.phone,
        status: 'active',
        currentMilestone: 0,
        totalMilestones: 7,
        systemSize: sp.auroraData?.systemSize || '0 kW',
        battery: sp.auroraData?.battery || 'None',
        soldPPW: 4.25,
        contractValue: 0,
        projectCost: 0,
        interestRate: 2.99,
        loanTerms: '25 year @ 2.99%',
        repName: '',
        installerName: '',
        addedDate: new Date().toISOString().split('T')[0],
        stage: 'Contract Signed',
        adders: [],
        siteSurveyPhotos: [],
        permitStatus: 'pending',
        roofCondition: 'good',
        roofIssues: [],
        annualUsage: sp.highBill * 12,
        documentsSignedCount: 3,
        totalDocuments: 6,
        dates: { submitted: new Date().toISOString().split('T')[0], siteSurvey: null, sowConfirmed: null, permitSubmitted: null, lastHOContact: new Date().toISOString().split('T')[0] },
        milestoneDetails: [],
        checklist: { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: true, siteSurveyDone: true, aspOnboarding: false },
      };
      setProjects(prev => [...prev, newProject]);
      setMilestoneStates(prev => ({ ...prev, [newProject.id]: createDefaultMilestoneState() }));
      await supabase.from('projects').update({ status: 'in_pipeline' as any, current_milestone: 0 }).eq('id', projectId);
    }
  }, [sellProjects]);

  const markSellProjectDirty = useCallback(async (projectId: string, notes: string) => {
    setSellProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, approvalStatus: 'dirty' as const, approvalNotes: notes } : p
    ));
    await supabase.from('projects').update({
      status: 'marked_dirty' as any,
      approval_status: 'dirty',
      dirty_notes: notes,
    }).eq('id', projectId);
  }, []);

  const getSellProjectsPendingApproval = useCallback(() => sellProjects.filter(p => p.approvalStatus === 'pending'), [sellProjects]);
  const getSellProjectsClean = useCallback(() => sellProjects.filter(p => p.approvalStatus === 'clean'), [sellProjects]);

  const value: ProjectStoreContextType = {
    projects, qcQueue, milestoneStates, tickets, financierUpdates, financierUploads, projectMessages, sellProjects, loading,
    acceptDeal, toggleChecklist, uploadFile, setTextEntry, setDateEntry, approveMilestone, approveFundRelease,
    releaseFund, setOpsNotes, getMilestoneState, isMilestoneReady, getProjectsForInstaller, getProjectsForRep,
    getAllActiveProjects, createTicket, addTicketMessage, resolveTicket, getTicketsForProject,
    addFinancierUpdate, addFinancierUpload, addProjectMessage, addSellProject, updateSellProject,
    markSellProjectClean, markSellProjectDirty, getSellProjectsPendingApproval, getSellProjectsClean,
  };

  return (
    <ProjectStoreContext.Provider value={value}>
      {children}
    </ProjectStoreContext.Provider>
  );
};

export const useProjectStore = () => {
  const ctx = useContext(ProjectStoreContext);
  if (!ctx) throw new Error('useProjectStore must be used within ProjectStoreProvider');
  return ctx;
};
