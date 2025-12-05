import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  DollarSign,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { getInvoices, downloadInvoice } from "@/services/invoiceService";
import { companySettingsApi } from "@/services/api/companySettingsApi";
import { Invoice } from "@/types/invoice.types";
import ViewInvoice from "@/components/invoices/ViewInvoice";
import { pdf } from "@react-pdf/renderer";

interface ClientInvoicesCardProps {
  clientId: string;
}

export function ClientInvoicesCard({ clientId }: ClientInvoicesCardProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const { toast } = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(5);
  const [isPaginating, setIsPaginating] = useState(false);

  // Reset current page when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [invoicesPerPage]);

  // Reset current page when clientId changes
  useEffect(() => {
    setCurrentPage(1);
  }, [clientId]);

  // Pagination calculations
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = invoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(invoices.length / invoicesPerPage);

  // Pagination handlers
  const handlePageChange = (pageNumber: number) => {
    setIsPaginating(true);
    setTimeout(() => {
      setCurrentPage(pageNumber);
      setIsPaginating(false);
    }, 150); // Small delay for visual feedback
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

  useEffect(() => {
    fetchInvoices();
  }, [clientId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const allInvoices = await getInvoices({ client: clientId });
      // Sort invoices by issue date (most recent first)
      const sortedInvoices = allInvoices.sort((a, b) => 
        new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
      );
      setInvoices(sortedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleCloseView = () => {
    setIsViewModalOpen(false);
    setViewingInvoice(null);
  };

  const downloadInvoicePdf = async (invoiceId: string) => {
    try {
      setIsDownloading(invoiceId);

      // Fetch the full invoice data if needed
      const invoice = invoices.find((inv) => (inv._id || inv.id) === invoiceId);
      if (!invoice) {
        toast({
          title: "Error",
          description: "Invoice not found",
          variant: "destructive",
        });
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

      const getClientName = (client: any) =>
        typeof client === "string" ? client : client?.companyName || "N/A";

      // Create PDF Document
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
                  Quantity
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
                // InvoiceItem doesn't have quantity, so we use amount directly or assume quantity of 1
                const quantity = 1;
                const itemTotal = item.amount || (quantity * item.unitPrice);
                const itemTax =
                  (item.taxRate || 0) > 0
                    ? (itemTotal * (item.taxRate || 0)) / 100
                    : 0;
                return (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.col1}>{item.description}</Text>
                    <Text style={styles.col2}>{quantity}</Text>
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
            {invoice.notes && (
              <View style={styles.footer}>
                <Text
                  style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4 }}
                >
                  Notes
                </Text>
                <Text style={{ fontSize: 9, color: "#64748b" }}>
                  {invoice.notes}
                </Text>
              </View>
            )}
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

      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (err) {
      console.error("Download error:", err);
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  // Calculate invoice statistics
  const invoiceStats = {
    total: invoices.length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    sent: invoices.filter(inv => inv.status === 'sent').length,
    overdue: invoices.filter(inv => inv.status === 'overdue').length,
    draft: invoices.filter(inv => inv.status === 'draft').length,
    cancelled: invoices.filter(inv => inv.status === 'cancelled').length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    outstandingAmount: invoices.filter(inv => ['sent', 'overdue'].includes(inv.status)).reduce((sum, inv) => sum + inv.total, 0),
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "sent":
        return "secondary";
      case "overdue":
        return "destructive";
      case "draft":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No invoices found</p>
            </div>
          ) : (
            <>
              {/* Invoice Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/40">
                  <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">{invoiceStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total Invoices</div>
                </div>
                <div className="text-center p-4 bg-success/10 border border-success/20 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-2xl font-bold text-success">{invoiceStats.paid}</div>
                  <div className="text-xs text-muted-foreground">Paid</div>
                </div>
                <div className="text-center p-4 bg-warning/10 border border-warning/20 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-2xl font-bold text-warning">{invoiceStats.sent}</div>
                  <div className="text-xs text-muted-foreground">Sent</div>
                </div>
                <div className="text-center p-4 bg-destructive/10 border border-destructive/20 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-2xl font-bold text-destructive">{invoiceStats.overdue}</div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
                  <div className="text-xl font-bold text-primary">{formatCurrency(invoiceStats.totalAmount)}</div>
                </div>
                <div className="p-4 bg-success/5 border border-success/20 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm text-muted-foreground mb-1">Paid Amount</div>
                  <div className="text-xl font-bold text-success">{formatCurrency(invoiceStats.paidAmount)}</div>
                </div>
                <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm text-muted-foreground mb-1">Outstanding</div>
                  <div className="text-xl font-bold text-warning">{formatCurrency(invoiceStats.outstandingAmount)}</div>
                </div>
              </div>

              {/* Invoice List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">All Invoices</h4>
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-muted-foreground">
                      Showing {indexOfFirstInvoice + 1}-{Math.min(indexOfLastInvoice, invoices.length)} of {invoices.length} invoices
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Show:</span>
                      <Select value={invoicesPerPage.toString()} onValueChange={(value) => setInvoicesPerPage(Number(value))}>
                        <SelectTrigger className="w-16 h-6 text-xs">
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
                </div>
                
                {/* Loading overlay for pagination */}
                {isPaginating && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                
                <div className="space-y-4 relative">
                {currentInvoices.map((invoice) => (
                <div
                  key={invoice._id || invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">
                        Invoice #{invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(invoice.issueDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due: {formatDate(invoice.dueDate)}
                      </p>
                      {invoice.status === 'paid' && invoice.paidAt && (
                        <p className="text-xs text-success">
                          Paid: {formatDate(invoice.paidAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(invoice.total)}
                      </p>
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          downloadInvoicePdf(invoice._id || invoice.id || "")
                        }
                        disabled={isDownloading === (invoice._id || invoice.id)}
                      >
                        {isDownloading === (invoice._id || invoice.id) ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
                </div>
              </div>

              {/* Pagination */}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <ViewInvoice
          invoice={viewingInvoice}
          isOpen={isViewModalOpen}
          onClose={handleCloseView}
          onDownload={(invoiceId) => downloadInvoicePdf(invoiceId)}
        />
      )}
    </>
  );
}

