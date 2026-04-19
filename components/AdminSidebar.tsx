"use client";

import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalGroceryStoreOutlinedIcon from "@mui/icons-material/LocalGroceryStoreOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import { AdminTab } from "@/types";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

type AdminSidebarProps = {
  tab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
};

const AdminSidebar = ({ tab, onTabChange }: AdminSidebarProps) => {
  const { signOut } = useAuth();
  const router = useRouter();
  const itemClassName = (isActive: boolean) =>
    `flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition w-full ${
      isActive ? "bg-primary text-white" : "text-white hover:bg-primary/50"
    }`;

  return (
    <aside className="min-h-screen min-w-64 space-y-2 border-r border-white/10 bg-surface/80 px-4 pt-12 text-base backdrop-blur-lg flex flex-col justify-between">
      <div className="flex flex-col justify-start">
        <p className="px-3 text-sm font-bold uppercase tracking-[0.3em] text-primary">
          Admin Portal
        </p>
        <div className="flex flex-col items-start gap-4 mt-8">
          <button
            type="button"
            className={itemClassName(tab === "dashboard")}
            onClick={() => onTabChange("dashboard")}
          >
            <DashboardOutlinedIcon />
            Dashboard
          </button>
          <button
            type="button"
            className={itemClassName(tab === "home")}
            onClick={() => onTabChange("home")}
          >
            <DashboardOutlinedIcon />
            Home
          </button>
          <button
            type="button"
            className={itemClassName(tab === "inventory")}
            onClick={() => onTabChange("inventory")}
          >
            <Inventory2OutlinedIcon />
            Inventory
          </button>

          <button
            type="button"
            className={itemClassName(tab === "orders")}
            onClick={() => onTabChange("orders")}
          >
            <LocalGroceryStoreOutlinedIcon />
            Orders
          </button>

          <button
            type="button"
            className={itemClassName(tab === "customers")}
            onClick={() => onTabChange("customers")}
          >
            <PersonOutlinedIcon />
            Customers
          </button>
        </div>
      </div>

      <div className="mb-10 flex flex-col gap-4">
        <Link href={"/"}>
          <button
            type="button"
            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition w-full"
          >
            <PersonOutlinedIcon />
            Back to shop
          </button>
        </Link>

        <button
          type="button"
          className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition w-full "
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
        >
          <PersonOutlinedIcon />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
