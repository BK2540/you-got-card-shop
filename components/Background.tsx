import Image from "next/image";
import { ReactNode } from "react";
import bg from "@/public/ball.png";

export default function PageBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-0 flex min-h-screen flex-col items-center overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-black" />

      {/* ORB */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-[720px] h-[720px] rounded-full bg-orange-500/20 blur-[400px]" />
        <Image
          src={bg}
          alt="bg"
          width={720}
          className="opacity-80 blur-[20px]"
          priority
        />
      </div>

      {/* HORIZONTAL BANDS */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-full w-full bg-[repeating-linear-gradient(to_bottom,rgba(255,120,0,0.25)_0px,rgba(255,120,0,0.25)_6px,transparent_6px,transparent_40px)] blur-[8px]" />
      </div>

      {/* SIDE DARK MASK - ตัวนี้ช่วยกดเส้นส้มซ้าย/ขวาโดยตรง */}
      <div className="page-side-mask" />

      {/* MAIN VIGNETTE */}
      <div className="fractal-glass-vignette" />

      {/* NOISE */}
      <div className="absolute inset-0 pointer-events-none grain" />

      <div className="relative z-10 w-full xl:max-w-[1024px] 2xl:max-w-[1280px]">
        {children}
      </div>
    </div>
  );
}
