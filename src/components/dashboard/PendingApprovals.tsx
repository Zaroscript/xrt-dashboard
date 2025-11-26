import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface PendingUser {
  _id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface PendingApprovalsProps {
  pendingUsers: PendingUser[];
  onApprove: (userId: string) => Promise<{ success: boolean; error?: string }>;
  onReject: (userId: string) => Promise<{ success: boolean; error?: string }>;
  className?: string;
}

export const PendingApprovals: React.FC<PendingApprovalsProps> = ({
  pendingUsers = [],
  onApprove,
  onReject,
  className = '',
}) => {
  if (!pendingUsers.length) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pending Approvals</CardTitle>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500">
            {pendingUsers.length} Pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingUsers.slice(0, 3).map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium">{user.name || user.email}</p>
                <p className="text-sm text-muted-foreground">
                  {user.role} • {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const { error } = await onApprove(user._id);
                    if (error) {
                      // You might want to show a toast notification here
                      console.error('Failed to approve user:', error);
                    }
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500"
                  onClick={async () => {
                    const { error } = await onReject(user._id);
                    if (error) {
                      // You might want to show a toast notification here
                      console.error('Failed to reject user:', error);
                    }
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingApprovals;
