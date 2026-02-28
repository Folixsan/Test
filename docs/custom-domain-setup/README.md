# Custom Domain Setup Guide

This guide explains how to add your own domain to TempMail using **Cloudflare Email Routing**.

## Prerequisites

- A domain you own (e.g., `yourdomain.com`)
- Domain must use Cloudflare DNS (free plan works)
- Access to Cloudflare dashboard

## Step 1: Add Domain to Cloudflare

If your domain isn't already on Cloudflare:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click "Add a Site"
3. Enter your domain and follow the setup wizard
4. Update nameservers at your registrar to Cloudflare's

## Step 2: Enable Email Routing

1. In Cloudflare Dashboard, select your domain
2. Go to **Email** → **Email Routing**
3. Click "Get started" if not already enabled
4. Cloudflare will automatically add required MX and TXT records

## Step 3: Create Catch-All Route

1. In Email Routing, go to **Routing rules**
2. Click "Create address" or "Catch-all address"
3. Select **"Send to a Worker"**
4. Choose or create a Worker that forwards to our webhook

## Step 4: Create Email Worker

Create a new Cloudflare Worker with this code:

```javascript
export default {
  async email(message, env, ctx) {
    const WEBHOOK_URL = "https://wliyxsdvtuocytsbtzjc.supabase.co/functions/v1/email-webhook";
    
    // Read email content
    const rawEmail = await new Response(message.raw).text();
    
    // Extract basic info
    const to = message.to;
    const from = message.from;
    const subject = message.headers.get("subject") || "(No Subject)";
    
    // Forward to webhook
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: to,
        from: from,
        subject: subject,
        rawEmail: rawEmail,
      }),
    });
    
    if (!response.ok) {
      console.error("Webhook failed:", await response.text());
    }
  }
}
```

## Step 5: Add Domain in TempMail App

1. Open TempMail app
2. Click "Custom Domain" in the sidebar
3. Enter your domain (e.g., `mail.yourdomain.com`)
4. Add the TXT verification record shown in Cloudflare DNS
5. Click "Verify" once the record propagates

## DNS Records Summary

Your Cloudflare DNS should have these records (auto-added by Email Routing):

| Type | Name | Content |
|------|------|---------|
| MX | @ | `route1.mx.cloudflare.net` (Priority 84) |
| MX | @ | `route2.mx.cloudflare.net` (Priority 5) |
| MX | @ | `route3.mx.cloudflare.net` (Priority 4) |
| TXT | @ | `v=spf1 include:_spf.mx.cloudflare.net ~all` |

For verification, you'll also add:

| Type | Name | Content |
|------|------|---------|
| TXT | @ | `tempmail-verify=<your-verification-code>` |

## Troubleshooting

### Emails not arriving?

1. **Check MX records**: Run `dig MX yourdomain.com +short`
2. **Check Worker logs**: Cloudflare Dashboard → Workers → Your Worker → Logs
3. **Verify catch-all**: Ensure the catch-all rule is active
4. **Check SPF**: Some senders reject domains without proper SPF

### Verification failing?

1. **DNS propagation**: Wait 5-10 minutes after adding TXT record
2. **Correct format**: Ensure TXT record value is exactly as shown
3. **No quotes**: Don't add extra quotes around the value

### Delayed emails?

Cloudflare Email Routing is generally instant. If delays occur:
- Check Worker execution logs for errors
- Verify webhook endpoint is responding quickly
- Large attachments may take longer to process

## Architecture Overview

```
Sender → Cloudflare MX → Email Routing → Worker → Webhook → Database → UI
```

1. **Sender** sends email to `anything@yourdomain.com`
2. **Cloudflare MX** receives the email
3. **Email Routing** catches all addresses
4. **Worker** processes and forwards to webhook
5. **Webhook** (Edge Function) saves to database
6. **UI** displays via realtime subscription

## Rate Limits

- Cloudflare Email Routing: 25 messages/day on free plan, unlimited on paid
- For higher volume, upgrade to Cloudflare Email Routing paid tier

## Security Notes

- Never expose your webhook URL publicly with write access
- The webhook validates recipient addresses against registered domains
- Emails are auto-deleted after 3 hours
