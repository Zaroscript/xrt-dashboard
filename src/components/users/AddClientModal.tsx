import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddClientDialog } from '@/components/clients/AddClientDialog';

export const AddClientModal = ({ onClientAdded }: { onClientAdded?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClientAdded = () => {
    setIsOpen(false);
    if (onClientAdded) {
      onClientAdded();
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Add Client
      </Button>

      <AddClientDialog 
        open={isOpen} 
        onOpenChange={setIsOpen}
        onClientAdded={handleClientAdded}
      />
    </>
  );
};

export default AddClientModal;
