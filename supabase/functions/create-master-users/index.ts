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
      { email: "apierce@alphasale.co", password: "ASP26!", fullName: "Aidan Pierce", username: "AidanPierce", oldEmail: "aidan@alphasalepro.com" },
      { email: "mpierce@alphasale.co", password: "ASP26!", fullName: "Michael Pierce", username: "MichaelPierce", oldEmail: "michael@alphasalepro.com" },
    ];

    // Create ASP Core organization
    const { data: existingOrg } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("name", "Alpha Sale Pro")
      .single();

    let orgId: string;
    if (existingOrg) {
      orgId = existingOrg.id;
    } else {
      const { data: newOrg, error: insertErr } = await supabaseAdmin
        .from("organizations")
        .insert({ name: "Alpha Sale Pro", type: "asp_core", contact_email: "admin@alphasale.co" })
        .select()
        .single();
      if (insertErr) throw insertErr;
      orgId = newOrg.id;
    }

    const results = [];
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();

    for (const user of masterUsers) {
      // Check for existing user with old or new email
      const existingOld = existingUsers?.users?.find(u => u.email === user.oldEmail);
      const existingNew = existingUsers?.users?.find(u => u.email === user.email);

      let userId: string;

      if (existingOld) {
        // Update old email to new email
        const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(existingOld.id, {
          email: user.email,
          email_confirm: true,
        });
        if (updateErr) {
          results.push({ email: user.email, status: "email update error", error: updateErr.message });
          continue;
        }
        userId = existingOld.id;
        // Update profile email too
        await supabaseAdmin.from("profiles").update({ email: user.email }).eq("user_id", userId);
        results.push({ email: user.email, status: "email updated from " + user.oldEmail, userId });
      } else if (existingNew) {
        userId = existingNew.id;
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
      await supabaseAdmin.from("profiles").update({ organization_id: orgId }).eq("user_id", userId);

      // Add all roles for master users
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
