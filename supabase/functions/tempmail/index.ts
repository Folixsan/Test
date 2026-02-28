import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fallback domains from env (used only when domains table is empty)
const MAIL_DOMAINS_ENV = (Deno.env.get("MAIL_DOMAINS") || "")
  .split(",").map(d => d.trim()).filter(Boolean);

// ── Helpers ──────────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyAdmin(supabase: any, token: string) {
  if (!token) return null;
  const { data } = await supabase
    .from("admin_users")
    .select("id, username, session_token, is_owner, created_at")
    .eq("session_token", token)
    .maybeSingle();
  return data;
}

async function getAvailableDomains(supabase: any): Promise<string[]> {
  const { data } = await supabase
    .from("domains")
    .select("domain")
    .order("created_at", { ascending: true });
  const dbDomains = (data || []).map((d: any) => d.domain);
  return dbDomains.length > 0 ? dbDomains : MAIL_DOMAINS_ENV;
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ── Random email generation ──────────────────────────────────────

const firstNames = [
  "adi", "budi", "citra", "dewi", "eka", "fajar", "gilang", "hana",
  "irfan", "joko", "kiki", "lina", "made", "nina", "oka", "putu",
  "alex", "brian", "chris", "david", "emma", "frank", "george", "henry",
  "jack", "kate", "luke", "mike", "nick", "olivia", "peter", "ryan",
  "anna", "felix", "hans", "ingrid", "klaus", "lars", "maria", "nicolas",
  "olga", "pierre", "rosa", "stefan", "theo", "viktor", "elena", "marco",
  "akira", "haruto", "hinata", "kaito", "kenji", "mei", "naomi", "ren",
  "riku", "sakura", "sora", "takeshi", "yuki", "yuto", "aoi",
  "jimin", "jisoo", "minho", "seojun", "siwoo", "eunji", "haeun", "jiwoo",
  "chen", "fang", "hui", "jing", "lei", "lin", "ming", "peng", "wei", "xiao"
];

const generateRandomEmail = (domain: string) => {
  const name = firstNames[Math.floor(Math.random() * firstNames.length)];
  const chars = Math.random().toString(36).substring(2, 6);
  const num = Math.floor(Math.random() * 999);
  return `${name}${chars}${num}@${domain}`;
};

const generateSessionToken = () =>
  Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

// ── Main handler ─────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── API Index (GET or no body) ─────────────────────────────
    if (req.method === "GET") {
      const domains = await getAvailableDomains(supabase);
      const { count: emailCount } = await supabase
        .from("temp_emails").select("id", { count: "exact", head: true });
      const { count: messageCount } = await supabase
        .from("received_emails").select("id", { count: "exact", head: true });

      return json({
        status: true,
        service: "TempMail API",
        version: "1.0",
        endpoints: {
          create: { method: "POST", description: "Buat email sementara baru", body: { action: "create" } },
          add_email: { method: "POST", description: "Tambah email ke session", body: { action: "add_email", session_token: "xxx" } },
          domains: { method: "POST", description: "List domain tersedia", body: { action: "domains" } },
          get: { method: "POST", description: "Ambil email by session token", body: { action: "get", session_token: "xxx" } },
          inbox: { method: "POST", description: "Ambil pesan masuk", body: { action: "inbox", email: "xxx@domain.com" } },
          delete: { method: "POST", description: "Hapus email & pesan", body: { action: "delete", session_token: "xxx" } },
        },
        stats: {
          active_emails: emailCount || 0,
          total_messages: messageCount || 0,
          domains: domains,
        },
        updatedAt: new Date().toISOString(),
      });
    }

    const body = await req.json();
    const {
      action, session_token, email, domain, username, password,
      admin_token, email_id,
    } = body;

    // ═══════════════════════════════════════════════════════════
    // PUBLIC ACTIONS (no auth)
    // ═══════════════════════════════════════════════════════════

    // ── Create temp email ─────────────────────────────────────
    if (action === "create") {
      const domains = await getAvailableDomains(supabase);
      if (domains.length === 0) return json({ error: "No domains configured" }, 400);

      const selectedDomain = domain && domains.includes(domain) ? domain : domains[0];
      const newEmail = generateRandomEmail(selectedDomain);
      const newToken = generateSessionToken();

      const { data, error } = await supabase
        .from("temp_emails")
        .insert({ email: newEmail, session_token: newToken })
        .select()
        .single();
      if (error) throw error;

      return json({ id: data.id, email: data.email, session_token: data.session_token });
    }

    // ── Add email to existing session ─────────────────────────
    if (action === "add_email" && session_token) {
      const domains = await getAvailableDomains(supabase);
      if (domains.length === 0) return json({ error: "No domains configured" }, 400);

      const selectedDomain = domain && domains.includes(domain) ? domain : domains[0];
      let newEmail: string;

      if (username) {
        newEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@${selectedDomain}`;
      } else {
        newEmail = generateRandomEmail(selectedDomain);
      }

      const { data: existing } = await supabase
        .from("temp_emails").select("id").eq("email", newEmail).maybeSingle();
      if (existing) return json({ error: "Email already exists" }, 400);

      const { data, error } = await supabase
        .from("temp_emails")
        .insert({ email: newEmail, session_token })
        .select()
        .single();
      if (error) throw error;

      return json({ id: data.id, email: data.email });
    }

    // ── List available domains ─────────────────────────────────
    if (action === "domains") {
      const domains = await getAvailableDomains(supabase);
      return json({ domains });
    }

    // ── Get email by session token ────────────────────────────
    if (action === "get" && session_token) {
      const { data, error } = await supabase
        .from("temp_emails")
        .select("email, session_token")
        .eq("session_token", session_token)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "Email not found" }, 404);
      return json({ email: data.email, session_token: data.session_token });
    }

    // ── Inbox messages ────────────────────────────────────────
    if (action === "inbox" && (email || session_token)) {
      const tempEmailsMap: Map<string, string> = new Map();

      if (session_token) {
        const { data: tempEmails } = await supabase
          .from("temp_emails").select("id, email").eq("session_token", session_token);
        tempEmails?.forEach((t: any) => tempEmailsMap.set(t.id, t.email));
      } else if (email) {
        const { data: tempEmail } = await supabase
          .from("temp_emails").select("id, email").eq("email", email).maybeSingle();
        if (tempEmail) tempEmailsMap.set(tempEmail.id, tempEmail.email);
      }

      if (tempEmailsMap.size === 0) return json({ messages: [] });

      const { data: messages, error } = await supabase
        .from("received_emails")
        .select("*")
        .in("temp_email_id", Array.from(tempEmailsMap.keys()))
        .order("received_at", { ascending: false });
      if (error) throw error;

      const result = (messages || []).map((msg: any) => ({
        ...msg,
        recipient_email: tempEmailsMap.get(msg.temp_email_id) || "",
      }));

      return json({ messages: result });
    }

    // ── Delete session emails ─────────────────────────────────
    if (action === "delete" && session_token) {
      // Block deletion of admin-created emails from the public page
      const { data: adminProtected } = await supabase
        .from("temp_emails")
        .select("id")
        .eq("session_token", session_token)
        .not("admin_id", "is", null)
        .limit(1)
        .maybeSingle();

      if (adminProtected) {
        return json({ error: "This session is admin-protected. Use the admin panel to delete." }, 403);
      }

      const { data: existing } = await supabase
        .from("temp_emails").select("id").eq("session_token", session_token).limit(1).maybeSingle();
      if (!existing) return json({ error: "Email not found" }, 404);

      const { error } = await supabase
        .from("temp_emails").delete().eq("session_token", session_token);
      if (error) throw error;
      return json({ success: true });
    }

    // ═══════════════════════════════════════════════════════════
    // ADMIN BOOTSTRAP
    // ═══════════════════════════════════════════════════════════

    // ── Check if any admin exists (for setup flow) ────────────
    if (action === "admin_check") {
      const { count } = await supabase
        .from("admin_users").select("id", { count: "exact", head: true });
      return json({ has_admin: (count || 0) > 0 });
    }

    // ── First-time admin setup (only if no admin exists) ──────
    if (action === "admin_setup") {
      const { count } = await supabase
        .from("admin_users").select("id", { count: "exact", head: true });
      if ((count || 0) > 0) return json({ error: "Admin already exists. Use login." }, 400);

      if (!username || !password) return json({ error: "Username and password required" }, 400);
      if (password.length < 4) return json({ error: "Password too short (min 4 chars)" }, 400);

      const hash = await hashPassword(password);
      const token = generateSessionToken();

      const { data, error } = await supabase
        .from("admin_users")
        .insert({ username, password_hash: hash, session_token: token, is_owner: true })
        .select("id, username, session_token, is_owner, created_at")
        .single();
      if (error) throw error;

      return json({ admin: data });
    }

    // ── Admin login ───────────────────────────────────────────
    if (action === "admin_login") {
      if (!username || !password) return json({ error: "Username and password required" }, 400);

      const hash = await hashPassword(password);
      const { data } = await supabase
        .from("admin_users")
        .select("id, username, session_token, is_owner, created_at")
        .eq("username", username)
        .eq("password_hash", hash)
        .maybeSingle();

      if (!data) return json({ error: "Invalid credentials" }, 401);
      return json({ admin: data });
    }

    // ═══════════════════════════════════════════════════════════
    // ADMIN-AUTHENTICATED ACTIONS (require admin_token)
    // ═══════════════════════════════════════════════════════════

    if (action?.startsWith("admin_")) {
      const admin = await verifyAdmin(supabase, admin_token);
      if (!admin) return json({ error: "Unauthorized" }, 401);

      // ── List all emails ─────────────────────────────────────
      if (action === "admin_list") {
        const { data, error } = await supabase
          .from("temp_emails")
          .select("id, email, session_token, created_at, admin_id, received_emails(count)")
          .order("created_at", { ascending: false });
        if (error) throw error;

        const emails = (data || []).map((e: any) => ({
          id: e.id,
          email: e.email,
          session_token: e.session_token,
          created_at: e.created_at,
          is_admin_created: !!e.admin_id,
          admin_id: e.admin_id,
          message_count: e.received_emails?.[0]?.count || 0,
        }));

        return json({ emails, total: emails.length });
      }

      // ── Create protected email ──────────────────────────────
      if (action === "admin_create") {
        const domains = await getAvailableDomains(supabase);
        if (domains.length === 0) return json({ error: "No domains configured. Add a domain first." }, 400);

        const selectedDomain = domain && domains.includes(domain) ? domain : domains[0];
        let newEmail: string;

        const emailUsername = body.email_username?.trim();
        if (emailUsername) {
          newEmail = `${emailUsername.toLowerCase().replace(/[^a-z0-9]/g, "")}@${selectedDomain}`;
        } else {
          newEmail = generateRandomEmail(selectedDomain);
        }

        const { data: existing } = await supabase
          .from("temp_emails").select("id").eq("email", newEmail).maybeSingle();
        if (existing) return json({ error: "Email already exists" }, 400);

        // Use admin's session_token → all admin emails grouped under same token
        const { data, error } = await supabase
          .from("temp_emails")
          .insert({ email: newEmail, session_token: admin.session_token, admin_id: admin.id })
          .select()
          .single();
        if (error) throw error;

        return json({
          id: data.id, email: data.email,
          session_token: data.session_token, is_admin_created: true,
        });
      }

      // ── Delete email ────────────────────────────────────────
      if (action === "admin_delete" && email_id) {
        const { error } = await supabase
          .from("temp_emails").delete().eq("id", email_id);
        if (error) throw error;
        return json({ success: true });
      }

      // ── List domains ────────────────────────────────────────
      if (action === "admin_domains_list") {
        const { data, error } = await supabase
          .from("domains")
          .select("id, domain, created_at, added_by")
          .order("created_at", { ascending: true });
        if (error) throw error;
        return json({ domains: data || [] });
      }

      // ── Add domain ──────────────────────────────────────────
      if (action === "admin_domains_add") {
        const newDomain = body.domain_name?.toLowerCase().trim();
        if (!newDomain) return json({ error: "Domain name required" }, 400);
        if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(newDomain)) {
          return json({ error: "Invalid domain format" }, 400);
        }

        const { data, error } = await supabase
          .from("domains")
          .insert({ domain: newDomain, added_by: admin.id })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") return json({ error: "Domain already exists" }, 400);
          throw error;
        }
        return json({ domain: data });
      }

      // ── Remove domain ───────────────────────────────────────
      if (action === "admin_domains_remove") {
        const domainId = body.domain_id;
        if (!domainId) return json({ error: "Domain ID required" }, 400);

        const { error } = await supabase.from("domains").delete().eq("id", domainId);
        if (error) throw error;
        return json({ success: true });
      }

      // ── List admin users ────────────────────────────────────
      if (action === "admin_users_list") {
        const { data, error } = await supabase
          .from("admin_users")
          .select("id, username, is_owner, created_at")
          .order("created_at", { ascending: true });
        if (error) throw error;
        return json({ admins: data || [] });
      }

      // ── Add admin user (owner only) ─────────────────────────
      if (action === "admin_users_add") {
        if (!admin.is_owner) return json({ error: "Only owner can manage admins" }, 403);

        const newUsername = body.new_username?.trim();
        const newPassword = body.new_password;
        if (!newUsername || !newPassword) return json({ error: "Username and password required" }, 400);
        if (newPassword.length < 4) return json({ error: "Password too short (min 4 chars)" }, 400);

        const hash = await hashPassword(newPassword);
        const token = generateSessionToken();

        const { data, error } = await supabase
          .from("admin_users")
          .insert({ username: newUsername, password_hash: hash, session_token: token, is_owner: false })
          .select("id, username, is_owner, created_at")
          .single();

        if (error) {
          if (error.code === "23505") return json({ error: "Username already exists" }, 400);
          throw error;
        }
        return json({ admin: data });
      }

      // ── Delete admin user (owner only) ──────────────────────
      if (action === "admin_users_delete") {
        if (!admin.is_owner) return json({ error: "Only owner can manage admins" }, 403);

        const targetId = body.target_admin_id;
        if (!targetId) return json({ error: "Admin ID required" }, 400);
        if (targetId === admin.id) return json({ error: "Cannot delete yourself" }, 400);

        // Check if target is owner
        const { data: target } = await supabase
          .from("admin_users").select("is_owner").eq("id", targetId).maybeSingle();
        if (target?.is_owner) return json({ error: "Cannot delete another owner" }, 400);

        const { error } = await supabase
          .from("admin_users").delete().eq("id", targetId);
        if (error) throw error;
        return json({ success: true });
      }

      // ── List webhooks ────────────────────────────────────────
      if (action === "admin_webhooks_list") {
        const { data, error } = await supabase
          .from("webhooks")
          .select("id, url, label, email_filter, is_active, created_at, added_by")
          .order("created_at", { ascending: true });
        if (error) throw error;
        return json({ webhooks: data || [] });
      }

      // ── Add webhook ─────────────────────────────────────────
      if (action === "admin_webhooks_add") {
        const webhookUrl = body.webhook_url?.trim();
        if (!webhookUrl) return json({ error: "Webhook URL required" }, 400);
        try { new URL(webhookUrl); } catch { return json({ error: "Invalid URL format" }, 400); }

        const { data, error } = await supabase
          .from("webhooks")
          .insert({
            url: webhookUrl,
            label: body.webhook_label?.trim() || "",
            email_filter: body.email_filter?.trim() || null,
            added_by: admin.id,
          })
          .select()
          .single();
        if (error) throw error;
        return json({ webhook: data });
      }

      // ── Toggle webhook active/inactive ──────────────────────
      if (action === "admin_webhooks_toggle") {
        const webhookId = body.webhook_id;
        if (!webhookId) return json({ error: "Webhook ID required" }, 400);

        const { data: current } = await supabase
          .from("webhooks").select("is_active").eq("id", webhookId).maybeSingle();
        if (!current) return json({ error: "Webhook not found" }, 404);

        const { error } = await supabase
          .from("webhooks").update({ is_active: !current.is_active }).eq("id", webhookId);
        if (error) throw error;
        return json({ success: true, is_active: !current.is_active });
      }

      // ── Delete webhook ──────────────────────────────────────
      if (action === "admin_webhooks_delete") {
        const webhookId = body.webhook_id;
        if (!webhookId) return json({ error: "Webhook ID required" }, 400);

        const { error } = await supabase.from("webhooks").delete().eq("id", webhookId);
        if (error) throw error;
        return json({ success: true });
      }
    }

    return json({ error: "Invalid action" }, 400);

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
