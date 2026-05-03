// app/layout.tsx
import "@/styles/globals.css";
import { CartProvider } from "@/context/CartContext";
import { FilterProvider } from "@/context/FilterContext";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "You Got Card Shop",
    template: "%s | You Got Card Shop",
  },
  description: "Sports card shop",
  icons: {
    icon: "/ball.png",
    shortcut: "/ball.png",
    apple: "/ball.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <AuthProvider>
          <CartProvider>
            <FilterProvider>
              <AppShell>{children}</AppShell>
            </FilterProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
