import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '../../ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../../ui/tooltip';
import {
  MessageSquare,
  Plus,
  Edit3,
  Trash2,
  MoreHorizontal,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  User,
  Calendar,
  MapPin,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  X
} from 'lucide-react';
import { chartExportService } from '../../../services/chartExportService';
import { toast } from 'sonner';

export interface Annotation {
  id: string;
  chartId: string;
  x: number;
  y: number;
  text: string;
  author: string;
  authorAvatar?: string;
  type: 'note' | 'highlight' | 'question';
  color?: string;
  createdAt: string;
  updatedAt?: string;
  isPinned?: boolean;
  isResolved?: boolean;
  replies?: AnnotationReply[];
}

export interface AnnotationReply {
  id: string;
  text: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
}

export interface ChartAnnotationsProps {
  chartId: string;
  chartElement: HTMLElement | null;
  className?: string;
  currentUser?: {
    name: string;
    avatar?: string;
  };
  onAnnotationCreate?: (annotation: Annotation) => void;
  onAnnotationUpdate?: (annotation: Annotation) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  readOnly?: boolean;
}

export const ChartAnnotations: React.FC<ChartAnnotationsProps> = ({
  chartId,
  chartElement,
  className,
  currentUser = { name: 'Anonymous User' },
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  readOnly = false
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createPosition, setCreatePosition] = useState<{ x: number; y: number } | null>(null);
  const [newAnnotation, setNewAnnotation] = useState({
    text: '',
    type: 'note' as const,
    color: '#3b82f6'
  });
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [replyText, setReplyText] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  // Load annotations on mount
  useEffect(() => {
    loadAnnotations();
  }, [chartId]);

  // Load annotations from service
  const loadAnnotations = () => {
    const loadedAnnotations = chartExportService.getAnnotations(chartId);
    setAnnotations(loadedAnnotations);
  };

  // Handle chart click for annotation creation
  const handleChartClick = useCallback((event: React.MouseEvent) => {
    if (!isAnnotationMode || readOnly) return;

    const rect = chartElement?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setCreatePosition({ x, y });
    setIsCreating(true);
  }, [isAnnotationMode, chartElement, readOnly]);

  // Create annotation
  const createAnnotation = async () => {
    if (!createPosition || !newAnnotation.text.trim()) return;

    try {
      const annotationId = chartExportService.createAnnotation(chartId, {
        x: createPosition.x,
        y: createPosition.y,
        text: newAnnotation.text,
        author: currentUser.name,
        type: newAnnotation.type,
        color: newAnnotation.color
      });

      const annotation: Annotation = {
        id: annotationId,
        chartId,
        x: createPosition.x,
        y: createPosition.y,
        text: newAnnotation.text,
        author: currentUser.name,
        authorAvatar: currentUser.avatar,
        type: newAnnotation.type,
        color: newAnnotation.color,
        createdAt: new Date().toISOString(),
        replies: []
      };

      setAnnotations(prev => [...prev, annotation]);
      onAnnotationCreate?.(annotation);

      // Reset form
      setNewAnnotation({ text: '', type: 'note', color: '#3b82f6' });
      setIsCreating(false);
      setCreatePosition(null);
      setIsAnnotationMode(false);

      toast.success('Annotation created');
    } catch (error) {
      toast.error('Failed to create annotation');
    }
  };

  // Update annotation
  const updateAnnotation = async (annotation: Annotation) => {
    try {
      const updatedAnnotation = {
        ...annotation,
        updatedAt: new Date().toISOString()
      };

      setAnnotations(prev =>
        prev.map(a => a.id === annotation.id ? updatedAnnotation : a)
      );

      onAnnotationUpdate?.(updatedAnnotation);
      setEditingAnnotation(null);
      toast.success('Annotation updated');
    } catch (error) {
      toast.error('Failed to update annotation');
    }
  };

  // Delete annotation
  const deleteAnnotation = async (annotationId: string) => {
    try {
      const success = chartExportService.deleteAnnotation(chartId, annotationId);
      if (success) {
        setAnnotations(prev => prev.filter(a => a.id !== annotationId));
        onAnnotationDelete?.(annotationId);
        setSelectedAnnotation(null);
        toast.success('Annotation deleted');
      } else {
        toast.error('Failed to delete annotation');
      }
    } catch (error) {
      toast.error('Failed to delete annotation');
    }
  };

  // Toggle annotation pin
  const togglePin = (annotation: Annotation) => {
    const updated = { ...annotation, isPinned: !annotation.isPinned };
    updateAnnotation(updated);
  };

  // Toggle annotation resolved
  const toggleResolved = (annotation: Annotation) => {
    const updated = { ...annotation, isResolved: !annotation.isResolved };
    updateAnnotation(updated);
  };

  // Add reply to annotation
  const addReply = (annotation: Annotation) => {
    if (!replyText.trim()) return;

    const reply: AnnotationReply = {
      id: 'reply_' + Date.now(),
      text: replyText,
      author: currentUser.name,
      authorAvatar: currentUser.avatar,
      createdAt: new Date().toISOString()
    };

    const updated = {
      ...annotation,
      replies: [...(annotation.replies || []), reply]
    };

    updateAnnotation(updated);
    setReplyText('');
  };

  // Get annotation icon
  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'highlight':
        return <Lightbulb className="h-3 w-3" />;
      case 'question':
        return <HelpCircle className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  // Get annotation color
  const getAnnotationColor = (type: string, customColor?: string) => {
    if (customColor) return customColor;
    switch (type) {
      case 'highlight':
        return '#f59e0b';
      case 'question':
        return '#8b5cf6';
      default:
        return '#3b82f6';
    }
  };

  return (
    <TooltipProvider>
      <div className={cn('relative', className)}>
        {/* Annotation Controls */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={isAnnotationMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsAnnotationMode(!isAnnotationMode)}
            disabled={readOnly}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isAnnotationMode ? 'Cancel' : 'Add Annotation'}
          </Button>

          <Button
            variant={showAnnotations ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAnnotations(!showAnnotations)}
          >
            {showAnnotations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="ml-2">{showAnnotations ? 'Hide' : 'Show'}</span>
          </Button>

          <Badge variant="secondary" className="text-xs">
            {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Annotation Overlay */}
        {chartElement && (
          <div
            ref={overlayRef}
            className="absolute inset-0 pointer-events-none"
            style={{
              width: chartElement.offsetWidth,
              height: chartElement.offsetHeight
            }}
          >
            {/* Click handler for annotation mode */}
            {isAnnotationMode && (
              <div
                className="absolute inset-0 pointer-events-auto cursor-crosshair"
                onClick={handleChartClick}
              />
            )}

            {/* Annotation Markers */}
            <AnimatePresence>
              {showAnnotations && annotations.map((annotation) => (
                <motion.div
                  key={annotation.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute pointer-events-auto"
                  style={{
                    left: annotation.x - 12,
                    top: annotation.y - 12,
                    zIndex: annotation.isPinned ? 20 : 10
                  }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'h-6 w-6 p-0 rounded-full border-2 shadow-lg',
                          annotation.isResolved && 'opacity-50'
                        )}
                        style={{
                          borderColor: getAnnotationColor(annotation.type, annotation.color),
                          backgroundColor: annotation.isPinned ? getAnnotationColor(annotation.type, annotation.color) : 'white'
                        }}
                        onClick={() => setSelectedAnnotation(annotation)}
                      >
                        <div
                          className={cn(
                            'flex items-center justify-center',
                            annotation.isPinned ? 'text-white' : ''
                          )}
                          style={{
                            color: annotation.isPinned ? 'white' : getAnnotationColor(annotation.type, annotation.color)
                          }}
                        >
                          {getAnnotationIcon(annotation.type)}
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <div className="font-medium">{annotation.author}</div>
                        <div className="text-muted-foreground">
                          {annotation.text.substring(0, 50)}
                          {annotation.text.length > 50 ? '...' : ''}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Create Annotation Dialog */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Annotation</DialogTitle>
              <DialogDescription>
                Add a note, highlight, or question to this chart.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <div className="flex gap-2 mt-1">
                  {[
                    { type: 'note', label: 'Note', icon: MessageSquare },
                    { type: 'highlight', label: 'Highlight', icon: Lightbulb },
                    { type: 'question', label: 'Question', icon: HelpCircle }
                  ].map(({ type, label, icon: Icon }) => (
                    <Button
                      key={type}
                      variant={newAnnotation.type === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewAnnotation(prev => ({ ...prev, type: type as any }))}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="annotation-text">Text</Label>
                <Textarea
                  id="annotation-text"
                  value={newAnnotation.text}
                  onChange={(e) => setNewAnnotation(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Enter your annotation..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-1">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'].map(color => (
                    <Button
                      key={color}
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      style={{ backgroundColor: color }}
                      onClick={() => setNewAnnotation(prev => ({ ...prev, color }))}
                    >
                      {newAnnotation.color === color && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={createAnnotation} disabled={!newAnnotation.text.trim()}>
                Create Annotation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Annotation Details Dialog */}
        <Dialog open={!!selectedAnnotation} onOpenChange={() => setSelectedAnnotation(null)}>
          <DialogContent className="max-w-md">
            {selectedAnnotation && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="flex items-center gap-2">
                      {getAnnotationIcon(selectedAnnotation.type)}
                      Annotation
                    </DialogTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => togglePin(selectedAnnotation)}>
                          {selectedAnnotation.isPinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}
                          {selectedAnnotation.isPinned ? 'Unpin' : 'Pin'}
                        </DropdownMenuItem>
                        {selectedAnnotation.type === 'question' && (
                          <DropdownMenuItem onClick={() => toggleResolved(selectedAnnotation)}>
                            {selectedAnnotation.isResolved ? <AlertTriangle className="h-4 w-4 mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                            {selectedAnnotation.isResolved ? 'Mark Unresolved' : 'Mark Resolved'}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditingAnnotation(selectedAnnotation)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteAnnotation(selectedAnnotation.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Author and timestamp */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedAnnotation.authorAvatar} />
                      <AvatarFallback>
                        {selectedAnnotation.author.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <div className="font-medium">{selectedAnnotation.author}</div>
                      <div className="text-muted-foreground">
                        {new Date(selectedAnnotation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Annotation text */}
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{selectedAnnotation.text}</p>
                  </div>

                  {/* Replies */}
                  {selectedAnnotation.replies && selectedAnnotation.replies.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Replies</Label>
                      {selectedAnnotation.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2 p-2 bg-muted/50 rounded">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={reply.authorAvatar} />
                            <AvatarFallback className="text-xs">
                              {reply.author.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-medium">{reply.author}</span>
                              <span className="text-muted-foreground">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{reply.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add reply */}
                  {!readOnly && (
                    <div className="space-y-2">
                      <Label htmlFor="reply-text" className="text-sm">Add Reply</Label>
                      <div className="flex gap-2">
                        <Input
                          id="reply-text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply..."
                          onKeyPress={(e) => e.key === 'Enter' && addReply(selectedAnnotation)}
                        />
                        <Button
                          size="sm"
                          onClick={() => addReply(selectedAnnotation)}
                          disabled={!replyText.trim()}
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Annotation Dialog */}
        <Dialog open={!!editingAnnotation} onOpenChange={() => setEditingAnnotation(null)}>
          <DialogContent>
            {editingAnnotation && (
              <>
                <DialogHeader>
                  <DialogTitle>Edit Annotation</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-text">Text</Label>
                    <Textarea
                      id="edit-text"
                      value={editingAnnotation.text}
                      onChange={(e) => setEditingAnnotation(prev => prev ? { ...prev, text: e.target.value } : null)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Type</Label>
                    <div className="flex gap-2 mt-1">
                      {[
                        { type: 'note', label: 'Note', icon: MessageSquare },
                        { type: 'highlight', label: 'Highlight', icon: Lightbulb },
                        { type: 'question', label: 'Question', icon: HelpCircle }
                      ].map(({ type, label, icon: Icon }) => (
                        <Button
                          key={type}
                          variant={editingAnnotation.type === type ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEditingAnnotation(prev => prev ? { ...prev, type: type as any } : null)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingAnnotation(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => updateAnnotation(editingAnnotation)}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Annotation List */}
        {annotations.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Annotations ({annotations.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className={cn(
                    'flex items-start gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50',
                    annotation.isResolved && 'opacity-50'
                  )}
                  onClick={() => setSelectedAnnotation(annotation)}
                >
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: getAnnotationColor(annotation.type, annotation.color) }}
                  >
                    {getAnnotationIcon(annotation.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{annotation.author}</span>
                      <span className="text-muted-foreground">
                        {new Date(annotation.createdAt).toLocaleDateString()}
                      </span>
                      {annotation.isPinned && <Pin className="h-3 w-3 text-blue-600" />}
                    </div>
                    <p className="text-sm truncate">{annotation.text}</p>
                    {annotation.replies && annotation.replies.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {annotation.replies.length} repl{annotation.replies.length === 1 ? 'y' : 'ies'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};