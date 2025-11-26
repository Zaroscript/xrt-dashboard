import { motion } from 'framer-motion';
import { Crown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientEmptyStateProps {
  searchTerm: string;
  onAddClient?: () => void;
}

export const ClientEmptyState = ({ searchTerm, onAddClient }: ClientEmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-12 px-4"
  >
    <div className="bg-muted/50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
      <Crown className="w-10 h-10 text-muted-foreground" />
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-2">
      {searchTerm ? 'No matching clients' : 'No clients yet'}
    </h3>
    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
      {searchTerm 
        ? 'No clients match your search. Try different keywords.'
        : 'Get started by adding your first client to the system.'
      }
    </p>
    {!searchTerm && onAddClient && (
      <Button onClick={onAddClient} className="gap-2">
        <Plus className="w-4 h-4" />
        Add Your First Client
      </Button>
    )}
  </motion.div>
);

export default ClientEmptyState;
