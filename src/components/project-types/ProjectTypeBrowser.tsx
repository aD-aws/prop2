'use client';

import React, { useState, useMemo } from 'react';
import { ProjectTypeCategory, ProjectType } from '@/lib/types';
import { ProjectTypeService } from '@/lib/services/projectTypeService';
import { ProjectTypeCard } from './ProjectTypeCard';

interface ProjectTypeBrowserProps {
  categories: ProjectTypeCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  onProjectTypeSelect: (projectType: ProjectType) => void;
  searchQuery?: string;
}

export function ProjectTypeBrowser({
  categories,
  selectedCategory,
  onCategorySelect,
  onProjectTypeSelect,
  searchQuery = ''
}: ProjectTypeBrowserProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter project types based on search query
  const filteredProjectTypes = useMemo(() => {
    if (searchQuery.trim()) {
      return ProjectTypeService.searchProjectTypes(searchQuery);
    }
    
    if (selectedCategory) {
      return ProjectTypeService.getProjectTypesByCategory(selectedCategory);
    }
    
    return [];
  }, [searchQuery, selectedCategory]);

  // Show search results if there's a query
  if (searchQuery.trim()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Search Results ({filteredProjectTypes.length})
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zm-6 6a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm6 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredProjectTypes.map((projectType) => (
            <ProjectTypeCard
              key={projectType.id}
              projectType={projectType}
              viewMode={viewMode}
              onSelect={() => onProjectTypeSelect(projectType.id)}
            />
          ))}
        </div>

        {filteredProjectTypes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No project types found matching &quot;{searchQuery}&quot;</p>
            <p className="text-gray-400 mt-2">Try a different search term or browse categories below</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Category Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(
                selectedCategory === category.id ? null : category.id
              )}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                selectedCategory === category.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {category.projectTypes.length} project types
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Category Project Types */}
      {selectedCategory && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {categories.find(c => c.id === selectedCategory)?.name}
              </h3>
              <p className="text-gray-600">
                {categories.find(c => c.id === selectedCategory)?.description}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zm-6 6a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm6 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredProjectTypes.map((projectType) => (
              <ProjectTypeCard
                key={projectType.id}
                projectType={projectType}
                viewMode={viewMode}
                onSelect={() => onProjectTypeSelect(projectType.id)}
              />
            ))}
          </div>

          {filteredProjectTypes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No project types available in this category</p>
            </div>
          )}
        </div>
      )}

      {/* Call to Action for Others */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Don&apos;t see your project type?
          </h3>
          <p className="text-gray-600 mb-4">
            Describe your unique project and our AI will help categorize and plan it for you.
          </p>
          <button
            onClick={() => onProjectTypeSelect('others')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Describe Custom Project
          </button>
        </div>
      </div>
    </div>
  );
}