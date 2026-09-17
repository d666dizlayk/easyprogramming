"use client";
import Sidebar from "@/app/components/Sidebar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#07080b] text-white">
      <Sidebar />
      <main className="min-h-screen ml-[240px]">{children}</main>
    </div>
  );
}
