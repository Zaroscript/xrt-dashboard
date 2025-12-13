import { motion } from "framer-motion";
import { Search, Moon, Sun, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth/useAuthStore";
import type { User } from "@/stores/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navLogo } from "@/config/constants";
import { getAvatarUrl, getUserInitials } from "@/utils/avatarUtils";

interface HeaderProps {
  onThemeToggle: () => void;
  theme: string | undefined;
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onThemeToggle,
  theme,
  sidebarCollapsed,
  onSidebarToggle,
}) => {
  const navigate = useNavigate();
  const { logout: logoutUser, user } = useAuthStore();

  // Provide default user object if not authenticated
  const safeUser: User = user || {
    _id: "guest",
    email: "guest@example.com",
    fName: "Guest",
    lName: "User",
    role: "client",
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    refreshTokens: [],
  };

  const handleLogout = async () => {
    try {
      if (logoutUser) {
        await logoutUser();
      }
      navigate("/dashboard");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <motion.header
      className="h-16 bg-card border-b border-border glass-card flex items-center justify-between px-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Left section */}
      <div className="flex items-center space-x-4">
        <div className="p-1 bg-gradient-to-br from-primary/10 to-transparent rounded-lg shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_25px_-5px_rgba(0,0,0,0.3)]">
          <img
            src={navLogo}
            alt="Xrt-tech"
            className="w-10 h-10 rounded-md object-contain shadow-sm"
          />
        </div>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search users, tickets, projects..."
            className="pl-10 w-80 bg-background/50 border-border/50 focus:bg-background transition-smooth"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-4">
        {/* Theme toggle */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onThemeToggle}
            className="relative overflow-hidden"
          >
            <motion.div
              animate={{ rotate: theme === "dark" ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {theme === "dark" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </motion.div>
          </Button>
        </motion.div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={getAvatarUrl(safeUser.avatar)}
                    alt={
                      `${safeUser.fName || ""} ${
                        safeUser.lName || ""
                      }`.trim() || "User"
                    }
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {safeUser.initials ||
                      getUserInitials(
                        safeUser.fName,
                        safeUser.lName,
                        safeUser.email
                      )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 glass-card"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {`${safeUser.fName || ""} ${safeUser.lName || ""}`.trim() ||
                    "Guest User"}
                </p>
                <span className="text-sm text-muted-foreground">
                  {safeUser.email || "guest@example.com"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/dashboard/settings")}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
};
