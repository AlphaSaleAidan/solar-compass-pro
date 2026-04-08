// Mock data for Alpha Sale Pro — only used by demo users

export interface MilestoneDetail {
  name: string;
  completedBy?: string;
  completedDate?: string;
  requirements: string[];
}

export interface ProjectDates {
  submitted: string;
  siteSurvey: string | null;
  sowConfirmed: string | null;
  permitSubmitted: string | null;
  lastHOContact: string;
}

export interface CustomerChecklist {
  creditPassed: boolean;
  financeDocsSigned: boolean;
  welcomeCallCompleted: boolean;
  siteSurveyDone: boolean;
  aspOnboarding: boolean;
}

export interface UpfrontMilestone {
  milestone: string;
  setterPay: number;
  setterNote: string;
  setterClawback: boolean;
  closerPay: number | string;
  closerNote: string;
  closerClawback: boolean;
  ticketsEarned: number;
}

export const UPFRONT_MILESTONES: UpfrontMilestone[] = [
  { milestone: 'Site Survey Completed', setterPay: 200, setterNote: 'Appointment confirmed; survey done', setterClawback: false, closerPay: 75, closerNote: 'Closer confirms or attends site', closerClawback: false, ticketsEarned: 1 },
  { milestone: 'SOW Confirmed / Permit Submitted', setterPay: 150, setterNote: 'Scope locked; permit filed', setterClawback: false, closerPay: 100, closerNote: 'TPO agreement executed', closerClawback: false, ticketsEarned: 1 },
  { milestone: 'Permit Approved + Customer Confirmation', setterPay: 100, setterNote: 'Project greenlit by all parties', setterClawback: true, closerPay: 75, closerNote: 'Project officially active', closerClawback: true, ticketsEarned: 1 },
  { milestone: 'Install Scheduled', setterPay: 75, setterNote: 'Date locked on the board', setterClawback: true, closerPay: 50, closerNote: 'Date confirmed with installer', closerClawback: true, ticketsEarned: 2 },
  { milestone: 'Install Completed', setterPay: 100, setterNote: 'System installed and ASP-verified', setterClawback: false, closerPay: 'Backend %', closerNote: 'System in and ASP-verified', closerClawback: false, ticketsEarned: 3 },
  { milestone: 'PTO + Ticket Resolved', setterPay: 75, setterNote: 'System live; all issues closed', setterClawback: false, closerPay: 50, closerNote: 'System live; zero open tickets', closerClawback: false, ticketsEarned: 5 },
];

export interface Project {
  id: string;
  customerName: string;
  address: string;
  email: string;
  phone: string;
  status: 'active' | 'delayed' | 'on_hold' | 'completed';
  currentMilestone: number;
  totalMilestones: number;
  systemSize: string;
  battery: string;
  soldPPW: number;
  contractValue: number;
  projectCost: number;
  interestRate: number;
  loanTerms: string;
  repName: string;
  installerName: string;
  addedDate: string;
  stage: string;
  adders: { name: string; cost: number }[];
  siteSurveyPhotos: string[];
  permitStatus: 'pending' | 'submitted' | 'approved' | 'rejected';
  roofCondition: 'good' | 'minor_damage' | 'major_damage';
  roofIssues: string[];
  annualUsage: number;
  documentsSignedCount: number;
  totalDocuments: number;
  dates: ProjectDates;
  milestoneDetails: MilestoneDetail[];
  checklist: CustomerChecklist;
  setter?: string;
  setterId?: string;
  setterSplitPercent?: number;
  welcomeCallRecordingUrl?: string;
}

export const MILESTONE_NAMES = [
  'Contract Signed', 'Site Survey', 'Permit Submitted', 'Install Scheduled',
  'Install Complete', 'Utility Inspection', 'PTO Granted'
];

