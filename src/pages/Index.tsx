import { useState, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Header } from "@/components/Header";
import { EmailDisplay } from "@/components/EmailDisplay";
import { Inbox } from "@/components/Inbox";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { useTempMail } from "@/hooks/useTempMail";
import { useSearchParams } from "react-router-dom";

const Index = () => {
  const [inboxFilter, setInboxFilter] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    emails,
    activeEmail,
    setActiveEmail,
    sessionToken, 
    messages, 
    availableDomains,
    isLoading: isEmailLoading, 
    isRefreshing, 
    addEmailAddress,
    deleteEmailAddress,
    refreshInbox,
    deleteMessage,
    restoreSession,
    isMuted,
    toggleMute,
  } = useTempMail();

  // Auto-restore session from ?token=xxx URL param (e.g. from Admin "Open Inbox")
  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      // Clear the param from URL immediately (clean UX)
      setSearchParams({}, { replace: true });
      restoreSession(tokenParam);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fadeIn = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.4, ease: "easeOut" as const },
    },
  };

  return (
    <div className="min-h-screen grid-background flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
          {/* Hero Section */}
          <section className="text-center space-y-3 sm:space-y-4 py-4 sm:py-8">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tighter">
                Temporary
                <br />
                <span className="text-muted-foreground">Email</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto px-4 mt-3">
                Protect your privacy with disposable email addresses. No signup required.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                <span>Instant inbox</span>
                <span className="text-border">•</span>
                <span>No signup</span>
              </div>
            </motion.div>
          </section>
          
          {/* Email Display */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <EmailDisplay 
              emails={emails}
              activeEmail={activeEmail}
              sessionToken={sessionToken}
              availableDomains={availableDomains}
              onSelectEmail={setActiveEmail}
              onAddEmail={addEmailAddress}
              onDeleteEmail={deleteEmailAddress}
              onRefreshAll={refreshInbox}
              onRestoreSession={restoreSession}
              isLoading={isEmailLoading} 
            />
          </motion.div>
          
          {/* Inbox */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <Inbox 
              messages={messages}
              emails={emails}
              activeFilter={inboxFilter}
              onFilterChange={setInboxFilter}
              onRefresh={refreshInbox}
              onDeleteMessage={deleteMessage}
              isLoading={isRefreshing}
              isMuted={isMuted}
              onToggleMute={toggleMute}
            />
          </motion.div>
          
          {/* Features */}
          <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Features />
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
