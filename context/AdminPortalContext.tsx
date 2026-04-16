"use client";

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";
import { type AdminTab } from "@/types";

type AdminPortalContextValue = {
  tab: AdminTab;
  setTab: Dispatch<SetStateAction<AdminTab>>;
};

const AdminPortalContext = createContext<AdminPortalContextValue | null>(null);

export function AdminPortalProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<AdminTab>("dashboard");

  const value = useMemo(
    () => ({
      tab,
      setTab,
    }),
    [tab],
  );

  return (
    <AdminPortalContext.Provider value={value}>
      {children}
    </AdminPortalContext.Provider>
  );
}

export function useAdminPortal() {
  const context = useContext(AdminPortalContext);

  if (!context) {
    throw new Error("useAdminPortal must be used within AdminPortalProvider");
  }

  return context;
}
