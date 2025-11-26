import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Download,
  DollarSign,
  Calendar as CalendarIcon,
  Printer,
  Send,
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  getInvoices,
  createInvoice,
  updateInvoice as updateInvoiceApi,
} from "@/services/invoiceService";
import {
  Invoice,
  InvoiceStatus,
  InvoiceItem,
  InvoiceClient,
  InvoiceUser,
} from "@/types/invoice.types";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import ViewInvoice from "@/components/invoices/ViewInvoice";

// ViewInvoice is imported from @/components/invoices/ViewInvoice

// Mock data for status colors - replace with your theme colors if needed
const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-800",
};

// Extend the Invoice type to include the id field for backward compatibility
type ExtendedInvoice = Omit<Invoice, "status" | "id"> & {
  _id?: string;
  id?: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  client: string | { _id: string; companyName: string };
  user: string | { _id: string; fName: string; lName: string };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    amount?: number;
  }>;
};

// Helper to get client name
const getClientName = (client: string | InvoiceClient) => {
  if (!client) return "Unknown Client";
  return typeof client === "string"
    ? client
    : client.companyName || "Unknown Client";
};

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Helper to map API invoice data to form values
const mapApiInvoiceToForm = (invoice: ExtendedInvoice): InvoiceFormValues => {
  return {
    client:
      typeof invoice.client === "string"
        ? invoice.client
        : invoice.client?._id || "",
    user:
      typeof invoice.user === "string" ? invoice.user : invoice.user?._id || "",
    status: invoice.status || "draft",
    issueDate: new Date(invoice.issueDate),
    dueDate: new Date(invoice.dueDate),
    items:
      invoice.items?.map((item) => ({
        description: item.description || "",
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        taxRate: item.taxRate,
        amount: item.amount,
      })) || [],
    notes: invoice.notes,
    terms: invoice.terms,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
  };
};

