import React from 'react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { CheckCircle, Clock, AlertCircle, XCircle, FileText, Eye, DollarSign } from 'lucide-react';
import { cn } from '../../lib/utils';

export type WorkflowStage = 'draft' | 'pending_approval' | 'approved' | 'paid' | 'cancelled';

interface WorkflowIndicatorProps {
  currentStage: WorkflowStage;
  approvalRequired?: boolean;
  className?: string;
  showProgress?: boolean;
  compact?: boolean;
}

const workflowStages = [
  { key: 'draft', label: 'Draft', icon: FileText, color: 'slate' },
  { key: 'pending_approval', label: 'Pending Approval', icon: Clock, color: 'amber' },
  { key: 'approved', label: 'Approved', icon: CheckCircle, color: 'blue' },
  { key: 'paid', label: 'Paid', icon: DollarSign, color: 'green' },
] as const;

const getStageIndex = (stage: WorkflowStage): number => {
  const index = workflowStages.findIndex(s => s.key === stage);
  return index === -1 ? 0 : index;
};

const getStageColor = (stage: WorkflowStage): string => {
  if (stage === 'cancelled') return 'red';
  const stageData = workflowStages.find(s => s.key === stage);
  return stageData?.color || 'slate';
};

const getStageIcon = (stage: WorkflowStage) => {
  if (stage === 'cancelled') return XCircle;
  const stageData = workflowStages.find(s => s.key === stage);
  return stageData?.icon || FileText;
};

export const WorkflowIndicator: React.FC<WorkflowIndicatorProps> = ({
  currentStage,
  approvalRequired = false,
  className = '',
  showProgress = true,
  compact = false
}) => {
  const currentIndex = getStageIndex(currentStage);
  const color = getStageColor(currentStage);
  const Icon = getStageIcon(currentStage);
  
  // Calculate progress percentage
  const totalStages = approvalRequired ? workflowStages.length : workflowStages.length - 1;
  const progressPercentage = currentStage === 'cancelled' ? 0 : 
    ((currentIndex + 1) / totalStages) * 100;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center shadow-sm",
          color === 'green' && "bg-gradient-to-br from-green-500 to-emerald-600",
          color === 'blue' && "bg-gradient-to-br from-blue-500 to-indigo-600",
          color === 'amber' && "bg-gradient-to-br from-amber-500 to-orange-600",
          color === 'slate' && "bg-gradient-to-br from-slate-500 to-slate-600",
          color === 'red' && "bg-gradient-to-br from-red-500 to-rose-600"
        )}>
          <Icon className="h-3 w-3 text-white" />
        </div>
        <Badge className={cn(
          "border-0 shadow-sm",
          color === 'green' && "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700",
          color === 'blue' && "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700",
          color === 'amber' && "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700",
          color === 'slate' && "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700",
          color === 'red' && "bg-gradient-to-r from-red-100 to-rose-100 text-red-700"
        )}>
          {currentStage === 'pending_approval' ? 'Pending Approval' : 
           currentStage.charAt(0).toUpperCase() + currentStage.slice(1).replace('_', ' ')}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current Stage Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shadow-lg",
            color === 'green' && "bg-gradient-to-br from-green-500 to-emerald-600",
            color === 'blue' && "bg-gradient-to-br from-blue-500 to-indigo-600",
            color === 'amber' && "bg-gradient-to-br from-amber-500 to-orange-600",
            color === 'slate' && "bg-gradient-to-br from-slate-500 to-slate-600",
            color === 'red' && "bg-gradient-to-br from-red-500 to-rose-600"
          )}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {currentStage === 'pending_approval' ? 'Pending Approval' : 
               currentStage.charAt(0).toUpperCase() + currentStage.slice(1).replace('_', ' ')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentStage === 'draft' && 'Invoice is being prepared'}
              {currentStage === 'pending_approval' && 'Waiting for manager approval'}
              {currentStage === 'approved' && 'Invoice approved, stock impacted'}
              {currentStage === 'paid' && 'Payment received, invoice complete'}
              {currentStage === 'cancelled' && 'Invoice has been cancelled'}
            </p>
          </div>
        </div>
        
        <Badge className={cn(
          "border-0 shadow-sm text-sm px-3 py-1",
          color === 'green' && "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700",
          color === 'blue' && "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700",
          color === 'amber' && "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700",
          color === 'slate' && "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700",
          color === 'red' && "bg-gradient-to-r from-red-100 to-rose-100 text-red-700"
        )}>
          {currentStage === 'cancelled' ? 'Cancelled' : `Stage ${currentIndex + 1} of ${totalStages}`}
        </Badge>
      </div>

      {/* Progress Bar */}
      {showProgress && currentStage !== 'cancelled' && (
        <div className="space-y-2">
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
        </div>
      )}

      {/* Stage Timeline */}
      <div className="flex items-center justify-between">
        {workflowStages
          .filter(stage => !approvalRequired ? stage.key !== 'pending_approval' : true)
          .map((stage, index) => {
            const isActive = stage.key === currentStage;
            const isCompleted = getStageIndex(stage.key) < currentIndex;
            const StageIcon = stage.icon;
            
            return (
              <div key={stage.key} className="flex flex-col items-center gap-2">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isActive && "border-transparent shadow-lg",
                  isCompleted && "border-green-300 bg-green-50",
                  !isActive && !isCompleted && "border-slate-300 bg-slate-50",
                  isActive && stage.color === 'green' && "bg-gradient-to-br from-green-500 to-emerald-600",
                  isActive && stage.color === 'blue' && "bg-gradient-to-br from-blue-500 to-indigo-600",
                  isActive && stage.color === 'amber' && "bg-gradient-to-br from-amber-500 to-orange-600",
                  isActive && stage.color === 'slate' && "bg-gradient-to-br from-slate-500 to-slate-600"
                )}>
                  <StageIcon className={cn(
                    "h-4 w-4",
                    isActive && "text-white",
                    isCompleted && "text-green-600",
                    !isActive && !isCompleted && "text-slate-400"
                  )} />
                </div>
                <span className={cn(
                  "text-xs font-medium text-center",
                  isActive && "text-foreground",
                  isCompleted && "text-green-600",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}>
                  {stage.label}
                </span>
              </div>
            );
          })}
      </div>

      {/* Approval Required Notice */}
      {approvalRequired && currentStage === 'draft' && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-700">
            This invoice requires approval before stock impact
          </span>
        </div>
      )}
    </div>
  );
};