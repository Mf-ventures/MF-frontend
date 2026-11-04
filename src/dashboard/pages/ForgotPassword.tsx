import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui";
import { forgotPassword } from "@/dashboard/api/auth";
import { getErrorMessage } from "@/dashboard/state/DashboardProvider";
import logo from "@/assets/images/logo-mfventures.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <img src={logo} alt="MF Ventures" className="h-9 w-auto" />
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <h1 className="text-xl font-extrabold text-ink">
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-muted">
            We'll send a reset link to your email.
          </p>

          {sent ? (
            <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              If an account exists for{" "}
              <span className="font-semibold">{email}</span>, a reset link has
              been sent. Check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-semibold text-ink"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@mfventures.com"
                  className="w-full rounded-md border border-black/10 bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>

              {error && (
                <p className="text-sm font-medium text-red-600">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          <Link
            to="/dashboard/login"
            className="font-semibold text-brand-blue hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
