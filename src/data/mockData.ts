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

export const SELL_PROJECTS: SellProject[] = [];

export const PROJECTS: Project[] = [];

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
  yearlyPaidOut: 68420,
  pendingPipeline: 184250,
  installCount: 14,
  monthlyAppointments: 22,
  avgRating: 4.2,
  ticketBalance: 12,
  vacationPieces: 3,
  dealStreak: 2,
  totalSits: 38,
  totalCloses: 18,
  creditFails: 4,
  creditPassed: 22,
  nonClosed: 12,
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

export const APPOINTMENTS = [
  { id: 1, name: 'Sarah Mitchell', address: '445 Cedar Park Dr, Austin, TX', phone: '(512) 555-0891', email: 'sarah.m@email.com', date: '2026-03-28', time: '2:00 PM', highBill: 285, lowBill: 120, allElectric: true, stars: 5, setter: 'Jordan Mills', closer: null as string | null, status: 'open', gotBill: true, gotContact: true, bothHomeowners: true, meterPhoto: true, billOver250: true, outcome: null as string | null, closerNotes: '', billPhoto: null as string | null, meterPhotoUrl: null as string | null, surveyPhotos: [] as string[] },
  { id: 2, name: 'David Park', address: '1102 Riverside Blvd, Houston, TX', phone: '(713) 555-0445', email: 'david.p@email.com', date: '2026-03-28', time: '4:30 PM', highBill: 320, lowBill: 145, allElectric: false, stars: 4, setter: 'Samantha Cole', closer: 'Jordan Mills', status: 'assigned', gotBill: true, gotContact: true, bothHomeowners: true, meterPhoto: true, billOver250: true, outcome: null as string | null, closerNotes: '', billPhoto: null as string | null, meterPhotoUrl: null as string | null, surveyPhotos: [] as string[] },
  { id: 3, name: 'Maria Gonzalez', address: '789 Alamo Heights, San Antonio, TX', phone: '(210) 555-0667', email: 'maria.g@email.com', date: '2026-03-27', time: '10:00 AM', highBill: 198, lowBill: 88, allElectric: true, stars: 3, setter: 'Caitlin Fox', closer: null, status: 'open', gotBill: true, gotContact: true, bothHomeowners: false, meterPhoto: true, billOver250: false, outcome: 'no_close', closerNotes: 'HO wanted to think about it, follow up next week', billPhoto: null, meterPhotoUrl: null, surveyPhotos: [] },
  { id: 4, name: 'Kevin Wright', address: '2340 Preston Rd, Dallas, TX', phone: '(214) 555-0112', email: 'kevin.w@email.com', date: '2026-03-26', time: '11:00 AM', highBill: 410, lowBill: 180, allElectric: true, stars: 5, setter: 'Jordan Mills', closer: 'Jordan Mills', status: 'assigned', gotBill: true, gotContact: true, bothHomeowners: true, meterPhoto: true, billOver250: true, outcome: 'closed', closerNotes: 'Great sit, both HOs excited. Signed 12kW + battery.', billPhoto: null, meterPhotoUrl: null, surveyPhotos: [] },
  { id: 5, name: 'Lisa Chang', address: '5601 Westheimer Rd, Houston, TX', phone: '(713) 555-0223', email: 'lisa.c@email.com', date: '2026-03-25', time: '1:00 PM', highBill: 265, lowBill: 110, allElectric: false, stars: 4, setter: 'Samantha Cole', closer: 'Caitlin Fox', status: 'assigned', gotBill: true, gotContact: true, bothHomeowners: true, meterPhoto: false, billOver250: true, outcome: 'credit_fail', closerNotes: 'Sat down, ran credit but did not pass. Mid 500s score.', billPhoto: null, meterPhotoUrl: null, surveyPhotos: [] },
  { id: 6, name: 'Robert Sanders', address: '990 Barton Springs Rd, Austin, TX', phone: '(512) 555-0778', email: 'robert.s@email.com', date: '2026-03-24', time: '3:30 PM', highBill: 380, lowBill: 160, allElectric: true, stars: 5, setter: 'Jordan Mills', closer: 'Jordan Mills', status: 'assigned', gotBill: true, gotContact: true, bothHomeowners: true, meterPhoto: true, billOver250: true, outcome: 'closed', closerNotes: 'Quick close. 10kW + Duracell. Very motivated.', billPhoto: null, meterPhotoUrl: null, surveyPhotos: [] },
];

