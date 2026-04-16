"use client";

import Image from "next/image";
import { ReactNode } from "react";
import bg from "@/public/ball.png";

export default function PageBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden z-0 flex flex-col items-center">
      {/* 🌑 BASE */}
      <div className="pointer-events-none absolute inset-0 bg-black" />

      {/* 🔥 ORANGE ORB (MAIN LIGHT) */}
      <div className="pointer-events-none fixed inset-0 top-16 flex items-center justify-center">
        {/* <div className="w-[700px] h-[700px] rounded-full bg-primary opacity-60 blur-[120px]" /> */}
        <Image
          src={bg}
          alt="bg"
          width={740}
          // height={700}
          className="opacity-40 blur-[50px]"
        />
      </div>

      {/* 🔥 HORIZONTAL LIGHT BANDS */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-full w-full bg-[repeating-linear-gradient(to_bottom,rgba(255,120,0,0.25)_0px,rgba(255,120,0,0.25)_6px,transparent_6px,transparent_40px)] blur-[10px]" />
      </div>

      {/* 🎞 GRAIN / NOISE OVERLAY */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:3px_3px]" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 w-full xl:max-w-[1024px] 2xl:max-w-[1280px]">
        {children}
      </div>
    </div>
  );
}
