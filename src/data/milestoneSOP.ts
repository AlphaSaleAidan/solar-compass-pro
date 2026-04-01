// Milestone SOP definitions for M1-M7
// Each milestone defines who acts, what's required, and fund release %

export interface SOPChecklistItem {
  id: string;
  label: string;
  actor: 'installer' | 'backend_ops' | 'financier' | 'sales_rep';
  requiresUpload?: boolean;
  uploadLabel?: string;
  requiresText?: boolean;
  textLabel?: string;
  requiresDate?: boolean;
  dateLabel?: string;
}

export interface MilestoneSOP {
  id: string;
  name: string;
  shortName: string;
  fundPercent: number;
  description: string;
  checklist: SOPChecklistItem[];
}

export const MILESTONE_SOPS: MilestoneSOP[] = [
  {
    id: 'M1',
    name: 'SOW Confirmed',
    shortName: 'SOW Confirmed',
    fundPercent: 15,
    description: 'Confirm HO signed agreement, production >80% offset, SOW confirmed, escrow account opened.',
    checklist: [
      { id: 'm1-ho-agreement', label: 'HO signed agreement confirmed', actor: 'backend_ops' },
      { id: 'm1-offset-check', label: 'Production is >80% of annual usage', actor: 'backend_ops' },
      { id: 'm1-sow-confirmed', label: 'SOW is confirmed by installer', actor: 'installer', requiresUpload: true, uploadLabel: 'Upload signed SOW' },
      { id: 'm1-escrow-opened', label: 'Escrow account opened for project', actor: 'backend_ops' },
      { id: 'm1-ops-approve', label: 'Backend Ops final approval', actor: 'backend_ops' },
    ],
  },
  {
    id: 'M2',
    name: 'Permit + Materials Ordered',
    shortName: 'Permit+Materials',
    fundPercent: 20,
    description: 'Permit submission proof, equipment invoices, expected permit date, HO re-contact.',
    checklist: [
      { id: 'm2-permit-proof', label: 'Installer uploaded proof of permit submission', actor: 'installer', requiresUpload: true, uploadLabel: 'Upload permit submission proof' },
      { id: 'm2-equipment-invoice', label: 'Equipment invoice uploaded for this project', actor: 'installer', requiresUpload: true, uploadLabel: 'Upload equipment invoice' },
      { id: 'm2-permit-date', label: 'Expected permit approval date set', actor: 'installer', requiresDate: true, dateLabel: 'Expected permit approval date' },
      { id: 'm2-ho-contact', label: 'Backend Ops contacted HO to confirm still on board', actor: 'backend_ops' },
      { id: 'm2-ops-approve', label: 'Backend Ops final approval', actor: 'backend_ops' },
    ],
  },
  {
    id: 'M3',
    name: 'Install Scheduled',
    shortName: 'Install Scheduled',
    fundPercent: 15,
    description: 'Install date confirmed with HO, installer confirmed date via portal, all tickets/electrical handled.',
    checklist: [
      { id: 'm3-install-date', label: 'Install date confirmed with homeowner', actor: 'backend_ops', requiresDate: true, dateLabel: 'Confirmed install date' },
      { id: 'm3-installer-confirm', label: 'Installer confirmed install date via portal', actor: 'installer' },
      { id: 'm3-tickets-clear', label: 'All open tickets / electrical work resolved', actor: 'backend_ops' },
      { id: 'm3-ops-approve', label: 'Backend Ops final approval', actor: 'backend_ops' },
    ],
  },
  {
    id: 'M4',
    name: 'Install Complete',
    shortName: 'Install Complete',
    fundPercent: 20,
    description: 'Install photos verified, SOW vs real cost report, installer performance review.',
    checklist: [
      { id: 'm4-install-photos', label: 'Installer submitted install completion photos', actor: 'installer', requiresUpload: true, uploadLabel: 'Upload install completion photos' },
      { id: 'm4-photos-verified', label: 'Backend Ops verified install photos', actor: 'backend_ops' },
      { id: 'm4-sow-report', label: 'SOW vs real project cost report submitted to financier', actor: 'backend_ops', requiresText: true, textLabel: 'SOW vs Real Cost Report' },
      { id: 'm4-installer-review', label: 'Installer performance review written', actor: 'backend_ops', requiresText: true, textLabel: 'Installer Performance Review' },
      { id: 'm4-ops-approve', label: 'Backend Ops final approval', actor: 'backend_ops' },
    ],
  },
  {
    id: 'M5',
    name: 'Utility Inspection',
    shortName: 'Utility Inspection',
    fundPercent: 20,
    description: 'Inspection passed with proof, interconnection documents submitted, verified by backend ops.',
    checklist: [
      { id: 'm5-inspection-proof', label: 'Inspection passed — proof uploaded by installer', actor: 'installer', requiresUpload: true, uploadLabel: 'Upload inspection proof' },
      { id: 'm5-interconnection', label: 'Interconnection documents submitted by installer', actor: 'installer', requiresUpload: true, uploadLabel: 'Upload interconnection docs' },
      { id: 'm5-ops-verified', label: 'Backend Ops verified inspection & interconnection', actor: 'backend_ops' },
      { id: 'm5-ops-approve', label: 'Backend Ops final approval', actor: 'backend_ops' },
    ],
  },
  {
    id: 'M6',
    name: 'PTO Granted',
    shortName: 'PTO Granted',
    fundPercent: 10,
    description: 'PTO approval letter uploaded, checked by backend ops, system production confirmed.',
    checklist: [
      { id: 'm6-pto-letter', label: 'PTO approval letter uploaded by installer', actor: 'installer', requiresUpload: true, uploadLabel: 'Upload PTO approval letter' },
      { id: 'm6-ops-checked', label: 'Backend Ops checked PTO letter', actor: 'backend_ops' },
      { id: 'm6-production-confirmed', label: 'System production confirmed by backend ops', actor: 'backend_ops' },
      { id: 'm6-service-contract', label: '5-year ASP Care Plan enrolled', actor: 'backend_ops' },
      { id: 'm6-ops-approve', label: 'Backend Ops final approval', actor: 'backend_ops' },
    ],
  },
  {
    id: 'M7',
    name: 'Speed Bonus',
    shortName: 'Speed Bonus',
    fundPercent: 5,
    description: 'PTO achieved within 35 days of permit approval — installer uploads proof, backend ops verifies.',
    checklist: [
      { id: 'm7-day-count', label: 'Day count verified: permit approval to PTO ≤ 35 days', actor: 'backend_ops' },
      { id: 'm7-installer-score', label: 'Installer performance score updated', actor: 'backend_ops' },
      { id: 'm7-ops-approve', label: 'Backend Ops final approval', actor: 'backend_ops' },
    ],
  },
];
