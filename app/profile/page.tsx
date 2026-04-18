"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/signin");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <main className="px-6 py-10">Redirecting...</main>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="rounded-3xl border border-white/10 bg-surface/90 p-6">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-sm text-gray-400">
          This is ready to connect with your real authentication backend later.
        </p>

        <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-black/25 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
              Name
            </p>
            <p className="text-white">{user?.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
              Email
            </p>
            <p className="text-white">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            signOut();
            router.push("/");
          }}
          className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-300"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
