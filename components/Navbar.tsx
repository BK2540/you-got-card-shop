"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/cards" },
];

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const { user, isAuthenticated, signOut } = useAuth();
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);

  const userInitials = useMemo(() => {
    if (!user?.name) {
      return "U";
    }

    return user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [user]);

  const closeMenus = () => {
    setOpenMobileMenu(false);
    setOpenProfileMenu(false);
  };

  return (
    <nav className="fixed top-0 z-30 w-full  px-4 py-3 backdrop-blur-2xl sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link
          href="/"
          onClick={closeMenus}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 font-bold text-white">
            G
          </span>
          <span className="text-sm font-semibold tracking-wide text-white">
            GOT Card Shop
          </span>
        </Link>

        <div className="hidden items-center justify-center lg:flex">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/cart"
            className="relative rounded-full border border-white/10 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/10 hover:text-white"
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {!isAuthenticated ? (
            <>
              <Link
                href="/signin"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/10 hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Sign up
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenProfileMenu((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white transition hover:bg-white/10"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold text-white">
                  {userInitials}
                </span>
                <span className="max-w-[120px] truncate text-left">
                  {user?.name || user?.email}
                </span>
              </button>

              {openProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl">
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="text-sm font-semibold text-white">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={closeMenus}
                    className="block w-full px-4 py-3 text-left text-sm text-gray-100 transition hover:bg-white/10"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      closeMenus();
                      router.push("/");
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-red-300 transition hover:bg-red-500/10"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpenMobileMenu((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white lg:hidden"
          aria-label="Toggle navigation"
        >
          {openMobileMenu ? "✕" : "☰"}
        </button>
      </div>

      {openMobileMenu && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/65 p-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={closeMenus}
                className="rounded-xl px-3 py-2 text-sm text-gray-200 transition hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
            <Link
              href="/cart"
              onClick={closeMenus}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-200"
            >
              Cart ({itemCount})
            </Link>

            {!isAuthenticated ? (
              <>
                <Link
                  href="/signin"
                  onClick={closeMenus}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-200"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={closeMenus}
                  className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-sm font-semibold text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={closeMenus}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-200"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    closeMenus();
                    router.push("/");
                  }}
                  className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-left text-sm text-red-300"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
