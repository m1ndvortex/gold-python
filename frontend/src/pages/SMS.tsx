import React, { useState } from 'react';
import { MessageSquare, BookTemplate, Send, History, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { SMSTemplateManager } from '../components/sms/SMSTemplateManager';
import { SMSCampaignManager } from '../components/sms/SMSCampaignManager';
import { SMSHistoryTracker } from '../components/sms/SMSHistoryTracker';
import { useSMSDashboardData } from '../hooks/useSMS';

const SMSOverview: React.FC = () => {
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
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.total_campaigns || 0}</div>
            <p className="text-xs text-muted-foreground">
              {recentCampaigns.filter(c => c.status === 'pending').length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.total_messages_sent || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats?.total_messages_delivered || 0} delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
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
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
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
              <span>Recent Campaigns</span>
            </CardTitle>
            <CardDescription>Latest SMS campaigns and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length > 0 ? (
              <div className="space-y-3">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {campaign.total_recipients} recipients • {new Date(campaign.created_at).toLocaleDateString()}
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
                        {campaign.status}
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
                <p>No recent campaigns</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Recent Messages</span>
            </CardTitle>
            <CardDescription>Latest SMS message activity</CardDescription>
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
                        {message.status}
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
                <p>No recent messages</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const SMS: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Management</h1>
          <p className="text-muted-foreground">
            Send promotional messages and debt reminders to customers
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <BookTemplate className="h-4 w-4" />
            <span>Templates</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center space-x-2">
            <Send className="h-4 w-4" />
            <span>Campaigns</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SMSOverview />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <SMSTemplateManager />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <SMSCampaignManager />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <SMSHistoryTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
};