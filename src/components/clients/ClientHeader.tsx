import { motion } from 'framer-motion';
import { Crown, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ClientHeaderProps {
  onExport: () => void;
  isExporting: boolean;
  onAddClient?: () => void;
}

export const ClientHeader = ({
  onExport,
  isExporting,
  onAddClient,
}: ClientHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
    >
    <div>
      <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
          <Crown className="w-6 h-6 text-primary" />
        </div>
        <span>Premium Clients</span>
      </h1>
      <p className="text-muted-foreground mt-2 ml-11">Manage your premium client accounts</p>
    </div>
    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
      <Button 
        variant="outline" 
        onClick={onExport}
        disabled={isExporting}
        className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all duration-200"
      >
        {isExporting ? (
          <>
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </>
        )}
      </Button>
      {onAddClient && (
        <Button onClick={onAddClient} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-200 shadow-lg hover:shadow-xl">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      )}
    </div>
    </motion.div>
  );
};

export default ClientHeader;
