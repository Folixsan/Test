import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, Code, Mail, MailPlus, Globe, Inbox, Trash2, Key, Bell, BellPlus, BellOff, BellMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";

const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80"
          onClick={copyCode}
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <div className="bg-muted rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-muted/50 border-b border-border text-xs text-muted-foreground">
          {language}
        </div>
        <pre className="p-4 overflow-x-auto text-sm">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

const ApiDocs = () => {
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tempmail`;
  const reduceMotion = useReducedMotion();
  const headerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.12,
      },
    },
  };
  const headerItemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : -12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.5,
        ease: "easeOut" as const,
      },
    },
  };
  const fadeUpVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.6,
        ease: "easeOut" as const,
      },
    },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.5,
        ease: "easeOut" as const,
      },
    },
  };
  const listVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08,
        delayChildren: reduceMotion ? 0 : 0.1,
      },
    },
  };

  const endpoints = [
    {
      id: "create",
      method: "POST",
      title: "Create Email",
      description: "Buat alamat email sementara baru dengan session token unik.",
      icon: Mail,
      request: {
        action: "create"
      },
      response: {
        id: "uuid-xxx",
        email: "akira7x2f123@yourdomain.com",
        session_token: "k8j2m9x4p1q7..."
      },
      curl: `curl -X POST ${baseUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ANON_KEY" \\
  -d '{"action": "create"}'`,
      javascript: `const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY"
  },
  body: JSON.stringify({ action: "create" })
});

const { id, email, session_token } = await response.json();
console.log("Email:", email);
console.log("Token:", session_token);`,
      python: `import requests

response = requests.post(
    "${baseUrl}",
    headers={"Authorization": "Bearer YOUR_ANON_KEY"},
    json={"action": "create"}
)

