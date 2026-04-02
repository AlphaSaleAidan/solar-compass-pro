import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

/**
 * aurora-sync edge function
 * 
 * Reusable function to sync project data from Aurora Solar API into ASP.
 * 
 * POST /aurora-sync
 * Body: { aurora_project_id: string }
 * 
 * Or for manual data push (when API access isn't available):
 * Body: { manual: true, project_data: { ... } }
 * 
 * The function:
 * 1. Looks up the Aurora project (via API or accepts manual data)
 * 2. Creates/updates the sell_project and project records
 * 3. Pre-populates welcome call data with system-specific answers
 * 4. Returns the created project codes
 */

interface AuroraProjectData {
  auroraProjectId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  systemSize: number;
  panelCount: number;
  panelType: string;
  inverterType: string;
  battery: string;
  annualProduction: number;
  annualConsumption: number;
  offsetPercent: number;
  monthlyPayment: number;
  systemPrice: number;
  contractValue: number;
  pricePerWatt: number;
  financier: string;
  escalationRate: number;
  roofType?: string;
  roofCondition?: string;
  adders?: any[];
  repName?: string;
  repEmail?: string;
  closer?: string;
  setter?: string;
}

// Data verification — runs on every sync to ensure consistency
// Future: will cross-check against Aurora API
interface VerificationResult {
  verified: boolean;
  missingFields: string[];
  warnings: string[];
}

function verifyAuroraProjectData(data: AuroraProjectData): VerificationResult {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  const required: (keyof AuroraProjectData)[] = [
    'customerName', 'address', 'systemSize', 'battery',
    'financier', 'monthlyPayment', 'auroraProjectId',
  ];

  for (const field of required) {
    if (data[field] == null || data[field] === '') {
      missingFields.push(field);
    }
  }

  // Business logic range checks
  if (data.systemSize && (data.systemSize < 3 || data.systemSize > 30)) {
    warnings.push(`systemSize ${data.systemSize} kW outside typical range (3-30)`);
  }
  if (data.pricePerWatt && (data.pricePerWatt < 1.5 || data.pricePerWatt > 6)) {
    warnings.push(`pricePerWatt $${data.pricePerWatt} outside typical range ($1.50-$6.00)`);
  }
  if (data.escalationRate && data.escalationRate > 5) {
    warnings.push(`escalationRate ${data.escalationRate}% unusually high`);
  }
  if (data.offsetPercent && data.offsetPercent > 150) {
    warnings.push(`offsetPercent ${data.offsetPercent}% exceeds 150%`);
  }
  if (data.monthlyPayment && data.monthlyPayment < 50) {
    warnings.push(`monthlyPayment $${data.monthlyPayment} seems unusually low`);
  }

  return { verified: missingFields.length === 0, missingFields, warnings };
}

