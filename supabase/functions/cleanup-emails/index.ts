import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    // Get admin-created email IDs (protected from deletion)
    const { data: protectedEmails } = await supabase
      .from("temp_emails")
      .select("id")
      .not("admin_id", "is", null);

    const protectedEmailIds = protectedEmails?.map(e => e.id) || [];

    // Delete old received emails (messages older than 3 hours), excluding admin-created ones
    let query = supabase
      .from("received_emails")
      .delete()
      .lt("received_at", threeHoursAgo);

    if (protectedEmailIds.length > 0) {
      query = query.not("temp_email_id", "in", `(${protectedEmailIds.join(",")})`);
    }

    const { data: deletedEmails, error: emailError } = await query.select("id");

    if (emailError) {
      console.error("Error deleting old emails:", emailError);
      throw emailError;
    }

    const result = {
      deleted_messages: deletedEmails?.length || 0,
      protected_addresses: protectedEmailIds.length,
      cleaned_at: new Date().toISOString()
    };

    console.log("Cleanup completed:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Cleanup error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
