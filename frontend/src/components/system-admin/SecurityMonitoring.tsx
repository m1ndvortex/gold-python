import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useSSLCertificateStatus, useSecurityStatus, useSSLCertificateRenewal, useSecurityScan } from '../../hooks/useSystemAdmin';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Scan,
  Globe,
  Eye,
  Ban,
  Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const SecurityMonitoring: React.FC = () => {
  const { data: sslStatus, isLoading: sslLoading } = useSSLCertificateStatus();
  const { data: securityStatus, isLoading: securityLoading } = useSecurityStatus();
  const sslRenewal = useSSLCertificateRenewal();
  const securityScan = useSecurityScan();
  const { t } = useLanguage();

  const getDaysUntilExpiry = (validTo: string) => {
    const expiryDate = new Date(validTo);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (days: number) => {
    if (days < 0) return 'expired';
    if (days <= 7) return 'critical';
    if (days <= 30) return 'warning';
    return 'healthy';
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* SSL Certificate Status */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <span>{t('security.ssl.title')}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sslRenewal.mutate()}
              disabled={sslRenewal.isPending}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', sslRenewal.isPending && 'animate-spin')} />
              {t('security.ssl.renew')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sslLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
            </div>
          ) : sslStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('security.ssl.domain')}</span>
                    <span className="font-medium">{sslStatus.domain}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('security.ssl.issuer')}</span>
                    <span className="font-medium">{sslStatus.issuer}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('security.ssl.validFrom')}</span>
                    <span className="font-medium">
                      {new Date(sslStatus.validFrom).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('security.ssl.validTo')}</span>
                    <span className="font-medium">
                      {new Date(sslStatus.validTo).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('security.ssl.daysLeft')}</span>
                    <Badge className={cn(
                      'px-2 py-1',
                      getExpiryStatus(sslStatus.daysUntilExpiry) === 'healthy' && 'bg-green-100 text-green-700',
                      getExpiryStatus(sslStatus.daysUntilExpiry) === 'warning' && 'bg-yellow-100 text-yellow-700',
                      getExpiryStatus(sslStatus.daysUntilExpiry) === 'critical' && 'bg-red-100 text-red-700',
                      getExpiryStatus(sslStatus.daysUntilExpiry) === 'expired' && 'bg-red-100 text-red-700'
                    )}>
                      {sslStatus.daysUntilExpiry} {t('common.days')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('security.ssl.autoRenewal')}</span>
                    <Badge variant={sslStatus.autoRenewal ? 'default' : 'secondary'}>
                      {sslStatus.autoRenewal ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {sslStatus.autoRenewal ? t('common.enabled') : t('common.disabled')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {t('security.ssl.notAvailable')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Headers & Overall Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Headers */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span>{t('security.headers.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {securityLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                    <div className="h-6 bg-muted rounded w-1/4 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : securityStatus?.securityHeaders ? (
              <div className="space-y-3">
                {Object.entries(securityStatus.securityHeaders).map(([header, enabled]) => {
                  if (header === 'score') return null;
                  return (
                    <div key={header} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {header.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant={enabled ? 'default' : 'destructive'} className="text-xs">
                        {enabled ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {enabled ? t('common.enabled') : t('common.disabled')}
                      </Badge>
                    </div>
                  );
                })}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('security.headers.score')}</span>
                    <span className={cn('text-lg font-bold', getSecurityScoreColor(securityStatus.securityHeaders.score))}>
                      {securityStatus.securityHeaders.score}/100
                    </span>
                  </div>
                  <Progress 
                    value={securityStatus.securityHeaders.score} 
                    className="h-2 mt-2"
                    indicatorClassName={cn(
                      securityStatus.securityHeaders.score >= 90 && 'bg-green-500',
                      securityStatus.securityHeaders.score >= 70 && securityStatus.securityHeaders.score < 90 && 'bg-yellow-500',
                      securityStatus.securityHeaders.score < 70 && 'bg-red-500'
                    )}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {t('security.headers.notAvailable')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                <Ban className="h-4 w-4 text-white" />
              </div>
              <span>{t('security.rateLimit.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {securityLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : securityStatus?.rateLimiting ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('security.rateLimit.status')}</span>
                  <Badge variant={securityStatus.rateLimiting.enabled ? 'default' : 'destructive'}>
                    {securityStatus.rateLimiting.enabled ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {securityStatus.rateLimiting.enabled ? t('common.enabled') : t('common.disabled')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('security.rateLimit.requestsPerMinute')}</span>
                  <span className="font-medium">{securityStatus.rateLimiting.requestsPerMinute}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('security.rateLimit.blockedRequests')}</span>
                  <Badge variant="outline" className="text-red-600">
                    {securityStatus.rateLimiting.blockedRequests}
                  </Badge>
                </div>
                {securityStatus.rateLimiting.topBlockedIPs.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-sm font-medium">{t('security.rateLimit.topBlockedIPs')}</span>
                    <div className="mt-2 space-y-1">
                      {securityStatus.rateLimiting.topBlockedIPs.slice(0, 3).map((ip, index) => (
                        <div key={index} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {ip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {t('security.rateLimit.notAvailable')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Scan */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <Scan className="h-5 w-5 text-white" />
              </div>
              <span>{t('security.scan.title')}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => securityScan.mutate()}
              disabled={securityScan.isPending}
            >
              <Activity className={cn('h-4 w-4 mr-2', securityScan.isPending && 'animate-pulse')} />
              {t('security.scan.run')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {securityLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
            </div>
          ) : securityStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('security.scan.lastScan')}</span>
                <span className="font-medium">
                  {new Date(securityStatus.lastSecurityScan).toLocaleString()}
                </span>
              </div>
              
              {securityStatus.vulnerabilities && securityStatus.vulnerabilities.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t('security.scan.vulnerabilities')}</span>
                    <Badge variant="destructive">
                      {securityStatus.vulnerabilities.length} {t('security.scan.found')}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {securityStatus.vulnerabilities.slice(0, 3).map((vuln, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-red-50/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{vuln.title}</span>
                          <Badge variant={
                            vuln.severity === 'critical' ? 'destructive' :
                            vuln.severity === 'high' ? 'destructive' :
                            vuln.severity === 'medium' ? 'secondary' : 'outline'
                          }>
                            {vuln.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{vuln.description}</p>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className="text-muted-foreground">{vuln.affectedService}</span>
                          <span className="text-muted-foreground">
                            {new Date(vuln.discoveredAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {securityStatus.vulnerabilities.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        {t('security.scan.moreVulnerabilities', { 
                          count: securityStatus.vulnerabilities.length - 3 
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-green-600">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <span className="font-medium">{t('security.scan.noVulnerabilities')}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {t('security.scan.notAvailable')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};