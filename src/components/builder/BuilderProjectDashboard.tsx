'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ProjectSoWViewer } from './ProjectSoWViewer';
import { QuoteSubmissionForm } from './QuoteSubmissionForm';
import { QuoteAnalysisDisplay } from './QuoteAnalysisDisplay';
import { BuilderProjectAccessService } from '@/lib/services/builderProjectAccessService';
import { QuoteManagementService } from '@/lib/services/quoteManagementService';
import { Project, Quote, SoWDocument } from '@/lib/types';

interface BuilderProjectDashboardProps {
  builderId: string;
  projectId?: string;
  invitationCode?: string;
}

export function BuilderProjectDashboard({ 
  builderId, 
  projectId: initialProjectId, 
  invitationCode 
}: BuilderProjectDashboardProps) {
  const [currentView, setCurrentView] = useState<'projects' | 'sow' | 'quote' | 'analysis'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId || null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessGranted, setAccessGranted] = useState(false);

  useEffect(() => {
    if (invitationCode) {
      handleInvitationCode();
    } else {
      loadBuilderProjects();
    }
  }, [builderId, invitationCode]);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDetails();
      loadProjectQuotes();
    }
  }, [selectedProjectId]);

  const handleInvitationCode = async () => {
    if (!invitationCode) return;

    setLoading(true);
    setError('');

    try {
      const result = await BuilderProjectAccessService.grantProjectAccess(invitationCode, builderId);
      
      if (result.success && result.projectId) {
        setSelectedProjectId(result.projectId);
        setAccessGranted(true);
        await loadBuilderProjects();
      } else {
        setError(result.error || 'Failed to access project');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadBuilderProjects = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await BuilderProjectAccessService.getBuilderAccessibleProjects(builderId);
      
      if (result.success && result.projects) {
        setProjects(result.projects);
        
        // If we have a selected project ID, find and set it
        if (selectedProjectId) {
          const project = result.projects.find(p => p.id === selectedProjectId);
          if (project) {
            setSelectedProject(project);
            setCurrentView('sow');
          }
        }
      } else {
        setError(result.error || 'Failed to load projects');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async () => {
    if (!selectedProjectId) return;

    try {
      const result = await BuilderProjectAccessService.getProjectSoWForBuilder(builderId, selectedProjectId);
      
      if (result.success && result.project) {
        setSelectedProject(result.project);
      }
    } catch (error) {
      console.error('Error loading project details:', error);
    }
  };

  const loadProjectQuotes = async () => {
    if (!selectedProjectId) return;

    try {
      const result = await QuoteManagementService.getProjectQuotes(selectedProjectId);
      
      if (result.success && result.quotes) {
        const builderQuotes = result.quotes.filter(quote => quote.builderId === builderId);
        setQuotes(builderQuotes);
        
        if (builderQuotes.length > 0) {
          setSelectedQuote(builderQuotes[0]); // Most recent quote
        }
      }
    } catch (error) {
      console.error('Error loading project quotes:', error);
    }
  };

  const handleQuoteSubmit = async (quoteData: any) => {
    if (!selectedProjectId) return;

    try {
      const result = await QuoteManagementService.submitQuote(
        selectedProjectId,
        builderId,
        {
          pricing: quoteData.pricing,
          timeline: quoteData.timeline,
          startDate: quoteData.startDate,
          termsAndConditions: quoteData.termsAndConditions,
          insuranceDocuments: quoteData.insuranceDocuments || [],
          referenceProjects: quoteData.referenceProjects,
          amendments: quoteData.amendments
        }
      );

      if (result.success && result.quoteId) {
        await loadProjectQuotes();
        setCurrentView('analysis');
      } else {
        throw new Error(result.error || 'Failed to submit quote');
      }
    } catch (error) {
      throw error; // Re-throw to be handled by the form
    }
  };

  const formatProjectType = (projectType: string) => {
    return projectType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'builder_invitation':
      case 'quote_collection':
        return 'bg-blue-100 text-blue-800';
      case 'builder_selection':
        return 'bg-yellow-100 text-yellow-800';
      case 'contract_generation':
      case 'project_execution':
        return 'bg-green-100 text-green-800';
      case 'completion':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <div className="mt-4">
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Projects list view
  if (currentView === 'projects') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
          <div className="text-sm text-gray-500">
            {projects.length} project{projects.length !== 1 ? 's' : ''} available
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              You'll see projects here when homeowners invite you to quote.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const builderQuote = quotes.find(q => q.projectId === project.id && q.builderId === builderId);
              
              return (
                <div key={project.id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProjectStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                    {builderQuote && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Quote Submitted
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {formatProjectType(project.projectType)}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div>Created: {formatDate(project.createdAt)}</div>
                    {project.timeline.estimatedStartDate && (
                      <div>Est. Start: {formatDate(project.timeline.estimatedStartDate)}</div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setSelectedProject(project);
                        setCurrentView('sow');
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    
                    {!builderQuote ? (
                      <Button
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setSelectedProject(project);
                          setCurrentView('quote');
                        }}
                        size="sm"
                        className="flex-1"
                      >
                        Submit Quote
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setSelectedProject(project);
                          setSelectedQuote(builderQuote);
                          setCurrentView('analysis');
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        View Quote
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Individual project views
  if (!selectedProject) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Project not found</p>
        <Button onClick={() => setCurrentView('projects')} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setCurrentView('projects')}
            variant="outline"
            size="sm"
          >
            ← Back to Projects
          </Button>
          
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {formatProjectType(selectedProject.projectType)}
            </h2>
            <p className="text-sm text-gray-600">Project ID: {selectedProject.id}</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={() => setCurrentView('sow')}
            variant={currentView === 'sow' ? 'primary' : 'outline'}
            size="sm"
          >
            View SoW
          </Button>
          
          <Button
            onClick={() => setCurrentView('quote')}
            variant={currentView === 'quote' ? 'primary' : 'outline'}
            size="sm"
          >
            {quotes.length > 0 ? 'Edit Quote' : 'Submit Quote'}
          </Button>
          
          {quotes.length > 0 && (
            <Button
              onClick={() => setCurrentView('analysis')}
              variant={currentView === 'analysis' ? 'primary' : 'outline'}
              size="sm"
            >
              View Analysis
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {currentView === 'sow' && (
        <ProjectSoWViewer
          builderId={builderId}
          projectId={selectedProject.id}
          onQuoteClick={() => setCurrentView('quote')}
        />
      )}

      {currentView === 'quote' && (
        <QuoteSubmissionForm
          project={selectedProject}
          builderId={builderId}
          onSubmit={async (quoteData) => {
            // Handle quote submission
            console.log('Quote submitted:', quoteData);
            loadProjectQuotes();
            setCurrentView('analysis');
          }}
          onCancel={() => setCurrentView('analysis')}
        />
      )}

      {currentView === 'analysis' && selectedQuote && selectedQuote.aiAnalysis && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quote Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500">Total Amount</div>
                <div className="text-2xl font-bold text-gray-900">
                  £{selectedQuote.pricing.totalAmount.toLocaleString()}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">Timeline</div>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedQuote.timeline} days
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">Status</div>
                <div className="text-lg font-semibold text-blue-600 capitalize">
                  {selectedQuote.status.replace('_', ' ')}
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <div>Submitted: {formatDate(selectedQuote.submittedAt)}</div>
                <div>Start Date: {formatDate(selectedQuote.startDate)}</div>
                <div>Completion Date: {formatDate(selectedQuote.projectedCompletionDate)}</div>
              </div>
            </div>
          </div>

          <QuoteAnalysisDisplay analysis={selectedQuote.aiAnalysis} />
        </div>
      )}

      {currentView === 'analysis' && (!selectedQuote || !selectedQuote.aiAnalysis) && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 00-2 2v6a2 2 0 00-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Analysis in Progress</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your quote is being analyzed. This usually takes a few minutes.
            </p>
            <Button
              onClick={() => loadProjectQuotes()}
              className="mt-4"
              variant="outline"
            >
              Refresh
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}