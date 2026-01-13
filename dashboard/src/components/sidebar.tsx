"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FolderKanban,
  LayoutDashboard,
  GitBranch,
  Lightbulb,
  Activity,
  Settings,
  Sparkles,
} from "lucide-react";

/**
 * Navigation items for the sidebar
 * Each item has a name, URL path, and icon
 */
const navigation = [
  { name: "Apps", href: "/apps", icon: FolderKanban },
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Funnels", href: "/funnels", icon: GitBranch },
  { name: "Insights", href: "/insights", icon: Lightbulb },
  { name: "Events", href: "/events", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

/**
 * Sidebar component - fixed left navigation
 * 
 * Features:
 * - Logo at top
 * - Navigation links with icons
 * - Highlights active page
 * - Shows connection status at bottom
 */
export function Sidebar() {
  // usePathname() returns current URL path (e.g., "/funnels")
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-800 bg-slate-950">
      {/* Logo Section */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">Behavior</h1>
          <p className="text-xs text-slate-400">Analytics</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          // Check if this link is the current page
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                // Base styles (always applied)
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                // Conditional styles based on active state
                isActive
                  ? "bg-violet-600/20 text-violet-400"  // Active: purple background
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"  // Inactive: gray, hover effect
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Connection Status */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-4">
        <div className="rounded-lg bg-gradient-to-r from-violet-600/10 to-indigo-600/10 p-3">
          <p className="text-xs text-slate-400">Connected to</p>
          <p className="mt-1 truncate text-sm font-medium text-white">
            Railway API
          </p>
        </div>
      </div>
    </aside>
  );
}

