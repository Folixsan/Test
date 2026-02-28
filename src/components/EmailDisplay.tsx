import { useState } from "react";
import { Copy, RefreshCw, Check, AlertTriangle, Plus, Trash2, ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SessionToken } from "@/components/SessionToken";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TempEmailAddress } from "@/hooks/useTempMail";

interface EmailDisplayProps {
  emails: TempEmailAddress[];
  activeEmail: string;
  sessionToken: string;
  availableDomains: string[];
  onSelectEmail: (email: string) => void;
  onAddEmail: (domain: string, username?: string) => void;
  onDeleteEmail: (email: string) => void;
  onRefreshAll: () => void;
  onRestoreSession: (token: string) => void;
  isLoading: boolean;
}

export function EmailDisplay({ 
  emails,
  activeEmail, 
  sessionToken, 
  availableDomains,
  onSelectEmail,
  onAddEmail,
  onDeleteEmail,
  onRefreshAll, 
  onRestoreSession, 
  isLoading 
}: EmailDisplayProps) {
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(availableDomains[0] || "");
  const [customUsername, setCustomUsername] = useState("");

  const entryTransition = {
    duration: reduceMotion ? 0 : 0.6,
    ease: "easeOut" as const,
  };
  const pillListVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.05,
        delayChildren: reduceMotion ? 0 : 0.1,
      },
    },
  };
  const pillVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.4,
        ease: "easeOut" as const,
      },
    },
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeEmail);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddEmail = () => {
    if (customUsername.trim()) {
      onAddEmail(selectedDomain, customUsername.trim());
    } else {
      onAddEmail(selectedDomain);
    }
    setIsAddDialogOpen(false);
    setCustomUsername("");
  };

  const getDomainFromEmail = (email: string) => {
    return email.split("@")[1] || "";
  };


  return (
    <motion.div
      className="bento-card hover-lift"
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={entryTransition}
    >
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...entryTransition, delay: reduceMotion ? 0 : 0.05 }}
      >
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Your email addresses ({emails.length})
        </span>
        <span className="text-xs text-muted-foreground animate-pulse-soft hidden sm:inline">
          Never expires
        </span>
      </motion.div>
      
      {/* Email Selector & Copy */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full sm:flex-1 justify-between font-mono text-xs sm:text-sm md:text-base h-10 sm:h-12 rounded-xl"
            >
              <span className="truncate">{activeEmail || "Loading..."}</span>
              <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[300px] max-h-[300px] overflow-y-auto">
            <DropdownMenuLabel>Your Email Addresses</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {emails.map((emailItem) => (
              <DropdownMenuItem
                key={emailItem.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => onSelectEmail(emailItem.email)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-sm truncate">{emailItem.email}</span>
                </div>
                {activeEmail === emailItem.email && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-primary"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add new email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <motion.div
          className="flex items-center gap-2"
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...entryTransition, delay: reduceMotion ? 0 : 0.1 }}
        >
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0 border-border hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300 press-effect hover:scale-105"
            onClick={handleCopy}
            disabled={!activeEmail}
          >
            {copied ? (
              <Check className="w-4 h-4 animate-scale-up" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          
          <SessionToken 
            sessionToken={sessionToken} 
            onRestoreSession={onRestoreSession}
          />
          
          {/* Add Email Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0 border-border hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300 press-effect hover:scale-105"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Email Address</DialogTitle>
              <DialogDescription>
                Create a new temporary email address. Choose a domain and optionally set a custom username.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Domain</label>
                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDomains.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        @{domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username (optional)</label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="random"
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">@{selectedDomain}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty for a random username
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddEmail} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Email"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

          {/* Delete Current Email */}
          {emails.length > 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0 border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-300 press-effect hover:scale-105"
                  disabled={isLoading || !activeEmail}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
            <AlertDialogContent className="animate-scale-up">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive animate-bounce-soft" />
                  Delete Email Address?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>This will permanently delete this email address:</p>
                  <p className="font-mono text-sm bg-secondary px-3 py-2 rounded-lg text-foreground">
                    {activeEmail}
                  </p>
                  <p>All emails received at this address will also be deleted.</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="transition-all duration-200 hover:scale-105">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDeleteEmail(activeEmail)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200 hover:scale-105 press-effect"
                >
                  Delete Email
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
          )}
        </motion.div>
      </div>

      {/* Email List Pills */}
      {emails.length > 1 && (
        <motion.div
          className="flex flex-wrap gap-1.5 sm:gap-2"
          variants={pillListVariants}
          initial="hidden"
          animate="visible"
        >
          {emails.map((emailItem) => (
            <motion.div key={emailItem.id} variants={pillVariants}>
              <Badge
                variant={activeEmail === emailItem.email ? "default" : "secondary"}
                className="cursor-pointer hover:opacity-80 transition-opacity text-[10px] sm:text-xs font-mono"
                onClick={() => onSelectEmail(emailItem.email)}
              >
                {emailItem.email.split("@")[0]}@...
              </Badge>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
