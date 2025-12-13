import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Clock,
  Send,
  Reply,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  MoreHorizontal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTicketsStore } from "@/stores/tickets/useTicketsStore";
import type { Ticket as SupportTicket } from "@/stores/types";

const TicketCard = ({
  ticket,
  onUpdate,
}: {
  ticket: SupportTicket;
  onUpdate: (ticket: SupportTicket) => void;
}) => {
  const [showResponses, setShowResponses] = useState(false);
  const [newResponse, setNewResponse] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const handleStatusChange = (newStatus: SupportTicket["status"]) => {
    onUpdate({
      ...ticket,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSendResponse = () => {
    if (!newResponse.trim()) return;

    const updatedTicket = {
      ...ticket,
      responses: [
        ...ticket.responses,
        {
          _id: Date.now().toString(),
          message: newResponse,
          isAdmin: true,
          user: "Admin",
          createdAt: new Date(),
        },
      ],
      status: "in_progress" as const,
      updatedAt: new Date().toISOString(),
    };

    onUpdate(updatedTicket);
    setNewResponse("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className="glass-card-hover">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${
                    typeof ticket.user === "object" ? ticket.user.email : "user"
                  }`}
                />
                <AvatarFallback>
                  {(typeof ticket.user === "object"
                    ? `${ticket.user.fName} ${ticket.user.lName}`
                    : "U"
                  )
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">
                  {ticket.title}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>
                    {typeof ticket.user === "object"
                      ? `${ticket.user.fName} ${ticket.user.lName}`
                      : "User"}
                  </span>
                  <span>•</span>
                  <span>
                    {typeof ticket.user === "object" ? ticket.user.email : ""}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status.charAt(0).toUpperCase() +
                      ticket.status.slice(1).replace("_", " ")}
                  </Badge>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority.charAt(0).toUpperCase() +
                      ticket.priority.slice(1)}{" "}
                    Priority
                  </Badge>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card">
                <DropdownMenuItem
                  onClick={() => handleStatusChange("in_progress")}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Mark In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange("resolved")}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Resolved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("closed")}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Close Ticket
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mb-4">
            <p className="text-sm text-foreground">{ticket.message}</p>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <span>
              Created {new Date(ticket.createdAt).toLocaleDateString()}
            </span>
            <span>
              Updated {new Date(ticket.updatedAt).toLocaleDateString()}
            </span>
          </div>

          {ticket.responses.length > 0 && (
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResponses(!showResponses)}
                className="mb-3"
              >
                <Reply className="w-4 h-4 mr-2" />
                {showResponses ? "Hide" : "Show"} Responses (
                {ticket.responses.length})
              </Button>

              {showResponses && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {ticket.responses.map((response, index) => (
                    <div
                      key={response._id || index}
                      className={`p-3 rounded-lg ${
                        response.isAdmin
                          ? "bg-primary/10 border-l-2 border-primary"
                          : "bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {response.isAdmin
                            ? "Admin User"
                            : typeof ticket.user === "object"
                            ? `${ticket.user.fName} ${ticket.user.lName}`
                            : "User"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(response.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        {response.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {ticket.status !== "closed" && (
            <div className="border-t pt-4 space-y-3">
              <Textarea
                placeholder="Type your response..."
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                className="glass-card"
                rows={3}
              />
              <Button
                onClick={handleSendResponse}
                disabled={!newResponse.trim()}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Response
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Support = () => {
  const {
    tickets,
    statusFilter,
    loading,
    setTickets,
    updateTicket,
    setStatusFilter,
  } = useTicketsStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filter = statusFilter;

  useEffect(() => {
    // Simulate loading support tickets
    setTimeout(() => {
      const mockTickets: SupportTicket[] = [
        {
          _id: "1",
          user: {
            _id: "1",
            fName: "Sarah",
            lName: "Wilson",
            email: "sarah@restaurant.com",
            role: "client",
            isActive: true,
            isApproved: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
            companyName: "Restaurant",
            phone: "123",
            refreshTokens: [],
          },
          title: "Recipe import not working",
          message:
            "I'm having trouble importing recipes from my old website. The CSV upload keeps failing with an error message.",
          status: "open",
          priority: "high",
          responses: [],
          createdAt: "2024-01-20T10:30:00Z",
          updatedAt: "2024-01-20T10:30:00Z",
          category: "technical",
          isActive: true,
        },
        {
          _id: "2",
          user: {
            _id: "2",
            fName: "Mike",
            lName: "Johnson",
            email: "mike@bistro.com",
            role: "client",
            isActive: true,
            isApproved: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
            companyName: "Bistro",
            phone: "123",
            refreshTokens: [],
          },
          title: "Custom domain setup help",
          message:
            "I need assistance setting up my custom domain for my recipe website. I have the domain but need help with DNS configuration.",
          status: "in_progress",
          priority: "medium",
          responses: [
            {
              message:
                "Hi Mike, I can help you with the domain setup. Could you please provide your domain name and current DNS provider?",
              isAdmin: true,
              user: "Admin Support",
              createdAt: new Date("2024-01-20T11:00:00Z"),
            },
            {
              message:
                "The domain is mybistro.com and I'm using GoDaddy as my DNS provider.",
              isAdmin: false,
              user: "Mike Johnson",
              createdAt: new Date("2024-01-20T11:15:00Z"),
            },
          ],
          createdAt: "2024-01-20T09:15:00Z",
          updatedAt: "2024-01-20T11:15:00Z",
          category: "technical",
          isActive: true,
        },
        {
          _id: "3",
          user: {
            _id: "3",
            fName: "Emily",
            lName: "Davis",
            email: "emily@foodblog.com",
            role: "client",
            isActive: true,
            isApproved: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
            companyName: "FoodBlog",
            phone: "123",
            refreshTokens: [],
          },
          title: "Payment method update",
          message:
            "I need to update my payment method for my subscription. My current card is expiring soon.",
          status: "resolved",
          priority: "low",
          responses: [
            {
              message:
                "You can update your payment method in your account settings under the billing section. Let me know if you need any assistance.",
              isAdmin: true,
              user: "Admin Support",
              createdAt: new Date("2024-01-19T14:30:00Z"),
            },
            {
              message:
                "Perfect, I found it and updated successfully. Thank you!",
              isAdmin: false,
              user: "Emily Davis",
              createdAt: new Date("2024-01-19T14:45:00Z"),
            },
          ],
          createdAt: "2024-01-19T14:20:00Z",
          updatedAt: "2024-01-19T14:45:00Z",
          category: "billing",
          isActive: true,
        },
      ];

      setTickets(mockTickets);
    }, 1000);
  }, [setTickets]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      (ticket.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof ticket.user === "object"
        ? `${ticket.user.fName} ${ticket.user.lName}`
        : ""
      )
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (typeof ticket.user === "object" ? ticket.user.email : "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || ticket.status === filter;

    return matchesSearch && matchesFilter;
  });

  const handleTicketUpdate = (updatedTicket: SupportTicket) => {
    updateTicket(updatedTicket._id, updatedTicket);
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
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
            <MessageSquare className="w-8 h-8 text-primary" />
            <span>Support Tickets</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage customer support tickets and provide assistance
          </p>
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" className="glass-card">
            <Clock className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button className="bg-gold-gradient text-primary-foreground shadow-gold">
            <Send className="w-4 h-4 mr-2" />
            Send Broadcast
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Tickets",
            value: stats.total,
            icon: MessageSquare,
            color: "from-blue-500 to-blue-600",
          },
          {
            label: "Open",
            value: stats.open,
            icon: AlertCircle,
            color: "from-red-500 to-red-600",
          },
          {
            label: "In Progress",
            value: stats.inProgress,
            icon: Clock,
            color: "from-yellow-500 to-yellow-600",
          },
          {
            label: "Resolved",
            value: stats.resolved,
            icon: CheckCircle,
            color: "from-green-500 to-green-600",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <Card className="glass-card-hover overflow-hidden relative">
              <div
                className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`}
              />
              <CardContent className="p-4 text-center">
                <div
                  className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
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
            placeholder="Search tickets by subject, user, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-card"
          />
        </div>

        <Select
          value={filter}
          onValueChange={(
            value: "all" | "open" | "in_progress" | "resolved" | "closed"
          ) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-full sm:w-48 glass-card">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-card">
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredTickets.map((ticket, index) => (
          <motion.div
            key={ticket._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <TicketCard ticket={ticket} onUpdate={handleTicketUpdate} />
          </motion.div>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No tickets found
          </h3>
          <p className="text-muted-foreground">
            {searchTerm
              ? "Try adjusting your search terms"
              : "No support tickets match the current filter"}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Support;
