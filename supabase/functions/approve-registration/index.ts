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

    // Verify caller is a master user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !caller) throw new Error("Unauthorized");

    const { data: isMaster } = await supabaseAdmin.rpc("has_role", { _user_id: caller.id, _role: "master" });
    if (!isMaster) throw new Error("Only master users can approve registrations");

    const { requestId, password, organizationId } = await req.json();
    if (!requestId || !password) throw new Error("requestId and password are required");

    // Get the registration request
    const { data: request, error: reqErr } = await supabaseAdmin
      .from("registration_requests")
      .select("*")
      .eq("id", requestId)
      .single();
    if (reqErr || !request) throw new Error("Registration request not found");
    if (request.status !== "pending") throw new Error("Request already processed");

    // Create the auth user
    const { data: authData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: request.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: request.full_name },
    });
    if (createErr) throw createErr;

    const userId = authData.user.id;

    // Update profile with org if provided
    if (organizationId) {
      await supabaseAdmin.from("profiles").update({ 
        organization_id: organizationId,
        phone: request.phone,
      }).eq("user_id", userId);
    } else {
      await supabaseAdmin.from("profiles").update({ 
        phone: request.phone,
      }).eq("user_id", userId);
    }

    // Assign the requested role
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: request.requested_role });

    // Update registration request status
    await supabaseAdmin.from("registration_requests").update({
      status: "approved",
      reviewed_by: caller.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", requestId);

    return new Response(JSON.stringify({ success: true, userId, email: request.email }), {
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
