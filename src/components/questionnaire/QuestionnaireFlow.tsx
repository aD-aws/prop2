'use client';

import React, { useState, useEffect } from 'react';
import { ProjectType } from '../../lib/types';
import { questionnaireService, Question, QuestionnaireResponse } from '../../lib/services/questionnaireService';
import { QuestionCard } from './QuestionCard';
import { ProgressBar } from './ProgressBar';
import { Button } from '../ui/Button';

interface QuestionnaireFlowProps {
  projectId: string;
  projectType: ProjectType;
  customDescription?: string;
  onComplete: (answers: Record<string, any>) => void;
  onCancel: () => void;
}

export const QuestionnaireFlow: React.FC<QuestionnaireFlowProps> = ({
  projectId,
  projectType,
  customDescription,
  onComplete,
  onCancel
}) => {
  const [currentResponse, setCurrentResponse] = useState<QuestionnaireResponse | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Initialize questionnaire
  useEffect(() => {
    const initializeQuestionnaire = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await questionnaireService.startQuestionnaire(
          projectId,
          projectType,
          customDescription
        );

        setCurrentResponse(response);
        setSessionId(response.sessionId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start questionnaire');
      } finally {
        setIsLoading(false);
      }
    };

    initializeQuestionnaire();
  }, [projectId, projectType, customDescription]);

  const handleAnswer = async (questionId: string, answer: any) => {
    if (!sessionId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Store answer locally
      const newAnswers = { ...answers, [questionId]: answer };
      setAnswers(newAnswers);

      // Submit answer and get next question
      const nextResponse = await questionnaireService.answerQuestion(
        sessionId,
        questionId,
        answer
      );

      if (nextResponse) {
        setCurrentResponse(nextResponse);
      } else {
        // Questionnaire complete
        const session = questionnaireService.getSession(sessionId);
        if (session) {
          onComplete(session.answers);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    // Implementation for going back to previous question
    // This would require tracking question history
    console.log('Previous question functionality would be implemented here');
  };

  if (isLoading && !currentResponse) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (!currentResponse) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No questions available</p>
        <Button onClick={onCancel} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <ProgressBar 
          progress={currentResponse.progress} 
          showPercentage={true}
        />
        <p className="text-sm text-gray-600 mt-2 text-center">
          Question {Math.floor(currentResponse.progress / 10) + 1} of approximately {Math.ceil(100 / 10)}
        </p>
      </div>

      {/* Question Card */}
      <QuestionCard
        question={currentResponse.question}
        onAnswer={handleAnswer}
        isLoading={isLoading}
        isLastQuestion={currentResponse.isLastQuestion}
      />

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          onClick={handlePrevious}
          variant="outline"
          disabled={currentResponse.progress === 0}
        >
          Previous
        </Button>
        
        <Button
          onClick={onCancel}
          variant="outline"
        >
          Cancel
        </Button>
      </div>

      {/* Help Text */}
      {currentResponse.question.helpText && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                {currentResponse.question.helpText}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};