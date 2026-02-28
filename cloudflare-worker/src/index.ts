import PostalMime from "postal-mime";

export interface Env {
  WEBHOOK_URL: string;
  WEBHOOK_SECRET?: string;
  SUPABASE_ANON_KEY: string;
}

export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Incoming email from ${message.from} to ${message.to}`);

    if (!env.WEBHOOK_URL) {
      console.error("WEBHOOK_URL is not configured");
      message.setReject("Temporary server error");
      return;
    }

    try {
      // Parse the raw MIME email
      const rawEmail = await new Response(message.raw).arrayBuffer();
      const parsed = await PostalMime.parse(rawEmail);

      // Build webhook payload matching the email-webhook Edge Function format
      const payload = {
        to: message.to,
        from: parsed.from?.address || message.from,
        from_name: parsed.from?.name || null,
        subject: parsed.subject || "(No Subject)",
        body_text: parsed.text || null,
        body_html: parsed.html || null,
        messageId: parsed.messageId || message.headers.get("message-id") || null,
        attachments: (parsed.attachments || []).map((att) => ({
          filename: att.filename || "attachment",
          mimeType: att.mimeType,
          size: att.content?.byteLength || 0,
        })),
      };

      // POST to Supabase Edge Function
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`,
      };

      if (env.WEBHOOK_SECRET) {
        headers["x-webhook-secret"] = env.WEBHOOK_SECRET;
      }

      const response = await fetch(env.WEBHOOK_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Webhook failed (${response.status}):`, errorBody);

        // Retry once on server errors (5xx)
        if (response.status >= 500) {
          console.log("Retrying webhook...");
          const retryResponse = await fetch(env.WEBHOOK_URL, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });

          if (!retryResponse.ok) {
            console.error(`Retry failed (${retryResponse.status}):`, await retryResponse.text());
          } else {
            console.log("Retry succeeded");
          }
        }
      } else {
        const result = await response.json();
        console.log("Email forwarded successfully:", result);
      }
    } catch (error) {
      console.error("Error processing email:", error);
      // Don't reject — email is already accepted by Cloudflare at this point
      // Rejecting here would cause a bounce, which is worse than a silent failure
    }
  },
};
