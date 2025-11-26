import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddClientForm } from './AddClientForm';
import { useAppDispatch } from '@/store/store';
import { addNotification } from '@/store/slices/notificationsSlice';

export const AddClientModal = ({ onClientAdded }: { onClientAdded?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useAppDispatch();

  const handleSuccess = () => {
    setIsOpen(false);
    dispatch(addNotification({
      title: 'New Client Added',
      description: 'A new client has been added successfully.',
    }));
    if (onClientAdded) onClientAdded();
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Add Client
      </Button>

      <AnimatePresence>
        {isOpen && (
          <AddClientForm 
            onSuccess={handleSuccess} 
            onCancel={() => setIsOpen(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AddUserModal;
