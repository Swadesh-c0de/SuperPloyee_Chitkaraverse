"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen">
      <DashboardSidebar />
      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-60"
        )}
      >
        {children}
      </main>
    </div>
  );
}
