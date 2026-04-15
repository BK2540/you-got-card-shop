// app/layout.tsx
import "@/styles/globals.css";
import { CartProvider } from "@/context/CartContext";
import { FilterProvider } from "@/context/FilterContext";
import Navbar from "@/components/Navbar";
import PageBackground from "@/components/Background";

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
            <div className="mt-12">
              <PageBackground>{children}</PageBackground>
            </div>
          </FilterProvider>
        </CartProvider>
      </body>
    </html>
  );
}
