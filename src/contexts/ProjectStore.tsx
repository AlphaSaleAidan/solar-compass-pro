import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PROJECTS, QC_QUEUE, SELL_PROJECTS, type Project, type SellProject } from '@/data/mockData';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';

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
  // Ticket actions
  createTicket: (ticket: Omit<SharedTicket, 'id'>) => void;
  addTicketMessage: (ticketId: string, message: { sender: string; role: string; text: string; time: string }) => void;
  resolveTicket: (ticketId: string) => void;
  getTicketsForProject: (projectId: string) => SharedTicket[];
  // Financier actions
  addFinancierUpdate: (projectId: string, text: string, author: string) => void;
  addFinancierUpload: (projectId: string, fileName: string, type: 'document' | 'photo', uploadedBy: string) => void;
  addProjectMessage: (projectId: string, message: ProjectMessage) => void;
  // Sell project actions
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

// Initial mock messages per project
const INITIAL_PROJECT_MESSAGES: Record<string, ProjectMessage[]> = {
  'ASP-2025': [
    { sender: 'Marcus Reeves', role: 'financier', text: 'M4 install photos look good. Approving fund release.', time: '2026-02-10 10:30 AM' },
    { sender: 'Admin Ops', role: 'ops', text: 'Confirmed. Funds queued for release.', time: '2026-02-10 11:00 AM' },
  ],
  'ASP-2027': [
    { sender: 'Caitlin Frost', role: 'financier', text: 'Crew assignment confirmed for ASP-2027. Materials staged.', time: '2026-02-18 9:15 AM' },
    { sender: 'Admin Ops', role: 'ops', text: 'Homeowner confirmed install window. All clear.', time: '2026-02-18 2:00 PM' },
  ],
};

