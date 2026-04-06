// app/layout.tsx
import "@/styles/globals.css";
import { CartProvider } from "@/context/CartContext";
import { FilterProvider } from "@/context/FilterContext";
import Navbar from "@/components/Navbar";

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
            <Navbar />
            <main className="pt-20">{children}</main>
          </FilterProvider>
        </CartProvider>
      </body>
    </html>
  );
}
