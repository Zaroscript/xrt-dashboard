import { useState, useCallback } from "react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import type { Client } from "@/stores/types";

export const useExportClients = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = useCallback(async (clients: Client[]) => {
    try {
      setIsExporting(true);

      // Prepare CSV content
      const headers = [
        "Name",
        "Email",
        "Phone",
        "Company",
        "Status",
        "Monthly Revenue ($)",
        "Join Date",
        "Last Active",
      ];

      const csvContent = [
        headers.join(","),
        ...clients.map((client) => {
          const user = typeof client.user === "object" ? client.user : null;
          const name =
            client.name || (user ? `${user.fName} ${user.lName}` : "N/A");
          const email = client.email || (user ? user.email : "N/A");
          const phone = client.phone || (user ? user.phone : "N/A");

          return [
            `"${name.replace(/"/g, '""')}"`,
            `"${email}"`,
            `"${phone || ""}"`,
            `"${client.companyName || ""}"`,
            `"${client.isActive ? "Active" : "Inactive"}"`,
            `"${client.revenue?.toFixed(2) || "0.00"}"`,
            `"${new Date(client.createdAt).toLocaleDateString()}"`,
            `"${new Date(client.lastActive).toLocaleString()}"`,
          ].join(",");
        }),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      saveAs(
        blob,
        `clients_export_${new Date().toISOString().split("T")[0]}.csv`
      );

      toast.success("Clients exported successfully!");
      return true;
    } catch (error) {
      console.error("Error exporting clients:", error);
      toast.error("Failed to export clients. Please try again.");
      return false;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, exportToCSV };
};
