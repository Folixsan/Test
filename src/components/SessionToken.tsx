import { useState } from "react";
import { Key, Copy, Check, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface SessionTokenProps {
  sessionToken: string;
  onRestoreSession: (token: string) => void;
}

export function SessionToken({ sessionToken, onRestoreSession }: SessionTokenProps) {
  const [copied, setCopied] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sessionToken);
    setCopied(true);
    toast.success("Token copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestore = () => {
    if (!inputToken.trim()) {
      toast.error("Please enter a token");
      return;
    }
    onRestoreSession(inputToken.trim());
    setIsOpen(false);
    setInputToken("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0 border-border hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300 press-effect hover:scale-105"
          disabled={!sessionToken}
        >
          <Key className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md animate-scale-up">
        <DialogHeader>
          <DialogTitle>Session Token</DialogTitle>
          <DialogDescription>
            Use this token to access your inbox on another device
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="copy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="copy" className="gap-2">
              <Copy className="w-3.5 h-3.5" />
              Copy Token
            </TabsTrigger>
            <TabsTrigger value="restore" className="gap-2">
              <LogIn className="w-3.5 h-3.5" />
              Use Token
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="copy" className="space-y-4 mt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Copy this token and use it on another browser or device to access the same inbox.
              </p>
              <div className="flex gap-2">
                <Input
                  value={sessionToken}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0 press-effect"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-foreground" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground">
                ⚠️ Keep this token private. Anyone with this token can access your inbox.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="restore" className="space-y-4 mt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Enter a session token to access an existing inbox from another device.
              </p>
              <Input
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Paste your token here..."
                className="font-mono text-xs"
              />
            </div>
            <Button 
              onClick={handleRestore} 
              className="w-full gap-2 press-effect"
              disabled={!inputToken.trim()}
            >
              <LogIn className="w-4 h-4" />
              Access Inbox
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
