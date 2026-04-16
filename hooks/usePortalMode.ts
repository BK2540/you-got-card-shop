"use client";

import { usePathname } from "next/navigation";

export const isAdminPath = (pathname: string) =>
  pathname === "/admin" || pathname.startsWith("/admin/");

export function usePortalMode() {
  const pathname = usePathname();
  const isAdminPortal = isAdminPath(pathname);

  return {
    pathname,
    isAdminPortal,
    isStorefront: !isAdminPortal,
    // Keep this separate so auth/role gating can plug in here later.
    shouldShowAdminSidebar: isAdminPortal,
  };
}
