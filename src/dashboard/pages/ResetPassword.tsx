import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui";
import { resetPassword } from "@/dashboard/api/auth";
import { getErrorMessage } from "@/dashboard/state/DashboardProvider";
import logo from "@/assets/images/logo-mfventures.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError(
        "This reset link is missing or invalid. Please request a new one.",
      );
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
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
            Set a new password
          </h1>
          <p className="mt-1 text-sm text-muted">
            Choose a new password for your account.
          </p>

          {done ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                Your password has been reset. You can now sign in.
              </div>
              <Button
                className="w-full"
                onClick={() => navigate("/dashboard/login")}
              >
                Go to Sign In
              </Button>
            </div>
          ) : !token ? (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              This reset link is missing or invalid.{" "}
              <Link
                to="/forgot-password"
                className="font-semibold underline"
              >
                Request a new one
              </Link>
              .
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-1.5 block text-sm font-semibold text-ink"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-black/10 bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-semibold text-ink"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-black/10 bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>

              {error && (
                <p className="text-sm font-medium text-red-600">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Resetting…" : "Reset Password"}
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
