import type { Project } from '@/data/mockData';
import { UPFRONT_MILESTONES } from '@/data/mockData';

export interface CommissionCalc {
  projectId: string;
  customerName: string;
  systemSize: string;
  soldPPW: number;
  redline: number;
  adderCost: number;
  battery: string;
  projectBaseline: number;
  soldTotal: number;
  commission: number;
  splitPercent: number;
  yourCommission: number;
  status: 'paid' | 'pending' | 'processing';
  expectedPayDate: string;
  upfronts: {
    milestone: string;
    closerPay: number | string;
    completed: boolean;
    completedDate: string | null;
    expectedPay: string;
    ticketsEarned: number;
  }[];
}

/**
 * Calculate commission for any project — works for both demo and production data.
 * The key formula: commission = (soldPPW - redline) * watts - adderCost
 * Your commission = commission * splitPercent
 */
export const calculateCommission = (project: Project, splitPercent = 0.60): CommissionCalc => {
  const redline = 2.35;
  const watts = parseFloat(project.systemSize) * 1000;
  const adderCost = project.adders.reduce((s, a) => s + a.cost, 0);
  const systemCostPerWatt = watts * redline;
  const soldTotal = watts * project.soldPPW;
  const commission = soldTotal - systemCostPerWatt - adderCost;

  const upfronts = UPFRONT_MILESTONES.map((um, i) => {
    const milestoneIndex = i + 1;
    const completed = project.currentMilestone >= milestoneIndex;
    const completedDate = completed ? (
      i === 0 ? project.dates.siteSurvey :
      i === 1 ? project.dates.permitSubmitted :
      i === 2 ? project.dates.permitSubmitted :
      i === 3 ? project.dates.submitted :
      i === 4 ? project.dates.submitted :
      project.dates.submitted
    ) : null;
    return {
      ...um,
      completed,
      completedDate: completedDate || null,
      expectedPay: completed ? (typeof um.closerPay === 'number' ? 'Within 24hrs' : 'Up to 1 week') : 'Pending',
    };
  });

  return {
    projectId: project.id,
    customerName: project.customerName,
    systemSize: project.systemSize,
    soldPPW: project.soldPPW,
    redline,
    adderCost,
    battery: project.battery,
    projectBaseline: systemCostPerWatt + adderCost,
    soldTotal,
    commission,
    splitPercent,
    yourCommission: commission * splitPercent,
    status: project.currentMilestone >= 5 ? 'paid' : project.currentMilestone >= 3 ? 'pending' : 'processing',
    expectedPayDate: project.currentMilestone >= 5 ? 'Paid' : 'TBD',
    upfronts,
  };
};

/**
 * Calculate commission from raw Supabase project data (production).
 * Uses the same formula but pulls from DB fields.
 */
export interface SupabaseProject {
  id: string;
  customer_name: string;
  system_size: number | null;
  price_per_watt: number | null;
  current_milestone: number | null;
  contract_value: number | null;
  project_cost: number | null;
  adders: any;
  battery: string | null;
  address: string | null;
  status: string;
  closer: string | null;
  setter: string | null;
  created_at: string;
}

export const calculateSupabaseCommission = (project: SupabaseProject, splitPercent = 0.60) => {
  const redline = 2.35;
  const systemSize = project.system_size || 0;
  const watts = systemSize * 1000;
  const ppw = project.price_per_watt || 0;
  const adders = Array.isArray(project.adders) ? project.adders : [];
  const adderCost = adders.reduce((s: number, a: any) => s + (a?.cost || 0), 0);
  const systemCostPerWatt = watts * redline;
  const soldTotal = watts * ppw;
  const commission = soldTotal - systemCostPerWatt - adderCost;
  const currentMilestone = project.current_milestone || 0;

  return {
    projectId: project.id,
    customerName: project.customer_name,
    systemSize: `${systemSize} kW`,
    soldPPW: ppw,
    redline,
    adderCost,
    battery: project.battery || 'None',
    address: project.address || '',
    projectBaseline: systemCostPerWatt + adderCost,
    soldTotal,
    commission,
    splitPercent,
    yourCommission: commission * splitPercent,
    status: currentMilestone >= 5 ? 'paid' as const : currentMilestone >= 3 ? 'pending' as const : 'processing' as const,
    currentMilestone,
  };
};
