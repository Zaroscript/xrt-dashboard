import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { Client } from '@/components/clients/ClientList';
import type { UserRef, ServiceRef } from '@/types/client.types';
import { useUsersStore } from '@/stores/users/useUsersStore';
import { useClientsStore } from '@/stores';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

// Form data interface that flattens the nested user fields
interface ClientFormData {
  fName: string;
  lName: string;
  email: string;
  phone?: string;
  companyName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  taxId?: string;
  notes?: string;
  isActive: boolean;
}

interface EditClientModalProps {
  client: Client;
  services?: ServiceRef[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditClientModal({ 
  client, 
  services = [], 
  open, 
  onOpenChange, 
  onSuccess 
}: EditClientModalProps) {
  const { updateUser, updateClientServices } = useUsersStore();
  const { updateClient, updateClientApi } = useClientsStore();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formData, setFormData] = useState<ClientFormData>(() => ({
    fName: client.user?.fName || '',
    lName: client.user?.lName || '',
    email: client.user?.email || '',
    phone: client.user?.phone || '',
    companyName: client.companyName || '',
    address: {
      street: client.address?.street || '',
      city: client.address?.city || '',
      state: client.address?.state || '',
      zipCode: client.address?.zipCode || '',
    },
    taxId: client.taxId || '',
    notes: client.notes || '',
    isActive: client.isActive ?? true,
  }));

  useEffect(() => {
    if (client.services) {
      setSelectedServices(client.services.map(s => typeof s === 'string' ? s : s._id));
    }
  }, [client]);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested address fields
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent] as any),
          [child]: value,
        },
      }));
    } else {
      // Handle flat fields
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Update user info
      if (client.user && typeof client.user === 'object') {
        const { role, ...userWithoutRole } = client.user;
        await updateUser({
          ...userWithoutRole,
          fName: formData.fName,
          lName: formData.lName,
          email: formData.email,
          phone: formData.phone,
        });
      }

      // Update client info
      const updatedClient = {
        companyName: formData.companyName,
        address: formData.address,
        taxId: formData.taxId,
        notes: formData.notes,
        isActive: formData.isActive,
      };

      // Update client
      await updateClientApi(client._id, updatedClient);

      // Update services
      const updatedServices = services.filter(service => 
        selectedServices.includes(service._id)
      );
      
      await updateClientServices(client._id, updatedServices);

      toast({
        title: 'Success',
        description: 'Client updated successfully',
      });

      onOpenChange?.(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: 'Error',
        description: 'Failed to update client',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                name="fName"
                value={formData.fName || ''}
                onChange={handleChange}
                placeholder="First name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                name="lName"
                value={formData.lName || ''}
                onChange={handleChange}
                placeholder="Last name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder="Email"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Street</Label>
              <Input
                name="address.street"
                value={formData.address?.street || ''}
                onChange={handleChange}
                placeholder="Street address"
              />
            </div>
            
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                name="address.city"
                value={formData.address?.city || ''}
                onChange={handleChange}
                placeholder="City"
              />
            </div>
            
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                name="address.state"
                value={formData.address?.state || ''}
                onChange={handleChange}
                placeholder="State"
              />
            </div>
            
            <div className="space-y-2">
              <Label>ZIP Code</Label>
              <Input
                name="address.zipCode"
                value={formData.address?.zipCode || ''}
                onChange={handleChange}
                placeholder="ZIP code"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label className="block mb-2">Services</Label>
              <div className="space-y-2">
                {services.map(service => (
                  <div key={service._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`service-${service._id}`}
                      checked={selectedServices.includes(service._id)}
                      onCheckedChange={() => handleServiceToggle(service._id)}
                    />
                    <label
                      htmlFor={`service-${service._id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {service.name} (${service.price})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