export const ProjectStoreProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([...PROJECTS]);
  const [qcQueue, setQcQueue] = useState<Project[]>([...QC_QUEUE]);
  const [milestoneStates, setMilestoneStates] = useState<Record<string, ProjectMilestoneState>>(() => {
    const states: Record<string, ProjectMilestoneState> = {};
    PROJECTS.forEach(p => {
      const state = createDefaultMilestoneState();
      for (let i = 0; i < p.currentMilestone; i++) {
        state.fundStatus[i] = 'released';
        const sop = MILESTONE_SOPS[i];
        if (sop) {
          sop.checklist.forEach(item => {
            state.checklistDone[item.id] = true;
          });
        }
      }
      states[p.id] = state;
    });
    return states;
  });

  const [tickets, setTickets] = useState<SharedTicket[]>([
    {
      id: 'SS-001', projectId: 'ASP-2030', subject: 'Roof damage escalation — install blocked', priority: 'critical', status: 'open', createdAt: '2026-03-20', createdBy: 'Admin Ops', createdByRole: 'ops',
      messages: [
        { sender: 'Admin Ops', role: 'ops', text: 'ASP-2030 (Angela Davis) has major roof damage. Install can\'t proceed until roof is repaired.', time: '10:15 AM' },
        { sender: 'Super Support', role: 'support', text: 'Acknowledged. Placing project on hold until roof report is complete.', time: '10:22 AM' },
      ],
    },
    {
      id: 'SS-002', projectId: 'ASP-2034', subject: 'Financing hold — customer re-qualification', priority: 'high', status: 'in_progress', createdAt: '2026-03-18', createdBy: 'Admin Ops', createdByRole: 'ops',
      messages: [
        { sender: 'Admin Ops', role: 'ops', text: 'Deborah White (ASP-2034) is on hold for financing. Credit was approved but the lender flagged the DTI ratio.', time: 'Yesterday 2:30 PM' },
        { sender: 'Super Support', role: 'support', text: 'GoodLeap approved her at 2.99% / 25yr. Sending new docs now.', time: 'Today 9:00 AM' },
      ],
    },
    {
      id: 'SS-003', projectId: 'ASP-2026', subject: 'Shingle damage — installer needs guidance', priority: 'medium', status: 'open', createdAt: '2026-03-22', createdBy: 'Admin Ops', createdByRole: 'ops',
      messages: [
        { sender: 'Admin Ops', role: 'ops', text: 'Patricia Williams (ASP-2026) has minor shingle wear. Installer wants to know if they should proceed.', time: '3:00 PM' },
      ],
    },
  ]);

  const [financierUpdates, setFinancierUpdates] = useState<Record<string, FinancierUpdate[]>>({});
  const [financierUploads, setFinancierUploads] = useState<Record<string, FinancierUpload[]>>({});
  const [projectMessages, setProjectMessages] = useState<Record<string, ProjectMessage[]>>(INITIAL_PROJECT_MESSAGES);
  const [sellProjects, setSellProjects] = useState<SellProject[]>([...SELL_PROJECTS]);

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
    setMilestoneStates(prev => ({
      ...prev,
      [projectId]: createDefaultMilestoneState(),
    }));
  }, [qcQueue]);

  const toggleChecklist = useCallback((projectId: string, checklistItemId: string, done: boolean) => {
    updateMilestoneState(projectId, prev => ({
      ...prev,
      checklistDone: { ...prev.checklistDone, [checklistItemId]: done },
    }));
  }, [updateMilestoneState]);

  const uploadFile = useCallback((projectId: string, checklistItemId: string, fileName: string) => {
    updateMilestoneState(projectId, prev => ({
      ...prev,
      uploads: {
        ...prev.uploads,
        [checklistItemId]: [...(prev.uploads[checklistItemId] || []), fileName],
      },
      checklistDone: { ...prev.checklistDone, [checklistItemId]: true },
    }));
  }, [updateMilestoneState]);

  const setTextEntry = useCallback((projectId: string, checklistItemId: string, text: string) => {
    updateMilestoneState(projectId, prev => ({
      ...prev,
      textEntries: { ...prev.textEntries, [checklistItemId]: text },
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
      return {
        ...p,
        currentMilestone: newMilestone,
        stage: sop ? sop.name : 'Completed',
      };
    }));
    updateMilestoneState(projectId, prev => ({
      ...prev,
      fundStatus: { ...prev.fundStatus, [milestoneIndex]: 'pending' },
    }));
  }, [updateMilestoneState]);

  const approveFundRelease = useCallback((projectId: string, milestoneIndex: number) => {
    updateMilestoneState(projectId, prev => ({
      ...prev,
      fundStatus: { ...prev.fundStatus, [milestoneIndex]: 'approved' },
    }));
  }, [updateMilestoneState]);

  const releaseFund = useCallback((projectId: string, milestoneIndex: number) => {
    updateMilestoneState(projectId, prev => ({
      ...prev,
      fundStatus: { ...prev.fundStatus, [milestoneIndex]: 'released' },
    }));
  }, [updateMilestoneState]);

  const setOpsNotes = useCallback((projectId: string, milestoneIndex: number, notes: string) => {
    updateMilestoneState(projectId, prev => ({
      ...prev,
      opsNotes: { ...prev.opsNotes, [milestoneIndex]: notes },
    }));
  }, [updateMilestoneState]);

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

  const getAllActiveProjects = useCallback(() => {
    return projects;
  }, [projects]);

  // Ticket actions
  const createTicket = useCallback((ticket: Omit<SharedTicket, 'id'>) => {
    const newId = `SS-${String(tickets.length + 1).padStart(3, '0')}`;
    setTickets(prev => [{ ...ticket, id: newId }, ...prev]);
  }, [tickets.length]);

  const addTicketMessage = useCallback((ticketId: string, message: { sender: string; role: string; text: string; time: string }) => {
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, messages: [...t.messages, message] } : t
    ));
  }, []);

  const resolveTicket = useCallback((ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t));
  }, []);

  const getTicketsForProject = useCallback((projectId: string) => {
    return tickets.filter(t => t.projectId === projectId);
  }, [tickets]);

  // Financier actions
  const addFinancierUpdate = useCallback((projectId: string, text: string, author: string) => {
    const update: FinancierUpdate = {
      id: `FU-${Date.now()}`,
      projectId,
      text,
      author,
      timestamp: new Date().toLocaleString(),
    };
    setFinancierUpdates(prev => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), update],
    }));
  }, []);

  const addFinancierUpload = useCallback((projectId: string, fileName: string, type: 'document' | 'photo', uploadedBy: string) => {
    const upload: FinancierUpload = {
      projectId,
      fileName,
      type,
      uploadedAt: new Date().toLocaleString(),
      uploadedBy,
    };
    setFinancierUploads(prev => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), upload],
    }));
  }, []);

  const addProjectMessage = useCallback((projectId: string, message: ProjectMessage) => {
    setProjectMessages(prev => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), message],
    }));
  }, []);

  // Sell project actions
  const updateSellProject = useCallback((project: SellProject) => {
    setSellProjects(prev => prev.map(p => p.id === project.id ? project : p));
  }, []);

  const markSellProjectClean = useCallback((projectId: string) => {
    setSellProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, approvalStatus: 'clean' as const };
    }));
    // Add to main projects pipeline (installer/financier visible)
    const sp = sellProjects.find(p => p.id === projectId);
    if (sp && sp.auroraData) {
      const newProject: Project = {
        id: `ASP-${2060 + projects.length}`,
        customerName: `${sp.firstName} ${sp.lastName}`,
        address: sp.address,
        email: sp.email,
        phone: sp.phone,
        status: 'active',
        currentMilestone: 0,
        totalMilestones: 7,
        systemSize: sp.auroraData.systemSize,
        battery: sp.auroraData.battery,
        soldPPW: 4.25,
        contractValue: 0,
        projectCost: 0,
        interestRate: 2.99,
        loanTerms: '25 year @ 2.99%',
        repName: 'Jordan Mills',
        installerName: 'SunTech Installations',
        addedDate: new Date().toISOString().split('T')[0],
        stage: 'Contract Signed',
        adders: sp.auroraData.adders.map(a => ({ name: a.split(' (')[0], cost: parseInt(a.match(/\$(\d+)/)?.[1] || '0') * 100 })),
        siteSurveyPhotos: [],
        permitStatus: 'pending',
        roofCondition: 'good',
        roofIssues: [],
        annualUsage: sp.highBill * 12,
        documentsSignedCount: 3,
        totalDocuments: 6,
        dates: {
          submitted: new Date().toISOString().split('T')[0],
          siteSurvey: null,
          sowConfirmed: null,
          permitSubmitted: null,
          lastHOContact: new Date().toISOString().split('T')[0],
        },
        milestoneDetails: [],
        checklist: { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: true, siteSurveyDone: true, aspOnboarding: false },
      };
      setProjects(prev => [...prev, newProject]);
      setMilestoneStates(prev => ({
        ...prev,
        [newProject.id]: createDefaultMilestoneState(),
      }));
    }
  }, [sellProjects, projects.length]);

  const markSellProjectDirty = useCallback((projectId: string, notes: string) => {
    setSellProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, approvalStatus: 'dirty' as const, approvalNotes: notes } : p
    ));
  }, []);

  const getSellProjectsPendingApproval = useCallback(() => {
    return sellProjects.filter(p => p.approvalStatus === 'pending');
  }, [sellProjects]);

  const getSellProjectsClean = useCallback(() => {
    return sellProjects.filter(p => p.approvalStatus === 'clean');
  }, [sellProjects]);

  const value: ProjectStoreContextType = {
    projects,
    qcQueue,
    milestoneStates,
    tickets,
    financierUpdates,
    financierUploads,
    projectMessages,
    sellProjects,
    acceptDeal,
    toggleChecklist,
    uploadFile,
    setTextEntry,
    setDateEntry,
    approveMilestone,
    approveFundRelease,
    releaseFund,
    setOpsNotes,
    getMilestoneState,
    isMilestoneReady,
    getProjectsForInstaller,
    getProjectsForRep,
    getAllActiveProjects,
    createTicket,
    addTicketMessage,
    resolveTicket,
    getTicketsForProject,
    addFinancierUpdate,
    addFinancierUpload,
    addProjectMessage,
    updateSellProject,
    markSellProjectClean,
    markSellProjectDirty,
    getSellProjectsPendingApproval,
    getSellProjectsClean,
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
