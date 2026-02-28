import { useState, useEffect, useCallback } from "react";
import { Mail, MailOpen, Clock, ChevronRight, RefreshCw, Inbox as InboxIcon, Filter, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmailMessage, TempEmailAddress } from "@/hooks/useTempMail";
import { EmailViewer } from "./EmailViewer";
import { supabase } from "@/integrations/supabase/client";

interface InboxProps {
  messages: EmailMessage[];
  emails: TempEmailAddress[];
  activeFilter: string | null;
  onFilterChange: (email: string | null) => void;
  onRefresh: () => void;
  onDeleteMessage: (messageId: string) => void;
  isLoading: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

const PAGE_SIZE = 10;

export function Inbox({ messages, emails, activeFilter, onFilterChange, onRefresh, onDeleteMessage, isLoading, isMuted, onToggleMute }: InboxProps) {
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [page, setPage] = useState(0);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const reduceMotion = useReducedMotion();

  // Load read status from DB on mount and when messages change
  useEffect(() => {
    if (messages.length === 0) return;
    const ids = messages.filter(m => m.isRead).map(m => m.id);
    setReadIds(new Set(ids));
  }, [messages]);

  const markAsRead = useCallback(async (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Persist to DB
    await supabase
      .from("received_emails")
      .update({ is_read: true })
      .eq("id", id);
  }, []);

  const listVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.06,
        delayChildren: reduceMotion ? 0 : 0.05,
      },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.45,
        ease: "easeOut" as const,
      },
    },
  };
  const emptyVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.5,
        ease: "easeOut" as const,
      },
    },
  };

  // Filter messages based on activeFilter
  const filteredMessages = activeFilter 
    ? messages.filter(m => m.to === activeFilter)
    : messages;

  // Reset page when filter changes
  useEffect(() => { setPage(0); }, [activeFilter]);

  const totalPages = Math.ceil(filteredMessages.length / PAGE_SIZE);
  const paginatedMessages = filteredMessages.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Handle hash change to open email from URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove #
      if (hash && messages.length > 0) {
        const message = messages.find(m => m.id === hash);
        if (message) {
          setSelectedMessage(message);
        }
      } else if (!hash) {
        setSelectedMessage(null);
      }
    };

    // Check on mount and when messages change
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [messages]);

  const handleSelectMessage = (message: EmailMessage) => {
    markAsRead(message.id);
    setSelectedMessage(message);
    window.location.hash = message.id;
  };

  const handleBack = () => {
    setSelectedMessage(null);
    // Remove hash from URL
    history.pushState(null, "", window.location.pathname);
  };

  const getEmailDomain = (email: string) => email.split("@")[1] || "";

  const handleDeleteMessage = (messageId: string) => {
    onDeleteMessage(messageId);
    handleBack();
  };

  if (selectedMessage) {
    return <EmailViewer message={selectedMessage} onBack={handleBack} onDelete={handleDeleteMessage} />;
  }

  return (
    <div className="bento-card hover-lift">
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Inbox
          </span>
          {filteredMessages.length > 0 && (
            <motion.span
              className="px-2 py-0.5 text-xs font-medium bg-foreground text-background rounded-full"
              initial={reduceMotion ? { scale: 1 } : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
            >
              {filteredMessages.length}
            </motion.span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMute}
            className="h-8 w-8 text-muted-foreground hover:text-foreground transition-all duration-300"
            title={isMuted ? "Unmute notifications" : "Mute notifications"}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 press-effect"
          >
            <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      {emails.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge
            variant={activeFilter === null ? "default" : "secondary"}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onFilterChange(null)}
          >
            <Filter className="w-3 h-3 mr-1" />
            All ({messages.length})
          </Badge>
          {emails.map((emailItem) => {
            const count = messages.filter(m => m.to === emailItem.email).length;
            return (
              <Badge
                key={emailItem.id}
                variant={activeFilter === emailItem.email ? "default" : "secondary"}
                className="cursor-pointer hover:opacity-80 transition-opacity font-mono text-xs"
                onClick={() => onFilterChange(emailItem.email)}
              >
                {emailItem.email.split("@")[0]}@...
                {count > 0 && <span className="ml-1">({count})</span>}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Auto-delete warning */}
      <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-secondary/50 rounded-lg border border-border/50">
        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground">
          Messages auto-delete after <span className="font-medium text-foreground">3 hours</span>
        </p>
      </div>
      
      <AnimatePresence mode="wait">
        {filteredMessages.length === 0 ? (
          <motion.div
            key="empty"
            className="py-16 text-center"
            variants={emptyVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4"
              animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
              transition={reduceMotion ? undefined : { duration: 2.4, repeat: Infinity }}
            >
              <InboxIcon className="w-6 h-6 text-muted-foreground" />
            </motion.div>
            <p className="font-medium text-muted-foreground">No emails yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {activeFilter ? `No emails for ${activeFilter}` : "Emails will appear here automatically"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            className="space-y-2"
            variants={listVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
          >
            {paginatedMessages.map((message) => {
              const isRead = readIds.has(message.id);
              return (
              <motion.button
                key={message.id}
                onClick={() => handleSelectMessage(message)}
                className={`w-full p-4 text-left rounded-xl hover:bg-secondary transition-all duration-300 flex items-start gap-4 group hover-lift press-effect ${isRead ? "opacity-75" : ""}`}
                variants={itemVariants}
                whileHover={reduceMotion ? undefined : { scale: 1.01 }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-300 ${isRead ? "bg-secondary group-hover:bg-foreground" : "bg-primary/10 group-hover:bg-foreground"}`}>
                  {isRead ? (
                    <MailOpen className="w-4 h-4 text-muted-foreground group-hover:text-background transition-colors duration-300" />
                  ) : (
                    <Mail className="w-4 h-4 text-primary group-hover:text-background transition-colors duration-300" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {!isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      <span className={`text-sm truncate ${isRead ? "font-normal text-muted-foreground" : "font-semibold"}`}>{message.from}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="w-3 h-3" />
                      {message.date}
                    </div>
                  </div>
                  <p className={`text-sm mt-0.5 truncate ${isRead ? "font-normal text-muted-foreground" : "font-semibold"}`}>{message.subject}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-muted-foreground truncate flex-1">{message.preview}</p>
                    {emails.length > 1 && activeFilter === null && (
                      <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                        {message.to.split("@")[0].slice(0, 8)}...
                      </Badge>
                    )}
                  </div>
                </div>
                
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-1 transition-all duration-300 shrink-0 mt-3" />
              </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredMessages.length)} of {filteredMessages.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="h-7 px-2 text-xs"
            >
              Prev
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="h-7 px-2 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
