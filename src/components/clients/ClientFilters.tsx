import { Search, Filter, Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientStatus } from "@/types/client.types";

export type ClientTier = "Basic" | "Pro" | "Enterprise" | "Custom";

interface ClientFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: "name" | "revenue" | "date";
  onSortChange: (value: "name" | "revenue" | "date") => void;
  status: ClientStatus | "all";
  onStatusChange: (value: ClientStatus | "all") => void;
  tier?: ClientTier | "all";
  onTierChange?: (value: ClientTier | "all") => void;
}

// Define the status options for filtering
const statusOptions = [
  { value: "all", label: "All Status", color: "bg-gray-200" },
  { value: "active", label: "Active", color: "bg-emerald-500" },
  { value: "inactive", label: "Inactive", color: "bg-gray-400" },
  { value: "pending", label: "Pending", color: "bg-amber-500" },
  { value: "suspended", label: "Suspended", color: "bg-rose-500" },
  { value: "blocked", label: "Blocked", color: "bg-gray-800" },
];

export const ClientFilters = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  status,
  onStatusChange,
  tier,
  onTierChange,
}: ClientFiltersProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search clients by name or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 glass-card bg-background/50"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={status}
          onValueChange={(value) =>
            onStatusChange(value as ClientStatus | "all")
          }
        >
          <SelectTrigger className="w-full sm:w-48 glass-card bg-background/50">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${option.color}`} />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={tier}
          onValueChange={(value) => onTierChange(value as ClientTier | "all")}
        >
          <SelectTrigger className="w-full sm:w-48 glass-card bg-background/50">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by Tier" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="Basic">Basic</SelectItem>
            <SelectItem value="Pro">Pro</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
            <SelectItem value="Custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(value) =>
            onSortChange(value as "name" | "revenue" | "date")
          }
        >
          <SelectTrigger className="w-full sm:w-48 glass-card bg-background/50">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="revenue">Sort by Revenue</SelectItem>
            <SelectItem value="date">Sort by Join Date</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ClientFilters;
