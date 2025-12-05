import { useState, useEffect, useMemo } from "react";
import { pdf } from "@react-pdf/renderer";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Copy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
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
import { useInvoicesStore } from "@/stores/invoices/useInvoicesStore";
import {
  Invoice,
  InvoiceStatus,
  InvoiceItem,
  InvoiceClient,
  InvoiceUser,
} from "@/types/invoice.types";
import {
  InvoiceForm,
  InvoiceFormValues,
} from "@/components/invoices/InvoiceForm";
import ViewInvoice from "@/components/invoices/ViewInvoice";
import { SendInvoiceDialog } from "@/components/invoices/SendInvoiceDialog";
import { companySettingsApi } from "@/services/api/companySettingsApi";

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
    durationType: 'one-time' | 'monthly' | 'quarterly' | 'annual';
    unitPrice: number;
    taxRate?: number;
    amount?: number;
  }>;
};

// Get the client's name, with a nice fallback
const getClientName = (client: string | InvoiceClient) => {
  if (!client) return "Unknown Client";
  return typeof client === "string"
    ? client
    : client.companyName || "Unknown Client";
};

// Extract client data safely, handling both string and object formats
const getClientData = (client: string | InvoiceClient | undefined) => {
  if (!client || typeof client === "string") return null;
  const clientObj = client as InvoiceClient;
  const user = typeof clientObj.user === 'object' ? clientObj.user : null;
  return {
    companyName: clientObj.companyName || "N/A",
    email: user?.email || null,
    phone: user?.phone || null,
    fName: user?.fName || null,
    lName: user?.lName || null,
  };
};

// Make money look pretty
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Convert API data into something our form can understand
const mapApiInvoiceToForm = (invoice: ExtendedInvoice): InvoiceFormValues => {
  return {
    client:
      typeof invoice.client === "string"
        ? invoice.client
        : invoice.client?._id || "",
    user: typeof invoice.user === "string"
      ? invoice.user
      : invoice.user?._id || "",
    status: invoice.status || "draft",
    issueDate: new Date(invoice.issueDate),
    dueDate: new Date(invoice.dueDate),
    items:
      invoice.items?.map((item) => ({
        description: item.description || "",
        // InvoiceFormValues still uses quantity, so we map durationType to quantity=1
        // The form will handle the durationType field separately
        quantity: 1,
        unitPrice: item.unitPrice || 0,
        taxRate: item.taxRate,
        amount: item.amount,
        // Store durationType as additional property for form handling
        durationType: item.durationType || 'one-time',
      })) || [],
    notes: invoice.notes,
    terms: invoice.terms,
  };
};

