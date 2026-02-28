import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNotificationSound } from "./useNotificationSound";
import { usePushNotification } from "./usePushNotification";


export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  isRead: boolean;
  attachments?: string[];
}

export interface TempEmailAddress {
  id: string;
  email: string;
  created_at: string;
}

// Fix mojibake: UTF-8 bytes misinterpreted as Latin-1
function fixMojibake(str: string): string {
  if (!str) return "";
  try {
    // Check if string contains typical mojibake patterns (â followed by control-range chars)
    if (!/[\u00C0-\u00FF][\u0080-\u00BF]/.test(str)) return str;
    // Convert each char back to its Latin-1 byte value, then decode as UTF-8
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xFF;
    }
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    // Only return decoded if it looks cleaner (fewer replacement chars)
    return decoded;
  } catch {
    return str;
  }
}

// Clean up HTML body - remove excessive whitespace and invisible characters
function cleanHtmlBody(html: string): string {
  if (!html) return "";
  
  let cleaned = fixMojibake(html);
  cleaned = cleaned
    // Remove excessive newlines and whitespace between tags
    .replace(/>\s+</g, '><')
    .replace(/\n\s*\n/g, '\n')
    // Remove invisible/zero-width characters
    .replace(/[\u200B-\u200D\u2060\u034F\uFEFF\u00AD]/g, '')
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  return cleaned;
}

// Extract text content from HTML for preview
function extractTextPreview(html: string, text: string): string {
  const cleanText = (str: string) => fixMojibake(str)
    .replace(/=[0-9A-Fa-f]{2}/g, '')
    .replace(/[\u200B-\u200D\u2060\u034F\uFEFF\u00AD]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text && !text.includes('<')) {
    return cleanText(text).substring(0, 100);
  }
  
  if (html) {
    // Simple HTML tag removal for preview
    const textContent = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/=[0-9A-Fa-f]{2}/g, '')
      .replace(/[\u200B-\u200D\u2060\u034F\uFEFF\u00AD]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return textContent.substring(0, 100);
  }
  
  return "No preview available";
}

