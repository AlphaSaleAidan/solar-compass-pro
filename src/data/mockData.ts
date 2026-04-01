// Mock data for Alpha Sale Pro
import { Star, Zap, Battery, MapPin, DollarSign, FileText, CheckCircle, XCircle, Clock, Calendar, Phone, Mail, TrendingUp, Award, Ticket, Gift, ShoppingBag, Headphones, Smartphone, Gem, Ship, PalmtreeIcon, BarChart3, Wrench, Flame, Users, Camera, ClipboardList, Shield, AlertTriangle, MessageSquare } from 'lucide-react';

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
  { id: 'proj-demo-1', customerName: 'Maria Gonzalez', address: '4521 Sunset Blvd, Houston, TX 77005', email: 'maria.g@email.com', phone: '(832) 555-1234', status: 'active', currentMilestone: 4, totalMilestones: 7, systemSize: '8.4', battery: 'Tesla Powerwall 2', soldPPW: 3.85, repName: 'Demo Rep', installerName: 'SunPro Solar', addedDate: '2026-03-20', stage: 'Install Scheduled', adders: [{ name: 'EV Charger', cost: 1200 }], siteSurveyPhotos: [], permitStatus: 'approved', roofCondition: 'good', roofIssues: [], annualUsage: 14500, documentsSignedCount: 5, totalDocuments: 5 },
  { submitted: '2026-03-20', siteSurvey: '2026-03-22', sowConfirmed: '2026-03-24', permitSubmitted: '2026-03-25', lastHOContact: '2026-03-30' },
  { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: true, siteSurveyDone: true, aspOnboarding: true }
);

const demoProject2 = makeProjectData(
  { id: 'proj-demo-2', customerName: 'Robert Williams', address: '1100 Main St, Corpus Christi, TX 78401', email: 'rwilliams@email.com', phone: '(361) 555-3210', status: 'active', currentMilestone: 2, totalMilestones: 7, systemSize: '10.5', battery: 'None', soldPPW: 3.65, repName: 'Demo Rep', installerName: 'Gulf Coast Solar', addedDate: '2026-03-26', stage: 'Permit Submitted', adders: [{ name: 'Critter Guard', cost: 450 }], siteSurveyPhotos: [], permitStatus: 'submitted', roofCondition: 'good', roofIssues: [], annualUsage: 18200, documentsSignedCount: 3, totalDocuments: 5 },
  { submitted: '2026-03-26', siteSurvey: '2026-03-28', sowConfirmed: null, permitSubmitted: '2026-03-30', lastHOContact: '2026-03-30' },
  { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: true, siteSurveyDone: true, aspOnboarding: false }
);

export const PROJECTS: Project[] = [demoProject1, demoProject2];

export const MILESTONES = MILESTONE_NAMES;

export const SPIN_PRIZES = [
  { name: 'ASP T-Shirt', icon: '👕', value: 40, tier: 'normal' },
  { name: 'ASP Hat', icon: '🧢', value: 25, tier: 'normal' },
  { name: 'ASP Coffee Mug', icon: '☕', value: 35, tier: 'normal' },
  { name: 'Lanyard + Glasses', icon: '🕶️', value: 55, tier: 'normal' },
  { name: 'AirPods', icon: '🎧', value: 120, tier: 'golden' },
  { name: 'iPencil', icon: '✏️', value: 120, tier: 'golden' },
  { name: 'Cash Bonus $85', icon: '💵', value: 85, tier: 'normal' },
  { name: 'Meta Raybans', icon: '😎', value: 300, tier: 'alpha' },
  { name: 'Oculus Quest', icon: '🥽', value: 450, tier: 'alpha' },
  { name: 'iPad', icon: '📱', value: 500, tier: 'super_alpha' },
  { name: '5★ Dinner', icon: '🍽️', value: 500, tier: 'super_alpha' },
  { name: 'Cruise Ship', icon: '🚢', value: 400, tier: 'super_alpha' },
  { name: '$800 Jewelry', icon: '💎', value: 800, tier: 'super_alpha' },
  { name: '$5K Vacation Piece', icon: '🏝️', value: 500, tier: 'super_alpha' },
  { name: '200% Tickets 7d', icon: '🎟️', value: 170, tier: 'golden' },
  { name: '10 Internal Leads', icon: '📊', value: 850, tier: 'super_alpha' },
  { name: 'ASP Hoodie', icon: '🧥', value: 65, tier: 'normal' },
  { name: 'Wireless Charger', icon: '🔋', value: 45, tier: 'normal' },
  { name: 'Nike Gift Card', icon: '👟', value: 100, tier: 'golden' },
  { name: 'Beats Solo', icon: '🎵', value: 200, tier: 'alpha' },
  { name: 'Cash Bonus $50', icon: '💵', value: 50, tier: 'normal' },
  { name: 'ASP Water Bottle', icon: '🥤', value: 30, tier: 'normal' },
  { name: 'Amazon $25', icon: '🎁', value: 25, tier: 'normal' },
];

export const SPIN_TIERS = [
  { name: 'Normal Spin', tickets: 1, color: 'gray' },
  { name: 'Golden Spin', tickets: 3, color: 'yellow' },
  { name: 'Alpha Spin', tickets: 5, color: 'teal' },
  { name: 'Super Alpha Spin', tickets: 10, color: 'purple' },
];

export const PUZZLE_GIFTS = [
  'Yeti Tumbler ($45)', 'Amazon Echo ($50)', 'Uber Eats $75', 'Nike Duffel Bag ($60)',
  'Apple Watch Band ($50)', 'Ray-Ban Sunglasses ($180)', 'DoorDash $100', 'JBL Speaker ($80)',
  'Sephora $75 Gift Card', 'Stanley Cup + ASP Kit ($55)',
];

export const TICKET_EARNING_RULES = [
  { action: 'Resolving project tickets', tickets: 1 },
  { action: 'Selling a deal', tickets: 2 },
  { action: 'Getting an install', tickets: 3 },
  { action: 'Deal to install in under 25 days', tickets: 5 },
];

export const REP_STATS = {
  yearlyPaidOut: 0,
  pendingPipeline: 0,
  installCount: 0,
  monthlyAppointments: 0,
  avgRating: 0,
  ticketBalance: 0,
  vacationPieces: 0,
  dealStreak: 0,
  totalSits: 0,
  totalCloses: 0,
  creditFails: 0,
  creditPassed: 0,
  nonClosed: 0,
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

export const APPOINTMENTS: { id: number; name: string; address: string; phone: string; email: string; date: string; time: string; highBill: number; lowBill: number; allElectric: boolean; stars: number; setter: string; closer: string | null; status: string; gotBill: boolean; gotContact: boolean; bothHomeowners: boolean; meterPhoto: boolean; billOver250: boolean; outcome: string | null; closerNotes: string; billPhoto: string | null; meterPhotoUrl: string | null; surveyPhotos: string[] }[] = [];

export const RANKINGS: { rank: number; name: string; deals: number; installs: number; revenue: number; ticketBonus: string }[] = [];

export const QC_QUEUE: Project[] = [];

export const INSTALLED_HOMES: { lat: number; lng: number; address: string; customer: string; systemSize: string; installDate: string }[] = [];
