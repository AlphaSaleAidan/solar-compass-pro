import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const demoEmail = "test001@alphasale.co";
    const demoPassword = "ASP26!";
    const demoName = "Test001";

    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === demoEmail);

    let userId: string;
    if (existing) {
      userId = existing.id;
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: demoEmail,
        password: demoPassword,
        email_confirm: true,
        user_metadata: { full_name: demoName, username: "Test001" },
      });
      if (authError) throw authError;
      userId = authData.user.id;
    }

    // Get or create org
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("name", "Alpha Sale Pro")
      .single();

    if (org) {
      await supabaseAdmin.from("profiles").update({ organization_id: org.id }).eq("user_id", userId);
    }

    // Add all roles (master user for demo)
    const roles = ["master", "sales_rep", "backend_ops", "installer", "financier"];
    for (const role of roles) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
    }

    return new Response(JSON.stringify({ success: true, userId, email: demoEmail }), {
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
