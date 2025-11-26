import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, TrendingUp, Percent, DollarSign, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useServicesStore } from "@/stores/services/useServicesStore";
import { clientsService } from "@/services/api/clientsService";
import { format } from "date-fns";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

interface AssignServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: any;
  onSuccess?: () => void;
  existingServices?: string[];
}

export function AssignServiceDialog({
  open,
  onOpenChange,
  client,
  onSuccess,
  existingServices = []
}: AssignServiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { services = [], fetchServices, loading: servicesLoading } = useServicesStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const allServices = Array.isArray(services) ? services.filter((service: any) => 
    service?.isActive !== false && !existingServices.includes(service._id)
  ) : [];
  
  const filteredServices = allServices.filter((service: any) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const [formData, setFormData] = useState({
    serviceId: "",
    customPrice: 0,
    discount: 0,
    isRecurring: false,
    startDate: "",
    endDate: "",
    notes: "",
    customFeatures: [] as string[],
    useCustomFeatures: false,
  });

  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    if (open && !isInitialized) {
      fetchServices().then(() => {
        setIsInitialized(true);
      }).catch(error => {
        console.error('Error fetching services:', error);
        toast({
          title: "Error",
          description: "Failed to load services. Please try again.",
          variant: "destructive",
        });
      });
    }
  }, [open, isInitialized, fetchServices, toast]);

  useEffect(() => {
    if (formData.serviceId && allServices.length > 0) {
      const service = allServices.find((s: any) => s._id === formData.serviceId);
      setSelectedService(service || null);
      
      if (service) {
        setFormData(prev => ({
          ...prev,
          customPrice: prev.customPrice === 0 ? ((service as any).price || 0) : prev.customPrice,
          customFeatures: service.features || []
        }));
      }
    }
  }, [formData.serviceId, allServices, formData.customPrice]);

  const discountAmount = (formData.customPrice * formData.discount) / 100;
  const finalPrice = formData.customPrice - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serviceId) {
      toast({
        title: "Error",
        description: "Please select a service.",
        variant: "destructive",
      });
      return;
    }

    if (formData.customPrice <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      await clientsService.assignService(client._id, {
        serviceId: formData.serviceId,
        customPrice: formData.customPrice,
        discount: formData.discount,
        isRecurring: formData.isRecurring,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        notes: formData.notes,
        customFeatures: formData.useCustomFeatures ? formData.customFeatures : undefined
      });
      
      // Parent component will show success toast
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error assigning service:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to assign service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (servicesLoading || !isInitialized) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading Services...</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">
              {servicesLoading ? 'Loading services...' : 'Initializing...'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Service</DialogTitle>
          <DialogDescription>
            Assign a service to {client.companyName || client.name} with custom pricing.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="serviceSearch">Search Services</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="serviceSearch"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Select Service *</Label>
            {filteredServices.length > 0 ? (
              <Select
                value={formData.serviceId}
                onValueChange={(value) => setFormData({...formData, serviceId: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {filteredServices.map((service: any) => (
                    <SelectItem key={service._id} value={service._id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{service.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {service.description ? service.description.substring(0, 50) : 'No description'}
                          {service.price ? ` - ${formatCurrency(service.price)}` : ''}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                {searchTerm ? 'No services found matching your search.' : 'No available services.'}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
            <h4 className="font-semibold text-sm">Pricing Details</h4>
            
            <div className="space-y-2">
              <Label htmlFor="customPrice">Price *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.customPrice}
                  onChange={(e) => setFormData({...formData, customPrice: parseFloat(e.target.value) || 0})}
                  className="pl-10"
                  placeholder="0.00"
                  required
                />
              </div>
              {selectedService?.price && (
                <p className="text-xs text-muted-foreground">
                  Standard price: {formatCurrency(selectedService.price)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.discount}
                  onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                  className="pl-10"
                  placeholder="0"
                />
              </div>
              {formData.discount > 0 && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Saving {formatCurrency(discountAmount)}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({...formData, isRecurring: checked as boolean})}
              />
              <Label htmlFor="isRecurring" className="font-normal cursor-pointer">
                Recurring service
              </Label>
            </div>
          </div>

          {/* Custom Features Section */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <Label htmlFor="useCustomFeaturesService" className="text-base font-semibold">Custom Features</Label>
              <Checkbox
                id="useCustomFeaturesService"
                checked={formData.useCustomFeatures}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  useCustomFeatures: checked as boolean,
                  customFeatures: checked ? (selectedService?.features || []) : []
                })}
              />
            </div>

            {formData.useCustomFeatures && selectedService && (
              <div className="space-y-2 pl-4 border-l-2 border-primary">
                <Label>Service Features (editable)</Label>
                <div className="space-y-2">
                  {formData.customFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...(formData.customFeatures || [])];
                          newFeatures[index] = e.target.value;
                          setFormData({...formData, customFeatures: newFeatures});
                        }}
                        placeholder="Feature description"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newFeatures = (formData.customFeatures || []).filter((_, i) => i !== index);
                          setFormData({...formData, customFeatures: newFeatures});
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        customFeatures: [...(formData.customFeatures || []), '']
                      });
                    }}
                  >
                    Add Feature
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Original features: {selectedService?.features?.length || 0} items
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this service assignment..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          {selectedService && formData.customPrice > 0 && (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-3">
              <h4 className="font-semibold text-sm">Pricing Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{formData.isRecurring ? 'Recurring' : 'One-time'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Price:</span>
                  <span className="font-medium">{formatCurrency(formData.customPrice)}</span>
                </div>
                {formData.discount > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({formData.discount}%):</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                    <div className="border-t border-border pt-2" />
                  </>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Final Price:</span>
                  <span className="text-primary">{formatCurrency(finalPrice)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.serviceId || formData.customPrice <= 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Service'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
