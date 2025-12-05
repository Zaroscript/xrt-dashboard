import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Invoice, InvoiceClient, InvoiceUser } from "@/types/invoice.types";
import { DollarSign, Download as DownloadIcon } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { companySettingsApi, type CompanySettings } from "@/services/api/companySettingsApi";

interface ViewInvoiceProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (invoiceId: string) => void;
}

const ViewInvoice = ({
  invoice,
  isOpen,
  onClose,
  onDownload,
}: ViewInvoiceProps) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: "Your Company Name",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    email: "",
    phone: "",
    taxId: "",
    website: "",
    logo: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    currency: "USD",
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    // Fetch company settings from server when component mounts or dialog opens
    if (isOpen) {
      const fetchCompanySettings = async () => {
        try {
          setIsLoadingSettings(true);
          const settings = await companySettingsApi.getSettings();
      setCompanySettings(settings);
        } catch (error) {
          console.error('Error loading company settings:', error);
          // Keep default settings on error
        } finally {
          setIsLoadingSettings(false);
        }
      };
      fetchCompanySettings();
    }
  }, [isOpen]);

  if (!invoice) return null;

  const handleDownloadPdf = () => {
    // Use parent's download handler if provided, otherwise show message
    if (onDownload && (invoice._id || invoice.id)) {
      onDownload(invoice._id || invoice.id);
    } else {
      console.warn("No download handler provided");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "MMM dd, yyyy");
  };

  // Get client data safely, handling different data formats
  const getClientData = (client: string | InvoiceClient | undefined) => {
    if (!client || typeof client === "string") return null;

    const clientObj = client as InvoiceClient;
    const user = typeof clientObj.user === 'object' ? clientObj.user : null;
    
    return {
      companyName: clientObj.companyName || "Unknown Client",
      email: user?.email || clientObj.email || null,
      phone: user?.phone || clientObj.phone || null,
      fName: user?.fName || null,
      lName: user?.lName || null,
      address: clientObj.address || null,
    };
  };

  const clientData = getClientData(invoice.client);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-y-auto max-h-[90vh]">
        <DialogTitle className="sr-only">
          Invoice #{invoice.invoiceNumber || invoice._id}
        </DialogTitle>
        <div className="bg-background rounded-lg p-6" ref={pdfRef}>
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    Invoice #
                    {invoice.invoiceNumber || invoice._id.substring(0, 8)}
                  </h2>
                </div>
                <p className="text-muted-foreground mt-2">
                  Issued on {formatDate(invoice.issueDate)}
                </p>
              </div>
              <div
                className={`status-badge px-3 py-1 text-sm rounded-full ${getStatusColor(
                  invoice.status
                )}`}
              >
                {invoice.status.charAt(0).toUpperCase() +
                  invoice.status.slice(1)}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Bill From</h3>
              <p className="font-medium">{companySettings.companyName}</p>
              {companySettings.address && (
              <p className="text-muted-foreground">{companySettings.address}</p>
              )}
              {(companySettings.city || companySettings.state || companySettings.zip) && (
              <p className="text-muted-foreground">
                  {[
                    companySettings.city,
                    companySettings.state,
                    companySettings.zip
                  ].filter(Boolean).join(', ')}
              </p>
              )}
              {companySettings.country && (
                <p className="text-muted-foreground">{companySettings.country}</p>
              )}
              {companySettings.email && (
              <p className="text-muted-foreground">{companySettings.email}</p>
              )}
              {companySettings.phone && (
                <p className="text-muted-foreground">{companySettings.phone}</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Bill To</h3>
              {clientData ? (
                <>
                  <p className="font-medium">{clientData.companyName}</p>
                  {(clientData.fName || clientData.lName) && (
                    <p className="text-muted-foreground">
                      {[clientData.fName, clientData.lName].filter(Boolean).join(' ')}
                    </p>
                  )}
                  {clientData.email && (
                    <p className="text-muted-foreground">{clientData.email}</p>
                  )}
                  {clientData.phone && (
                    <p className="text-muted-foreground">{clientData.phone}</p>
                  )}
                  {clientData.address && (
                <>
                      {clientData.address.street && (
                        <p className="text-muted-foreground">
                          {clientData.address.street}
                        </p>
                      )}
                      {(clientData.address.city || clientData.address.state || clientData.address.postalCode) && (
                  <p className="text-muted-foreground">
                          {[
                            clientData.address.city,
                            clientData.address.state,
                            clientData.address.postalCode
                          ].filter(Boolean).join(', ')}
                  </p>
                      )}
                      {clientData.address.country && (
                  <p className="text-muted-foreground">
                          {clientData.address.country}
                  </p>
                      )}
                    </>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Client information not available</p>
              )}
            </div>
          </div>

          {/* Invoice Items */}
          <div className="px-6 py-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">
                      Description
                    </th>
                    <th className="text-right py-3 px-4 font-medium">
                      Duration
                    </th>
                    <th className="text-right py-3 px-4 font-medium">
                      Unit Price
                    </th>
                    <th className="text-right py-3 px-4 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, index) => {
                    const durationType = (item as any).durationType || 'one-time';
                    const durationLabel = durationType === 'one-time' ? 'One-time' :
                                         durationType === 'monthly' ? 'Monthly' :
                                         durationType === 'quarterly' ? 'Quarterly' :
                                         durationType === 'annual' ? 'Annual' : durationType;
                    return (
                    <tr key={index} className="border-t">
                      <td className="py-3 px-4">
                        <p className="font-medium">{item.description}</p>
                      </td>
                        <td className="py-3 px-4 text-right">{durationLabel}</td>
                      <td className="py-3 px-4 text-right">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                          ${(1 * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-6 ml-auto max-w-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${invoice.subtotal?.toFixed(2) || "0.00"}</span>
                </div>
                {invoice.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${invoice.tax.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="space-y-1 mt-4">
                <h4 className="font-semibold">Notes</h4>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}

            {/* Company Footer Info */}
            <div className="mt-8 pt-6 border-t text-sm text-muted-foreground">
              <p>{companySettings.companyName}</p>
              <p>Tax ID: {companySettings.taxId}</p>
            </div>

            {/* Footer */}
            <div className="mt-4 pb-6 text-center text-sm text-muted-foreground">
              <p className="mt-1">
                Invoice was created on {formatDate(invoice.issueDate)}.
                {invoice.dueDate && ` Due date: ${formatDate(invoice.dueDate)}`}
              </p>
            </div>

            {/* Actions */}
            <div className="action-buttons mt-6 pt-6 border-t flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Close
              </button>
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download PDF
              </button>
              {invoice.status === "sent" && (
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Mark as Paid
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewInvoice;
