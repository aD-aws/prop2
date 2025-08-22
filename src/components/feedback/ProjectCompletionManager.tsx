'use client';

import React, { useState, useEffect } from 'react';
import { Project, ProjectFeedback, FeedbackSubmissionRequest } from '../../lib/types';
import { FeedbackSubmissionForm } from './FeedbackSubmissionForm';
import { feedbackService } from '../../lib/services/feedbackService';

interface ProjectCompletionManagerProps {
  project: Project;
  homeownerId: string;
  onFeedbackSubmitted?: (feedback: ProjectFeedback) => void;
}

export const ProjectCompletionManager: React.FC<ProjectCompletionManagerProps> = ({
  project,
  homeownerId,
  onFeedbackSubmitted
}) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<ProjectFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkExistingFeedback();
  }, [project.id]);

  const checkExistingFeedback = async () => {
    try {
      const feedback = await feedbackService.getProjectFeedback(project.id);
      setExistingFeedback(feedback);
    } catch (error) {
      console.error('Error checking existing feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async (feedbackRequest: FeedbackSubmissionRequest) => {
    if (!project.selectedBuilderId) {
      throw new Error('No builder selected for this project');
    }

    setIsSubmitting(true);
    try {
      const feedback = await feedbackService.submitFeedback(
        homeownerId,
        project.selectedBuilderId,
        feedbackRequest
      );
      
      setExistingFeedback(feedback);
      setShowFeedbackForm(false);
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedback);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBuilderName = () => {
    // In a real implementation, this would fetch builder details
    return 'Builder Name'; // Placeholder
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Show feedback form
  if (showFeedbackForm && !existingFeedback) {
    return (
      <FeedbackSubmissionForm
        projectId={project.id}
        builderId={project.selectedBuilderId!}
        builderName={getBuilderName()}
        onSubmit={handleSubmitFeedback}
        onCancel={() => setShowFeedbackForm(false)}
      />
    );
  }

  // Show existing feedback
  if (existingFeedback) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Your Feedback for {getBuilderName()}
        </h3>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="text-lg font-semibold mr-2">Overall Rating:</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-xl ${
                    star <= existingFeedback.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="ml-2 text-gray-600">({existingFeedback.rating}/5)</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="text-sm">
              <span className="font-medium">Quality:</span> {existingFeedback.qualityRating}/5
            </div>
            <div className="text-sm">
              <span className="font-medium">Timeliness:</span> {existingFeedback.timelinessRating}/5
            </div>
            <div className="text-sm">
              <span className="font-medium">Communication:</span> {existingFeedback.communicationRating}/5
            </div>
            <div className="text-sm">
              <span className="font-medium">Cleanliness:</span> {existingFeedback.cleanlinessRating}/5
            </div>
            <div className="text-sm">
              <span className="font-medium">Professionalism:</span> {existingFeedback.professionalismRating}/5
            </div>
            <div className="text-sm">
              <span className="font-medium">Value:</span> {existingFeedback.valueForMoneyRating}/5
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Your Review:</h4>
          <p className="text-gray-700 bg-gray-50 p-3 rounded">
            {existingFeedback.writtenFeedback}
          </p>
        </div>

        {existingFeedback.wouldRecommend && (
          <div className="mb-4 flex items-center text-green-600">
            <span className="mr-2">✓</span>
            You would recommend this builder
          </div>
        )}

        {existingFeedback.completionPhotos.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Completion Photos:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {existingFeedback.completionPhotos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt="Completion photo"
                  className="w-full h-24 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500">
          Feedback submitted on {new Date(existingFeedback.createdAt).toLocaleDateString()}
        </div>
      </div>
    );
  }

  // Show completion status and feedback prompt
  const isProjectCompleted = project.status === 'completion';
  const canSubmitFeedback = isProjectCompleted && project.selectedBuilderId && !existingFeedback;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Project Status</h3>
      
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <div className={`w-4 h-4 rounded-full mr-3 ${
            isProjectCompleted ? 'bg-green-500' : 'bg-yellow-500'
          }`}></div>
          <span className="font-semibold">
            {isProjectCompleted ? 'Project Completed' : 'Project In Progress'}
          </span>
        </div>
        
        {isProjectCompleted && (
          <p className="text-gray-600 ml-7">
            Congratulations! Your project has been completed.
          </p>
        )}
      </div>

      {canSubmitFeedback && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">
            Rate Your Experience
          </h4>
          <p className="text-blue-700 mb-4">
            Help other homeowners by sharing your experience with {getBuilderName()}.
            Your feedback helps maintain quality standards on our platform.
          </p>
          <button
            onClick={() => setShowFeedbackForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Submit Feedback & Rating
          </button>
        </div>
      )}

      {!isProjectCompleted && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-600">
            You'll be able to submit feedback and rate your builder once the project is completed.
          </p>
        </div>
      )}
    </div>
  );
};