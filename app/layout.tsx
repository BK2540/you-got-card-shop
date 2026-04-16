// app/layout.tsx
import "@/styles/globals.css";
import { CartProvider } from "@/context/CartContext";
import { FilterProvider } from "@/context/FilterContext";
import AppShell from "@/components/AppShell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <CartProvider>
          <FilterProvider>
            <AppShell>{children}</AppShell>
          </FilterProvider>
        </CartProvider>
      </body>
    </html>
  );
}
