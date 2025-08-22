'use client';

import React from 'react';
import { ProjectTypeInfo } from '@/lib/types';

interface ProjectTypeCardProps {
  projectType: ProjectTypeInfo;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
}

export function ProjectTypeCard({ projectType, viewMode, onSelect }: ProjectTypeCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (weeks: number) => {
    if (weeks === 1) return '1 week';
    if (weeks < 4) return `${weeks} weeks`;
    const months = Math.round(weeks / 4);
    return months === 1 ? '1 month' : `${months} months`;
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (viewMode === 'list') {
    return (
      <div 
        onClick={onSelect}
        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              {projectType.imageUrl && (
                <img 
                  src={projectType.imageUrl} 
                  alt={projectType.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{projectType.name}</h3>
                <p className="text-gray-600 mt-1">{projectType.description}</p>
                
                <div className="flex items-center space-x-4 mt-3">
                  <span className="text-sm text-gray-500">
                    {formatCurrency(projectType.estimatedCostRange.min)} - {formatCurrency(projectType.estimatedCostRange.max)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDuration(projectType.estimatedDuration.min)} - {formatDuration(projectType.estimatedDuration.max)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(projectType.complexity)}`}>
                    {projectType.complexity} complexity
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {projectType.requiresPlanning && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Planning Required
              </span>
            )}
            {projectType.requiresBuildingRegs && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Building Regs
              </span>
            )}
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              Select →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onSelect}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
    >
      {projectType.imageUrl && (
        <div className="aspect-w-16 aspect-h-9">
          <img 
            src={projectType.imageUrl} 
            alt={projectType.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {projectType.name}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(projectType.complexity)}`}>
            {projectType.complexity}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {projectType.description}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Cost Range:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(projectType.estimatedCostRange.min)} - {formatCurrency(projectType.estimatedCostRange.max)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Duration:</span>
            <span className="font-medium text-gray-900">
              {formatDuration(projectType.estimatedDuration.min)} - {formatDuration(projectType.estimatedDuration.max)}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {projectType.requiresPlanning && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Planning Required
            </span>
          )}
          {projectType.requiresBuildingRegs && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Building Regs
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {projectType.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
              {tag}
            </span>
          ))}
          {projectType.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
              +{projectType.tags.length - 3} more
            </span>
          )}
        </div>
        
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors group-hover:bg-blue-700">
          Select This Project Type
        </button>
      </div>
    </div>
  );
}