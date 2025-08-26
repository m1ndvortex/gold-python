import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import type { WorkflowStage } from './WorkflowIndicator';

interface ApprovalRule {
  role: string;
  amountThreshold: number;
  required: boolean;
}

interface ApprovalHistory {
  id: string;
  approver: {
    id: string;
    name: string;
    role: string;
  };
  action: 'approved' | 'rejected' | 'requested';
  notes?: string;
  timestamp: string;
}

interface ApprovalSystemProps {
  invoiceId: string;
  currentStage: WorkflowStage;
  totalAmount: number;
  approvalRequired: boolean;
  approvalRules: ApprovalRule[];
  approvalHistory: ApprovalHistory[];
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  onApprove: (notes?: string) => Promise<void>;
  onReject: (notes: string) => Promise<void>;
  onRequestApproval: (notes?: string) => Promise<void>;
  className?: string;
}

export const ApprovalSystem: React.FC<ApprovalSystemProps> = ({
  invoiceId,
  currentStage,
  totalAmount,
  approvalRequired,
  approvalRules,
  approvalHistory,
  currentUser,
  onApprove,
  onReject,
  onRequestApproval,
  className = ''
}) => {
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if current user can approve
  const canApprove = approvalRules.some(rule => 
    rule.role === currentUser.role && totalAmount >= rule.amountThreshold
  );

  // Get applicable approval rule
  const applicableRule = approvalRules.find(rule => 
    totalAmount >= rule.amountThreshold
  );

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(notes);
      setNotes('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setIsProcessing(true);
    try {
      await onReject(notes);
      setNotes('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestApproval = async () => {
    setIsProcessing(true);
    try {
      await onRequestApproval(notes);
      setNotes('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={cn("border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-blue-800">Approval System</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Approval Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Approval Status:</span>
              {currentStage === 'pending_approval' && (
                <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-0 shadow-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Approval
                </Badge>
              )}
              {currentStage === 'approved' && (
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0 shadow-sm">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              )}
              {currentStage === 'draft' && approvalRequired && (
                <Badge className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-0 shadow-sm">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Approval Required
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              Invoice Amount: <span className="font-medium">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Approval Rules */}
          {applicableRule && (
            <div className="p-3 bg-blue-50/50 border border-blue-200/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Approval Rule</span>
              </div>
              <div className="text-sm text-blue-700">
                <p>Required Role: <span className="font-medium">{applicableRule.role}</span></p>
                <p>Threshold: <span className="font-medium">${applicableRule.amountThreshold.toFixed(2)}</span></p>
                <p>Status: <span className="font-medium">{applicableRule.required ? 'Required' : 'Optional'}</span></p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Approval Actions */}
        {currentStage === 'draft' && approvalRequired && (
          <div className="space-y-4">
            <h4 className="font-medium text-blue-800">Request Approval</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="approval-notes">Notes (Optional)</Label>
                <Textarea
                  id="approval-notes"
                  placeholder="Add any notes for the approver..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleRequestApproval}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isProcessing ? 'Requesting...' : 'Request Approval'}
              </Button>
            </div>
          </div>
        )}

        {currentStage === 'pending_approval' && canApprove && (
          <div className="space-y-4">
            <h4 className="font-medium text-blue-800">Approval Decision</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="decision-notes">Notes</Label>
                <Textarea
                  id="decision-notes"
                  placeholder="Add approval/rejection notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Approving...' : 'Approve'}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isProcessing || !notes.trim()}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all duration-300"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStage === 'pending_approval' && !canApprove && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700">
                You don't have permission to approve this invoice. Required role: {applicableRule?.role}
              </span>
            </div>
          </div>
        )}

        <Separator />

        {/* Approval History */}
        <div className="space-y-4">
          <h4 className="font-medium text-blue-800">Approval History</h4>
          {approvalHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approval history yet</p>
          ) : (
            <div className="space-y-3">
              {approvalHistory.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 bg-white/50 border border-blue-200/50 rounded-lg">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shadow-sm",
                    entry.action === 'approved' && "bg-gradient-to-br from-green-500 to-emerald-600",
                    entry.action === 'rejected' && "bg-gradient-to-br from-red-500 to-rose-600",
                    entry.action === 'requested' && "bg-gradient-to-br from-blue-500 to-indigo-600"
                  )}>
                    {entry.action === 'approved' && <CheckCircle className="h-4 w-4 text-white" />}
                    {entry.action === 'rejected' && <XCircle className="h-4 w-4 text-white" />}
                    {entry.action === 'requested' && <Clock className="h-4 w-4 text-white" />}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{entry.approver.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {entry.approver.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "text-xs border-0 shadow-sm",
                        entry.action === 'approved' && "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700",
                        entry.action === 'rejected' && "bg-gradient-to-r from-red-100 to-rose-100 text-red-700",
                        entry.action === 'requested' && "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700"
                      )}>
                        {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                      </Badge>
                    </div>
                    
                    {entry.notes && (
                      <div className="flex items-start gap-2 mt-2">
                        <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5" />
                        <p className="text-xs text-muted-foreground">{entry.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};