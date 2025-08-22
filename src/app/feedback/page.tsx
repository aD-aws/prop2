'use client';

import React, { useState } from 'react';
import { FeedbackSubmissionForm } from '../../components/feedback/FeedbackSubmissionForm';
import { BuilderRatingDisplay } from '../../components/feedback/BuilderRatingDisplay';
import { ProjectCompletionManager } from '../../components/feedback/ProjectCompletionManager';
import { LeadDistributionDashboard } from '../../components/admin/LeadDistributionDashboard';
import { 
  ProjectFeedback, 
  FeedbackSubmissionRequest, 
  BuilderRating, 
  Project,
  ProjectStatus 
} from '../../lib/types';

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<'submission' | 'display' | 'completion' | 'distribution'>('submission');
  const [submittedFeedback, setSubmittedFeedback] = useState<ProjectFeedback | null>(null);

  // Mock data for demonstration
  const mockBuilderRating: BuilderRating = {
    builderId: 'builder-123',
    overallRating: 4.6,
    totalReviews: 47,
    qualityAverage: 4.8,
    timelinessAverage: 4.3,
    communicationAverage: 4.7,
    cleanlinessAverage: 4.5,
    professionalismAverage: 4.9,
    valueForMoneyAverage: 4.2,
    recommendationPercentage: 89,
    recentFeedback: [
      {
        id: 'feedback-1',
        projectId: 'project-1',
        homeownerId: 'homeowner-1',
        builderId: 'builder-123',
        rating: 5,
        overallSatisfaction: 5,
        qualityRating: 5,
        timelinessRating: 4,
        communicationRating: 5,
        cleanlinessRating: 4,
        professionalismRating: 5,
        valueForMoneyRating: 4,
        writtenFeedback: 'Excellent work on our kitchen renovation. The team was professional, clean, and delivered exactly what was promised. Highly recommend!',
        wouldRecommend: true,
        completionPhotos: [
          {
            id: 'photo-1',
            feedbackId: 'feedback-1',
            url: '/api/placeholder/300/200',
            caption: 'Completed kitchen',
            uploadedAt: new Date(),
            fileSize: 1024000,
            fileName: 'kitchen-after.jpg'
          }
        ],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        isPublic: true
      },
      {
        id: 'feedback-2',
        projectId: 'project-2',
        homeownerId: 'homeowner-2',
        builderId: 'builder-123',
        rating: 4,
        overallSatisfaction: 4,
        qualityRating: 4,
        timelinessRating: 4,
        communicationRating: 4,
        cleanlinessRating: 4,
        professionalismRating: 5,
        valueForMoneyRating: 4,
        writtenFeedback: 'Good quality bathroom renovation. Took a bit longer than expected but the final result was worth it.',
        wouldRecommend: true,
        completionPhotos: [],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        isPublic: true
      }
    ],
    ratingDistribution: {
      fiveStars: 28,
      fourStars: 15,
      threeStars: 3,
      twoStars: 1,
      oneStar: 0
    },
    lastUpdated: new Date()
  };

  const mockProject: Project = {
    id: 'project-demo',
    homeownerId: 'homeowner-demo',
    propertyId: 'property-demo',
    projectType: 'kitchen_full_refit',
    status: 'completion' as ProjectStatus,
    quotes: [],
    invitedBuilders: [],
    selectedBuilderId: 'builder-123',
    timeline: {
      milestones: []
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const handleFeedbackSubmit = async (feedbackRequest: FeedbackSubmissionRequest) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newFeedback: ProjectFeedback = {
      id: `feedback-${Date.now()}`,
      projectId: feedbackRequest.projectId,
      homeownerId: 'homeowner-demo',
      builderId: 'builder-123',
      rating: feedbackRequest.rating,
      overallSatisfaction: feedbackRequest.overallSatisfaction,
      qualityRating: feedbackRequest.qualityRating,
      timelinessRating: feedbackRequest.timelinessRating,
      communicationRating: feedbackRequest.communicationRating,
      cleanlinessRating: feedbackRequest.cleanlinessRating,
      professionalismRating: feedbackRequest.professionalismRating,
      valueForMoneyRating: feedbackRequest.valueForMoneyRating,
      writtenFeedback: feedbackRequest.writtenFeedback,
      wouldRecommend: feedbackRequest.wouldRecommend,
      completionPhotos: feedbackRequest.photos.map((photo, index) => ({
        id: `photo-${index}`,
        feedbackId: `feedback-${Date.now()}`,
        url: URL.createObjectURL(photo),
        caption: `Photo ${index + 1}`,
        uploadedAt: new Date(),
        fileSize: photo.size,
        fileName: photo.name
      })),
      improvementSuggestions: feedbackRequest.improvementSuggestions,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: feedbackRequest.isPublic
    };

    setSubmittedFeedback(newFeedback);
    alert('Feedback submitted successfully!');
  };

  const TabButton: React.FC<{ 
    tab: typeof activeTab; 
    label: string; 
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md font-medium transition-colors ${
        isActive 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Feedback and Rating System Demo
          </h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates the feedback and rating system components for the UK Home Improvement Platform.
          </p>

          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-8">
            <TabButton
              tab="submission"
              label="Feedback Submission"
              isActive={activeTab === 'submission'}
              onClick={() => setActiveTab('submission')}
            />
            <TabButton
              tab="display"
              label="Builder Rating Display"
              isActive={activeTab === 'display'}
              onClick={() => setActiveTab('display')}
            />
            <TabButton
              tab="completion"
              label="Project Completion"
              isActive={activeTab === 'completion'}
              onClick={() => setActiveTab('completion')}
            />
            <TabButton
              tab="distribution"
              label="Lead Distribution"
              isActive={activeTab === 'distribution'}
              onClick={() => setActiveTab('distribution')}
            />
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'submission' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Feedback Submission Form
            </h2>
            <p className="text-gray-600 mb-6">
              This form allows homeowners to submit detailed feedback and ratings for completed projects.
            </p>
            
            {!submittedFeedback ? (
              <FeedbackSubmissionForm
                projectId="project-demo"
                builderId="builder-123"
                builderName="Smith Construction Ltd"
                onSubmit={handleFeedbackSubmit}
                onCancel={() => alert('Feedback cancelled')}
              />
            ) : (
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Feedback Submitted Successfully!
                </h3>
                <p className="text-green-700 mb-4">
                  Thank you for your feedback. It helps other homeowners make informed decisions.
                </p>
                <button
                  onClick={() => setSubmittedFeedback(null)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Submit Another Feedback
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'display' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Builder Rating Display
            </h2>
            <p className="text-gray-600 mb-6">
              This component shows how builder ratings and feedback are displayed to homeowners.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Full Display</h3>
                <BuilderRatingDisplay 
                  builderRating={mockBuilderRating}
                  showDetailedFeedback={true}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compact Display</h3>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-medium text-gray-900 mb-2">Smith Construction Ltd</h4>
                  <BuilderRatingDisplay 
                    builderRating={mockBuilderRating}
                    compact={true}
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Specializes in kitchen and bathroom renovations
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'completion' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Project Completion Manager
            </h2>
            <p className="text-gray-600 mb-6">
              This component manages the project completion process and prompts homeowners to submit feedback.
            </p>
            
            <ProjectCompletionManager
              project={mockProject}
              homeownerId="homeowner-demo"
              onFeedbackSubmitted={(feedback) => {
                console.log('Feedback submitted:', feedback);
                alert('Feedback submitted successfully!');
              }}
            />
          </div>
        )}

        {activeTab === 'distribution' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Lead Distribution Dashboard
            </h2>
            <p className="text-gray-600 mb-6">
              This admin dashboard shows how builders are prioritized for lead distribution based on ratings and performance metrics.
            </p>
            
            <LeadDistributionDashboard
              onDistributeLeads={(projectId, builders) => {
                console.log('Distributing leads for project:', projectId, builders);
                alert(`Lead distributed to ${builders.length} builders`);
              }}
            />
          </div>
        )}

        {/* Implementation Notes */}
        <div className="mt-12 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Implementation Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Feedback System</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Multi-dimensional rating system (quality, timeliness, communication, etc.)</li>
                <li>• Photo upload for completed work</li>
                <li>• Written feedback with privacy controls</li>
                <li>• One feedback per project limitation</li>
                <li>• Recommendation tracking</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Builder Prioritization</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Rating-based priority scoring (40% weight)</li>
                <li>• Response time consideration (20% weight)</li>
                <li>• Acceptance rate tracking (15% weight)</li>
                <li>• Completion rate monitoring (15% weight)</li>
                <li>• Activity recency factor (10% weight)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}