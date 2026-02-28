import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Check,
  Shield,
  Clock,
  RefreshCw,
  Lock,
  Search,
  LogOut,
  Mail,
  ShieldCheck,
  MessageSquare,
  ExternalLink,
  Key,
  Globe,
  Users,
  Crown,
  User,
  Webhook,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Types ────────────────────────────────────────────────────────

interface AdminEmail {
  id: string;
  email: string;
  session_token: string;
  created_at: string;
  is_admin_created: boolean;
  admin_id: string | null;
  message_count: number;
}

interface AdminUser {
  id: string;
  username: string;
  is_owner: boolean;
  created_at: string;
}

interface Domain {
  id: string;
  domain: string;
  added_by: string | null;
  created_at: string;
}

interface WebhookItem {
  id: string;
  url: string;
  label: string;
  email_filter: string | null;
  is_active: boolean;
  added_by: string | null;
  created_at: string;
}

interface CurrentAdmin {
  id: string;
  username: string;
  session_token: string;
  is_owner: boolean;
  created_at: string;
}

type Tab = "emails" | "domains" | "webhooks" | "admins";

// ── Component ────────────────────────────────────────────────────

const Admin = () => {
  const { toast } = useToast();

  // Auth state
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<Tab>("emails");

  // Data state
  const [emails, setEmails] = useState<AdminEmail[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);

  // Create forms
  const [newEmailUsername, setNewEmailUsername] = useState("");
  const [newEmailDomain, setNewEmailDomain] = useState("");
  const [creating, setCreating] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookLabel, setNewWebhookLabel] = useState("");
  const [newWebhookFilter, setNewWebhookFilter] = useState("");
  const [addingWebhook, setAddingWebhook] = useState(false);

  // Clipboard feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAdminToken, setCopiedAdminToken] = useState(false);

  const getAdminToken = useCallback(() => {
    return sessionStorage.getItem("tempmail_admin_token") || "";
  }, []);

  // ── API helper ──────────────────────────────────────────────

  const api = useCallback(async (body: Record<string, any>) => {
    const { data, error } = await supabase.functions.invoke("tempmail", { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  const adminApi = useCallback(async (body: Record<string, any>) => {
    return api({ ...body, admin_token: getAdminToken() });
  }, [api, getAdminToken]);

  // ── Fetch data ──────────────────────────────────────────────

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi({ action: "admin_list" });
      setEmails(data.emails || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch";
      if (msg === "Unauthorized") {
        sessionStorage.removeItem("tempmail_admin_token");
        sessionStorage.removeItem("tempmail_admin_info");
        setCurrentAdmin(null);
        return;
      }
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [adminApi, toast]);

  const fetchDomains = useCallback(async () => {
    try {
      const data = await adminApi({ action: "admin_domains_list" });
      setDomains(data.domains || []);
      if (data.domains?.length > 0 && !newEmailDomain) {
        setNewEmailDomain(data.domains[0].domain);
      }
    } catch {
      // Silently fail
    }
  }, [adminApi, newEmailDomain]);

  const fetchAdminUsers = useCallback(async () => {
    try {
      const data = await adminApi({ action: "admin_users_list" });
      setAdminUsers(data.admins || []);
    } catch {
      // Silently fail
    }
  }, [adminApi]);
  const fetchWebhooks = useCallback(async () => {
    try {
      const data = await adminApi({ action: "admin_webhooks_list" });
      setWebhooks(data.webhooks || []);
    } catch {
      // Silently fail
    }
  }, [adminApi]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchEmails(), fetchDomains(), fetchAdminUsers(), fetchWebhooks()]);
  }, [fetchEmails, fetchDomains, fetchAdminUsers, fetchWebhooks]);

  // ── Init: check admin exists + auto-login ───────────────────

  useEffect(() => {
    const init = async () => {
      try {
        const checkData = await api({ action: "admin_check" });
        const hasAdmin = checkData.has_admin;

        if (!hasAdmin) {
          setNeedsSetup(true);
          setInitializing(false);
          return;
        }

        setNeedsSetup(false);

        // Try auto-login from saved token
        const savedToken = sessionStorage.getItem("tempmail_admin_token");
        if (savedToken) {
          try {
            const data = await api({ action: "admin_list", admin_token: savedToken });
            if (data.emails !== undefined) {
              const adminInfo = JSON.parse(sessionStorage.getItem("tempmail_admin_info") || "null");
              if (adminInfo) {
                setCurrentAdmin(adminInfo);
                setEmails(data.emails || []);
              } else {
                sessionStorage.removeItem("tempmail_admin_token");
              }
            }
          } catch {
            sessionStorage.removeItem("tempmail_admin_token");
            sessionStorage.removeItem("tempmail_admin_info");
          }
        }
      } catch {
        // API not available
      }
      setInitializing(false);
    };
    init();
  }, [api]);

  useEffect(() => {
    if (currentAdmin) {
      fetchDomains();
      fetchAdminUsers();
    }
  }, [currentAdmin, fetchDomains, fetchAdminUsers]);

  // ── Auth handlers ───────────────────────────────────────────

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setAuthLoading(true);
    setAuthError("");
    try {
      const data = await api({ action: "admin_setup", username: username.trim(), password });
      const admin = data.admin;
      sessionStorage.setItem("tempmail_admin_token", admin.session_token);
      sessionStorage.setItem("tempmail_admin_info", JSON.stringify(admin));
      setCurrentAdmin(admin);
      setNeedsSetup(false);
      toast({ title: "Admin created", description: `Welcome, ${admin.username}!` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Setup failed";
      setAuthError(msg);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
    setAuthLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setAuthLoading(true);
    setAuthError("");
    try {
      const data = await api({ action: "admin_login", username: username.trim(), password });
      const admin = data.admin;
      sessionStorage.setItem("tempmail_admin_token", admin.session_token);
      sessionStorage.setItem("tempmail_admin_info", JSON.stringify(admin));
      setCurrentAdmin(admin);
      fetchAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setAuthError(msg === "Invalid credentials" ? "Username atau password salah" : msg);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("tempmail_admin_token");
    sessionStorage.removeItem("tempmail_admin_info");
    setCurrentAdmin(null);
    setUsername("");
    setPassword("");
    setEmails([]);
    setDomains([]);
    setAdminUsers([]);
  };

  // ── Email actions ───────────────────────────────────────────

  const handleCreateEmail = async () => {
    setCreating(true);
    try {
      const body: Record<string, string> = { action: "admin_create" };
      if (newEmailDomain) body.domain = newEmailDomain;
      if (newEmailUsername.trim()) body.email_username = newEmailUsername.trim();

      const data = await adminApi(body);
      toast({ title: "Email created", description: data.email });
      setNewEmailUsername("");
      fetchEmails();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEmail = async (emailId: string, emailAddr: string) => {
    if (!window.confirm(`Delete ${emailAddr} and all its messages?`)) return;
    try {
      await adminApi({ action: "admin_delete", email_id: emailId });
      toast({ title: "Deleted", description: emailAddr });
      fetchEmails();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleCopyToken = async (id: string, token: string) => {
    await navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAdminToken = async () => {
    if (!currentAdmin) return;
    await navigator.clipboard.writeText(currentAdmin.session_token);
    setCopiedAdminToken(true);
    setTimeout(() => setCopiedAdminToken(false), 2000);
  };

  // ── Domain actions ──────────────────────────────────────────

  const handleAddDomain = async () => {
    if (!newDomainName.trim()) return;
    setAddingDomain(true);
    try {
      await adminApi({ action: "admin_domains_add", domain_name: newDomainName.trim() });
      toast({ title: "Domain added", description: newDomainName.trim() });
      setNewDomainName("");
      fetchDomains();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add domain";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setAddingDomain(false);
    }
  };

  const handleRemoveDomain = async (domainId: string, domainName: string) => {
    if (!window.confirm(`Remove domain ${domainName}?`)) return;
    try {
      await adminApi({ action: "admin_domains_remove", domain_id: domainId });
      toast({ title: "Removed", description: domainName });
      fetchDomains();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  // ── Admin user actions ──────────────────────────────────────

  const handleAddAdmin = async () => {
    if (!newAdminUsername.trim() || !newAdminPassword.trim()) return;
    setAddingAdmin(true);
    try {
      await adminApi({
        action: "admin_users_add",
        new_username: newAdminUsername.trim(),
        new_password: newAdminPassword.trim(),
      });
      toast({ title: "Admin added", description: newAdminUsername.trim() });
      setNewAdminUsername("");
      setNewAdminPassword("");
      fetchAdminUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add admin";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!window.confirm(`Remove admin "${adminName}"?`)) return;
    try {
      await adminApi({ action: "admin_users_delete", target_admin_id: adminId });
      toast({ title: "Removed", description: adminName });
      fetchAdminUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  // ── Webhook actions ─────────────────────────────────────────────

  const handleAddWebhook = async () => {
    if (!newWebhookUrl.trim()) return;
    setAddingWebhook(true);
    try {
      await adminApi({
        action: "admin_webhooks_add",
        webhook_url: newWebhookUrl.trim(),
        webhook_label: newWebhookLabel.trim(),
        email_filter: newWebhookFilter.trim() || null,
      });
      toast({ title: "Webhook added", description: newWebhookLabel.trim() || newWebhookUrl.trim() });
      setNewWebhookUrl("");
      setNewWebhookLabel("");
      setNewWebhookFilter("");
      fetchWebhooks();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add webhook";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setAddingWebhook(false);
    }
  };

  const handleToggleWebhook = async (webhookId: string) => {
    try {
      await adminApi({ action: "admin_webhooks_toggle", webhook_id: webhookId });
      fetchWebhooks();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to toggle";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleDeleteWebhook = async (webhookId: string, label: string) => {
    if (!window.confirm(`Remove webhook "${label || webhookId}"?`)) return;
    try {
      await adminApi({ action: "admin_webhooks_delete", webhook_id: webhookId });
      toast({ title: "Removed", description: label || "Webhook" });
      fetchWebhooks();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  // ── Computed ─────────────────────────────────────────────────

  const filteredEmails = emails.filter((e) =>
    e.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: emails.length,
    protected: emails.filter((e) => e.is_admin_created).length,
    messages: emails.reduce((sum, e) => sum + e.message_count, 0),
  };

  const myAdminEmails = emails.filter((e) => e.admin_id === currentAdmin?.id);
  const domainOptions = domains.map((d) => d.domain);

  // ── Loading ─────────────────────────────────────────────────

  if (initializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Setup / Login Gate ──────────────────────────────────────

  if (!currentAdmin) {
    const isSetup = needsSetup === true;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, x: shaking ? [0, -10, 10, -10, 10, 0] : 0 }}
          transition={{ duration: shaking ? 0.4 : 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center">
              <Lock className="w-6 h-6 text-background" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-semibold tracking-tight">
                {isSetup ? "Setup Admin" : "Admin Panel"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isSetup
                  ? "Buat akun admin pertama untuk memulai"
                  : "Masuk dengan akun admin"}
              </p>
            </div>
          </div>

          <form onSubmit={isSetup ? handleSetup : handleLogin} className="space-y-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoFocus
              autoComplete="username"
              className="w-full h-11 px-4 rounded-lg border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all border-border"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={isSetup ? "new-password" : "current-password"}
              className={`w-full h-11 px-4 rounded-lg border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all ${
                authError ? "border-red-500 ring-2 ring-red-500/20" : "border-border"
              }`}
            />
            {authError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 text-center"
              >
                {authError}
              </motion.p>
            )}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full h-11 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {authLoading ? "Loading..." : isSetup ? "Create Admin Account" : "Masuk"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to home
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Admin Panel ─────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="w-full py-4 sm:py-6 px-4 sm:px-6 border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </a>
            <span className="text-border">|</span>
            <h1 className="font-semibold text-base sm:text-lg tracking-tight">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {currentAdmin.username}{currentAdmin.is_owner && " (owner)"}
            </span>
            <Button variant="ghost" size="icon" onClick={fetchAll} disabled={loading} title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {([
            { key: "emails" as Tab, label: "Emails", icon: Mail },
            { key: "domains" as Tab, label: "Domains", icon: Globe },
            ...(currentAdmin.is_owner
              ? [
                  { key: "webhooks" as Tab, label: "Webhooks", icon: Webhook },
                  { key: "admins" as Tab, label: "Admins", icon: Users },
                ]
              : [{ key: "webhooks" as Tab, label: "Webhooks", icon: Webhook }]),
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ EMAILS TAB ═══ */}
        {activeTab === "emails" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Emails</CardTitle>
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Protected</CardTitle>
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.protected}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.messages}</div></CardContent>
              </Card>
            </div>

            {/* My Admin Session Token */}
            {myAdminEmails.length > 0 && (
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-500" />
                    Your Session Token
                  </CardTitle>
                  <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                    {myAdminEmails.length} email{myAdminEmails.length > 1 ? "s" : ""}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs sm:text-sm font-mono bg-secondary px-3 py-2 rounded-md truncate select-all">
                      {currentAdmin.session_token}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyAdminToken} className="gap-1.5">
                      {copiedAdminToken ? (
                        <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy Token</>
                      )}
                    </Button>
                    <Button size="sm" onClick={() => window.open(`/?token=${currentAdmin.session_token}`, "_blank")} className="gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Inbox
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Create Email */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Create Protected Email</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Username (optional)"
                    value={newEmailUsername}
                    onChange={(e) => setNewEmailUsername(e.target.value)}
                    className="flex-1"
                  />
                  {domainOptions.length > 1 ? (
                    <select
                      value={newEmailDomain}
                      onChange={(e) => setNewEmailDomain(e.target.value)}
                      className="h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm"
                    >
                      {domainOptions.map((d) => (
                        <option key={d} value={d}>@{d}</option>
                      ))}
                    </select>
                  ) : domainOptions.length === 1 ? (
                    <div className="h-10 px-3 flex items-center rounded-md border border-border bg-secondary text-sm text-muted-foreground">
                      @{domainOptions[0]}
                    </div>
                  ) : (
                    <div className="h-10 px-3 flex items-center rounded-md border border-destructive/50 bg-destructive/5 text-sm text-destructive">
                      No domains — add one first
                    </div>
                  )}
                  <Button onClick={handleCreateEmail} disabled={creating || domainOptions.length === 0}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search + Table */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search emails..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>

              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead className="hidden sm:table-cell">Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Messages</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {loading ? "Loading..." : searchQuery ? "No emails match" : "No emails yet"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEmails.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">{item.email}</TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                              {timeAgo(item.created_at)}
                            </TableCell>
                            <TableCell>
                              {item.is_admin_created ? (
                                <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Protected
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Auto-delete
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center tabular-nums">{item.message_count}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyToken(item.id, item.session_token)} title="Copy session token">
                                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleDeleteEmail(item.id, item.email)} title="Delete email">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {filteredEmails.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Showing {filteredEmails.length} of {emails.length} emails
                </p>
              )}
            </div>
          </div>
        )}

        {/* ═══ DOMAINS TAB ═══ */}
        {activeTab === "domains" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Add Domain</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="mail.example.com"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
                  />
                  <Button onClick={handleAddDomain} disabled={addingDomain || !newDomainName.trim()}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    {addingDomain ? "Adding..." : "Add Domain"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Pastikan domain sudah di-setup di Cloudflare Email Routing dan catch-all rule mengarah ke worker.
                </p>
              </CardContent>
            </Card>

            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead className="hidden sm:table-cell">Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No domains yet. Add one above.
                        </TableCell>
                      </TableRow>
                    ) : (
                      domains.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-muted-foreground" />
                              {d.domain}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                            {timeAgo(d.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleRemoveDomain(d.id, d.domain)} title="Remove domain">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}


        {/* ═══ WEBHOOKS TAB ═══ */}
        {activeTab === "webhooks" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Add Webhook</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="https://api.fonnte.com/send"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Label (opsional)"
                    value={newWebhookLabel}
                    onChange={(e) => setNewWebhookLabel(e.target.value)}
                    className="sm:w-40"
                  />
                  <Button onClick={handleAddWebhook} disabled={addingWebhook || !newWebhookUrl.trim()}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    {addingWebhook ? "Adding..." : "Add"}
                  </Button>
                </div>
                <Input
                  placeholder="Filter email (opsional, kosong = semua email)"
                  value={newWebhookFilter}
                  onChange={(e) => setNewWebhookFilter(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Webhook akan menerima POST request berisi data email baru (to, from, subject, body_text). Cocok untuk notifikasi WA via Fonnte, Wablas, atau service lainnya.
                </p>
              </CardContent>
            </Card>

            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Webhook</TableHead>
                      <TableHead className="hidden sm:table-cell">Filter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Belum ada webhook. Tambahkan di atas.
                        </TableCell>
                      </TableRow>
                    ) : (
                      webhooks.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell>
                            <div className="space-y-0.5">
                              {w.label && <div className="font-medium text-sm">{w.label}</div>}
                              <div className="font-mono text-xs text-muted-foreground truncate max-w-[300px]">{w.url}</div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {w.email_filter || <span className="italic">Semua</span>}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleToggleWebhook(w.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                w.is_active
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${w.is_active ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                              {w.is_active ? "Active" : "Inactive"}
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleDeleteWebhook(w.id, w.label || w.url)} title="Remove webhook">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}
        {/* ═══ ADMINS TAB ═══ */}
        {activeTab === "admins" && currentAdmin.is_owner && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Add Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input placeholder="Username" value={newAdminUsername} onChange={(e) => setNewAdminUsername(e.target.value)} className="flex-1" />
                  <Input type="password" placeholder="Password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} className="flex-1" />
                  <Button onClick={handleAddAdmin} disabled={addingAdmin || !newAdminUsername.trim() || !newAdminPassword.trim()}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    {addingAdmin ? "Adding..." : "Add Admin"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden sm:table-cell">Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {a.is_owner ? <Crown className="w-4 h-4 text-amber-500" /> : <User className="w-4 h-4 text-muted-foreground" />}
                            {a.username}
                            {a.id === currentAdmin.id && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {a.is_owner ? (
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/10">Owner</Badge>
                          ) : (
                            <Badge variant="secondary">Admin</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {timeAgo(a.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          {!a.is_owner && a.id !== currentAdmin.id && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleDeleteAdmin(a.id, a.username)} title="Remove admin">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}
      </main>
    </motion.div>
  );
};

export default Admin;
