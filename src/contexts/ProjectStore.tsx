import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PROJECTS, QC_QUEUE, type Project } from '@/data/mockData';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';

// Per-project milestone tracking state
export interface ProjectMilestoneState {
  // Checklist completion per item ID
  checklistDone: Record<string, boolean>;
  // Uploaded file names per checklist item ID
  uploads: Record<string, string[]>;
  // Text entries (reports, reviews) per checklist item ID
  textEntries: Record<string, string>;
  // Date entries per checklist item ID
  dateEntries: Record<string, string>;
  // Fund release status per milestone index (0-6)
  fundStatus: Record<number, 'none' | 'pending' | 'approved' | 'released'>;
  // Ops notes per milestone
  opsNotes: Record<number, string>;
}

interface ProjectStoreState {
  // All projects in the system
  projects: Project[];
  // QC queue (incoming deals)
  qcQueue: Project[];
  // Milestone state per project ID
  milestoneStates: Record<string, ProjectMilestoneState>;
}

interface ProjectStoreActions {
  // Accept a deal from QC queue → moves to projects
  acceptDeal: (projectId: string, updatedUsage?: number) => void;
  // Toggle a checklist item
  toggleChecklist: (projectId: string, checklistItemId: string, done: boolean) => void;
  // Upload a file for a checklist item
  uploadFile: (projectId: string, checklistItemId: string, fileName: string) => void;
  // Set text entry (report/review)
  setTextEntry: (projectId: string, checklistItemId: string, text: string) => void;
  // Set date entry
  setDateEntry: (projectId: string, checklistItemId: string, date: string) => void;
  // Approve milestone (ops) — advances project milestone and queues fund release
  approveMilestone: (projectId: string, milestoneIndex: number) => void;
  // Financier approves fund release
  approveFundRelease: (projectId: string, milestoneIndex: number) => void;
  // Mark fund as released
  releaseFund: (projectId: string, milestoneIndex: number) => void;
  // Set ops notes for a milestone
  setOpsNotes: (projectId: string, milestoneIndex: number, notes: string) => void;
  // Get milestone state for a project
  getMilestoneState: (projectId: string) => ProjectMilestoneState;
  // Check if all checklist items for a milestone are done (by actor or all)
  isMilestoneReady: (projectId: string, milestoneIndex: number, actor?: string) => boolean;
  // Get projects visible to a specific portal
  getProjectsForInstaller: (installerName: string) => Project[];
  getProjectsForRep: (repName: string) => Project[];
  getAllActiveProjects: () => Project[];
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

export const ProjectStoreProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([...PROJECTS]);
  const [qcQueue, setQcQueue] = useState<Project[]>([...QC_QUEUE]);
  const [milestoneStates, setMilestoneStates] = useState<Record<string, ProjectMilestoneState>>(() => {
    // Initialize milestone states for existing projects with pre-completed milestones marked
    const states: Record<string, ProjectMilestoneState> = {};
    PROJECTS.forEach(p => {
      const state = createDefaultMilestoneState();
      // Mark completed milestones' fund status as released
      for (let i = 0; i < p.currentMilestone; i++) {
        state.fundStatus[i] = 'released';
        // Mark all checklist items as done for completed milestones
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
    // Advance the project's current milestone
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
    // Set fund status to pending for financier approval
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

  const value: ProjectStoreContextType = {
    projects,
    qcQueue,
    milestoneStates,
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