data = response.json()
print(f"Email: {data['email']}")
print(f"Token: {data['session_token']}")`
    },
    {
      id: "add_email",
      method: "POST",
      title: "Add Email",
      description: "Tambah alamat email baru ke session yang sudah ada. Bisa random atau custom username.",
      icon: MailPlus,
      request: {
        action: "add_email",
        session_token: "your_session_token",
        username: "myname",
        domain: "yourdomain.com"
      },
      response: {
        id: "uuid-xxx",
        email: "myname@yourdomain.com"
      },
      curl: `curl -X POST ${baseUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ANON_KEY" \\
  -d '{"action": "add_email", "session_token": "your_session_token", "username": "myname", "domain": "yourdomain.com"}'
  # username dan domain opsional — tanpa keduanya akan generate random`,
      javascript: `const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY"
  },
  body: JSON.stringify({
    action: "add_email",
    session_token: "your_session_token",
    username: "myname",  // opsional
    domain: "yourdomain.com"  // opsional
  })
});

const { id, email } = await response.json();
console.log("New email:", email);`,
      python: `import requests

response = requests.post(
    "${baseUrl}",
    headers={"Authorization": "Bearer YOUR_ANON_KEY"},
    json={
        "action": "add_email",
        "session_token": "your_session_token",
        "username": "myname",  # opsional
        "domain": "yourdomain.com"  # opsional
    }
)

data = response.json()
print(f"New email: {data['email']}")`
    },
    {
      id: "domains",
      method: "POST",
      title: "List Domains",
      description: "Lihat semua domain email yang tersedia.",
      icon: Globe,
      request: {
        action: "domains"
      },
      response: {
        domains: ["yourdomain.com", "mail.yourdomain.com"]
      },
      curl: `curl -X POST ${baseUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ANON_KEY" \\
  -d '{"action": "domains"}'`,
      javascript: `const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY"
  },
  body: JSON.stringify({ action: "domains" })
});

const { domains } = await response.json();
console.log("Available domains:", domains);`,
      python: `import requests

response = requests.post(
    "${baseUrl}",
    headers={"Authorization": "Bearer YOUR_ANON_KEY"},
    json={"action": "domains"}
)

domains = response.json()["domains"]
print(f"Available domains: {domains}")`
    },
    {
      id: "get",
      method: "POST",
      title: "Get Email",
      description: "Ambil alamat email yang sudah ada menggunakan session token.",
      icon: Key,
      request: {
        action: "get",
        session_token: "your_session_token"
      },
      response: {
        email: "akira7x2f123@yourdomain.com",
        session_token: "k8j2m9x4p1q7..."
      },
      curl: `curl -X POST ${baseUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ANON_KEY" \\
  -d '{"action": "get", "session_token": "your_session_token"}'`,
      javascript: `const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY"
  },
  body: JSON.stringify({
    action: "get",
    session_token: "your_session_token"
  })
});

const { email, session_token } = await response.json();`,
      python: `import requests

response = requests.post(
    "${baseUrl}",
    headers={"Authorization": "Bearer YOUR_ANON_KEY"},
    json={
        "action": "get",
        "session_token": "your_session_token"
    }
)

data = response.json()`
    },
    {
      id: "inbox",
      method: "POST",
      title: "Get Inbox",
      description: "Ambil semua pesan masuk. Bisa pakai email atau session_token (semua email dalam session).",
      icon: Inbox,
      request: {
        action: "inbox",
        email: "akira7x2f123@yourdomain.com"
      },
      response: {
        messages: [
          {
            id: "uuid",
            from_name: "GitHub",
            from_address: "noreply@github.com",
            subject: "Verify your email",
            body_text: "Click here to verify...",
            body_html: "<html>...</html>",
            received_at: "2024-01-15T10:30:00Z",
            recipient_email: "akira7x2f123@yourdomain.com",
            attachments: []
          }
        ]
      },
      curl: `curl -X POST ${baseUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ANON_KEY" \\
  -d '{"action": "inbox", "email": "your_email@yourdomain.com"}'
  # atau pakai session_token untuk semua email dalam session:
  # -d '{"action": "inbox", "session_token": "your_session_token"}'`,
      javascript: `const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY"
  },
  body: JSON.stringify({
    action: "inbox",
    email: "your_email@yourdomain.com"
    // atau: session_token: "your_session_token" (untuk semua email dalam session)
  })
});

const { messages } = await response.json();
messages.forEach(msg => {
  console.log(\`From: \${msg.from_address}\`);
  console.log(\`Subject: \${msg.subject}\`);
});`,
      python: `import requests

response = requests.post(
    "${baseUrl}",
    headers={"Authorization": "Bearer YOUR_ANON_KEY"},
    json={
        "action": "inbox",
        "email": "your_email@yourdomain.com"
        # atau: "session_token": "your_session_token" (untuk semua email dalam session)
    }
)

messages = response.json()["messages"]
for msg in messages:
    print(f"From: {msg['from_address']}")
    print(f"Subject: {msg['subject']}")`
    },
    {
      id: "delete",
      method: "POST",
      title: "Delete Email",
      description: "Hapus semua email dan pesan dalam satu session. Email yang dibuat admin tidak bisa dihapus dari sini.",
      icon: Trash2,
      request: {
        action: "delete",
        session_token: "your_session_token"
      },
      response: {
        success: true
      },
      curl: `curl -X POST ${baseUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ANON_KEY" \\
  -d '{"action": "delete", "session_token": "your_session_token"}'`,
      javascript: `const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY"
  },
  body: JSON.stringify({
    action: "delete",
    session_token: "your_session_token"
  })
});

const { success } = await response.json();
if (success) {
  console.log("Email deleted successfully");
}`,
      python: `import requests

response = requests.post(
    "${baseUrl}",
    headers={"Authorization": "Bearer YOUR_ANON_KEY"},
    json={
        "action": "delete",
        "session_token": "your_session_token"
    }
)

if response.json().get("success"):
    print("Email deleted successfully")`
    },
    {
      id: "webhooks_list",
      method: "POST",
      title: "List Webhooks",
      description: "Lihat semua webhook yang terdaftar. Butuh admin session token.",
      icon: Bell,
      request: {
        action: "admin_webhooks_list",
        admin_token: "your_admin_session_token"
      },
      response: {
        webhooks: [
          {
            id: "uuid",
            url: "https://your-webhook.com/endpoint",
            label: "Telegram Bot",
            email_filter: "admin@yourdomain.com",
            is_active: true,
            created_at: "2024-01-15T10:30:00Z"
          }
        ]
      },
      curl: `curl -X POST ${baseUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ANON_KEY" \\
  -d '{"action": "admin_webhooks_list", "admin_token": "your_admin_session_token"}'`,
      javascript: `const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY"
  },
  body: JSON.stringify({
    action: "admin_webhooks_list",
    admin_token: "your_admin_session_token"
  })
});

const { webhooks } = await response.json();
webhooks.forEach(wh => {
  console.log(\`\${wh.label}: \${wh.url} (\${wh.is_active ? "active" : "inactive"})\`);
});`,
      python: `import requests

response = requests.post(
    "${baseUrl}",
    headers={"Authorization": "Bearer YOUR_ANON_KEY"},
    json={
        "action": "admin_webhooks_list",
        "admin_token": "your_admin_session_token"
    }
)

for wh in response.json()["webhooks"]:
    status = "active" if wh["is_active"] else "inactive"
    print(f"{wh['label']}: {wh['url']} ({status})")`
    },
    {
      id: "webhooks_add",
      method: "POST",
      title: "Add Webhook",
      description: "Tambah webhook URL baru. Setiap email masuk akan di-POST ke URL ini.",
      icon: BellPlus,
      request: {
        action: "admin_webhooks_add",
        admin_token: "your_admin_session_token",
        url: "https://your-webhook.com/endpoint",
        label: "Telegram Bot",
        email_filter: "admin@yourdomain.com"
      },
      response: {
        id: "uuid",
        url: "https://your-webhook.com/endpoint",
        label: "Telegram Bot",
        email_filter: "admin@yourdomain.com",
        is_active: true
      },
      curl: `curl -X POST ${baseUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ANON_KEY" \\
  -d '{"action": "admin_webhooks_add", "admin_token": "your_admin_session_token", "url": "https://your-webhook.com/endpoint", "label": "Telegram Bot", "email_filter": "admin@yourdomain.com"}'
  # label dan email_filter opsional`,
      javascript: `const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY"
  },
  body: JSON.stringify({
    action: "admin_webhooks_add",
    admin_token: "your_admin_session_token",
    url: "https://your-webhook.com/endpoint",
    label: "Telegram Bot",  // opsional
    email_filter: "admin@yourdomain.com"  // opsional, kosong = semua email
  })
});

const webhook = await response.json();
console.log("Webhook added:", webhook.id);`,
      python: `import requests

response = requests.post(
    "${baseUrl}",
    headers={"Authorization": "Bearer YOUR_ANON_KEY"},
    json={
        "action": "admin_webhooks_add",
        "admin_token": "your_admin_session_token",
        "url": "https://your-webhook.com/endpoint",
        "label": "Telegram Bot",  # opsional
        "email_filter": "admin@yourdomain.com"  # opsional
    }
)

webhook = response.json()
print(f"Webhook added: {webhook['id']}")`
    },
    {
      id: "webhooks_toggle",
      method: "POST",
      title: "Toggle Webhook",
      description: "Aktifkan atau nonaktifkan webhook tanpa menghapusnya.",
      icon: BellOff,
      request: {
        action: "admin_webhooks_toggle",
        admin_token: "your_admin_session_token",
        webhook_id: "webhook-uuid"
      },
      response: {
        id: "uuid",
        is_active: false
      },
      curl: `curl -X POST ${baseUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ANON_KEY" \\
  -d '{"action": "admin_webhooks_toggle", "admin_token": "your_admin_session_token", "webhook_id": "webhook-uuid"}'`,
      javascript: `const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY"
  },
  body: JSON.stringify({
    action: "admin_webhooks_toggle",
    admin_token: "your_admin_session_token",
    webhook_id: "webhook-uuid"
  })
});

const { is_active } = await response.json();
console.log("Webhook is now:", is_active ? "active" : "inactive");`,
      python: `import requests

response = requests.post(
    "${baseUrl}",
    headers={"Authorization": "Bearer YOUR_ANON_KEY"},
    json={
        "action": "admin_webhooks_toggle",
        "admin_token": "your_admin_session_token",
        "webhook_id": "webhook-uuid"
    }
)

data = response.json()
status = "active" if data["is_active"] else "inactive"
print(f"Webhook is now: {status}")`
    },
    {
      id: "webhooks_delete",
      method: "POST",
      title: "Delete Webhook",
      description: "Hapus webhook secara permanen.",
      icon: BellMinus,
      request: {
        action: "admin_webhooks_delete",
        admin_token: "your_admin_session_token",
        webhook_id: "webhook-uuid"
      },
      response: {
        success: true
      },
      curl: `curl -X POST ${baseUrl} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ANON_KEY" \\
  -d '{"action": "admin_webhooks_delete", "admin_token": "your_admin_session_token", "webhook_id": "webhook-uuid"}'`,
      javascript: `const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ANON_KEY"
  },
  body: JSON.stringify({
    action: "admin_webhooks_delete",
    admin_token: "your_admin_session_token",
    webhook_id: "webhook-uuid"
  })
});

const { success } = await response.json();
if (success) console.log("Webhook deleted");`,
      python: `import requests

response = requests.post(
    "${baseUrl}",
    headers={"Authorization": "Bearer YOUR_ANON_KEY"},
    json={
        "action": "admin_webhooks_delete",
        "admin_token": "your_admin_session_token",
        "webhook_id": "webhook-uuid"
    }
)

if response.json().get("success"):
    print("Webhook deleted")`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div variants={headerItemVariants}>
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
            </motion.div>
            <motion.div variants={headerItemVariants}>
              <Badge variant="secondary" className="font-mono">
                v1.0
              </Badge>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div
          className="text-center mb-12"
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Code className="h-4 w-4" />
            API Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            TempMail API
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple REST API untuk membuat dan mengelola temporary email.
            Butuh header Authorization (anon key), gratis, siap pakai.
          </p>
        </motion.div>

        {/* Base URL */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-primary">Base URL</span>
              </CardTitle>
              <CardDescription>Semua request dikirim ke endpoint ini</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={baseUrl} language="URL" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Start */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
        >
          <Card className="mb-12 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>🚀 Quick Start</CardTitle>
              <CardDescription>Buat email baru dan cek inbox dalam 2 langkah</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock 
                language="JavaScript"
                code={`// 1. Buat email baru
const { email, session_token } = await fetch("${baseUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY" },
  body: JSON.stringify({ action: "create" })
}).then(r => r.json());

console.log("Your temp email:", email);
// Output: akira7x2f123@mail.example.com

// 2. Cek inbox (polling setiap 10 detik)
setInterval(async () => {
  const { messages } = await fetch("${baseUrl}", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY" },
    body: JSON.stringify({ action: "inbox", email })
  }).then(r => r.json());
  
  console.log("New messages:", messages.length);
}, 10000);`}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Endpoints */}
        <motion.h2
          className="text-2xl font-bold mb-6"
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
        >
          Endpoints
        </motion.h2>
        <motion.div
          className="space-y-8"
          variants={listVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
        >
          {endpoints.map((endpoint) => (
            <motion.div key={endpoint.id} variants={cardVariants}>
              <Card id={endpoint.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <endpoint.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {endpoint.method}
                        </Badge>
                        {endpoint.title}
                      </CardTitle>
                      <CardDescription className="mt-1">{endpoint.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Request/Response */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Request Body</h4>
                      <CodeBlock 
                        language="JSON" 
                        code={JSON.stringify(endpoint.request, null, 2)} 
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Response</h4>
                      <CodeBlock 
                        language="JSON" 
                        code={JSON.stringify(endpoint.response, null, 2)} 
                      />
                    </div>
                  </div>

                  {/* Code Examples */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">Code Examples</h4>
                    <Tabs defaultValue="javascript" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                        <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                        <TabsTrigger value="python">Python</TabsTrigger>
                      </TabsList>
                      <TabsContent value="curl" className="mt-4">
                        <CodeBlock language="bash" code={endpoint.curl} />
                      </TabsContent>
                      <TabsContent value="javascript" className="mt-4">
                        <CodeBlock language="JavaScript" code={endpoint.javascript} />
                      </TabsContent>
                      <TabsContent value="python" className="mt-4">
                        <CodeBlock language="Python" code={endpoint.python} />
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Message Object */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
        >
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>📧 Message Object</CardTitle>
              <CardDescription>Struktur data untuk setiap email yang diterima</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Field</th>
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-left py-3 px-4 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-3 px-4 font-mono text-primary">id</td>
                      <td className="py-3 px-4 text-muted-foreground">string (UUID)</td>
                      <td className="py-3 px-4">Unique identifier for the message</td>
                    </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-primary">from_name</td>
                    <td className="py-3 px-4 text-muted-foreground">string | null</td>
                    <td className="py-3 px-4">Sender display name</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-primary">from_address</td>
                    <td className="py-3 px-4 text-muted-foreground">string</td>
                    <td className="py-3 px-4">Sender email address</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-primary">subject</td>
                    <td className="py-3 px-4 text-muted-foreground">string</td>
                    <td className="py-3 px-4">Email subject line</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-primary">body_text</td>
                    <td className="py-3 px-4 text-muted-foreground">string | null</td>
                    <td className="py-3 px-4">Plain text content</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-primary">body_html</td>
                    <td className="py-3 px-4 text-muted-foreground">string | null</td>
                    <td className="py-3 px-4">HTML content</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-primary">received_at</td>
                    <td className="py-3 px-4 text-muted-foreground">string (ISO 8601)</td>
                    <td className="py-3 px-4">Timestamp when email was received</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-primary">attachments</td>
                    <td className="py-3 px-4 text-muted-foreground">array</td>
                    <td className="py-3 px-4">List of attachment objects</td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Handling */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
        >
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>⚠️ Error Handling</CardTitle>
              <CardDescription>Response format untuk error</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock 
                language="JSON"
                code={`// 404 - Email not found
{
  "error": "Email not found"
}

// 400 - Invalid action
{
  "error": "Invalid action"
}

// 403 - Admin protected
{
  "error": "This session is admin-protected. Use the admin panel to delete."
}

// 500 - Server error
{
  "error": "Error message details"
}`}
              />
            </CardContent>
          </Card>
        </motion.div>
        {/* Notes */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
        >
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>📝 Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Email otomatis dihapus setiap jam (kecuali email yang dibuat admin)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Simpan session_token untuk mengakses email dari device berbeda</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Polling inbox setiap 10 detik direkomendasikan</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Domain email dikelola via Admin Panel → Domains</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Semua request butuh header Authorization: Bearer YOUR_ANON_KEY</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          className="mt-12 text-center"
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
        >
          <p className="text-muted-foreground mb-4">
            Ada pertanyaan atau butuh bantuan?
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link to="/faq">FAQ</Link>
            </Button>
            <Button asChild>
              <Link to="/">Try TempMail</Link>
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ApiDocs;
