'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProjectType } from '../../lib/types';
import { QuestionnaireFlow } from '../../components/questionnaire/QuestionnaireFlow';
import { SoWGenerationStatus } from '../../components/sow/SoWGenerationStatus';
import { sowGenerationService } from '../../lib/services/sowGenerationService';
import { Button } from '../../components/ui/Button';

type PlanningPhase = 'questionnaire' | 'generation' | 'completed';

export default function ProjectPlanningPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [phase, setPhase] = useState<PlanningPhase>('questionnaire');
  const [projectId] = useState(() => `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [projectType, setProjectType] = useState<ProjectType | null>(null);
  const [customDescription, setCustomDescription] = useState<string | undefined>();
  const [generationJobId, setGenerationJobId] = useState<string | null>(null);
  const [sowResult, setSowResult] = useState<any>(null);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, any>>({});

  // Get project details from URL params
  useEffect(() => {
    const type = searchParams.get('type') as ProjectType;
    const description = searchParams.get('description');
    
    if (!type) {
      router.push('/project-selection');
      return;
    }

    setProjectType(type);
    if (description) {
      setCustomDescription(description);
    }
  }, [searchParams, router]);

  const handleQuestionnaireComplete = async (answers: Record<string, any>) => {
    setQuestionnaireAnswers(answers);
    
    try {
      // Start SoW generation
      const { jobId, estimatedCompletionTime } = await sowGenerationService.startSoWGeneration(
        {
          projectId,
          projectType: projectType!,
          propertyId: 'temp_property', // Would be from user's property
          userResponses: answers,
          customDescription
        },
        {
          preferredMethod: 'email',
          email: 'user@example.com' // Would be from user profile
        }
      );

      setGenerationJobId(jobId);
      setPhase('generation');
    } catch (error) {
      console.error('Failed to start SoW generation:', error);
      alert('Failed to start SoW generation. Please try again.');
    }
  };

  const handleGenerationComplete = (result: any) => {
    setSowResult(result);
    setPhase('completed');
  };

  const handleCancel = () => {
    router.push('/project-selection');
  };

  const handleStartOver = () => {
    setPhase('questionnaire');
    setGenerationJobId(null);
    setSowResult(null);
    setQuestionnaireAnswers({});
  };

  if (!projectType) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Project Planning
          </h1>
          <p className="text-lg text-gray-600">
            {projectType === 'others' 
              ? 'Custom Project Planning'
              : `${projectType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Planning`
            }
          </p>
        </div>

        {/* Phase Indicator */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-center space-x-5">
              <li className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  phase === 'questionnaire' 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : 'border-green-600 bg-green-600 text-white'
                }`}>
                  {phase === 'questionnaire' ? '1' : '✓'}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">Requirements</span>
              </li>
              
              <div className="flex-1 flex items-center">
                <div className={`h-0.5 w-full ${
                  phase === 'questionnaire' ? 'bg-gray-200' : 'bg-green-600'
                }`}></div>
              </div>
              
              <li className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  phase === 'questionnaire' 
                    ? 'border-gray-300 bg-white text-gray-500'
                    : phase === 'generation'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-green-600 bg-green-600 text-white'
                }`}>
                  {phase === 'questionnaire' ? '2' : phase === 'generation' ? '2' : '✓'}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">Generation</span>
              </li>
              
              <div className="flex-1 flex items-center">
                <div className={`h-0.5 w-full ${
                  phase === 'completed' ? 'bg-green-600' : 'bg-gray-200'
                }`}></div>
              </div>
              
              <li className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  phase === 'completed'
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 bg-white text-gray-500'
                }`}>
                  {phase === 'completed' ? '✓' : '3'}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">Complete</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Content */}
        {phase === 'questionnaire' && (
          <QuestionnaireFlow
            projectId={projectId}
            projectType={projectType}
            customDescription={customDescription}
            onComplete={handleQuestionnaireComplete}
            onCancel={handleCancel}
          />
        )}

        {phase === 'generation' && generationJobId && (
          <SoWGenerationStatus
            jobId={generationJobId}
            onComplete={handleGenerationComplete}
            onCancel={handleCancel}
          />
        )}

        {phase === 'completed' && sowResult && (
          <CompletedSoWView
            sowResult={sowResult}
            projectType={projectType}
            onStartOver={handleStartOver}
            onProceedToBuilders={() => router.push(`/builder-invitation?projectId=${projectId}`)}
          />
        )}
      </div>
    </div>
  );
}

interface CompletedSoWViewProps {
  sowResult: any;
  projectType: ProjectType;
  onStartOver: () => void;
  onProceedToBuilders: () => void;
}

const CompletedSoWView: React.FC<CompletedSoWViewProps> = ({
  sowResult,
  projectType,
  onStartOver,
  onProceedToBuilders
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your Scope of Work is Ready!
          </h2>
          <p className="text-gray-600">
            We've generated a comprehensive project plan with detailed timeline and cost breakdown.
          </p>
        </div>

        {/* SoW Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Estimate</h3>
            <p className="text-2xl font-bold text-blue-700">
              £{sowResult.sowDocument.estimatedCosts.totalEstimate.toLocaleString()}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Including materials and labor
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Timeline</h3>
            <p className="text-2xl font-bold text-green-700">
              {sowResult.ganttChart.totalDuration} days
            </p>
            <p className="text-sm text-green-600 mt-1">
              Estimated completion time
            </p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Sections</h3>
            <p className="text-2xl font-bold text-purple-700">
              {sowResult.sowDocument.sections.length}
            </p>
            <p className="text-sm text-purple-600 mt-1">
              Detailed work sections
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={onProceedToBuilders} size="lg" className="flex-1 sm:flex-none">
            Invite Builders to Quote
          </Button>
          
          <Button onClick={() => {/* Download SoW */}} variant="outline" size="lg">
            Download SoW (PDF)
          </Button>
          
          <Button onClick={onStartOver} variant="outline" size="lg">
            Modify Requirements
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">What's included in your SoW:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Detailed work breakdown with specifications</li>
            <li>• Materials list classified by provider (builder vs homeowner)</li>
            <li>• Labor requirements with person-days calculation</li>
            <li>• Interactive Gantt chart with timeline optimization</li>
            <li>• UK building regulations compliance requirements</li>
            <li>• Cost estimates for materials and labor</li>
          </ul>
        </div>
      </div>
    </div>
  );
};