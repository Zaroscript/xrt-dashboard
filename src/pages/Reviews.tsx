import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Filter,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReviewsStore } from "@/stores/portfolio/useReviewsStore";
import type { Review } from "@/stores/portfolio/useReviewsStore";

const ReviewCard = ({
  review,
  onUpdate,
}: {
  review: Review;
  onUpdate: (review: Review) => void;
}) => {
  const handleApprovalChange = (isApproved: boolean) => {
    onUpdate({
      ...review,
      isApproved,
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? "text-yellow-500 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        className={`glass-card-hover overflow-hidden relative ${
          review.isApproved
            ? "ring-1 ring-green-500/30"
            : "ring-1 ring-yellow-500/30"
        }`}
      >
        <div
          className={`absolute top-0 left-0 w-full h-1 ${
            review.isApproved
              ? "bg-gradient-to-r from-green-500 to-green-600"
              : "bg-gradient-to-r from-yellow-500 to-yellow-600"
          }`}
        />

        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.clientEmail}`}
                />
                <AvatarFallback>
                  {review.clientName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <div>
                  <h3 className="font-bold text-foreground">
                    {review.clientName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {review.clientEmail}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {review.rating}/5
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge
                    className={
                      review.isApproved
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    }
                  >
                    {review.isApproved ? "Approved" : "Pending Approval"}
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
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" />
                  View Project
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Client
                </DropdownMenuItem>
                {!review.isApproved ? (
                  <DropdownMenuItem
                    onClick={() => handleApprovalChange(true)}
                    className="text-green-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Review
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => handleApprovalChange(false)}
                    className="text-red-600"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Unapprove Review
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Review</h4>
              <p className="text-sm text-foreground leading-relaxed">
                "{review.comment}"
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
              <span>Project ID: {review.projectId}</span>
              <span>
                Submitted {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>

            {!review.isApproved && (
              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleApprovalChange(true)}
                  className="bg-success text-success-foreground"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button size="sm" variant="outline">
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Reviews = () => {
  const { reviews, setReviews, updateReview } = useReviewsStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  useEffect(() => {
    // Simulate loading reviews data
    setTimeout(() => {
      const mockReviews: Review[] = [
        {
          id: "1",
          projectId: "proj-001",
          clientName: "Sarah Wilson",
          clientEmail: "sarah@italianbistro.com",
          rating: 5,
          comment:
            "Absolutely fantastic work! The recipe sharing website you created for our Italian bistro exceeded all expectations. The design is beautiful, user-friendly, and our customers love sharing their family recipes. The integration with our existing systems was seamless.",
          isApproved: true,
          createdAt: "2024-01-15T14:30:00Z",
        },
        {
          id: "2",
          projectId: "proj-002",
          clientName: "Mike Johnson",
          clientEmail: "mike@spicepalace.com",
          rating: 4,
          comment:
            "Great experience working with this team. The recipe management system has really helped streamline our restaurant operations. Minor issues with the mobile responsiveness initially, but they were quickly resolved. Highly recommend!",
          isApproved: true,
          createdAt: "2024-01-12T09:45:00Z",
        },
        {
          id: "3",
          projectId: "proj-003",
          clientName: "Emily Davis",
          clientEmail: "emily@greenharvest.com",
          rating: 5,
          comment:
            "The custom recipe sharing platform they built for our farm-to-table restaurant is incredible. Our customers can now easily find seasonal recipes using our fresh ingredients. The team was professional, responsive, and delivered exactly what we needed.",
          isApproved: false,
          createdAt: "2024-01-18T16:20:00Z",
        },
        {
          id: "4",
          projectId: "proj-004",
          clientName: "Alex Rodriguez",
          clientEmail: "alex@citrusfresh.com",
          rating: 4,
          comment:
            "Very pleased with the recipe blog website. The clean design and easy-to-use interface has helped us grow our online community significantly. The SEO optimization features have been particularly valuable.",
          isApproved: false,
          createdAt: "2024-01-20T11:15:00Z",
        },
        {
          id: "5",
          projectId: "proj-005",
          clientName: "Lisa Chen",
          clientEmail: "lisa@dragonkitchen.com",
          rating: 5,
          comment:
            "Outstanding work on our Asian fusion recipe platform! The multi-language support and cultural recipe categorization features are exactly what we needed. Customer support has been excellent throughout the entire process.",
          isApproved: true,
          createdAt: "2024-01-08T13:00:00Z",
        },
        {
          id: "6",
          projectId: "proj-006",
          clientName: "David Miller",
          clientEmail: "david@craftbakery.com",
          rating: 3,
          comment:
            "The recipe sharing website works well overall, but there were some delays in delivery and a few features that needed adjustment after launch. The final product is good, but the process could have been smoother.",
          isApproved: false,
          createdAt: "2024-01-22T10:30:00Z",
        },
      ];

      setReviews(mockReviews);
    }, 1000);
  }, [setReviews]);

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesApproval =
      approvalFilter === "all" ||
      (approvalFilter === "approved" && review.isApproved) ||
      (approvalFilter === "pending" && !review.isApproved);

    const matchesRating =
      ratingFilter === "all" || review.rating.toString() === ratingFilter;

    return matchesSearch && matchesApproval && matchesRating;
  });

  const handleReviewUpdate = (updatedReview: Review) => {
    updateReview(updatedReview);
  };

  const stats = {
    total: reviews.length,
    approved: reviews.filter((r) => r.isApproved).length,
    pending: reviews.filter((r) => !r.isApproved).length,
    averageRating:
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ).toFixed(1)
        : "0",
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
            <Star className="w-8 h-8 text-primary" />
            <span>Client Reviews</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and approve client reviews for your portfolio projects
          </p>
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" className="glass-card">
            Export Reviews
          </Button>
          <Button className="bg-gold-gradient text-primary-foreground shadow-gold">
            <Star className="w-4 h-4 mr-2" />
            Featured Reviews
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Reviews",
            value: stats.total,
            icon: MessageSquare,
            color: "from-blue-500 to-blue-600",
            description: "All client reviews",
          },
          {
            label: "Approved",
            value: stats.approved,
            icon: CheckCircle,
            color: "from-green-500 to-green-600",
            description: "Live on website",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: Eye,
            color: "from-yellow-500 to-yellow-600",
            description: "Awaiting approval",
          },
          {
            label: "Avg Rating",
            value: `${stats.averageRating}/5`,
            icon: Star,
            color: "from-purple-500 to-purple-600",
            description: "Overall satisfaction",
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
            placeholder="Search reviews by client name, email, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-card"
          />
        </div>

        <Select value={approvalFilter} onValueChange={setApprovalFilter}>
          <SelectTrigger className="w-full sm:w-48 glass-card">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-card">
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-full sm:w-32 glass-card">
            <Star className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-card">
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredReviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ReviewCard review={review} onUpdate={handleReviewUpdate} />
          </motion.div>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No reviews found
          </h3>
          <p className="text-muted-foreground">
            {searchTerm
              ? "Try adjusting your search terms or filters"
              : "Client reviews will appear here once submitted"}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Reviews;
