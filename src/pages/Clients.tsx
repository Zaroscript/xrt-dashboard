import { useState } from 'react';
import { AddClientDialog } from '@/components/clients/AddClientDialog';
import { ClientsView } from './clients/ClientsView';

const Clients = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleClientAdded = () => {
    setIsAddDialogOpen(false);
  };

  return (
    <>
      <ClientsView />
      <AddClientDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onClientAdded={handleClientAdded}
      />
    </>
  );
};

export default Clients;