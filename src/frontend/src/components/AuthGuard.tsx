import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface AuthGuardProps {
  children: React.ReactNode;
  message?: string;
}

export default function AuthGuard({
  children,
  message = "Sign in to access this page",
}: AuthGuardProps) {
  const { login, identity, isLoggingIn, isInitializing } =
    useInternetIdentity();

  if (isInitializing) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        data-ocid="auth.loading_state"
      >
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!identity) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
        data-ocid="auth.panel"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted/50 border border-border flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">{message}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Create or connect your account to get started
          </p>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="gradient-primary text-white border-0 hover:opacity-90"
            data-ocid="auth.button"
          >
            {isLoggingIn ? "Connecting..." : "Sign In"}
          </Button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
