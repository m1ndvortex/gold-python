import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useBackupStatus, useManualBackup, useBackupRestore, useBackupDelete } from '../../hooks/useSystemAdmin';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Database,
  Download,
  Upload,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  HardDrive,
  Calendar,
  FileArchive,
  Shield
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ManualBackupRequest, RestoreRequest, BackupFile } from '../../types/systemAdmin';
import { toast } from 'sonner';

export const BackupManagement: React.FC = () => {
  const { data: backups, isLoading, error } = useBackupStatus();
  const manualBackup = useManualBackup();
  const backupRestore = useBackupRestore();
  const backupDelete = useBackupDelete();
  const { t } = useLanguage();

  const [createBackupOpen, setCreateBackupOpen] = useState(false);
  const [restoreBackupOpen, setRestoreBackupOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);

  const [backupRequest, setBackupRequest] = useState<ManualBackupRequest>({
    type: 'full',
    includeImages: true,
    includeConfigs: true,
    description: ''
  });

  const [restoreRequest, setRestoreRequest] = useState<RestoreRequest>({
    backupFile: '',
    restoreType: 'full',
    selectedTables: [],
    confirmDataLoss: false
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleCreateBackup = async () => {
    try {
      await manualBackup.mutateAsync(backupRequest);
      setCreateBackupOpen(false);
      setBackupRequest({
        type: 'full',
        includeImages: true,
        includeConfigs: true,
        description: ''
      });
    } catch (error) {
      // Error handled by the hook
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreRequest.confirmDataLoss) {
      toast.error(t('backup.restore.confirmRequired'));
      return;
    }

    try {
      await backupRestore.mutateAsync(restoreRequest);
      setRestoreBackupOpen(false);
      setRestoreRequest({
        backupFile: '',
        restoreType: 'full',
        selectedTables: [],
        confirmDataLoss: false
      });
    } catch (error) {
      // Error handled by the hook
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (window.confirm(t('backup.delete.confirm'))) {
      try {
        await backupDelete.mutateAsync(filename);
      } catch (error) {
        // Error handled by the hook
      }
    }
  };

  const handleDownloadBackup = (filename: string) => {
    // This would trigger the download
    window.open(`/api/admin/backups/${filename}/download`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !backups) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <span>{t('backup.error')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestBackup = backups[0];

  return (
    <div className="space-y-6">
      {/* Backup Status Overview */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span>{t('backup.status.title')}</span>
            </div>
            <div className="flex space-x-2">
              <Dialog open={createBackupOpen} onOpenChange={setCreateBackupOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('backup.create.title')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('backup.create.title')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('backup.create.type')}</Label>
                      <Select
                        value={backupRequest.type}
                        onValueChange={(value: 'full' | 'incremental') => 
                          setBackupRequest(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">{t('backup.type.full')}</SelectItem>
                          <SelectItem value="incremental">{t('backup.type.incremental')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeImages"
                          checked={backupRequest.includeImages}
                          onCheckedChange={(checked) =>
                            setBackupRequest(prev => ({ ...prev, includeImages: !!checked }))
                          }
                        />
                        <Label htmlFor="includeImages">{t('backup.create.includeImages')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeConfigs"
                          checked={backupRequest.includeConfigs}
                          onCheckedChange={(checked) =>
                            setBackupRequest(prev => ({ ...prev, includeConfigs: !!checked }))
                          }
                        />
                        <Label htmlFor="includeConfigs">{t('backup.create.includeConfigs')}</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('backup.create.description')}</Label>
                      <Textarea
                        value={backupRequest.description}
                        onChange={(e) =>
                          setBackupRequest(prev => ({ ...prev, description: e.target.value }))
                        }
                        placeholder={t('backup.create.descriptionPlaceholder')}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setCreateBackupOpen(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button onClick={handleCreateBackup} disabled={manualBackup.isPending}>
                        {manualBackup.isPending ? (
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Database className="h-4 w-4 mr-2" />
                        )}
                        {t('backup.create.confirm')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latestBackup ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('backup.status.lastBackup')}</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(latestBackup.verified ? 'success' : 'failed')}
                  <span className="font-medium">
                    {new Date(latestBackup.date).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('backup.status.size')}</span>
                <span className="font-medium">{formatFileSize(latestBackup.size)}</span>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('backup.status.type')}</span>
                <Badge variant="outline">
                  {t(`backup.type.${latestBackup.type}`)}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {t('backup.status.noBackups')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Files List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileArchive className="h-5 w-5" />
            <span>{t('backup.files.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length > 0 ? (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div key={backup.filename} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(backup.verified ? 'success' : 'failed')}
                      <div>
                        <div className="font-medium">{backup.filename}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(backup.date).toLocaleString()} • {formatFileSize(backup.size)}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {t(`backup.type.${backup.type}`)}
                      </Badge>
                      {backup.verified && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          <Shield className="h-3 w-3 mr-1" />
                          {t('backup.verified')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadBackup(backup.filename)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setRestoreRequest(prev => ({ ...prev, backupFile: backup.filename }));
                          }}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('backup.restore.title')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center space-x-2 text-yellow-700">
                              <AlertTriangle className="h-5 w-5" />
                              <span className="font-medium">{t('backup.restore.warning')}</span>
                            </div>
                            <p className="text-sm text-yellow-600 mt-1">
                              {t('backup.restore.warningText')}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>{t('backup.restore.type')}</Label>
                            <Select
                              value={restoreRequest.restoreType}
                              onValueChange={(value: 'full' | 'selective') =>
                                setRestoreRequest(prev => ({ ...prev, restoreType: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full">{t('backup.restore.full')}</SelectItem>
                                <SelectItem value="selective">{t('backup.restore.selective')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="confirmDataLoss"
                              checked={restoreRequest.confirmDataLoss}
                              onCheckedChange={(checked) =>
                                setRestoreRequest(prev => ({ ...prev, confirmDataLoss: !!checked }))
                              }
                            />
                            <Label htmlFor="confirmDataLoss" className="text-sm">
                              {t('backup.restore.confirmDataLoss')}
                            </Label>
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setRestoreBackupOpen(false)}>
                              {t('common.cancel')}
                            </Button>
                            <Button
                              onClick={handleRestoreBackup}
                              disabled={backupRestore.isPending || !restoreRequest.confirmDataLoss}
                              variant="destructive"
                            >
                              {backupRestore.isPending ? (
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              {t('backup.restore.confirm')}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBackup(backup.filename)}
                      disabled={backupDelete.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <span>{t('backup.files.empty')}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};