'use client';

import React, { useState, useEffect } from 'react';
import { ProjectTypeInfo, ProjectType } from '@/lib/types';
import { ProjectTypeService } from '@/lib/services/projectTypeService';

interface PopularProjectsProps {
  onProjectTypeSelect: (projectType: ProjectType) => void;
}

export function PopularProjects({ onProjectTypeSelect }: PopularProjectsProps) {
  const [popularProjects, setPopularProjects] = useState<ProjectTypeInfo[]>([]);

  useEffect(() => {
    const projects = ProjectTypeService.getPopularProjectTypes(8);
    setPopularProjects(projects);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProjectIcon = (projectType: ProjectType): string => {
    // Map project types to appropriate icons
    const iconMap: Record<string, string> = {
      'loft_conversion_dormer': '🏠',
      'loft_conversion_hip_to_gable': '🏗️',
      'loft_conversion_mansard': '🏘️',
      'loft_conversion_velux': '🪟',
      'rear_extension_single_storey': '🏡',
      'kitchen_full_refit': '🍳',
      'bathroom_full_refit': '🛁',
      'bedroom_renovation': '🛏️',
      'living_room_renovation': '🛋️',
      'windows_doors': '🚪',
      'electrical': '⚡',
      'plumbing': '🔧',
      'roofing': '🏠',
      'heating_hvac': '🔥',
      'rendering_cladding': '🎨',
      'landscaping_garden': '🌿',
      'driveway_patio': '🚗',
    };
    
    return iconMap[projectType] || '🏠';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Popular Projects</h2>
          <p className="text-gray-600 mt-1">Most commonly requested home improvements</p>
        </div>
        <div className="text-sm text-gray-500">
          Based on platform usage
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {popularProjects.map((project, index) => (
          <div
            key={project.id}
            onClick={() => onProjectTypeSelect(project.id)}
            className="relative group cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 hover:from-blue-50 hover:to-blue-100 transition-all duration-200 border border-gray-200 hover:border-blue-300 hover:shadow-md"
          >
            {/* Popularity Rank Badge */}
            <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {index + 1}
            </div>

            <div className="text-center">
              <div className="text-3xl mb-3">
                {getProjectIcon(project.id)}
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                {project.name}
              </h3>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {project.description}
              </p>
              
              <div className="space-y-1 text-xs text-gray-500">
                <div>
                  From {formatCurrency(project.estimatedCostRange.min)}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.complexity === 'low' ? 'bg-green-100 text-green-700' :
                    project.complexity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {project.complexity}
                  </span>
                </div>
              </div>
              
              <button className="mt-3 w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-gray-50 group-hover:border-blue-300 group-hover:text-blue-700 transition-colors">
                Select
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View All Projects Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          Looking for something else?{' '}
          <button 
            onClick={() => onProjectTypeSelect('others')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Browse all project types
          </button>
          {' '}or{' '}
          <button 
            onClick={() => onProjectTypeSelect('others')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            describe your custom project
          </button>
        </p>
      </div>
    </div>
  );
}