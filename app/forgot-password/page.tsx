"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canSubmit = email.trim().includes("@") && !submitting;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to request reset link.");
      }

      setMessage(data.message ?? "Sent reset password link to your email.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to request reset link.",
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
        <h1 className="text-2xl font-bold text-white">Forgot password</h1>
        <p className="mt-1 text-sm text-gray-400">
          Enter your registered email and we will send a reset password link.
        </p>

        <div className="mt-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none focus:border-primary"
          />
        </div>

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
          {submitting ? "Sending..." : "Send reset link"}
        </button>

        <p className="mt-4 text-sm text-gray-400">
          Remembered your password?{" "}
          <Link href="/signin" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
