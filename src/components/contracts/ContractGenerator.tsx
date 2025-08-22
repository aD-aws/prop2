'use client';

import React, { useState } from 'react';
import { Contract, Quote, SoWDocument, ContractGenerationRequest } from '../../lib/types';
import { contractService } from '../../lib/services/contractService';
import { docuSignService } from '../../lib/services/docusignService';

interface ContractGeneratorProps {
  projectId: string;
  selectedQuote: Quote;
  sowDocument: SoWDocument;
  homeownerId: string;
  builderId: string;
  onContractGenerated: (contract: Contract) => void;
  onError: (error: string) => void;
}

export const ContractGenerator: React.FC<ContractGeneratorProps> = ({
  projectId,
  selectedQuote,
  sowDocument,
  homeownerId,
  builderId,
  onContractGenerated,
  onError
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [meetingCompleted, setMeetingCompleted] = useState(false);
  const [additionalTerms, setAdditionalTerms] = useState('');
  const [showMeetingPrompt, setShowMeetingPrompt] = useState(true);

  const handleGenerateContract = async () => {
    if (!meetingCompleted && showMeetingPrompt) {
      onError('Please confirm that you have met with the builder before generating the contract.');
      return;
    }

    setIsGenerating(true);
    try {
      const contract = await contractService.generateContract(
        projectId,
        selectedQuote,
        sowDocument,
        homeownerId,
        builderId
      );

      onContractGenerated(contract);
    } catch (error) {
      console.error('Error generating contract:', error);
      onError('Failed to generate contract. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMeetingConfirmation = () => {
    setMeetingCompleted(true);
    setShowMeetingPrompt(false);
  };

  if (showMeetingPrompt) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Meet Before Contract
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                Important: Meet Your Builder First
              </h4>
              <p className="mt-1 text-sm text-blue-700">
                We strongly recommend meeting with your selected builder at the property before signing any contract. 
                This allows you to verify their credentials, discuss the project in detail, and ensure you're comfortable 
                with your choice.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">During your meeting, please verify:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Builder's identification and credentials</li>
              <li>• Insurance documentation (public liability, employer's liability)</li>
              <li>• Companies House registration details</li>
              <li>• Reference projects and previous work quality</li>
              <li>• Project timeline and start date feasibility</li>
              <li>• Any questions about the scope of work</li>
            </ul>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="meetingCompleted"
              checked={meetingCompleted}
              onChange={(e) => setMeetingCompleted(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="meetingCompleted" className="text-sm text-gray-700">
              I have met with the builder and verified their credentials
            </label>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleMeetingConfirmation}
              disabled={!meetingCompleted}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                meetingCompleted
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Proceed to Contract Generation
            </button>
            <button
              onClick={() => setShowMeetingPrompt(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Skip (Not Recommended)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Generate Contract
      </h3>

      <div className="space-y-6">
        {/* Contract Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Contract Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Project Type:</span>
              <span className="ml-2 font-medium">{sowDocument.projectType}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Amount:</span>
              <span className="ml-2 font-medium">£{selectedQuote.pricing.totalAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Timeline:</span>
              <span className="ml-2 font-medium">{selectedQuote.timeline} working days</span>
            </div>
            <div>
              <span className="text-gray-600">Start Date:</span>
              <span className="ml-2 font-medium">{selectedQuote.startDate.toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        </div>

        {/* Additional Terms */}
        <div>
          <label htmlFor="additionalTerms" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Terms (Optional)
          </label>
          <textarea
            id="additionalTerms"
            value={additionalTerms}
            onChange={(e) => setAdditionalTerms(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add any additional terms or conditions specific to this project..."
          />
        </div>

        {/* Compliance Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">
                UK Building Regulations Compliance
              </h4>
              <p className="mt-1 text-sm text-green-700">
                This contract will be generated with full compliance to UK Building Regulations and industry standards, 
                ensuring unambiguous terms and specifications.
              </p>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <button
            onClick={handleGenerateContract}
            disabled={isGenerating}
            className={`px-6 py-2 rounded-md text-sm font-medium ${
              isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isGenerating ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Contract...
              </div>
            ) : (
              'Generate Contract'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};