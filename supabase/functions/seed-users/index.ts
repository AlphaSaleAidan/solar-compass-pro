import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const SEED_USERS = [
    {
      email: "apierce@alphasale.co",
      password: "ASP-Admin-2026!",
      full_name: "Aidan Pierce",
      role: "master" as const,
      platform_access: ["sales_rep", "backend_ops", "installer", "financier"],
      tier: "asp_plus",
    },
    {
      email: "mpierce@alphasale.co",
      password: "ASP-Admin-2026!",
      full_name: "M. Pierce",
      role: "master" as const,
      platform_access: ["sales_rep", "backend_ops", "installer", "financier"],
      tier: "asp_plus",
    },
    {
      email: "echeung@alphasale.co",
      password: "ASP26!Temp",
      full_name: "E. Cheung",
      role: "sales_rep" as const,
      platform_access: ["sales_rep"],
      tier: "asp",
    },
  ];

  const results: any[] = [];

  for (const seedUser of SEED_USERS) {
    // Create auth user (auto-confirms email)
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: seedUser.email,
      password: seedUser.password,
      email_confirm: true,
      user_metadata: { full_name: seedUser.full_name },
    });

    if (authErr) {
      if (authErr.message?.includes("already been registered")) {
        results.push({ email: seedUser.email, status: "already_exists" });
        // Still ensure role exists
        const { data: existingUsers } = await admin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find((u: any) => u.email === seedUser.email);
        if (existingUser) {
          await admin.from("user_roles").upsert(
            { user_id: existingUser.id, role: seedUser.role },
            { onConflict: "user_id,role" }
          );
          await admin.from("profiles").update({
            platform_access: seedUser.platform_access,
            tier: seedUser.tier,
          }).eq("user_id", existingUser.id);
        }
        continue;
      }
      results.push({ email: seedUser.email, status: "error", error: authErr.message });
      continue;
    }

    const userId = authData.user!.id;

    // Update profile with platform_access and tier
    await admin.from("profiles").update({
      platform_access: seedUser.platform_access,
      tier: seedUser.tier,
    }).eq("user_id", userId);

    // Set role
    await admin.from("user_roles").insert({
      user_id: userId,
      role: seedUser.role,
    });

    results.push({ email: seedUser.email, status: "created", userId });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
