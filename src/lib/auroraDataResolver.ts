/**
 * Aurora Data Resolver — Single Source of Truth
 * 
 * All portals (Sales, Backend Ops, Installer, Financier) MUST use this module
 * to read and verify Aurora/system data. Never hardcode or generate random values.
 * 
 * Data hierarchy:
 *   1. sell_project.aurora_data (synced from Aurora)
 *   2. project.aurora_data (copied during aurora-sync edge function)
 *   3. Fallback: returns null fields so UI can show "missing" state
 * 
 * Designed for future Aurora API integration — verification checks
 * will validate against live API data when available.
 */

export interface ResolvedAuroraData {
  systemSize: string | null;
  battery: string | null;
  financier: string | null;
  monthlyPayment: string | null;
  adders: string[];
  panelCount: number | null;
  panelType: string | null;
  inverterType: string | null;
  annualProduction: number | null;
  annualConsumption: number | null;
  offsetPercent: number | null;
  systemPrice: number | null;
  contractValue: number | null;
  pricePerWatt: number | null;
  escalationRate: number | null;
  auroraProjectId: string | null;
}

export interface DataVerificationResult {
  verified: boolean;
  missingFields: string[];
  warnings: string[];
}

const REQUIRED_FIELDS: (keyof ResolvedAuroraData)[] = [
  'systemSize', 'battery', 'financier', 'monthlyPayment',
];

const RECOMMENDED_FIELDS: (keyof ResolvedAuroraData)[] = [
  'panelCount', 'panelType', 'inverterType', 'annualProduction',
  'systemPrice', 'contractValue', 'pricePerWatt',
];

/**
 * Resolve Aurora data from any raw source (sell_project.aurora_data or project.aurora_data).
 * Normalizes all field formats to a consistent shape.
 */
export function resolveAuroraData(rawData: any): ResolvedAuroraData {
  if (!rawData) {
    return {
      systemSize: null, battery: null, financier: null, monthlyPayment: null,
      adders: [], panelCount: null, panelType: null, inverterType: null,
      annualProduction: null, annualConsumption: null, offsetPercent: null,
      systemPrice: null, contractValue: null, pricePerWatt: null,
      escalationRate: null, auroraProjectId: null,
    };
  }

  // Normalize systemSize — could be number (kW) or string ("8.4 kW")
  let systemSize: string | null = null;
  if (rawData.systemSize != null) {
    systemSize = typeof rawData.systemSize === 'number'
      ? `${rawData.systemSize} kW`
      : String(rawData.systemSize);
  }

  // Normalize monthlyPayment — could be number or "$180"
  let monthlyPayment: string | null = null;
  if (rawData.monthlyPayment != null) {
    monthlyPayment = typeof rawData.monthlyPayment === 'number'
      ? `$${rawData.monthlyPayment}`
      : String(rawData.monthlyPayment);
  }

  // Normalize adders — could be objects or strings
  let adders: string[] = [];
  if (Array.isArray(rawData.adders)) {
    adders = rawData.adders.map((a: any) =>
      typeof a === 'string' ? a : (a.name || a.label || JSON.stringify(a))
    );
  }

  return {
    systemSize,
    battery: rawData.battery ?? null,
    financier: rawData.financier ?? null,
    monthlyPayment,
    adders,
    panelCount: rawData.panelCount ?? null,
    panelType: rawData.panelType ?? null,
    inverterType: rawData.inverterType ?? null,
    annualProduction: rawData.annualProduction ?? null,
    annualConsumption: rawData.annualConsumption ?? null,
    offsetPercent: rawData.offsetPercent ?? null,
    systemPrice: rawData.systemPrice ?? null,
    contractValue: rawData.contractValue ?? null,
    pricePerWatt: rawData.pricePerWatt ?? null,
    escalationRate: rawData.escalationRate ?? null,
    auroraProjectId: rawData.auroraProjectId ?? null,
  };
}

/**
 * Verify that resolved Aurora data has all required and recommended fields.
 * Returns a verification result with missing fields and warnings.
 */
export function verifyAuroraData(data: ResolvedAuroraData): DataVerificationResult {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    const val = data[field];
    if (val === null || val === undefined || val === '') {
      missingFields.push(field);
    }
  }

  for (const field of RECOMMENDED_FIELDS) {
    const val = data[field];
    if (val === null || val === undefined || val === '') {
      warnings.push(`${field} is not populated — will be required for Aurora API sync`);
    }
  }

  // Business logic checks
  if (data.systemSize) {
    const sizeNum = parseFloat(data.systemSize);
    if (sizeNum < 3 || sizeNum > 30) {
      warnings.push(`System size ${data.systemSize} is outside typical range (3-30 kW)`);
    }
  }

  if (data.pricePerWatt != null && (data.pricePerWatt < 1.5 || data.pricePerWatt > 6)) {
    warnings.push(`Price per watt $${data.pricePerWatt} is outside typical range ($1.50-$6.00)`);
  }

  if (data.escalationRate != null && data.escalationRate > 5) {
    warnings.push(`Escalation rate ${data.escalationRate}% seems unusually high`);
  }

  if (data.offsetPercent != null && data.offsetPercent > 150) {
    warnings.push(`Offset ${data.offsetPercent}% exceeds 150% — verify with Aurora`);
  }

  return {
    verified: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

/**
 * Compare two aurora data sets and return discrepancies.
 * Used by the recheck system when opening Convert to Sale dialog.
 */
export function compareAuroraData(
  source: ResolvedAuroraData,
  target: ResolvedAuroraData
): string[] {
  const discrepancies: string[] = [];
  
  const fieldsToCheck: { key: keyof ResolvedAuroraData; label: string }[] = [
    { key: 'systemSize', label: 'System Size' },
    { key: 'battery', label: 'Battery' },
    { key: 'financier', label: 'Financier' },
    { key: 'monthlyPayment', label: 'Monthly Payment' },
    { key: 'panelCount', label: 'Panel Count' },
    { key: 'systemPrice', label: 'System Price' },
    { key: 'contractValue', label: 'Contract Value' },
    { key: 'pricePerWatt', label: 'Price Per Watt' },
  ];

  for (const { key, label } of fieldsToCheck) {
    const sVal = String(source[key] ?? '');
    const tVal = String(target[key] ?? '');
    if (sVal && tVal && sVal !== tVal) {
      discrepancies.push(`${label}: "${sVal}" vs "${tVal}"`);
    }
  }

  return discrepancies;
}
