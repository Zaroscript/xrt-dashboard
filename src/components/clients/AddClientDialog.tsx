import { useState } from 'react';
import { UserPlus, Mail, Phone, Briefcase, MapPin, Globe, FileText, Building2, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useClientsStore } from '@/stores';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Address = {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

const clientFormSchema = z.object({
  // User fields
  email: z.string().email('Please enter a valid email address'),
  fName: z.string().min(2, 'First name must be at least 2 characters'),
  lName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  confirmPassword: z.string().optional(),
  
  // Company fields
  companyName: z.string().min(2, 'Company name is required'),
  taxId: z.string().optional(),
  
  // Address fields
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }),
  
  // Additional fields
  oldWebsite: z.string().url('Please enter a valid URL').or(z.literal('')),
  notes: z.string().optional(),
  
  // System fields
  isActive: z.boolean().default(true),
}).refine((data) => !data.password || data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded?: () => void;
}

export function AddClientDialog({ open, onOpenChange, onClientAdded }: AddClientDialogProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { createClient: createClientStore, loading } = useClientsStore();
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      email: '',
      fName: '',
      lName: '',
      phone: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      taxId: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      oldWebsite: '',
      notes: '',
      isActive: true,
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      // Generate password if not provided
      const generatedPassword = data.password || `Temp${Date.now()}${Math.random().toString(36).slice(2)}`;
      const wasPasswordGenerated = !data.password;
      
      // Prepare the client data in the format expected by the backend
      const clientData = {
        // User information (will be used to create or find user)
        email: data.email,
        fName: data.fName,
        lName: data.lName || '',
        phone: data.phone || '(555) 000-0000', // Provide default valid US phone number
        password: generatedPassword, // Use provided password or generated temp
        
        // Company information
        companyName: data.companyName,
        taxId: data.taxId,
        
        // Address (only include if at least one field is provided)
        ...(data.address?.street || data.address?.city || data.address?.state || 
            data.address?.country || data.address?.postalCode ? {
          businessLocation: {
            ...(data.address?.street && { address: data.address.street }),
            ...(data.address?.city && { city: data.address.city }),
            ...(data.address?.state && { state: data.address.state }),
            ...(data.address?.country && { country: data.address.country }),
            ...(data.address?.postalCode && { 
              zipCode: data.address.postalCode,
              postalCode: data.address.postalCode // Include both for compatibility
            })
          }
        } : {}),
        
        // Notes (only include if provided)
        ...(data.notes && { notes: data.notes }),
        
        // Status - only include isActive, not status
        isActive: data.isActive !== false,
      };

    console.log('Submitting client data:', clientData);
    await createClientStore(clientData as any);
      
    // Show success message with password if it was auto-generated
    toast({
      title: 'Success',
      description: wasPasswordGenerated 
        ? (
            <div className="space-y-2">
              <p>Client added successfully!</p>
              <div className="mt-2 p-2 bg-muted rounded">
                <p className="text-xs font-medium">Auto-generated password:</p>
                <p className="font-mono text-sm font-bold">{generatedPassword}</p>
                <p className="text-xs text-muted-foreground mt-1">Please save this password and share it with the client.</p>
              </div>
            </div>
          )
        : 'Client added successfully!',
      duration: wasPasswordGenerated ? 10000 : 3000, // Show longer if password was generated
    });
    
    // Reset form and close dialog
    form.reset();
    onOpenChange(false);
    
    // Notify parent component
    if (onClientAdded) {
      onClientAdded();
    }
    } catch (error: any) {
      console.error('Error creating client:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to add client. Please try again.';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };
  
  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <DialogTitle>Add New Client</DialogTitle>
          </div>
          <DialogDescription>
            Add a new client to your system. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="fName">First Name *</Label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="fName"
                    placeholder="John"
                    className="pl-10"
                    {...form.register('fName')}
                  />
                </div>
                {form.formState.errors.fName && (
                  <p className="text-sm text-red-500">{form.formState.errors.fName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lName">Last Name *</Label>
                <Input
                  id="lName"
                  placeholder="Doe"
                  {...form.register('lName')}
                />
                {form.formState.errors.lName && (
                  <p className="text-sm text-red-500">{form.formState.errors.lName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    className="pl-10"
                    {...form.register('email')}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(123) 456-7890"
                    className="pl-10"
                    {...form.register('phone')}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password (Optional)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Leave empty for auto-generated"
                    className="pl-10 pr-10"
                    {...form.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">Min 8 characters. Auto-generated if empty.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    className="pl-10 pr-10"
                    {...form.register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
            
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Company Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="companyName"
                    placeholder="Acme Inc."
                    className="pl-10"
                    {...form.register('companyName')}
                  />
                </div>
                {form.formState.errors.companyName && (
                  <p className="text-sm text-red-500">{form.formState.errors.companyName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  placeholder="XX-XXXXXXX"
                  {...form.register('taxId')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="oldWebsite">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="oldWebsite"
                    type="url"
                    placeholder="https://example.com"
                    className="pl-10"
                    {...form.register('oldWebsite')}
                  />
                </div>
                {form.formState.errors.oldWebsite && (
                  <p className="text-sm text-red-500">{form.formState.errors.oldWebsite.message}</p>
                )}
              </div>
            </div>
            
            {/* Address Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-medium">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address.street">Street Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="address.street"
                      placeholder="123 Main St"
                      className="pl-10"
                      {...form.register('address.street')}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address.city">City</Label>
                  <Input
                    id="address.city"
                    placeholder="New York"
                    {...form.register('address.city')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address.state">State/Province</Label>
                  <Input
                    id="address.state"
                    placeholder="NY"
                    {...form.register('address.state')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address.postalCode">Postal Code</Label>
                  <Input
                    id="address.postalCode"
                    placeholder="10001"
                    {...form.register('address.postalCode')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address.country">Country</Label>
                  <Input
                    id="address.country"
                    placeholder="United States"
                    {...form.register('address.country')}
                  />
                </div>
              </div>
            </div>
            
            {/* Additional Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-medium">Additional Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes about this client..."
                    className="pl-10 min-h-[100px]"
                    {...form.register('notes')}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  {...form.register('isActive')}
                />
                <Label htmlFor="isActive" className="text-sm font-medium leading-none">
                  Active Client
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                'Add Client'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
