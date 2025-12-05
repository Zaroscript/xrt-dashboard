import { motion } from "framer-motion";
import {
  Edit,
  Trash2,
  Percent,
  Crown,
  Zap,
  Star,
  Users,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  ZapOff,
  Check,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Plan } from "@/services/api/plansService";
import { format } from "date-fns";

export const PlanCard: React.FC<{
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDelete: (id: string) => void;
  onToggleStatus?: (id: string, currentStatus: boolean) => void;
  isUpdating?: boolean;
}> = ({ plan, onEdit, onDelete, onToggleStatus, isUpdating = false }) => {
  const getPlanIcon = () => {
    switch (plan.name.toLowerCase()) {
      case "basic":
        return { icon: Users, color: "text-blue-500" };
      case "professional":
        return { icon: Star, color: "text-purple-500" };
      case "premium":
        return { icon: Crown, color: "text-yellow-500" };
      case "enterprise":
        return { icon: Zap, color: "text-emerald-500" };
      default:
        return { icon: Zap, color: "text-primary" };
    }
  };

  const { icon: PlanIcon, color: iconColor } = getPlanIcon();
  const hasDiscount =
    plan.discount &&
    (plan.discount.type === "percentage" || plan.discount.type === "fixed");
  const isActive = plan.isActive !== false; // Default to true if not specified
  const isFeatured = plan.isFeatured === true; // Ensure booleans
  const discountValue = hasDiscount
    ? plan.discount?.type === "percentage"
      ? `${plan.discount.value}%`
      : `$${plan.discount.value}`
    : null;

  const calculateDiscountedPrice = () => {
    if (!hasDiscount) return plan.price;

    if (plan.discount?.type === "percentage") {
      return plan.price * (1 - plan.discount.value / 100);
    } else {
      return Math.max(0, plan.price - (plan.discount?.value || 0));
    }
  };

  const originalPrice = plan.price;
  const discountedPrice = calculateDiscountedPrice();
  const showDiscount = hasDiscount && discountedPrice < originalPrice;

  const isPlanActive = plan.isActive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
          !isActive && "opacity-70",
          isFeatured && "ring-2 ring-yellow-400"
        )}
      >
        {isUpdating && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        {plan.isFeatured && (
          <div className="absolute top-0 right-0 m-2">
            <Badge variant="default" className="bg-yellow-100 text-yellow-800">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}

        {!isActive && (
          <div className="absolute top-0 left-0 w-full h-full bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Badge variant="outline" className="bg-background/80">
              <ZapOff className="w-3 h-3 mr-1" />
              Inactive
            </Badge>
          </div>
        )}

        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${iconColor}/10`}>
                <PlanIcon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">
                  {plan.name}
                  {plan.badge?.text && (
                    <Badge
                      variant={plan.badge.variant || "default"}
                      className="ml-2"
                    >
                      {plan.badge.text}
                    </Badge>
                  )}
                  {isFeatured && (
                    <Badge
                      variant="default"
                      className="ml-2 bg-yellow-100 text-yellow-800"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </CardTitle>
                <Badge
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "text-xs",
                    isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  )}
                >
                  {isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(plan)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Plan
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(plan._id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="flex items-end mb-4">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  ${discountedPrice.toFixed(2)}
                </span>
                {showDiscount && (
                  <span className="text-sm line-through text-muted-foreground">
                    ${originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  /{plan.duration === 1 ? "month" : `${plan.duration} months`}
                </span>
              </div>

              {hasDiscount && plan.discount && (
                <div className="flex items-center mt-1">
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    <Percent className="w-3 h-3 mr-1" />
                    {discountValue} OFF
                  </Badge>
                  {plan.discount.endDate && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      until{" "}
                      {format(new Date(plan.discount.endDate), "MMM d, yyyy")}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <ul className="space-y-3">
            {plan.features?.map((feature, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="mt-auto pt-4 border-t">
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center text-xs text-muted-foreground">
              {isPlanActive ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mr-1.5" />
                  <span>Active</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-muted-foreground/70 mr-1.5" />
                  <span>Inactive</span>
                </>
              )}
            </div>
            <Badge variant="outline" className="text-xs">
              {plan.duration} {plan.duration === 1 ? "month" : "months"}
            </Badge>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PlanCard;
