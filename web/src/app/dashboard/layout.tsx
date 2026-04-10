"use client";

import { DashboardSidebar, MobileCommandBar } from "@/components/dashboard/sidebar";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-background selection:bg-white/10 selection:text-white overflow-x-hidden">
      <DashboardSidebar />
      <main
        className={cn(
          "min-h-screen transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] bg-background",
          "pb-32 md:pb-0", // Generous space for mobile command bar
          sidebarCollapsed ? "md:pl-16" : "md:pl-64",
          "pl-0"
        )}
      >
        <div className="relative min-h-screen">
          {children}
        </div>
      </main>
      <MobileCommandBar />
    </div>
  );
}
