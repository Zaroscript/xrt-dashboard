import { Badge } from '@/components/ui/badge';
import type { User } from '@/stores/types';

// Figure out the user's status from their properties
const getUserStatus = (user: User): 'pending' | 'active' | 'blocked' | 'rejected' => {
  if (!user.isApproved) return 'pending';
  if (!user.isActive) return 'blocked';
  return 'active';
};

export const StatusBadge = ({ user }: { user: User }) => {
  const status = getUserStatus(user);
  
  const variants: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    rejected: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  };

  return (
    <Badge className={`text-xs ${variants[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default StatusBadge;

