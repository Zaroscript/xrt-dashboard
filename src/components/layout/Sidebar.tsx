import { useState } from "react";
import { motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Crown,
  Boxes,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth/useAuthStore";
import { navLogo } from "@/config/constants";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Subscribers", href: "/dashboard/subscribers", icon: Crown },
  { name: "Services", href: "/dashboard/services", icon: Boxes },
  { name: "Plans & Pricing", href: "/dashboard/plans", icon: CreditCard },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const isMobile = useIsMobile();

  // Force collapsed state on mobile
  const effectiveCollapsed = isMobile || collapsed;

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!effectiveCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-gradient-to-br from-primary/10 to-transparent rounded-lg shadow">
                <img
                  src={navLogo}
                  alt="Xrt-tech"
                  className="w-10 h-10 rounded-md object-contain"
                />
              </div>
              <span className="text-lg font-semibold">XRT Dashboard</span>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <img
                src={navLogo}
                alt="Xrt-tech"
                className="w-10 h-10 rounded-md object-contain"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            {effectiveCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </Button>
        </div>
      </div>

      {/* Scrollable navigation area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
        {navigation.map((item, index) => {
          const isExact = location.pathname === item.href;
          const isNested = location.pathname.startsWith(item.href + "/");
          const isActive = isExact || (item.href !== "/dashboard" && isNested);

          const link = (
            <NavLink
              to={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg transition-smooth group relative overflow-hidden",
                effectiveCollapsed ? "justify-center p-2" : "p-3",
                isActive
                  ? "bg-gold-gradient text-primary-foreground shadow-gold ring-1 ring-primary/30"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {/* Active background shimmer */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-gold-gradient rounded-lg"
                  layoutId="activeTab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Active left indicator bar */}
              {isActive && (
                <motion.div
                  className="absolute left-0 top-0 h-full w-1 bg-primary"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}

              <div className="relative z-10 flex items-center space-x-3">
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-smooth",
                    isActive
                      ? "text-primary-foreground"
                      : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground",
                    "group-hover:scale-105"
                  )}
                />
                {!effectiveCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "font-medium transition-smooth",
                      isActive
                        ? "text-primary-foreground"
                        : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <span className="group-hover:translate-x-0.5 inline-block transition-transform">
                      {item.name}
                    </span>
                  </motion.span>
                )}

                {/* Optional counters can be added back when needed */}
              </div>

              {/* Hover effect */}
              <motion.div
                className="absolute inset-0 bg-sidebar-accent/60 rounded-lg opacity-0 group-hover:opacity-100 transition-smooth"
                whileHover={{ scale: 1.01 }}
              />
            </NavLink>
          );

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              ) : (
                link
              )}
            </motion.div>
          );
        })}
      </div>

      {/* User profile at the bottom */}
      {/* User profile */}
      <div className="flex-shrink-0 p-4 border-t border-border">
        {!effectiveCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-medium text-primary">
                {user?.fName?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.fName || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-medium text-primary">
                {user?.fName?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
