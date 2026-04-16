"use client";

import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import PageBackground from "@/components/Background";
import { usePortalMode } from "@/hooks/usePortalMode";
import AdminSidebar from "./AdminSidebar";
import {
  AdminPortalProvider,
  useAdminPortal,
} from "@/context/AdminPortalContext";

function AdminPortalShell({ children }: { children: ReactNode }) {
  const { tab, setTab } = useAdminPortal();

  return (
    <div className="flex min-h-screen">
      <div className="relative z-20 shrink-0">
        <AdminSidebar tab={tab} onTabChange={setTab} />
      </div>
      <div className="relative z-0 min-w-0 flex-1">
        <PageBackground>{children}</PageBackground>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { isAdminPortal } = usePortalMode();

  return (
    <>
      {!isAdminPortal ? (
        <Navbar />
      ) : (
        <AdminPortalProvider>
          <AdminPortalShell>{children}</AdminPortalShell>
        </AdminPortalProvider>
      )}
      {!isAdminPortal && (
        <div className="mt-12">
          <PageBackground>{children}</PageBackground>
        </div>
      )}
    </>
  );
}
