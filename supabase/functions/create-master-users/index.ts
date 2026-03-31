import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const masterUsers = [
      { email: "aidan@alphasalepro.com", password: "ASP26!", fullName: "Aidan Pierce", username: "AidanPierce" },
      { email: "michael@alphasalepro.com", password: "ASP26!", fullName: "Michael Pierce", username: "MichaelPierce" },
    ];

    // Create ASP Core organization first
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from("organizations")
      .upsert({ name: "Alpha Sale Pro", type: "asp_core", contact_email: "admin@alphasalepro.com" }, { onConflict: "name" })
      .select()
      .single();

    // If upsert fails due to no unique constraint on name, try insert then select
    let orgId: string;
    if (orgError) {
      const { data: existingOrg } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("name", "Alpha Sale Pro")
        .single();
      
      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const { data: newOrg, error: insertErr } = await supabaseAdmin
          .from("organizations")
          .insert({ name: "Alpha Sale Pro", type: "asp_core", contact_email: "admin@alphasalepro.com" })
          .select()
          .single();
        if (insertErr) throw insertErr;
        orgId = newOrg.id;
      }
    } else {
      orgId = orgData.id;
    }

    const results = [];

    for (const user of masterUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(u => u.email === user.email);

      let userId: string;

      if (existing) {
        userId = existing.id;
        results.push({ email: user.email, status: "already exists", userId });
      } else {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.fullName, username: user.username },
        });

        if (authError) {
          results.push({ email: user.email, status: "error", error: authError.message });
          continue;
        }
        userId = authData.user.id;
        results.push({ email: user.email, status: "created", userId });
      }

      // Update profile with org
      await supabaseAdmin
        .from("profiles")
        .update({ organization_id: orgId })
        .eq("user_id", userId);

      // Add master role (and all other roles for full access)
      const roles = ["master", "sales_rep", "backend_ops", "installer", "financier"];
      for (const role of roles) {
        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
      }
    }

    return new Response(JSON.stringify({ success: true, results, orgId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
