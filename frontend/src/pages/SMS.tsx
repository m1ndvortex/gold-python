import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { 
  MessageSquare, 
  BookTemplate, 
  Send, 
  History, 
  BarChart3,
  Smartphone,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Bell,
  Target,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { SMSTemplateManager } from '../components/sms/SMSTemplateManager';
import { SMSCampaignManager } from '../components/sms/SMSCampaignManager';
import { SMSHistoryTracker } from '../components/sms/SMSHistoryTracker';
import { useSMSDashboardData } from '../hooks/useSMS';
import { cn } from '../lib/utils';

const SMSOverview: React.FC = () => {
  const { t } = useLanguage();
  const { overallStats, recentCampaigns, recentHistory, isLoading } = useSMSDashboardData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('sms.total_campaigns')}</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.total_campaigns || 0}</div>
            <p className="text-xs text-muted-foreground">
              {recentCampaigns.filter(c => c.status === 'pending').length} {t('sms.pending')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('sms.messages_sent')}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.total_messages_sent || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats?.total_messages_delivered || 0} {t('sms.delivered')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('sms.success_rate')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.overall_success_rate?.toFixed(1) || 0}%
            </div>
            <Progress 
              value={overallStats?.overall_success_rate || 0} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('sms.delivery_rate')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.overall_delivery_rate?.toFixed(1) || 0}%
            </div>
            <Progress 
              value={overallStats?.overall_delivery_rate || 0} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>{t('sms.recent_campaigns')}</span>
            </CardTitle>
            <CardDescription>{t('sms.recent_campaigns_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length > 0 ? (
              <div className="space-y-3">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {campaign.total_recipients} {t('sms.recipients')} • {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={
                          campaign.status === 'completed' ? 'default' :
                          campaign.status === 'failed' ? 'destructive' :
                          campaign.status === 'sending' ? 'secondary' : 'outline'
                        }
                      >
                        {t(`sms.${campaign.status}`)}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {campaign.sent_count}/{campaign.total_recipients}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('sms.no_recent_campaigns')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>{t('sms.recent_messages')}</span>
            </CardTitle>
            <CardDescription>{t('sms.message_history_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentHistory.length > 0 ? (
              <div className="space-y-3">
                {recentHistory.map((message) => (
                  <div key={message.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-mono text-sm">{message.phone_number}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {message.message_content}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={
                          message.status === 'sent' ? 'default' :
                          message.status === 'failed' ? 'destructive' : 'secondary'
                        }
                      >
                        {t(`sms.${message.status}`)}
                      </Badge>
                      {message.delivery_status && (
                        <Badge variant="outline">
                          {message.delivery_status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('sms.no_recent_messages')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const SMS: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">{t('sms.title')}</h1>
              <p className="text-muted-foreground text-lg">
                {t('sms.description')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
            <Bell className="h-3 w-3" />
            {t('sms.status_ready')}
          </Badge>
          <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
            <Send className="h-4 w-4" />
            {t('sms.quick_send')}
          </Button>
        </div>
      </div>

      {/* Enhanced SMS Tabs */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Modern Tab Navigation */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b-2 border-emerald-200">
              <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-1 gap-1">
                <TabsTrigger 
                  value="overview" 
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg transition-all duration-300",
                    "hover:bg-white hover:shadow-sm",
                    "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-emerald-300"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{t('sms.tab_overview')}</div>
                    <div className="text-xs text-muted-foreground">{t('sms.tab_overview_desc')}</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="templates" 
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg transition-all duration-300",
                    "hover:bg-white hover:shadow-sm",
                    "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-teal-300"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <BookTemplate className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{t('sms.tab_templates')}</div>
                    <div className="text-xs text-muted-foreground">{t('sms.tab_templates_desc')}</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="campaigns" 
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg transition-all duration-300",
                    "hover:bg-white hover:shadow-sm",
                    "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-cyan-300"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center">
                    <Send className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{t('sms.tab_campaigns')}</div>
                    <div className="text-xs text-muted-foreground">{t('sms.tab_campaigns_desc')}</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="history" 
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg transition-all duration-300",
                    "hover:bg-white hover:shadow-sm",
                    "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-indigo-300"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <History className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{t('sms.tab_history')}</div>
                    <div className="text-xs text-muted-foreground">{t('sms.tab_history_desc')}</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Enhanced Tab Content */}
            <TabsContent value="overview" className="p-0">
              <div className="p-6 space-y-6 bg-gradient-to-br from-emerald-50/30 to-white">
                <div className="flex items-center justify-between pb-4 border-b border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{t('sms.analytics_title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('sms.analytics_description')}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <Activity className="h-3 w-3 mr-1" />
                    {t('common.real_time')}
                  </Badge>
                </div>
                <SMSOverview />
              </div>
            </TabsContent>

            <TabsContent value="templates" className="p-0">
              <div className="p-6 space-y-6 bg-gradient-to-br from-teal-50/30 to-white">
                <div className="flex items-center justify-between pb-4 border-b border-teal-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                      <BookTemplate className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{t('sms.templates_title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('sms.templates_description')}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                    <Target className="h-3 w-3 mr-1" />
                    {t('common.optimized')}
                  </Badge>
                </div>
                <SMSTemplateManager />
              </div>
            </TabsContent>

            <TabsContent value="campaigns" className="p-0">
              <div className="p-6 space-y-6 bg-gradient-to-br from-cyan-50/30 to-white">
                <div className="flex items-center justify-between pb-4 border-b border-cyan-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                      <Send className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{t('sms.campaigns_title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('sms.campaigns_description')}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                    <Zap className="h-3 w-3 mr-1" />
                    {t('common.automated')}
                  </Badge>
                </div>
                <SMSCampaignManager />
              </div>
            </TabsContent>

            <TabsContent value="history" className="p-0">
              <div className="p-6 space-y-6 bg-gradient-to-br from-indigo-50/30 to-white">
                <div className="flex items-center justify-between pb-4 border-b border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                      <History className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{t('sms.message_history')}</h3>
                      <p className="text-sm text-muted-foreground">{t('sms.message_history_desc')}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t('common.tracked')}
                  </Badge>
                </div>
                <SMSHistoryTracker />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Individual route components
const SMSTemplatesRoute: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BookTemplate className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">{t('sms.templates')}</h1>
          <p className="text-muted-foreground">{t('sms.templates_description')}</p>
        </div>
      </div>
      <SMSTemplateManager />
    </div>
  );
};

const SMSCampaignsRoute: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Send className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold">{t('sms.campaigns')}</h1>
          <p className="text-muted-foreground">{t('sms.campaigns_description')}</p>
        </div>
      </div>
      <SMSCampaignManager />
    </div>
  );
};

const SMSHistoryRoute: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <History className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">{t('sms.history')}</h1>
          <p className="text-muted-foreground">{t('sms.message_history_desc')}</p>
        </div>
      </div>
      <SMSHistoryTracker />
    </div>
  );
};

// Wrapper component to handle sub-routes
export const SMSWithRouting: React.FC = () => {
  return (
    <Routes>
      <Route path="/templates" element={<SMSTemplatesRoute />} />
      <Route path="/campaigns" element={<SMSCampaignsRoute />} />
      <Route path="/history" element={<SMSHistoryRoute />} />
      <Route path="/*" element={<SMS />} />
    </Routes>
  );
};