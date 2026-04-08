/**
 * Derive a Project-shaped record from an NTP-approved SellProject.
 * Used to make active deals visible across all portals (Installer, Ops, Financier, Sales).
 *
 * SOP Wave Function: Once a deal reaches NTP-approved status (all_docs_signed=true,
 * approval_status is not rejected), it becomes an active project visible on every portal:
 *   - Sales Rep: sees deal in pipeline as "Active"
 *   - Installer: sees project in their M1-M7 workflow
 *   - Backend Ops: sees project for milestone verification & QC gates
 *   - Financier: sees project in portfolio for fund release tracking
 */

import type { Project, SellProject } from '@/data/mockData';

export function isNTPApproved(sp: SellProject): boolean {
  return !!(sp.convertedToSale && sp.qcInitialApproved && sp.documentsSigned && sp.approvalStatus !== 'rejected');
}

export function deriveSellProjectToProject(sp: SellProject): Project {
  const systemSize = sp.auroraData?.systemSize || '6.0 kW';
  const watts = parseFloat(systemSize) * 1000;
  const adderTotal = (sp.auroraData?.adders || []).length * 1500; // avg adder cost estimate
  const projectCost = watts * 2.35 + adderTotal;
  const contractValue = Math.round(projectCost * 1.65);
  const annualUsage = (sp.highBill || 200) * 12;

  return {
    id: sp.id,
    customerName: `${sp.firstName} ${sp.lastName}`,
    address: sp.address,
    email: sp.email,
    phone: sp.phone,
    status: 'active',
    currentMilestone: 0,
    totalMilestones: 7,
    systemSize,
    battery: sp.auroraData?.battery || 'TBD',
    soldPPW: contractValue / watts,
    contractValue,
    projectCost,
    interestRate: 2.99,
    loanTerms: '25 year @ 2.99%',
    repName: 'Sales Rep',
    installerName: 'Assigned Installer',
    addedDate: sp.createdAt || new Date().toISOString().split('T')[0],
    stage: 'M1 - SOW Confirmed',
    adders: (sp.auroraData?.adders || []).map(a => ({ name: a, cost: 1500 })),
    siteSurveyPhotos: [],
    permitStatus: 'pending',
    roofCondition: 'good',
    roofIssues: [],
    annualUsage,
    documentsSignedCount: sp.documentsSigned ? 2 : 0,
    totalDocuments: 2,
    dates: {
      submitted: sp.createdAt || new Date().toISOString().split('T')[0],
      siteSurvey: sp.siteSurveyComplete ? sp.createdAt : null,
      permitSubmitted: null,
      permitApproved: null,
      installScheduled: null,
      installComplete: null,
      inspectionScheduled: null,
      inspectionPassed: null,
      ptoGranted: null,
    },
    milestoneDetails: [
      { name: 'SOW Confirmed', requirements: ['HO signed agreement', 'Production >80% offset', 'SOW confirmed', 'Escrow opened'] },
      { name: 'Permit + Materials', requirements: ['Permit submission proof', 'Equipment invoice', 'Expected permit date', 'HO re-contact'] },
      { name: 'Install Scheduled', requirements: ['Install date confirmed with HO', 'Installer confirmed date', 'Open tickets resolved'] },
      { name: 'Install Complete', requirements: ['Install photos verified', 'SOW vs cost report', 'Installer review'] },
      { name: 'Utility Inspection', requirements: ['Inspection proof', 'Interconnection docs', 'Ops verification'] },
      { name: 'PTO Granted', requirements: ['PTO letter uploaded', 'Ops checked', 'Production confirmed', 'Care plan enrolled'] },
      { name: 'Speed Bonus', requirements: ['Day count verified ≤35 days', 'Installer score updated'] },
    ],
    checklist: sp.checklist || { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: false, siteSurveyDone: false, aspOnboarding: false },
  };
}

/**
 * Given the full list of sell projects, return Project-shaped records for all NTP-approved ones.
 * Deduplicates against existing store.projects by ID.
 */
export function getActiveSellProjects(
  sellProjects: SellProject[],
  existingProjectIds: Set<string>
): Project[] {
  return sellProjects
    .filter(isNTPApproved)
    .filter(sp => !existingProjectIds.has(sp.id))
    .map(deriveSellProjectToProject);
}
