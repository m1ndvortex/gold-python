import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  BarChart3, 
  Eye, 
  Users, 
  TrendingUp, 
  Calendar,
  Monitor,
  Smartphone,
  Tablet,
  Chrome,

  Globe,
  Clock,
  Activity
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useQRCardAnalytics } from '../../hooks/useQRCards';
import type { QRInvoiceCard } from '../../services/qrCardApi';

interface QRCardAnalyticsProps {
  card: QRInvoiceCard;
  className?: string;
}

export const QRCardAnalytics: React.FC<QRCardAnalyticsProps> = ({
  card,
  className = ""
}) => {
  const { data: analytics, isLoading, error } = useQRCardAnalytics(card.id);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getBrowserIcon = (browser: string) => {
    switch (browser.toLowerCase()) {
      case 'chrome':
        return <Chrome className="h-4 w-4" />;
      case 'firefox':
        return <Globe className="h-4 w-4" />;
      case 'safari':
        return <Globe className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  if (isLoading) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="text-green-800">Card Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analytics) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="text-red-800">Analytics Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Failed to load analytics data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="text-green-800">Card Analytics</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Total Views</span>
            </div>
            <div className="text-2xl font-bold text-blue-800">{analytics.total_views}</div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Unique Visitors</span>
            </div>
            <div className="text-2xl font-bold text-green-800">{analytics.unique_visitors}</div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Recent Views</span>
            </div>
            <div className="text-2xl font-bold text-purple-800">{analytics.recent_views_7d}</div>
            <div className="text-xs text-purple-600">Last 7 days</div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Status</span>
            </div>
            <Badge 
              variant="outline" 
              className={analytics.is_active 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-red-100 text-red-800 border-red-200"
              }
            >
              {analytics.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Viewing History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Viewing History</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">First Viewed</span>
              </div>
              <div className="text-sm text-gray-600">
                {analytics.first_viewed 
                  ? format(new Date(analytics.first_viewed), 'MMM dd, yyyy HH:mm')
                  : 'Never viewed'
                }
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Last Viewed</span>
              </div>
              <div className="text-sm text-gray-600">
                {analytics.last_viewed 
                  ? formatDistanceToNow(new Date(analytics.last_viewed), { addSuffix: true })
                  : 'Never viewed'
                }
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Device Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Device Breakdown</h3>
          
          <div className="space-y-3">
            {Object.entries(analytics.device_breakdown).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getDeviceIcon(device)}
                  <span className="text-sm font-medium capitalize">{device}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{count}</span>
                  <Badge variant="outline" className="text-xs">
                    {getPercentage(count, analytics.total_views)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Browser Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Browser Breakdown</h3>
          
          <div className="space-y-3">
            {Object.entries(analytics.browser_breakdown).map(([browser, count]) => (
              <div key={browser} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getBrowserIcon(browser)}
                  <span className="text-sm font-medium">{browser}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{count}</span>
                  <Badge variant="outline" className="text-xs">
                    {getPercentage(count, analytics.total_views)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Operating System Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Operating System</h3>
          
          <div className="space-y-3">
            {Object.entries(analytics.os_breakdown).map(([os, count]) => (
              <div key={os} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{os}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{count}</span>
                  <Badge variant="outline" className="text-xs">
                    {getPercentage(count, analytics.total_views)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card Configuration */}
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Card Configuration</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">Theme</div>
              <div className="capitalize">{analytics.theme}</div>
            </div>
            
            <div>
              <div className="font-medium text-gray-700">Expiration</div>
              <div>
                {analytics.expires_at 
                  ? format(new Date(analytics.expires_at), 'MMM dd, yyyy')
                  : 'No expiration'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Insights */}
        {analytics.total_views > 0 && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Engagement Insights</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="text-sm font-medium text-indigo-700 mb-1">Return Rate</div>
                  <div className="text-lg font-bold text-indigo-800">
                    {analytics.unique_visitors > 0 
                      ? ((analytics.total_views / analytics.unique_visitors).toFixed(1))
                      : '0.0'
                    }x
                  </div>
                  <div className="text-xs text-indigo-600">Average views per visitor</div>
                </div>

                <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <div className="text-sm font-medium text-teal-700 mb-1">Recent Activity</div>
                  <div className="text-lg font-bold text-teal-800">
                    {analytics.recent_views_7d > 0 ? 'High' : 'Low'}
                  </div>
                  <div className="text-xs text-teal-600">
                    {analytics.recent_views_7d} views in last 7 days
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};