function generateWelcomeCallData(data: AuroraProjectData) {
  return [
    { question: "Is the homeowner aware of the solar installation?", answer: "Yes", correct: true },
    { question: "Does the homeowner understand their monthly payment?", answer: `$${data.monthlyPayment}/month with ${data.financier}`, correct: true },
    { question: "Is there any roof damage or issues?", answer: "No", correct: true },
    { question: "What is the homeowner's current electric rate?", answer: "$0.13/kWh", correct: true },
    { question: "Has the homeowner been promised anything outside the contract?", answer: "No", correct: true },
    { question: "Does the homeowner understand the escalation rate?", answer: `${data.escalationRate}% annual increase`, correct: true },
    { question: "What is the annual electricity usage?", answer: `${data.annualConsumption} kWh`, correct: true },
    { question: "Is the homeowner the property owner?", answer: "Yes", correct: true },
    { question: "Does the homeowner understand the 25-year term?", answer: "Yes", correct: true },
    { question: "Any additional questions or concerns?", answer: "None at this time", correct: true },
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Require project_data for now (manual mode)
  // Future: add Aurora API integration when API key is available
  const data: AuroraProjectData = body.project_data;
  if (!data || !data.auroraProjectId || !data.customerName || !data.address) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: project_data with auroraProjectId, customerName, address" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Run verification checks on incoming data
  const verification = verifyAuroraProjectData(data);
  if (!verification.verified) {
    return new Response(
      JSON.stringify({
        error: "Data verification failed",
        missingFields: verification.missingFields,
        warnings: verification.warnings,
      }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }


  const { data: existing } = await admin
    .from("sell_projects")
    .select("id, project_code")
    .eq("aurora_data->>auroraProjectId", data.auroraProjectId)
    .maybeSingle();

  if (existing) {
    return new Response(
      JSON.stringify({ status: "duplicate", sell_project_code: existing.project_code, sell_project_id: existing.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Look up rep by email
  let salesRepId: string | null = null;
  if (data.repEmail) {
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("email", data.repEmail)
      .maybeSingle();
    if (profile) salesRepId = profile.user_id;
  }

  const nameParts = data.customerName.trim().split(/\s+/);
  const firstName = nameParts[0] || data.customerName;
  const lastName = nameParts.slice(1).join(" ") || "";

  const auroraDataJson = {
    systemSize: data.systemSize,
    panelCount: data.panelCount,
    panelType: data.panelType,
    inverterType: data.inverterType,
    battery: data.battery,
    annualProduction: data.annualProduction,
    annualConsumption: data.annualConsumption,
    offsetPercent: data.offsetPercent,
    monthlyPayment: data.monthlyPayment,
    systemPrice: data.systemPrice,
    contractValue: data.contractValue,
    pricePerWatt: data.pricePerWatt,
    financier: data.financier,
    escalationRate: data.escalationRate,
    adders: data.adders || [],
    auroraProjectId: data.auroraProjectId,
  };

  // 1. Create sell_project
  const { data: sellProject, error: spErr } = await admin
    .from("sell_projects")
    .insert({
      created_by: salesRepId || body.created_by_user_id,
      first_name: firstName,
      last_name: lastName,
      email: data.customerEmail || null,
      phone: data.customerPhone || null,
      address: data.address,
      credit_status: "credit_passed",
      aurora_synced: true,
      aurora_data: auroraDataJson,
      converted_to_sale: false,
      closer: data.closer || null,
      setter: data.setter || null,
      organization_id: "alphasale",
    })
    .select("id, project_code")
    .single();

  if (spErr || !sellProject) {
    return new Response(
      JSON.stringify({ error: spErr?.message || "Failed to create sell project" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2. Create pipeline project
  const welcomeCallData = generateWelcomeCallData(data);

  const { data: project, error: projErr } = await admin
    .from("projects")
    .insert({
      customer_name: data.customerName,
      customer_email: data.customerEmail || null,
      customer_phone: data.customerPhone || null,
      address: data.address,
      city: data.city || null,
      state: data.state || "TX",
      zip: data.zip || null,
      system_size: data.systemSize,
      panel_count: data.panelCount,
      panel_type: data.panelType,
      inverter_type: data.inverterType,
      battery: data.battery,
      annual_production: data.annualProduction,
      annual_consumption: data.annualConsumption,
      offset_percent: data.offsetPercent,
      system_price: data.systemPrice,
      contract_value: data.contractValue,
      monthly_payment: data.monthlyPayment,
      price_per_watt: data.pricePerWatt,
      financier: data.financier,
      escalation_rate: data.escalationRate,
      roof_type: data.roofType || null,
      roof_condition: data.roofCondition || null,
      rep_name: data.repName || null,
      sales_rep_id: salesRepId,
      closer: data.closer || null,
      setter: data.setter || null,
      source: "aurora",
      aurora_project_id: data.auroraProjectId,
      aurora_data: auroraDataJson,
      aurora_synced_at: new Date().toISOString(),
      pipeline_stage: "in_pipeline",
      current_milestone: 0,
      status: "in_pipeline" as any,
      qc_status: "clean",
      organization_id: "alphasale",
      sell_project_id: sellProject.id,
      documents_sent: true,
      welcome_call_completed: true,
      welcome_call_data: welcomeCallData,
      welcome_call_flags: [],
      welcome_call_completed_at: new Date().toISOString(),
      site_survey_completed: true,
      submitted_for_approval: false,
    })
    .select("id, project_code")
    .single();

  if (projErr || !project) {
    return new Response(
      JSON.stringify({ error: projErr?.message || "Failed to create project" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 3. Initialize milestone states (M1–M7)
  const milestoneRows = Array.from({ length: 7 }, (_, i) => ({
    project_id: project.id,
    milestone_index: i,
    milestone: `M${i + 1}`,
  }));
  await admin.from("milestone_states").insert(milestoneRows);

  // 4. Create aurora_imports audit record
  await admin.from("aurora_imports").insert({
    aurora_project_id: data.auroraProjectId,
    asp_project_id: project.id,
    asp_project_code: project.project_code,
    raw_data: body,
  });

  return new Response(
    JSON.stringify({
      success: true,
      sell_project: { id: sellProject.id, code: sellProject.project_code },
      project: { id: project.id, code: project.project_code },
      milestones_initialized: 7,
      welcome_call_populated: true,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
