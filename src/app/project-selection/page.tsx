'use client';

import React, { useState, useEffect } from 'react';
import { ProjectTypeCategory, ProjectType } from '@/lib/types';
import { ProjectTypeService } from '@/lib/services/projectTypeService';
import { ProjectTypeBrowser } from '@/components/project-types/ProjectTypeBrowser';
import { ProjectTypeSearch } from '@/components/project-types/ProjectTypeSearch';
import { CustomProjectForm } from '@/components/project-types/CustomProjectForm';
import { PopularProjects } from '@/components/project-types/PopularProjects';

export default function ProjectSelectionPage() {
  const [categories, setCategories] = useState<ProjectTypeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load project type categories
    const loadCategories = async () => {
      try {
        const allCategories = ProjectTypeService.getAllCategories();
        setCategories(allCategories);
      } catch (error) {
        console.error('Error loading project categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleProjectTypeSelect = (projectType: ProjectType) => {
    if (projectType === 'others') {
      setShowCustomForm(true);
    } else {
      setSelectedProjectType(projectType);
      // Navigate to next step (property assessment or AI planning)
      // This would typically use Next.js router
      console.log('Selected project type:', projectType);
    }
  };

  const handleCustomProjectSubmit = async (description: string) => {
    try {
      const categorization = await ProjectTypeService.categorizeCustomProject(description);
      console.log('AI Categorization result:', categorization);
      
      if (categorization.aiCategorization?.confidence && categorization.aiCategorization.confidence > 0.7) {
        setSelectedProjectType(categorization.selectedType);
      } else {
        // Keep as "others" with custom description
        setSelectedProjectType('others');
      }
      
      setShowCustomForm(false);
    } catch (error) {
      console.error('Error categorizing custom project:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            What type of project are you planning?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose from our comprehensive list of home improvement projects. 
            Our AI will guide you through the planning process with expert knowledge for your specific project type.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <ProjectTypeSearch 
            onSearch={setSearchQuery}
            onProjectTypeSelect={handleProjectTypeSelect}
          />
        </div>

        {/* Popular Projects */}
        {!searchQuery && !selectedCategory && (
          <div className="mb-12">
            <PopularProjects onProjectTypeSelect={handleProjectTypeSelect} />
          </div>
        )}

        {/* Project Type Browser */}
        <ProjectTypeBrowser
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          onProjectTypeSelect={handleProjectTypeSelect}
          searchQuery={searchQuery}
        />

        {/* Custom Project Form Modal */}
        {showCustomForm && (
          <CustomProjectForm
            onSubmit={handleCustomProjectSubmit}
            onCancel={() => setShowCustomForm(false)}
          />
        )}

        {/* Selected Project Type Display */}
        {selectedProjectType && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Selected Project Type
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700">
                  {ProjectTypeService.getProjectTypeById(selectedProjectType)?.name}
                </p>
                <p className="text-sm text-gray-500">
                  {ProjectTypeService.getProjectTypeById(selectedProjectType)?.description}
                </p>
              </div>
              <button
                onClick={() => {
                  // Navigate to next step
                  console.log('Proceeding with project type:', selectedProjectType);
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}