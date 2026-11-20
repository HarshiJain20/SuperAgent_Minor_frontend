"use client";

import { useCallback, useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setMessage(null);
      setLoading(true);

      try {
        const supabase = getSupabaseClient();
        const normalizedEmail = email.trim().toLowerCase();

        if (isSignUp) {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: { emailRedirectTo: window.location.origin },
          });

          if (signUpError) throw signUpError;
          if (!data.session) {
            setMessage("Account created. Check your email to verify it, then sign in.");
          }
        } else {
          const { data, error: signInError } =
            await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password,
            });

          if (signInError) throw signInError;

          if (!data.user?.email_confirmed_at) {
            await supabase.auth.signOut();
            setError("Please verify your email before signing in.");
          }
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Authentication failed.");
      } finally {
        setLoading(false);
      }
    },
    [email, isSignUp, password],
  );

  if (!isSupabaseConfigured()) {
    return (
      <AuthShell>
        <p className="text-center text-sm text-destructive">
          Supabase is not configured. Add the two public Supabase environment variables to
          the frontend.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-foreground">Welcome to SuperAgent</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSignUp ? "Create an account to save your chats." : "Sign in to continue."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-foreground">
          Email
          <span className="relative mt-1.5 block">
            <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-muted/50 py-3 pl-10 pr-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </span>
        </label>

        <label className="block text-sm font-medium text-foreground">
          Password
          <span className="relative mt-1.5 block">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="w-full rounded-xl border border-border bg-muted/50 px-3 py-3 pr-11 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </span>
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-emerald-600">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
            loading
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setIsSignUp((current) => !current);
          setError(null);
          setMessage(null);
        }}
        className="mt-5 w-full text-sm text-muted-foreground hover:text-foreground"
      >
        {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
      </button>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        {children}
      </section>
    </main>
  );
}