const makeMilestoneDetails = (currentMilestone: number, dates: ProjectDates): MilestoneDetail[] => {
  const allDetails: MilestoneDetail[] = [
    { name: 'Contract Signed', requirements: ['Customer signs loan agreement', 'Credit check approved', 'Finance docs uploaded to DocuSign'] },
    { name: 'Site Survey', requirements: ['Schedule site survey with homeowner', 'Capture roof photos & measurements', 'Confirm rafter spacing & roof pitch', 'Upload survey to Aurora'] },
    { name: 'Permit Submitted', requirements: ['SOW confirmed by installer', 'System design finalized in Aurora', 'Permit application filed with city/county'] },
    { name: 'Install Scheduled', requirements: ['Permit approved by jurisdiction', 'Install date confirmed with homeowner', 'Materials ordered & delivered'] },
    { name: 'Install Complete', requirements: ['Solar panels mounted on roof', 'Inverter & battery installed', 'Electrical inspection passed', 'System wiring completed'] },
    { name: 'Utility Inspection', requirements: ['Schedule utility inspection', 'Pass utility meter inspection', 'Net metering application submitted'] },
    { name: 'PTO Granted', requirements: ['Utility grants permission to operate', 'System activated & monitored', 'Customer walkthrough completed'] },
  ];
  return allDetails.map((detail, i) => {
    if (i < currentMilestone) {
      return { ...detail, completedBy: 'System', completedDate: i === 0 ? dates.submitted : i === 1 ? (dates.siteSurvey || undefined) : i === 2 ? (dates.permitSubmitted || undefined) : undefined };
    }
    return detail;
  });
};

const makeProjectData = (
  base: Omit<Project, 'projectCost' | 'interestRate' | 'loanTerms' | 'dates' | 'milestoneDetails' | 'checklist'>,
  dates: ProjectDates,
  checklist: CustomerChecklist
): Project => {
  const watts = parseFloat(base.systemSize) * 1000;
  const adderTotal = base.adders.reduce((s, a) => s + a.cost, 0);
  const projectCost = watts * 2.35 + adderTotal;
  const contractValue = Math.round(projectCost * 1.65);
  return { ...base, projectCost, contractValue, interestRate: 2.99, loanTerms: '25 year @ 2.99%', dates, milestoneDetails: makeMilestoneDetails(base.currentMilestone, dates), checklist };
};

export type CreditStatus = 'new' | 'credit_passed' | 'credit_fail';

export interface SellProject {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  highBill: number;
  lowBill: number;
  allElectric: boolean;
  creditStatus: CreditStatus;
  createdAt: string;
  checklist: CustomerChecklist;
  documents: { name: string; sent: boolean; signed: boolean }[];
  surveyPhotos: string[];
  // SOP flow fields
  auroraSynced?: boolean;
  auroraData?: { systemSize: string; battery: string; financier: string; monthlyPayment: string; adders: string[] };
  convertedToSale?: boolean;
  welcomeCallComplete?: boolean;
  welcomeCallAnswers?: { question: string; answer: string; correct?: boolean }[];
  welcomeCallFlags?: { question: string; issue: string }[];
  siteSurveyPhotos?: Record<string, string[]>;
  siteSurveyComplete?: boolean;
  submittedForApproval?: boolean;
  approvalStatus?: 'pending' | 'clean' | 'dirty';
  approvalNotes?: string;
  welcomeCallRecordingUrl?: string;
  // Two-phase QC workflow
  qcInitialApproved?: boolean;
  documentsSigned?: boolean;
  // Lifecycle state machine (inferred if not set)
  lifecycleState?: 'lead' | 'qualified' | 'qc_review' | 'active' | 'completed' | 'archived' | 'rejected';
}

