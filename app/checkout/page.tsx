"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/payment");
  }, [router]);

  return (
    <main className="px-6 py-10 text-white lg:px-16">
      <p className="text-gray-300">Redirecting to payment...</p>
    </main>
  );
}
