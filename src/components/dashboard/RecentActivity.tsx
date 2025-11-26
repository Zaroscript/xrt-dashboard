import { motion } from 'framer-motion';
import { Activity, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface ActivityItemType {
  id: string;
  type: 'user_signup' | 'payment' | 'support_ticket' | 'project_created';
  message: string;
  timestamp: string;
  user?: string;
}

export const ActivityItem: React.FC<{ activity: ActivityItemType; index: number }> = ({ activity, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-smooth"
  >
    <div className="flex-shrink-0">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Activity className="w-4 h-4 text-primary" />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{activity.message}</p>
      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>{activity.timestamp}</span>
        {activity.user && <Badge variant="outline" className="text-xs">{activity.user}</Badge>}
      </div>
    </div>
  </motion.div>
);

export const RecentActivityCard: React.FC<{ activities: ActivityItemType[] | undefined | null }> = ({ activities }) => {
  // Ensure activities is an array before mapping
  const safeActivities = Array.isArray(activities) ? activities : [];
  
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-primary" />
          <span>Recent Activity</span>
        </CardTitle>
        <CardDescription>Latest activities across your platform</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {safeActivities.length > 0 ? (
          safeActivities.map((activity, index) => (
            <ActivityItem key={activity.id || index} activity={activity} index={index} />
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No recent activities found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;

