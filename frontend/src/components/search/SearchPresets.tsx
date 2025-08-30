/**
 * Search Presets Component
 * Manage saved search filter presets
 */

import React, { useState } from 'react';
import { Save, Trash2, Edit, Star, Users, Lock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useLanguage } from '../../hooks/useLanguage';
import {
  SearchFilterPreset,
  SearchFilterPresetUpdate,
  UniversalSearchFilters,
  SearchPresetsProps
} from '../../types/search';

export const SearchPresets: React.FC<SearchPresetsProps> = ({
  presets,
  currentFilters,
  onPresetSelect,
  onPresetSave,
  onPresetDelete,
  onPresetUpdate
}) => {
  const { t, formatDate } = useLanguage();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPreset, setEditingPreset] = useState<SearchFilterPreset | null>(null);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  // Handle create preset
  const handleCreatePreset = async () => {
    if (!presetName.trim()) return;

    try {
      await onPresetSave(presetName, presetDescription || undefined);
      setPresetName('');
      setPresetDescription('');
      setIsPublic(false);
      setIsDefault(false);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create preset:', error);
    }
  };

  // Handle update preset
  const handleUpdatePreset = async () => {
    if (!editingPreset || !presetName.trim()) return;

    try {
      const updates: SearchFilterPresetUpdate = {
        name: presetName,
        description: presetDescription || undefined,
        is_public: isPublic,
        is_default: isDefault
      };

      await onPresetUpdate(editingPreset.id, updates);
      setEditingPreset(null);
      setPresetName('');
      setPresetDescription('');
      setIsPublic(false);
      setIsDefault(false);
    } catch (error) {
      console.error('Failed to update preset:', error);
    }
  };

  // Start editing preset
  const startEditingPreset = (preset: SearchFilterPreset) => {
    setEditingPreset(preset);
    setPresetName(preset.name);
    setPresetDescription(preset.description || '');
    setIsPublic(preset.is_public || false);
    setIsDefault(preset.is_default || false);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingPreset(null);
    setPresetName('');
    setPresetDescription('');
    setIsPublic(false);
    setIsDefault(false);
  };

  // Get filter summary
  const getFilterSummary = (filters: UniversalSearchFilters) => {
    const summary: string[] = [];

    if (filters.search) {
      summary.push(`"${filters.search}"`);
    }

    if (filters.entity_types && filters.entity_types.length > 0) {
      summary.push(`${filters.entity_types.length} ${t('search.presets.entityTypes')}`);
    }

    if (filters.inventory) {
      const inv = filters.inventory;
      if (inv.category_ids && inv.category_ids.length > 0) {
        summary.push(`${inv.category_ids.length} ${t('search.presets.categories')}`);
      }
      if (inv.tags && inv.tags.length > 0) {
        summary.push(`${inv.tags.length} ${t('search.presets.tags')}`);
      }
      if (inv.price_range && (inv.price_range.min || inv.price_range.max)) {
        summary.push(t('search.presets.priceRange'));
      }
    }

    if (filters.date_range && (filters.date_range.from || filters.date_range.to)) {
      summary.push(t('search.presets.dateRange'));
    }

    return summary.length > 0 ? summary.join(', ') : t('search.presets.noFilters');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('search.presets.title')}</h3>
          <p className="text-sm text-gray-600">
            {t('search.presets.description')}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('search.presets.create')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('search.presets.createTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="preset-name">{t('search.presets.name')}</Label>
                <Input
                  id="preset-name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder={t('search.presets.namePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="preset-description">{t('search.presets.description')}</Label>
                <Textarea
                  id="preset-description"
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                  placeholder={t('search.presets.descriptionPlaceholder')}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preset-public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                  <Label htmlFor="preset-public" className="text-sm">
                    {t('search.presets.makePublic')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preset-default"
                    checked={isDefault}
                    onCheckedChange={setIsDefault}
                  />
                  <Label htmlFor="preset-default" className="text-sm">
                    {t('search.presets.makeDefault')}
                  </Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreatePreset} disabled={!presetName.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Filters Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('search.presets.currentFilters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            {getFilterSummary(currentFilters)}
          </p>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            disabled={Object.keys(currentFilters).length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {t('search.presets.saveCurrentFilters')}
          </Button>
        </CardContent>
      </Card>

      {/* Presets List */}
      <div className="space-y-3">
        {presets.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-gray-500">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('search.presets.noPresets')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          presets.map((preset) => (
            <Card key={preset.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900 truncate">
                        {preset.name}
                      </h4>
                      <div className="flex space-x-1">
                        {preset.is_default && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            {t('search.presets.default')}
                          </Badge>
                        )}
                        {preset.is_public ? (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {t('search.presets.public')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            {t('search.presets.private')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {preset.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {preset.description}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-500 mb-2">
                      {getFilterSummary(preset.filters)}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        {t('search.presets.created')}: {formatDate(new Date(preset.created_at))}
                      </span>
                      <span>
                        {t('search.presets.used')}: {preset.usage_count} {t('search.presets.times')}
                      </span>
                      {preset.last_used_at && (
                        <span>
                          {t('search.presets.lastUsed')}: {formatDate(new Date(preset.last_used_at))}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => onPresetSelect(preset)}
                    >
                      {t('search.presets.apply')}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditingPreset(preset)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t('search.presets.deleteTitle')}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('search.presets.deleteDescription', { name: preset.name })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onPresetDelete(preset.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Preset Dialog */}
      <Dialog open={!!editingPreset} onOpenChange={(open) => !open && cancelEditing()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('search.presets.editTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-preset-name">{t('search.presets.name')}</Label>
              <Input
                id="edit-preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder={t('search.presets.namePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="edit-preset-description">{t('search.presets.description')}</Label>
              <Textarea
                id="edit-preset-description"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder={t('search.presets.descriptionPlaceholder')}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-preset-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="edit-preset-public" className="text-sm">
                  {t('search.presets.makePublic')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-preset-default"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
                <Label htmlFor="edit-preset-default" className="text-sm">
                  {t('search.presets.makeDefault')}
                </Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={cancelEditing}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleUpdatePreset} disabled={!presetName.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};