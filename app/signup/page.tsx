"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, isLoading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const nextPath = useMemo(() => {
    const next = searchParams.get("next");
    return next && next.startsWith("/") ? next : "/";
  }, [searchParams]);

  const canSubmit =
    name.trim() !== "" &&
    email.trim() !== "" &&
    password.trim() !== "" &&
    !submitting;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError("");

    const result = await signUp({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || "Failed to create account.");
      return;
    }

    router.push(nextPath);
  };

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center px-6 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-3xl border border-white/10 bg-surface/90 p-6 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-white">Create account</h1>
        <p className="mt-1 text-sm text-gray-400">
          Start building your card vault today.
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none focus:border-primary"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none focus:border-primary"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none focus:border-primary"
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit || authLoading}
          className="mt-6 w-full rounded-2xl bg-linear-to-r from-orange-500 to-orange-600 px-5 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creating account..." : "Sign up"}
        </button>

        <p className="mt-4 text-sm text-gray-400">
          Already have an account?{" "}
          <Link href={`/signin?next=${encodeURIComponent(nextPath)}`} className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<main className="px-6 py-10">Loading...</main>}>
      <SignUpForm />
    </Suspense>
  );
}
