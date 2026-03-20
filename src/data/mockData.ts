// Mock data for Alpha Sale Pro

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
    {
      name: 'Contract Signed',
      requirements: ['Customer signs loan agreement', 'Credit check approved', 'Finance docs uploaded to DocuSign'],
    },
    {
      name: 'Site Survey',
      requirements: ['Schedule site survey with homeowner', 'Capture roof photos & measurements', 'Confirm rafter spacing & roof pitch', 'Upload survey to Aurora'],
    },
    {
      name: 'Permit Submitted',
      requirements: ['SOW confirmed by installer', 'System design finalized in Aurora', 'Permit application filed with city/county'],
    },
    {
      name: 'Install Scheduled',
      requirements: ['Permit approved by jurisdiction', 'Install date confirmed with homeowner', 'Materials ordered & delivered'],
    },
    {
      name: 'Install Complete',
      requirements: ['Solar panels mounted on roof', 'Inverter & battery installed', 'Electrical inspection passed', 'System wiring completed'],
    },
    {
      name: 'Utility Inspection',
      requirements: ['Schedule utility inspection', 'Pass utility meter inspection', 'Net metering application submitted'],
    },
    {
      name: 'PTO Granted',
      requirements: ['Utility grants permission to operate', 'System activated & monitored', 'Customer walkthrough completed'],
    },
  ];

  return allDetails.map((detail, i) => {
    if (i < currentMilestone) {
      return {
        ...detail,
        completedBy: 'System',
        completedDate: i === 0 ? dates.submitted : i === 1 ? (dates.siteSurvey || undefined) : i === 2 ? (dates.permitSubmitted || undefined) : undefined,
      };
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
  return {
    ...base,
    projectCost,
    contractValue,
    interestRate: 2.99,
    loanTerms: '25 year @ 2.99%',
    dates,
    milestoneDetails: makeMilestoneDetails(base.currentMilestone, dates),
    checklist,
  };
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
}

export const SELL_PROJECTS: SellProject[] = [
  {
    id: 'SP-001', firstName: 'Carlos', lastName: 'Rivera', email: 'carlos.r@email.com', phone: '(713) 555-0412',
    address: '2910 Westpark Dr, Houston, TX 77098', highBill: 340, lowBill: 145, allElectric: true,
    creditStatus: 'credit_passed', createdAt: '2026-03-14',
    checklist: { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: false, siteSurveyDone: false, aspOnboarding: false },
    documents: [
      { name: 'ASP Agreement', sent: true, signed: true },
      { name: 'Installer Contract', sent: true, signed: false },
      { name: 'Loan Authorization', sent: false, signed: false },
    ],
    surveyPhotos: [],
  },
  {
    id: 'SP-002', firstName: 'Natasha', lastName: 'Brooks', email: 'natasha.b@email.com', phone: '(832) 555-0198',
    address: '8450 Beechnut St, Houston, TX 77036', highBill: 290, lowBill: 120, allElectric: false,
    creditStatus: 'credit_passed', createdAt: '2026-03-12',
    checklist: { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: true, siteSurveyDone: true, aspOnboarding: false },
    documents: [
      { name: 'ASP Agreement', sent: true, signed: true },
      { name: 'Installer Contract', sent: true, signed: true },
      { name: 'Loan Authorization', sent: true, signed: true },
    ],
    surveyPhotos: [],
  },
  {
    id: 'SP-003', firstName: 'Derek', lastName: 'Simmons', email: 'derek.s@email.com', phone: '(281) 555-0334',
    address: '1500 Memorial Dr, Houston, TX 77007', highBill: 180, lowBill: 70, allElectric: true,
    creditStatus: 'credit_fail', createdAt: '2026-03-10',
    checklist: { creditPassed: false, financeDocsSigned: false, welcomeCallCompleted: false, siteSurveyDone: false, aspOnboarding: false },
    documents: [
      { name: 'ASP Agreement', sent: true, signed: false },
      { name: 'Installer Contract', sent: false, signed: false },
      { name: 'Loan Authorization', sent: false, signed: false },
    ],
    surveyPhotos: [],
  },
  {
    id: 'SP-004', firstName: 'Yolanda', lastName: 'Castillo', email: 'yolanda.c@email.com', phone: '(713) 555-0556',
    address: '3720 Almeda Rd, Houston, TX 77004', highBill: 220, lowBill: 95, allElectric: false,
    creditStatus: 'credit_fail', createdAt: '2026-03-08',
    checklist: { creditPassed: false, financeDocsSigned: false, welcomeCallCompleted: false, siteSurveyDone: false, aspOnboarding: false },
    documents: [
      { name: 'ASP Agreement', sent: true, signed: false },
      { name: 'Installer Contract', sent: false, signed: false },
      { name: 'Loan Authorization', sent: false, signed: false },
    ],
    surveyPhotos: [],
  },
];

export const PROJECTS: Project[] = [
  makeProjectData(
    {
      id: 'ASP-2024', customerName: 'James Hernandez', address: '4821 Oak Ridge Dr, Austin, TX 78745',
      email: 'james.h@email.com', phone: '(512) 555-0142', status: 'active', currentMilestone: 4, totalMilestones: 7,
      systemSize: '11.2 kW', battery: 'Duracell 20kW', soldPPW: 3.85, contractValue: 48620,
      repName: 'Jordan Mills', installerName: 'SunTech Installations', addedDate: '2026-01-15', stage: 'Install Scheduled',
      adders: [{ name: 'Battery', cost: 8500 }, { name: 'Electrical Panel', cost: 2200 }],
      siteSurveyPhotos: [], permitStatus: 'approved', roofCondition: 'good', roofIssues: [],
      annualUsage: 14200, documentsSignedCount: 5, totalDocuments: 6,
    },
    { submitted: '2026-01-15', siteSurvey: '2026-01-22', sowConfirmed: '2026-01-28', permitSubmitted: '2026-02-03', lastHOContact: '2026-03-18' },
    { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: true, siteSurveyDone: true, aspOnboarding: true }
  ),
  makeProjectData(
    {
      id: 'ASP-2025', customerName: 'Robert Chen', address: '1203 Magnolia Ln, San Antonio, TX 78201',
      email: 'robert.c@email.com', phone: '(210) 555-0198', status: 'active', currentMilestone: 5, totalMilestones: 7,
      systemSize: '8.5 kW', battery: 'Tesla Powerwall 13.5kW', soldPPW: 4.10, contractValue: 39270,
      repName: 'Caitlin Fox', installerName: 'Pro Solar TX', addedDate: '2025-12-08', stage: 'Utility Inspection',
      adders: [{ name: 'Battery', cost: 12000 }, { name: 'Critter Guard', cost: 800 }],
      siteSurveyPhotos: [], permitStatus: 'approved', roofCondition: 'good', roofIssues: [],
      annualUsage: 11800, documentsSignedCount: 6, totalDocuments: 6,
    },
    { submitted: '2025-12-08', siteSurvey: '2025-12-15', sowConfirmed: '2025-12-20', permitSubmitted: '2026-01-05', lastHOContact: '2026-03-15' },
    { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: true, siteSurveyDone: true, aspOnboarding: true }
  ),
  makeProjectData(
    {
      id: 'ASP-2026', customerName: 'Patricia Williams', address: '982 Sunset Blvd, Houston, TX 77002',
      email: 'pat.w@email.com', phone: '(713) 555-0234', status: 'active', currentMilestone: 3, totalMilestones: 7,
      systemSize: '12 kW', battery: 'Duracell 40kW', soldPPW: 3.65, contractValue: 52800,
      repName: 'Jordan Mills', installerName: 'Pro Solar TX', addedDate: '2026-02-01', stage: 'Permit Approved',
      adders: [{ name: 'Battery', cost: 14000 }, { name: 'Electrical Panel', cost: 2200 }, { name: 'EV Charger', cost: 1500 }],
      siteSurveyPhotos: [], permitStatus: 'approved', roofCondition: 'minor_damage', roofIssues: ['Minor shingle wear on south face'],
      annualUsage: 18400, documentsSignedCount: 4, totalDocuments: 6,
    },
    { submitted: '2026-02-01', siteSurvey: '2026-02-10', sowConfirmed: '2026-02-18', permitSubmitted: '2026-02-25', lastHOContact: '2026-03-12' },
    { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: true, siteSurveyDone: true, aspOnboarding: false }
  ),
  makeProjectData(
    {
      id: 'ASP-2029', customerName: 'Luis Mendoza', address: '335 Pecan St, Dallas, TX 75201',
      email: 'luis.m@email.com', phone: '(214) 555-0177', status: 'active', currentMilestone: 3, totalMilestones: 7,
      systemSize: '9 kW', battery: 'Duracell 20kW', soldPPW: 3.90, contractValue: 41400,
      repName: 'Samantha Cole', installerName: 'SunTech Installations', addedDate: '2026-02-14', stage: 'Install Scheduled',
      adders: [{ name: 'Battery', cost: 8500 }],
      siteSurveyPhotos: [], permitStatus: 'approved', roofCondition: 'good', roofIssues: [],
      annualUsage: 12600, documentsSignedCount: 5, totalDocuments: 6,
    },
    { submitted: '2026-02-14', siteSurvey: '2026-02-20', sowConfirmed: '2026-02-26', permitSubmitted: '2026-03-01', lastHOContact: '2026-03-17' },
    { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: true, siteSurveyDone: true, aspOnboarding: true }
  ),
  makeProjectData(
    {
      id: 'ASP-2030', customerName: 'Angela Davis', address: '7744 Elm Creek Rd, Fort Worth, TX 76109',
      email: 'angela.d@email.com', phone: '(817) 555-0311', status: 'delayed', currentMilestone: 3, totalMilestones: 7,
      systemSize: '7.5 kW', battery: 'None', soldPPW: 3.50, contractValue: 29750,
      repName: 'Jordan Mills', installerName: 'Lone Star Solar', addedDate: '2026-01-20', stage: 'Install Delayed',
      adders: [],
      siteSurveyPhotos: [], permitStatus: 'approved', roofCondition: 'major_damage', roofIssues: ['Water damage on northeast section', 'Structural sagging near chimney'],
      annualUsage: 9800, documentsSignedCount: 4, totalDocuments: 6,
    },
    { submitted: '2026-01-20', siteSurvey: '2026-01-28', sowConfirmed: '2026-02-05', permitSubmitted: '2026-02-12', lastHOContact: '2026-03-10' },
    { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: false, siteSurveyDone: true, aspOnboarding: false }
  ),
  makeProjectData(
    {
      id: 'ASP-2033', customerName: 'Marcus Thompson', address: '1120 Live Oak Trail, Austin, TX 78703',
      email: 'marcus.t@email.com', phone: '(512) 555-0288', status: 'active', currentMilestone: 6, totalMilestones: 7,
      systemSize: '6.5 kW', battery: 'None', soldPPW: 3.70, contractValue: 27190,
      repName: 'Caitlin Fox', installerName: 'SunTech Installations', addedDate: '2025-11-22', stage: 'PTO Pending',
      adders: [{ name: 'Critter Guard', cost: 800 }],
      siteSurveyPhotos: [], permitStatus: 'approved', roofCondition: 'good', roofIssues: [],
      annualUsage: 8400, documentsSignedCount: 6, totalDocuments: 6,
    },
    { submitted: '2025-11-22', siteSurvey: '2025-12-01', sowConfirmed: '2025-12-08', permitSubmitted: '2025-12-15', lastHOContact: '2026-03-19' },
    { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: true, siteSurveyDone: true, aspOnboarding: true }
  ),
  makeProjectData(
    {
      id: 'ASP-2034', customerName: 'Deborah White', address: '903 Bluebonnet Way, Plano, TX 75025',
      email: 'deb.w@email.com', phone: '(469) 555-0199', status: 'on_hold', currentMilestone: 2, totalMilestones: 7,
      systemSize: '10.8 kW', battery: 'Duracell 40kW', soldPPW: 3.80, contractValue: 55080,
      repName: 'Samantha Cole', installerName: 'Green Wave Energy', addedDate: '2026-01-10', stage: 'On Hold - Financing',
      adders: [{ name: 'Battery', cost: 14000 }, { name: 'Electrical Panel', cost: 2200 }],
      siteSurveyPhotos: [], permitStatus: 'pending', roofCondition: 'good', roofIssues: [],
      annualUsage: 15200, documentsSignedCount: 2, totalDocuments: 6,
    },
    { submitted: '2026-01-10', siteSurvey: '2026-01-18', sowConfirmed: null, permitSubmitted: null, lastHOContact: '2026-03-05' },
    { creditPassed: true, financeDocsSigned: false, welcomeCallCompleted: false, siteSurveyDone: true, aspOnboarding: false }
  ),
  makeProjectData(
    {
      id: 'ASP-2041', customerName: 'Tyler Morgan', address: '567 Willow Creek Blvd, Round Rock, TX 78664',
      email: 'tyler.m@email.com', phone: '(512) 555-0344', status: 'active', currentMilestone: 3, totalMilestones: 7,
      systemSize: '9.8 kW', battery: 'Duracell 40kW', soldPPW: 3.75, contractValue: 47850,
      repName: 'Jordan Mills', installerName: 'Lone Star Solar', addedDate: '2026-03-01', stage: 'Install Scheduled',
      adders: [{ name: 'Battery', cost: 14000 }, { name: 'Critter Guard', cost: 800 }],
      siteSurveyPhotos: [], permitStatus: 'approved', roofCondition: 'good', roofIssues: [],
      annualUsage: 13400, documentsSignedCount: 5, totalDocuments: 6,
    },
    { submitted: '2026-03-01', siteSurvey: '2026-03-08', sowConfirmed: '2026-03-12', permitSubmitted: '2026-03-15', lastHOContact: '2026-03-19' },
    { creditPassed: true, financeDocsSigned: true, welcomeCallCompleted: true, siteSurveyDone: true, aspOnboarding: true }
  ),
];

export const MILESTONES = MILESTONE_NAMES;

export const SPIN_PRIZES = [
  { name: 'ASP T-Shirt', icon: '👕', value: 40, tier: 'normal' },
  { name: 'ASP Hat', icon: '🧢', value: 25, tier: 'normal' },
  { name: 'ASP Coffee Mug', icon: '☕', value: 35, tier: 'normal' },
  { name: 'Lanyard + Glasses', icon: '🕶️', value: 55, tier: 'normal' },
  { name: 'AirPods', icon: '🎧', value: 120, tier: 'lucky' },
  { name: 'iPencil', icon: '✏️', value: 120, tier: 'lucky' },
  { name: 'Cash Bonus', icon: '💵', value: 85, tier: 'normal' },
  { name: 'Meta Raybans', icon: '😎', value: 300, tier: 'golden' },
  { name: 'Oculus Quest', icon: '🥽', value: 450, tier: 'golden' },
  { name: 'iPad', icon: '📱', value: 500, tier: 'alpha' },
  { name: '5★ Dinner', icon: '🍽️', value: 500, tier: 'alpha' },
  { name: 'Cruise Ship', icon: '🚢', value: 400, tier: 'golden' },
  { name: '$800 Jewelry', icon: '💎', value: 800, tier: 'super_alpha' },
  { name: '$5K Vacation Piece', icon: '🏝️', value: 500, tier: 'super_alpha' },
  { name: '200% Tickets 7d', icon: '🎟️', value: 170, tier: 'lucky' },
  { name: '10 Internal Leads', icon: '📊', value: 850, tier: 'alpha' },
  { name: 'ASP Hoodie', icon: '🧥', value: 65, tier: 'normal' },
  { name: 'Wireless Charger', icon: '🔋', value: 45, tier: 'normal' },
  { name: 'Nike Gift Card', icon: '👟', value: 100, tier: 'lucky' },
  { name: 'Beats Solo', icon: '🎵', value: 200, tier: 'golden' },
];

export const SPIN_TIERS = [
  { name: 'Normal Spin', tickets: 1, color: 'gray' },
  { name: 'Lucky Spin', tickets: 2, color: 'blue' },
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
  yearlyPaidOut: 47820,
  pendingPipeline: 128450,
  installCount: 14,
  monthlyAppointments: 22,
  avgRating: 4.2,
  ticketBalance: 12,
  vacationPieces: 3,
};

export const COMMISSIONS = PROJECTS.map((p) => {
  const redline = 2.35;
  const adderCost = p.adders.reduce((s, a) => s + a.cost, 0);
  const watts = parseFloat(p.systemSize) * 1000;
  const systemCostPerWatt = watts * redline;
  const soldTotal = watts * p.soldPPW;
  const commission = soldTotal - systemCostPerWatt - adderCost;
  const splitPercent = 0.60;
  return {
    projectId: p.id,
    customerName: p.customerName,
    systemSize: p.systemSize,
    soldPPW: p.soldPPW,
    redline,
    adderCost,
    projectBaseline: systemCostPerWatt + adderCost,
    soldTotal,
    commission,
    splitPercent,
    yourCommission: commission * splitPercent,
    status: p.currentMilestone >= 5 ? 'paid' : p.currentMilestone >= 3 ? 'pending' : 'processing',
    expectedPayDate: p.currentMilestone >= 5 ? 'Paid' : '2026-04-15',
  };
});

export const APPOINTMENTS = [
  { id: 1, name: 'Sarah Mitchell', address: '445 Cedar Park Dr, Austin, TX', phone: '(512) 555-0891', email: 'sarah.m@email.com', date: '2026-03-20', time: '2:00 PM', highBill: 285, lowBill: 120, allElectric: true, stars: 5, setter: 'Jordan Mills', closer: null, status: 'open', gotBill: true, gotContact: true, bothHomeowners: true, meterPhoto: true, billOver250: true },
  { id: 2, name: 'David Park', address: '1102 Riverside Blvd, Houston, TX', phone: '(713) 555-0445', email: 'david.p@email.com', date: '2026-03-20', time: '4:30 PM', highBill: 320, lowBill: 145, allElectric: false, stars: 4, setter: 'Samantha Cole', closer: 'Jordan Mills', status: 'assigned', gotBill: true, gotContact: true, bothHomeowners: true, meterPhoto: true, billOver250: true },
  { id: 3, name: 'Maria Gonzalez', address: '789 Alamo Heights, San Antonio, TX', phone: '(210) 555-0667', email: 'maria.g@email.com', date: '2026-03-21', time: '10:00 AM', highBill: 198, lowBill: 88, allElectric: true, stars: 3, setter: 'Caitlin Fox', closer: null, status: 'open', gotBill: true, gotContact: true, bothHomeowners: false, meterPhoto: true, billOver250: false },
  { id: 4, name: 'Kevin Wright', address: '2340 Preston Rd, Dallas, TX', phone: '(214) 555-0112', email: 'kevin.w@email.com', date: '2026-03-22', time: '11:00 AM', highBill: 410, lowBill: 180, allElectric: true, stars: 5, setter: 'Jordan Mills', closer: null, status: 'open', gotBill: true, gotContact: true, bothHomeowners: true, meterPhoto: true, billOver250: true },
  { id: 5, name: 'Lisa Chang', address: '5601 Westheimer Rd, Houston, TX', phone: '(713) 555-0223', email: 'lisa.c@email.com', date: '2026-03-23', time: '1:00 PM', highBill: 265, lowBill: 110, allElectric: false, stars: 4, setter: 'Samantha Cole', closer: 'Caitlin Fox', status: 'assigned', gotBill: true, gotContact: true, bothHomeowners: true, meterPhoto: false, billOver250: true },
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
  { ...PROJECTS[6], id: 'ASP-2050', customerName: 'New Lead - Rachel Kim', status: 'active', currentMilestone: 0, stage: 'QC Review' },
  { ...PROJECTS[3], id: 'ASP-2051', customerName: 'New Lead - Tom Bradley', status: 'active', currentMilestone: 0, stage: 'QC Review', roofCondition: 'major_damage', roofIssues: ['Significant water staining on decking', 'Missing flashing around vents'] },
];

export const INSTALLED_HOMES = [
  { lat: 29.7604, lng: -95.3698, address: '1234 Main St, Houston, TX', customer: 'Johnson Family', systemSize: '10.2 kW', installDate: '2025-11-15' },
  { lat: 29.7764, lng: -95.4235, address: '5678 Westheimer Rd, Houston, TX', customer: 'Garcia Family', systemSize: '8.5 kW', installDate: '2025-12-01' },
  { lat: 29.7284, lng: -95.4098, address: '910 Bellaire Blvd, Houston, TX', customer: 'Smith Family', systemSize: '12 kW', installDate: '2026-01-10' },
  { lat: 29.7503, lng: -95.3575, address: '2200 Travis St, Houston, TX', customer: 'Williams Family', systemSize: '9.8 kW', installDate: '2026-01-28' },
  { lat: 29.8168, lng: -95.4146, address: '3450 N Shepherd Dr, Houston, TX', customer: 'Brown Family', systemSize: '11.5 kW', installDate: '2026-02-15' },
  { lat: 29.6966, lng: -95.4173, address: '7800 Kirby Dr, Houston, TX', customer: 'Davis Family', systemSize: '7.2 kW', installDate: '2025-10-20' },
  { lat: 27.8006, lng: -97.3964, address: '456 Ocean Dr, Corpus Christi, TX', customer: 'Martinez Family', systemSize: '9 kW', installDate: '2025-12-12' },
  { lat: 27.7436, lng: -97.4019, address: '789 Staples St, Corpus Christi, TX', customer: 'Rodriguez Family', systemSize: '10.5 kW', installDate: '2026-02-01' },
  { lat: 27.7700, lng: -97.3820, address: '321 Shoreline Blvd, Corpus Christi, TX', customer: 'Nguyen Family', systemSize: '8 kW', installDate: '2026-03-05' },
  { lat: 29.7900, lng: -95.3900, address: '4400 Heights Blvd, Houston, TX', customer: 'Wilson Family', systemSize: '13 kW', installDate: '2026-02-20' },
  { lat: 29.7100, lng: -95.2900, address: '6000 Lawndale St, Houston, TX', customer: 'Lopez Family', systemSize: '8.8 kW', installDate: '2025-09-30' },
  { lat: 29.6500, lng: -95.2800, address: '12000 Gulf Fwy, Houston, TX', customer: 'Taylor Family', systemSize: '11 kW', installDate: '2026-01-05' },
];
