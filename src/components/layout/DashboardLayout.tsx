import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import useSettingsStore from '@/stores/settings/useSettingsStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();

  // Force collapsed state on mobile
  const effectiveCollapsed = isMobile || sidebarCollapsed;

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
      <div className="min-h-screen bg-background">
        <div className="flex h-screen overflow-hidden">
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`${effectiveCollapsed ? 'w-20' : 'w-72'} transition-all duration-300 flex-shrink-0 flex flex-col border-r border-border h-full`}
          >
            <Sidebar 
              collapsed={effectiveCollapsed} 
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />
          </motion.div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              onThemeToggle={handleThemeToggle} 
              theme={theme}
              sidebarCollapsed={effectiveCollapsed}
              onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            
            <main className="flex-1 overflow-y-auto bg-background p-6 relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-7xl mx-auto"
              >
                {children}
              </motion.div>
            </main>
          </div>
        </div>
      </div>
  );
};