// Demo-only sample data — only loaded for demo users via ProjectStore
export const SELL_PROJECTS: SellProject[] = [
  {
    id: 'sell-demo-1', firstName: 'Maria', lastName: 'Gonzalez', email: 'maria.g@email.com',
    phone: '(832) 555-1234', address: '4521 Sunset Blvd, Houston, TX 77005',
    highBill: 320, lowBill: 180, allElectric: false, creditStatus: 'credit_passed',
    createdAt: '2026-03-20', checklist: { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: true, siteSurveyDone: true, aspOnboarding: false },
    documents: [{ name: 'Loan Agreement', sent: true, signed: true }, { name: 'Utility Release', sent: true, signed: false }],
    surveyPhotos: [], auroraSynced: true,
    auroraData: { systemSize: '8.4 kW', battery: 'Tesla Powerwall 2', financier: 'Goodleap', monthlyPayment: '$145', adders: ['EV Charger'] },
    convertedToSale: true, welcomeCallComplete: true, siteSurveyComplete: true, submittedForApproval: true, approvalStatus: 'pending',
  },
  {
    id: 'sell-demo-2', firstName: 'James', lastName: 'Parker', email: 'jparker@email.com',
    phone: '(361) 555-9876', address: '789 Oak Dr, Corpus Christi, TX 78411',
    highBill: 410, lowBill: 220, allElectric: true, creditStatus: 'credit_passed',
    createdAt: '2026-03-25', checklist: { creditPassed: true, financeDocsSigned: false, welcomeCallCompleted: false, siteSurveyDone: false, aspOnboarding: false },
    documents: [{ name: 'Loan Agreement', sent: true, signed: false }],
    surveyPhotos: [], auroraSynced: true,
    auroraData: { systemSize: '11.2 kW', battery: 'Enphase IQ 5P', financier: 'Mosaic', monthlyPayment: '$198', adders: ['Main Panel Upgrade'] },
    convertedToSale: false,
  },
  {
    id: 'sell-demo-3', firstName: 'Linda', lastName: 'Chen', email: 'lchen@email.com',
    phone: '(713) 555-4567', address: '2200 Willow Creek Ln, Houston, TX 77024',
    highBill: 275, lowBill: 140, allElectric: false, creditStatus: 'new',
    createdAt: '2026-03-28', checklist: { creditPassed: false, financeDocsSigned: false, welcomeCallCompleted: false, siteSurveyDone: false, aspOnboarding: false },
    documents: [], surveyPhotos: [],
  },
];

const demoProject1 = makeProjectData(
  { id: 'proj-demo-1', customerName: 'Maria Gonzalez', address: '4521 Sunset Blvd, Houston, TX 77005', email: 'maria.g@email.com', phone: '(832) 555-1234', status: 'active', currentMilestone: 4, totalMilestones: 7, systemSize: '8.4', battery: 'Tesla Powerwall 2', soldPPW: 3.85, contractValue: 54000, repName: 'Demo Rep', installerName: 'SunPro Solar', addedDate: '2026-03-20', stage: 'Install Scheduled', adders: [{ name: 'EV Charger', cost: 1200 }], siteSurveyPhotos: [], permitStatus: 'approved', roofCondition: 'good', roofIssues: [], annualUsage: 14500, documentsSignedCount: 5, totalDocuments: 5 },
  { submitted: '2026-03-20', siteSurvey: '2026-03-22', sowConfirmed: '2026-03-24', permitSubmitted: '2026-03-25', lastHOContact: '2026-03-30' },
  { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: true, siteSurveyDone: true, aspOnboarding: true }
);

const demoProject2 = makeProjectData(
  { id: 'proj-demo-2', customerName: 'Robert Williams', address: '1100 Main St, Corpus Christi, TX 78401', email: 'rwilliams@email.com', phone: '(361) 555-3210', status: 'active', currentMilestone: 2, totalMilestones: 7, systemSize: '10.5', battery: 'None', soldPPW: 3.65, contractValue: 42000, repName: 'Demo Rep', installerName: 'Gulf Coast Solar', addedDate: '2026-03-26', stage: 'Permit Submitted', adders: [{ name: 'Critter Guard', cost: 450 }], siteSurveyPhotos: [], permitStatus: 'submitted', roofCondition: 'good', roofIssues: [], annualUsage: 18200, documentsSignedCount: 3, totalDocuments: 5 },
  { submitted: '2026-03-26', siteSurvey: '2026-03-28', sowConfirmed: null, permitSubmitted: '2026-03-30', lastHOContact: '2026-03-30' },
  { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: true, siteSurveyDone: true, aspOnboarding: false }
);

export const PROJECTS: Project[] = [demoProject1, demoProject2];

export const MILESTONES = MILESTONE_NAMES;

