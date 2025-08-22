'use client';

import React, { useState, useEffect } from 'react';
import { sowGenerationService, SoWGenerationJob } from '../../lib/services/sowGenerationService';
import { Button } from '../ui/Button';

interface SoWGenerationStatusProps {
  jobId: string;
  onComplete: (result: any) => void;
  onCancel: () => void;
}

export const SoWGenerationStatus: React.FC<SoWGenerationStatusProps> = ({
  jobId,
  onComplete,
  onCancel
}) => {
  const [job, setJob] = useState<SoWGenerationJob | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const pollJobStatus = () => {
      const currentJob = sowGenerationService.getJobStatus(jobId);
      setJob(currentJob);

      if (currentJob?.status === 'completed' && currentJob.result) {
        onComplete(currentJob.result);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollJobStatus, 5000);
    
    // Initial poll
    pollJobStatus();

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  useEffect(() => {
    if (job?.estimatedCompletionTime) {
      const updateTimeRemaining = () => {
        const now = new Date();
        const remaining = job.estimatedCompletionTime.getTime() - now.getTime();
        
        if (remaining <= 0) {
          setTimeRemaining('Processing should complete soon...');
        } else {
          const minutes = Math.floor(remaining / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')} remaining`);
        }
      };

      const interval = setInterval(updateTimeRemaining, 1000);
      updateTimeRemaining();

      return () => clearInterval(interval);
    }
  }, [job?.estimatedCompletionTime]);

  const handleCancel = () => {
    if (job && job.status !== 'completed' && job.status !== 'failed') {
      sowGenerationService.cancelJob(jobId);
    }
    onCancel();
  };

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job status...</p>
        </div>
      </div>
    );
  }

  if (job.status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Generation Failed</h3>
              <p className="text-red-700 mt-1">
                {job.error || 'An unexpected error occurred during SoW generation.'}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
            <Button onClick={onCancel} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Generating Your Scope of Work
          </h2>
          <p className="text-gray-600">
            Our AI agents are working together to create your detailed project plan and timeline.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{job.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>

        {/* Status Information */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {job.status === 'processing' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                ) : (
                  <div className="h-5 w-5 bg-blue-600 rounded-full"></div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {job.status === 'queued' && 'Queued for processing'}
                  {job.status === 'processing' && 'Processing your project'}
                  {job.status === 'completed' && 'Generation complete'}
                </p>
                <p className="text-sm text-gray-600">
                  Started at {job.startedAt.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{timeRemaining}</p>
            </div>
          </div>

          {/* Processing Steps */}
          <div className="space-y-2">
            <ProcessingStep 
              title="Analyzing project requirements" 
              completed={job.progress > 10}
              current={job.progress >= 5 && job.progress <= 20}
            />
            <ProcessingStep 
              title="Generating scope of work" 
              completed={job.progress > 35}
              current={job.progress >= 20 && job.progress <= 40}
            />
            <ProcessingStep 
              title="Classifying materials and supplies" 
              completed={job.progress > 55}
              current={job.progress >= 40 && job.progress <= 60}
            />
            <ProcessingStep 
              title="Calculating labor costs and timelines" 
              completed={job.progress > 70}
              current={job.progress >= 55 && job.progress <= 75}
            />
            <ProcessingStep 
              title="Optimizing project timeline" 
              completed={job.progress > 90}
              current={job.progress >= 85 && job.progress <= 95}
            />
            <ProcessingStep 
              title="Finalizing documentation" 
              completed={job.progress === 100}
              current={job.progress >= 95 && job.progress < 100}
            />
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Why does this take 30 minutes?</h4>
              <p className="text-sm text-blue-700 mt-1">
                Our AI system coordinates multiple specialized agents to ensure your SoW is comprehensive, 
                accurate, and compliant with UK building regulations. This thorough process includes timeline 
                optimization and detailed cost analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Notification Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
          <h4 className="text-sm font-medium text-gray-900 mb-2">We'll notify you when ready</h4>
          <p className="text-sm text-gray-600">
            You'll receive a notification via your preferred method when your detailed SoW and Gantt chart are ready for review. 
            Feel free to close this page - we'll send you a link to return.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <Button onClick={handleCancel} variant="outline">
            Cancel Generation
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ProcessingStepProps {
  title: string;
  completed: boolean;
  current: boolean;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({ title, completed, current }) => {
  return (
    <div className="flex items-center p-2">
      <div className="flex-shrink-0">
        {completed ? (
          <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        ) : current ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        ) : (
          <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
        )}
      </div>
      <div className="ml-3">
        <p className={`text-sm ${completed ? 'text-green-700' : current ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
          {title}
        </p>
      </div>
    </div>
  );
};