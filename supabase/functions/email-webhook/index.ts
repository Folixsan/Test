import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

// Decode Quoted-Printable encoding (UTF-8 aware)
function decodeQuotedPrintable(str: string): string {
  if (!str) return "";
  
  // Handle soft line breaks first
  const cleaned = str.replace(/=\r?\n/g, "");
  
  // Collect all bytes, decoding =XX sequences to raw bytes
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === "=" && i + 2 < cleaned.length) {
      const hex = cleaned.substring(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(cleaned.charCodeAt(i));
  }
  
  // Decode bytes as UTF-8
  return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
}

// Decode Base64 content (UTF-8 aware)
function decodeBase64(str: string): string {
  if (!str) return "";
  try {
    const cleaned = str.replace(/\r?\n/g, "");
    const binaryStr = atob(cleaned);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return str;
  }
}

// Recursively parse multipart content
function parseMultipartContent(content: string, parentBoundary?: string): { text: string; html: string } {
  let text = "";
  let html = "";

  // Check if this content has its own boundary (nested multipart)
  const boundaryMatch = content.match(/boundary=["']?([^"'\s;\n]+)["']?/i);
  
  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = content.split("--" + boundary);
    
    for (const part of parts) {
      const partNormalized = part.trim();
      if (!partNormalized || partNormalized === "--" || partNormalized.startsWith("--")) continue;
      
      // Check content type and transfer encoding of this part
      const contentTypeMatch = partNormalized.match(/Content-Type:\s*([^;\n]+)/i);
      const transferEncodingMatch = partNormalized.match(/Content-Transfer-Encoding:\s*(\S+)/i);
      const contentType = contentTypeMatch ? contentTypeMatch[1].trim().toLowerCase() : "";
      const transferEncoding = transferEncodingMatch ? transferEncodingMatch[1].trim().toLowerCase() : "";
      
      // Check if this part itself is multipart (nested)
      if (contentType.includes("multipart/")) {
        const nested = parseMultipartContent(partNormalized);
        if (nested.text && !text) text = nested.text;
        if (nested.html && !html) html = nested.html;
        continue;
      }
      
      // Find where headers end and content begins in this part
      const partSplit = partNormalized.split("\n\n");
      let partContent = partSplit.slice(1).join("\n\n").trim();
      
      // Remove trailing boundary marker
      partContent = partContent.replace(/--+$/, "").trim();
      
      // Decode content based on transfer encoding
      if (transferEncoding === "quoted-printable") {
        partContent = decodeQuotedPrintable(partContent);
      } else if (transferEncoding === "base64") {
        partContent = decodeBase64(partContent);
      }
      
      if (contentType.includes("text/plain") && !text) {
        text = partContent;
      } else if (contentType.includes("text/html") && !html) {
        html = partContent;
      }
    }
  }

  return { text, html };
}

