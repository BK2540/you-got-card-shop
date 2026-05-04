"use client";

import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canSubmit =
    token &&
    password.length >= 8 &&
    confirmPassword.length >= 8 &&
    password === confirmPassword &&
    !submitting;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to reset password.");
      }

      setMessage(data.message ?? "Your password has been reset.");
      setPassword("");
      setConfirmPassword("");
      window.setTimeout(() => {
        router.push("/signin");
      }, 1200);
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Failed to reset password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center px-6 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-3xl border border-white/10 bg-surface/90 p-6 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-white">Reset password</h1>
        <p className="mt-1 text-sm text-gray-400">
          Choose a new password with at least 8 characters.
        </p>

        {!token && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            This reset link is missing a token. Please request a new link.
          </p>
        )}

        <div className="mt-6 space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 pr-12 text-white outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-300 transition hover:bg-white/10 hover:text-white"
              aria-label={showPassword ? "Hide new password" : "Show new password"}
            >
              {showPassword ? (
                <VisibilityOffOutlinedIcon fontSize="small" />
              ) : (
                <VisibilityOutlinedIcon fontSize="small" />
              )}
            </button>
          </div>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 pr-12 text-white outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-300 transition hover:bg-white/10 hover:text-white"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <VisibilityOffOutlinedIcon fontSize="small" />
              ) : (
                <VisibilityOutlinedIcon fontSize="small" />
              )}
            </button>
          </div>
        </div>

        {password && password.length < 8 && (
          <p className="mt-3 text-sm text-orange-200">
            Password must be at least 8 characters.
          </p>
        )}
        {confirmPassword && password !== confirmPassword && (
          <p className="mt-3 text-sm text-orange-200">
            Passwords do not match.
          </p>
        )}
        {message && (
          <p className="mt-4 rounded-xl border border-orange-400/30 bg-orange-500/10 px-3 py-2 text-sm text-orange-100">
            {message}
          </p>
        )}
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-6 w-full rounded-2xl bg-linear-to-r from-orange-500 to-orange-600 px-5 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Resetting..." : "Reset password"}
        </button>

        <p className="mt-4 text-sm text-gray-400">
          Ready to continue?{" "}
          <Link href="/signin" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="px-6 py-10">Loading...</main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