export function useTempMail() {
  const [emails, setEmails] = useState<TempEmailAddress[]>([]);
  const [activeEmail, setActiveEmail] = useState<string>("");
  const [sessionToken, setSessionToken] = useState<string>("");
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Refs to prevent duplicate calls
  const isInitialized = useRef(false);
  const isAddingEmail = useRef(false);
  
  // Notification sound and push notifications
  const { playSound, isMuted, toggleMute } = useNotificationSound();
  const { sendNotification, requestPermission, isSupported, permission, hasAskedPermission, isGranted } = usePushNotification();

  // Fetch available domains from API
  const fetchDomains = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("tempmail", {
        body: { action: "domains" }
      });
      if (!error && data?.domains) {
        setAvailableDomains(data.domains);
      }
    } catch (error) {
      console.error("Failed to fetch domains:", error);
    }
  }, []);

  // Fetch all email addresses for this session
  const fetchEmailAddresses = useCallback(async (token: string) => {
    try {
      const { data, error } = await supabase
        .from("temp_emails")
        .select("id, email, created_at")
        .eq("session_token", token)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setEmails(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch email addresses:", error);
      return [];
    }
  }, []);

  const generateEmail = useCallback(async (domain?: string) => {
    if (isAddingEmail.current) return;
    isAddingEmail.current = true;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("tempmail", {
        body: { action: "create", domain }
      });

      if (error) throw error;

      const newEmail: TempEmailAddress = {
        id: data.id || crypto.randomUUID(),
        email: data.email,
        created_at: new Date().toISOString()
      };

      setEmails([newEmail]);
      setActiveEmail(data.email);
      setSessionToken(data.session_token);
      localStorage.setItem("tempmail_session", data.session_token);
      toast.success(`Email ${data.email} created`);
    } catch (error) {
      console.error("Failed to generate email:", error);
      toast.error("Failed to create email");
    } finally {
      setIsLoading(false);
      isAddingEmail.current = false;
    }
  }, []);

  const addEmailAddress = useCallback(async (domain: string, username?: string) => {
    if (!sessionToken || isAddingEmail.current) {
      if (!sessionToken) toast.error("No active session");
      return;
    }

    isAddingEmail.current = true;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("tempmail", {
        body: { 
          action: "add_email", 
          session_token: sessionToken,
          domain,
          username
        }
      });

      if (error) throw error;

      const newEmail: TempEmailAddress = {
        id: data.id,
        email: data.email,
        created_at: new Date().toISOString()
      };

      setEmails(prev => [...prev, newEmail]);
      setActiveEmail(data.email);
      toast.success(`Email ${data.email} added`);
    } catch (error: any) {
      console.error("Failed to add email:", error);
      toast.error(error.message || "Failed to add email");
    } finally {
      setIsLoading(false);
      isAddingEmail.current = false;
    }
  }, [sessionToken]);

  const deleteEmailAddress = useCallback(async (emailToDelete: string) => {
    if (emails.length <= 1) {
      toast.error("Cannot delete the last email address");
      return;
    }

    try {
      const { error } = await supabase
        .from("temp_emails")
        .delete()
        .eq("email", emailToDelete)
        .eq("session_token", sessionToken);

      if (error) throw error;

      const remaining = emails.filter(e => e.email !== emailToDelete);
      setEmails(remaining);
      
      // Switch to another email if deleting active one
      if (activeEmail === emailToDelete && remaining.length > 0) {
        setActiveEmail(remaining[0].email);
      }
      
      toast.success("Email deleted");
    } catch (error) {
      console.error("Failed to delete email:", error);
      toast.error("Failed to delete email");
    }
  }, [emails, activeEmail, sessionToken]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("received_emails")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Email deleted");
    } catch (error) {
      console.error("Failed to delete email:", error);
      toast.error("Failed to delete email");
    }
  }, []);

  const refreshInbox = useCallback(async () => {
    if (!sessionToken) return;
    
    setIsRefreshing(true);
    try {
      // Use session_token to get ALL emails (including custom domain emails)
      const { data, error } = await supabase.functions.invoke("tempmail", {
        body: { action: "inbox", session_token: sessionToken }
      });

      if (error) throw error;

      const formattedMessages: EmailMessage[] = (data.messages || []).map((msg: any) => ({
        id: msg.id,
        from: msg.from_name ? `${msg.from_name} <${msg.from_address}>` : msg.from_address,
        to: msg.recipient_email || activeEmail,
        subject: fixMojibake(msg.subject || "(No Subject)"),
        preview: extractTextPreview(msg.body_html, msg.body_text),
        body: cleanHtmlBody(msg.body_html) || fixMojibake(msg.body_text || ""),
        date: new Date(msg.received_at).toLocaleDateString("id-ID", { 
          day: "numeric",
          month: "short",
          hour: "2-digit", 
          minute: "2-digit" 
        }),
        isRead: msg.is_read ?? false,
        attachments: msg.attachments || []
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Failed to refresh inbox:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [sessionToken, activeEmail]);

  // Initialize email on mount - only once
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    const initEmail = async () => {
      const savedToken = localStorage.getItem("tempmail_session");
      
      if (savedToken) {
        setIsLoading(true);
        setSessionToken(savedToken);
        
        try {
          // Fetch all emails for this session
          const emailList = await fetchEmailAddresses(savedToken);
          await fetchDomains();
          
          if (emailList.length > 0) {
            setActiveEmail(emailList[0].email);
            setIsLoading(false);
            return;
          }
          
          // Fallback: try to get from API
          const { data, error } = await supabase.functions.invoke("tempmail", {
            body: { action: "get", session_token: savedToken }
          });

          if (!error && data.email) {
            setActiveEmail(data.email);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Failed to restore session:", error);
        }
        setIsLoading(false);
      }
      
      // No saved session, generate new email
      generateEmail();
    };

    initEmail();
  }, []);

  // Auto refresh inbox every 30 seconds + realtime subscription
  useEffect(() => {
    if (!sessionToken) return;
    
    // Initial refresh
    refreshInbox();
    
    // Longer polling interval since we have realtime
    const interval = setInterval(refreshInbox, 30000);
    
    return () => clearInterval(interval);
  }, [sessionToken]);

  // Refs for stable realtime subscription
  const emailIdsRef = useRef<string[]>([]);
  const refreshInboxRef = useRef(refreshInbox);

  useEffect(() => { emailIdsRef.current = emails.map(e => e.id); }, [emails]);
  useEffect(() => { refreshInboxRef.current = refreshInbox; }, [refreshInbox]);

  // Realtime subscription for new emails — only recreates on sessionToken change
  useEffect(() => {
    if (!sessionToken) return;

    const channel = supabase
      .channel('new-emails')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'received_emails',
        },
        async (payload) => {
          const newRecord = payload.new as Record<string, any>;

          if (newRecord && newRecord.temp_email_id && emailIdsRef.current.includes(newRecord.temp_email_id)) {
            playSound();
            sendNotification("New email received!", {
              body: (newRecord.subject as string) || "(No Subject)",
            });
            toast.success("New email received!", {
              description: (newRecord.subject as string) || "(No Subject)",
              duration: 5000,
            });
            refreshInboxRef.current();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionToken, playSound, sendNotification]);

  const restoreSession = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("tempmail", {
        body: { action: "get", session_token: token }
      });

      if (error) throw error;

      if (data.email) {
        setSessionToken(data.session_token);
        localStorage.setItem("tempmail_session", data.session_token);
        
        const emailList = await fetchEmailAddresses(token);
        await fetchDomains();
        
        if (emailList.length > 0) {
          setActiveEmail(emailList[0].email);
        } else {
          setActiveEmail(data.email);
        }
        
        setMessages([]);
        toast.success("Session restored successfully");
      } else {
        toast.error("Invalid token");
      }
    } catch (error) {
      console.error("Failed to restore session:", error);
      toast.error("Failed to restore session");
    } finally {
      setIsLoading(false);
    }
  }, [fetchEmailAddresses, fetchDomains]);


  return {
    // Multi-email support
    emails,
    activeEmail,
    setActiveEmail,
    addEmailAddress,
    deleteEmailAddress,
    availableDomains,
    // Legacy support
    email: activeEmail,
    sessionToken,
    messages,
    isLoading,
    isRefreshing,
    generateEmail,
    refreshInbox,
    deleteMessage,
    restoreSession,
    // Notification controls
    isMuted,
    toggleMute,
    // Push notification controls
    requestPushPermission: requestPermission,
    pushNotificationSupported: isSupported,
    pushNotificationPermission: permission,
    hasAskedPushPermission: hasAskedPermission,
    isPushGranted: isGranted,
  };
}