// Parse raw email to extract clean body
function parseRawEmail(rawText: string): { bodyText: string; bodyHtml: string; fromName: string; fromAddress: string; subject: string } {
  let bodyText = "";
  let bodyHtml = "";
  let fromName = "";
  let fromAddress = "";
  let subject = "";

  // Normalize line endings
  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  
  // Split headers and body (double newline separates them)
  const headerBodySplit = normalized.split("\n\n");
  const headerSection = headerBodySplit[0] || "";
  const bodySection = headerBodySplit.slice(1).join("\n\n");

  // Extract From header
  const fromMatch = headerSection.match(/^From:\s*(.+)$/mi);
  if (fromMatch) {
    const fromValue = fromMatch[1].trim();
    // Check for "Name <email>" format
    const nameEmailMatch = fromValue.match(/^["']?(.+?)["']?\s*<(.+?)>$/);
    if (nameEmailMatch) {
      fromName = nameEmailMatch[1].trim();
      fromAddress = nameEmailMatch[2].trim();
    } else {
      fromAddress = fromValue;
    }
  }

  // Extract Subject header
  const subjectMatch = headerSection.match(/^Subject:\s*(.+)$/mi);
  if (subjectMatch) {
    subject = subjectMatch[1].trim();
  }

  // Check if multipart email
  const boundaryMatch = headerSection.match(/boundary=["']?([^"'\s;]+)["']?/i);
  
  if (boundaryMatch) {
    // Use recursive parser for nested multipart
    const parsed = parseMultipartContent(normalized);
    bodyText = parsed.text;
    bodyHtml = parsed.html;
  } else {
    // Simple non-multipart email - check for transfer encoding
    const transferEncodingMatch = headerSection.match(/Content-Transfer-Encoding:\s*(\S+)/i);
    const transferEncoding = transferEncodingMatch ? transferEncodingMatch[1].trim().toLowerCase() : "";
    
    let content = bodySection.trim();
    if (transferEncoding === "quoted-printable") {
      content = decodeQuotedPrintable(content);
    } else if (transferEncoding === "base64") {
      content = decodeBase64(content);
    }
    
    bodyText = content;
  }

  // If no parsed body found but we have raw body, use it
  if (!bodyText && !bodyHtml && bodySection) {
    bodyText = bodySection.trim();
  }

  return { bodyText, bodyHtml, fromName, fromAddress, subject };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse incoming email data - supports multiple formats:
    // 1. Cloudflare Worker format: { to, from, from_name, subject, body_text, body_html, attachments }
    // 2. Forward Email format: { to, from, subject, text, html, attachments }
    const emailData = await req.json();
    
    console.log("Received email data keys:", Object.keys(emailData));

    // Normalize data from different webhook sources
    let to = emailData.to;
    let from = emailData.from;
    let from_name = emailData.from_name || null;
    let subject = emailData.subject;
    let body_text = emailData.body_text || emailData.text || null;
    let body_html = emailData.body_html || emailData.html || null;
    let attachments = emailData.attachments || [];

    // Handle Forward Email's "to" format (can be array or object)
    if (Array.isArray(to)) {
      to = to[0]?.address || to[0] || "";
    } else if (typeof to === "object" && to !== null) {
      to = to.address || to.text || "";
    }

    // Handle Forward Email's "from" format (can be array or object with name/address)
    if (Array.isArray(from)) {
      const sender = from[0] || {};
      from_name = sender.name || null;
      from = sender.address || sender.text || "";
    } else if (typeof from === "object" && from !== null) {
      from_name = from.name || null;
      from = from.address || from.text || "";
    }

    console.log("Normalized - to:", to, "from:", from, "subject:", subject);

    if (!to || !from) {
      console.error("Missing required fields - to:", to, "from:", from);
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, from", received: Object.keys(emailData) }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if body_text contains raw email (headers) - if so, parse it
    if (body_text && (body_text.includes("Received:") || body_text.includes("DKIM-Signature:") || body_text.includes("Content-Type:"))) {
      console.log("Detected raw email format, parsing...");
      const parsed = parseRawEmail(body_text);
      
      // Use parsed values if available
      if (parsed.bodyText) body_text = parsed.bodyText;
      if (parsed.bodyHtml) body_html = parsed.bodyHtml;
      if (parsed.fromName && !from_name) from_name = parsed.fromName;
      if (parsed.fromAddress) from = parsed.fromAddress;
      if (parsed.subject && (!subject || subject === "(No Subject)")) subject = parsed.subject;
      
      console.log("Parsed result - text length:", body_text?.length, "html length:", body_html?.length);
    }

    // Also decode body_html if it still has Quoted-Printable artifacts
    if (body_html && (body_html.includes("=3D") || body_html.includes("=\n") || body_html.includes("=\r\n"))) {
      console.log("Decoding Quoted-Printable in HTML body...");
      body_html = decodeQuotedPrintable(body_html);
    }

    // Clean up any remaining encoding artifacts in body_text
    if (body_text && (body_text.includes("=3D") || body_text.includes("=\n"))) {
      body_text = decodeQuotedPrintable(body_text);
    }

    // Find the temp email in database
    const { data: tempEmail, error: findError } = await supabase
      .from("temp_emails")
      .select("id")
      .eq("email", to.toLowerCase())
      .maybeSingle();

    if (findError) {
      console.error("Error finding temp email:", findError);
      throw findError;
    }

    let finalTempEmailId = tempEmail?.id;

    // Extract message_id for idempotency (prevents duplicate emails)
    const message_id = emailData.messageId || emailData['message-id'] || emailData['Message-ID'] || null;

    // Check for duplicate if message_id exists
    if (message_id) {
      const { data: existingEmail } = await supabase
        .from("received_emails")
        .select("id")
        .eq("message_id", message_id)
        .maybeSingle();

      if (existingEmail) {
        console.log("Duplicate email detected, skipping:", message_id);
        return new Response(
          JSON.stringify({ success: true, duplicate: true, message_id }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    if (!tempEmail) {
      console.log("Temp email not found:", to);
      return new Response(
        JSON.stringify({ error: "Recipient email not found", email: to }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert the received email
    const { data: insertedEmail, error: insertError } = await supabase
      .from("received_emails")
      .insert({
        temp_email_id: tempEmail.id,
        from_address: from,
        from_name: from_name || null,
        subject: subject || "(No Subject)",
        body_text: body_text || null,
        body_html: body_html || null,
        attachments: attachments || [],
        message_id: message_id
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting email:", insertError);
      throw insertError;
    }

    // ── Fire webhooks ────────────────────────────────────────────
    try {
      const { data: webhooks } = await supabase
        .from("webhooks")
        .select("id, url, email_filter")
        .eq("is_active", true);

      if (webhooks && webhooks.length > 0) {
        const recipientEmail = to.toLowerCase();
        const matchingHooks = webhooks.filter((w: any) =>
          !w.email_filter || w.email_filter.toLowerCase() === recipientEmail
        );

        const payload = {
          event: "new_email",
          to: recipientEmail,
          from: from,
          from_name: from_name || null,
          subject: subject || "(No Subject)",
          body_text: (body_text || "").substring(0, 500),
          received_at: new Date().toISOString(),
        };

        await Promise.allSettled(
          matchingHooks.map((w: any) =>
            fetch(w.url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              signal: AbortSignal.timeout(5000),
            }).catch((err: any) => console.error(`Webhook ${w.id} failed:`, err.message))
          )
        );
        console.log(`Fired ${matchingHooks.length} webhook(s) for ${recipientEmail}`);
      }
    } catch (whErr: any) {
      console.error("Webhook dispatch error (non-fatal):", whErr.message);
    }

    console.log("Email saved successfully:", insertedEmail.id);

    return new Response(
      JSON.stringify({ success: true, email_id: insertedEmail.id }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