type InvoiceFormValues = {
  client: string;
  user: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issueDate: Date;
  dueDate: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    amount?: number;
  }>;
  notes?: string;
  terms?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
};

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(
    "all"
  );
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Invoice;
    direction: "asc" | "desc";
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendInvoiceId, setSendInvoiceId] = useState<string | null>(null);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

  // Handle modal state changes
  const openEditModal = (invoice: Invoice | null = null) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingInvoice(null);
    setIsModalOpen(false);
  };

  const openViewModal = (invoice: Invoice) => {
    setViewingInvoice(invoice);
  };

  const closeViewModal = () => {
    setViewingInvoice(null);
  };

  const downloadInvoicePdf = async (invoiceId: string) => {
    try {
      setIsDownloading(true);
      const response = await fetch(`/api/invoices/${invoiceId}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download invoice");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${viewingInvoice?.invoiceNumber || "details"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success("Invoice downloaded successfully");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendClick = (invoiceId: string) => {
    setSendInvoiceId(invoiceId);
    setIsSendDialogOpen(true);
  };

  const handleConfirmSend = async () => {
    if (!sendInvoiceId) return;

    try {
      setIsSending(true);
      const response = await fetch(`/api/invoices/${sendInvoiceId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to send invoice");

      const data = await response.json();
      setViewingInvoice(data);
      toast.success("Invoice sent successfully");

      // Update local state to reflect sent status
      setInvoices(
        invoices.map((inv) =>
          inv._id === sendInvoiceId || inv.id === sendInvoiceId
            ? { ...inv, status: "sent" as InvoiceStatus }
            : inv
        )
      );
    } catch (err) {
      console.error("Send error:", err);
      toast.error("Failed to send invoice");
    } finally {
      setIsSending(false);
      setIsSendDialogOpen(false);
      setSendInvoiceId(null);
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Helper function to get client name
  const getClientName = (client: string | InvoiceClient) => {
    return typeof client === "string"
      ? client
      : client?.companyName || "Unknown Client";
  };

  // Fetch invoices on component mount and when status filter changes
  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getInvoices({
          status: statusFilter !== "all" ? statusFilter : undefined,
        });
        setInvoices(data);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Failed to fetch invoices. Please try again.");
        toast.error("Failed to fetch invoices");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [statusFilter]);
  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getInvoices({
          status: statusFilter !== "all" ? statusFilter : undefined,
        });
        setInvoices(data);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Failed to fetch invoices. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [setInvoices, statusFilter]);

  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (invoice.userName?.toLowerCase().includes(searchLower) ||
        invoice.userEmail?.toLowerCase().includes(searchLower) ||
        invoice.id?.toLowerCase().includes(searchLower)) ??
      false;
    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleInvoiceUpdate = async (
    invoiceId: string,
    formData: InvoiceFormValues
  ) => {
    if (!invoiceId) {
      toast.error("Invalid invoice ID");
      return;
    }
    try {
      setIsLoading(true);
      // Calculate subtotal, tax, and total
      const subtotal = formData.items.reduce((sum, item) => {
        return sum + item.quantity * item.unitPrice;
      }, 0);

      const tax = formData.items.reduce((sum, item) => {
        const itemTax =
          (item.quantity * item.unitPrice * (item.taxRate || 0)) / 100;
        return sum + itemTax;
      }, 0);

      const total = subtotal + tax;

      const invoiceData = {
        ...formData,
        subtotal,
        tax,
        total,
        // Convert dates to ISO string for the API
        issueDate: formData.issueDate.toISOString(),
        dueDate: formData.dueDate.toISOString(),
        // Ensure client and user are sent as IDs
        client: formData.client,
        user: formData.user,
      };

      const updatedInvoice = await updateInvoiceApi(invoiceId, invoiceData);
      setInvoices(
        invoices.map((inv) =>
          inv._id === invoiceId
            ? { ...updatedInvoice, id: updatedInvoice._id }
            : inv
        )
      );
      toast.success("Invoice updated successfully");
      setEditingInvoice(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvoice = async (data: InvoiceFormValues) => {
    if (!data.client || !data.user) {
      toast.error("Please select both client and user");
      return;
    }
    try {
      setIsLoading(true);
      // Calculate subtotal, tax, and total
      const subtotal = data.items.reduce((sum, item) => {
        return sum + item.quantity * item.unitPrice;
      }, 0);

      const tax = data.items.reduce((sum, item) => {
        const itemTax =
          (item.quantity * item.unitPrice * (item.taxRate || 0)) / 100;
        return sum + itemTax;
      }, 0);

      const total = subtotal + tax;

      const newInvoice = await createInvoice({
        ...data,
        subtotal,
        tax,
        total,
        // Convert dates to ISO string for the API
        issueDate: data.issueDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        // Ensure client and user are sent as IDs
        client: data.client,
        user: data.user,
        status: data.status || "draft",
      });

      setInvoices([{ ...newInvoice, id: newInvoice._id }, ...invoices]);
      toast.success("Invoice created successfully");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: InvoiceFormValues) => {
    try {
      if (editingInvoice) {
        await handleUpdateInvoice(formData);
      } else {
        await handleCreateInvoice(formData);
      }
    } catch (err) {
      console.error("Error saving invoice:", err);
      // You might want to show an error message to the user here
    }
  };

  const openCreate = () => {
    setEditingInvoice(null);
    setIsModalOpen(true);
  };

  const openEdit = (invoice: ExtendedInvoice) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleSaveInvoice = async (updatedInvoice: ExtendedInvoice) => {
    try {
      await updateInvoiceApi(
        updatedInvoice._id || updatedInvoice.id,
        updatedInvoice
      );
      setInvoices(
        invoices.map((inv) =>
          inv.id === updatedInvoice.id || inv._id === updatedInvoice._id
            ? updatedInvoice
            : inv
        )
      );
      setEditingInvoice(null);
      toast.success("Invoice updated successfully");
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice");
    }
  };

  const exportCSV = () => {
    const rows = filteredInvoices.map((inv) => ({
      id: inv.id,
      userName: inv.userName,
      userEmail: inv.userEmail,
      amount: inv.amount,
      status: inv.status,
      createdAt: inv.createdAt,
      dueDate: inv.dueDate,
      paidAt: inv.paidAt || "",
    }));
    const headers = Object.keys(
      rows[0] || {
        id: "",
        userName: "",
        userEmail: "",
        amount: "",
        status: "",
        createdAt: "",
        dueDate: "",
        paidAt: "",
      }
    );
    const escape = (v: string | number | undefined) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = [headers.join(",")]
      .concat(
        rows.map((r: Record<string, string | number | undefined>) =>
          headers.map((h) => escape(r[h])).join(",")
        )
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices.filter((inv) => inv.status === "paid").length,
    paidAmount: invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amount, 0),
    pending: invoices.filter((inv) => inv.status === "sent").length,
    overdue: invoices.filter((inv) => inv.status === "overdue").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
            <FileText className="w-8 h-8 text-primary" />
            <span>Invoices</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage invoices for your recipe sharing services
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="glass-card" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Invoices",
            value: stats.total,
            icon: FileText,
            color: "from-blue-500 to-blue-600",
            description: `$${stats.totalAmount.toLocaleString()} total`,
          },
          {
            label: "Paid",
            value: stats.paid,
            icon: DollarSign,
            color: "from-green-500 to-green-600",
            description: `$${stats.paidAmount.toLocaleString()} received`,
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: Calendar,
            color: "from-yellow-500 to-yellow-600",
            description: "Awaiting payment",
          },
          {
            label: "Overdue",
            value: stats.overdue,
            icon: FileText,
            color: "from-red-500 to-red-600",
            description: "Requires attention",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card-hover overflow-hidden relative">
              <div
                className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`}
              />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10`}
                  >
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search invoices by client name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-card"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value: string) =>
            setStatusFilter(value as InvoiceStatus | "all")
          }
        >
          <SelectTrigger className="w-[180px] glass-card">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Invoices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInvoices.map((invoice, index) => (
          <motion.div
            key={invoice.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {invoice.invoiceNumber ||
                      `INV-${invoice._id?.substring(0, 6).toUpperCase()}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(invoice.issueDate), "MMM dd, yyyy")}
                  </p>
                  <p className="text-sm font-medium mt-2">
                    {formatCurrency(invoice.total || 0)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingInvoice(invoice)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(invoice)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <Badge className={`${statusColors[invoice.status]} capitalize`}>
                  {invoice.status}
                </Badge>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredInvoices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No invoices found
            </h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Create your first invoice to get started"}
            </p>
          </motion.div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? "Edit Invoice" : "Create New Invoice"}
            </DialogTitle>
          </DialogHeader>
          <InvoiceForm
            initialData={
              editingInvoice ? mapApiInvoiceToForm(editingInvoice) : undefined
            }
            onSubmit={
              editingInvoice
                ? (formData) =>
                    handleInvoiceUpdate(
                      editingInvoice._id || editingInvoice.id || "",
                      formData
                    )
                : handleCreateInvoice
            }
            onCancel={() => setIsModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <ViewInvoice
          invoice={viewingInvoice}
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}
      {/* Send Confirmation Dialog */}
      <AlertDialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send the invoice to the client via email. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend} disabled={isSending}>
              {isSending ? "Sending..." : "Send Invoice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Invoices;
