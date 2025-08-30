import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  BarChart3, 
  Eye, 
  Users, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Clock,
  MapPin,
  RefreshCw,
  Download,
  Share2,
  Activity
} from 'lucide-react';
import { useToast } from '../ui/use-toast';

interface QRCardAnalyticsProps {
  qrCard: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

interface AnalyticsData {
  total_views: number;
  unique_visitors: number;
  recent_views_7d: number;
  first_viewed?: string;
  last_viewed?: string;
  device_breakdown: Record<string, number>;
  browser_breakdown: Record<string, number>;
  os_breakdown: Record<string, number>;
  hourly_views?: Record<string,