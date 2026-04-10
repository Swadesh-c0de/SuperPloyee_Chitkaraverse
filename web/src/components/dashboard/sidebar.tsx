"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore, useOnboardingStore } from "@/lib/store";
import {
  Brain,
  Network,
  Search,
  AlertTriangle,
  Activity,
  Map,
  Mic,
  Target,
  FileText,
  Users,
  BookOpen,
  ClipboardCheck,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_SECTIONS = [
  {
    label: "Observatory",
    items: [
      { href: "/dashboard", icon: Network, label: "Constellation" },
      { href: "/dashboard/query", icon: Search, label: "Query Console" },
      { href: "/dashboard/signals", icon: Activity, label: "Sync History" },
      { href: "/dashboard/territory", icon: Map, label: "Territory Map" },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/tools/meeting-brain", icon: Mic, label: "Meeting Brain" },
      { href: "/tools/customer-intelligence", icon: Users, label: "Customer Intel" },
      { href: "/tools/onboarding-copilot", icon: BookOpen, label: "Onboarding Copilot" },
      { href: "/tools/sop-autopilot", icon: ClipboardCheck, label: "SOP Autopilot" },
      { href: "/tools/wiki-health", icon: HeartPulse, label: "Wiki Health" },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { company } = useOnboardingStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-white/5 bg-background transition-all duration-300 md:flex",
        sidebarCollapsed ? "md:w-16" : "md:w-64"
      )}
    >
      <div className="flex h-16 flex-col justify-center px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <Brain className="h-4.5 w-4.5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="text-base font-bold tracking-tight text-white uppercase leading-none truncate max-w-[140px]">
                {company.name || "Cortex"}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mt-1">Instrument v4.2</span>
            </motion.div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-8">
            {!sidebarCollapsed && (
              <div className="mb-3 px-3 label-sm text-white/20">
                {section.label}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                const NavAnchor = (
                  <motion.div
                    whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.05)" }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 group relative cursor-pointer",
                      isActive
                        ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                        : "text-white/40 hover:text-white",
                      sidebarCollapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className={cn("h-4.5 w-4.5 shrink-0 transition-all duration-300", isActive ? "text-white drop-shadow-[0_0_8px_white]" : "text-white/40 group-hover:text-white")} />
                    {!sidebarCollapsed && (
                      <span className="label-sm truncate">{item.label}</span>
                    )}
                    {isActive && (
                      <motion.div 
                        layoutId="active-nav"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full shadow-[0_0_12px_white]" 
                      />
                    )}
                  </motion.div>
                );

                const navLink = (
                  <Link key={item.href} href={item.href} className="block no-underline">
                    {NavAnchor}
                  </Link>
                );

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger render={navLink} />
                      <TooltipContent side="right" className="bg-white text-background border-none text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return navLink;
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/5 p-3 space-y-2">
        {!sidebarCollapsed && (
          <Link
            href="/dashboard/feed"
            className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white/60 transition-all hover:bg-white/10 hover:text-white hover:scale-[1.01]"
          >
            <Plus className="h-4 w-4" />
            <span className="label-sm">Feed Sources</span>
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-md p-2 text-white/20 hover:bg-white/5 hover:text-white transition-all"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}

export function MobileCommandBar() {
  const pathname = usePathname();
  const mobileItems = NAV_SECTIONS[0].items; // Core items for mobile

  return (
    <div className="fixed bottom-10 left-1/2 z-50 w-[min(92%,420px)] -translate-x-1/2 md:hidden">
      <div className="glass-panel relative flex items-center justify-between gap-1 overflow-hidden border border-white/10 p-2.5 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="relative flex h-14 flex-1 items-center justify-center rounded-3xl transition-all duration-300">
              <motion.div
                whileTap={{ scale: 0.85, y: -4 }}
                className={cn(
                   "flex flex-col items-center justify-center gap-1.5 transition-all duration-500",
                   isActive ? "text-white" : "text-white/20 hover:text-white/40"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-all duration-500", isActive && "drop-shadow-[0_0_15px_rgba(255,255,255,0.9)] scale-110")} />
                <span className="text-[8px] font-black uppercase tracking-[0.25em]">{item.label.split(' ')[0]}</span>
              </motion.div>
              {isActive && (
                <motion.div
                  layoutId="mobile-active-pill"
                  className="absolute inset-0 bg-white/10 rounded-[1.8rem] -z-10 border border-white/5"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
