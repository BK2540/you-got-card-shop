"use client";

import { useContext } from "react";
import { CartContext } from "@/context/CartContext";
import { FilterContext } from "@/context/FilterContext";
import Link from "next/link";

const Navbar = () => {
  const { cart } = useContext(CartContext);
  const { search, setSearch } = useContext(FilterContext);

  return (
    <nav className="fixed top-0 w-full bg-black px-8 py-4 flex justify-between">
      <Link href="/" className="text-orange-500 font-bold">
        THE ATHLETIC
      </Link>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="px-4 py-1 text-black"
      />

      <div>Cart ({cart.length})</div>
    </nav>
  );
};

export default Navbar;