export const RANKINGS = [
  { rank: 1, name: 'Jordan Mills', deals: 18, installs: 14, revenue: 284600, ticketBonus: '200%' },
  { rank: 2, name: 'Samantha Cole', deals: 15, installs: 11, revenue: 241200, ticketBonus: '200%' },
  { rank: 3, name: 'Caitlin Fox', deals: 14, installs: 10, revenue: 218900, ticketBonus: '200%' },
  { rank: 4, name: 'Marcus Bell', deals: 12, installs: 9, revenue: 195400, ticketBonus: '100%' },
  { rank: 5, name: 'Tanya Rivers', deals: 11, installs: 8, revenue: 178200, ticketBonus: '100%' },
  { rank: 6, name: 'Derek Wong', deals: 10, installs: 7, revenue: 162800, ticketBonus: '100%' },
  { rank: 7, name: 'Ashley Torres', deals: 9, installs: 7, revenue: 151300, ticketBonus: '100%' },
  { rank: 8, name: 'Brandon Scott', deals: 8, installs: 6, revenue: 138700, ticketBonus: '100%' },
  { rank: 9, name: 'Nicole Adams', deals: 7, installs: 5, revenue: 122400, ticketBonus: '100%' },
  { rank: 10, name: 'Chris Ramirez', deals: 6, installs: 4, revenue: 104200, ticketBonus: '100%' },
  { rank: 11, name: 'Taylor James', deals: 5, installs: 4, revenue: 89100, ticketBonus: '50%' },
  { rank: 12, name: 'Morgan Lee', deals: 5, installs: 3, revenue: 82400, ticketBonus: '50%' },
];

export const QC_QUEUE: Project[] = [
  { ...PROJECTS[6], id: 'ASP-2050', customerName: 'Rachel Kim', status: 'active', currentMilestone: 0, stage: 'QC Review' },
  { ...PROJECTS[3], id: 'ASP-2051', customerName: 'Tom Bradley', status: 'active', currentMilestone: 0, stage: 'QC Review', roofCondition: 'major_damage', roofIssues: ['Significant water staining on decking', 'Missing flashing around vents'] },
  { ...PROJECTS[0], id: 'ASP-2052', customerName: 'Diana Vasquez', status: 'active', currentMilestone: 0, stage: 'QC Review', roofCondition: 'minor_damage', roofIssues: ['Slight granule loss on south-facing shingles'] },
  { ...PROJECTS[1], id: 'ASP-2053', customerName: 'Kevin Okafor', status: 'active', currentMilestone: 0, stage: 'QC Review' },
  { ...PROJECTS[4], id: 'ASP-2054', customerName: 'Samantha Liu', status: 'active', currentMilestone: 0, stage: 'QC Review', roofCondition: 'good', roofIssues: [] },
  { ...PROJECTS[7], id: 'ASP-2055', customerName: 'Marcus Jefferson', status: 'active', currentMilestone: 0, stage: 'QC Review' },
];

