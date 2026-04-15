"use client";

import { useContext } from "react";
import { CartContext } from "@/context/CartContext";
import Link from "next/link";

const Navbar = () => {
  const { cart } = useContext(CartContext);

  return (
    <nav className="fixed top-0 w-full bg-black/10 px-8 py-4 flex justify-between z-10 backdrop-blur-2xl">
      <Link href="/" className="text-orange-500 font-bold">
        GOT
      </Link>

      <div className="flex justify-end items-center gap-4">
        <div>Cart ({cart.length})</div>
      </div>
    </nav>
  );
};

export default Navbar;
