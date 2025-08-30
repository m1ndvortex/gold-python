/**
 * Search Suggestions Component
 * Auto-complete and search suggestions display
 */

import React from 'react';
import { Search, Clock, Tag, Hash } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useLanguage } from '../../hooks/useLanguage';
import { SearchSuggestionsResponse, SearchSuggestion } from '../../types/search';

interface SearchSuggestionsProps {
  suggestions: SearchSuggestionsResponse;
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
  isLoading?: boolean;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  onSuggestionClick,
  isLoading = false
}) => {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto">
        <CardContent className="p-2">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-3 p-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || (
    suggestions.suggestions.length === 0 && 
    suggestions.categories.length === 0 && 
    suggestions.tags.length === 0 && 
    suggestions.recent_searches.length === 0
  )) {
    return null;
  }

  return (
    <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto shadow-lg">
      <CardContent className="p-2">
        <div className="space-y-1">
          {/* Query Suggestions */}
          {suggestions.suggestions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('search.suggestions.queries')}
              </div>
              {suggestions.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-2 text-left"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.text}
                      </div>
                      {suggestion.entity_type && (
                        <div className="text-xs text-gray-500">
                          {t(`search.entityTypes.${suggestion.entity_type}`)}
                        </div>
                      )}
                    </div>
                    {suggestion.count && (
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.count}
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}

          {/* Categories */}
          {suggestions.categories.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('search.suggestions.categories')}
              </div>
              {suggestions.categories.slice(0, 5).map((category, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-2 text-left"
                  onClick={() => onSuggestionClick({
                    text: category,
                    type: 'filter',
                    entity_type: 'inventory'
                  })}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <Hash className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-900 truncate">
                      {category}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {/* Tags */}
          {suggestions.tags.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('search.suggestions.tags')}
              </div>
              <div className="px-2 py-1">
                <div className="flex flex-wrap gap-1">
                  {suggestions.tags.slice(0, 10).map((tag, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => onSuggestionClick({
                        text: tag,
                        type: 'filter',
                        entity_type: 'inventory'
                      })}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {suggestions.recent_searches.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('search.suggestions.recent')}
              </div>
              {suggestions.recent_searches.slice(0, 3).map((search, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-2 text-left"
                  onClick={() => onSuggestionClick({
                    text: search,
                    type: 'query'
                  })}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">
                      {search}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};