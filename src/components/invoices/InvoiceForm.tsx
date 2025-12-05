import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Invoice,
  InvoiceStatus,
  InvoiceItem,
  InvoiceClient,
} from "@/types/invoice.types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getClients } from "@/services/clientService";
import { getUsers } from "@/services/userService";
import { toast } from "sonner";

export const invoiceFormSchema = z.object({
  client: z.string().min(1, "Client is required"),
  user: z.string().min(1, "Assigned user is required"),
  issueDate: z.date({
    required_error: "Issue date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"] as const, {
    required_error: "Status is required",
  }),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        durationType: z.enum(['one-time', 'monthly', 'quarterly', 'annual'], {
          required_error: "Duration type is required",
        }),
        unitPrice: z.number().min(0, "Price must be a positive number"),
        taxRate: z.number().min(0).max(100).default(0),
      })
    )
    .min(1, "At least one item is required"),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export type InvoiceFormValues = {
  client: string;
  user: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issueDate: Date;
  dueDate: Date;
  items: Array<{
    description: string;
    durationType: 'one-time' | 'monthly' | 'quarterly' | 'annual';
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    amount?: number;
  }>;
  notes?: string;
  terms?: string;
};

interface InvoiceFormProps {
  initialData?: Partial<Invoice>;
  onSubmit: (data: InvoiceFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

interface Client extends InvoiceClient {
  _id: string;
  companyName: string;
  email: string;
}

interface User {
  _id: string;
  fName: string;
  lName: string;
  email: string;
  role: string;
}


export function InvoiceForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  onCancel,
}: InvoiceFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsData, usersData] = await Promise.all([
          getClients(),
          getUsers()
        ]);
        setClients(clientsData);
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      client:
        typeof initialData?.client === "string"
          ? initialData.client
          : initialData?.client?._id || "",
      user:
        typeof initialData?.user === "string"
          ? initialData.user
          : initialData?.user?._id || "",
      issueDate: initialData?.issueDate
        ? new Date(initialData.issueDate)
        : new Date(),
      dueDate: initialData?.dueDate
        ? new Date(initialData.dueDate)
        : new Date(),
      status: initialData?.status || "draft",
      items: initialData?.items?.map((item) => ({
        description: item.description || "",
        durationType: (item as any).durationType || 'one-time',
        unitPrice: item.unitPrice || 0,
        taxRate: item.taxRate || 0,
        quantity: 1,
      })) || [
        {
          description: "",
          durationType: 'one-time' as const,
          unitPrice: 0,
          taxRate: 0,
          quantity: 1,
        },
      ],
      notes: initialData?.notes || "",
      terms: initialData?.terms || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const addItem = () => {
    append({ description: "", durationType: 'one-time' as const, unitPrice: 0, taxRate: 0, quantity: 1 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Selection */}
          <FormField
            control={form.control}
            name="client"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <FormControl>
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading clients...</span>
                    </div>
                  ) : (
                    <Select
                      value={field.value as string}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client._id} value={client._id}>
                            {client.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* User/Assignee Selection */}
          <FormField
            control={form.control}
            name="user"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To</FormLabel>
                <FormControl>
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading users...</span>
                    </div>
                  ) : (
                    <Select
                      value={field.value as string}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.fName} {user.lName} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Issue Date */}
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Issue Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Due Date */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < form.getValues("issueDate")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Invoice Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Items</h3>
            <Button type="button" onClick={addItem} variant="outline" size="sm">
              Add Item
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-4 items-end">
              <FormField
                control={form.control}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem className="col-span-5">
                    <FormLabel className={cn(index > 0 && "sr-only")}>
                      Description
                    </FormLabel>
                    <Input {...field} placeholder="Item description" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.durationType`}
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className={cn(index > 0 && "sr-only")}>
                      Duration
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="one-time">One-time</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.unitPrice`}
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className={cn(index > 0 && "sr-only")}>
                      Price
                    </FormLabel>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.taxRate`}
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className={cn(index > 0 && "sr-only")}>
                      Tax %
                    </FormLabel>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="col-span-1"
                onClick={() => removeItem(index)}
                disabled={fields.length <= 1}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {/* Notes and Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  {...field}
                  placeholder="Additional notes"
                  className="min-h-[100px]"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms & Conditions</FormLabel>
                <Textarea
                  {...field}
                  placeholder="Payment terms and conditions"
                  className="min-h-[100px]"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Totals */}
        <div className="ml-auto w-full md:w-1/3 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(
                form
                  .watch("items")
                  .reduce(
                    (sum, item) => {
                      const unitPrice = Number(item.unitPrice) || 0;
                      return sum + unitPrice;
                    },
                    0
                  )
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(
                form
                  .watch("items")
                  .reduce(
                    (sum, item) => {
                      const unitPrice = Number(item.unitPrice) || 0;
                      const taxRate = Number(item.taxRate) || 0;
                      return sum + (unitPrice * taxRate) / 100;
                    },
                    0
                  )
              )}
            </span>
          </div>
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total:</span>
            <span>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(
                form.watch("items").reduce((sum, item) => {
                  const unitPrice = Number(item.unitPrice) || 0;
                  const taxRate = Number(item.taxRate) || 0;
                  const sub = unitPrice;
                  const tax = (sub * taxRate) / 100;
                  return sum + sub + tax;
                }, 0)
              )}
            </span>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