export const SPIN_PRIZES = [
  { name: 'ASP Stealth Tee', icon: 'ST', value: 40, tier: 'normal' },
  { name: 'ASP Snapback', icon: 'SB', value: 25, tier: 'normal' },
  { name: 'Yeti Tumbler', icon: 'YT', value: 35, tier: 'normal' },
  { name: 'ASP Shades', icon: 'SH', value: 55, tier: 'normal' },
  { name: 'AirPods Pro', icon: 'AP', value: 150, tier: 'golden' },
  { name: 'Apple Pencil', icon: 'PE', value: 120, tier: 'golden' },
  { name: '$85 Cash Drop', icon: '$', value: 85, tier: 'normal' },
  { name: 'Ray-Ban Meta', icon: 'RB', value: 300, tier: 'alpha' },
  { name: 'Meta Quest 3', icon: 'MQ', value: 450, tier: 'alpha' },
  { name: 'iPad Air', icon: 'iP', value: 500, tier: 'super_alpha' },
  { name: '5★ Fine Dining', icon: 'FD', value: 500, tier: 'super_alpha' },
  { name: 'Cruise Getaway', icon: 'CG', value: 400, tier: 'super_alpha' },
  { name: 'Diamond Jewelry', icon: 'DJ', value: 800, tier: 'super_alpha' },
  { name: 'Luxury Vacation', icon: 'LV', value: 500, tier: 'super_alpha' },
  { name: '2x Tickets (7d)', icon: '2x', value: 170, tier: 'golden' },
  { name: '10 Hot Leads', icon: 'HL', value: 850, tier: 'super_alpha' },
  { name: 'ASP Elite Hoodie', icon: 'EH', value: 65, tier: 'normal' },
  { name: 'MagSafe Charger', icon: 'MC', value: 45, tier: 'normal' },
  { name: 'Nike Gift Card', icon: 'NK', value: 100, tier: 'golden' },
  { name: 'Beats Studio', icon: 'BS', value: 200, tier: 'alpha' },
  { name: '$50 Cash Drop', icon: '$', value: 50, tier: 'normal' },
  { name: 'Hydro Flask', icon: 'HF', value: 30, tier: 'normal' },
  { name: 'Amazon $25', icon: 'AZ', value: 25, tier: 'normal' },
];

export const SPIN_TIERS = [
  { name: 'Normal Spin', tickets: 1, color: 'gray' },
  { name: 'Golden Spin', tickets: 3, color: 'yellow' },
  { name: 'Alpha Spin', tickets: 5, color: 'teal' },
  { name: 'Super Alpha Spin', tickets: 10, color: 'purple' },
];

export const PUZZLE_GIFTS = [
  '$400 Dinner Card', 'Meta Ray-Bans ($300)', 'Apple Watch SE ($250)', 'Yeti Cooler Bundle ($350)',
];

export const TICKET_EARNING_RULES = [
  { action: 'Resolving project tickets', tickets: 1 },
  { action: 'Selling a deal', tickets: 2 },
  { action: 'Getting an install', tickets: 3 },
];

export const REP_STATS = {
  yearlyPaidOut: 12450,
  pendingPipeline: 8200,
  installCount: 3,
  monthlyAppointments: 8,
  avgRating: 4.2,
  ticketBalance: 7,
  vacationPieces: 1,
  dealStreak: 2,
  totalSits: 15,
  totalCloses: 5,
  creditFails: 2,
  creditPassed: 6,
  nonClosed: 7,
};

