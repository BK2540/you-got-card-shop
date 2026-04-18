// app/layout.tsx
import "@/styles/globals.css";
import { CartProvider } from "@/context/CartContext";
import { FilterProvider } from "@/context/FilterContext";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/context/AuthContext";

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
