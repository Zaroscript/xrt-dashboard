import { useState, useCallback } from "react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import type { Subscriber } from "@/stores/types";
import { format } from "date-fns";

export const useExportSubscribers = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = useCallback(async (subscribers: Subscriber[]) => {
    try {
      setIsExporting(true);

      // Prepare CSV content
      const headers = [
        "User",
        "Email",
        "Plan",
        "Status",
        "Price",
        "Billing Cycle",
        "Start Date",
        "End Date",
      ];

      const csvContent = [
        headers.join(","),
        ...subscribers.map((sub) => {
          const user = typeof sub.user === "object" ? sub.user : null;
          const name = user ? `${user.fName} ${user.lName}` : "N/A";
          const email = user ? user.email : "N/A";
          const planName =
            typeof sub.plan.plan === "object"
              ? sub.plan.plan.name
              : sub.plan.plan || "N/A";

          return [
            `"${name.replace(/"/g, '""')}"`,
            `"${email}"`,
            `"${planName}"`,
            `"${sub.status}"`,
            `"${sub.price || 0}"`,
            `"${sub.billingCycle || "monthly"}"`,
            `"${
              sub.plan.startDate
                ? format(new Date(sub.plan.startDate), "yyyy-MM-dd")
                : "N/A"
            }"`,
            `"${
              sub.plan.endDate
                ? format(new Date(sub.plan.endDate), "yyyy-MM-dd")
                : "N/A"
            }"`,
          ].join(",");
        }),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      saveAs(
        blob,
        `subscribers_export_${new Date().toISOString().split("T")[0]}.csv`
      );

      toast.success("Subscribers exported successfully!");
      return true;
    } catch (error) {
      console.error("Error exporting subscribers:", error);
      toast.error("Failed to export subscribers. Please try again.");
      return false;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, exportToCSV };
};