export const INSTALLED_HOMES = [
  { lat: 29.7604, lng: -95.3698, address: '1234 Main St, Houston, TX', customer: 'Johnson Family', systemSize: '10.2 kW', installDate: '2025-11-15' },
  { lat: 29.7764, lng: -95.4235, address: '5678 Westheimer Rd, Houston, TX', customer: 'Garcia Family', systemSize: '8.5 kW', installDate: '2025-12-01' },
  { lat: 29.7284, lng: -95.4098, address: '910 Bellaire Blvd, Houston, TX', customer: 'Smith Family', systemSize: '12 kW', installDate: '2026-01-10' },
  { lat: 29.7503, lng: -95.3575, address: '2200 Travis St, Houston, TX', customer: 'Williams Family', systemSize: '9.8 kW', installDate: '2026-01-28' },
  { lat: 29.8168, lng: -95.4146, address: '3450 N Shepherd Dr, Houston, TX', customer: 'Brown Family', systemSize: '11.5 kW', installDate: '2026-02-15' },
  { lat: 29.6966, lng: -95.4173, address: '7800 Kirby Dr, Houston, TX', customer: 'Davis Family', systemSize: '7.2 kW', installDate: '2025-10-20' },
  { lat: 29.7900, lng: -95.3900, address: '4400 Heights Blvd, Houston, TX', customer: 'Wilson Family', systemSize: '13 kW', installDate: '2026-02-20' },
  { lat: 29.7100, lng: -95.2900, address: '6000 Lawndale St, Houston, TX', customer: 'Lopez Family', systemSize: '8.8 kW', installDate: '2025-09-30' },
  { lat: 29.6500, lng: -95.2800, address: '12000 Gulf Fwy, Houston, TX', customer: 'Taylor Family', systemSize: '11 kW', installDate: '2026-01-05' },
  { lat: 29.8300, lng: -95.4500, address: '1800 W 34th St, Houston, TX', customer: 'Anderson Family', systemSize: '9.4 kW', installDate: '2025-08-20' },
  { lat: 29.7400, lng: -95.5100, address: '9200 Fondren Rd, Houston, TX', customer: 'Thomas Family', systemSize: '10.8 kW', installDate: '2025-07-15' },
  { lat: 29.6800, lng: -95.3400, address: '5500 Telephone Rd, Houston, TX', customer: 'Jackson Family', systemSize: '7.6 kW', installDate: '2026-02-28' },
  { lat: 29.7950, lng: -95.3200, address: '3100 Lyons Ave, Houston, TX', customer: 'Harris Family', systemSize: '8.2 kW', installDate: '2025-11-05' },
  { lat: 29.7200, lng: -95.4700, address: '6700 Hillcroft Ave, Houston, TX', customer: 'Clark Family', systemSize: '11.2 kW', installDate: '2025-10-10' },
  { lat: 29.6700, lng: -95.5200, address: '10500 Beechnut St, Houston, TX', customer: 'Lewis Family', systemSize: '9.0 kW', installDate: '2026-03-01' },
  { lat: 29.8500, lng: -95.3800, address: '1400 Crosstimbers St, Houston, TX', customer: 'Robinson Family', systemSize: '12.5 kW', installDate: '2025-09-12' },
  { lat: 29.7350, lng: -95.3100, address: '4800 Navigation Blvd, Houston, TX', customer: 'Walker Family', systemSize: '8.0 kW', installDate: '2026-01-22' },
  { lat: 29.6600, lng: -95.4600, address: '8800 W Bellfort Ave, Houston, TX', customer: 'Young Family', systemSize: '10.0 kW', installDate: '2025-12-18' },
  { lat: 29.8100, lng: -95.5000, address: '2200 Mangum Rd, Houston, TX', customer: 'Allen Family', systemSize: '9.5 kW', installDate: '2026-02-05' },
  { lat: 29.7700, lng: -95.3000, address: '3600 Wayside Dr, Houston, TX', customer: 'King Family', systemSize: '7.8 kW', installDate: '2025-08-30' },
  { lat: 27.8006, lng: -97.3964, address: '456 Ocean Dr, Corpus Christi, TX', customer: 'Martinez Family', systemSize: '9 kW', installDate: '2025-12-12' },
  { lat: 27.7436, lng: -97.4019, address: '789 Staples St, Corpus Christi, TX', customer: 'Rodriguez Family', systemSize: '10.5 kW', installDate: '2026-02-01' },
  { lat: 27.7700, lng: -97.3820, address: '321 Shoreline Blvd, Corpus Christi, TX', customer: 'Nguyen Family', systemSize: '8 kW', installDate: '2026-03-05' },
  { lat: 27.7550, lng: -97.4200, address: '1400 Ayers St, Corpus Christi, TX', customer: 'Perez Family', systemSize: '11 kW', installDate: '2025-11-20' },
  { lat: 27.7800, lng: -97.3700, address: '600 N Water St, Corpus Christi, TX', customer: 'Ramirez Family', systemSize: '9.5 kW', installDate: '2026-01-15' },
];
