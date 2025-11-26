import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Invoice } from "@/stores/support/types";
import { DollarSign, Download as DownloadIcon } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { loadCompanySettings } from "@/utils/settings";

interface ViewInvoiceProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

interface CompanySettings {
  companyName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  taxId: string;
}

const ViewInvoice = ({ invoice, isOpen, onClose }: ViewInvoiceProps) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: 'Your Company Name',
    address: '123 Business Street',
    city: 'City',
    state: 'ST',
    zip: '12345',
    email: 'contact@example.com',
    phone: '+1 (555) 123-4567',
    taxId: 'TAX-123456789',
  });

  useEffect(() => {
    // Load company settings when component mounts
    const settings = loadCompanySettings();
    if (settings) {
      setCompanySettings(settings);
    }
  }, []);

  if (!invoice) return null;

  const handleDownloadPdf = async () => {
    if (!pdfRef.current) return;
    
    try {
      // Hide elements before capturing
      const elementsToHide = Array.from(document.querySelectorAll('.action-buttons, .status-badge'));
      elementsToHide.forEach(el => el.classList.add('invisible'));
      
      // Get the dialog dimensions
      const dialog = pdfRef.current.closest('[role="dialog"]');
      const width = dialog?.clientWidth || 794; // Fallback to A4 width if dialog not found
      const height = dialog?.clientHeight || 1123; // Fallback to A4 height if dialog not found
      
      // Calculate scale to fit content
      const content = pdfRef.current;
      const contentWidth = content.scrollWidth;
      const contentHeight = content.scrollHeight;
      const scale = Math.min(1, width / contentWidth);
      
      const canvas = await html2canvas(content, {
        scale: window.devicePixelRatio * 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: contentWidth,
        height: contentHeight,
        windowWidth: content.scrollWidth,
        windowHeight: content.scrollHeight,
        ignoreElements: (element) => {
          return element.classList.contains('action-buttons') || 
                 element.classList.contains('status-badge');
        }
      });
      
      // Restore visibility after capture
      elementsToHide.forEach(el => el.classList.remove('invisible'));
      
      // Create PDF with the same dimensions as the dialog
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: contentWidth > contentHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [contentWidth, contentHeight]
      });
      
      // Add image to PDF without scaling
      pdf.addImage(imgData, 'PNG', 0, 0, contentWidth, contentHeight);
      
      pdf.save(`invoice-${invoice.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-y-auto max-h-[90vh]">
        <div className="bg-background rounded-lg p-6" ref={pdfRef}>
          {/* Hidden title for PDF */}
          <h1 className="sr-only">Invoice #{invoice.id}</h1>
          
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Invoice #{invoice.id}</h2>
                </div>
                <p className="text-muted-foreground mt-2">
                  Issued on {formatDate(invoice.createdAt)}
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
              <p className="font-medium">Your Company Name</p>
              <p className="text-muted-foreground">123 Business Street</p>
              <p className="text-muted-foreground">City, ST 12345</p>
              <p className="text-muted-foreground">contact@example.com</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Bill To</h3>
              <p className="font-medium">{invoice.userName}</p>
              <p className="text-muted-foreground">{invoice.userEmail}</p>
              {invoice.userAddress && (
                <>
                  <p className="text-muted-foreground">
                    {invoice.userAddress.street}
                  </p>
                  <p className="text-muted-foreground">
                    {invoice.userAddress.city}, {invoice.userAddress.state}{" "}
                    {invoice.userAddress.zip}
                  </p>
                </>
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
                      Quantity
                    </th>
                    <th className="text-right py-3 px-4 font-medium">
                      Unit Price
                    </th>
                    <th className="text-right py-3 px-4 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-3 px-4">
                        <p className="font-medium">{item.description}</p>
                        {item.details && (
                          <p className="text-sm text-muted-foreground">
                            {item.details}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
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
                {invoice.taxAmount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tax
                    </span>
                    <span>${invoice.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {invoice.discountAmount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-600">
                      -${invoice.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${invoice.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{localStorage.getItem('companyName')}</h2>
                <p className="text-sm text-muted-foreground">
                  {localStorage.getItem('address')}<br />
                  {localStorage.getItem('city')}, {localStorage.getItem('state')} {localStorage.getItem('zip')}<br />
                  {localStorage.getItem('phone')} | {localStorage.getItem('email')}<br />
                  Tax ID: {localStorage.getItem('taxId')}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 pb-6 border-t text-center text-sm text-muted-foreground">
              <p className="mt-1">
                Invoice was created on {formatDate(invoice.createdAt)}.
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
