import { ArrowLeft, Clock, User, FileText, Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EmailMessage } from "@/hooks/useTempMail";
import { useEffect, useRef, useState } from "react";

interface EmailViewerProps {
  message: EmailMessage;
  onBack: () => void;
  onDelete?: (messageId: string) => void;
}

function SandboxedEmail({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(300);

  // Wrap email HTML to ensure proper rendering inside iframe
  const wrappedHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; word-wrap: break-word; overflow-wrap: break-word; }
        img { max-width: 100% !important; height: auto !important; }
        table { max-width: 100% !important; }
        pre { white-space: pre-wrap; overflow-x: auto; }
        a { color: #2563eb; }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc?.body) {
          const newHeight = Math.max(doc.body.scrollHeight + 16, 100);
          setHeight(Math.min(newHeight, 600));
        }
      } catch { /* cross-origin */ }
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={wrappedHtml}
      sandbox="allow-same-origin"
      className="w-full border-0 rounded-xl bg-white"
      style={{ height: `${height}px` }}
      title="Email content"
    />
  );
}

export function EmailViewer({ message, onBack, onDelete }: EmailViewerProps) {
  const reduceMotion = useReducedMotion();

  // Detect HTML content - use iframe for any HTML, plain div for pure text
  const isHtml = /<[a-z][\s\S]*>/i.test(message.body);

  return (
    <motion.div
      className="bento-card"
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
      transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack} 
          className="shrink-0 hover:bg-secondary transition-all duration-300 hover:-translate-x-1 press-effect"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold truncate flex-1">{message.subject}</h3>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(message.id)}
            className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 press-effect"
            title="Delete email"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center transition-all duration-300 hover:scale-105">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{message.from}</p>
            <p className="text-xs text-muted-foreground truncate">To: {message.to}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Clock className="w-3 h-3" />
            {message.date}
          </div>
        </div>
        
        {isHtml ? (
          <SandboxedEmail html={message.body} />
        ) : (
          <div className="bg-secondary rounded-xl p-4 text-sm leading-relaxed overflow-auto max-h-96 whitespace-pre-wrap animate-fade-in">
            {message.body}
          </div>
        )}
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="pt-4 border-t border-border animate-fade-up">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Attachments
            </p>
            <div className="flex flex-wrap gap-2">
              {message.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-secondary rounded-lg text-sm flex items-center gap-2 hover:bg-secondary/80 transition-all duration-300 hover:scale-105 cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  {attachment}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