export const COMMISSIONS = PROJECTS.map((p) => {
  const redline = 2.35;
  const adderCost = p.adders.reduce((s, a) => s + a.cost, 0);
  const watts = parseFloat(p.systemSize) * 1000;
  const systemCostPerWatt = watts * redline;
  const soldTotal = watts * p.soldPPW;
  const commission = soldTotal - systemCostPerWatt - adderCost;
  const splitPercent = 0.60;

  // Calculate upfront milestone pay earned based on current milestone
  const upfronts = UPFRONT_MILESTONES.map((um, i) => {
    const milestoneIndex = i + 1; // milestones roughly map 1:1
    const completed = p.currentMilestone >= milestoneIndex;
    const completedDate = completed ? (
      i === 0 ? p.dates.siteSurvey :
      i === 1 ? p.dates.permitSubmitted :
      i === 2 ? p.dates.permitSubmitted :
      i === 3 ? p.dates.submitted :
      i === 4 ? p.dates.submitted :
      p.dates.submitted
    ) : null;
    return {
      ...um,
      completed,
      completedDate: completedDate || null,
      expectedPay: completed ? (typeof um.closerPay === 'number' ? `Within 24hrs` : 'Up to 1 week') : 'Pending',
    };
  });

  return {
    projectId: p.id,
    customerName: p.customerName,
    systemSize: p.systemSize,
    soldPPW: p.soldPPW,
    redline,
    adderCost,
    battery: p.battery,
    projectBaseline: systemCostPerWatt + adderCost,
    soldTotal,
    commission,
    splitPercent,
    yourCommission: commission * splitPercent,
    status: p.currentMilestone >= 5 ? 'paid' : p.currentMilestone >= 3 ? 'pending' : 'processing',
    expectedPayDate: p.currentMilestone >= 5 ? 'Paid' : '2026-04-15',
    upfronts,
  };
});

export const APPOINTMENTS: { id: number; name: string; address: string; phone: string; email: string; date: string; time: string; highBill: number; lowBill: number; allElectric: boolean; stars: number; setter: string; closer: string | null; status: string; gotBill: boolean; gotContact: boolean; bothHomeowners: boolean; meterPhoto: boolean; billOver250: boolean; outcome: string | null; closerNotes: string; billPhoto: string | null; meterPhotoUrl: string | null; surveyPhotos: string[] }[] = [
  { id: 1, name: 'Sarah Thompson', address: '3200 Elm St, Houston, TX 77004', phone: '(832) 555-7890', email: 'sthompson@email.com', date: new Date().toISOString().split('T')[0], time: '10:00 AM', highBill: 340, lowBill: 190, allElectric: false, stars: 4, setter: 'Demo Rep', closer: null, status: 'confirmed', gotBill: true, gotContact: true, bothHomeowners: true, meterPhoto: true, billOver250: true, outcome: null, closerNotes: '', billPhoto: null, meterPhotoUrl: null, surveyPhotos: [] },
  { id: 2, name: 'David Martinez', address: '500 Harbor Dr, Corpus Christi, TX 78402', phone: '(361) 555-2468', email: 'dmartinez@email.com', date: new Date().toISOString().split('T')[0], time: '2:00 PM', highBill: 280, lowBill: 150, allElectric: true, stars: 3, setter: 'Demo Rep', closer: null, status: 'confirmed', gotBill: true, gotContact: true, bothHomeowners: false, meterPhoto: true, billOver250: true, outcome: null, closerNotes: '', billPhoto: null, meterPhotoUrl: null, surveyPhotos: [] },
];

export const RANKINGS: { rank: number; name: string; deals: number; installs: number; revenue: number; ticketBonus: string }[] = [
  { rank: 1, name: 'Alpha Team', deals: 22, installs: 18, revenue: 485000, ticketBonus: '200%' },
  { rank: 2, name: 'Demo Rep', deals: 15, installs: 12, revenue: 320000, ticketBonus: '150%' },
  { rank: 3, name: 'Solar Squad', deals: 14, installs: 10, revenue: 290000, ticketBonus: '150%' },
  { rank: 4, name: 'Bright Future', deals: 11, installs: 8, revenue: 215000, ticketBonus: '125%' },
  { rank: 5, name: 'Grid Masters', deals: 9, installs: 7, revenue: 180000, ticketBonus: '125%' },
];

export const QC_QUEUE: Project[] = [demoProject2];

export const INSTALLED_HOMES: { lat: number; lng: number; address: string; customer: string; systemSize: string; installDate: string }[] = [
  { lat: 29.7174, lng: -95.4018, address: '4521 Sunset Blvd, Houston, TX', customer: 'Maria Gonzalez', systemSize: '8.4 kW', installDate: '2026-03-30' },
  { lat: 27.8006, lng: -97.3964, address: '1100 Main St, Corpus Christi, TX', customer: 'Robert Williams', systemSize: '10.5 kW', installDate: '2026-03-28' },
];
