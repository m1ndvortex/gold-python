/**
 * Tag Filter Component
 * Tag-based search and filtering with auto-complete
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Tag, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { useLanguage } from '../../hooks/useLanguage';
import { TagFilterProps } from '../../types/search';

export const TagFilter: React.FC<TagFilterProps> = ({
  availableTags,
  selectedTags,
  onTagsChange,
  showSuggestions = true,
  allowCustomTags = true,
  maxTags = 20
}) => {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (!inputValue || !showSuggestions) {
      setFilteredSuggestions([]);
      return;
    }

    const filtered = availableTags
      .filter(tag => 
        tag.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedTags.includes(tag)
      )
      .slice(0, 10);

    setFilteredSuggestions(filtered);
  }, [inputValue, availableTags, selectedTags, showSuggestions]);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    setShowSuggestionsList(value.length > 0 && showSuggestions);
  }, [showSuggestions]);

  // Handle input key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === 'Escape') {
      setShowSuggestionsList(false);
      inputRef.current?.blur();
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  }, [inputValue, selectedTags]);

  // Add tag
  const addTag = useCallback((tag: string) => {
    if (!tag || selectedTags.includes(tag) || selectedTags.length >= maxTags) {
      return;
    }

    // Validate tag if custom tags are not allowed
    if (!allowCustomTags && !availableTags.includes(tag)) {
      return;
    }

    onTagsChange([...selectedTags, tag]);
    setInputValue('');
    setShowSuggestionsList(false);
    inputRef.current?.focus();
  }, [selectedTags, onTagsChange, maxTags, allowCustomTags, availableTags]);

  // Remove tag
  const removeTag = useCallback((tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  }, [selectedTags, onTagsChange]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((tag: string) => {
    addTag(tag);
  }, [addTag]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get popular tags (most used)
  const getPopularTags = useCallback(() => {
    return availableTags
      .filter(tag => !selectedTags.includes(tag))
      .slice(0, 10);
  }, [availableTags, selectedTags]);

  return (
    <div className="space-y-3">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              <Tag className="h-3 w-3" />
              {tag}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Input */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder={
                selectedTags.length >= maxTags
                  ? t('search.filters.maxTagsReached', { max: maxTags })
                  : t('search.filters.addTag')
              }
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={() => setShowSuggestionsList(inputValue.length > 0 && showSuggestions)}
              disabled={selectedTags.length >= maxTags}
              className="text-sm"
            />
            
            {/* Add Button */}
            {inputValue.trim() && (allowCustomTags || availableTags.includes(inputValue.trim())) && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => addTag(inputValue.trim())}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestionsList && (filteredSuggestions.length > 0 || allowCustomTags) && (
          <Card 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto shadow-lg"
          >
            <CardContent className="p-2">
              {/* Filtered Suggestions */}
              {filteredSuggestions.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('search.filters.suggestions')}
                  </div>
                  {filteredSuggestions.map((tag) => (
                    <Button
                      key={tag}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2 text-left"
                      onClick={() => handleSuggestionClick(tag)}
                    >
                      <Tag className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{tag}</span>
                    </Button>
                  ))}
                </div>
              )}

              {/* Add Custom Tag */}
              {allowCustomTags && inputValue.trim() && !availableTags.includes(inputValue.trim()) && (
                <div className="space-y-1">
                  {filteredSuggestions.length > 0 && <div className="border-t my-2" />}
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('search.filters.createTag')}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-2 text-left"
                    onClick={() => addTag(inputValue.trim())}
                  >
                    <Plus className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm">
                      {t('search.filters.addCustomTag', { tag: inputValue.trim() })}
                    </span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Popular Tags */}
      {showSuggestions && selectedTags.length === 0 && !inputValue && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {t('search.filters.popularTags')}
          </div>
          <div className="flex flex-wrap gap-2">
            {getPopularTags().map((tag) => (
              <Button
                key={tag}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => addTag(tag)}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Tag Count Info */}
      <div className="text-xs text-gray-500">
        {t('search.filters.tagCount', { 
          current: selectedTags.length, 
          max: maxTags 
        })}
        {!allowCustomTags && (
          <span className="ml-2">
            {t('search.filters.predefinedTagsOnly')}
          </span>
        )}
      </div>

      {/* Quick Actions */}
      {selectedTags.length > 0 && (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onTagsChange([])}
          >
            {t('search.filters.clearAllTags')}
          </Button>
        </div>
      )}
    </div>
  );
};