import { useState, useEffect } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useClientsStore } from "@/stores/clients/useClientsStore";
import {
  CalendarIcon,
  Plus,
  X,
  Globe,
  MapPin,
  Building,
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define the form schema
const formSchema = z
  .object({
    // Account Information
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    status: z
      .enum(["active", "inactive", "pending"] as const)
      .default("active"),
    accountType: z
      .enum(["admin", "manager", "staff"] as const)
      .default("staff"),
    hasOldWebsite: z.boolean().default(false),

    // Personal Information
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    phoneNumber: z.string().min(10, "Please enter a valid phone number"),
    position: z.string().optional(),

    // Business Information
    businessName: z.string().min(2, "Business name is required"),
    businessType: z.string().min(2, "Business type is required"),
    businessRegistrationNumber: z.string().optional(),
    taxId: z.string().optional(),

    // Contact Information
    contactPerson: z.string().min(2, "Contact person is required"),
    alternativeContact: z.string().optional(),
    website: z
      .string()
      .url("Please enter a valid URL")
      .or(z.literal(""))
      .optional(),

    // Address Information
    address: z.object({
      street: z.string().min(1, "Street address is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      country: z.string().min(1, "Country is required"),
      postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid postal code"),
    }),

    // Billing Information
    billingAddress: z
      .object({
        sameAsPhysical: z.boolean().default(true),
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
      })
      .default({ sameAsPhysical: true }),

    // Subscription Details
    subscription: z.object({
      plan: z.string().min(1, "Please select a plan"),
      billingCycle: z
        .enum(["monthly", "quarterly", "annually"] as const)
        .default("monthly"),
      startDate: z.date().default(() => new Date()),
      paymentMethod: z
        .enum(["credit_card", "bank_transfer", "paypal"] as const)
        .default("credit_card"),
    }),

    // Additional Information
    notes: z.string().optional(),
    referralSource: z.string().optional(),
    marketingOptIn: z.boolean().default(false),

    // System Fields
    isClient: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
    lastActive: z.date().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      // If billing address is different, require all billing address fields
      if (data.billingAddress && !data.billingAddress.sameAsPhysical) {
        return (
          data.billingAddress.street &&
          data.billingAddress.city &&
          data.billingAddress.state &&
          data.billingAddress.country &&
          data.billingAddress.postalCode
        );
      }
      return true;
    },
    {
      message:
        "All billing address fields are required when different from physical address",
      path: ["billingAddress"],
    }
  );

// Define form values type
type FormValues = z.infer<typeof formSchema>;

// Business types for dropdown
const BUSINESS_TYPES = [
  "Restaurant",
  "Cafe",
  "Bakery",
  "Food Truck",
  "Catering",
  "Grocery",
  "Other",
];

// Subscription plans
const SUBSCRIPTION_PLANS = [
  { id: "basic", name: "Basic", price: "$29/month" },
  { id: "pro", name: "Pro", price: "$79/month" },
  { id: "enterprise", name: "Enterprise", price: "$199/month" },
];

// Referral sources
const REFERRAL_SOURCES = [
  "Google Search",
  "Social Media",
  "Word of Mouth",
  "Email Campaign",
  "Other",
];

interface AddClientFormProps {
  onSuccess?: () => void;
  onCancel: () => void;
  onFormStateChange?: (state: any) => void;
}

export const AddClientForm = ({
  onSuccess,
  onCancel,
  onFormStateChange,
}: AddClientFormProps & { onFormStateChange?: (state: any) => void }) => {
  const { createClient, loading: isCreatingClient } = useClientsStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Account Information
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      status: "active",
      accountType: "staff",

      // Personal Information
      firstName: "",
      lastName: "",
      phoneNumber: "",
      position: "",

      // Business Information
      businessName: "",
      businessType: "",
      businessRegistrationNumber: "",
      taxId: "",

      // Contact Information
      contactPerson: "",
      alternativeContact: "",
      website: "",

      // Address Information
      address: {
        street: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
      },

      // Billing Information
      billingAddress: {
        sameAsPhysical: true,
        street: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
      },

      // Subscription Details
      subscription: {
        plan: "basic",
        billingCycle: "monthly",
        startDate: new Date(),
        paymentMethod: "credit_card",
      },

      // Additional Information
      notes: "",
      referralSource: "",
      marketingOptIn: false,

      // System Fields
      isClient: true,
      lastActive: new Date(),
    },
  });

  // Expose form state to parent
  useEffect(() => {
    if (onFormStateChange) {
      onFormStateChange(form.formState);
    }
  }, [form.formState, onFormStateChange]);

  // Watch form values
  const sameAsPhysical = useWatch({
    control: form.control,
    name: "billingAddress.sameAsPhysical",
    defaultValue: true,
  }) as boolean;

  const onSubmit = async (values: FormValues) => {
    // Manually validate required fields
    const requiredFields = ["firstName", "lastName", "email", "phoneNumber"];
    const missingFields = requiredFields.filter(
      (field) => !values[field as keyof FormValues]
    );

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      toast({
        title: "Missing Information",
        description: `Please fill in all required fields: ${missingFields.join(
          ", "
        )}`,
        variant: "destructive",
      });
      return;
    }

    if (!form.formState.isValid) {
      console.error("Form is not valid:", form.formState.errors);
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare client data for API - backend will create user if needed
      const clientData = {
        email: values.email,
        fName: values.firstName,
        lName: values.lastName,
        phone: values.phoneNumber || undefined,
        password: values.password || undefined, // Optional, backend will generate if not provided
        companyName:
          values.businessName || `${values.firstName} ${values.lastName}`,
        address: {
          street: values.address?.street || "",
          city: values.address?.city || "",
          state: values.address?.state || "",
          country: values.address?.country || "",
          postalCode: values.address?.postalCode || "",
        },
        oldWebsite: values.website || undefined,
        taxId: values.taxId || undefined,
        notes: values.notes || undefined,
        services: [],
        currentPlan: undefined,
      };

      const result = await createClient(clientData);

      toast({
        title: "Client created",
        description: `${values.firstName} ${values.lastName} has been added as a client.`,
      });

      // Reset form after successful creation
      form.reset();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error creating client:", error);

      let errorMessage =
        "There was an error creating the client. Please try again.";
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        id="add-client-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password *</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password *</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="hasOldWebsite"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Has Existing Website?
                  </FormLabel>
                  <FormDescription>
                    Does this user have an existing website that needs to be
                    migrated?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value as boolean}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch("hasOldWebsite") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Website URL</FormLabel>
              </div>
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="https://example.com"
                          className="pl-9"
                          {...field}
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address.zipCode"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>ZIP Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit button is now in the modal footer */}
      </form>
    </Form>
  );
};

export default AddClientForm;