const Invoices = () => {
  const {
    invoices,
    loading: isLoading,
    error: storeError,
    fetchInvoices,
    fetchInvoice,
    createInvoice,
    updateInvoiceApi,
    deleteInvoice,
    sendInvoice,
    markAsPaid,
    markAsOverdue,
    cancelInvoice,
  } = useInvoicesStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "sent" | "paid" | "overdue" | "cancelled"
  >("all");
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendInvoiceId, setSendInvoiceId] = useState<string | null>(null);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);

  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(5);
  const [isPaginating, setIsPaginating] = useState(false);

  // Handle modal state changes
  const openEditModal = (invoice: Invoice | null = null) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingInvoice(null);
    setIsModalOpen(false);
  };

  const openViewModal = async (invoice: Invoice) => {
    // If client data is not populated (it's a string ID), fetch the full invoice
    if (typeof invoice.client === 'string' || !invoice.client) {
      try {
        const fullInvoice = await fetchInvoice(invoice._id || invoice.id || '');
        if (fullInvoice) {
          setViewingInvoice(fullInvoice);
        } else {
          setViewingInvoice(invoice);
        }
      } catch (error) {
        console.error('Error fetching full invoice:', error);
        // Fallback to the invoice we have
        setViewingInvoice(invoice);
      }
    } else {
      setViewingInvoice(invoice);
    }
  };

  const closeViewModal = () => {
    setViewingInvoice(null);
  };

  const downloadInvoicePdf = async (invoiceId: string) => {
    try {
      setIsDownloading(true);

      // Fetch the full invoice data if needed
      const invoice = invoices.find((inv) => (inv._id || inv.id) === invoiceId);
      if (!invoice) {
        toast.error("Invoice not found");
        return;
      }

      // Fetch company settings from server
      const companySettings = await companySettingsApi.getSettings();

      // Dynamically import the PDF components to avoid build issues
      const { Document, Page, Text, View, StyleSheet, Image } = await import(
        "@react-pdf/renderer"
      );

      // Define styles for the PDF
      const styles = StyleSheet.create({
        page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 30,
          paddingBottom: 20,
          borderBottom: "2 solid #e2e8f0",
        },
        logo: { width: 120 },
        companyInfo: { alignItems: "flex-end" },
        companyName: {
          fontSize: 18,
          fontWeight: "bold",
          color: "hsl(41 61% 64%)",
          marginBottom: 4,
        },
        invoiceTitle: {
          fontSize: 28,
          fontWeight: "bold",
          color: "hsl(41 61% 64%)",
          marginBottom: 20,
        },
        infoSection: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 30,
        },
        infoBlock: { width: "48%" },
        infoLabel: {
          fontSize: 9,
          color: "#64748b",
          marginBottom: 4,
          textTransform: "uppercase",
        },
        infoValue: { fontSize: 11, marginBottom: 8, fontWeight: "bold" },
        table: { marginTop: 20 },
        tableHeader: {
          flexDirection: "row",
          backgroundColor: "#f8fafc",
          padding: 10,
          borderBottom: "2 solid #e2e8f0",
        },
        tableRow: {
          flexDirection: "row",
          padding: 10,
          borderBottom: "1 solid #e2e8f0",
        },
        col1: { width: "45%" },
        col2: { width: "15%", textAlign: "right" },
        col3: { width: "15%", textAlign: "right" },
        col4: { width: "10%", textAlign: "right" },
        col5: { width: "15%", textAlign: "right" },
        totalsSection: { marginLeft: "auto", width: "45%", marginTop: 20 },
        totalRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 6,
          paddingHorizontal: 12,
        },
        grandTotalRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 12,
          paddingHorizontal: 12,
          backgroundColor: "hsl(41 61% 64%)",
          marginTop: 8,
          borderRadius: 4,
        },
        grandTotalText: { fontSize: 12, fontWeight: "bold", color: "white" },
        footer: { marginTop: 40, paddingTop: 20, borderTop: "1 solid #e2e8f0" },
      });

      // Little helper functions for formatting
      const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);

      const formatDate = (date: string | Date) =>
        new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

      const getClientName = (client: string | InvoiceClient) =>
        typeof client === "string" ? client : (client as InvoiceClient)?.companyName || "N/A";

      // Let's create the PDF
      const InvoicePDF = () => (
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                {companySettings.logo && (
                  <Image src={companySettings.logo} style={styles.logo} />
                )}
              </View>
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>
                  {companySettings.companyName || "Your Company Name"}
                </Text>
                {companySettings.address && (
                  <Text style={{ fontSize: 9, color: "#64748b" }}>
                    {companySettings.address}
                  </Text>
                )}
                {(companySettings.city || companySettings.state || companySettings.zip) && (
                  <Text style={{ fontSize: 9, color: "#64748b" }}>
                    {[
                      companySettings.city,
                      companySettings.state,
                      companySettings.zip
                    ].filter(Boolean).join(', ')}
                  </Text>
                )}
                {companySettings.email && (
                  <Text style={{ fontSize: 9, color: "#64748b" }}>
                    {companySettings.email}
                  </Text>
                )}
                {companySettings.phone && (
                  <Text style={{ fontSize: 9, color: "#64748b" }}>
                    {companySettings.phone}
                  </Text>
                )}
              </View>
            </View>

            {/* Invoice Title */}
            <Text style={styles.invoiceTitle}>INVOICE</Text>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Bill To</Text>
                <Text style={styles.infoValue}>
                  {getClientName(invoice.client)}
                </Text>
              </View>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Invoice Number</Text>
                <Text style={styles.infoValue}>{invoice.invoiceNumber}</Text>
                <Text style={styles.infoLabel}>Issue Date</Text>
                <Text style={styles.infoValue}>
                  {formatDate(invoice.issueDate)}
                </Text>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>
                  {formatDate(invoice.dueDate)}
                </Text>
              </View>
            </View>

            {/* Items Table */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text
                  style={[{ fontSize: 9, fontWeight: "bold" }, styles.col1]}
                >
                  Description
                </Text>
                <Text
                  style={[{ fontSize: 9, fontWeight: "bold" }, styles.col2]}
                >
                  Duration
                </Text>
                <Text
                  style={[{ fontSize: 9, fontWeight: "bold" }, styles.col3]}
                >
                  Unit Price
                </Text>
                <Text
                  style={[{ fontSize: 9, fontWeight: "bold" }, styles.col4]}
                >
                  Tax %
                </Text>
                <Text
                  style={[{ fontSize: 9, fontWeight: "bold" }, styles.col5]}
                >
                  Amount
                </Text>
              </View>
              {invoice.items.map((item, index) => {
                // Use quantity = 1 for calculations
                const itemTotal = 1 * item.unitPrice;
                const itemTax =
                  (item.taxRate || 0) > 0
                    ? (itemTotal * (item.taxRate || 0)) / 100
                    : 0;
                const durationType = 'durationType' in item ? (item.durationType as 'one-time' | 'monthly' | 'quarterly' | 'annual') : 'one-time';
                const durationLabel = durationType === 'one-time' ? 'One-time' :
                                     durationType === 'monthly' ? 'Monthly' :
                                     durationType === 'quarterly' ? 'Quarterly' :
                                     durationType === 'annual' ? 'Annual' : durationType;
                return (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.col1}>{item.description}</Text>
                    <Text style={styles.col2}>{durationLabel}</Text>
                    <Text style={styles.col3}>
                      {formatCurrency(item.unitPrice)}
                    </Text>
                    <Text style={styles.col4}>{item.taxRate || 0}%</Text>
                    <Text style={styles.col5}>
                      {formatCurrency(itemTotal + itemTax)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text>Subtotal</Text>
                <Text style={{ fontWeight: "bold" }}>
                  {formatCurrency(invoice.subtotal)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text>Tax</Text>
                <Text style={{ fontWeight: "bold" }}>
                  {formatCurrency(invoice.tax)}
                </Text>
              </View>
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalText}>Total</Text>
                <Text style={[styles.grandTotalText, { fontSize: 14 }]}>
                  {formatCurrency(invoice.total)}
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              {invoice.notes && (
                <>
                  <Text
                    style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4 }}
                  >
                    Notes
                  </Text>
                  <Text style={{ fontSize: 9, color: "#64748b", marginBottom: 12 }}>
                    {invoice.notes}
                  </Text>
                </>
              )}
              {/* Company Footer Info */}
              <View style={{ marginTop: invoice.notes ? 12 : 0 }}>
                <Text style={{ fontSize: 9, color: "#64748b", fontWeight: "bold" }}>
                  {companySettings.companyName}
                </Text>
                {companySettings.taxId && (
                  <Text style={{ fontSize: 9, color: "#64748b" }}>
                    Tax ID: {companySettings.taxId}
                  </Text>
                )}
              </View>
            </View>
          </Page>
        </Document>
      );

      // Generate and download PDF
      const blob = await pdf(<InvoicePDF />).toBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber || "details"}.pdf`;
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
      await sendInvoice(sendInvoiceId);
      toast.success("Invoice sent successfully");
    } catch (err) {
      console.error("Send error:", err);
      toast.error("Failed to send invoice");
    } finally {
      setIsSending(false);
      setIsSendDialogOpen(false);
      setSendInvoiceId(null);
    }
  };

  const handleDeleteClick = (invoiceId: string) => {
    setDeleteInvoiceId(invoiceId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteInvoiceId) return;
    try {
      await deleteInvoice(deleteInvoiceId);
      toast.success("Invoice deleted successfully");
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteInvoiceId(null);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      switch (status) {
        case "paid":
          await markAsPaid(id);
          break;
        case "overdue":
          await markAsOverdue(id);
          break;
        case "cancelled":
          await cancelInvoice(id);
          break;
      }
      toast.success(`Invoice marked as ${status}`);
    } catch (error) {
      console.error(`Error marking invoice as ${status}:`, error);
      toast.error(`Failed to mark invoice as ${status}`);
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

  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset current page when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [invoicesPerPage]);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
        getClientName(invoice.client).toLowerCase().includes(searchLower)) ??
      false;
    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  // Pagination handlers
  const handlePageChange = (pageNumber: number) => {
    setIsPaginating(true);
    setTimeout(() => {
      setCurrentPage(pageNumber);
      setIsPaginating(false);
    }, 150);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setIsPaginating(true);
      setTimeout(() => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
        setIsPaginating(false);
      }, 150);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setIsPaginating(true);
      setTimeout(() => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
        setIsPaginating(false);
      }, 150);
    }
  };

  const handleInvoiceUpdate = async (
    invoiceId: string,
    formData: InvoiceFormValues
  ) => {
    if (!invoiceId) {
      toast.error("Invalid invoice ID");
      return;
    }
    try {
      setIsSavingInvoice(true);
      // Calculate subtotal, tax, and total (using quantity = 1 for calculations)
      const subtotal = formData.items.reduce((sum, item) => {
        return sum + 1 * item.unitPrice;
      }, 0);

      const tax = formData.items.reduce((sum, item) => {
        const itemTax =
          (1 * item.unitPrice * (item.taxRate || 0)) / 100;
        return sum + itemTax;
      }, 0);

      const total = subtotal + tax;

      // Map form items to API format (convert to durationType)
      // InvoiceFormValues uses quantity, but we need durationType for API
      type FormItem = { description: string; quantity: number; unitPrice: number; taxRate?: number; durationType?: 'one-time' | 'monthly' | 'quarterly' | 'annual' };
      const mappedItems = formData.items.map((item: FormItem) => {
        const durationType = item.durationType || 'one-time';
        return {
          description: item.description,
          durationType: durationType as 'one-time' | 'monthly' | 'quarterly' | 'annual',
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 0,
        };
      });

      const invoiceData = {
        ...formData,
        subtotal,
        tax,
        total,
        // Convert dates to ISO string for the API
        issueDate: formData.issueDate.toISOString(),
        dueDate: formData.dueDate.toISOString(),
        // Ensure client is sent as ID (user is automatically set by backend from req.user.id)
        client: formData.client,
        // Use mapped items with durationType
        items: mappedItems,
      };

      const updatedInvoice = await updateInvoiceApi(invoiceId, invoiceData);
      toast.success("Invoice updated successfully");
      setEditingInvoice(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setIsSavingInvoice(false);
    }
  };

  const handleCreateInvoice = async (data: InvoiceFormValues) => {
    if (!data.client) {
      toast.error("Please select a client");
      return;
    }
    try {
      setIsSavingInvoice(true);
      // Calculate subtotal, tax, and total (using quantity = 1 for calculations)
      const subtotal = data.items.reduce((sum, item) => {
        return sum + 1 * item.unitPrice;
      }, 0);

      const tax = data.items.reduce((sum, item) => {
        const itemTax =
          (1 * item.unitPrice * (item.taxRate || 0)) / 100;
        return sum + itemTax;
      }, 0);

      const total = subtotal + tax;

      // Map form items to API format (convert to durationType)
      // InvoiceFormValues uses quantity, but we need durationType for API
      type FormItem = { description: string; quantity: number; unitPrice: number; taxRate?: number; durationType?: 'one-time' | 'monthly' | 'quarterly' | 'annual' };
      const mappedItems = data.items.map((item: FormItem) => {
        // Check if item has durationType (new format) or use default
        const durationType = item.durationType || 'one-time';
        return {
          description: item.description,
          durationType: durationType as 'one-time' | 'monthly' | 'quarterly' | 'annual',
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 0,
        };
      });

      // Backend automatically sets user from req.user.id, so we don't need to send it
      // Type assertion needed because user is required in Invoice type but set by backend
      await createInvoice({
        subtotal,
        tax,
        total,
        // Convert dates to ISO string for the API
        issueDate: data.issueDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        // Ensure client is sent as ID (user is automatically set by backend from req.user.id)
        client: data.client,
        status: (data.status || "draft") as InvoiceStatus,
        isActive: true,
        // Use mapped items with durationType
        items: mappedItems,
        notes: data.notes,
        terms: data.terms,
        // user field is set by backend from req.user.id, so we use empty string as placeholder
        user: "" as unknown as string | InvoiceUser,
      } as Omit<Invoice, "_id" | "invoiceNumber" | "createdAt" | "updatedAt">);

      toast.success("Invoice created successfully");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setIsSavingInvoice(false);
    }
  };

  const handleSubmit = async (formData: InvoiceFormValues) => {
    try {
      if (editingInvoice) {
        await handleInvoiceUpdate(
          editingInvoice._id || editingInvoice.id || "",
          formData
        );
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
    const escape = (v: string | number | Date | undefined) => {
      const s = v instanceof Date ? v.toISOString() : String(v ?? "");
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = [headers.join(",")]
      .concat(
        rows.map((r: Record<string, string | number | Date | undefined>) =>
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

  // Memoized stats calculation for better performance
  const stats = useMemo(() => {
    // Calculate total amount using correct 'total' property
    const totalAmount = invoices.reduce(
      (sum, inv) => sum + (inv.total || 0),
      0
    );

    // Calculate paid invoices and amount
    const paidInvoices = invoices.filter((inv) => inv.status === "paid");
    const paidAmount = paidInvoices.reduce(
      (sum, inv) => sum + (inv.total || 0),
      0
    );

    // Calculate pending and overdue counts
    const pendingCount = invoices.filter((inv) => inv.status === "sent").length;
    const overdueCount = invoices.filter(
      (inv) => inv.status === "overdue"
    ).length;

    // Calculate draft count
    const draftCount = invoices.filter((inv) => inv.status === "draft").length;

    // Calculate outstanding amount (sent + overdue)
    const outstandingAmount = invoices
      .filter((inv) => ["sent", "overdue"].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    return {
      total: invoices.length,
      totalAmount,
      paid: paidInvoices.length,
      paidAmount,
      pending: pendingCount,
      overdue: overdueCount,
      draft: draftCount,
      outstandingAmount,
    };
  }, [invoices]); // Recalculate only when invoices array changes

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
            key={`stat-${stat.label}-${index}`}
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
      <div className="space-y-4">
        {/* Page size selector and showing counter */}
        {filteredInvoices.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {indexOfFirstInvoice + 1}-{Math.min(indexOfLastInvoice, filteredInvoices.length)} of {filteredInvoices.length} invoices
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Show:</span>
              <Select value={invoicesPerPage.toString()} onValueChange={(value) => setInvoicesPerPage(Number(value))}>
                <SelectTrigger className="w-16 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Loading overlay for pagination */}
        {isPaginating && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          {currentInvoices.map((invoice, index) => (
          <motion.div
            key={invoice._id || invoice.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">
                      {invoice.invoiceNumber ||
                        `INV-${invoice._id?.substring(0, 6).toUpperCase()}`}
                    </h3>
                    <Badge className={`${statusColors[invoice.status]} capitalize mr-4`}>
                      {invoice.status}
                    </Badge>
                  </div>
                  
                  {/* Client Information */}
                  {(() => {
                    const clientData = getClientData(invoice.client);
                    return clientData ? (
                      <div className="mt-3 space-y-1 border-t pt-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {clientData.companyName}
                          </span>
                        </div>
                        {clientData.email && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{clientData.email}</span>
                          </div>
                        )}
                        {clientData.phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{clientData.phone}</span>
                          </div>
                        )}
                        {(clientData.fName || clientData.lName) && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>
                              {[clientData.fName, clientData.lName].filter(Boolean).join(' ') || 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
                  
                  {/* Invoice Details */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span>{format(new Date(invoice.issueDate), "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{format(new Date(invoice.dueDate), "MMM dd, yyyy")}</span>
                    </div>
                    {invoice.items && invoice.items.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Items:</span>
                          <span>{invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {invoice.items.slice(0, 3).map((item, idx) => {
                            const durationType = 'durationType' in item ? (item.durationType as 'one-time' | 'monthly' | 'quarterly' | 'annual') : 'one-time';
                            const durationLabel = durationType === 'one-time' ? 'One-time' :
                                                 durationType === 'monthly' ? 'Monthly' :
                                                 durationType === 'quarterly' ? 'Quarterly' :
                                                 durationType === 'annual' ? 'Annual' : durationType;
                            return (
                              <span key={idx} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                                {durationLabel}
                              </span>
                            );
                          })}
                          {invoice.items.length > 3 && (
                            <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                              +{invoice.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Total Amount */}
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(invoice.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => setViewingInvoice(invoice)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEdit(invoice)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        downloadInvoicePdf(invoice._id || invoice.id)
                      }
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleSendClick(invoice._id || invoice.id)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Invoice
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        handleStatusChange(invoice._id || invoice.id, "paid")
                      }
                    >
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Mark as Paid
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleStatusChange(invoice._id || invoice.id, "overdue")
                      }
                    >
                      <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                      Mark as Overdue
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleStatusChange(
                          invoice._id || invoice.id,
                          "cancelled"
                        )
                      }
                    >
                      <XCircle className="mr-2 h-4 w-4 text-gray-500" />
                      Mark as Cancelled
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        handleDeleteClick(invoice._id || invoice.id)
                      }
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Invoice
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.div>
        ))}

        {currentInvoices.length === 0 && filteredInvoices.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No invoices found on this page
            </h3>
            <p className="text-muted-foreground">
              Try changing the page or adjusting your filters
            </p>
          </motion.div>
        ) : filteredInvoices.length === 0 && (
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isPaginating}
                className="h-8 w-8 p-0"
              >
                {isPaginating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={isPaginating}
                      className="h-8 w-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || isPaginating}
                className="h-8 w-8 p-0"
              >
                {isPaginating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
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
              editingInvoice ? (mapApiInvoiceToForm(editingInvoice) as unknown as Partial<Invoice>) : undefined
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
            isSubmitting={isSavingInvoice}
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
          onDownload={downloadInvoicePdf}
        />
      )}
      {/* Send Confirmation Dialog */}
      <SendInvoiceDialog
        isOpen={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        onConfirm={handleConfirmSend}
        isSending={isSending}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Invoices;
