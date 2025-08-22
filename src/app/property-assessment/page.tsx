'use client';

import React, { useState } from 'react';
import { Property, ProjectType } from '../../lib/types';
import { ComplianceResult } from '../../lib/services/complianceService';
import PropertyAssessmentForm from '../../components/property/PropertyAssessmentForm';
import PropertySummary from '../../components/property/PropertySummary';
import ComplianceChecker from '../../components/property/ComplianceChecker';

type AssessmentStep = 'property_form' | 'project_selection' | 'compliance_check' | 'complete';

export default function PropertyAssessmentPage() {
  const [currentStep, setCurrentStep] = useState<AssessmentStep>('property_form');
  const [property, setProperty] = useState<Property | null>(null);
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | null>(null);
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const projectTypes: { value: ProjectType; label: string; description: string }[] = [
    { value: 'loft_conversion_dormer', label: 'Loft Conversion', description: 'Convert your loft into a habitable room' },
    { value: 'rear_extension_single_storey', label: 'Rear Extension', description: 'Extend the back of your property' },
    { value: 'side_extension_single_storey', label: 'Side Extension', description: 'Extend the side of your property' },
    { value: 'basement_conversion_full', label: 'Basement Conversion', description: 'Convert basement into living space' },
    { value: 'garage_conversion_living_space', label: 'Garage Conversion', description: 'Convert garage into habitable room' },
    { value: 'kitchen_full_refit', label: 'Kitchen Renovation', description: 'Full or partial kitchen refit' },
    { value: 'bathroom_full_refit', label: 'Bathroom Renovation', description: 'Bathroom or en-suite renovation' },
    { value: 'bedroom_master', label: 'Bedroom Renovation', description: 'Bedroom refurbishment or conversion' },
    { value: 'living_room_open_plan', label: 'Living Room Renovation', description: 'Living room or lounge renovation' },
    { value: 'windows_upvc', label: 'Windows & Doors', description: 'Window and door replacement' },
    { value: 'electrical_rewiring', label: 'Electrical Work', description: 'Electrical installation or rewiring' },
    { value: 'plumbing_bathroom', label: 'Plumbing Work', description: 'Plumbing installation or upgrades' },
    { value: 'roofing_re_roofing', label: 'Roofing Work', description: 'Roof repairs or replacement' },
    { value: 'heating_boiler_replacement', label: 'Heating & HVAC', description: 'Heating system installation or upgrade' },
    { value: 'rendering_k_rend', label: 'Rendering & Cladding', description: 'External wall finishes' },
    { value: 'garden_landscaping', label: 'Landscaping & Garden', description: 'Garden design and landscaping' },
    { value: 'driveway_block_paving', label: 'Driveway & Patio', description: 'Driveway or patio installation' },
    { value: 'others', label: 'Other Project', description: 'Other home improvement project' },
  ];

  const handlePropertyAssessed = (assessedProperty: Property) => {
    setProperty(assessedProperty);
    setCurrentStep('project_selection');
    setError(null);
  };

  const handleProjectTypeSelected = (projectType: ProjectType) => {
    setSelectedProjectType(projectType);
    setCurrentStep('compliance_check');
  };

  const handleComplianceChecked = (result: ComplianceResult) => {
    setComplianceResult(result);
    setCurrentStep('complete');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleStartOver = () => {
    setCurrentStep('property_form');
    setProperty(null);
    setSelectedProjectType(null);
    setComplianceResult(null);
    setError(null);
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'property_form', label: 'Property Details' },
      { key: 'project_selection', label: 'Project Type' },
      { key: 'compliance_check', label: 'Compliance Check' },
      { key: 'complete', label: 'Complete' },
    ];

    const currentStepIndex = steps.findIndex(step => step.key === currentStep);

    return (
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index <= currentStepIndex
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {index < currentStepIndex ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  index <= currentStepIndex ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Property Assessment & Compliance Check
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We&apos;ll assess your property and check compliance with UK building regulations 
            to ensure your project meets all legal requirements from the start.
          </p>
        </div>

        {renderStepIndicator()}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
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
          </div>
        )}

        {currentStep === 'property_form' && (
          <PropertyAssessmentForm
            onPropertyAssessed={handlePropertyAssessed}
            onError={handleError}
          />
        )}

        {currentStep === 'project_selection' && property && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <PropertySummary property={property} />
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Your Project Type
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose the type of home improvement project you&apos;re planning. 
                  This will help us check the specific building regulations that apply.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleProjectTypeSelected(type.value)}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900 mb-1">{type.label}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'compliance_check' && property && selectedProjectType && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <PropertySummary property={property} />
              <div className="mt-4 bg-white rounded-lg shadow-md p-4">
                <h4 className="font-medium text-gray-900 mb-2">Selected Project</h4>
                <p className="text-gray-700">
                  {projectTypes.find(p => p.value === selectedProjectType)?.label}
                </p>
              </div>
            </div>
            <div className="lg:col-span-3">
              <ComplianceChecker
                property={property}
                projectType={selectedProjectType}
                onComplianceChecked={handleComplianceChecked}
              />
            </div>
          </div>
        )}

        {currentStep === 'complete' && property && selectedProjectType && complianceResult && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <PropertySummary property={property} showFullDetails />
            </div>
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Assessment Complete
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-green-800">
                        Property assessment and compliance check completed successfully!
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        Your property has been assessed and we&apos;ve identified all applicable building regulations 
                        for your {projectTypes.find(p => p.value === selectedProjectType)?.label.toLowerCase()} project.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">Planning Permission</h5>
                      <p className="text-sm text-gray-600">
                        {complianceResult.planningPermissionRequired ? 'Required for this project' : 'Not required'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      complianceResult.planningPermissionRequired 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {complianceResult.planningPermissionRequired ? 'Required' : 'Not Required'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">Building Control Approval</h5>
                      <p className="text-sm text-gray-600">
                        {complianceResult.buildingControlRequired ? 'Required for this project' : 'Not required'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      complianceResult.buildingControlRequired 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {complianceResult.buildingControlRequired ? 'Required' : 'Not Required'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">Mandatory Regulations</h5>
                      <p className="text-sm text-gray-600">
                        {complianceResult.mandatoryRequirements.length} regulations must be followed
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {complianceResult.mandatoryRequirements.length} Required
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={() => {
                      // In a real app, this would navigate to the next step (AI planning)
                      alert('Ready to proceed with AI-guided project planning!');
                    }}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Proceed to AI Project Planning
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}