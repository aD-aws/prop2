'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { SoWDocument, Project, GanttChart } from '@/lib/types';
import { BuilderProjectAccessService } from '@/lib/services/builderProjectAccessService';
import { GanttChart as GanttChartComponent } from '@/components/timeline/GanttChart';

interface ProjectSoWViewerProps {
  builderId: string;
  projectId: string;
  onQuoteClick?: () => void;
}

export function ProjectSoWViewer({ builderId, projectId, onQuoteClick }: ProjectSoWViewerProps) {
  const [sowDocument, setSowDocument] = useState<SoWDocument | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'timeline' | 'regulations'>('overview');

  useEffect(() => {
    loadProjectSoW();
  }, [builderId, projectId]);

  const loadProjectSoW = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await BuilderProjectAccessService.getProjectSoWForBuilder(builderId, projectId);
      
      if (result.success && result.sowDocument && result.project) {
        setSowDocument(result.sowDocument);
        setProject(result.project);
      } else {
        setError(result.error || 'Failed to load project details');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatProjectType = (projectType: string) => {
    return projectType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!sowDocument || !project) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No project details available</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {formatProjectType(project.projectType)}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Project ID: {project.id}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={onQuoteClick}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Submit Quote
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'materials', name: 'Materials' },
            { id: 'timeline', name: 'Timeline' },
            { id: 'regulations', name: 'Regulations' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Project Details</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Type</dt>
                      <dd className="text-sm text-gray-900">{formatProjectType(project.projectType)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm text-gray-900 capitalize">{project.status.replace('_', ' ')}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="text-sm text-gray-900">{formatDate(project.createdAt)}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Scope Summary</h4>
                  <p className="text-sm text-gray-600">
                    This project includes {sowDocument.sections.length} main work sections with 
                    {sowDocument.materials.length} material specifications and 
                    {sowDocument.laborRequirements.length} labor requirements.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Work Sections</h3>
              <div className="space-y-4">
                {sowDocument.sections.map((section, index) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {index + 1}. {section.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                    
                    {section.specifications.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Specifications:</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {section.specifications.map((spec, specIndex) => (
                            <li key={specIndex} className="text-sm text-gray-600">{spec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Materials Specification</h3>
              <p className="text-sm text-gray-600 mb-6">
                Materials are categorized by who provides them. Please include all builder-provided materials in your quote.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3 text-red-600">
                  Builder Provided Materials
                </h4>
                <div className="space-y-3">
                  {sowDocument.materials
                    .filter(material => material.category === 'builder_provided')
                    .map((material) => (
                      <div key={material.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{material.name}</h5>
                          <span className="text-sm text-gray-500">
                            {material.quantity} {material.unit}
                          </span>
                        </div>
                        {material.specifications.length > 0 && (
                          <ul className="text-sm text-gray-600 space-y-1">
                            {material.specifications.map((spec, index) => (
                              <li key={index}>• {spec}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3 text-green-600">
                  Homeowner Provided Materials
                </h4>
                <div className="space-y-3">
                  {sowDocument.materials
                    .filter(material => material.category === 'homeowner_provided')
                    .map((material) => (
                      <div key={material.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{material.name}</h5>
                          <span className="text-sm text-gray-500">
                            {material.quantity} {material.unit}
                          </span>
                        </div>
                        {material.specifications.length > 0 && (
                          <ul className="text-sm text-gray-600 space-y-1">
                            {material.specifications.map((spec, index) => (
                              <li key={index}>• {spec}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Timeline</h3>
              <p className="text-sm text-gray-600 mb-6">
                This timeline shows the recommended sequence of work. You can propose modifications in your quote.
              </p>
            </div>

            {project.ganttChart && (
              <div className="bg-gray-50 rounded-lg p-4">
                <GanttChartComponent ganttChart={project.ganttChart} />
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Labor Requirements</h4>
              <div className="space-y-3">
                {sowDocument.laborRequirements.map((labor) => (
                  <div key={labor.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-900">{labor.trade}</h5>
                      <span className="text-sm text-gray-500">
                        {labor.personDays} person-days
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{labor.description}</p>
                    
                    {labor.qualifications.length > 0 && (
                      <div>
                        <h6 className="text-sm font-medium text-gray-900 mb-1">Required Qualifications:</h6>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {labor.qualifications.map((qual, index) => (
                            <li key={index}>• {qual}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'regulations' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Regulatory Requirements</h3>
              <p className="text-sm text-gray-600 mb-6">
                Ensure all work complies with these regulatory requirements. Include any necessary permits or certifications in your quote.
              </p>
            </div>

            <div className="space-y-4">
              {sowDocument.regulatoryRequirements.map((requirement) => (
                <div key={requirement.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{requirement.type}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      requirement.mandatory 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {requirement.mandatory ? 'Mandatory' : 'Recommended'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{requirement.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Important Notice
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      All work must comply with current UK Building Regulations and local planning requirements. 
                      Ensure you have the necessary qualifications and certifications for the work specified.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}