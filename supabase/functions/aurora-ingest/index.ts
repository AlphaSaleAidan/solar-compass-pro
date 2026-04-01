import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

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

  // Accept single deal or array
  const deals = Array.isArray(body) ? body : [body];
  const results: any[] = [];

  for (const deal of deals) {
    // Validate required fields
    if (!deal.project_id || !deal.customer_name || !deal.customer_address) {
      results.push({
        aurora_id: deal.project_id || "unknown",
        status: "error",
        error: "Missing required fields: project_id, customer_name, customer_address",
      });
      continue;
    }

    // Check for duplicate
    const { data: existing } = await admin
      .from("aurora_imports")
      .select("id, asp_project_code")
      .eq("aurora_project_id", deal.project_id)
      .maybeSingle();

    if (existing) {
      results.push({
        aurora_id: deal.project_id,
        status: "duplicate",
        asp_project_code: existing.asp_project_code,
      });
      continue;
    }

    // Look up rep by email
    let salesRepId: string | null = null;
    if (deal.rep_email) {
      const { data: profile } = await admin
        .from("profiles")
        .select("user_id")
        .eq("email", deal.rep_email)
        .maybeSingle();
      if (profile) salesRepId = profile.user_id;
    }

    // Create project
    const { data: project, error: projErr } = await admin
      .from("projects")
      .insert({
        customer_name: deal.customer_name,
        customer_email: deal.customer_email || null,
        customer_phone: deal.customer_phone || null,
        address: deal.customer_address,
        system_size: deal.system_size_kw || null,
        panel_count: deal.panel_count || null,
        panel_type: deal.panel_type || null,
        inverter_type: deal.inverter_type || null,
        battery: deal.battery || null,
        annual_production: deal.annual_production_kwh || null,
        annual_consumption: deal.annual_consumption_kwh || null,
        offset_percent: deal.offset_percent || null,
        system_price: deal.system_cost || null,
        contract_value: deal.contract_value || null,
        monthly_payment: deal.monthly_payment || null,
        financier: deal.financing_type || null,
        rep_name: deal.rep_name || null,
        sales_rep_id: salesRepId,
        source: "aurora",
        aurora_project_id: deal.project_id,
        pipeline_stage: "in_pipeline",
        current_milestone: 0,
        status: "in_pipeline" as any,
        qc_status: "clean",
        organization_id: "alphasale",
      })
      .select("id, project_code")
      .single();

    if (projErr || !project) {
      results.push({
        aurora_id: deal.project_id,
        status: "error",
        error: projErr?.message || "Failed to create project",
      });
      continue;
    }

    // Initialize 7 milestone_states rows (M1–M7)
    const milestoneRows = Array.from({ length: 7 }, (_, i) => ({
      project_id: project.id,
      milestone_index: i,
      milestone: `M${i + 1}`,
    }));
    await admin.from("milestone_states").insert(milestoneRows);

    // Create aurora_imports audit record
    await admin.from("aurora_imports").insert({
      aurora_project_id: deal.project_id,
      asp_project_id: project.id,
      asp_project_code: project.project_code,
      raw_data: deal,
    });

    results.push({
      aurora_id: deal.project_id,
      status: "imported",
      asp_project_code: project.project_code,
      current_milestone: "M1",
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      imported: results.filter((r) => r.status === "imported").length,
      results,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
