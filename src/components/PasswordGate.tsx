import { useState } from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

const ACCESS_PASSWORD = import.meta.env.VITE_ACCESS_PASSWORD || "";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(() => {
    if (!ACCESS_PASSWORD) return true; // No password set = no gate
    return sessionStorage.getItem("tempmail_auth") === "1";
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  if (authenticated) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ACCESS_PASSWORD) {
      sessionStorage.setItem("tempmail_auth", "1");
      setAuthenticated(true);
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

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
            <h1 className="text-xl font-semibold tracking-tight">TempMail</h1>
            <p className="text-sm text-muted-foreground mt-1">Masukkan sandi untuk melanjutkan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sandi"
            autoFocus
            className={`w-full h-11 px-4 rounded-lg border bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all ${
              error ? "border-red-500 ring-2 ring-red-500/20" : "border-border"
            }`}
          />
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500 text-center"
            >
              Sandi salah
            </motion.p>
          )}
          <button
            type="submit"
            className="w-full h-11 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
          >
            Masuk
          </button>
        </form>
      </motion.div>
    </div>
  );
}
