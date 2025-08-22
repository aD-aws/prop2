'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ProjectTypeInfo, ProjectType } from '@/lib/types';
import { ProjectTypeService } from '@/lib/services/projectTypeService';

interface ProjectTypeSearchProps {
  onSearch: (query: string) => void;
  onProjectTypeSelect: (projectType: ProjectType) => void;
}

export function ProjectTypeSearch({ onSearch, onProjectTypeSelect }: ProjectTypeSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProjectTypeInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim()) {
        const results = ProjectTypeService.searchProjectTypes(query);
        setSuggestions(results.slice(0, 8)); // Limit to 8 suggestions
        setShowSuggestions(true);
        onSearch(query);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        onSearch('');
      }
      setSelectedIndex(-1);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionSelect = (projectType: ProjectTypeInfo) => {
    setQuery(projectType.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onProjectTypeSelect(projectType.id);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      suggestionsRef.current && 
      !suggestionsRef.current.contains(e.target as Node) &&
      !inputRef.current?.contains(e.target as Node)
    ) {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder="Search for your project type (e.g., kitchen renovation, loft conversion, bathroom refit...)"
          className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
        />
        
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setShowSuggestions(false);
              onSearch('');
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {suggestion.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500">
                      {formatCurrency(suggestion.estimatedCostRange.min)} - {formatCurrency(suggestion.estimatedCostRange.max)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      suggestion.complexity === 'low' ? 'bg-green-100 text-green-800' :
                      suggestion.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {suggestion.complexity}
                    </span>
                  </div>
                </div>
                
                <div className="ml-4 flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
          
          {/* Show "Others" option if no exact matches */}
          <div
            onClick={() => onProjectTypeSelect('others')}
            className="px-4 py-3 cursor-pointer border-t border-gray-200 bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex items-center">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  Don&apos;t see your project type?
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  Describe your custom project and our AI will help categorize it
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No results message */}
      {showSuggestions && suggestions.length === 0 && query.trim() && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              No project types found for &quot;{query}&quot;
            </p>
            <button
              onClick={() => onProjectTypeSelect('others')}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Describe your custom project instead →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}